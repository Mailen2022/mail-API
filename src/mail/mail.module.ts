import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';

@Module({
  // Le decimos a este módulo que su controlador es MailController
  controllers: [MailController],
  // Le decimos que su servicio es MailService
  providers: [MailService],
})
export class MailModule {}
