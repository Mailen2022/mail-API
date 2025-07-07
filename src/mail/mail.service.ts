import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service'; // Importamos nuestro servicio de Supabase

// Define una interfaz para los datos del formulario.
// Esto ayuda a que TypeScript sepa qué tipo de datos esperamos.
interface FormularioContactoDto {
  nombre: string;
  email: string;
  mensaje: string;
  // Añade aquí cualquier otro campo que tengas en tu formulario
}

@Injectable()
export class MailService {
  // Inyectamos el servicio de Supabase para poder usarlo aquí
  constructor(private readonly supabase: SupabaseService) {}

  // ====================================================================
  // === NUEVO MÉTODO PARA PROCESAR EL REGISTRO DE EMPRESAS ===
  // ====================================================================
  async procesarRegistroEmpresa(
    datosEmpresa: any,
    files: {
      logo_empresa?: Express.Multer.File[];
      estatuto?: Express.Multer.File[];
      actas_asamblea?: Express.Multer.File[];
      libro_socios?: Express.Multer.File[];
      declaracion_jurada?: Express.Multer.File[];
      ultimo_balance?: Express.Multer.File[];
    },
  ) {
    console.log('Servicio: Procesando registro de empresa...');
    const supabaseClient = this.supabase.getClient();
    const bucketName = 'registros-empresas'; // RECOMENDACIÓN: Usa un bucket específico para estos archivos.

    // Objeto para almacenar las URLs públicas de los archivos subidos
    const fileUrls = {};

    try {
      // Función auxiliar para subir un archivo y obtener su URL
      const uploadFile = async (
        fieldName: string,
        file: Express.Multer.File,
      ) => {
        if (!file) return;

        // Creamos una ruta única para el archivo
        const filePath = `public/${fieldName}/${Date.now()}-${file.originalname}`;

        const { error: uploadError } = await supabaseClient.storage
          .from(bucketName)
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
          });

        if (uploadError) {
          console.error(`Error subiendo ${fieldName}:`, uploadError);
          throw new InternalServerErrorException(
            `No se pudo subir el archivo: ${fieldName}`,
          );
        }

        // Obtenemos la URL pública del archivo recién subido
        const { data: urlData } = supabaseClient.storage
          .from(bucketName)
          .getPublicUrl(filePath);
        fileUrls[`${fieldName}_url`] = urlData.publicUrl; // ej: fileUrls['logo_empresa_url'] = '...'
      };

      // 1. Subimos todos los archivos uno por uno usando nuestra función auxiliar
      //    Esto es más limpio y escalable que repetir el código para cada archivo.
      for (const fieldName in files) {
        if (files[fieldName] && files[fieldName][0]) {
          await uploadFile(fieldName, files[fieldName][0]);
        }
      }

      console.log('URLs de archivos generadas:', fileUrls);

      // 2. Preparamos el objeto de datos para insertar en la base de datos
      const dataToInsert = {
        // Datos de texto del formulario
        nombre_empresa: datosEmpresa.nombre_empresa,
        email_empresa: datosEmpresa.email_empresa,
        telefono_empresa: datosEmpresa.telefono_empresa,
        comentario_estatuto: datosEmpresa.comentario_estatuto,
        comentario_actas: datosEmpresa.comentario_actas,
        comentario_libro_socios: datosEmpresa.comentario_libro_socios,
        comentario_declaracion: datosEmpresa.comentario_declaracion,
        comentario_balance: datosEmpresa.comentario_balance,
        // URLs de los archivos que subimos
        ...fileUrls,
      };

      // 3. Guardamos toda la información en la base de datos
      //    RECOMENDACIÓN: Crea una nueva tabla para esto, ej: 'registros_market'
      const { data, error } = await supabaseClient
        .from('registros_market') // <-- ¡REEMPLAZA con el nombre de tu nueva tabla!
        .insert([dataToInsert])
        .select();

      if (error) {
        console.error(
          'Error de Supabase al insertar registro de empresa:',
          error.message,
        );
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
      // Aseguramos que cualquier error, ya sea de subida o de BD, sea capturado.
      console.error('Error en procesarRegistroEmpresa:', error);
      throw error instanceof InternalServerErrorException
        ? error
        : new InternalServerErrorException(
            'Error al procesar el registro de la empresa.',
          );
    }
  }

  async procesarSolicitudToken(datosSolicitud: any) {
    console.log('Servicio: Procesando solicitud de token...', datosSolicitud);

    // ¡IMPORTANTE! Deberás crear una nueva tabla para estas solicitudes,
    // o adaptar una existente. Vamos a asumir una nueva tabla llamada 'solicitudes_token'.
    const tableName = 'solicitudes_token';
    const supabaseClient = this.supabase.getClient();

    try {
      // Mapeamos los datos del formulario a las columnas de la base de datos.
      // Los nombres de las claves (ej. 'cuit_cuil') deben coincidir con el atributo 'name'
      // de los inputs de tu formulario HTML.
      const { data, error } = await supabaseClient
        .from(tableName)
        .insert([
          {
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

  async procesarFormularioConArchivos(
    datosDeTexto: any,
    files: { logo?: Express.Multer.File[]; estatuto?: Express.Multer.File[] },
  ) {
    const supabaseClient = this.supabase.getClient();
    const logoFile = files.logo ? files.logo[0] : null;
    const estatutoFile = files.estatuto ? files.estatuto[0] : null;

    let logoUrl: string | null = null;
    let estatutoUrl: string | null = null;

    try {
      // 1. Subir el logo a Supabase Storage si existe
      if (logoFile) {
        const logoPath = `public/logos/${Date.now()}-${logoFile.originalname}`;
        const { error: uploadError } = await supabaseClient.storage
          .from('nombre-de-tu-bucket') // <-- REEMPLAZA con el nombre de tu bucket en Supabase Storage
          .upload(logoPath, logoFile.buffer, {
            contentType: logoFile.mimetype,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabaseClient.storage
          .from('nombre-de-tu-bucket') // <-- REEMPLAZA
          .getPublicUrl(logoPath);
        logoUrl = urlData.publicUrl;
      }

      // 2. Subir el estatuto a Supabase Storage si existe
      if (estatutoFile) {
        const estatutoPath = `private/estatutos/${Date.now()}-${estatutoFile.originalname}`;
        const { error: uploadError } = await supabaseClient.storage
          .from('nombre-de-tu-bucket') // <-- REEMPLAZA
          .upload(estatutoPath, estatutoFile.buffer, {
            contentType: estatutoFile.mimetype,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabaseClient.storage
          .from('nombre-de-tu-bucket') // <-- REEMPLAZA
          .getPublicUrl(estatutoPath);
        estatutoUrl = urlData.publicUrl;
      }

      // 3. Guardar toda la información (incluyendo las URLs de los archivos) en la base de datos
      const { data, error } = await supabaseClient
        .from('contactos') // <-- REEMPLAZA con el nombre de tu tabla
        .insert([
          {
            nombre_empresa: datosDeTexto.nombre_empresa,
            email: datosDeTexto.email,
            telefono: datosDeTexto.telefono,
            comentario: datosDeTexto.comentario,
            logo_url: logoUrl, // Guarda la URL pública del logo
            estatuto_url: estatutoUrl, // Guarda la URL pública del estatuto
          },
        ])
        .select();

      if (error) {
        throw new InternalServerErrorException(
          'No se pudo guardar el registro en la base de datos.',
        );
      }

      return {
        message: 'Formulario y archivos procesados con éxito!',
        data: data[0],
      };
    } catch (error) {
      console.error('Error procesando formulario con archivos:', error);
      throw new InternalServerErrorException(
        'Error al procesar el formulario.',
      );
    }
  }

  // Esta es la función principal que el controlador llamará
  async procesarYGuardarFormulario(datosDelFormulario: FormularioContactoDto) {
    console.log('Servicio: Procesando datos...', datosDelFormulario);

    // ¡IMPORTANTE! Reemplaza 'contactos' con el nombre real de tu tabla en Supabase.
    const tableName = 'contactos';

    try {
      const { data, error } = await this.supabase
        .getClient()
        .from(tableName)
        .insert([
          {
            nombre: datosDelFormulario.nombre,
            email: datosDelFormulario.email,
            mensaje: datosDelFormulario.mensaje,
            // Mapea aquí los otros campos si los tienes
          },
        ])
        .select(); // .select() hace que Supabase devuelva el registro recién creado

      if (error) {
        // Si Supabase devuelve un error, lo lanzamos para que el controlador lo atrape.
        console.error('Error de Supabase:', error.message);
        throw new InternalServerErrorException(
          'No se pudo guardar el registro en la base de datos.',
        );
      }

      console.log('Registro guardado con éxito:', data);

      // En el futuro, aquí podrías llamar a la API de Replicate.
      // Por ejemplo: this.llamarReplicate(data[0].mensaje);

      return {
        message: 'Formulario recibido y guardado con éxito!',
        data: data[0], // Devolvemos el registro que se guardó
      };
    } catch (error) {
      // Atrapamos cualquier otro error que pueda ocurrir
      console.error('Error inesperado en el servicio:', error);
      throw new InternalServerErrorException(
        'Ocurrió un error inesperado al procesar el formulario.',
      );
    }
  }
}
