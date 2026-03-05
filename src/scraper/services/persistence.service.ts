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
      throw error;
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
      throw error;
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
      throw error;
    }
  }

  /**
   * ** Genera un gráfico de ghosting de las empresas
   * @description Método auxiliar para visualizar la evolución del ghosting de las empresas eb las aplicaciones a lo largo del tiempo.
   * @return Promise<Object[]>
   *
   */
  async getGhosting() {
    try {
      return await this.applicationModel.aggregate([
        {
          $project: {
            company: 1,
            link: 1,
            sentStatus: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$applicationStatusHistory",
                    as: "status",
                    cond: {
                      $eq: ["$$status.statusTitle", "Solicitud enviada"],
                    },
                  },
                },
                0,
              ],
            },
            viewedStatus: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$applicationStatusHistory",
                    as: "status",
                    cond: {
                      $eq: ["$$status.statusTitle", "Solicitud vista"],
                    },
                  },
                },
                0,
              ],
            },
          },
        },
        {
          $group: {
            _id: "$company",
            company: {
              $first: "$company",
            },
            totalJobs: {
              $sum: 1,
            },
            sentStatuses: {
              $push: "$sentStatus",
            },
            viewedStatuses: {
              $push: "$viewedStatus",
            },
            applications: {
              $push: {
                link: "$link",
                sent: "$sentStatus",
                viewed: "$viewedStatus",
                needsFollowUp: {
                  $and: [
                    {
                      $eq: [
                        {
                          $ifNull: ["$viewedStatus", null],
                        },
                        null,
                      ],
                    },
                    //? Filtro 1: Nadie la ha visto
                    {
                      $not: {
                        $regexMatch: {
                          input: "$sentStatus.statusDate",
                          regex: /minutos|hora/,
                        },
                      },
                    }, //? Filtro 2: No es una aplicación recién enviada
                  ],
                },
              },
            },
            ghostingCount: {
              $sum: {
                $cond: [
                  {
                    $ifNull: ["$viewedStatus", false],
                  },
                  0,
                  1,
                ],
              },
            },
          },
        },
        {
          $unset: ["_id", "sentStatuses", "viewedStatuses"],
        },
        {
          $addFields: {
            ghostingRate: {
              $concat: [
                {
                  $toString: {
                    $round: [
                      {
                        $multiply: [
                          {
                            $divide: ["$ghostingCount", "$totalJobs"],
                          },
                          100,
                        ],
                      },
                      0,
                    ],
                  },
                },
                "%",
              ],
            },
          },
        },
        {
          $sort: {
            ghostingCount: -1,
          },
        },
      ]);
    } catch (error) {
      this.logger.error(
        `❌ Error al generar gráfico de evolución: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * ** Genera un gráfico con todas las ubicaciones de las aplicaciones.
   * @return Promise<Object[]>
   *
   */
  async getHeatMap() {
    try {
      return await this.applicationModel.aggregate([
        {
          $group: {
            _id: "$location",
            location: { $first: "$location" },
            count: { $sum: 1 },
            links: { $push: "$link" },
          },
        },
        { $sort: { count: -1 } },
        {
          $project: {
            _id: 0,
            location: 1,
            count: 1,
            links: 1,
          },
        },
      ]);
    } catch (error) {
      this.logger.error(
        `❌ Error al generar gráfico de evolución: ${error.message}`,
      );
      throw error;
    }
  }
}
