/**
 * @file mail.service.ts
 * @description Contiene la lógica de negocio para procesar los datos de los formularios.
 * Este servicio se comunica con Supabase para subir archivos y guardar datos en la base de datos.
 */

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class MailService {
  /**
   * Inyecta el SupabaseService para interactuar con la base de datos y el almacenamiento.
   * @param supabaseService Instancia de SupabaseService.
   */
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Procesa el formulario de registro de empresas (KYB).
   */
  async procesarRegistroEmpresa(
    datosEmpresa: any,
    files: { [fieldname: string]: Express.Multer.File[] },
  ) {
    console.log('Servicio: Procesando registro de empresa KYB...');
    const supabaseClient = this.supabaseService.getClient();
    const bucketName = 'registros-empresas';
    const fileUrls: { [key: string]: string[] } = {};

    try {
      const uploadMultipleFiles = async (
        fieldName: string,
        fileArray: Express.Multer.File[],
      ): Promise<string[]> => {
        if (!fileArray || fileArray.length === 0) return [];

        const uploadPromises = fileArray.map((file, index) => {
          const filePath = `public/${fieldName}/${Date.now()}-${index}-${file.originalname}`;
          return supabaseClient.storage
            .from(bucketName)
            .upload(filePath, file.buffer, { contentType: file.mimetype });
        });

        const uploadResults = await Promise.all(uploadPromises);

        const uploadErrors = uploadResults.filter((result) => result.error);
        if (uploadErrors.length > 0) {
          const errorMessages = uploadErrors
            .map((e) => (e.error ? e.error.message : 'Unknown upload error'))
            .join(', ');
          console.error(
            `Error subiendo archivos para ${fieldName}:`,
            errorMessages,
          );
          throw new InternalServerErrorException(
            `Fallo al subir archivos para: ${fieldName}`,
          );
        }

        // FIX: Lógica de mapeo y filtrado a prueba de nulos.
        return (
          uploadResults
            .map((result) => {
              // Primero, comprobamos si 'result.data' existe.
              if (result.data) {
                return supabaseClient.storage
                  .from(bucketName)
                  .getPublicUrl(result.data.path).data.publicUrl;
              }
              // Si no existe, devolvemos null explícitamente.
              return null;
            })
            // Luego, filtramos todos los valores nulos del array final.
            .filter((url): url is string => url !== null)
        );
      };

      const uploadTasks = Object.keys(files).map((fieldName) =>
        uploadMultipleFiles(fieldName, files[fieldName]).then((urls) => {
          if (urls.length > 0) {
            fileUrls[`${fieldName}_urls`] = urls;
          }
        }),
      );
      await Promise.all(uploadTasks);

      console.log('URLs de archivos generadas:', fileUrls);

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

      const { data, error } = await supabaseClient
        .from('registros_market')
        .insert([dataToInsert])
        .select();

      if (error) {
        console.error('Error de Supabase al insertar registro:', error.message);
        throw new InternalServerErrorException(
          'No se pudo guardar el registro en la base de datos.',
        );
      }

      console.log('Registro de empresa guardado con éxito:', data[0]);
      return {
        message: 'Registro de empresa procesado con éxito!',
        data: data[0],
      };
    } catch (error) {
      console.error('Error en procesarRegistroEmpresa:', error);
      throw error instanceof InternalServerErrorException
        ? error
        : new InternalServerErrorException('Error al procesar el registro.');
    }
  }

  /**
   * Procesa el formulario de onboarding de usuarios individuales (KYC).
   */
  async procesarSolicitudKyc(
    datosSolicitud: any,
    files: { [fieldname: string]: Express.Multer.File[] },
  ) {
    console.log('Servicio: Procesando solicitud de onboarding KYC...');
    const supabaseClient = this.supabaseService.getClient();
    const bucketName = 'kyc-documentos-usuarios';
    const fileUrls: { [key: string]: string[] } = {};

    try {
      const uploadMultipleFiles = async (
        fieldName: string,
        fileArray: Express.Multer.File[],
      ): Promise<string[]> => {
        if (!fileArray || fileArray.length === 0) return [];

        const uploadPromises = fileArray.map((file, index) => {
          const filePath = `public/${fieldName}/${Date.now()}-${index}-${file.originalname}`;
          return supabaseClient.storage
            .from(bucketName)
            .upload(filePath, file.buffer, { contentType: file.mimetype });
        });

        const uploadResults = await Promise.all(uploadPromises);

        const uploadErrors = uploadResults.filter((result) => result.error);
        if (uploadErrors.length > 0) {
          const errorMessages = uploadErrors
            .map((e) => (e.error ? e.error.message : 'Unknown upload error'))
            .join(', ');
          console.error(
            `Error subiendo archivos para ${fieldName}:`,
            errorMessages,
          );
          throw new InternalServerErrorException(
            `Fallo al subir archivos para: ${fieldName}`,
          );
        }

        // FIX: Lógica de mapeo y filtrado a prueba de nulos (aplicada aquí también).
        return uploadResults
          .map((result) => {
            if (result.data) {
              return supabaseClient.storage
                .from(bucketName)
                .getPublicUrl(result.data.path).data.publicUrl;
            }
            return null;
          })
          .filter((url): url is string => url !== null);
      };

      const uploadTasks = Object.keys(files).map((fieldName) =>
        uploadMultipleFiles(fieldName, files[fieldName]).then((urls) => {
          if (urls.length > 0) {
            fileUrls[`${fieldName}_urls`] = urls;
          }
        }),
      );
      await Promise.all(uploadTasks);

      console.log('URLs de archivos KYC generadas:', fileUrls);

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
        dj_origen_fondos: datosSolicitud.dj_origen_fondos,
        fondos_licitos: datosSolicitud.fondos_licitos === 'on',
        pep_status: datosSolicitud.pep_status,
        ...fileUrls,
      };

      const { data, error } = await supabaseClient
        .from('solicitudes_token')
        .insert([dataToInsert])
        .select();

      if (error) {
        console.error(
          'Error de Supabase al insertar solicitud KYC:',
          error.message,
        );
        throw new InternalServerErrorException(
          'No se pudo guardar la solicitud en la base de datos.',
        );
      }

      console.log('Solicitud KYC guardada con éxito:', data[0]);
      return {
        message: 'Solicitud de onboarding recibida y guardada con éxito!',
        data: data[0],
      };
    } catch (error) {
      console.error('Error inesperado en procesarSolicitudKyc:', error);
      throw new InternalServerErrorException(
        'Ocurrió un error inesperado al procesar la solicitud.',
      );
    }
  }
}
