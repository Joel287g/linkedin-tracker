//? Imports de usuario
import { ApplicationStatusHistory } from "./application-status.interface";
import { Recruiter } from "./recruiter.interface";

/**
 * Interfaz que representa una aplicación de empleo, incluyendo detalles enriquecidos.
 * Contiene información básica del empleo, detalles adicionales, historial de aplicaciones y datos del reclutador.
 * Esta interfaz es utilizada para almacenar y manipular la información de las aplicaciones de empleo extraídas de LinkedIn.
 * @property jobId - Identificador único del empleo (extraído de la URL)
 * @property title - Título del empleo
 * @property company - Nombre de la empresa
 * @property location - Ubicación del empleo
 * @property workMode - Modalidad de trabajo (presencial, remoto, híbrido)
 * @property link - URL directa a la página del empleo en LinkedIn
 * @property description - Descripción detallada del empleo
 * @property requirements - Lista de requisitos o habilidades necesarias para el empleo
 * @property applicationHistory - Historial de estados de la aplicación (enviado, visto, rechazado, etc.)
 * @property recruiter - Información del reclutador asociado al empleo (si está disponible)
 * @property status - Estado actual de la aplicación (enviado, visto, rechazado, etc.)
 * @property scrapedAt - Fecha y hora en que se extrajo la información del empleo
 * @remarks Esta interfaz es fundamental para la gestión de las aplicaciones de empleo dentro del sistema, permitiendo un manejo estructurado y consistente de los datos extraídos.
 * @see JobBasicInfo para la información básica del empleo sin detalles adicionales.
 * @see Recruiter para la información del reclutador asociado al empleo.
 * @see ApplicationStatusHistory para el historial de estados de la aplicación.
 */
export interface JobApplication {
  jobId: string;
  title: string;
  company: string;
  location: string;
  workMode: string;
  link: string;
  description: string;
  requirements: string[];
  applicationHistory: ApplicationStatusHistory[];
  recruiter: Recruiter;
  status: string;
  scrapedAt: string;
}

/**
 * Interfaz que representa la información básica de un empleo, utilizada para la extracción inicial antes de enriquecer con detalles adicionales.
 * Contiene los campos mínimos necesarios para identificar y acceder a la página del empleo en LinkedIn.
 * @property jobId - Identificador único del empleo (extraído de la URL)
 * @property title - Título del empleo
 * @property company - Nombre de la empresa
 * @property location - Ubicación del empleo
 * @property link - URL directa a la página del empleo en LinkedIn
 * @property workMode - Modalidad de trabajo (presencial, remoto, híbrido)
 * @remarks Esta interfaz es utilizada principalmente durante la fase de extracción inicial, antes de enriquecer con detalles adicionales como descripción, requisitos, historial de aplicaciones y datos del reclutador.
 */
export interface JobBasicInfo {
  jobId: string;
  title: string;
  company: string;
  location: string;
  workMode: string;
  link: string;
}
