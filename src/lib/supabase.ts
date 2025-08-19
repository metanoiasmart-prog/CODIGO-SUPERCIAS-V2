import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Obtiene un cliente de Supabase con el rol de servicio. Este cliente se
 * utiliza del lado del servidor para consultar y modificar datos en la base
 * de datos. Asegúrese de establecer las variables de entorno
 * `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` al desplegar la
 * aplicación.
 */
export function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Configuración de Supabase incompleta. Defina NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

/**
 * Obtiene un cliente de Supabase de solo lectura que se utiliza en el
 * navegador. Utiliza la clave anónima (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).
 */
export function getBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Configuración de Supabase incompleta. Defina NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  return createClient(url, anon);
}