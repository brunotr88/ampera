"use client";
import { useEffect, useState } from "react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

type Contact = { id: string; name: string; surname?: string | null; role?: string | null; phone?: string | null; mobile?: string | null; email?: string | null; isPrimary: boolean };

interface Props {
  customerId?: string;
  plantId?: string;
  contactId?: string | null;
  contactPerson?: string | null;
  onChange: (next: { contactId: string | null; contactPerson: string | null }) => void;
}

/** Select referente in loco: carica i contatti del customer+plant, permette anche inserimento manuale. */
export function ContactSelect({ customerId, plantId, contactId, contactPerson, onChange }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(!contactId && !!contactPerson);

  useEffect(() => {
    let aborted = false;
    async function load() {
      if (!customerId && !plantId) { setContacts([]); return; }
      setLoading(true);
      try {
        const all: Contact[] = [];
        if (customerId) {
          const r = await fetch(`/api/contacts?customerId=${customerId}`);
          if (r.ok) {
            const d = await r.json();
            all.push(...(d.contacts || []));
          }
        }
        if (plantId) {
          const r = await fetch(`/api/contacts?plantId=${plantId}`);
          if (r.ok) {
            const d = await r.json();
            all.push(...(d.contacts || []));
          }
        }
        if (!aborted) setContacts(all);
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    load();
    return () => { aborted = true; };
  }, [customerId, plantId]);

  function handleSelect(value: string) {
    if (value === "__manual__") {
      setManualMode(true);
      onChange({ contactId: null, contactPerson: contactPerson || "" });
      return;
    }
    if (value === "") {
      onChange({ contactId: null, contactPerson: null });
      setManualMode(false);
      return;
    }
    const c = contacts.find(x => x.id === value);
    if (c) {
      onChange({ contactId: c.id, contactPerson: `${c.name}${c.surname ? " " + c.surname : ""}` });
      setManualMode(false);
    }
  }

  if (loading) {
    return <div className="text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin inline" /> Caricamento referenti…</div>;
  }

  return (
    <div className="space-y-2">
      <Select value={manualMode ? "__manual__" : (contactId || "")} onChange={e => handleSelect(e.target.value)}>
        <option value="">— Nessun referente —</option>
        {contacts.length > 0 && (
          <optgroup label="Referenti registrati">
            {contacts.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.surname || ""}{c.role ? ` · ${c.role}` : ""}{c.isPrimary ? " ⭐" : ""}
              </option>
            ))}
          </optgroup>
        )}
        <option value="__manual__">+ Altro nome (manuale)</option>
      </Select>
      {manualMode && (
        <Input
          type="text"
          placeholder="Nome del referente in loco"
          value={contactPerson || ""}
          onChange={e => onChange({ contactId: null, contactPerson: e.target.value })}
        />
      )}
      {contacts.length === 0 && !manualMode && (
        <p className="text-xs text-muted-foreground">
          Nessun referente registrato. Aggiungili dalla scheda cliente/impianto o seleziona "Altro nome".
        </p>
      )}
    </div>
  );
}
