import { useState } from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Crown,
  Scissors,
  AlertCircle,
  Phone,
  RefreshCcw,
  Shield,
  Zap,
  Coffee,
} from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * CONFIGURAÇÃO STRIPE
 * Crie Payment Links no Stripe Dashboard (https://dashboard.stripe.com/payment-links)
 * para cada plano (produto recorrente mensal) e cole os links abaixo.
 * Para a taxa avulsa de R$ 10, crie também um Payment Link de produto único.
 */
const STRIPE_LINKS = {
  basico: "https://buy.stripe.com/SUBSTITUA_LINK_BASICO",
  premium: "https://buy.stripe.com/SUBSTITUA_LINK_PREMIUM",
  taxa: "https://buy.stripe.com/SUBSTITUA_LINK_TAXA_10",
};

const WHATSAPP = "5511999999999"; // substitua pelo número real

type Plan = "basico" | "premium";

const plans = [
  {
    id: "basico" as Plan,
    icon: Scissors,
    label: "Básico",
    price: 79,
    period: "mês",
    subtitle: "Pago antecipado via Stripe",
    highlight: false,
    badge: null,
    description: "O essencial para quem quer garantir o corte toda semana sem preocupação.",
    features: [
      { text: "1 corte por semana (4× ao mês)", included: true },
      { text: "Agendamento online garantido", included: true },
      { text: "Atendimento na barbearia", included: true },
      { text: "Confirmação via WhatsApp", included: true },
      { text: "Taxa R$ 10 para semanas extras", included: true, note: true },
      { text: "Open bar (bebidas e snacks)", included: false },
      { text: "Sem taxa para semanas adicionais", included: false },
      { text: "Atendimento VIP prioritário", included: false },
    ],
  },
  {
    id: "premium" as Plan,
    icon: Crown,
    label: "Premium",
    price: 149,
    period: "mês",
    subtitle: "Pago antecipado via Stripe",
    highlight: true,
    badge: "Mais popular",
    description: "A experiência completa. Sem limitações, sem taxas extras — só o melhor.",
    features: [
      { text: "1 corte por semana (4× ao mês)", included: true },
      { text: "Agendamento online garantido", included: true },
      { text: "Atendimento na barbearia", included: true },
      { text: "Confirmação via WhatsApp", included: true },
      { text: "Sem taxa para semanas adicionais", included: true },
      { text: "Open bar — café, água, snacks à vontade", included: true },
      { text: "Atendimento VIP prioritário", included: true },
      { text: "Acesso antecipado a novos horários", included: true },
    ],
  },
] as const;

function PlanCard({ plan, selected, onSelect }: {
  plan: (typeof plans)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = plan.icon;
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-2xl p-6 flex flex-col gap-5 transition-all duration-200 relative overflow-hidden",
        plan.highlight
          ? "plan-premium"
          : "plan-basic",
        selected && "ring-2 ring-accent",
      )}
    >
      {/* Glow for premium */}
      {plan.highlight && (
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent/8 rounded-full blur-2xl pointer-events-none" />
      )}

      {plan.badge && (
        <div className="absolute top-4 right-4 bg-accent text-accent-foreground text-[10px] uppercase tracking-[0.3em] font-bold px-2.5 py-1 rounded-full">
          {plan.badge}
        </div>
      )}

      <div className="flex items-center gap-2.5">
        <div className={cn(
          "h-9 w-9 rounded-lg grid place-items-center",
          plan.highlight ? "bg-accent/20" : "bg-surface-3",
        )}>
          <Icon className={cn("h-5 w-5", plan.highlight ? "text-accent" : "text-muted-foreground")} />
        </div>
        <div>
          <div className={cn(
            "text-xs uppercase tracking-[0.3em] font-semibold",
            plan.highlight ? "shimmer-gold" : "text-muted-foreground",
          )}>
            {plan.label}
          </div>
        </div>
      </div>

      <div>
        <div className={cn(
          "font-display text-5xl tracking-wider",
          plan.highlight ? "text-accent-grad" : "text-foreground",
        )}>
          R$ {plan.price}
        </div>
        <div className="text-xs text-muted-foreground mt-1">/{plan.period} · {plan.subtitle}</div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>

      <ul className="space-y-2.5">
        {plan.features.map((f) => (
          <li key={f.text} className={cn(
            "flex items-start gap-2.5 text-sm",
            f.included ? (plan.highlight ? "text-foreground" : "text-muted-foreground") : "text-muted-foreground/40 line-through",
          )}>
            <CheckCircle2 className={cn(
              "h-4 w-4 shrink-0 mt-0.5",
              f.included
                ? (plan.highlight ? "text-accent" : "text-accent/60")
                : "text-muted-foreground/30",
            )} />
            <span>
              {f.text}
              {"note" in f && f.note && (
                <span className="ml-1 text-[11px] text-accent/70">(ver política abaixo)</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {selected && (
        <div className="absolute inset-0 border-2 border-accent rounded-2xl pointer-events-none" />
      )}
    </button>
  );
}

export default function Planos() {
  const [selected, setSelected] = useState<Plan>("premium");

  const selectedPlan = plans.find((p) => p.id === selected)!;

  function handleSubscribe() {
    const link = STRIPE_LINKS[selected];
    if (link.includes("SUBSTITUA")) {
      alert("Configure os links do Stripe em src/pages/Planos.tsx → STRIPE_LINKS");
      return;
    }
    window.open(link, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur safe-top">
        <div className="container py-3 flex items-center justify-between">
          <BrandMark size="md" to="/" showWordmark={true} />
          <Link to="/login" className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground transition-colors px-2">
            Admin
          </Link>
        </div>
      </header>

      <main className="flex-1 container max-w-3xl py-10 sm:py-16">
        {/* Back */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </Link>

        {/* Title */}
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.4em] text-accent mb-3">Assinatura mensal</p>
          <h1 className="font-display text-5xl sm:text-6xl uppercase tracking-wider mb-4">
            Planos Zeca
          </h1>
          <p className="text-muted-foreground max-w-md leading-relaxed">
            Assine mensalmente, pague antecipado pelo Stripe e agende seus horários com tranquilidade.
            Cancele quando quiser.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={selected === plan.id}
              onSelect={() => setSelected(plan.id)}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="bg-surface-2 border border-border rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-center sm:text-left">
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-1">
              Plano selecionado
            </div>
            <div className="font-display text-2xl uppercase tracking-wider">
              {selectedPlan.label}{" "}
              <span className="text-accent">R$ {selectedPlan.price}/mês</span>
            </div>
          </div>
          <Button
            variant="cta"
            size="lg"
            className="w-full sm:w-auto h-14 px-8 text-base"
            onClick={handleSubscribe}
          >
            Assinar agora <ArrowRight className="ml-1 h-5 w-5" />
          </Button>
        </div>

        {/* Taxa policy */}
        <div className="mt-6 flex items-start gap-3 bg-surface-2 border border-border rounded-xl p-4 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-foreground block mb-1">Política de taxa de agendamento extra</strong>
            No <strong className="text-foreground">Plano Básico</strong>, cada semana adicional (além das 4 previstas
            no plano) tem uma taxa de{" "}
            <strong className="text-foreground">R$ 10,00</strong> cobrada via Stripe. Essa taxa garante
            o horário ao barbeiro caso o cliente não compareça.
            Se o cancelamento for feito <strong className="text-foreground">pelo barbeiro</strong>, o valor é{" "}
            <strong className="text-foreground">devolvido integralmente</strong>.
            No <strong className="text-foreground">Plano Premium</strong>, não existe taxa extra — agende
            quantas vezes quiser no mês.
          </div>
        </div>

        {/* Benefits row */}
        <div className="mt-10">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-5 text-center">
            Todos os planos incluem
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Shield, label: "Pagamento seguro", sub: "via Stripe" },
              { icon: Phone, label: "Suporte WhatsApp", sub: "resposta rápida" },
              { icon: RefreshCcw, label: "Cancele quando quiser", sub: "sem multa" },
              { icon: Zap, label: "Agendamento instantâneo", sub: "24h por dia" },
            ].map((b) => (
              <div
                key={b.label}
                className="bg-surface-2 border border-border rounded-lg p-4 flex flex-col items-center text-center gap-2"
              >
                <b.icon className="h-5 w-5 text-accent/70" strokeWidth={1.5} />
                <div>
                  <div className="text-xs font-medium text-foreground leading-tight">{b.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{b.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Premium open bar callout */}
        <div className="mt-6 plan-premium rounded-xl p-5 sm:p-6 flex items-start gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
          <Coffee className="h-8 w-8 text-accent shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <div className="text-xs uppercase tracking-[0.3em] shimmer-gold font-semibold mb-1">
              Exclusivo Premium
            </div>
            <h3 className="font-display text-2xl uppercase tracking-wider text-foreground mb-2">
              Open Bar
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No Plano Premium, enquanto estiver na barbearia, você consume à vontade — café especial,
              água gelada, refrigerante e snacks. Sem cobranças extras. A experiência que você merece.
            </p>
          </div>
        </div>

        {/* Already subscribed / questions */}
        <div className="mt-10 text-center text-sm text-muted-foreground">
          Já é assinante ou tem dúvidas?{" "}
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent/80 underline underline-offset-4 transition-colors"
          >
            Fale com o Zeca pelo WhatsApp
          </a>
        </div>

        {/* After subscribe — go book */}
        <div className="mt-6 border-t border-border/60 pt-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
            Após assinar
          </p>
          <Button asChild variant="outline" className="border-border hover:border-accent/40 hover:bg-surface-2">
            <Link to="/agendar">
              <Scissors className="mr-2 h-4 w-4" /> Ir para o agendamento
            </Link>
          </Button>
        </div>

        {/* Mobile bottom padding for sticky CTA */}
        <div className="h-20 sm:hidden" />
      </main>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-background/95 backdrop-blur border-t border-border/60 safe-bottom">
        <div className="p-3">
          <Button variant="cta" className="w-full h-12 text-sm" onClick={handleSubscribe}>
            Assinar {selectedPlan.label} — R$ {selectedPlan.price}/mês{" "}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      <footer className="border-t border-border/60 hidden sm:block">
        <div className="container py-6 text-xs uppercase tracking-[0.2em] text-muted-foreground flex justify-between flex-wrap gap-4">
          <span>© {new Date().getFullYear()} Zeca Barbearia</span>
          <span>Pagamentos processados com segurança pelo Stripe</span>
        </div>
      </footer>
    </div>
  );
}
