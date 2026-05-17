"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { Package, Search, AlertTriangle, ArrowDownUp, Plus, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";

type InventoryRow = {
  id: string; code: string; metelCode?: string; name: string; brand?: string; category?: string;
  unit: string; unitPrice: number; stockMin: number; totalStock: number; belowMin: boolean;
  perWarehouse: { warehouseId: string; qty: number }[];
};

export default function WarehouseInventoryPage() {
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [showOnlyLow, setShowOnlyLow] = useState(false);
  const [loading, setLoading] = useState(true);

  const [editMat, setEditMat] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [adjust, setAdjust] = useState<{ materialId: string; materialName: string; warehouseId: string; warehouseName: string; current: number } | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (warehouseFilter) params.set("warehouseId", warehouseFilter);
    fetch(`/api/stock?${params}`).then(r => r.json()).then(d => {
      setInventory(d.inventory || []);
      setWarehouses(d.warehouses || []);
      setCategories(d.categories || []);
    }).finally(() => setLoading(false));
  }
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [q, category, warehouseFilter]);

  async function saveEdit() {
    if (!editMat) return;
    setEditing(true);
    try {
      const res = await fetch(`/api/materials/${editMat.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editMat),
      });
      if (!res.ok) throw new Error("Errore");
      toast.success("Articolo aggiornato");
      setEditMat(null); load();
    } catch (e: any) { toast.error(e.message); } finally { setEditing(false); }
  }

  async function saveAdjust() {
    if (!adjust) return;
    setAdjusting(true);
    try {
      const res = await fetch("/api/stock/adjust", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId: adjust.materialId, warehouseId: adjust.warehouseId, newQty: Number(adjustQty) }),
      });
      if (!res.ok) throw new Error("Errore");
      toast.success("Stock aggiornato");
      setAdjust(null); setAdjustQty("");
      load();
    } catch (e: any) { toast.error(e.message); } finally { setAdjusting(false); }
  }

  const displayed = showOnlyLow ? inventory.filter(i => i.belowMin) : inventory;
  const totalItems = inventory.length;
  const lowStock = inventory.filter(i => i.belowMin).length;
  const totalValue = inventory.reduce((s, i) => s + i.totalStock * i.unitPrice, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Magazzino" description={`${totalItems} articoli · ${lowStock} sotto scorta · ${formatCurrency(totalValue)} valore`}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link href="/admin/materials">Catalogo articoli</Link></Button>
            <Button asChild><Link href="/admin/purchase-orders/new"><Plus className="h-4 w-4" /> Nuovo ordine</Link></Button>
          </div>
        } />

      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4" /> Articoli</CardTitle></CardHeader><CardContent>
          <div className="font-display text-2xl font-bold">{totalItems}</div>
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-amber-600"><AlertTriangle className="h-4 w-4" /> Sotto scorta</CardTitle></CardHeader><CardContent>
          <div className="font-display text-2xl font-bold text-amber-600">{lowStock}</div>
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Valore stock</CardTitle></CardHeader><CardContent>
          <div className="font-display text-2xl font-bold">{formatCurrency(totalValue)}</div>
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Magazzini</CardTitle></CardHeader><CardContent>
          <div className="font-display text-2xl font-bold">{warehouses.length}</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <Label className="text-xs">Cerca</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10" placeholder="Nome, codice, METEL, marca…" value={q} onChange={e => setQ(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Tutte</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div>
              <Label className="text-xs">Magazzino</Label>
              <Select value={warehouseFilter} onChange={e => setWarehouseFilter(e.target.value)}>
                <option value="">Tutti</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showOnlyLow} onChange={e => setShowOnlyLow(e.target.checked)} />
              Mostra solo sotto scorta
            </label>
            <span className="text-muted-foreground text-xs">· {displayed.length} risultati</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /> Caricamento…</div>
          ) : displayed.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground"><Package className="h-7 w-7 mx-auto mb-2" />Nessun articolo trovato</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="p-3">Codice</th>
                    <th>Nome</th>
                    <th>Categoria</th>
                    <th className="text-right">Scorta min</th>
                    <th className="text-right">Stock totale</th>
                    {warehouses.map(w => <th key={w.id} className="text-right text-[10px]">{w.name}</th>)}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map(item => (
                    <tr key={item.id} className={`border-b last:border-0 ${item.belowMin ? "bg-amber-50 dark:bg-amber-950/20" : ""}`}>
                      <td className="p-3 font-mono text-xs">
                        {item.code}
                        {item.metelCode && <div className="text-muted-foreground">METEL {item.metelCode}</div>}
                      </td>
                      <td>
                        <div className="font-medium">{item.name}</div>
                        {item.brand && <div className="text-xs text-muted-foreground">{item.brand}</div>}
                      </td>
                      <td className="text-xs">{item.category && <Badge variant="muted">{item.category}</Badge>}</td>
                      <td className="text-right text-xs">{item.stockMin}</td>
                      <td className={`text-right font-bold ${item.belowMin ? "text-amber-600" : "text-emerald-600"}`}>
                        {item.totalStock.toLocaleString("it-IT")} {item.unit}
                        {item.belowMin && <div className="text-[10px] text-amber-600">⚠ sotto scorta</div>}
                      </td>
                      {warehouses.map(w => {
                        const pw = item.perWarehouse.find(p => p.warehouseId === w.id);
                        const qty = pw?.qty || 0;
                        return (
                          <td key={w.id} className="text-right text-xs">
                            <button
                              onClick={() => { setAdjust({ materialId: item.id, materialName: item.name, warehouseId: w.id, warehouseName: w.name, current: qty }); setAdjustQty(qty.toString()); }}
                              className="hover:bg-accent px-2 py-1 rounded font-mono"
                              title="Clicca per rettificare"
                            >
                              {qty.toLocaleString("it-IT")}
                            </button>
                          </td>
                        );
                      })}
                      <td>
                        <button onClick={() => setEditMat({ ...item })} className="text-primary hover:underline text-xs"><Pencil className="h-3 w-3 inline" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {editMat && (
        <Dialog open={!!editMat} onOpenChange={(o) => !o && setEditMat(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Modifica articolo</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Codice</Label><Input value={editMat.code} onChange={e => setEditMat({ ...editMat, code: e.target.value })} /></div>
                <div><Label>METEL</Label><Input value={editMat.metelCode || ""} onChange={e => setEditMat({ ...editMat, metelCode: e.target.value })} /></div>
              </div>
              <div><Label>Nome</Label><Input value={editMat.name} onChange={e => setEditMat({ ...editMat, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Marca</Label><Input value={editMat.brand || ""} onChange={e => setEditMat({ ...editMat, brand: e.target.value })} /></div>
                <div><Label>Categoria</Label><Input value={editMat.category || ""} onChange={e => setEditMat({ ...editMat, category: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>UM</Label><Input value={editMat.unit} onChange={e => setEditMat({ ...editMat, unit: e.target.value })} /></div>
                <div><Label>Prezzo vendita €</Label><Input type="number" step="0.01" value={editMat.unitPrice} onChange={e => setEditMat({ ...editMat, unitPrice: Number(e.target.value) })} /></div>
                <div><Label>Scorta min</Label><Input type="number" step="0.01" value={editMat.stockMin} onChange={e => setEditMat({ ...editMat, stockMin: Number(e.target.value) })} /></div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={saveEdit} disabled={editing}>{editing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />} Salva</Button>
                <Button variant="outline" onClick={() => setEditMat(null)}>Annulla</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {adjust && (
        <Dialog open={!!adjust} onOpenChange={(o) => !o && setAdjust(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Rettifica stock manuale</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="text-sm">
                <strong>{adjust.materialName}</strong> in <strong>{adjust.warehouseName}</strong>
              </div>
              <div className="bg-muted/30 p-3 rounded text-sm">
                Stock attuale: <strong>{adjust.current}</strong>
              </div>
              <div>
                <Label>Nuova quantità</Label>
                <Input type="number" step="0.01" autoFocus value={adjustQty} onChange={e => setAdjustQty(e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">
                Verrà registrato un movimento di rettifica tracciato in audit log.
              </p>
              <div className="flex gap-2">
                <Button onClick={saveAdjust} disabled={adjusting}>{adjusting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownUp className="h-4 w-4" />} Conferma rettifica</Button>
                <Button variant="outline" onClick={() => setAdjust(null)}>Annulla</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
