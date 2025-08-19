/**
 * Módulo de sugerencias de mapeo para cuentas contables.
 *
 * Este módulo proporciona una heurística simple para sugerir códigos SCVS
 * a las cuentas basándose en palabras clave en sus nombres. Las
 * sugerencias no sustituyen el criterio profesional de un contador;
 * simplemente buscan acelerar el proceso de mapeo proporcionando
 * coincidencias básicas.
 */

/**
 * Representa un código SCVS con su descripción. Sólo necesitamos
 * la estructura mínima para sugerir un código.
 */
export interface CodeEntry {
  code: string;
  descripcion: string;
}

/**
 * Lista de reglas heurísticas. Cada regla contiene un conjunto de
 * palabras clave (en minúsculas) y el código SCVS que se sugiere si el
 * nombre de la cuenta contiene alguna de esas palabras. Las reglas se
 * evalúan en orden y la primera coincidencia determina la sugerencia.
 */
const HEURISTIC_RULES: { keywords: string[]; code: string }[] = [
  // Efectivo y equivalentes
  { keywords: ["banco", "caja", "efectivo"], code: "10101" },
  // Cuentas por cobrar comerciales
  { keywords: ["cliente", "cuentas por cobrar", "cxp"], code: "103" },
  // Inventarios y mercaderías
  { keywords: ["inventario", "mercaderia", "mercaderías", "inventarios"], code: "105" },
  // Propiedades, planta y equipo
  { keywords: ["propiedad", "planta", "equipo", "maquinaria"], code: "121" },
  // Depreciación acumulada
  { keywords: ["depreciacion", "depreciación"], code: "12199" },
  // Proveedores (cuentas por pagar comerciales)
  { keywords: ["proveedor", "cuentas por pagar", "cxp"], code: "201" },
  // Capital social
  { keywords: ["capital"], code: "301" },
  // Ingresos por ventas
  { keywords: ["ventas", "ingresos", "operacional"], code: "410" },
  // Costos de ventas
  { keywords: ["costo de ventas", "costos", "costo"], code: "510" },
  // Gastos administrativos
  { keywords: ["gasto administrativo", "gastos administrativos", "administrativo"], code: "610" },
];

/**
 * Devuelve un código sugerido para una cuenta dada. La búsqueda se
 * realiza en minúsculas para ignorar mayúsculas/minúsculas. Si ninguna
 * regla coincide, se devuelve null.
 *
 * @param accountName Nombre de la cuenta contable.
 * @returns Código SCVS sugerido o null si no se encuentra coincidencia.
 */
export function suggestCode(accountName: string): string | null {
  const name = accountName.toLowerCase();
  for (const rule of HEURISTIC_RULES) {
    if (rule.keywords.some((kw) => name.includes(kw))) {
      return rule.code;
    }
  }
  return null;
}

/**
 * Toma una lista de cuentas (cada una con un identificador y nombre) y
 * devuelve un mapa de sugerencias. Para cada cuenta sin código
 * previamente asignado, se evalúan las reglas heurísticas y, si hay
 * coincidencia, se asigna el código sugerido.
 *
 * @param accounts Array de objetos con id y nombre de cuenta.
 * @returns Un mapa (id → código sugerido) con las sugerencias. Si no
 *          existe sugerencia para una cuenta, no se incluye en el mapa.
 */
export function suggestMappings(accounts: { id: string; nombre: string; codigo_scvs: string | null }[]) {
  const suggestions: Record<string, string> = {};
  accounts.forEach((acc) => {
    if (!acc.codigo_scvs) {
      const code = suggestCode(acc.nombre);
      if (code) {
        suggestions[acc.id] = code;
      }
    }
  });
  return suggestions;
}