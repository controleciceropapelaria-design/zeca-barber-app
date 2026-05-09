import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Copy, Instagram, MessageCircle, MapPin, Check, ExternalLink, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { getConfig } from "@/lib/useConfig";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ today: 0, revenue: 0, clients: 0 });
  const [copied, setCopied] = useState(false);
  const bookingUrl = `${window.location.origin}${import.meta.env.BASE_URL}agendar`;
  const cfg = getConfig();

  useEffect(() => {
    (async () => {
      const start = new Date(); start.setHours(0,0,0,0);
      const end = new Date(); end.setHours(23,59,59,999);
      const [a, c] = await Promise.all([
        supabase.from("appointments")
          .select("price, status")
          .gte("scheduled_at", start.toISOString())
          .lte("scheduled_at", end.toISOString()),
        supabase.from("clients").select("id", { count: "exact", head: true }),
      ]);
      const list = (a.data ?? []).filter((x) => x.status !== "cancelled");
      setStats({
        today: list.length,
        revenue: list.reduce((s, x) => s + Number(x.price ?? 0), 0),
        clients: c.count ?? 0,
      });
    })();
  }, []);

  const copy = async () => {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast.success("Link copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">Painel</p>
        <h1 className="font-display text-4xl md:text-5xl uppercase tracking-wider">Bom dia, {cfg.barbeiro}.</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/60 rounded-md overflow-hidden mb-10">
        {[
          { label: "Cortes hoje", value: stats.today },
          { label: "Receita do dia", value: `R$ ${stats.revenue.toFixed(0)}` },
          { label: "Clientes ativos", value: stats.clients },
        ].map((k) => (
          <div key={k.label} className="surface p-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{k.label}</div>
            <div className="font-display text-4xl mt-2 text-foreground">{k.value}</div>
          </div>
        ))}
      </div>

      <section className="surface border border-border rounded-md p-6 md:p-8 mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">Compartilhe</p>
        <h2 className="font-display text-2xl uppercase tracking-wider mb-4">Link de agendamento</h2>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          <code className="flex-1 surface-2 border border-border rounded-md px-4 py-3 text-sm font-mono text-muted-foreground truncate">
            {bookingUrl}
          </code>
          <Button variant="cta" onClick={copy} className="h-12 px-6">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado" : "Copiar Link"}
          </Button>
          <Button variant="ctaOutline" asChild className="h-12 px-4">
            <Link to="/agendar" target="_blank"><ExternalLink className="h-4 w-4" /> Abrir</Link>
          </Button>
        </div>
      </section>

      <section className="surface border border-border rounded-md p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-1">Barbearia</p>
            <h2 className="font-display text-2xl uppercase tracking-wider">Informações</h2>
          </div>
          <Link
            to="/admin/configuracoes"
            className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-accent transition-colors border border-border hover:border-accent/40 rounded-lg px-3 py-2"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Editar
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          {cfg.endereco ? (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <div>
                <div className="text-muted-foreground text-xs uppercase tracking-wider">Endereço</div>
                <div className="mt-1">{cfg.endereco}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 opacity-40">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground italic">Endereço não configurado</div>
            </div>
          )}
          {cfg.whatsapp ? (
            <div className="flex items-start gap-3">
              <MessageCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <div>
                <div className="text-muted-foreground text-xs uppercase tracking-wider">WhatsApp</div>
                <div className="mt-1">{cfg.whatsapp}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 opacity-40">
              <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground italic">WhatsApp não configurado</div>
            </div>
          )}
          {cfg.instagram ? (
            <div className="flex items-start gap-3">
              <Instagram className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <div>
                <div className="text-muted-foreground text-xs uppercase tracking-wider">Instagram</div>
                <div className="mt-1">{cfg.instagram}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 opacity-40">
              <Instagram className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground italic">Instagram não configurado</div>
            </div>
          )}
        </div>
        {(!cfg.endereco || !cfg.whatsapp || !cfg.instagram) && (
          <Link
            to="/admin/configuracoes"
            className="inline-flex items-center gap-1.5 mt-4 text-xs text-accent hover:text-accent/80 underline underline-offset-4 transition-colors"
          >
            <SlidersHorizontal className="h-3 w-3" /> Completar informações em Configurações
          </Link>
        )}
      </section>
    </div>
  );
}
