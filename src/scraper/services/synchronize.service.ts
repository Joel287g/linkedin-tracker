//? Imports de codigo
import { join } from "path";
import { BrowserContext, chromium, Page } from "playwright";
import { Injectable, Logger } from "@nestjs/common";

//? Imports de usuario
import { ScraperListPageService } from "./list-page.service";
import { ScraperJobDetailsService } from "./job-details.service";
import { ScraperPersistenceService } from "./persistence.service";

import {
  JobApplication,
  SyncOptions,
} from "../../applications/domain/interfaces";

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
  async runSync({ startPage = 1, limit = 10 }: SyncOptions = {}): Promise<
    JobApplication[]
  > {
    //* Variables
    let currentPointer = (startPage - 1) * this.CONFIG.paginationStep;
    let page: Page;
    let context: BrowserContext;
    let existingIds: JobApplication["jobId"][] = [];
    let hasMoreData = true;
    const allExtractedApplications: JobApplication[] = [];

    this.logger.log(
      `🚀 Iniciando extracción: Página ${startPage}, Límite: ${limit} docs.`,
    );

    //* 1. Obtener IDs existentes y guardarlos en un Set para búsqueda instantánea
    try {
      existingIds = await this.persistenceService.getAllJobIds();
      this.logger.log(
        `Memoria: ${existingIds.length} vacantes ya registradas omitidas de antemano.`,
      );

      context = await chromium.launchPersistentContext(
        this.CONFIG.userDataDir,
        {
          args: ["--disable-blink-features=AutomationControlled"],
          headless: false,
        },
      );

      page = await context.newPage();
    } catch (error) {
      this.logger.error(`Error al inicializar el navegador: ${error.message}`);
      throw error;
    }

    //* 2. Loop principal de paginación y extracción con control de límite global
    try {
      while (hasMoreData) {
        //? Verificación de límite global antes de procesar cada item
        if (allExtractedApplications.length >= limit) {
          this.logger.warn(`✅ Límite de ${limit} documentos alcanzado.`);
          hasMoreData = false;
          break;
        }

        //? Navegamos a la página para extraer la lista de empleos
        const items = await this.listPageService.scrapeListPage(
          page,
          currentPointer,
        );

        //? Si no hay items, asumimos que no hay más datos para paginar
        if (items.length === 0) {
          this.logger.log("No hay más datos. Finalizando.");
          break;
        }

        //* 3. Loop secundario de cada pagina
        for (const item of items) {
          try {
            const jobDetails =
              (await this.jobDetailsService.enrichWithJobDetails(
                page,
                item,
              )) as JobApplication;

            //? Guardar en DB
            await this.persistenceService.createJobApplication(jobDetails);

            //? Actualizar el Set local para evitar duplicados en la misma ejecución
            existingIds.push(item.jobId);

            allExtractedApplications.push(jobDetails);

            this.logger.log(
              `[${allExtractedApplications.length}/${limit}] Extraído: ${jobDetails.title}`,
            );

            //? Se aplica un delay entre cada item para simular comportamiento humano y evitar bloqueos
            await new Promise((result) =>
              setTimeout(result, this.CONFIG.delays.betweenItems()),
            );
          } catch (error) {
            this.logger.error(error.message);
            continue;
          }
        }

        //? Si ya no se extrajeron items o se alcanzó el límite, no intentamos paginar
        if (!hasMoreData) break;

        //? Avanzamos el puntero para la siguiente página
        currentPointer += this.CONFIG.paginationStep;

        //? Si el puntero supera el límite de paginación configurado, detenemos la extracción
        if (currentPointer >= this.CONFIG.maxPages) hasMoreData = false;
      }

      await context.close();
      return allExtractedApplications;
    } catch (error) {
      this.logger.error(error.message);
      await context.close();
      throw error;
    }
  }
}
