import React, { useState } from "react";
import { useRouter } from "next/router";
import { getBrowserClient } from "@/lib/supabaseClient";
import { validateRuc } from "@/utils/validation";

/**
 * Página para crear una nueva empresa. Permite ingresar RUC, razón social
 * y período contable. Valida el RUC de forma simple y guarda la
 * información en Supabase. Tras el guardado, redirige a la página
 * principal.
 */
export default function NewCompanyPage() {
  const [ruc, setRuc] = useState("");
  const [name, setName] = useState("");
  // El periodo puede ser un número o cadena vacía hasta que se complete
  const [period, setPeriod] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = getBrowserClient();

  async function handleSubmit(e: any) {
    e.preventDefault();
    setError(null);
    if (!validateRuc(ruc)) {
      setError("El RUC debe tener 13 dígitos numéricos.");
      return;
    }
    if (!name.trim()) {
      setError("La razón social es obligatoria.");
      return;
    }
    if (!period) {
      setError("El periodo contable es obligatorio.");
      return;
    }
    try {
      setLoading(true);
      // Insertar la empresa en la tabla companies
      const { error: insertError } = await supabase.from("companies").insert({
        ruc: ruc.trim(),
        razon_social: name.trim(),
        periodo: Number(period)
      });
      if (insertError) {
        throw new Error(insertError.message);
      }
      // Redirige a la página principal
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 flex justify-center">
      <div className="max-w-md w-full bg-white rounded-md shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Crear nueva empresa</h1>
        {error && <p className="text-red-600 mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RUC
            </label>
            <input
              type="text"
              value={ruc}
              onChange={(e) => setRuc(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Número de RUC (13 dígitos)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Razón social
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Nombre de la empresa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Periodo contable (año)
            </label>
            <input
              type="number"
              min="1900"
              max="2100"
              value={period}
              onChange={(e) =>
                setPeriod(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Año"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Crear empresa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}