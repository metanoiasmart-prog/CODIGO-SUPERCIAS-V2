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

interface Account {
  codigo_scvs: string | null;
}

/**
 * Página dedicada a generar y descargar los cuatro archivos TXT de una
 * empresa. Comprueba que todas las cuentas estén mapeadas antes de
 * permitir la descarga o envío por correo. También muestra un resumen de
 * la empresa.
 */
export default function ExportPage() {
  const router = useRouter();
  const { companyId } = router.query;
  const supabase = getBrowserClient();
  const [company, setCompany] = useState(null);
  const [unmappedCount, setUnmappedCount] = useState(0);
  const [emailTo, setEmailTo] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loadingDownload, setLoadingDownload] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    async function loadData() {
      // Fetch company
      const { data: companyData } = await supabase
        .from("companies")
        .select("id, razon_social, ruc, periodo")
        .eq("id", companyId as string)
        .single();
      setCompany(companyData ?? null);
      // Count unmapped accounts
      const { count } = await supabase
        .from("accounts")
        .select("codigo_scvs", { count: "exact", head: false })
        .eq("company_id", companyId as string)
        .is("codigo_scvs", null);
      setUnmappedCount(count ?? 0);
    }
    loadData();
  }, [companyId, supabase]);

  async function handleDownload() {
    if (!companyId) return;
    if (unmappedCount > 0) {
      setError(
        "Existen cuentas sin código asignado. Por favor, mapea todas las cuentas antes de generar los archivos."
      );
      return;
    }
    setLoadingDownload(true);
    setError(null);
    setMessage(null);
    try {
      // Inicia descarga
      window.location.href = `/api/export/all?companyId=${companyId}`;
      setMessage("Descarga iniciada");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingDownload(false);
    }
  }

  async function handleSendEmail() {
    if (!companyId) return;
    if (unmappedCount > 0) {
      setError(
        "Existen cuentas sin código asignado. Por favor, mapea todas las cuentas antes de enviar los archivos."
      );
      return;
    }
    if (!emailTo) {
      setError("Ingresa un correo de destino");
      return;
    }
    setLoadingEmail(true);
    setError(null);
    setMessage(null);
    try {
      const resp = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, to: emailTo })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || "Error desconocido");
      setMessage("Correo enviado correctamente");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingEmail(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Exportar archivos TXT
            </h1>
            {company && (
              <p className="text-gray-600">
                {company.razon_social} – RUC: {company.ruc} – Periodo: {company.periodo}
              </p>
            )}
          </div>
          <Link href="/" className="text-indigo-600 hover:underline">
            ← Volver a empresas
          </Link>
        </header>
        {unmappedCount > 0 && (
          <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md mb-4">
            {unmappedCount} cuenta(s) sin código asignado. Debes mapear todas
            las cuentas en la sección de cuentas antes de exportar.
          </div>
        )}
        {error && (
          <div className="bg-red-100 text-red-800 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-green-100 text-green-800 p-3 rounded-md mb-4">
            {message}
          </div>
        )}
        <div className="space-y-6">
          <div>
            <button
              onClick={handleDownload}
              disabled={loadingDownload || unmappedCount > 0}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loadingDownload ? "Generando..." : "Descargar ZIP (4 TXT)"}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enviar a correo
            </label>
            <input
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="correo@dominio.com"
              className="w-full border border-gray-300 rounded-md p-2 mb-2"
            />
            <button
              onClick={handleSendEmail}
              disabled={loadingEmail || unmappedCount > 0}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loadingEmail ? "Enviando..." : "Enviar archivos por correo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}