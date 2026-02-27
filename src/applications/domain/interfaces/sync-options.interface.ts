/**
 * Interfaz que define las opciones de sincronización para la extracción de datos de LinkedIn, incluyendo la página de inicio y el límite de resultados a extraer.
 * Esta interfaz es utilizada para configurar los parámetros de la función de sincronización, permitiendo un control flexible sobre el proceso de extracción de datos.
 * @property startPage - Página de inicio para la extracción de datos (opcional, por defecto es 1)
 * @property limit - Número máximo de resultados a extraer (opcional, por defecto es 100)
 * @remarks Esta interfaz es fundamental para la configuración de la función de sincronización, permitiendo a los usuarios personalizar el proceso de extracción de datos según sus necesidades.
 */
export interface SyncOptions {
  startPage?: number;
  limit?: number;
}
