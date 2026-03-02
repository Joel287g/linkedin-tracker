//? Imports de NestJS y herramientas de scraping
import { Page } from "playwright";

import { Injectable, Logger } from "@nestjs/common";

//? Importación de la interfaz para la información básica de los empleos
import { JobBasicInfo } from "src/applications/domain/interfaces";

@Injectable()
export class ScraperListPageService {
  private readonly logger = new Logger(this.constructor.name);

  //? Configuración de URLs y Selectores
  private readonly BASE_URL = "https://www.linkedin.com/my-items/saved-jobs/";
  private readonly BASE_URL_IA =
    "https://www.linkedin.com/jobs-tracker?stage=applied";

  private readonly SELECTORS = {
    //? Contenedor principal de cada tarjeta de empleo en la lista
    resultContainer:
      '[data-view-name="search-entity-result-universal-template"]',

    //? Los items ahora son divs dentro del contenedor principal
    listItems:
      "ul.list-style-none > li, .YvsNMObYucYBAKiwsymTZMosLkqPOJmSccg > li",

    //? Selector específico para el título basado en tu querySelector
    titleAnchor: ".entity-result__title a, a[data-test-app-aware-link]",

    //? El párrafo que contiene el nombre del empleo
    titleSpan: ".t-roman.t-sans span span",

    //? Selector para la empresa (el subtítulo primario)
    company:
      ".job-details-jobs-unified-top-card__company-name, .t-14.t-black.t-normal",
  };

  private readonly SELECTORS_IA = {
    //? Contenedor principal de cada tarjeta de empleo en la lista
    resultContainer: "null",

    //? Los items ahora son divs dentro del contenedor principal
    listItems: "null",

    //? Selector específico para el título basado en tu querySelector
    titleAnchor: "null",

    //? El párrafo que contiene el nombre del empleo
    titleSpan: "null",

    //? Selector para la empresa (el subtítulo primario)
    company: "null",
  };

  /**
   ** Navega y extrae la lista básica de empleos guardados.
   * @param page Instancia de la página de Playwright
   */
  async scrapeListPage(page: Page, start: number): Promise<JobBasicInfo[]> {
    const url = `${this.BASE_URL}`;
    let SELECTORS = this.SELECTORS;

    //* Preparación y navegación a la página de listado
    try {
      //? Navegamos a la página de listado de empleos
      await page.goto(`${url}?start=${start}`, { waitUntil: "commit" });

      //? Verificación de la URL para determinar si estamos en la vista IA o clásica
      const isIA: boolean = page.url().includes("jobs-tracker");
      SELECTORS = isIA ? this.SELECTORS_IA : this.SELECTORS;

      this.logger.log(
        `Navegado a ${isIA ? "vista IA" : "vista clásica"}: ${page.url()}`,
      );

      //? Espera a que los contenedores de las tarjetas de empleo sean visibles
      await page.waitForSelector(SELECTORS.resultContainer, {
        state: "visible",
        timeout: 10000,
      });

      //? Scroll táctico para disparar el Lazy Loading de las imágenes y datos de la lista
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(1000);
    } catch (error) {
      this.logger.error(error.message);
      return [];
    }

    //* Extracción de datos en el contexto del navegador
    try {
      return await page
        .evaluate((selector) => {
          const listItems = Array.from(
            document.querySelectorAll(selector.listItems),
          );

          return listItems.map((item) => {
            //? Extracción de datos usando los selectores específicos
            const titleAnchor = item.querySelector(
              selector.titleAnchor,
            ) as HTMLAnchorElement;
            const titleSpan = item.querySelector(
              selector.titleSpan,
            ) as HTMLElement;
            const companyEl = item.querySelector(
              selector.company,
            ) as HTMLElement;
            const locationEl = companyEl.nextElementSibling as HTMLElement;

            //? Procesamiento de los datos para obtener la información estructurada
            const link = titleAnchor?.href?.split("?")[0] || "Sin enlace";

            const jobId =
              link
                .split("/")
                .reverse()
                .filter((data) => data)[0] || "Sin ID";

            const title = (
              titleSpan?.innerText ||
              titleAnchor?.innerText ||
              "Sin título"
            )
              .split("\n")[0]
              .replace(/, Verificado/g, "")
              .trim();

            let company = companyEl?.innerText?.trim() || "Sin empresa";

            let location = locationEl?.innerText?.trim() || "Sin ubicación";

            const workMode = location.toLowerCase().includes("remoto")
              ? "Remoto"
              : location.toLowerCase().includes("híbrido")
                ? "Híbrido"
                : "Presencial";

            location = location.split("(")[0]?.trim() || location;

            //? Retornamos un objeto con la información básica del empleo
            return {
              jobId,
              title,
              company,
              location,
              workMode,
              link,
            };
          });
        }, SELECTORS)
        .catch((error) => {
          this.logger.error(
            "Error al extraer datos de la página de lista:",
            error,
          );
          return [];
        });
    } catch (error) {
      this.logger.error(error);
      return [];
    }
  }
}
