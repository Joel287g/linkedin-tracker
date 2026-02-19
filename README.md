# 🚀 LinkedIn Job Tracker - NestJS Backend Core

Sistema profesional de orquestación y sincronización de vacantes de LinkedIn desarrollado con **NestJS**, **Playwright** y **MongoDB**. Esta herramienta no solo extrae datos, sino que gestiona el ciclo de vida de las aplicaciones de empleo bajo principios de **Arquitectura Limpia** y **Código Limpio**.



## 🛠️ Stack Tecnológico

* **Core:** Node.js (v20+) & NestJS.
* **Automatización:** Playwright (Evasión de detección `AutomationControlled`).
* **Persistencia:** MongoDB + Mongoose (Modelado con Índices y Agregaciones).
* **Lenguaje:** TypeScript (Tipado estricto e Interfaces de Dominio).

## ✨ Características de Nivel Senior

### 1. Sincronización Inteligente & Eficiencia $O(1)$
Antes de iniciar la navegación, el sistema carga todos los `jobIds` existentes en un `Set`. Esto permite filtrar ofertas ya procesadas en milisegundos, ahorrando hasta un 80% de tiempo de ejecución y recursos de red al evitar navegaciones redundantes.

### 2. Tracking de "Estado de la Solicitud"
El scraper realiza una extracción profunda de la sección "Estado de la solicitud", capturando eventos como:
* "CV descargado por el anunciante".
* "Solicitud vista".
* "Solicitud enviada".
Cada evento se guarda con su fecha relativa, permitiendo un análisis histórico de la interacción del reclutador.

### 3. Resiliencia y Evasión
* **Delays Humanos:** Generación de tiempos de espera aleatorios entre interacciones.
* **Contexto Persistente:** Uso de `userDataDir` para mantener sesiones de LinkedIn activas y reducir el riesgo de bloqueos/Captchas.

## 📁 Estructura de Carpetas (Clean Architecture)

```text
src/
├── applications/             # Capa de Dominio y Datos
│   ├── domain/               # Interfaces de negocio (JobApplication)
│   └── infrastructure/       # Persistencia (Mongoose Schemas)
├── scraper/                  # Capa de Aplicación (Lógica de Scraping)
│   ├── services/             # Orquestador, Detalle y Sincronización
│   ├── scraper.controller.ts # API Endpoints
│   └── scraper.module.ts     # Inyección de dependencias
└── common/                   # Utilidades globales