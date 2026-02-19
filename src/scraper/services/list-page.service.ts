//? Imports de NestJS y herramientas de scraping
import { Injectable, Logger } from "@nestjs/common";
import { Page } from "playwright";

//? Importación de la interfaz para la información básica de los empleos
import { JobBasicInfo } from "src/applications/domain/interfaces/job-application.interface";


@Injectable()
export class ScraperListPageService {
  private readonly logger = new Logger(this.constructor.name);
  
  //? Configuración de URLs y Selectores
  private readonly BASE_URL = "https://www.linkedin.com/my-items/saved-jobs/";
  
  private readonly SELECTORS = {
    resultContainer: '[data-view-name="search-entity-result-universal-template"]',
    listItems: "ul.list-style-none > li, .YvsNMObYucYBAKiwsymTZMosLkqPOJmSccg > li",
    titleAnchor: ".entity-result__title a, a[data-test-app-aware-link]",
    titleSpan: ".t-roman.t-sans span span",
    company: ".entity-result__primary-subtitle, .TAsbpIWNZOQRGHLEWpuyrlheaGjwTzGcVkwg",
    urnAttribute: "data-chameleon-result-urn"
  };

  /**
   ** Navega y extrae la lista básica de empleos guardados.
   * @param page Instancia de la página de Playwright
   * @param start Punto de inicio para la paginación (de 10 en 10)
   */
  async scrapeListPage(page: Page, start: number): Promise<JobBasicInfo[]> {
    const url = `${this.BASE_URL}?start=${start}`;
    
    //? Intento de navegación a la página de listado
    try {
      await page.goto(url, { waitUntil: "commit" });

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