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
    link,
    description,
    requirements,
    applicationHistory,
    recruiter,
    status,
  }: JobApplication): Promise<void> {
    try {
      await this.applicationModel.create({
        jobId,
        title,
        company,
        location,
        link,
        description,
        requirements,
        applicationStatusHistory: applicationHistory,
        recruiter: {
          name: recruiter?.name,
          profileLink: recruiter?.profileLink,
          headline: recruiter?.headline,
        },
        status,
        scrapedAt: new Date(),
      });
    } catch (error) {
      this.logger.error(`❌ Error al crear jobId ${jobId}: ${error.message}`);
    }
  }

  /**
   * ** Devuelve todos los jobIds almacenados en la base de datos.
   * @description Método auxiliar para obtener una lista de todos los jobIds que ya han sido guardados. Esto es útil para evitar duplicados durante la sincronización.
   * @returns Promise<string[]>
   */
  async getAllJobIds(): Promise<string[]> {
    try {
      const applications = await this.applicationModel
        .find({}, { jobId: 1, _id: 0 })
        .lean();
      return applications.map((app) => app.jobId);
    } catch (error) {
      this.logger.error(`❌ Error al obtener jobIds: ${error.message}`);
      return [];
    }
  }
}
