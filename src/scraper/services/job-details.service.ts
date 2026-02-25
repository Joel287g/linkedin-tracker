//? Imports de NestJS y herramientas de scraping
import { Injectable, Logger } from "@nestjs/common";
import { Page } from "playwright";
import {
  ApplicationStatusHistory,
  JobApplication,
  JobBasicInfo,
} from "src/applications/domain/interfaces/job-application.interface";

@Injectable()
export class ScraperJobDetailsService {
  private readonly logger = new Logger(this.constructor.name);

  //? Selectores actualizados con el path verificado
  private readonly SELECTORS = {
    //? Contenedor principal de la pagina
    workspace: "#workspace",

    description:
      "#workspace > div > div > div._1ba2e6ec.e70a0cce.f9a85e8c > div > div > div > div._23a2cc5c._118fa997._3b272d15._1f3c8209.a9262e33._01272bb7._80539d05 > div:nth-child(3) > div > div > div > div > div > div > p",

    //? Selectores para la información del reclutador (si está disponible)
    recruiterName:
      "#workspace > div > div > div._1ba2e6ec.e70a0cce.f9a85e8c > div > div > div > div._23a2cc5c._118fa997._3b272d15._1f3c8209.a9262e33._01272bb7._80539d05 > div:nth-child(2) > div > div > div > div > div > div > a > div > div > div._118fa997._2aed755f._1f3c8209.c52ca965._025b7248._33dcc58f > div > p > a",
    recruiterHeadline:
      "#workspace > div > div > div._1ba2e6ec.e70a0cce.f9a85e8c > div > div > div > div._23a2cc5c._118fa997._3b272d15._1f3c8209.a9262e33._01272bb7._80539d05 > div:nth-child(2) > div > div > div > div > div > div > a > div > div > div.a02a0828._924e6326.e7df08c4.e766e6a3._68023ca4._0bdf4b7c._784eab0a > p",

    //? Selectores para el historial de aplicaciones (si está disponible)
    statusListContainer:
      "#workspace > div > div > div._1ba2e6ec.e70a0cce.f9a85e8c > div > div > div > div._23a2cc5c._118fa997._3b272d15._1f3c8209.a9262e33._01272bb7._80539d05 > div._23a2cc5c._118fa997._3b272d15._1f3c8209.a9262e33._01272bb7._33dcc58f > div > div > div",
  };

  private readonly SELECTORS_IA = {
    //? Contenedor principal de la pagina
    workspace: "#workspace",

    description:
      "#workspace > div > div > div._1ba2e6ec.e70a0cce.f9a85e8c > div > div > div > div._23a2cc5c._118fa997._3b272d15._1f3c8209.a9262e33._01272bb7._80539d05 > div:nth-child(3) > div > div > div > div > div > div > p",

    //? Selectores para la información del reclutador (si está disponible)
    recruiterName:
      "#workspace > div > div > div._1ba2e6ec.e70a0cce.f9a85e8c > div > div > div > div._23a2cc5c._118fa997._3b272d15._1f3c8209.a9262e33._01272bb7._80539d05 > div:nth-child(2) > div > div > div > div > div > div > a > div > div > div._118fa997._2aed755f._1f3c8209.c52ca965._025b7248._33dcc58f > div > p > a",
    recruiterHeadline:
      "#workspace > div > div > div._1ba2e6ec.e70a0cce.f9a85e8c > div > div > div > div._23a2cc5c._118fa997._3b272d15._1f3c8209.a9262e33._01272bb7._80539d05 > div:nth-child(2) > div > div > div > div > div > div > a > div > div > div.a02a0828._924e6326.e7df08c4.e766e6a3._68023ca4._0bdf4b7c._784eab0a > p",

    //? Selectores para el historial de aplicaciones (si está disponible)
    statusListContainer:
      "#workspace > div > div > div._1ba2e6ec.e70a0cce.f9a85e8c > div > div > div > div._23a2cc5c._118fa997._3b272d15._1f3c8209.a9262e33._01272bb7._80539d05 > div._23a2cc5c._118fa997._3b272d15._1f3c8209.a9262e33._01272bb7._33dcc58f > div > div > div",
  };

  async enrichWithJobDetails(page: Page, item: JobBasicInfo) {
    let SELECTORS = this.SELECTORS;

    //* Preparación y navegación a la página de detalles del empleo
    try {
      //? Navegamos a la página de detalles del empleo
      await page.goto(item.link, { waitUntil: "commit" });

      //? Verificación de la URL para determinar si estamos en la vista IA o clásica
      const isIA: boolean = page.url().includes("jobs-tracker");
      SELECTORS = isIA ? this.SELECTORS_IA : this.SELECTORS;

      this.logger.log(
        `Navegado a ${isIA ? "vista IA" : "vista clásica"}: ${page.url()}`,
      );

      //? Espera a que los contenedores de las tarjetas de empleo sean visibles
      await page.waitForSelector(SELECTORS.workspace, {
        state: "visible",
        timeout: 10000,
      });

      //? Scroll táctico para disparar el Lazy Loading de las imágenes y datos de la lista
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(1000);
    } catch (error) {
      this.logger.error(error.message);
      return { ...item };
    }

    //* Extracción de detalles adicionales desde la página de detalles del empleo
    try {
      const details = await page.evaluate((selector) => {
        //? Extracción de datos usando los selectores específicos
        let descriptionEl = document.querySelector(
          selector.description,
        ) as HTMLElement;

        const recruiterNameEl = document.querySelector(
          selector.recruiterName,
        ) as HTMLElement;

        const recruiterHeadlineEl = document.querySelector(
          selector.recruiterHeadline,
        ) as HTMLElement;

        const requirementsEl = Array.from(document.querySelectorAll("p")).find(
          (p) =>
            p.innerText
              .trim()
              .toLowerCase()
              .includes("requisitos añadidos por el anunciante del empleo"),
        ) as HTMLElement;

        const statusListContainer = document.querySelector(
          selector.statusListContainer,
        ) as HTMLElement;

        const listItems = Array.from(
          statusListContainer.querySelectorAll("li"),
        ) as HTMLElement[];

        //? Procesamiento de los datos para obtener la información estructurada
        const description = descriptionEl
          ? descriptionEl.innerText.trim()
          : "Descripción no disponible";

        const recruiterName = recruiterNameEl
          ? recruiterNameEl.innerText.trim()
          : "Reclutador no disponible";

        const recruiterHeadline = recruiterHeadlineEl
          ? recruiterHeadlineEl.innerText.trim()
          : "Cargo no disponible";

        const recruiterProfileLink = recruiterNameEl
          ? recruiterNameEl.getAttribute("href")
          : "Enlace no disponible";

        const requirements: string[] = [];

        if (requirementsEl && requirementsEl !== null) {
          let requirement = requirementsEl.nextElementSibling;
          while (
            requirement &&
            requirement.tagName === "P" &&
            requirement.textContent?.trim().startsWith("•")
          ) {
            requirements.push(requirement.textContent.slice(1).trim());
            requirement = requirement.nextElementSibling;
          }
        }

        const recruiter = {
          name: recruiterName,
          headline: recruiterHeadline,
          profileLink: recruiterProfileLink,
        };

        const applicationHistory = new Array<ApplicationStatusHistory>();

        listItems.forEach((item) => {
          const paragraphs = item.querySelectorAll("p");

          const statusTitle =
            paragraphs[0]?.innerText.trim() || "Estado desconocido";
          const statusDate =
            paragraphs[1]?.innerText.trim() || "Fecha desconocida";

          applicationHistory.push({
            statusTitle,
            statusDate,
          });
        });

        const status =
          applicationHistory.length > 0
            ? applicationHistory[0].statusTitle
            : "Sincronizado";

        return {
          description,
          requirements,
          recruiter,
          applicationHistory,
          status,
          scrapedAt: new Date().toISOString(),
        };
      }, this.SELECTORS);

      return { ...item, ...details };
    } catch (error) {
      this.logger.error(error);
      return { ...item };
    }
  }
}
