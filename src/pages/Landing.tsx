import { Link } from "react-router-dom";
import { BrandMark, BrandHero } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  MapPin,
  Home as HomeIcon,
  Clock,
  Crown,
  Scissors,
  Star,
  CheckCircle2,
  Phone,
  AlertCircle,
} from "lucide-react";
import { useConfig } from "@/lib/useConfig";

function WhatsAppLink({ children, className }: { children: React.ReactNode; className?: string }) {
  const { config } = useConfig();
  const wpp = (config.whatsapp || "").replace(/\D/g, "");
  if (!wpp) return <span className={className}>{children}</span>;
  return (
    <a
      href={`https://wa.me/${wpp}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}

export default function Landing() {
  const { config } = useConfig();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-top">
        <div className="container py-3 flex items-center justify-between">
          <BrandMark size="md" to="/" showWordmark={true} />
          <div className="flex items-center gap-3">
            <Link
              to="/planos"
              className="hidden sm:flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-accent hover:text-accent/80 transition-colors font-medium"
            >
              <Crown className="h-3.5 w-3.5" /> Planos
            </Link>
            <Link
              to="/login"
              className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground transition-colors px-2"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── HERO ── */}
        <section className="relative overflow-hidden">

          <div className="container pt-14 pb-12 sm:pt-20 sm:pb-16 flex flex-col items-center text-center">
            <BrandHero />

            <p className="mt-8 text-base sm:text-lg text-muted-foreground max-w-sm leading-relaxed">
              Reserve em menos de um minuto. Atendimento na barbearia ou no conforto da sua casa.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center">
              <Button asChild variant="cta" size="lg" className="h-14 px-8 text-base w-full sm:w-auto">
                <Link to="/agendar">
                  Agendar agora <ArrowRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base w-full sm:w-auto border-border hover:border-accent/40 hover:bg-surface-2">
                <Link to="/planos">
                  <Crown className="mr-2 h-4 w-4 text-accent" /> Ver planos mensais
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="border-t border-border/60">
          <div className="container py-12 grid grid-cols-1 sm:grid-cols-3 gap-px bg-border/60">
            {[
              {
                icon: MapPin,
                title: "Na Barbearia",
                desc: "Ambiente clássico, café e atendimento ágil.",
              },
              {
                icon: HomeIcon,
                title: "Em Domicílio",
                desc: "Zeca vai até você. Sem perder tempo no trânsito.",
              },
              {
                icon: Clock,
                title: "Sem Burocracia",
                desc: "Cadastro com nome e WhatsApp. Simples assim.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-background p-8 sm:p-10 flex flex-col gap-4">
                <f.icon className="h-6 w-6 text-accent" strokeWidth={1.5} />
                <div>
                  <h3 className="font-display text-2xl uppercase tracking-wider mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PLANOS PREVIEW ── */}
        <section className="border-t border-border/60 bg-surface">
          <div className="container py-14 sm:py-20">
            <div className="text-center mb-10">
              <p className="text-xs uppercase tracking-[0.4em] text-accent mb-3">Assinatura mensal</p>
              <h2 className="font-display text-4xl sm:text-5xl uppercase tracking-wider">
                Escolha seu plano
              </h2>
              <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Pague mensalmente e garanta seu horário todo mês. Sem surpresas.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* Plano Básico */}
              <div className="plan-basic rounded-xl p-6 flex flex-col gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Scissors className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Básico</span>
                  </div>
                  <div className="font-display text-5xl tracking-wider text-foreground">
                    R$ 79
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">por mês · pago antecipado</div>
                </div>
                <ul className="space-y-2.5 text-sm">
                  {[
                    "1 corte por semana (4×/mês)",
                    "Agendamento online garantido",
                    "Taxa R$ 10 para semanas extras",
                    "Atendimento na barbearia",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-accent/60 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="mt-auto border-border hover:border-accent/40 hover:bg-surface-3 h-12">
                  <Link to="/planos">Assinar Básico</Link>
                </Button>
              </div>

              {/* Plano Premium */}
              <div className="plan-premium rounded-xl p-6 flex flex-col gap-5 relative overflow-hidden">
                {/* Shine */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="h-4 w-4 text-accent" />
                    <span className="text-xs uppercase tracking-[0.3em] shimmer-gold font-semibold">Premium</span>
                  </div>
                  <div className="font-display text-5xl tracking-wider text-accent-grad">
                    R$ 149
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">por mês · pago antecipado</div>
                </div>
                <ul className="space-y-2.5 text-sm">
                  {[
                    "Open bar — consuma à vontade",
                    "1 corte/semana sem taxa extra",
                    "Sem taxa para semanas adicionais",
                    "Prioridade no agendamento",
                    "Atendimento VIP personalizado",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button asChild variant="cta" className="mt-auto h-12">
                  <Link to="/planos">Assinar Premium</Link>
                </Button>
              </div>
            </div>

            {/* Tax policy notice */}
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="flex items-start gap-3 bg-surface-2 border border-border rounded-lg p-4 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span>
                  A taxa de <strong className="text-foreground">R$ 10,00</strong> é cobrada para agendamentos em semanas
                  além do plano — garantindo o horário reservado ao barbeiro. Se o cancelamento for feito
                  pelo barbeiro, o valor é devolvido integralmente.
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/planos"
                className="text-sm text-accent hover:text-accent/80 underline underline-offset-4 transition-colors"
              >
                Ver todos os detalhes dos planos →
              </Link>
            </div>
          </div>
        </section>

        {/* ── SOBRE ── */}
        <section className="border-t border-border/60">
          <div className="container py-14 sm:py-20 flex flex-col sm:flex-row items-center gap-10 sm:gap-16">
            {/* Avatar / decorativo */}
            <div className="shrink-0 flex flex-col items-center gap-4">
              <div className="h-24 w-24 rounded-full bg-surface-2 border border-border/60 grid place-items-center ring-2 ring-accent/20">
                <Star className="h-10 w-10 text-accent" strokeWidth={1.5} />
              </div>
              <WhatsAppLink
                className="flex items-center gap-2 text-xs text-accent hover:text-accent/80 transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                Falar com {config.barbeiro}
              </WhatsAppLink>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-accent mb-3">Sobre</p>
              <h2 className="font-display text-4xl sm:text-5xl uppercase tracking-wider mb-4">
                {config.barbeiro} cuida<br />de você
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-md">
                {config.bio}
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA FIXO MOBILE ── */}
        <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-background/95 backdrop-blur border-t border-border/60 safe-bottom">
          <div className="flex gap-2 p-3">
            <Button asChild variant="outline" className="flex-1 h-12 border-border text-sm">
              <Link to="/planos">
                <Crown className="h-4 w-4 mr-1 text-accent" /> Planos
              </Link>
            </Button>
            <Button asChild variant="cta" className="flex-[2] h-12 text-sm">
              <Link to="/agendar">
                Agendar agora <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Espaço para o CTA fixo no mobile */}
        <div className="h-20 sm:hidden" />
      </main>

      <footer className="border-t border-border/60">
        <div className="container py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span>© {new Date().getFullYear()} Zeca Barbearia</span>
          <div className="flex gap-6">
            <Link to="/planos" className="hover:text-accent transition-colors">Planos</Link>
            <Link to="/agendar" className="hover:text-accent transition-colors">Agendar</Link>
            <WhatsAppLink className="hover:text-accent transition-colors">WhatsApp</WhatsAppLink>
          </div>
        </div>
      </footer>
    </div>
  );
}
