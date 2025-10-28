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
    const fromConfig = {
      email: 'info@blockey.tech', // ¡IMPORTANTE! Usa el email que verificaste en SendGrid.
      name: 'Administración Blockey',
    };

    // Construye el objeto del mensaje para la API de SendGrid.
    const msg = {
      to: to,
      from: fromConfig,
      subject: 'Gracias por tu solicitud - Siguientes Pasos en Blockey',
      html: this.getPlantillaOnboarding(name, linkSiguientePaso), // Llama a un método privado para generar el HTML.
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
  private getPlantillaOnboarding(name: string, link: string): string {
    const backgroundColor = '#111111';
    const textColor = '#EFF3F6';
    const accentColorRed = '#FF0909';
    const accentColorCyan = '#3DF2D3';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Siguientes Pasos en Blockey</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: ${backgroundColor};">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding: 20px 0;">
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #1A1A1A; border-radius: 15px; overflow: hidden;">
                
                <!-- Encabezado -->
                <tr>
                  <td align="center" style="padding: 40px 30px 30px 30px;">
                    <h1 style="color: ${accentColorRed}; margin: 0; font-family: Arial, sans-serif; font-size: 24px;">Blockey</h1>
                  </td>
                </tr>
                
                <!-- Contenido Principal -->
                <tr>
                  <td style="padding: 0 30px 40px 30px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="color: ${textColor}; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6;">
                          <h2 style="font-size: 20px; margin: 0 0 20px 0;">Hola ${name},</h2>
                          <p style="margin: 0 0 15px 0;">Hemos recibido tu solicitud correctamente y nuestro equipo la está revisando.</p>
                          <p style="margin: 0 0 25px 0;">El siguiente paso es completar la <strong>verificación de identidad (KYC/KYB)</strong>. Este es un requisito fundamental para garantizar la seguridad de nuestra plataforma. Por favor, haz clic en el botón de abajo para continuar.</p>
                        </td>
                      </tr>
                      
                      <!-- Botón de Llamada a la Acción (CTA) -->
                      <tr>
                        <td align="center" style="padding: 10px 0;">
                          <a href="${link}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: #252525; color: ${textColor}; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 12px; border: 2px solid ${accentColorCyan};">
                            Iniciar Verificación
                          </a>
                        </td>
                      </tr>

                      <!-- Información Adicional -->
                      <tr>
                        <td style="padding: 25px 0 0 0; color: #989898; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
                          <p style="margin: 0;">Recibirás tus credenciales de acceso a la plataforma en un correo electrónico separado una vez que tu verificación haya sido aprobada.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Pie de Página -->
                <tr>
                  <td style="background-color: #000000; padding: 30px;">
                    <p style="margin: 0; color: #666666; font-family: Arial, sans-serif; font-size: 12px; text-align: center;">
                      &copy; ${new Date().getFullYear()} Blockey. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}
