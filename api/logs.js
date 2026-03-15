import { createNotionLog } from "../lib/notion-log.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      error: "POST で呼び出してください。"
    });
  }

  const result = await createNotionLog(req.body, req.headers["user-agent"] || "");
  return res.status(result.status).json(result.payload);
}
