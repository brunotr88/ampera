"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ColumnFilter } from "@/components/app/data-table";

interface Props {
  basePath: string;
  current: Record<string, string | number>;
  columnKey: string;
  filter: ColumnFilter;
  initial: string;
  initialDateRange?: { from?: string; to?: string };
}

export function DataTableFilterCell({ basePath, current, columnKey, filter, initial, initialDateRange }: Props) {
  const router = useRouter();
  const [val, setVal] = useState(initial);
  const [dateFrom, setDateFrom] = useState(initialDateRange?.from ?? "");
  const [dateTo, setDateTo] = useState(initialDateRange?.to ?? "");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const param = `f.${columnKey}`;
  const paramFrom = `f.${columnKey}.from`;
  const paramTo = `f.${columnKey}.to`;

  useEffect(() => { setVal(initial); }, [initial]);
  useEffect(() => {
    setDateFrom(initialDateRange?.from ?? "");
    setDateTo(initialDateRange?.to ?? "");
  }, [initialDateRange?.from, initialDateRange?.to]);

  function pushSingle(next: string) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(current)) {
      if (k === param || k === "page") continue;
      if (v !== undefined && v !== "") params.set(k, String(v));
    }
    if (next) params.set(param, next);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  }

  function pushRange(from: string, to: string) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(current)) {
      if (k === paramFrom || k === paramTo || k === "page") continue;
      if (v !== undefined && v !== "") params.set(k, String(v));
    }
    if (from) params.set(paramFrom, from);
    if (to) params.set(paramTo, to);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  }

  function onText(v: string) {
    setVal(v);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => pushSingle(v.trim()), 350);
  }

  function onSelect(v: string) { setVal(v); pushSingle(v); }

  function onDateFrom(v: string) {
    setDateFrom(v);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => pushRange(v, dateTo), 200);
  }
  function onDateTo(v: string) {
    setDateTo(v);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => pushRange(dateFrom, v), 200);
  }

  if (filter.type === "select") {
    return (
      <Select value={val} onChange={e => onSelect(e.target.value)} className="h-7 text-xs px-2 py-0" aria-label={`Filtra ${columnKey}`}>
        <option value="">{filter.placeholder ?? "Tutti"}</option>
        {filter.options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>
    );
  }

  if (filter.type === "daterange") {
    return (
      <div className="flex gap-1 items-center">
        <Input type="date" value={dateFrom} onChange={e => onDateFrom(e.target.value)} className="h-7 text-xs px-1.5 py-0" aria-label={`Da ${columnKey}`} title="Dal" />
        <span className="text-muted-foreground text-xs">→</span>
        <Input type="date" value={dateTo} onChange={e => onDateTo(e.target.value)} className="h-7 text-xs px-1.5 py-0" aria-label={`A ${columnKey}`} title="Al" />
      </div>
    );
  }

  return (
    <Input type="text" value={val} onChange={e => onText(e.target.value)} placeholder={filter.placeholder ?? "Filtra…"} className="h-7 text-xs px-2 py-0" aria-label={`Filtra ${columnKey}`} />
  );
}
