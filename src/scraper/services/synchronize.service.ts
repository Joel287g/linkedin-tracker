//? Imports de codigo
import { join } from "path";
import { chromium } from "playwright";
import { Injectable, Logger } from "@nestjs/common";

//? Imports de usuario
import { ScraperListPageService } from "./list-page.service";
import { ScraperJobDetailsService } from "./job-details.service";
import { ScraperPersistenceService } from "./persistence.service";

import {
  JobApplication,
  SyncOptions,
} from "../../applications/domain/interfaces/job-application.interface";

@Injectable()
export class ScraperSynchronizeService {
  constructor(
    private readonly listPageService: ScraperListPageService,
    private readonly jobDetailsService: ScraperJobDetailsService,
    private readonly persistenceService: ScraperPersistenceService,
  ) {}

  private readonly logger = new Logger(this.constructor.name);

  //? Configuración del motor de sincronización
  private readonly CONFIG = {
    userDataDir: join(process.cwd(), ".linkedin_session"),
    paginationStep: 10,
    maxPages: 50,
    delays: {
      betweenItems: () => Math.random() * 2000 + 1000,
      betweenPages: 3000,
    },
  };

  /**
   ** Orquestador con soporte para paginación dinámica y límites.
   * @param options Parámetros opcionales para controlar la extracción
   */
  async runSync(options: SyncOptions = {}): Promise<JobApplication[]> {
    const { startPage = 1, limit = 50 } = options;
    let currentPointer = (startPage - 1) * this.CONFIG.paginationStep;

    this.logger.log(
      `🚀 Iniciando extracción: Página ${startPage}, Límite: ${limit} docs.`,
    );

    //* 1. Obtener IDs existentes y guardarlos en un Set para búsqueda instantánea
    const existingIdsArray = await this.persistenceService.getAllJobIds();
    const existingIds = new Set(existingIdsArray);
    this.logger.log(
      `Memoria: ${existingIds.size} vacantes ya registradas omitidas de antemano.`,
    );

    const context = await chromium.launchPersistentContext(
      this.CONFIG.userDataDir,
      {
        args: ["--disable-blink-features=AutomationControlled"],
        headless: false,
      },
    );

    const page = await context.newPage();

    try {
      let hasMoreData = true;
      const allExtractedApplications: JobApplication[] = [];

      while (hasMoreData) {
        this.logger.log(`Consultando LinkedIn start=${currentPointer}`);

        const pageItems = await this.listPageService.scrapeListPage(
          page,
          currentPointer,
        );

        if (pageItems.length === 0) {
          this.logger.log("No hay más datos. Finalizando.");
          break;
        }

        //* 2. FILTRADO INTELIGENTE: Solo procesamos lo que NO está en el Set
        const newItems = pageItems.filter(
          (item) => !existingIds.has(item.jobId),
        );

        const skippedCount = pageItems.length - newItems.length;
        if (skippedCount > 0) {
          this.logger.debug(
            `⏭️ Saltando ${skippedCount} items ya existentes en esta página.`,
          );
        }

        for (const item of newItems) {
          if (allExtractedApplications.length >= limit) {
            this.logger.warn(`✅ Límite de ${limit} documentos alcanzado.`);
            hasMoreData = false;
            break;
          }

          try {
            const fullDetail =
              await this.jobDetailsService.enrichWithJobDetails(page, item);

            //* PERSISTENCIA EN TIEMPO REAL
            await this.persistenceService.createJobApplication(
              fullDetail as JobApplication,
            );

            allExtractedApplications.push(fullDetail as JobApplication);

            //* 3. Actualizar el Set local para evitar duplicados en la misma ejecución
            existingIds.add(item.jobId);

            this.logger.log(
              `[${allExtractedApplications.length}/${limit}] Extraído: ${fullDetail.title}`,
            );

            await new Promise((r) =>
              setTimeout(r, this.CONFIG.delays.betweenItems()),
            );
          } catch (itemError) {
            this.logger.error(
              `❌ Error en item ${item.jobId}: ${itemError.message}`,
            );
            continue;
          }
        }

        if (!hasMoreData) break;
        currentPointer += this.CONFIG.paginationStep;

        if (currentPointer >= 100) hasMoreData = false;
      }

      await context.close();
      return allExtractedApplications;
    } catch (criticalError) {
      this.logger.error(`🔥 Fallo crítico: ${criticalError.message}`);
      await context.close();
      throw criticalError;
    }
  }
}
