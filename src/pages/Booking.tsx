import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { format, addDays, startOfDay, isSameDay, parseISO, getWeek } from "date-fns";

const atTime = (d: Date, h: number, m: number) => {
  const x = new Date(d);
  x.setHours(h, m, 0, 0);
  return x;
};
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  MapPin,
  Home as HomeIcon,
  Calendar as Cal,
  Clock,
  AlertCircle,
  Crown,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * STRIPE — link para cobrança da taxa avulsa de R$ 10
 * Crie um Payment Link no Stripe Dashboard (produto único, R$ 10,00)
 * e cole o link abaixo.
 */
const STRIPE_TAXA_LINK = "https://buy.stripe.com/SUBSTITUA_LINK_TAXA_10";

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_local: number;
  price_home: number | null;
};
type BH = { day_of_week: number; open_time: string; close_time: string; active: boolean };

const formSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(100),
  whatsapp: z.string().trim().min(10, "WhatsApp inválido").max(20),
  address: z.string().trim().max(200).optional().or(z.literal("")),
});

type Step = 1 | 2 | 3 | 4;
type PlanType = "premium" | "basico" | "avulso";

const TAXA_EXTRA = 10; // R$ 10,00

export default function Booking() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [hours, setHours] = useState<BH[]>([]);
  const [appointments, setAppointments] = useState<{ scheduled_at: string; client_whatsapp_snapshot: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(true);

  // plano do cliente (em memória — verificação simplificada por WhatsApp)
  const [planType, setPlanType] = useState<PlanType>("avulso");

  // seleções
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [location, setLocation] = useState<"local" | "home">("local");
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{
    when: Date;
    service: string;
    hasTaxa: boolean;
  } | null>(null);

  const fetchServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("price_local");
    setServices((data ?? []) as Service[]);
  };

  useEffect(() => {
    // Carga inicial
    (async () => {
      const [{ data: sData }, { data: hData }] = await Promise.all([
        supabase.from("services").select("*").eq("active", true).order("price_local"),
        supabase.from("business_hours").select("*"),
      ]);
      setServices((sData ?? []) as Service[]);
      setHours((hData ?? []) as BH[]);
      setLoading(false);
    })();

    // Realtime — dispara se a tabela tiver replicação ativa
    const channel = supabase
      .channel("services-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, fetchServices)
      .subscribe();

    // Polling a cada 20s como fallback — garante atualização mesmo sem Realtime
    const poll = setInterval(fetchServices, 20_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, []);

  // Rebusca agendamentos do dia selecionado sempre que o usuário escolhe uma data
  // Garante que horários reservados por outros clientes apareçam bloqueados em tempo real
  const fetchAppointmentsForDate = async (d: Date) => {
    setLoadingSlots(true);
    const start = new Date(d); start.setHours(0, 0, 0, 0);
    const end   = new Date(d); end.setHours(23, 59, 59, 999);
    const { data } = await supabase
      .from("appointments")
      .select("scheduled_at, client_whatsapp_snapshot")
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString())
      .neq("status", "cancelled");
    setAppointments(data ?? []);
    setLoadingSlots(false);
  };

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [serviceId, services],
  );

  const price = useMemo(() => {
    if (!selectedService) return 0;
    return location === "home"
      ? Number(selectedService.price_home ?? selectedService.price_local)
      : Number(selectedService.price_local);
  }, [selectedService, location]);

  /*
   * Lógica de taxa:
   * - Premium: nunca cobra taxa
   * - Básico: verifica se já tem agendamento na mesma semana → sem taxa
   *           se é semana diferente → cobra R$ 10
   * - Avulso: sem plano, paga normalmente (sem taxa adicional — a taxa é só para assinantes que querem semana extra)
   */
  const hasTaxaExtra = useMemo(() => {
    if (!date || planType !== "basico") return false;
    const selectedWeek = getWeek(date, { locale: ptBR });
    const selectedYear = date.getFullYear();
    const clientWpp = whatsapp.trim();
    if (!clientWpp) return false;
    // verifica se já tem agendamento do cliente na mesma semana
    const alreadyHasInWeek = appointments.some((a) => {
      const aDate = parseISO(a.scheduled_at);
      return (
        a.client_whatsapp_snapshot === clientWpp &&
        getWeek(aDate, { locale: ptBR }) === selectedWeek &&
        aDate.getFullYear() === selectedYear
      );
    });
    return !alreadyHasInWeek;
  }, [date, planType, whatsapp, appointments]);

  const upcomingDays = useMemo(
    () => Array.from({ length: 14 }, (_, i) => startOfDay(addDays(new Date(), i))),
    [],
  );

  const slotsForDate = (d: Date): string[] => {
    if (!selectedService) return [];
    const bh = hours.find((h) => h.day_of_week === d.getDay() && h.active);
    if (!bh) return [];
    const [oh, om] = bh.open_time.split(":").map(Number);
    const [ch, cm] = bh.close_time.split(":").map(Number);
    const open  = atTime(d, oh, om);
    const close = atTime(d, ch, cm);
    const dur   = selectedService.duration_minutes * 60000;
    const slots: string[] = [];

    for (let t = open.getTime(); t + dur <= close.getTime(); t += dur) {
      const slotStart = t;
      const slotEnd   = t + dur;
      if (slotStart < Date.now()) continue;

      // Bloqueia o slot se qualquer agendamento existente sobrepõe o intervalo [slotStart, slotEnd)
      const taken = appointments.some((a) => {
        const apptMs = parseISO(a.scheduled_at).getTime();
        // Considera que cada agendamento ocupa pelo menos `dur` ms
        // → overlap se apptStart < slotEnd E apptEnd > slotStart
        return apptMs < slotEnd && apptMs + dur > slotStart;
      });

      if (!taken) slots.push(format(new Date(slotStart), "HH:mm"));
    }
    return slots;
  };

  const goNext = () => setStep((s) => (Math.min(4, s + 1) as Step));
  const goPrev = () => setStep((s) => (Math.max(1, s - 1) as Step));

  const submit = async () => {
    if (!selectedService || !date || !time) return;
    const parsed = formSchema.safeParse({ name, whatsapp, address });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (location === "home" && !address.trim()) {
      toast.error("Informe o endereço para atendimento em domicílio");
      return;
    }
    setSubmitting(true);
    const [hh, mm] = time.split(":").map(Number);
    const scheduled = atTime(date, hh, mm);

    const { data: clientRow, error: cErr } = await supabase
      .from("clients")
      .insert({ name: parsed.data.name, whatsapp: parsed.data.whatsapp })
      .select("id")
      .single();
    if (cErr) {
      setSubmitting(false);
      toast.error("Erro ao salvar dados");
      return;
    }

    const { error: aErr } = await supabase.from("appointments").insert({
      client_id: clientRow.id,
      service_id: selectedService.id,
      client_name_snapshot: parsed.data.name,
      client_whatsapp_snapshot: parsed.data.whatsapp,
      service_name_snapshot: selectedService.name,
      price,
      location,
      address: location === "home" ? parsed.data.address || null : null,
      scheduled_at: scheduled.toISOString(),
      status: "scheduled",
      notes: [
        notes.trim() || null,
        planType !== "avulso" ? `Plano: ${planType}` : null,
      ].filter(Boolean).join(" | ") || null,
    });

    setSubmitting(false);
    if (aErr) {
      toast.error("Não foi possível agendar. Tente outro horário.");
      return;
    }

    setConfirmed({ when: scheduled, service: selectedService.name, hasTaxa: hasTaxaExtra });
    setStep(4);
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 text-accent animate-spin" />
      </div>
    );
  }

  const totalSteps = 3;
  const progressLabel = step <= totalSteps ? `Passo ${step} de ${totalSteps}` : "";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur safe-top">
        <div className="container py-3 flex items-center justify-between">
          <BrandMark size="md" to="/" showWordmark={false} />
          {step < 4 && (
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    step >= n ? "w-8 bg-accent" : "w-4 bg-surface-3",
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 container max-w-xl py-8 sm:py-14 animate-fade-in pb-28">
        {/* ── STEP 1: Plano + Local + Serviço ── */}
        {step === 1 && (
          <section>
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">{progressLabel}</p>
            <h2 className="font-display text-4xl sm:text-5xl uppercase tracking-wider mb-1">
              Onde & o quê?
            </h2>
            <p className="text-muted-foreground mb-7 text-sm">Escolha o local e o serviço desejado.</p>

            {/* Tipo de plano */}
            <div className="mb-7">
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
                <Crown className="h-3.5 w-3.5 text-accent" /> Você é assinante?
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "premium", label: "Premium", sub: "Open bar + sem taxa", accent: true },
                    { id: "basico", label: "Básico", sub: "1×/sem + taxa extra", accent: false },
                    { id: "avulso", label: "Avulso", sub: "Sem plano mensal", accent: false },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlanType(p.id)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all flex flex-col gap-1",
                      planType === p.id
                        ? "border-accent bg-accent/8"
                        : "border-border hover:bg-surface-2",
                    )}
                  >
                    <div className={cn(
                      "text-xs font-semibold uppercase tracking-wide",
                      planType === p.id && p.accent ? "shimmer-gold" : planType === p.id ? "text-accent" : "text-foreground",
                    )}>
                      {p.id === "premium" && <Crown className="inline h-3 w-3 mr-1" />}
                      {p.label}
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-tight">{p.sub}</div>
                  </button>
                ))}
              </div>
              {planType !== "avulso" && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Info className="h-3 w-3 text-accent/60" />
                  {planType === "premium"
                    ? "Nenhuma taxa extra. Agende à vontade!"
                    : "Taxa de R$ 10 para semanas além do plano."}
                  {" "}
                  <Link to="/planos" className="text-accent underline underline-offset-2 hover:text-accent/80">
                    Ver planos
                  </Link>
                </div>
              )}
            </div>

            {/* Local */}
            <div className="mb-7">
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
                <MapPin className="h-3.5 w-3.5" /> Local
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setLocation("local")}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    location === "local" ? "border-accent bg-accent/8" : "border-border hover:bg-surface-2",
                  )}
                >
                  <MapPin className={cn("h-5 w-5 mb-2.5", location === "local" ? "text-accent" : "text-muted-foreground")} />
                  <div className="font-display text-lg uppercase tracking-wider">Na Loja</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Atendimento na barbearia</div>
                </button>
                <button
                  onClick={() => setLocation("home")}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    location === "home" ? "border-accent bg-accent/8" : "border-border hover:bg-surface-2",
                  )}
                >
                  <HomeIcon className={cn("h-5 w-5 mb-2.5", location === "home" ? "text-accent" : "text-muted-foreground")} />
                  <div className="font-display text-lg uppercase tracking-wider">Domicílio</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Zeca vai até você</div>
                </button>
              </div>
            </div>

            {/* Serviço */}
            <div>
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
                <Clock className="h-3.5 w-3.5" /> Serviço
              </Label>
              <div className="space-y-2">
                {services.map((s) => {
                  const p = location === "home" ? Number(s.price_home ?? s.price_local) : Number(s.price_local);
                  const sel = serviceId === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setServiceId(s.id)}
                      className={cn(
                        "w-full p-4 rounded-xl border flex items-center justify-between text-left transition-all",
                        sel ? "border-accent bg-accent/8" : "border-border hover:bg-surface-2",
                      )}
                    >
                      <div>
                        <div className="font-medium text-sm">{s.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{s.duration_minutes} min</div>
                      </div>
                      <div className={cn("font-display text-2xl tracking-wider", sel ? "text-accent" : "text-foreground")}>
                        R$ {p.toFixed(0)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <Button variant="cta" size="lg" disabled={!serviceId} onClick={goNext} className="h-13 px-8">
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {/* ── STEP 2: Data & Horário ── */}
        {step === 2 && (
          <section>
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">{progressLabel}</p>
            <h2 className="font-display text-4xl sm:text-5xl uppercase tracking-wider mb-1">Quando?</h2>
            <p className="text-muted-foreground mb-7 text-sm">Escolha o melhor dia e horário.</p>

            {/* Dias */}
            <div className="mb-6">
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
                <Cal className="h-3.5 w-3.5" /> Dia
              </Label>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                {upcomingDays.map((d) => {
                  const has = hours.find((h) => h.day_of_week === d.getDay() && h.active);
                  const sel = date && isSameDay(date, d);
                  return (
                    <button
                      key={d.toISOString()}
                      disabled={!has}
                      onClick={() => { setDate(d); setTime(null); fetchAppointmentsForDate(d); }}
                      className={cn(
                        "shrink-0 w-16 py-3 rounded-xl border text-center transition-all",
                        sel ? "border-accent bg-accent/12 text-accent" : "border-border hover:bg-surface-2",
                        !has && "opacity-30 cursor-not-allowed",
                      )}
                    >
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {format(d, "EEE", { locale: ptBR })}
                      </div>
                      <div className="font-display text-2xl mt-0.5">{format(d, "dd")}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Horários */}
            {date && (
              <div>
                <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  <Clock className="h-3.5 w-3.5" /> Horário
                </Label>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-accent" /> Verificando horários disponíveis...
                  </div>
                ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slotsForDate(date).length === 0 && (
                    <p className="col-span-full text-sm text-muted-foreground">Sem horários disponíveis neste dia.</p>
                  )}
                  {slotsForDate(date).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTime(t)}
                      className={cn(
                        "py-3 rounded-xl border text-sm font-medium transition-all",
                        time === t
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border hover:bg-surface-2",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                )}
              </div>
            )}

            <div className="flex justify-between mt-8">
              <Button variant="ghost" onClick={goPrev} className="h-12">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              <Button variant="cta" size="lg" disabled={!date || !time} onClick={goNext} className="h-12 px-8">
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {/* ── STEP 3: Dados ── */}
        {step === 3 && (
          <section>
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">{progressLabel}</p>
            <h2 className="font-display text-4xl sm:text-5xl uppercase tracking-wider mb-1">Seus dados</h2>
            <p className="text-muted-foreground mb-7 text-sm">Só pra te avisar e confirmar.</p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  className="mt-2 bg-surface-2 border-border h-12 rounded-xl"
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <Label htmlFor="wpp" className="text-xs uppercase tracking-wider text-muted-foreground">WhatsApp</Label>
                <Input
                  id="wpp"
                  inputMode="tel"
                  placeholder="(11) 99999-9999"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  maxLength={20}
                  className="mt-2 bg-surface-2 border-border h-12 rounded-xl"
                />
                {planType === "basico" && whatsapp.trim().length >= 10 && (
                  <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                    <Info className="h-3 w-3 text-accent/60" />
                    Usamos seu WhatsApp para verificar a semana do seu plano.
                  </p>
                )}
              </div>
              {location === "home" && (
                <div>
                  <Label htmlFor="addr" className="text-xs uppercase tracking-wider text-muted-foreground">
                    Endereço para atendimento
                  </Label>
                  <Textarea
                    id="addr"
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    maxLength={200}
                    className="mt-2 bg-surface-2 border-border rounded-xl"
                    placeholder="Rua, número, complemento, bairro"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="notes" className="text-xs uppercase tracking-wider text-muted-foreground">
                  O que você quer fazer? <span className="normal-case tracking-normal text-muted-foreground/60">(opcional)</span>
                </Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={300}
                  className="mt-2 bg-surface-2 border-border rounded-xl"
                  placeholder="Ex: degradê na lateral, navalhado, barba completa, franja reta..."
                />
                <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Info className="h-3 w-3 text-accent/60" />
                  O Zeca verá isso antes do seu atendimento para se preparar.
                </p>
              </div>
            </div>

            {/* Resumo */}
            <div className="mt-7 bg-surface-2 border border-border rounded-xl p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serviço</span>
                <span>{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Local</span>
                <span>{location === "local" ? "Na Loja" : "Domicílio"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quando</span>
                <span>
                  {date && time && `${format(date, "dd/MM", { locale: ptBR })} às ${time}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plano</span>
                <span className="capitalize">{planType}</span>
              </div>
              {hasTaxaExtra && (
                <div className="flex justify-between text-accent/80">
                  <span>Taxa semana extra</span>
                  <span>+ R$ {TAXA_EXTRA.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 mt-1 border-t border-border">
                <span className="text-muted-foreground uppercase text-xs tracking-wider">Total</span>
                <span className="font-display text-2xl text-accent">
                  R$ {(price + (hasTaxaExtra ? TAXA_EXTRA : 0)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Aviso taxa */}
            {hasTaxaExtra && (
              <div className="mt-3 flex items-start gap-2.5 bg-accent/8 border border-accent/30 rounded-xl p-3.5 text-sm">
                <AlertCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <div className="text-muted-foreground">
                  <strong className="text-foreground">Taxa de semana extra: R$ {TAXA_EXTRA},00</strong>
                  <br />
                  Você já usou seu agendamento desta semana. A taxa garante o horário reservado.
                  Se o barbeiro cancelar, ela é devolvida.{" "}
                  <button
                    onClick={() => window.open(STRIPE_TAXA_LINK, "_blank")}
                    className="text-accent underline underline-offset-2 hover:text-accent/80"
                  >
                    Pagar taxa via Stripe
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <Button variant="ghost" onClick={goPrev} className="h-12">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              <Button
                variant="cta"
                size="lg"
                disabled={submitting}
                onClick={submit}
                className="h-12 px-8"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar agendamento
              </Button>
            </div>
          </section>
        )}

        {/* ── STEP 4: Confirmação ── */}
        {step === 4 && confirmed && (
          <section className="text-center py-8">
            <div className="mx-auto h-20 w-20 rounded-full bg-accent/15 grid place-items-center mb-6 ring-accent-glow">
              <Check className="h-10 w-10 text-accent" strokeWidth={2.5} />
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">Agendado</p>
            <h2 className="font-display text-4xl sm:text-5xl uppercase tracking-wider mb-4">Tá marcado!</h2>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              {confirmed.service} em{" "}
              <strong className="text-foreground">
                {format(confirmed.when, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </strong>
              .
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Te esperamos! Em caso de imprevisto, fale com o Zeca pelo WhatsApp.
            </p>

            {/* Taxa avulsa reminder */}
            {confirmed.hasTaxa && (
              <div className="mt-5 mx-auto max-w-sm flex items-start gap-2.5 bg-accent/8 border border-accent/30 rounded-xl p-4 text-sm text-left">
                <AlertCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <div className="text-muted-foreground">
                  Lembre-se de pagar a{" "}
                  <strong className="text-foreground">taxa de R$ {TAXA_EXTRA},00</strong> para
                  confirmar o horário extra.{" "}
                  <button
                    onClick={() => window.open(STRIPE_TAXA_LINK, "_blank")}
                    className="text-accent underline underline-offset-2"
                  >
                    Pagar agora →
                  </button>
                </div>
              </div>
            )}

            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => nav("/")} className="h-12 border-border hover:border-accent/40">
                Voltar ao início
              </Button>
              <Button variant="cta" onClick={() => window.location.reload()} className="h-12">
                Novo agendamento
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
