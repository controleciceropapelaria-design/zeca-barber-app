import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, MessageCircle, CalendarClock, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Service = { id: string; name: string; description: string | null; duration_minutes: number; price_local: number; price_home: number | null; active: boolean };
type Client = { id: string; name: string; whatsapp: string; notes: string | null };
type BH = { id: string; day_of_week: number; open_time: string; close_time: string; active: boolean; daily_goal: number };

const dayNames = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];

/* Horários padrão para seed: Seg-Sex 9h-19h, Sáb 9h-17h, Dom fechado */
const DEFAULT_HOURS = [
  { day_of_week: 0, open_time: "09:00", close_time: "17:00", active: false, daily_goal: 0 },
  { day_of_week: 1, open_time: "09:00", close_time: "19:00", active: true,  daily_goal: 300 },
  { day_of_week: 2, open_time: "09:00", close_time: "19:00", active: true,  daily_goal: 300 },
  { day_of_week: 3, open_time: "09:00", close_time: "19:00", active: true,  daily_goal: 300 },
  { day_of_week: 4, open_time: "09:00", close_time: "19:00", active: true,  daily_goal: 300 },
  { day_of_week: 5, open_time: "09:00", close_time: "19:00", active: true,  daily_goal: 400 },
  { day_of_week: 6, open_time: "09:00", close_time: "17:00", active: true,  daily_goal: 350 },
];

export default function Geral() {
  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">Gestão</p>
        <h1 className="font-display text-4xl md:text-5xl uppercase tracking-wider">Geral</h1>
      </header>

      <Tabs defaultValue="services">
        <TabsList className="bg-surface-2 border border-border">
          <TabsTrigger value="services" className="uppercase text-xs tracking-wider">Preços</TabsTrigger>
          <TabsTrigger value="clients" className="uppercase text-xs tracking-wider">Clientes</TabsTrigger>
          <TabsTrigger value="hours" className="uppercase text-xs tracking-wider">Horários</TabsTrigger>
        </TabsList>
        <TabsContent value="services" className="mt-6"><ServicesPanel /></TabsContent>
        <TabsContent value="clients" className="mt-6"><ClientsPanel /></TabsContent>
        <TabsContent value="hours" className="mt-6"><HoursPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

function ServicesPanel() {
  const [items, setItems] = useState<Service[]>([]);
  const [draft, setDraft] = useState({ name: "", price_local: "", price_home: "", duration_minutes: "30" });

  const load = async () => {
    const { data } = await supabase.from("services").select("*").order("price_local");
    setItems((data ?? []) as Service[]);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!draft.name.trim() || !draft.price_local) return toast.error("Nome e preço local obrigatórios");
    const { error } = await supabase.from("services").insert({
      name: draft.name.trim(),
      price_local: Number(draft.price_local),
      price_home: draft.price_home ? Number(draft.price_home) : null,
      duration_minutes: Number(draft.duration_minutes) || 30,
    });
    if (error) return toast.error("Erro ao criar serviço");
    toast.success("Serviço criado");
    setDraft({ name: "", price_local: "", price_home: "", duration_minutes: "30" });
    load();
  };
  const update = async (id: string, patch: Partial<Service>) => {
    // Atualiza localmente de imediato (optimistic)
    setItems((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s));
    const { error } = await supabase.from("services").update(patch).eq("id", id);
    if (error) {
      toast.error("Erro ao salvar");
      load(); // reverte para o estado real do banco se der erro
    }
  };
  const remove = async (id: string) => {
    if (!confirm("Remover serviço?")) return;
    await supabase.from("services").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-3">
      {/* Labels */}
      <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_80px_auto] gap-2 px-1">
        {["Serviço", "R$ Loja", "R$ Domicílio", "Min", ""].map((l) => (
          <span key={l} className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</span>
        ))}
      </div>

      {/* New service */}
      <div className="surface border border-border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_80px_auto] gap-2">
        <Input placeholder="Nome do serviço" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="bg-surface-2 border-border" />
        <Input placeholder="R$ Loja" type="number" value={draft.price_local} onChange={(e) => setDraft({ ...draft, price_local: e.target.value })} className="bg-surface-2 border-border" />
        <Input placeholder="R$ Domic." type="number" value={draft.price_home} onChange={(e) => setDraft({ ...draft, price_home: e.target.value })} className="bg-surface-2 border-border" />
        <Input placeholder="min" type="number" value={draft.duration_minutes} onChange={(e) => setDraft({ ...draft, duration_minutes: e.target.value })} className="bg-surface-2 border-border" />
        <Button variant="cta" onClick={create}><Plus className="h-4 w-4" /></Button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">Nenhum serviço cadastrado. Adicione acima.</p>
      )}

      {items.map((s) => (
        <div key={s.id} className="surface border border-border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_80px_auto_auto] gap-2 items-center">
          <Input defaultValue={s.name} onBlur={(e) => e.target.value !== s.name && update(s.id, { name: e.target.value })} className="bg-surface-2 border-border" />
          <Input type="number" defaultValue={s.price_local} onBlur={(e) => update(s.id, { price_local: Number(e.target.value) })} className="bg-surface-2 border-border" />
          <Input type="number" defaultValue={s.price_home ?? ""} placeholder="—" onBlur={(e) => update(s.id, { price_home: e.target.value ? Number(e.target.value) : null })} className="bg-surface-2 border-border" />
          <Input type="number" defaultValue={s.duration_minutes} onBlur={(e) => update(s.id, { duration_minutes: Number(e.target.value) })} className="bg-surface-2 border-border" />
          <button
            onClick={() => update(s.id, { active: !s.active })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${s.active ? "bg-accent/20 text-accent hover:bg-accent/30" : "bg-surface-3 text-muted-foreground hover:bg-surface-2"}`}
          >
            {s.active ? "Ativo" : "Inativo"}
          </button>
          <Button variant="ghost" size="icon" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ))}
    </div>
  );
}

function ClientsPanel() {
  const [items, setItems] = useState<Client[]>([]);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState({ name: "", whatsapp: "" });

  const load = async () => {
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false }).limit(200);
    setItems((data ?? []) as Client[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((c) => `${c.name} ${c.whatsapp}`.toLowerCase().includes(q.toLowerCase()));

  const create = async () => {
    if (!draft.name.trim() || !draft.whatsapp.trim()) return toast.error("Nome e WhatsApp obrigatórios");
    const { error } = await supabase.from("clients").insert(draft);
    if (error) return toast.error("Erro ao adicionar");
    toast.success("Cliente adicionado");
    setDraft({ name: "", whatsapp: "" });
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Remover cliente?")) return;
    await supabase.from("clients").delete().eq("id", id);
    load();
  };
  const wpp = (c: Client) => window.open(`https://wa.me/${c.whatsapp.replace(/\D/g,"")}`, "_blank");

  return (
    <div className="space-y-3">
      <div className="surface border border-border rounded-lg p-4 grid sm:grid-cols-[2fr_2fr_auto] gap-2">
        <Input placeholder="Nome" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="bg-surface-2 border-border" maxLength={100} />
        <Input placeholder="WhatsApp" value={draft.whatsapp} onChange={(e) => setDraft({ ...draft, whatsapp: e.target.value })} className="bg-surface-2 border-border" maxLength={20} />
        <Button variant="cta" onClick={create}><Plus className="h-4 w-4" /></Button>
      </div>
      <Input placeholder="Buscar cliente..." value={q} onChange={(e) => setQ(e.target.value)} className="bg-surface-2 border-border" />
      <div className="space-y-2">
        {filtered.map((c) => (
          <div key={c.id} className="surface border border-border rounded-lg p-4 flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.whatsapp}</div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => wpp(c)}><MessageCircle className="h-4 w-4 text-accent" /></Button>
              <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">Nenhum cliente encontrado.</p>}
      </div>
    </div>
  );
}

function HoursPanel() {
  const [items, setItems] = useState<BH[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("business_hours").select("*").order("day_of_week");
    setItems((data ?? []) as BH[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const seed = async () => {
    setSeeding(true);
    const { error } = await supabase.from("business_hours").insert(DEFAULT_HOURS);
    if (error) {
      toast.error("Erro ao criar horários: " + error.message);
    } else {
      toast.success("Horários padrão criados! Ajuste conforme necessário.");
      load();
    }
    setSeeding(false);
  };

  const update = async (id: string, patch: Partial<BH>) => {
    const { error } = await supabase.from("business_hours").update(patch).eq("id", id);
    if (error) return toast.error("Erro ao salvar");
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="surface border border-dashed border-border rounded-lg p-12 text-center">
        <CalendarClock className="h-10 w-10 text-accent/50 mx-auto mb-4" strokeWidth={1.5} />
        <p className="font-display text-2xl uppercase tracking-wider mb-2">Sem horários configurados</p>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
          Crie os horários de funcionamento para que os clientes consigam agendar.
          Você pode ajustar depois.
        </p>
        <Button variant="cta" onClick={seed} disabled={seeding} className="h-12 px-8">
          {seeding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          Criar horários padrão (Seg–Sáb)
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-4">
        A <strong className="text-foreground">Meta R$</strong> por dia é usada no painel Financeiro para acompanhar o progresso diário.
        Defina o valor que deseja faturar em cada dia da semana.
      </p>
      {items.map((h) => (
        <div
          key={h.id}
          className={`surface border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-[130px_1fr_1fr_1fr_auto] gap-3 items-center transition-opacity ${!h.active ? "opacity-50" : ""}`}
        >
          <div className="flex items-center gap-2">
            <Switch checked={h.active} onCheckedChange={(v) => update(h.id, { active: v })} />
            <Label className="uppercase text-xs tracking-wider font-semibold">{dayNames[h.day_of_week]}</Label>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Abre</Label>
            <Input
              type="time"
              defaultValue={h.open_time?.slice(0, 5)}
              disabled={!h.active}
              onBlur={(e) => update(h.id, { open_time: e.target.value })}
              className="bg-surface-2 border-border mt-1"
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Fecha</Label>
            <Input
              type="time"
              defaultValue={h.close_time?.slice(0, 5)}
              disabled={!h.active}
              onBlur={(e) => update(h.id, { close_time: e.target.value })}
              className="bg-surface-2 border-border mt-1"
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Meta do dia R$</Label>
            <Input
              type="number"
              defaultValue={h.daily_goal}
              disabled={!h.active}
              onBlur={(e) => update(h.id, { daily_goal: Number(e.target.value) })}
              className="bg-surface-2 border-border mt-1"
            />
          </div>
          {/* spacer */}
          <div />
        </div>
      ))}
      <p className="text-[11px] text-muted-foreground pt-2">
        💡 Dica: desative os dias de folga para que não apareçam no agendamento dos clientes.
      </p>
    </div>
  );
}
