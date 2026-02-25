//? Definición del contrato principal de la vacante
export interface JobApplication {
  jobId: string;
  title: string;
  company: string;
  location: string;
  link: string;
  description: string;
  requirements: string[];
  applicationHistory: ApplicationStatusHistory[];
  recruiter: Recruiter | null;
  status: string
  scrapedAt: string;
}

//? Sub-interfaz para el reclutador
export interface Recruiter {
  name: string;
  profileLink: string;
  headline: string;
}

//? Interface para los parámetros de ejecución del orquestador
export interface SyncOptions {
  startPage?: number;
  limit?: number;
}

//? Definición de la estructura de datos para el listado básico
export interface JobBasicInfo {
  jobId: string;
  title: string;
  company: string;
  location: string;
  workMode: string;
  link: string;
}

//? Interface para el detalle completo de la vacante (enriquecida)
export interface ApplicationStatusHistory {
  statusTitle: string;
  statusDate: string;
}
