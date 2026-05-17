import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const STORAGE_ROOT = process.env.STORAGE_ROOT || "/app/storage";
const PUBLIC_URL_PREFIX = "/api/files";

export async function saveFile(opts: {
  buffer: Buffer;
  filename: string;
  mime?: string;
  tenantId: string;
  folder?: string;
}): Promise<{ url: string; relativePath: string; sizeBytes: number }> {
  const safe = opts.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const id = crypto.randomBytes(8).toString("hex");
  const folder = (opts.folder || "general").replace(/[^a-z0-9-]/gi, "_");
  const rel = path.join(opts.tenantId, folder, `${Date.now()}-${id}-${safe}`);
  const abs = path.join(STORAGE_ROOT, rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, opts.buffer);
  return {
    url: `${PUBLIC_URL_PREFIX}/${rel.split(path.sep).join("/")}`,
    relativePath: rel,
    sizeBytes: opts.buffer.length,
  };
}

export async function saveDataUrl(opts: { dataUrl: string; filename: string; tenantId: string; folder?: string }) {
  const m = opts.dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!m) throw new Error("Invalid data URL");
  const buffer = Buffer.from(m[2], "base64");
  return saveFile({ buffer, filename: opts.filename, mime: m[1], tenantId: opts.tenantId, folder: opts.folder });
}

export async function readStoredFile(relativePath: string): Promise<Buffer> {
  const safe = relativePath.replace(/\.\./g, "").replace(/^\/+/, "");
  const abs = path.join(STORAGE_ROOT, safe);
  return fs.readFile(abs);
}

export function mimeOf(filename: string): string {
  const ext = (filename.split(".").pop() || "").toLowerCase();
  return ({
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
    xml: "application/xml",
    json: "application/json",
    csv: "text/csv",
  } as Record<string, string>)[ext] || "application/octet-stream";
}
