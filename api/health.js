import { isNotionConfigured } from "../lib/notion-log.js";

export default function handler(_req, res) {
  res.status(200).json({
    ok: true,
    notionConfigured: isNotionConfigured()
  });
}
