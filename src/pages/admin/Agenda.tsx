import { useEffect, useMemo, useState } from "react";
import { format, isSameDay, parseISO, startOfDay, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MessageCircle, MapPin, Home as HomeIcon, ChevronLeft, ChevronRight, Trash2, CheckCircle2, Scissors, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Appt = {
  id: string; client_name_snapshot: string; client_whatsapp_snapshot: string;
  service_name_snapshot: string; price: number; location: "local" | "home";
  address: string | null; scheduled_at: string; status: string; is_walkin: boolean;
  notes: string | null;
};
type Service = { id: string; name: string; price_local: number; price_home: number | null };

export default function Agenda() {
  const [day, setDay] = useState<Date>(startOfDay(new Date()));
  const [appts, setAppts] = useState<Appt[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [walkOpen, setWalkOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const start = new Date(day); start.setHours(0,0,0,0);
    const end = new Date(day); end.setHours(23,59,59,999);
    const [a, s] = await Promise.all([
      supabase.from("appointments").select("*").gte("scheduled_at", start.toISOString()).lte("scheduled_at", end.toISOString()).order("scheduled_at"),
      supabase.from("services").select("id,name,price_local,price_home").eq("active", true),
    ]);
    setAppts((a.data ?? []) as Appt[]);
    setServices((s.data ?? []) as Service[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [day]);

  const totals = useMemo(() => {
    const valid = appts.filter((a) => a.status !== "cancelled");
    return { count: valid.length, revenue: valid.reduce((s, a) => s + Number(a.price), 0) };
  }, [appts]);

  const updateStatus = async (id: string, status: "scheduled" | "completed" | "cancelled" | "no_show") => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return toast.error("Erro ao atualizar");
    toast.success("Atualizado");
    load();
  };
  const removeAppt = async (id: string) => {
    if (!confirm("Remover este agendamento?")) return;
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) return toast.error("Erro");
    toast.success("Removido");
    load();
  };

  const sendWpp = (a: Appt) => {
    const phone = a.client_whatsapp_snapshot.replace(/\D/g, "");
    const msg = encodeURIComponent(`Olá ${a.client_name_snapshot}, é o Zeca! Confirmando seu ${a.service_name_snapshot} às ${format(parseISO(a.scheduled_at), "HH:mm")}.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">Agenda</p>
          <h1 className="font-display text-4xl md:text-5xl uppercase tracking-wider capitalize">
            {format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totals.count} {totals.count === 1 ? "atendimento" : "atendimentos"} · R$ {totals.revenue.toFixed(2)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setDay(addDays(day, -1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ctaOutline" onClick={() => setDay(startOfDay(new Date()))}>Hoje</Button>
          <Button variant="ghost" size="icon" onClick={() => setDay(addDays(day, 1))}><ChevronRight className="h-4 w-4" /></Button>
          <WalkinDialog open={walkOpen} onOpenChange={setWalkOpen} services={services} day={day} onCreated={load} />
        </div>
      </header>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando…</p>
      ) : appts.length === 0 ? (
        <div className="surface border border-dashed border-border rounded-md p-12 text-center">
          <p className="text-muted-foreground">Nenhum agendamento neste dia.</p>
          <Button variant="cta" className="mt-6" onClick={() => setWalkOpen(true)}>
            <Plus className="h-4 w-4" /> Novo atendimento rápido
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {appts.map((a) => (
            <article
              key={a.id}
              className={cn(
                "surface border border-border rounded-md p-4 md:p-5 grid md:grid-cols-[80px_1fr_auto] gap-4 items-center",
                a.status === "cancelled" && "opacity-50",
                a.status === "completed" && "border-l-2 border-l-accent",
              )}
            >
              <div className="font-display text-3xl tracking-wider text-accent">
                {format(parseISO(a.scheduled_at), "HH:mm")}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{a.client_name_snapshot}</span>
                  {a.is_walkin && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent">Walk-in</span>}
                  {a.status === "completed" && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-3 text-muted-foreground">Finalizado</span>}
                  {a.status === "cancelled" && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-destructive/15 text-destructive">Cancelado</span>}
                </div>

                {/* Serviço — destaque */}
                <div className="flex items-center gap-1.5 mt-2">
                  <Scissors className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span className="text-sm font-medium text-foreground">{a.service_name_snapshot}</span>
                  <span className="text-sm text-muted-foreground">· R$ {Number(a.price).toFixed(2)}</span>
                </div>

                {/* Local */}
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                  {a.location === "home" ? <HomeIcon className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                  {a.location === "home" ? a.address ?? "Domicílio" : "Na Loja"}
                </div>

                {/* Observações do cliente */}
                {a.notes && (
                  <div className="mt-2.5 flex items-start gap-1.5 bg-accent/8 border border-accent/25 rounded-lg px-3 py-2">
                    <StickyNote className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                    <span className="text-xs text-foreground leading-relaxed">{a.notes}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <Button variant="ghost" size="icon" onClick={() => sendWpp(a)} title="WhatsApp"><MessageCircle className="h-4 w-4 text-accent" /></Button>
                {a.status === "scheduled" && (
                  <Button variant="ghost" size="icon" onClick={() => updateStatus(a.id, "completed")} title="Finalizar"><CheckCircle2 className="h-4 w-4" /></Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => removeAppt(a.id)} title="Remover"><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function WalkinDialog({
  open, onOpenChange, services, day, onCreated,
}: { open: boolean; onOpenChange: (v: boolean) => void; services: Service[]; day: Date; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [serviceId, setServiceId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim() || !serviceId) return toast.error("Preencha nome e serviço");
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;
    setSubmitting(true);
    const now = new Date();
    const scheduled = isSameDay(day, now) ? now : (() => { const x = new Date(day); x.setHours(12,0,0,0); return x; })();
    const { error } = await supabase.from("appointments").insert({
      service_id: svc.id,
      client_name_snapshot: name.trim(),
      client_whatsapp_snapshot: whatsapp.trim() || "—",
      service_name_snapshot: svc.name,
      price: Number(svc.price_local),
      location: "local",
      scheduled_at: scheduled.toISOString(),
      status: "completed",
      is_walkin: true,
    });
    setSubmitting(false);
    if (error) return toast.error("Erro ao registrar");
    toast.success("Walk-in registrado");
    setName(""); setWhatsapp(""); setServiceId("");
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="cta"><Plus className="h-4 w-4" /> Walk-in</Button>
      </DialogTrigger>
      <DialogContent className="surface border-border">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wider text-2xl">Novo atendimento rápido</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nome do cliente</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className="mt-2 bg-surface-2 border-border" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">WhatsApp (opcional)</Label>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} maxLength={20} className="mt-2 bg-surface-2 border-border" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Serviço</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger className="mt-2 bg-surface-2 border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} — R$ {Number(s.price_local).toFixed(0)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="cta" className="w-full" disabled={submitting} onClick={submit}>Registrar receita</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
