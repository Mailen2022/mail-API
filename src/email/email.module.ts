/**
 * @file email.module.ts
 * @description Define el módulo de Email para la aplicación.
 * Este módulo encapsula toda la funcionalidad relacionada con el envío de correos electrónicos.
 * Al exportar el EmailService, lo hace disponible para ser inyectado en otros módulos
 * que necesiten enviar emails, promoviendo la reutilización de código y la separación de responsabilidades.
 */

import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

/**
 * @class EmailModule
 * @brief Módulo que registra y exporta el EmailService.
 *
 * @providers
 * - `EmailService`: El servicio que contiene la lógica para enviar emails.
 *
 * @exports
 * - `EmailService`: Permite que otros módulos que importen `EmailModule` puedan
 *   inyectar y utilizar `EmailService`.
 */
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
