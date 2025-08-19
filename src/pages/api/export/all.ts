import type { NextApiRequest, NextApiResponse } from "next";
import JSZip from "jszip";
import { buildAllFiles } from "@/utils/export";

/**
 * API route que recibe un companyId y devuelve los cuatro archivos TXT
 * comprimidos en un ZIP. Si ocurre algún error, responde con código 500.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const companyId =
    req.method === "GET"
      ? (req.query.companyId as string)
      : (req.body?.companyId as string);
  if (!companyId) {
    res.status(400).json({ error: "Falta companyId" });
    return;
  }
  try {
    const files = await buildAllFiles(companyId);
    const zip = new JSZip();
    files.forEach((f) => {
      zip.file(f.filename, f.content);
    });
    const buffer = await zip.generateAsync({ type: "nodebuffer" });
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="TXT_SCVS_${companyId}.zip"`
    );
    res.send(buffer);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Error generando archivos" });
  }
}