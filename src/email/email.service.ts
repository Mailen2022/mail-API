/**
 * @file email.service.ts
 * @description Define un servicio centralizado para el envío de todos los correos electrónicos transaccionales de la aplicación.
 * Este módulo abstrae la lógica del proveedor de email (actualmente SendGrid), permitiendo cambiar de proveedor
 * en el futuro modificando únicamente este archivo.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

/**
 * @class EmailService
 * @brief Gestiona la configuración y el envío de correos electrónicos.
 */
@Injectable()
export class EmailService {
  /**
   * Logger para registrar la actividad y los errores del servicio de email.
   * @private
   */
  private readonly logger = new Logger(EmailService.name);

  /**
   * El constructor se encarga de configurar el cliente de SendGrid al iniciar el servicio.
   * Lee la clave de API desde las variables de entorno a través del ConfigService.
   * Si la clave no está presente, el envío de emails se deshabilita y se registra un error.
   * @param configService Servicio inyectado para acceder a las variables de entorno.
   */
  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.logger.log('Cliente de SendGrid configurado exitosamente.');
    } else {
      this.logger.error(
        'SENDGRID_API_KEY no fue encontrada en las variables de entorno. El envío de emails estará deshabilitado.',
      );
    }
  }

  /**
   * Envía un email de bienvenida y de "siguientes pasos" a un usuario o empresa
   * que ha completado un formulario de registro.
   *
   * @param to La dirección de correo electrónico del destinatario.
   * @param name El nombre del destinatario, usado para personalizar el saludo.
   * @param linkSiguientePaso La URL completa a la que el usuario debe ser dirigido para continuar el proceso.
   * @returns Una promesa que se resuelve cuando el email ha sido enviado o falla.
   */
  async enviarEmailBienvenida(
    to: string,
    name: string,
    linkSiguientePaso: string,
  ): Promise<void> {
    // Define la dirección de correo del remitente. Debe ser una identidad verificada en SendGrid.
    const fromAddress = 'tu-email-verificado@blockey.tech'; // <-- ¡IMPORTANTE! Reemplazar con tu email verificado.

    // Construye el objeto del mensaje para la API de SendGrid.
    const msg = {
      to: to,
      from: fromAddress,
      subject: 'Gracias por tu solicitud - Siguientes Pasos en Blockey',
      html: this.getPlantillaBienvenida(name, linkSiguientePaso), // Llama a un método privado para generar el HTML.
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Email de bienvenida enviado exitosamente a ${to}`);
    } catch (error) {
      this.logger.error(
        `Fallo al enviar email de bienvenida a ${to}`,
        error.stack,
      );
      // En este flujo, decidimos no lanzar una excepción para no interrumpir la respuesta al usuario,
      // ya que el registro en la base de datos fue exitoso. El error solo se registra.
    }
  }

  /**
   * @private
   * Genera el contenido HTML para el email de bienvenida.
   * Separar la plantilla en un método privado mejora la legibilidad y permite una gestión más fácil del contenido.
   *
   * @param name El nombre del destinatario.
   * @param link La URL para el botón de llamada a la acción.
   * @returns Un string con el contenido HTML del email.
   */
  private getPlantillaBienvenida(name: string, link: string): string {
    // Este es un template HTML simple. Para emails más complejos, se recomienda usar
    // las plantillas dinámicas de SendGrid o una librería de plantillas como Handlebars.
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
        <h2 style="color: #0056b3;">Hola ${name},</h2>
        <p>Hemos recibido tu solicitud en Blockey correctamente. Nuestro equipo ya ha comenzado el proceso de revisión.</p>
        <p>El siguiente paso en el proceso de onboarding es completar la verificación de identidad. Por favor, haz clic en el siguiente botón para continuar:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #0073aa; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">
            Continuar con el Siguiente Paso
          </a>
        </div>
        <p>Si tienes alguna pregunta, no dudes en responder a este correo.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888;">Saludos cordiales,<br>El equipo de Blockey</p>
      </div>
    `;
  }

  // En el futuro, se pueden añadir aquí otros métodos para diferentes tipos de emails.
  // Ejemplo:
  // async enviarEmailRecuperacionContrasena(to: string, token: string): Promise<void> { ... }
}
