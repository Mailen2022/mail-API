// src/mail/mail.controller.ts

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express'; // Usamos FileFieldsInterceptor para múltiples campos
import { MailService } from './mail.service';

@Controller('formularios')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('solicitud-token') // Nueva ruta: /formularios/solicitud-token
  @HttpCode(HttpStatus.CREATED)
  // Como este formulario no envía archivos, no necesitamos un interceptor.
  // Solo recibimos los datos del cuerpo de la petición.
  async recibirSolicitudToken(@Body() datosSolicitud: any) {
    // Llamamos al nuevo método que creamos en el servicio.
    return this.mailService.procesarSolicitudToken(datosSolicitud);
  }

  // ====================================================================
  // === NUEVO ENDPOINT PARA EL REGISTRO DE EMPRESAS EN EL MARKET ===
  // ====================================================================
  @Post('registro-empresa') // Nueva ruta: /formularios/registro-empresa
  @HttpCode(HttpStatus.CREATED)
  // 1. Configuramos el interceptor para que acepte TODOS los campos de archivo del nuevo formulario.
  //    Es crucial que los 'name' coincidan con los del HTML.
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo_empresa', maxCount: 1 },
      { name: 'estatuto', maxCount: 1 },
      { name: 'actas_asamblea', maxCount: 1 },
      { name: 'libro_socios', maxCount: 1 },
      { name: 'declaracion_jurada', maxCount: 1 },
      { name: 'ultimo_balance', maxCount: 1 },
    ]),
  )
  async registrarEmpresa(
    // 2. El decorador @UploadedFiles() recogerá todos los archivos en un objeto.
    @UploadedFiles()
    files: {
      logo_empresa?: Express.Multer.File[];
      estatuto?: Express.Multer.File[];
      actas_asamblea?: Express.Multer.File[];
      libro_socios?: Express.Multer.File[];
      declaracion_jurada?: Express.Multer.File[];
      ultimo_balance?: Express.Multer.File[];
    },
    // 3. El decorador @Body() recogerá todos los campos de texto.
    @Body() datosEmpresa: any,
  ) {
    console.log('Controlador: Recibiendo registro de empresa...');
    // 4. Delegamos toda la lógica compleja al nuevo método del servicio.
    return this.mailService.procesarRegistroEmpresa(datosEmpresa, files);
  }

  @Post('contacto')
  @HttpCode(HttpStatus.CREATED)
  // 1. Usamos el interceptor para decirle a NestJS qué campos de archivo esperar.
  // Usamos FileFieldsInterceptor porque son campos con nombres diferentes ('logo', 'estatuto').
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'estatuto', maxCount: 1 },
    ]),
  )
  // 2. La firma del método ahora recibe dos argumentos decorados:
  //    - @UploadedFiles() para los archivos.
  //    - @Body() para los campos de texto.
  async recibirDatos(
    @UploadedFiles()
    files: { logo?: Express.Multer.File[]; estatuto?: Express.Multer.File[] },
    @Body() datosDeTexto: any,
  ) {
    // Imprimimos en consola para depurar y verificar que todo llega correctamente.
    console.log('Controlador: Datos de texto recibidos ->', datosDeTexto);
    console.log('Controlador: Archivos recibidos ->', files);

    // 3. Delegamos el trabajo al servicio, pero ahora le pasamos tanto los datos de texto
    //    como los archivos para que el servicio se encargue de la lógica completa
    //    (ej. subir archivos a Supabase Storage, luego guardar todo en la base de datos).
    //
    //    NOTA: Necesitaremos crear este nuevo método 'procesarFormularioConArchivos' en tu MailService.
    return this.mailService.procesarFormularioConArchivos(datosDeTexto, files);
  }
}
