import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { suggestMappings } from "@/utils/suggest";

interface Company {
  id: string;
  razon_social: string;
  ruc: string;
  periodo: number;
}

interface Account {
  id: string;
  codigo_contable: string;
  nombre: string;
  saldo: number;
  codigo_scvs: string | null;
}

interface CodeSCVS {
  code: string;
  descripcion: string;
  tipo_estado: string;
  orden: number;
}

/**
 * Página para gestionar el mapeo de cuentas de una empresa hacia los
 * códigos oficiales SCVS. Presenta las cuentas en una tabla editable y
 * permite seleccionar un código para cada una. También muestra la
 * información de la empresa y un enlace para volver.
 */
export default function CompanyAccountsPage() {
  const router = useRouter();
  const { companyId } = router.query;
  const [company, setCompany] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  // Conjunto de IDs de cuentas que han recibido mapeo sugerido. Esto
  // permite resaltar visualmente las filas modificadas después de aplicar
  // las sugerencias automáticas.
  const [suggested, setSuggested] = useState(new Set());
  const supabase = getBrowserClient();

  useEffect(() => {
    if (!companyId) return;
    async function loadData() {
      try {
        // Fetch company
        const { data: companyData, error: companyErr } = await supabase
          .from("companies")
          .select("id, razon_social, ruc, periodo")
          .eq("id", companyId as string)
          .single();
        if (companyErr) throw new Error(companyErr.message);
        setCompany(companyData);

        // Fetch codes SCVS
        const { data: codesData, error: codesErr } = await supabase
          .from("codigo_scvs")
          .select("code, descripcion, tipo_estado, orden")
          .order("tipo_estado")
          .order("orden");
        if (codesErr) throw new Error(codesErr.message);
        setCodes(codesData ?? []);

        // Fetch accounts
        const { data: accountsData, error: accountsErr } = await supabase
          .from("accounts")
          .select(
            "id, codigo_contable, nombre, saldo, codigo_scvs"
          )
          .eq("company_id", companyId as string)
          .order("codigo_contable");
        if (accountsErr) throw new Error(accountsErr.message);
        setAccounts(accountsData ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [companyId, supabase]);

  const handleMappingChange = async (
    accountId: string,
    newCode: string | null
  ) => {
    const { error } = await supabase
      .from("accounts")
      .update({ codigo_scvs: newCode })
      .eq("id", accountId);
    if (error) {
      alert("Error al actualizar mapeo: " + error.message);
    } else {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === accountId ? { ...a, codigo_scvs: newCode } : a
        )
      );
    }
  };

  const unassignedCount = accounts.filter((a) => !a.codigo_scvs).length;

  /**
   * Aplica sugerencias de mapeo a las cuentas sin código. Utiliza
   * heurísticas simples definidas en utils/suggest.ts. Para cada cuenta
   * sin código que obtenga sugerencia, actualiza la base de datos y
   * marca la cuenta como sugerida para destacar la fila. Si no se
   * encuentran sugerencias, informa al usuario.
   */
  async function handleSuggest() {
    const suggestions = suggestMappings(accounts);
    if (Object.keys(suggestions).length === 0) {
      alert(
        "No se encontraron sugerencias automáticas para las cuentas sin código. Revisa manualmente."
      );
      return;
    }
    // Actualizar sugerencias en Supabase
    const updatePromises = Object.entries(suggestions).map(([id, code]) =>
      supabase.from("accounts").update({ codigo_scvs: code }).eq("id", id)
    );
    const results = await Promise.all(updatePromises);
    const errors = results.filter((r) => r.error).map((r) => r.error!.message);
    if (errors.length > 0) {
      alert("Error al aplicar sugerencias: " + errors.join(", "));
    }
    // Actualizar estado local de cuentas
    setAccounts((prev) =>
      prev.map((acc) => {
        const newCode = suggestions[acc.id];
        if (newCode) {
          return { ...acc, codigo_scvs: newCode };
        }
        return acc;
      })
    );
    // Registrar IDs sugeridos para resaltar filas
    setSuggested(new Set(Object.keys(suggestions)));
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex justify-between items-center">
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
          <Link
            href="/"
            className="text-indigo-600 hover:underline"
          >
            ← Volver a empresas
          </Link>
        </header>
        {loading ? (
          <p>Cargando datos...</p>
        ) : accounts.length === 0 ? (
          <p>No hay cuentas cargadas para esta empresa.</p>
        ) : (
          <>
            {unassignedCount > 0 && (
              <p className="mb-2 text-yellow-600 font-medium">
                {unassignedCount} cuenta(s) sin código asignado. Debes asignar
                un código a cada cuenta para que los archivos TXT se generen
                correctamente.
              </p>
            )}
            {/* Botón para sugerir códigos automáticamente */}
            <div className="mb-4">
              <button
                onClick={handleSuggest}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Sugerir mapeo automáticamente
              </button>
            </div>
            <div className="overflow-x-auto border rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                      Código contable
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                      Nombre
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">
                      Saldo
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                      Código SCVS
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accounts.map((acc) => (
                    <tr
                      key={acc.id}
                      className={`hover:bg-gray-50 ${suggested.has(acc.id) ? "bg-green-50" : ""}`}
                    >
                      <td className="px-3 py-2 text-sm text-gray-800">
                        {acc.codigo_contable}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-800">
                        {acc.nombre}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-800 text-right">
                        {acc.saldo.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-800">
                        <select
                          value={acc.codigo_scvs ?? ""}
                          onChange={(e) =>
                            handleMappingChange(
                              acc.id,
                              e.target.value || null
                            )
                          }
                          className="w-full border border-gray-300 rounded-md p-1"
                        >
                          <option value="">(Seleccionar)</option>
                          {codes.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code} – {c.descripcion}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}