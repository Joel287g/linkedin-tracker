//? Imports de NestJS y Mongoose
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

//? Imports de Servicios (Lógica de Negocio)
import {
  ScraperSynchronizeService,
  ScraperJobDetailsService,
  ScraperListPageService,
  ScraperPersistenceService,
  ScraperStatsService,
} from "./services";

//? Imports de Controladores
import { ScraperController } from "./scraper.controller";

//? Imports de Persistencia (Infrastructure Layer)
import {
  Application,
  ApplicationSchema,
} from "../applications/infrastructure/persistence/schemas";

@Module({
  imports: [
    //* Registro de la entidad Application en el Feature Module
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
    ]),
  ],
  providers: [
    //? Servicios encargados de la orquestación y scraping
    ScraperSynchronizeService,
    ScraperListPageService,
    ScraperJobDetailsService,
    ScraperPersistenceService,
    ScraperStatsService,
  ],
  controllers: [
    //* Entry point para los comandos de sincronización
    ScraperController,
  ],
  //? Exportamos el servicio de sincronización por si otro módulo necesita disparar el scraping
  exports: [ScraperSynchronizeService],
})
export class ScraperModule {}
