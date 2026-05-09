import { useState, useEffect } from "react";
import { useConfig, type BizConfig } from "@/lib/useConfig";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin, Phone, Instagram, User, Store, FileText,
  Save, Check, ExternalLink, Copy, Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";

export default function Configuracoes() {
  const { config, save, loading } = useConfig();
  const [form, setForm] = useState<BizConfig>(config);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sincroniza quando o config carregar do Supabase
  useEffect(() => {
    if (!loading) setForm(config);
  }, [loading]);

  const set = (k: keyof BizConfig) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.nome.trim()) return toast.error("Nome da barbearia obrigatório");
    setSaving(true);
    await save(form);
    setSaving(false);
    setSaved(true);
    toast.success("Configurações salvas");
    setTimeout(() => setSaved(false), 2500);
  };

  const bookingUrl = `${window.location.origin}/agendar`;
  const copyLink = async () => {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast.success("Link copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  const wppHref = form.whatsapp
    ? `https://wa.me/${form.whatsapp.replace(/\D/g, "")}`
    : null;
  const igHref = form.instagram
    ? `https://instagram.com/${form.instagram.replace("@", "")}`
    : null;

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">Admin</p>
        <h1 className="font-display text-4xl md:text-5xl uppercase tracking-wider">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Informações da barbearia exibidas no app e na página dos clientes.
        </p>
      </header>

      <div className="space-y-6">

        {/* Identidade */}
        <div className="surface border border-border rounded-xl p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Store className="h-4 w-4 text-accent" />
            <h2 className="font-display text-xl uppercase tracking-wider">Identidade</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Nome da barbearia
              </Label>
              <Input
                value={form.nome}
                onChange={set("nome")}
                maxLength={80}
                className="mt-2 bg-surface-2 border-border h-11"
                placeholder="Ex: Zeca Barbearia"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Nome do barbeiro
              </Label>
              <Input
                value={form.barbeiro}
                onChange={set("barbeiro")}
                maxLength={60}
                className="mt-2 bg-surface-2 border-border h-11"
                placeholder="Ex: Zeca"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              <FileText className="inline h-3 w-3 mr-1" />
              Bio / Apresentação
            </Label>
            <Textarea
              value={form.bio}
              onChange={set("bio")}
              maxLength={300}
              rows={3}
              className="mt-2 bg-surface-2 border-border"
              placeholder="Uma frase curta sobre a barbearia para exibir na página inicial..."
            />
            <p className="text-[11px] text-muted-foreground mt-1">{form.bio.length}/300</p>
          </div>
        </div>

        {/* Contato */}
        <div className="surface border border-border rounded-xl p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Phone className="h-4 w-4 text-accent" />
            <h2 className="font-display text-xl uppercase tracking-wider">Contato</h2>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              <MapPin className="inline h-3 w-3 mr-1" /> Endereço completo
            </Label>
            <Input
              value={form.endereco}
              onChange={set("endereco")}
              maxLength={200}
              className="mt-2 bg-surface-2 border-border h-11"
              placeholder="Rua Exemplo, 123 — Bairro, Cidade - SP"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                <Phone className="inline h-3 w-3 mr-1" /> WhatsApp
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={form.whatsapp}
                  onChange={set("whatsapp")}
                  inputMode="tel"
                  maxLength={20}
                  className="bg-surface-2 border-border h-11"
                  placeholder="5511999999999"
                />
                {wppHref && (
                  <a
                    href={wppHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-11 w-11 shrink-0 border border-border rounded-lg grid place-items-center hover:border-accent/40 hover:bg-surface-2 transition-colors"
                    title="Testar WhatsApp"
                  >
                    <ExternalLink className="h-4 w-4 text-accent" />
                  </a>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Somente números com DDD e DDI. Ex: 5511999999999
              </p>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                <Instagram className="inline h-3 w-3 mr-1" /> Instagram
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={form.instagram}
                  onChange={set("instagram")}
                  maxLength={60}
                  className="bg-surface-2 border-border h-11"
                  placeholder="@zecabarbearia"
                />
                {igHref && (
                  <a
                    href={igHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-11 w-11 shrink-0 border border-border rounded-lg grid place-items-center hover:border-accent/40 hover:bg-surface-2 transition-colors"
                    title="Abrir Instagram"
                  >
                    <ExternalLink className="h-4 w-4 text-accent" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Link de agendamento */}
        <div className="surface border border-border rounded-xl p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <LinkIcon className="h-4 w-4 text-accent" />
            <h2 className="font-display text-xl uppercase tracking-wider">Link de agendamento</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <code className="flex-1 bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm font-mono text-muted-foreground truncate">
              {bookingUrl}
            </code>
            <Button variant="cta" onClick={copyLink} className="h-11 px-5 shrink-0">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-4 border border-border rounded-lg flex items-center gap-2 text-sm text-muted-foreground hover:border-accent/40 hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4" /> Abrir
            </a>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Compartilhe este link com seus clientes pelo WhatsApp, Instagram ou onde preferir.
          </p>
        </div>

        {/* Preview */}
        {(form.whatsapp || form.instagram || form.endereco) && (
          <div className="surface border border-border/60 rounded-xl p-5 md:p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">Preview — como vai aparecer no app</p>
            <div className="space-y-3 text-sm">
              {form.endereco && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <span className="text-foreground">{form.endereco}</span>
                </div>
              )}
              {form.whatsapp && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <span className="text-foreground">{form.whatsapp}</span>
                </div>
              )}
              {form.instagram && (
                <div className="flex items-start gap-3">
                  <Instagram className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <span className="text-foreground">{form.instagram}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Salvar */}
        <div className="flex justify-end pt-2">
          <Button
            variant="cta"
            size="lg"
            className="h-13 px-10"
            onClick={handleSave}
            disabled={saving}
          >
            {saved ? (
              <><Check className="h-4 w-4" /> Salvo!</>
            ) : (
              <><Save className="h-4 w-4" /> Salvar configurações</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
