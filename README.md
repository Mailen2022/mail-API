# API de Gestión de Formularios - Blockey Market

Esta es la API de backend, construida con NestJS, que da servicio a los formularios del sitio web de Blockey Market. Se encarga de recibir datos, procesar y subir archivos, y almacenar toda la información en una base de datos Supabase.

## ✨ Características

- **Framework Moderno:** Construido con [NestJS](https://nestjs.com/) (TypeScript) para una arquitectura robusta y escalable.
- **Gestión de Archivos:** Sube archivos de forma segura a [Supabase Storage](https://supabase.com/storage).
- **Base de Datos PostgreSQL:** Almacena datos estructurados en [Supabase DB](https://supabase.com/database).
- **Configuración por Entorno:** Utiliza archivos `.env` para una gestión segura de las credenciales.
- **Despliegue Automatizado:** Listo para despliegue continuo en plataformas como [Render](https://render.com/).

## 🚀 Puesta en Marcha (Desarrollo Local)

Sigue estos pasos para ejecutar la API en tu máquina local.

### Prerrequisitos

- [Node.js](https://nodejs.org/) (v16 o superior)
- [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/)
- Una cuenta de [Supabase](https://supabase.com/) para obtener las credenciales de la base de datos y el almacenamiento.

### 1. Clonar el Repositorio

```bash
git clone https://URL-DE-TU-REPOSITORIO.git
cd nombre-del-repositorio
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo llamado `.env` en la raíz del proyecto. Copia el contenido de `.env.example` (si existe) o usa la siguiente plantilla y rellena los valores con tus credenciales de Supabase.

```env
# Credenciales de Supabase
# Las encontrarás en tu proyecto de Supabase > Project Settings > API
SUPABASE_URL=https://TU_ID_DE_PROYECTO.supabase.co
SUPABASE_KEY=TU_CLAVE_ANON_PUBLICA_AQUI
```

### 4. Ejecutar la Aplicación

Para iniciar la aplicación en modo de desarrollo (con recarga automática):

```bash
npm run start:dev
```

La API estará disponible en `https://mail-api-6qhi.onrender.com`.

## 🌐 Endpoints de la API

La API expone los siguientes endpoints bajo el prefijo `/formularios`:

- **`POST /formularios/registro-empresa`**

  - **Descripción:** Recibe los datos y documentos para el registro de una nueva empresa en el marketplace.
  - **Tipo de Contenido:** `multipart/form-data`.
  - **Campos:** `nombre_empresa`, `email_empresa`, `logo_empresa` (archivo), `estatuto` (archivo), etc.

- **`POST /formularios/solicitud-token`**

  - **Descripción:** Recibe las solicitudes de usuarios para la adquisición de tokens.
  - **Tipo de Contenido:** `multipart/form-data` o `application/json`.
  - **Campos:** `nombre`, `apellido`, `cuit_cuil`, `capital_inversion`, etc.

- **`POST /formularios/contacto`**
  - **Descripción:** Endpoint inicial para el formulario de contacto con subida de archivos.
  - **Tipo de Contenido:** `multipart/form-data`.
  - **Campos:** `nombre_empresa`, `email`, `telefono`, `logo` (archivo), etc.

## 📦 Estructura del Proyecto

```
src/
├── app.module.ts         # Módulo raíz
├── main.ts               # Punto de entrada de la aplicación
├── mail/                 # Módulo para la lógica de los formularios
│   ├── mail.controller.ts  # Define los endpoints
│   └── mail.service.ts     # Contiene la lógica de negocio
└── supabase/             # Módulo para la conexión con Supabase
    ├── supabase.module.ts
    └── supabase.service.ts
```

## ☁️ Despliegue

Esta aplicación está configurada para ser desplegada en **Render**.

- **Build Command:** `npm install && npm run build`
- **Start Command:** `node dist/main.js`
