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
    //document.querySelector("")
    company:
      "body > div.application-outlet > div.authentication-outlet > div > main > section > div > div > div > ul > li > div > div > div > div.qSUjkRSKWRifsnRGzuNCrFVVExnLrkcM.SSGAkMtVUTWiucLzBYRvBFcTXJGgiDvYM.pt3.pb3.t-12.t-black--light > div.mb1 > div.yCnUSBgeheryesBfyITTAwskKIazHCbjusk.t-14.t-black.t-normal",

    //? Selector para la ubicación (a veces está en el mismo campo que la empresa)
    location:
      "body > div.application-outlet > div.authentication-outlet > div > main > section > div > div > div > ul > li > div > div > div > div.qSUjkRSKWRifsnRGzuNCrFVVExnLrkcM.SSGAkMtVUTWiucLzBYRvBFcTXJGgiDvYM.pt3.pb3.t-12.t-black--light > div.mb1 > div.YwabAxRlipFmdhzjIYQGgyoNZIvBVSDwiAVo.t-14.t-normal",
  };

  private readonly SELECTORS_IA = {
    //? Contenedor principal de cada tarjeta de empleo en la lista
    resultContainer:
      "#workspace > div > div > div > div > div._3b61fc0d > div > div > div._72a29cf0.c9b59583._610791f8.be6de7df._64029ed9._585b7d31._1ee6e656.f99f1ae0.cbdb6717.b44974d0._94a82bb0._239ac6f5._2eeaf4c3 > div > div._72a29cf0.be6de7df._64029ed9._585b7d31._1ee6e656.f99f1ae0.cbdb6717._94a82bb0._548a48e2.d29dec2a._11a9bff5.ec4b97a4 > div._72a29cf0.be6de7df._64029ed9._585b7d31._1ee6e656.f99f1ae0.cbdb6717",

    //? Los items ahora son divs dentro del contenedor principal
    listItems:
      "#workspace > div > div > div > div > div._3b61fc0d > div > div > div._72a29cf0.c9b59583._610791f8.be6de7df._64029ed9._585b7d31._1ee6e656.f99f1ae0.cbdb6717.b44974d0._94a82bb0._239ac6f5._2eeaf4c3 > div > div._72a29cf0.be6de7df._64029ed9._585b7d31._1ee6e656.f99f1ae0.cbdb6717._94a82bb0._548a48e2.d29dec2a._11a9bff5.ec4b97a4 > div._72a29cf0.be6de7df._64029ed9._585b7d31._1ee6e656.f99f1ae0.cbdb6717 > div",

    //? Selector específico para el título basado en tu querySelector
    titleAnchor:
      "#workspace > div > div > div > div > div._3b61fc0d > div > div > div._72a29cf0.c9b59583._610791f8.be6de7df._64029ed9._585b7d31._1ee6e656.f99f1ae0.cbdb6717.b44974d0._94a82bb0._239ac6f5._2eeaf4c3 > div > div._72a29cf0.be6de7df._64029ed9._585b7d31._1ee6e656.f99f1ae0.cbdb6717._94a82bb0._548a48e2.d29dec2a._11a9bff5.ec4b97a4 > div._72a29cf0.be6de7df._64029ed9._585b7d31._1ee6e656.f99f1ae0.cbdb6717 > div > div._34b4c8e3._1a39b08d.be6de7df._3639b718._585b7d31._12e91934.f99f1ae0.cbdb6717 > div > a",

    //? El párrafo que contiene el nombre del empleo
    titleSpan:
      "#workspace > div > div > div > div > div._3b61fc0d > div > div > div._72a29cf0.c9b59583._610791f8.be6de7df._64029ed9._585b7d31._1ee6e656.f99f1ae0.cbdb6717.b44974d0._94a82bb0._239ac6f5._2eeaf4c3 > div > div._72a29cf0.be6de7df._64029ed9._585b7d31._1ee6e656.f99f1ae0.cbdb6717._94a82bb0._548a48e2.d29dec2a._11a9bff5.ec4b97a4 > div._72a29cf0.be6de7df._64029ed9._585b7d31._1ee6e656.f99f1ae0.cbdb6717 > div > div._34b4c8e3._1a39b08d.be6de7df._3639b718._585b7d31._12e91934.f99f1ae0.cbdb6717 > div > a > div > div > p._38df260a._2ef9145d._52d76f7b._0bb93b49.fe9c0fa3._1843f717._7f44e616.fac80ba8._3607329d",

    //? Selector para la empresa (el subtítulo primario)
    company:
      "#workspace > div > div > div > div > div._3b61fc0d > div > div > div._72a29cf0.c9b59583._610791f8.be6de7df._64029ed9._585b7d31._1ee6e656.f99f1ae0.cbdb6717.b44974d0._94a82bb0._239ac6f5._2eeaf4c3 > div > div._72a29cf0.be6de7df._64029ed9._585b7d31._1ee6e656.f99f1ae0.cbdb6717._94a82bb0._548a48e2.d29dec2a._11a9bff5.ec4b97a4 > div._72a29cf0.be6de7df._64029ed9._585b7d31._1ee6e656.f99f1ae0.cbdb6717 > div > div._34b4c8e3._1a39b08d.be6de7df._3639b718._585b7d31._12e91934.f99f1ae0.cbdb6717 > div > a > div > div > p._38df260a._5af038a6._52d76f7b._0bb93b49._227636e9._1843f717._7f44e616.fac80ba8._3607329d",

    //? Selector para la ubicación (a veces está en el mismo campo que la empresa)
    location: "null",
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
            const locationEl = item.querySelector(
              selector.location,
            ) as HTMLElement;

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
