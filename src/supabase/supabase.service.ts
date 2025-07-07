import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name); // Para mensajes bonitos en la consola
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.logger.log('Inicializando SupabaseService...');

    // --- AQUÍ ESTÁ LA MAGIA ---
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    // Verificamos si las variables de entorno existen.
    if (!supabaseUrl || !supabaseKey) {
      this.logger.error(
        'Variables de entorno SUPABASE_URL o SUPABASE_KEY no están definidas.',
      );
      // Lanzamos un error que detendrá el inicio de la aplicación.
      throw new Error('Variables de entorno de Supabase no configuradas.');
    }

    // Si llegamos aquí, TypeScript sabe que supabaseUrl y supabaseKey son strings.
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.logger.log('Cliente de Supabase inicializado correctamente.');
  }

  // Ahora el método getClient es mucho más simple.
  getClient(): SupabaseClient {
    return this.supabase;
  }
}
