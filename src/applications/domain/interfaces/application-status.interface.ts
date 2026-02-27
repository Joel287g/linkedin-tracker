/**
 * Interfaz que representa el historial de estados de una aplicación de empleo, incluyendo el título del estado y la fecha en que se registró.
 * Esta interfaz es utilizada para almacenar y manipular la información del historial de estados de las aplicaciones de empleo extraídas de LinkedIn.
 * @property statusTitle - Título del estado de la aplicación (enviado, visto, rechazado, etc.)
 * @property statusDate - Fecha y hora en que se registró el estado de la aplicación
 * @remarks Esta interfaz es fundamental para la gestión del historial de estados de las aplicaciones de empleo dentro del sistema, permitiendo un manejo estructurado y consistente de los datos extraídos.
 */
export interface ApplicationStatusHistory {
  statusTitle: string;
  statusDate: string;
}
