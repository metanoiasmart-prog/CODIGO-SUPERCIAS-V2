import type { NextApiRequest, NextApiResponse } from "next";
import { buildAllFiles } from "@/utils/export";

/**
 * API route para enviar los cuatro archivos TXT por correo. Utiliza el
 * servicio Resend; requiere las variables RESEND_API_KEY y FROM_EMAIL.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }
  const { companyId, to } = req.body || {};
  if (!companyId || !to) {
    res.status(400).json({ error: "Faltan parámetros" });
    return;
  }
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@example.com";
  if (!RESEND_API_KEY) {
    res.status(500).json({ error: "Falta RESEND_API_KEY" });
    return;
  }
  try {
    const files = await buildAllFiles(String(companyId));
    const attachments = files.map((f) => ({
      filename: f.filename,
      content: Buffer.from(f.content).toString("base64")
    }));
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: `Archivos TXT SCVS - ${companyId}`,
        text:
          "Adjunto encontrarás los archivos TXT requeridos por la Superintendencia de Compañías.",
        attachments
      })
    });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Resend error: ${t}`);
    }
    res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Error enviando correo" });
  }
}