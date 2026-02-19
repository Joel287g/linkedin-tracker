//? Imports de NestJS y Mongoose
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { ApplicationStatusHistory } from "src/applications/domain/interfaces/job-application.interface";

//* Definición de sub-esquema para el reclutador (Mejora la legibilidad)
@Schema({ _id: false })
class Recruiter {
  @Prop({ trim: true })
  name: string;

  @Prop({ trim: true })
  profileLink: string;

  @Prop({ trim: true })
  headline: string;
}

//? Limpieza de la respuesta JSON para la API
@Schema({
  _id: true,
  versionKey: false,
  timestamps: true,
  collection: "applications",
  toJSON: {
    virtuals: true,
    versionKey: false,
  },
})
export class Application extends Document {
  //* Identificador único de LinkedIn para evitar duplicados
  @Prop({ unique: true, required: true, index: true })
  jobId: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true, index: true })
  company: string;

  @Prop({ required: true, trim: true })
  location: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: (v: string) => v.startsWith("http"),
      message: "El link debe ser una URL válida",
    },
  })
  link: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 15000,
  })
  description: string;

  //* Array de requisitos extraídos (Clean Code)
  @Prop({ required: true, type: [String], default: [] })
  requirements: string[];

  //* Historial de estados de la aplicación (Clean Code)
  @Prop({
    required: true,
    default: [],
  })
  applicationStatusHistory: ApplicationStatusHistory[];

  //* Objeto anidado del reclutador usando el sub-esquema
  @Prop({ required: true, type: Recruiter, default: null })
  recruiter: Recruiter;

  @Prop({
    required: true,
    default: "Sincronizado",
    enum: ["Sincronizado", "Pendiente", "Descartado", "Aplicado"],
    index: true,
  })
  status: string;

  @Prop({ required: true, default: Date.now })
  scrapedAt: Date;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;

  @Prop({ required: true, default: Date.now })
  updatedAt: Date;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);
