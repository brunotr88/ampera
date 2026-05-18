"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
  basePath: string;
  current: Record<string, string | number>;
  initial: string;
  placeholder: string;
}

export function DataTableSearch({ basePath, current, initial, placeholder }: Props) {
  const router = useRouter();
  const [val, setVal] = useState(initial);
  const [pending, setPending] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setVal(initial);
  }, [initial]);

  function push(next: string) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(current)) {
      if (k === "q" || k === "page") continue;
      if (v !== undefined && v !== "") params.set(k, String(v));
    }
    if (next) params.set("q", next);
    const qs = params.toString();
    setPending(true);
    router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    setTimeout(() => setPending(false), 300);
  }

  function onChange(v: string) {
    setVal(v);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => push(v.trim()), 350);
  }

  function clear() {
    setVal("");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    push("");
  }

  return (
    <div className="relative w-full sm:max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        value={val}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
        aria-label="Cerca nella tabella"
      />
      {val && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
          aria-label="Pulisci"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
