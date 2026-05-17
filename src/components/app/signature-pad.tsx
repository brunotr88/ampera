"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Check } from "lucide-react";

export function SignaturePadComponent({ onSave, height = 200 }: { onSave: (dataUrl: string) => void; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<any>(null);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const SignaturePad = (await import("signature_pad")).default;
      if (!canvasRef.current || !mounted) return;
      const c = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      const w = c.parentElement?.clientWidth || 300;
      c.width = w * dpr;
      c.height = height * dpr;
      c.style.width = w + "px";
      c.style.height = height + "px";
      c.getContext("2d")!.scale(dpr, dpr);
      padRef.current = new SignaturePad(c, { backgroundColor: "rgba(255,255,255,0)", penColor: "#0f172a" });
      padRef.current.addEventListener("endStroke", () => setEmpty(padRef.current.isEmpty()));
    })();
    return () => { mounted = false; padRef.current?.off(); };
  }, [height]);

  function clear() { padRef.current?.clear(); setEmpty(true); }
  function save() {
    if (!padRef.current || padRef.current.isEmpty()) return;
    onSave(padRef.current.toDataURL("image/png"));
  }

  return (
    <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-2">
      <canvas ref={canvasRef} className="block touch-none" />
      <div className="flex gap-2 mt-2">
        <Button type="button" variant="outline" size="sm" onClick={clear} className="flex-1"><Eraser className="h-4 w-4" /> Cancella</Button>
        <Button type="button" size="sm" onClick={save} disabled={empty} className="flex-1"><Check className="h-4 w-4" /> Usa firma</Button>
      </div>
    </div>
  );
}
