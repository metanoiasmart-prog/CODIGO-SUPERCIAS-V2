import { getAdminClient } from "@/lib/supabaseClient";

// Tipo de estado financiero según el catálogo SCVS
export type TipoEstado = "ESF" | "ERI" | "EFE" | "ECP";

/**
 * Línea de salida con código SCVS y valor asociado. Se usa para generar los
 * archivos de texto en el formato requerido por la Superintendencia de
 * Compañías. Los valores negativos se representan con el signo menos.
 */
export interface Line {
  code: string;
  value: number;
}

/**
 * Formatea un número a dos decimales con separador decimal punto y sin
 * separador de miles.
 */
function formatNumber(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Convierte un arreglo de líneas en un texto listo para exportar. El formato
 * es `código<TAB>valor` en cada línea, con saltos de línea al final de cada
 * renglón. Por ejemplo:
 *
 * ```
 * 10101\t1234.56\n
 * 10102\t0.00\n
 * ```
 */
function linesToTxt(lines: Line[]): string {
  return lines
    .map((l) => `${l.code}\t${formatNumber(l.value)}`)
    .join("\n");
}

/**
 * Consulta todos los códigos SCVS para un tipo de estado y suma los saldos
 * de todas las cuentas de la empresa asignadas a cada código. Añade
 * cualquier ajuste registrado para ese código (tabla `ajustes`). Devuelve
 * un arreglo de líneas ordenadas.
 */
async function getLines(
  companyId: string,
  tipoEstado: TipoEstado
): Promise<Line[]> {
  const supabase = getAdminClient();

  // Obtener lista de códigos SCVS ordenados por el campo 'orden'
  const { data: codes, error: codesError } = await supabase
    .from("codigo_scvs")
    .select("code, orden")
    .eq("tipo_estado", tipoEstado)
    .order("orden", { ascending: true });
  if (codesError) throw codesError;

  // Obtener cuentas mapeadas de la empresa
  const { data: accounts, error: accountsError } = await supabase
    .from("accounts")
    .select("codigo_scvs, saldo")
    .eq("company_id", companyId)
    .not("codigo_scvs", "is", null);
  if (accountsError) throw accountsError;

  // Obtener ajustes por código de la empresa
  const { data: adjustments, error: adjustmentsError } = await supabase
    .from("ajustes")
    .select("code, value")
    .eq("company_id", companyId);
  if (adjustmentsError) throw adjustmentsError;

  // Crear mapas para acumular saldos y ajustes por código
  const sumByCode = new Map<string, number>();
  (accounts || []).forEach((a) => {
    if (!a.codigo_scvs) return;
    const prev = sumByCode.get(a.codigo_scvs) ?? 0;
    sumByCode.set(a.codigo_scvs, prev + Number(a.saldo || 0));
  });

  const adjByCode = new Map<string, number>();
  (adjustments || []).forEach((a) => {
    const prev = adjByCode.get(a.code) ?? 0;
    adjByCode.set(a.code, prev + Number(a.value || 0));
  });

  // Construir el arreglo de líneas respetando el orden oficial
  const lines: Line[] = (codes || []).map((c) => {
    const total = (sumByCode.get(c.code) ?? 0) + (adjByCode.get(c.code) ?? 0);
    return { code: c.code, value: total };
  });

  return lines;
}

/**
 * Construye el contenido de un archivo TXT para un tipo de estado financiero
 * específico. Devuelve el nombre del archivo y su contenido.
 */
async function buildFile(
  companyId: string,
  tipoEstado: TipoEstado,
  filename: string
): Promise<{ filename: string; content: string }> {
  const lines = await getLines(companyId, tipoEstado);
  return {
    filename,
    content: linesToTxt(lines)
  };
}

/**
 * Construye los cuatro archivos TXT (ESF, ERI, EFE, ECP) para la empresa
 * indicada y los devuelve en un arreglo. Cada elemento contiene el nombre
 * de archivo y su contenido ya formateado.
 */
export async function buildAllFiles(companyId: string) {
  const [esf, eri, efe, ecp] = await Promise.all([
    buildFile(companyId, "ESF", "ESTADO_SITUACION_FINANCIERA.txt"),
    buildFile(companyId, "ERI", "ESTADO_RESULTADO_INTEGRAL.txt"),
    buildFile(companyId, "EFE", "ESTADO_FLUJO_EFECTIVO.txt"),
    buildFile(companyId, "ECP", "ESTADO_CAMBIOS_PATRIMONIO.txt")
  ]);
  return [esf, eri, efe, ecp];
}