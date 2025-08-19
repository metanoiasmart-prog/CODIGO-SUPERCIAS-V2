import { useEffect, useState } from "react";
import Link from "next/link";
import { getBrowserClient } from "@/lib/supabaseClient";

interface Company {
  id: string;
  ruc: string;
  razon_social: string;
  periodo: number;
}

/**
 * Página de inicio: lista todas las empresas registradas y permite
 * navegar a secciones de administración de cuentas, visualización de
 * estados financieros y generación de archivos TXT. También ofrece un
 * enlace para crear una nueva empresa.
 */
export default function HomePage() {
  // `useState` se usa sin parámetros genéricos para evitar advertencias de TypeScript
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = getBrowserClient();

  useEffect(() => {
    async function fetchCompanies() {
      const { data, error } = await supabase
        .from("companies")
        .select("id, ruc, razon_social, periodo")
        .order("razon_social", { ascending: true });
      if (!error) setCompanies(data ?? []);
      setLoading(false);
    }
    fetchCompanies();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestión de Estados Financieros</h1>
          <p className="text-gray-600">
            Selecciona una empresa para administrar sus cuentas, revisar
            estados financieros o generar los archivos TXT requeridos por la
            Superintendencia.
          </p>
        </header>
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Empresas registradas</h2>
          <Link
            href="/companies/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            + Nueva empresa
          </Link>
        </div>
        {loading ? (
          <p>Cargando empresas...</p>
        ) : companies.length === 0 ? (
          <p>No hay empresas registradas.</p>
        ) : (
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className="bg-white rounded-md shadow p-4 flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-lg font-bold mb-1">
                    {company.razon_social}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">RUC: {company.ruc}</p>
                  <p className="text-sm text-gray-600 mb-3">
                    Periodo: {company.periodo}
                  </p>
                </div>
                <div className="flex flex-col gap-2 mt-auto">
                  <Link
                    href={`/accounts/${company.id}`}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Mapear cuentas
                  </Link>
                  <Link
                    href={`/states/${company.id}`}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Ver estados
                  </Link>
                  <Link
                    href={`/export/${company.id}`}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Exportar TXT
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}