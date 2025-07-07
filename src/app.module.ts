import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './mail/mail.module';
import { SupabaseModule } from './supabase/supabase.module'; // 1. Importa el nuevo módulo

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule, // 2. Añade SupabaseModule aquí
    MailModule,
  ],
  controllers: [],
  // 3. Ya no necesitamos providers ni exports aquí, porque SupabaseModule lo gestiona todo.
  providers: [],
})
export class AppModule {}
