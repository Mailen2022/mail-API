/**
 * @file mail.controller.ts
 * @description Define los endpoints de la API para la recepción de formularios.
 * Este controlador actúa como la puerta de entrada para las peticiones HTTP,
 * validando la entrada inicial y delegando la lógica de negocio al MailService.
 */

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { MailService } from './mail.service';

/**
 * @class MailController
 * @brief Gestiona todas las rutas bajo el prefijo '/formularios'.
 */
@Controller('formularios')
export class MailController {
  /**
   * Inyecta el MailService para acceder a la lógica de negocio.
   * @param mailService Instancia de MailService gestionada por NestJS.
   */
  constructor(private readonly mailService: MailService) {}

  /**
   * @endpoint POST /formularios/registro-empresa
   * @description Recibe y procesa el formulario de registro de empresas (KYB).
   * Utiliza FileFieldsInterceptor para manejar múltiples campos de carga de archivos.
   * @param files Objeto que contiene todos los archivos subidos, clasificados por campo.
   * @param datosEmpresa Objeto que contiene todos los campos de texto del formulario.
   * @returns Una promesa con el resultado de la operación.
   */
  @Post('registro-empresa')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'organigrama', maxCount: 5 },
      { name: 'geolocalizacion', maxCount: 5 },
      { name: 'comprobante_domicilio', maxCount: 5 },
      { name: 'constancia_domicilio_fiscal', maxCount: 5 },
      { name: 'estatuto_social', maxCount: 5 },
      { name: 'acta_constitucion', maxCount: 5 },
      { name: 'ultima_acta_designacion', maxCount: 5 },
      { name: 'comprobante_cuit', maxCount: 5 },
      { name: 'constancia_inscripcion', maxCount: 5 },
      { name: 'estados_financieros', maxCount: 5 },
      { name: 'constancia_bancaria', maxCount: 5 },
      { name: 'libro_acciones', maxCount: 5 },
      { name: 'docs_identidad_socios', maxCount: 10 },
      { name: 'manifestacion_bienes', maxCount: 10 },
      { name: 'dni_representantes', maxCount: 5 },
      { name: 'poder_notarial', maxCount: 5 },
    ]),
  )
  async registrarEmpresa(
    @UploadedFiles() files: { [key: string]: Express.Multer.File[] },
    @Body() datosEmpresa: any,
  ) {
    console.log(
      'Controlador: Recibiendo solicitud de registro de empresa KYB...',
    );
    return this.mailService.procesarRegistroEmpresa(datosEmpresa, files);
  }

  /**
   * @endpoint POST /formularios/kyc-persona-fisica
   * @description Recibe y procesa el formulario de onboarding de usuarios individuales (KYC).
   * Maneja tanto datos de texto como la carga de múltiples archivos de documentos.
   * @param files Objeto que contiene los archivos de documentos.
   * @param datosSolicitud Objeto que contiene los campos de texto del formulario.
   * @returns Una promesa con el resultado de la operación.
   */
  @Post('kyc-persona-fisica')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'documento_identidad', maxCount: 10 },
      { name: 'comprobante_domicilio_servicio', maxCount: 10 },
      { name: 'comprobante_domicilio_alternativo', maxCount: 10 },
    ]),
  )
  async recibirSolicitudKyc(
    @UploadedFiles() files: { [key: string]: Express.Multer.File[] },
    @Body() datosSolicitud: any,
  ) {
    console.log('Controlador: Recibiendo solicitud de onboarding KYC...');
    return this.mailService.procesarSolicitudKyc(datosSolicitud, files);
  }
}
