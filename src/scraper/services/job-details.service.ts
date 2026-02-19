//? Imports de NestJS y herramientas de scraping
import { Injectable, Logger } from "@nestjs/common";
import { Page } from "playwright";

@Injectable()
export class ScraperJobDetailsService {
  private readonly logger = new Logger(this.constructor.name);

  //? Selectores actualizados con el path verificado
  private readonly SELECTORS = {
    workspace: "#workspace",
    headerInfoContainer:
      "div > div > div._4062c218.e2718449._4a745388 > div > div > div > div._27fa1ff5.f282d9dd.b41dfbd9._86b9d5f8.c88da257.f28ac035._28deab20",
    locationPath:
      "div > div > div._1ab93946 > div > div._27fa1ff5.f282d9dd.b41dfbd9._86b9d5f8.c88da257.f28ac035._8a44431b > p > span:nth-child(1)",
    description:
      "div:nth-child(3) > div > div > div > div > div > div > p:nth-child(3)",
    reqAnchor:
      "p.ff44be0a._69367463.ca666375.bab11c20._65531f27.cfb2a716.b9b25d9c.a7de939b._8870eb30._7f740db4",
    recruiterContainer:
      "div:nth-child(2) > div > div > div > div > div > div > a",
    recruiterName:
      "div > div > div.f282d9dd._5afe57c9._86b9d5f8.e5367532.a032d3f6._28deab20 > div > p > a",
    recruiterHeadline:
      "div > div > div.bab11c20._65531f27.d07784b5.b9b25d9c.a7de939b._8870eb30._7f740db4 > p",
    statusListContainer:
      "div._27fa1ff5.f282d9dd.b41dfbd9._86b9d5f8.c88da257.f28ac035._5971f7f9 ul",
    statusTitle:
      "p.ff44be0a.f6f4660e.bab11c20._65531f27.cfb2a716.b9b25d9c.a7de939b._8870eb30._7f740db4",
    statusDate:
      "p.ff44be0a.c2dd7318.bab11c20._65531f27.d07784b5.b9b25d9c.a7de939b._4d0262ae._7f740db4",
  };

  async enrichWithJobDetails(page: Page, item: any) {
    if (item.link === "Sin enlace") {
      return {
        ...item,
        description: "",
        requirements: [],
        location: "N/A",
        recruiter: null,
      };
    }

    try {
      await page.goto(item.link, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await page.waitForTimeout(3500);

      const details = await page.evaluate((selectors) => {
        //? Helper unificado para buscar dentro del workspace
        const root = document.querySelector(selectors.workspace);
        if (!root) return null;

        //? Extracción de Ubicación usando el path verificado
        const locationEl = root.querySelector(
          `${selectors.headerInfoContainer} > ${selectors.locationPath}`,
        ) as HTMLElement;

        //? Extracción de Descripción (ajustada a la jerarquía común)
        const descContainer = root.querySelector(
          "div > div > div._4062c218.e2718449._4a745388 > div > div > div > div._27fa1ff5.f282d9dd.b41dfbd9._86b9d5f8.c88da257.f28ac035._5971f7f9",
        );
        const description = descContainer?.querySelector(
          selectors.description,
        ) as HTMLElement;

        const requirements = document.querySelector(selectors.reqAnchor);
        const recruiterAnchor = descContainer?.querySelector(
          selectors.recruiterContainer,
        );

        //? 1. Obtener la lista de estados
        const statusElements = document.querySelectorAll(
          `${selectors.statusListContainer} li`,
        );
        const applicationHistory = Array.from(statusElements)
          .map((li) => {
            const title = li
              .querySelector(selectors.statusTitle)
              ?.textContent?.trim();
            let date = li
              .querySelector(selectors.statusDate)
              ?.textContent?.trim();

            return {
              statusTitle: title || "Desconocido",
              statusDate: date || "N/A",
            };
          })
          .filter((h) => h.statusTitle !== "Desconocido");

        const nameEl = recruiterAnchor?.querySelector(
          selectors.recruiterName,
        ) as HTMLAnchorElement;
        const headEl = recruiterAnchor?.querySelector(
          selectors.recruiterHeadline,
        ) as HTMLElement;

        const requirementsArray: string[] = [];
        if (requirements) {
          let nextEl = requirements.nextElementSibling;
          while (nextEl && nextEl.tagName === "P") {
            const text = nextEl.textContent?.trim();
            if (text) requirementsArray.push(text.replace(/^•\s*/, ""));
            nextEl = nextEl.nextElementSibling;
          }
        }

        return {
          location:
            locationEl?.innerText?.trim() || "Ubicación no especificada",
          description:
            description?.innerText?.trim() || "Sin descripción disponible",
          requirements: requirementsArray,
          recruiter: recruiterAnchor
            ? {
                name: nameEl?.innerText?.trim() || "No visible",
                profileLink: nameEl?.href?.split("?")[0] || "N/A",
                headline: headEl?.innerText?.trim() || "Sin cargo",
              }
            : null,
          applicationHistory,
        };
      }, this.SELECTORS);

      this.logger.log(
        `✅ Detalle extraído: ${item.title} | Loc: ${details?.location}`,
      );
      return { ...item, ...details, scrapedAt: new Date().toISOString() };
    } catch (error) {
      this.logger.error(`❌ Error en item ${item.jobId}: ${error.message}`);
      return {
        ...item,
        description: "Error",
        requirements: [],
        location: "Error",
        recruiter: null,
      };
    }
  }
}
