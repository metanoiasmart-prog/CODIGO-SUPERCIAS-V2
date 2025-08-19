import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabaseClient";
import Link from "next/link";

interface Company {
  id: string;
  razon_social: string;
  ruc: string;
  periodo: number;
}

interface Line {
  code: string;
  value: number;
  description?: string;
}

// Tipos de estado
const STATE_TYPES = [
  { tipo: "ESF", title: "Estado de Situación Financiera" },
  { tipo: "ERI", title: "Estado de Resultado Integral" },
  { tipo: "EFE", title: "Estado de Flujo de Efectivo" },
  { tipo: "ECP", title: "Estado de Cambios en el Patrimonio" }
] as const;

/**
 * Página que muestra los cuatro estados financieros calculados para una
 * empresa. Suma automáticamente los saldos de las cuentas por código SCVS
 * y los presenta en tablas independientes. Incluye un chequeo básico de
 * equilibrio entre activo y pasivo + patrimonio.
 */
export default function StatesPage() {
  const router = useRouter();
  const { companyId } = router.query;
  const supabase = getBrowserClient();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState({});
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (!companyId) return;
    async function loadData() {
      setLoading(true);
      try {
        // Load company data
        const { data: companyData, error: companyErr } = await supabase
          .from("companies")
          .select("id, razon_social, ruc, periodo")
          .eq("id", companyId as string)
          .single();
        if (companyErr) throw new Error(companyErr.message);
        setCompany(companyData);

        // For each state type, compute lines
        const stateResults: Record<string, Line[]> = {};
        for (const { tipo } of STATE_TYPES) {
          const lines = await computeLines(companyId as string, tipo);
          stateResults[tipo] = lines;
        }
        setStates(stateResults);

        // Simple validation: Activo total (código 1) = Pasivo + Patrimonio (código 2)
        const esf = stateResults["ESF"];
        if (esf) {
          const totalActivo = esf.find((l) => l.code === "1")?.value ?? 0;
          const totalPasivoPatr = esf.find((l) => l.code === "2")?.value ?? 0;
          if (totalActivo !== totalPasivoPatr) {
            setErrors([
              `El total de activos (codigo 1) es ${totalActivo.toFixed(
                2
              )} y no coincide con el total de pasivo+patrimonio (codigo 2): ${
                totalPasivoPatr.toFixed(2)
              }.`
            ]);
          }
        }
      } catch (err: any) {
        console.error(err);
        setErrors([err.message]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [companyId, supabase]);

  /**
   * Calcula las líneas de un estado dado sumando saldos de cuentas mapeadas
   * por código SCVS y aplicando ajustes si existen. El orden de los
   * códigos se respeta según la columna `orden`.
   */
  async function computeLines(companyId: string, tipo: string) {
    // Obtener códigos del estado
    const { data: codes, error: codesErr } = await supabase
      .from("codigo_scvs")
      .select("code, descripcion, orden")
      .eq("tipo_estado", tipo)
      .order("orden", { ascending: true });
    if (codesErr) throw new Error(codesErr.message);
    // Obtener cuentas de la empresa
    const { data: accounts, error: accountsErr } = await supabase
      .from("accounts")
      .select("codigo_scvs, saldo")
      .eq("company_id", companyId)
      .not("codigo_scvs", "is", null);
    if (accountsErr) throw new Error(accountsErr.message);
    // Obtener ajustes
    const { data: adjustments, error: adjErr } = await supabase
      .from("ajustes")
      .select("code, value")
      .eq("company_id", companyId);
    if (adjErr) throw new Error(adjErr.message);
    // Sumar valores
    const sumByCode = new Map<string, number>();
    (accounts || []).forEach((acc: any) => {
      const code = acc.codigo_scvs;
      const prev = sumByCode.get(code) ?? 0;
      sumByCode.set(code, prev + Number(acc.saldo || 0));
    });
    const adjByCode = new Map<string, number>();
    (adjustments || []).forEach((adj: any) => {
      const code = adj.code;
      const prev = adjByCode.get(code) ?? 0;
      adjByCode.set(code, prev + Number(adj.value || 0));
    });
    // Construir array
    const lines: Line[] = (codes || []).map((c: any) => {
      const value = (sumByCode.get(c.code) ?? 0) + (adjByCode.get(c.code) ?? 0);
      return { code: c.code, value, description: c.descripcion };
    });
    return lines;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              {company ? company.razon_social : "Cargando..."}
            </h1>
            {company && (
              <p className="text-gray-600">
                RUC: {company.ruc} · Periodo: {company.periodo}
              </p>
            )}
          </div>
          <Link href="/" className="text-indigo-600 hover:underline">
            ← Volver a empresas
          </Link>
        </header>
        {loading ? (
          <p>Cargando estados financieros...</p>
        ) : (
          <>
            {errors.length > 0 && (
              <div className="bg-red-100 text-red-800 p-3 rounded-md mb-4">
                {errors.map((e, idx) => (
                  <p key={idx}>{e}</p>
                ))}
              </div>
            )}
            {STATE_TYPES.map(({ tipo, title }) => (
              <div key={tipo} className="mb-8">
                <h2 className="text-lg font-semibold mb-2">{title}</h2>
                {states[tipo] && states[tipo].length > 0 ? (
                  <div className="overflow-x-auto border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                            Código
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                            Descripción
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">
                            Valor
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {states[tipo].map((line) => (
                          <tr key={line.code} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-800">
                              {line.code}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-800">
                              {line.description}
                            </td>
                            <td className="px-3 py-2 text-sm text-right text-gray-800">
                              {line.value.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No hay datos para este estado.</p>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}