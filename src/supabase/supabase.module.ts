import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

// El decorador @Global() es la clave.
// Hace que cualquier cosa que este módulo exporte esté disponible
// en toda la aplicación sin necesidad de importar este módulo en todos lados.
@Global()
@Module({
  // Registramos SupabaseService como el proveedor de este módulo.
  providers: [SupabaseService],
  // Exportamos SupabaseService para que otros módulos puedan usarlo.
  exports: [SupabaseService],
})
export class SupabaseModule {}
