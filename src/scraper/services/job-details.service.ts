//? Imports de NestJS y herramientas de scraping
import { Page } from "playwright";

import { Injectable, Logger } from "@nestjs/common";

//? Imports de usuario
import { JobBasicInfo } from "src/applications/domain/interfaces";
import { ApplicationStatusHistory } from "src/applications/infrastructure/persistence/schemas";

@Injectable()
export class ScraperJobDetailsService {
  private readonly logger = new Logger(this.constructor.name);

  //? Selectores actualizados con el path verificado
  private readonly SELECTORS = {
    //? Contenedor principal de la pagina
    workspace: "#workspace",

    description: "#job-details, [data-testid='expandable-text-box']",

    //? Selectores para la información del reclutador (si está disponible)
    recruiterName:
      "#workspace > div > div > div._1ba2e6ec.e70a0cce.f9a85e8c > div > div > div > div._23a2cc5c._118fa997._3b272d15._1f3c8209.a9262e33._01272bb7._80539d05 > div:nth-child(2) > div > div > div > div > div > div > a > div > div > div._118fa997._2aed755f._1f3c8209.c52ca965._025b7248._33dcc58f > div > p > a",
    recruiterHeadline:
      "#workspace > div > div > div._1ba2e6ec.e70a0cce.f9a85e8c > div > div > div > div._23a2cc5c._118fa997._3b272d15._1f3c8209.a9262e33._01272bb7._80539d05 > div:nth-child(2) > div > div > div > div > div > div > a > div > div > div.a02a0828._924e6326.e7df08c4.e766e6a3._68023ca4._0bdf4b7c._784eab0a > p",

    //? Selectores para el historial de aplicaciones (si está disponible)
    statusListContainer:
      ".jobs-application-status-v2__list-container, section.artdeco-card:has(h2)",
  };

  private readonly SELECTORS_IA = {
    //? Contenedor principal de la pagina
    workspace: "null",

    description: "null",

    //? Selectores para la información del reclutador (si está disponible)
    recruiterName: "null",
    recruiterHeadline: "null",

    //? Selectores para el historial de aplicaciones (si está disponible)
    statusListContainer: "null",
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
      await page
        .waitForSelector(SELECTORS.workspace, {
          state: "visible",
          timeout: 10000,
        })
        .finally(() => {
          page.waitForTimeout(1000);
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

        const requirementsEl = Array.from(document.querySelectorAll("p")).find(
          (p) =>
            p.innerText
              .trim()
              .toLowerCase()
              .includes("requisitos añadidos por el anunciante del empleo"),
        ) as HTMLElement;

        const stateOfJobApplicationEl = Array.from(
          document.querySelectorAll("h2"),
        ).find((h2) =>
          h2.innerText.trim().toLowerCase().includes("estado de la solicitud"),
        ) as HTMLElement;

        const recruiterInfoEl = Array.from(document.querySelectorAll("p")).find(
          (p) =>
            p.innerText.trim().toLowerCase().includes("anunciante del empleo"),
        ) as HTMLElement;

        let previousDiv = recruiterInfoEl?.previousElementSibling;
        let previousDiv2 = previousDiv?.previousElementSibling;

        let recruiterNameEl: HTMLElement | null = null;
        let recruiterHeadlineEl: HTMLElement | null = null;

        if (previousDiv) {
          recruiterHeadlineEl = previousDiv.querySelector("p") as HTMLElement;

          if (previousDiv2) {
            recruiterNameEl = previousDiv2.querySelector("a") as HTMLElement;
          }
        }

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

        if (stateOfJobApplicationEl) {
          const container =
            stateOfJobApplicationEl.closest("div")?.parentElement;

          if (container) {
            const statusParagraphs = Array.from(
              container.querySelectorAll("p"),
            ) as HTMLElement[];

            for (let i = 0; i < statusParagraphs.length; i += 2) {
              const status = statusParagraphs[i]?.innerText.trim();
              const date = statusParagraphs[i + 1]?.innerText.trim();

              if (status && !status.includes("...") && date) {
                applicationHistory.push({
                  statusTitle: status,
                  statusDate: date,
                });
              }
            }
          }
        }

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
