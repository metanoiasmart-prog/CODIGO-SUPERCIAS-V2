import { getAdminClient } from "@/lib/supabaseClient";

export type TipoEstado = "ESF" | "ERI" | "EFE" | "ECP";

export interface Line {
  code: string;
  value: number;
}

function formatNumber(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function linesToTxt(lines: Line[]): string {
  return lines.map((l) => `${l.code}\t${formatNumber(l.value)}`).join("\n");
}

async function computeLines(companyId: string, tipo: TipoEstado): Promise<Line[]> {
  const supabase = getAdminClient();
  const { data: codes, error: codesErr } = await supabase
    .from("codigo_scvs")
    .select("code, orden")
    .eq("tipo_estado", tipo)
    .order("orden", { ascending: true });
  if (codesErr) throw new Error(codesErr.message);
  const { data: accounts, error: accountsErr } = await supabase
    .from("accounts")
    .select("codigo_scvs, saldo")
    .eq("company_id", companyId)
    .not("codigo_scvs", "is", null);
  if (accountsErr) throw new Error(accountsErr.message);
  const { data: adjustments, error: adjErr } = await supabase
    .from("ajustes")
    .select("code, value")
    .eq("company_id", companyId);
  if (adjErr) throw new Error(adjErr.message);
  const sumByCode = new Map<string, number>();
  (accounts || []).forEach((acc: any) => {
    const code = acc.codigo_scvs as string;
    const prev = sumByCode.get(code) ?? 0;
    sumByCode.set(code, prev + Number(acc.saldo || 0));
  });
  const adjByCode = new Map<string, number>();
  (adjustments || []).forEach((adj: any) => {
    const code = adj.code as string;
    const prev = adjByCode.get(code) ?? 0;
    adjByCode.set(code, prev + Number(adj.value || 0));
  });
  const lines: Line[] = (codes || []).map((c: any) => {
    const value = (sumByCode.get(c.code) ?? 0) + (adjByCode.get(c.code) ?? 0);
    return { code: c.code, value };
  });
  return lines;
}

async function buildFile(
  companyId: string,
  tipo: TipoEstado,
  filename: string
): Promise<{ filename: string; content: string }> {
  const lines = await computeLines(companyId, tipo);
  return { filename, content: linesToTxt(lines) };
}

export async function buildAllFiles(companyId: string) {
  const [esf, eri, efe, ecp] = await Promise.all([
    buildFile(companyId, "ESF", "ESTADO_SITUACION_FINANCIERA.txt"),
    buildFile(companyId, "ERI", "ESTADO_RESULTADO_INTEGRAL.txt"),
    buildFile(companyId, "EFE", "ESTADO_FLUJO_EFECTIVO.txt"),
    buildFile(companyId, "ECP", "ESTADO_CAMBIOS_PATRIMONIO.txt")
  ]);
  return [esf, eri, efe, ecp];
}