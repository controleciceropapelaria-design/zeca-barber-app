import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/BrandMark";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

export default function Login() {
  const { signIn, session } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) nav(from, { replace: true });
  }, [session, from, nav]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await signIn(parsed.data.email, parsed.data.password);
    setSubmitting(false);
    if (error) {
      toast.error("Credenciais inválidas");
      return;
    }
    toast.success("Bem-vindo, Zeca");
    nav(from, { replace: true });
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-6">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-10 flex justify-center">
          <BrandMark size="xl" to="/" />
        </div>
        <div className="surface border border-border rounded-md p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">Acesso restrito</p>
          <h2 className="font-display text-3xl uppercase tracking-wider mb-6">Entrar</h2>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 bg-surface-2 border-border" />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Senha</Label>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 bg-surface-2 border-border" />
            </div>
            <Button type="submit" variant="cta" className="w-full h-11 mt-2" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60 text-center mt-6">
          Apenas pessoal autorizado
        </p>
      </div>
    </div>
  );
}
