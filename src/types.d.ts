/**
 * Declaraciones de módulos externos sin tipos para el compilador de
 * TypeScript. Al no tener instalados los paquetes en esta prueba, estos
 * módulos se declaran como 'any' para evitar errores de resolución de
 * módulos en la compilación.
 */
declare module "jszip" {
  const JSZip: any;
  export default JSZip;
}

declare module "@supabase/supabase-js" {
  export const createClient: any;
  export type SupabaseClient = any;
}

// Stub for React and JSX for the TypeScript compiler. Without installed
// packages, we provide minimal definitions to satisfy type checking.
declare module "react" {
  export const useState: any;
  export const useEffect: any;
  export const useContext: any;
  export const useRef: any;
  export const Fragment: any;
  const React: any;
  export default React;
}

// Stub for React DOM
declare module "react-dom" {
  const ReactDOM: any;
  export default ReactDOM;
}

// Stub for Next.js modules used in the project. These are declared as
// 'any' because the actual packages are not installed in this environment.
declare module "next/link" {
  const Link: any;
  export default Link;
}

declare module "next/router" {
  export const useRouter: any;
}

declare module "next/app" {
  export type AppProps = any;
}

declare module "next" {
  export interface NextApiRequest {
    [key: string]: any;
  }
  export interface NextApiResponse<T = any> {
    status: (code: number) => NextApiResponse<T>;
    json: (body: any) => NextApiResponse<T>;
    end: () => void;
    setHeader: (name: string, value: string | number) => NextApiResponse<T>;
    send: (body: any) => NextApiResponse<T>;
  }
}

// Provide a JSX namespace so that JSX syntax is accepted. This allows
// components like <div> and <Link> without type errors.
declare namespace JSX {
  interface IntrinsicElements {
    [elem: string]: any;
  }
  interface Element extends HTMLElement {}
}