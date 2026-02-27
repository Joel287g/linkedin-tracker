/**
 * Interfaz que representa la información de un reclutador en LinkedIn, incluyendo su nombre, enlace a su perfil y titular profesional.
 * Esta interfaz es utilizada para almacenar y manipular la información de los reclutadores asociados a las aplicaciones de empleo extraídas de LinkedIn.
 * @property name - Nombre del reclutador
 * @property profileLink - Enlace al perfil de LinkedIn del reclutador
 * @property headline - Titular profesional del reclutador (por ejemplo, "Recruiter at XYZ Company")
 * @remarks Esta interfaz es fundamental para la gestión de la información de los reclutadores dentro del sistema, permitiendo un manejo estructurado y consistente de los datos extraídos.
 */
export interface Recruiter {
  name: string;
  profileLink: string;
  headline: string;
}
