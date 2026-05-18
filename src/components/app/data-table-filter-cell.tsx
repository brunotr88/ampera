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
}

export function DataTableFilterCell({ basePath, current, columnKey, filter, initial }: Props) {
  const router = useRouter();
  const [val, setVal] = useState(initial);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const param = `f.${columnKey}`;

  useEffect(() => {
    setVal(initial);
  }, [initial]);

  function push(next: string) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(current)) {
      if (k === param || k === "page") continue;
      if (v !== undefined && v !== "") params.set(k, String(v));
    }
    if (next) params.set(param, next);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  }

  function onText(v: string) {
    setVal(v);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => push(v.trim()), 350);
  }

  function onSelect(v: string) {
    setVal(v);
    push(v);
  }

  if (filter.type === "select") {
    return (
      <Select
        value={val}
        onChange={e => onSelect(e.target.value)}
        className="h-7 text-xs px-2 py-0"
        aria-label={`Filtra ${columnKey}`}
      >
        <option value="">{filter.placeholder ?? "Tutti"}</option>
        {filter.options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>
    );
  }

  return (
    <Input
      type="text"
      value={val}
      onChange={e => onText(e.target.value)}
      placeholder={filter.placeholder ?? "Filtra…"}
      className="h-7 text-xs px-2 py-0"
      aria-label={`Filtra ${columnKey}`}
    />
  );
}
