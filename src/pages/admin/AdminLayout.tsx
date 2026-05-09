import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, CalendarDays, Settings2, LineChart, LogOut, Scissors, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const items = [
  { to: "/admin", end: true, label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/admin/geral", label: "Geral", icon: Settings2 },
  { to: "/admin/financeiro", label: "Financeiro", icon: LineChart },
  { to: "/admin/configuracoes", label: "Configurações", icon: SlidersHorizontal },
];

export default function AdminLayout() {
  const { signOut } = useAuth();
  const nav = useNavigate();
  const onSignOut = async () => {
    await signOut();
    toast.success("Sessão encerrada");
    nav("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="md:w-60 border-b md:border-b-0 md:border-r border-border/60 surface flex md:flex-col">
        <div className="hidden md:flex p-6 items-center gap-2 border-b border-border/60">
          <div className="h-8 w-8 rounded-sm border border-accent/40 grid place-items-center">
            <Scissors className="h-4 w-4 text-accent" strokeWidth={1.5} />
          </div>
          <div className="font-display text-lg uppercase tracking-[0.15em]">Zeca <span className="text-accent">Adm.</span></div>
        </div>

        <nav className="flex md:flex-col gap-1 p-2 md:p-3 flex-1 overflow-x-auto">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-accent/10 text-accent border-l-2 border-accent md:border-l-2"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-2",
                )
              }
            >
              <it.icon className="h-4 w-4" />
              <span className="uppercase tracking-wider text-xs font-medium">{it.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:block p-3 border-t border-border/60">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={onSignOut}>
            <LogOut className="h-4 w-4" /> <span className="text-xs uppercase tracking-wider">Sair</span>
          </Button>
        </div>
        <div className="md:hidden p-2">
          <Button variant="ghost" size="icon" onClick={onSignOut}><LogOut className="h-4 w-4" /></Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
