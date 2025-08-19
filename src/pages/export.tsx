import { useState } from "react";

/**
 * Página simple para generar y descargar los archivos TXT de la SCVS y,
 * opcionalmente, enviarlos por correo. Permite introducir el `companyId`
 * y, en caso de envío, el correo de destino. Utiliza las API routes
 * definidas en `/api/export/all` y `/api/email/send`.
 */
export default function ExportPage() {
  const [companyId, setCompanyId] = useState("");
  const [emailTo, setEmailTo] = useState("");

  const handleDownload = () => {
    if (!companyId) {
      alert("Ingresa un companyId");
      return;
    }
    window.location.href = `/api/export/all?companyId=${encodeURIComponent(
      companyId
    )}`;
  };

  const handleSendEmail = async () => {
    if (!companyId || !emailTo) {
      alert("Ingresa companyId y correo de destino");
      return;
    }
    const resp = await fetch("/api/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        companyId,
        to: emailTo
      })
    });
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      alert(data.error || "Error en el envío de correo");
      return;
    }
    alert("Correo enviado correctamente");
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "2rem",
        fontFamily: "system-ui"
      }}
    >
      <h1>Generar archivos TXT</h1>
      <p>Ingresa el identificador de la empresa (companyId) para generar los archivos.</p>
      <div style={{ marginBottom: 16 }}>
        <label>Company ID</label>
        <input
          type="text"
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          placeholder="UUID de la empresa"
          style={{ width: "100%", padding: 8, marginTop: 4, marginBottom: 12 }}
        />
        <button onClick={handleDownload}>Descargar ZIP (4 TXT)</button>
      </div>
      <hr />
      <h2>Envío por correo</h2>
      <p>Introduce un correo electrónico para enviar los archivos adjuntos.</p>
      <label>Correo destino</label>
      <input
        type="email"
        value={emailTo}
        onChange={(e) => setEmailTo(e.target.value)}
        placeholder="ejemplo@dominio.com"
        style={{ width: "100%", padding: 8, marginTop: 4, marginBottom: 12 }}
      />
      <button onClick={handleSendEmail}>Enviar por correo</button>
    </div>
  );
}