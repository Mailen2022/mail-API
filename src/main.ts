/**
 * @file main.ts
 * @description Punto de entrada principal de la aplicación NestJS.
 * Este archivo se encarga de crear la instancia de la aplicación, configurar
 * los middlewares globales (como CORS) y poner el servidor a escuchar peticiones.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Función de arranque (bootstrap) de la aplicación.
 * Se ejecuta al iniciar el servidor.
 */
async function bootstrap() {
  // Crea una instancia de la aplicación NestJS utilizando el módulo raíz (AppModule).
  const app = await NestFactory.create(AppModule);

  // --- Configuración de CORS (Cross-Origin Resource Sharing) ---
  // Habilita CORS con una configuración por defecto permisiva.
  // Esto es crucial para permitir que los formularios web (ej. desde WordPress)
  // alojados en un dominio diferente puedan comunicarse con esta API.
  // La configuración por defecto maneja adecuadamente las peticiones de pre-vuelo (OPTIONS)
  // que los navegadores envían antes de peticiones complejas (como POST con archivos).
  app.enableCors();

  // --- Configuración del Puerto ---
  // El servidor escuchará en el puerto proporcionado por la variable de entorno PORT
  // (utilizado por plataformas de despliegue como Render).
  // Si la variable PORT no está definida (ej. en un entorno de desarrollo local),
  // se usará el puerto 3000 como valor por defecto.
  const port = process.env.PORT || 3000;

  // Inicia el servidor y lo pone a escuchar en el puerto configurado.
  await app.listen(port);

  // Registra en la consola la URL en la que la aplicación está corriendo.
  console.log(`Application is running on: ${await app.getUrl()}`);
}

// Llama a la función de arranque para iniciar la aplicación.
bootstrap();
