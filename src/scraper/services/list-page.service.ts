//? Imports de NestJS y herramientas de scraping
import { Injectable, Logger } from "@nestjs/common";
import { Page } from "playwright";

//? Importación de la interfaz para la información básica de los empleos
import { JobBasicInfo } from "src/applications/domain/interfaces/job-application.interface";


@Injectable()
export class ScraperListPageService {
  private readonly logger = new Logger(this.constructor.name);
  
  //? Configuración de URLs y Selectores
  private readonly BASE_URL = "https://www.linkedin.com/jobs-tracker?stage=applied";
  
  private readonly SELECTORS = {
    //? Contenedor principal de cada tarjeta de empleo en la lista
    resultContainer: 'div[data-view-name="opportunity-tracker-job-list"], .scaffold-layout__list',
    
    //? Los items ahora son divs dentro del contenedor principal
    listItems: 'div[data-view-name="opportunity-tracker-job-card"]',
    
    //? Selector específico para el título basado en tu querySelector
    titleAnchor: 'a[data-test-app-aware-link]',
    titleSpan: 'p.ff44be0a', //? El párrafo que contiene el nombre del empleo
    
    //? Selector para la empresa (el subtítulo primario)
    company: 'p.c2dd7318', 
    
    //? Atributo para identificar la oferta única
    urnAttribute: 'data-job-id' 
};

  /**
   ** Navega y extrae la lista básica de empleos guardados.
   * @param page Instancia de la página de Playwright
   * @param start Punto de inicio para la paginación (de 10 en 10)
   */
  async scrapeListPage(page: Page, start: number): Promise<JobBasicInfo[]> {
    const url = `${this.BASE_URL}`;
    
    //? Intento de navegación a la página de listado
    try {
      await page.goto(url, { waitUntil: "commit" });

      this.logger.log(`Navegando a la página de empleos guardados: ${url}`);

      //* Espera a que los contenedores de las tarjetas de empleo sean visibles
      await page.waitForSelector(this.SELECTORS.resultContainer, {
        state: "visible",
        timeout: 10000,
      });
    } catch (error) {
      this.logger.warn(`No se encontraron más resultados o tiempo de espera agotado en start=${start}`);
      this.logger.error(error.message);
      return [];
    }

    //* Scroll táctico para disparar el Lazy Loading de las imágenes y datos de la lista
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(1000);

    //? Extracción de datos en el contexto del navegador
    const results = await page.evaluate((s) => {
      const listItems = Array.from(document.querySelectorAll(s.listItems));

      return listItems.map((li) => {
        const container = li.querySelector(s.resultContainer);
        const urn = container?.getAttribute(s.urnAttribute) || "";
        
        const titleAnchor = li.querySelector(s.titleAnchor) as HTMLAnchorElement;
        const titleSpan = li.querySelector(s.titleSpan) as HTMLElement;
        const companyEl = li.querySelector(s.company) as HTMLElement;

        //? Limpieza de títulos (Elimina saltos de línea y sufijos de LinkedIn)
        const cleanTitle = (titleSpan?.innerText || titleAnchor?.innerText || "Sin título")
          .split("\n")[0]
          .replace(/, Verificado/g, "")
          .trim();

        return {
          jobId: urn.split(":").pop() || `temp_${Math.random().toString(36).substr(2, 9)}`,
          title: cleanTitle,
          company: companyEl?.innerText?.trim() || "Sin empresa",
          link: titleAnchor?.href?.split("?")[0] || "Sin enlace",
        };
      });
    }, this.SELECTORS);

    this.logger.log(`Página start=${start}: se detectaron ${results.length} posibles vacantes.`);
    return results;
  }
}