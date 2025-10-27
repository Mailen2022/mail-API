/**
 * @file mail.module.ts
 * @description Define el módulo de Mail para la aplicación.
 * Este módulo agrupa toda la funcionalidad relacionada con la recepción y procesamiento
 * de los datos de los formularios (KYC y KYB).
 */

import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { EmailModule } from '../email/email.module'; // Importamos el módulo de Email

/**
 * @class MailModule
 * @brief Módulo que gestiona los controladores y servicios para los formularios.
 *
 * @imports
 * - `EmailModule`: Importa el módulo de Email para que `MailService` pueda
 *   inyectar y utilizar `EmailService` para enviar notificaciones por correo.
 *
 * @controllers
 * - `MailController`: El controlador que expone los endpoints para los formularios.
 *
 * @providers
 * - `MailService`: El servicio que contiene la lógica de negocio para procesar los formularios.
 */
@Module({
  imports: [EmailModule],
  controllers: [MailController],
  providers: [MailService],
})
export class MailModule {}
