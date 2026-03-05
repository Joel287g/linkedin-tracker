//? Imports de NestJS y Mongoose
import { Model } from "mongoose";

import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

//? Interfaces y Esquemas
import { JobApplication } from "src/applications/domain/interfaces";
import { Application } from "src/applications/infrastructure/persistence/schemas";

@Injectable()
export class ScraperPersistenceService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectModel(Application.name)
    private readonly applicationModel: Model<Application>,
  ) {}

  /**
   * ** Crea una nueva aplicación en la base de datos.
   * @description Se encarga de insertar un nuevo documento en MongoDB con los detalles completos de la vacante. Maneja errores de forma individual para evitar que una falla detenga el proceso completo.
   * @param jobApplication Objeto con toda la información de la vacante a guardar.
   * @returns Promise<void>
   *
   */
  async createJobApplication({
    jobId,
    title,
    company,
    location,
    workMode,
    link,
    description,
    requirements,
    applicationHistory,
    recruiter,
    status,
  }: JobApplication): Promise<void> {
    try {
      const application = await this.applicationModel.findOne({ jobId });

      if (application) {
        this.logger.log(`🔄 Actualizando aplicación con jobId ${jobId}`);

        application.description = description;
        application.requirements = requirements;
        application.applicationStatusHistory = applicationHistory;
        application.recruiter = recruiter;
        application.status = status;
        application.scrapedAt = new Date();
        application.updatedAt = new Date();

        await application.save();
        return;
      } else {
        this.logger.log(`➕ Creando nueva aplicación con jobId ${jobId}`);

        await this.applicationModel.create({
          jobId,
          title,
          company,
          location,
          workMode,
          link,
          description,
          requirements,
          applicationStatusHistory: applicationHistory,
          recruiter,
          status,
          scrapedAt: new Date(),
        });
      }

      this.logger.log(`✅ JobId ${jobId} procesado correctamente`);
    } catch (error) {
      this.logger.error(
        `❌ Error al procesar jobId ${jobId}: ${error.message}`,
      );
    }
  }

  /**
   * ** Devuelve todos los jobIds almacenados en la base de datos.
   * @description Método auxiliar para obtener una lista de todos los jobIds que ya han sido guardados. Esto es útil para evitar duplicados durante la sincronización.
   * @returns Promise<string[]>
   */
  async getAllJobIds(): Promise<string[]> {
    try {
      return await this.applicationModel.distinct("jobId").lean();
    } catch (error) {
      this.logger.error(`❌ Error al obtener jobIds: ${error.message}`);
      return [];
    }
  }

  /**
   * ** Genera un gráfico de evolución de estados de las aplicaciones.
   * @description Método auxiliar para visualizar la evolución de los estados de las aplicaciones a lo largo del tiempo. Utiliza la biblioteca asciichart para generar un gráfico en la consola.
   * @returns Promise<string[]>
   */
  async getStatus() {
    try {
      return await this.applicationModel.aggregate([
        {
          $group: {
            _id: "$status",
            total: {
              $sum: 1,
            },
            links: {
              $push: "$link",
            },
            allRecruiters: {
              $push: "$recruiter.profileLink",
            },
          },
        },
        {
          $project: {
            _id: 1,
            total: 1,
            links: 1,
            recruiters: {
              $filter: {
                input: "$allRecruiters",
                as: "res",
                cond: {
                  $and: [
                    {
                      $ne: ["$$res", "Enlace no disponible"],
                    },
                    {
                      $ne: ["$$res", null],
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $sort: {
            total: -1,
          },
        },
      ]);
    } catch (error) {
      this.logger.error(
        `❌ Error al generar gráfico de evolución: ${error.message}`,
      );
      return;
    }
  }
}
