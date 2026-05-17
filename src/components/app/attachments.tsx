"use client";
import { useEffect, useState, useRef } from "react";
import { Upload, FileText, Image as ImgIcon, Trash2, Download, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES = [
  { v: "GENERAL", l: "Generico" },
  { v: "PHOTO", l: "Foto" },
  { v: "PDF", l: "PDF" },
  { v: "DICO", l: "DICO" },
  { v: "CERTIFICATE", l: "Certificato" },
  { v: "CONTRACT", l: "Contratto" },
  { v: "PRIVACY_CONSENT", l: "Consenso privacy" },
  { v: "ID_DOCUMENT", l: "Documento identità" },
  { v: "INVOICE_ATTACHMENT", l: "Allegato fattura" },
  { v: "PROJECT_PLAN", l: "Planimetria" },
  { v: "TECHNICAL_DRAWING", l: "Schema tecnico" },
  { v: "SAFETY_DOC", l: "Sicurezza" },
  { v: "REPORT_PDF", l: "Rapportino PDF" },
  { v: "OTHER", l: "Altro" },
];

export function Attachments({ entityType, entityId, title = "Allegati", accept = "*/*" }: { entityType: string; entityId: string; title?: string; accept?: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("GENERAL");
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    fetch(`/api/attachments?entityType=${entityType}&entityId=${entityId}`)
      .then(r => r.json())
      .then(d => setItems(d.attachments || []))
      .finally(() => setLoading(false));
  }
  useEffect(load, [entityType, entityId]);

  async function uploadFiles(files: FileList | File[]) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const form = new FormData();
    form.append("entityType", entityType);
    form.append("entityId", entityId);
    form.append("category", category);
    for (const f of Array.from(files)) form.append("files", f);
    try {
      const res = await fetch("/api/attachments", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json()).error || "Errore upload");
      toast.success(`${Array.from(files).length} file caricat${Array.from(files).length === 1 ? "o" : "i"}`);
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  }

  async function remove(id: string) {
    if (!confirm("Eliminare questo allegato?")) return;
    const res = await fetch(`/api/attachments?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Eliminato"); load(); }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer?.files?.length) uploadFiles(e.dataTransfer.files);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title} ({items.length})</span>
          <div className="flex items-center gap-2">
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="h-8 w-40">
              {CATEGORIES.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
            </Select>
            <Button type="button" size="sm" variant="outline" onClick={() => cameraRef.current?.click()} disabled={uploading}>
              <Camera className="h-3 w-3" /> Foto
            </Button>
            <Button type="button" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Carica
            </Button>
            <input ref={inputRef} type="file" multiple accept={accept} className="hidden" onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="border-2 border-dashed border-border rounded-lg p-4 min-h-[120px]"
        >
          {loading ? <div className="text-center py-6 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 inline animate-spin" /> Caricamento…</div> :
           items.length === 0 ? <div className="text-center py-6 text-muted-foreground text-sm">Trascina file qui o usa i bottoni sopra. Supporto: PDF, immagini, qualsiasi tipo.</div> :
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {items.map(a => {
                const isImg = a.mimeType?.startsWith("image/");
                return (
                  <div key={a.id} className="group relative rounded-lg border bg-card overflow-hidden">
                    <a href={a.url} target="_blank" rel="noopener" className="block aspect-square bg-muted">
                      {isImg ? <img src={a.url} alt={a.fileName} className="w-full h-full object-cover" /> :
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground"><FileText className="h-12 w-12" /><span className="text-xs mt-2 truncate px-2 max-w-full">{a.mimeType?.split("/")[1] || "file"}</span></div>}
                    </a>
                    <div className="p-2 text-xs">
                      <div className="truncate font-medium" title={a.fileName}>{a.fileName}</div>
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant="muted" className="text-[10px]">{a.category}</Badge>
                        <span className="text-[10px] text-muted-foreground">{formatDate(a.createdAt)}</span>
                      </div>
                    </div>
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={a.url} download className="h-7 w-7 bg-background/90 rounded-md flex items-center justify-center hover:bg-background"><Download className="h-3 w-3" /></a>
                      <button onClick={() => remove(a.id)} className="h-7 w-7 bg-destructive/90 text-destructive-foreground rounded-md flex items-center justify-center hover:bg-destructive"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          }
        </div>
      </CardContent>
    </Card>
  );
}
