/**
 * Valida un RUC ecuatoriano de forma básica. Verifica que tenga 13
 * dígitos numéricos. No implementa la lógica completa de verificación de
 * provincia ni dígito verificador, pero puede ampliarse según se requiera.
 */
export function validateRuc(ruc: string): boolean {
  return /^\d{13}$/.test(ruc);
}