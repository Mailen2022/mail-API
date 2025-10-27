/**
 * @file mail.service.ts
 * @description Contiene la lógica de negocio para procesar los datos de los formularios.
 * Este servicio se comunica con Supabase para subir archivos y guardar datos,
 * y luego delega el envío de notificaciones por email al EmailService.
 */

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { EmailService } from '../email/email.service'; // Importamos el servicio de email

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private supabaseClient: SupabaseClient;

  /**
   * Inyecta los servicios necesarios y obtiene una instancia del cliente de Supabase.
   * @param supabaseService Instancia de SupabaseService para la conexión a la BD.
   * @param emailService Instancia de EmailService para el envío de correos.
   */
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly emailService: EmailService, // Inyectamos el EmailService
  ) {
    this.supabaseClient = this.supabaseService.getClient();
  }

  /**
   * Procesa el formulario de registro de empresas (KYB).
   * Sube archivos, guarda el registro y envía un email de notificación.
   * @param datosEmpresa Objeto con los datos de texto del formulario.
   * @param files Objeto con los archivos subidos.
   * @returns Un objeto con un mensaje de éxito y los datos guardados.
   */
  async procesarRegistroEmpresa(
    datosEmpresa: any,
    files: { [fieldname: string]: Express.Multer.File[] },
  ) {
    this.logger.log('Procesando registro de empresa KYB...');
    const bucketName = 'registros-empresas';
    const fileUrls: { [key: string]: string[] } = {};

    try {
      // Sube todos los archivos concurrentemente.
      const uploadTasks = Object.keys(files).map((fieldName) =>
        this.uploadMultipleFiles(fieldName, files[fieldName], bucketName).then(
          (urls) => {
            if (urls.length > 0) {
              fileUrls[`${fieldName}_urls`] = urls;
            }
          },
        ),
      );
      await Promise.all(uploadTasks);

      this.logger.log('URLs de archivos de empresa generadas:', fileUrls);

      // Prepara el objeto de datos para la inserción.
      const dataToInsert = {
        nombre_empresa: datosEmpresa.nombre_empresa,
        cuit_empresa: datosEmpresa.cuit_empresa,
        direccion_sede: datosEmpresa.direccion_sede,
        email_empresa: datosEmpresa.email_empresa,
        telefono_empresa: datosEmpresa.telefono_empresa,
        sitio_web: datosEmpresa.sitio_web,
        fondos_licitos: datosEmpresa.fondos_licitos === 'on',
        ...fileUrls,
      };

      // Inserta el registro en la tabla 'registros_market'.
      const { data: savedData, error } = await this.supabaseClient
        .from('registros_market')
        .insert([dataToInsert])
        .select();

      if (error) {
        this.logger.error(
          `Error de Supabase al insertar registro: ${error.message}`,
        );
        throw new InternalServerErrorException(
          'No se pudo guardar el registro en la base de datos.',
        );
      }

      this.logger.log('Registro de empresa guardado con éxito:', savedData[0]);

      // Tras el éxito, delega el envío del email al EmailService.
      await this.emailService.enviarEmailBienvenida(
        datosEmpresa.email_empresa,
        datosEmpresa.nombre_empresa,
        'https://market.blockey.tech/siguiente-paso-empresas', // URL para empresas
      );

      return {
        message: 'Registro de empresa procesado con éxito!',
        data: savedData[0],
      };
    } catch (error) {
      this.logger.error('Error en procesarRegistroEmpresa:', error.stack);
      throw error instanceof InternalServerErrorException
        ? error
        : new InternalServerErrorException('Error al procesar el registro.');
    }
  }

  /**
   * Procesa el formulario de onboarding de usuarios individuales (KYC).
   * Sube documentos, guarda la solicitud y envía un email de notificación.
   * @param datosSolicitud Objeto con los datos de texto del formulario.
   * @param files Objeto con los archivos de documentos subidos.
   * @returns Un objeto con un mensaje de éxito y los datos guardados.
   */
  async procesarSolicitudKyc(
    datosSolicitud: any,
    files: { [fieldname: string]: Express.Multer.File[] },
  ) {
    this.logger.log('Procesando solicitud de onboarding KYC...');
    const bucketName = 'kyc-documentos-usuarios';
    const fileUrls: { [key: string]: string[] } = {};

    try {
      // Sube todos los archivos concurrentemente.
      const uploadTasks = Object.keys(files).map((fieldName) =>
        this.uploadMultipleFiles(fieldName, files[fieldName], bucketName).then(
          (urls) => {
            if (urls.length > 0) {
              fileUrls[`${fieldName}_urls`] = urls;
            }
          },
        ),
      );
      await Promise.all(uploadTasks);

      this.logger.log('URLs de archivos KYC generadas:', fileUrls);

      // Prepara el objeto de datos para la inserción.
      const dataToInsert = {
        nombre: datosSolicitud.nombre,
        apellido: datosSolicitud.apellido,
        numero_documento: datosSolicitud.numero_documento,
        fecha_nacimiento: datosSolicitud.fecha_nacimiento,
        nacionalidad: datosSolicitud.nacionalidad,
        direccion: datosSolicitud.direccion,
        email: datosSolicitud.email,
        telefono: datosSolicitud.telefono,
        fuente_ingresos: datosSolicitud.fuente_ingresos,
        limite_operaciones: datosSolicitud.limite_operaciones,
        justificacion_servicios: datosSolicitud.justificacion_servicios,
        fondos_licitos: datosSolicitud.fondos_licitos === 'on',
        pep_status: datosSolicitud.pep_status,
        ...fileUrls,
      };

      // Inserta el registro en la tabla 'solicitudes_token'.
      const { data: savedData, error } = await this.supabaseClient
        .from('solicitudes_token')
        .insert([dataToInsert])
        .select();

      if (error) {
        this.logger.error(
          `Error de Supabase al insertar solicitud KYC: ${error.message}`,
        );
        throw new InternalServerErrorException(
          'No se pudo guardar la solicitud en la base de datos.',
        );
      }

      this.logger.log('Solicitud KYC guardada con éxito:', savedData[0]);

      // Tras el éxito, delega el envío del email al EmailService.
      const nombreCompleto = `${datosSolicitud.nombre} ${datosSolicitud.apellido}`;
      await this.emailService.enviarEmailBienvenida(
        datosSolicitud.email,
        nombreCompleto,
        'https://market.blockey.tech/siguiente-paso-usuarios', // URL para usuarios
      );

      return {
        message: 'Solicitud de onboarding recibida y guardada con éxito!',
        data: savedData[0],
      };
    } catch (error) {
      this.logger.error(
        'Error inesperado en procesarSolicitudKyc:',
        error.stack,
      );
      throw new InternalServerErrorException(
        'Ocurrió un error inesperado al procesar la solicitud.',
      );
    }
  }

  /**
   * @private
   * Sube un array de archivos a un bucket específico de Supabase Storage.
   * Sanitiza los nombres de archivo para prevenir errores de 'Invalid key'.
   * @param fieldName El nombre del campo del formulario al que pertenecen los archivos.
   * @param fileArray El array de archivos a subir.
   * @param bucketName El nombre del bucket de destino en Supabase.
   * @returns Una promesa que resuelve a un array de URLs públicas de los archivos subidos.
   */
  private async uploadMultipleFiles(
    fieldName: string,
    fileArray: Express.Multer.File[],
    bucketName: string,
  ): Promise<string[]> {
    if (!fileArray || fileArray.length === 0) return [];

    const uploadPromises = fileArray.map((file, index) => {
      const sanitizedFileName = file.originalname.replace(
        /[^a-zA-Z0-9.\-_]/g,
        '_',
      );
      const filePath = `public/${fieldName}/${Date.now()}-${index}-${sanitizedFileName}`;
      return this.supabaseClient.storage
        .from(bucketName)
        .upload(filePath, file.buffer, { contentType: file.mimetype });
    });

    const uploadResults = await Promise.all(uploadPromises);

    const uploadErrors = uploadResults.filter((result) => result.error);
    if (uploadErrors.length > 0) {
      const errorMessages = uploadErrors
        .map((e) => (e.error ? e.error.message : 'Unknown upload error'))
        .join(', ');
      this.logger.error(
        `Error subiendo archivos para ${fieldName}: ${errorMessages}`,
      );
      throw new InternalServerErrorException(
        `Fallo al subir archivos para: ${fieldName}`,
      );
    }

    return uploadResults
      .map((result) => {
        if (result.data) {
          return this.supabaseClient.storage
            .from(bucketName)
            .getPublicUrl(result.data.path).data.publicUrl;
        }
        return null;
      })
      .filter((url): url is string => url !== null);
  }
}
