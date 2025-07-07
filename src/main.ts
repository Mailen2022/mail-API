import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    // ¡IMPORTANTE! Ahora debes poner el dominio real de tu sitio de WordPress.
    // También puedes poner varios si es necesario.
    origin: ['https://market.blockey.tech'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // El puerto será proporcionado por Render a través de la variable de entorno PORT.
  // Si no la encuentra (porque estás en local), usará el 3000 como respaldo.
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
