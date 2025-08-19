// Importamos el CSS global para Tailwind
import "@/styles/globals.css";

/**
 * Componente base de la aplicación. Importa los estilos globales y
 * renderiza la página seleccionada con sus propiedades.
 */
/**
 * Componente base de la aplicación.
 * Se omiten tipos específicos de Next.js para evitar errores de compilación
 * en este entorno sin los paquetes instalados. Simplemente desestructura
 * el componente de página y sus propiedades y los renderiza.
 */
export default function MyApp({ Component, pageProps }: any) {
  return <Component {...pageProps} />;
}