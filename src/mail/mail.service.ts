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
   * Sube todos los archivos a Supabase Storage y guarda los datos de texto junto con las URLs
   * de los archivos en la tabla 'registros_market'.
   * @param datosEmpresa Objeto con los datos de texto del formulario.
   * @param files Objeto con los archivos subidos.
   * @returns Un objeto con un mensaje de éxito y los datos guardados.
   */
  async procesarRegistroEmpresa(
    datosEmpresa: any,
    files: { [fieldname: string]: Express.Multer.File[] },
  ) {
    console.log('Servicio: Procesando registro de empresa KYB...');
    const supabaseClient = this.supabaseService.getClient();
    const bucketName = 'registros-empresas'; // Bucket de Supabase Storage para este formulario.
    const fileUrls: { [key: string]: string[] } = {};

    try {
      // Función auxiliar para subir un array de archivos de un campo específico.
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
          console.error(
            `Error subiendo archivos para ${fieldName}:`,
            uploadErrors.map((e) => e.error.message),
          );
          throw new InternalServerErrorException(
            `Fallo al subir archivos para: ${fieldName}`,
          );
        }

        return uploadResults.map((result) => {
          return supabaseClient.storage
            .from(bucketName)
            .getPublicUrl(result.data.path).data.publicUrl;
        });
      };

      // Procesa todos los campos de archivo concurrentemente.
      const uploadTasks = Object.keys(files).map((fieldName) =>
        uploadMultipleFiles(fieldName, files[fieldName]).then((urls) => {
          if (urls.length > 0) {
            fileUrls[`${fieldName}_urls`] = urls;
          }
        }),
      );
      await Promise.all(uploadTasks);

      console.log('URLs de archivos generadas:', fileUrls);

      // Prepara el objeto final para la inserción en la base de datos.
      const dataToInsert = {
        // Mapeo de campos de texto
        nombre_empresa: datosEmpresa.nombre_empresa,
        cuit_empresa: datosEmpresa.cuit_empresa,
        direccion_sede: datosEmpresa.direccion_sede,
        email_empresa: datosEmpresa.email_empresa,
        telefono_empresa: datosEmpresa.telefono_empresa,
        sitio_web: datosEmpresa.sitio_web,
        // Conversión del valor del checkbox a booleano
        fondos_licitos: datosEmpresa.fondos_licitos === 'on',
        // Inclusión de todas las URLs de archivos generadas
        ...fileUrls,
      };

      // Inserta el registro en la tabla 'registros_market'.
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
   * Procesa el formulario de solicitud de tokens de usuarios individuales (KYC).
   * Guarda los datos de texto en la tabla 'solicitudes_token'.
   * @param datosSolicitud Objeto con los datos de texto del formulario.
   * @returns Un objeto con un mensaje de éxito y los datos guardados.
   */
  async procesarSolicitudToken(datosSolicitud: any) {
    console.log(
      'Servicio: Procesando solicitud de token KYC...',
      datosSolicitud,
    );
    const tableName = 'solicitudes_token'; // Tabla de destino para este formulario.
    const supabaseClient = this.supabaseService.getClient();

    try {
      // Inserta el registro en la tabla 'solicitudes_token'.
      const { data, error } = await supabaseClient
        .from(tableName)
        .insert([
          {
            // Mapeo de todos los campos del formulario KYC
            nombre: datosSolicitud.nombre,
            apellido: datosSolicitud.apellido,
            cuit_cuil: datosSolicitud.cuit_cuil,
            domicilio: datosSolicitud.domicilio,
            email: datosSolicitud.email,
            telefono: datosSolicitud.telefono,
            capital_inversion: datosSolicitud.capital_inversion,
            motivo_interes: datosSolicitud.motivo_interes,
            experiencia_inversor: datosSolicitud.experiencia_inversor,
            comentarios: datosSolicitud.comentarios,
            // Aquí irían los campos del nuevo formulario KYC si los tuviera
          },
        ])
        .select();

      if (error) {
        console.error(
          'Error de Supabase al insertar solicitud:',
          error.message,
        );
        throw new InternalServerErrorException(
          'No se pudo guardar la solicitud en la base de datos.',
        );
      }

      console.log('Solicitud de token guardada con éxito:', data[0]);
      return {
        message: 'Solicitud de token recibida y guardada con éxito!',
        data: data[0],
      };
    } catch (error) {
      console.error('Error inesperado en procesarSolicitudToken:', error);
      throw new InternalServerErrorException(
        'Ocurrió un error inesperado al procesar la solicitud.',
      );
    }
  }
}
