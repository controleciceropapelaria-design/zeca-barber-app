import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check } from "lucide-react";
import { toast } from "sonner";

const MONTHLY_GOAL_KEY = "zeca_monthly_goal";

export default function Financeiro() {
  const [data, setData] = useState({ today: 0, week: 0, month: 0, goalToday: 0, count: 0, countWeek: 0, countMonth: 0 });
  const [monthlyGoal, setMonthlyGoal] = useState<number>(() => Number(localStorage.getItem(MONTHLY_GOAL_KEY) ?? 0));
  const [editingMonthly, setEditingMonthly] = useState(false);
  const [monthlyDraft, setMonthlyDraft] = useState("");
  const monthlyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const now = new Date();
      const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
      const endToday   = new Date(now); endToday.setHours(23, 59, 59, 999);
      const startWeek  = new Date(startToday); startWeek.setDate(startToday.getDate() - startToday.getDay());
      const endWeek    = new Date(startWeek); endWeek.setDate(startWeek.getDate() + 7);
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const fetchRows = async (from: Date, to: Date) => {
        const { data: rows } = await supabase
          .from("appointments")
          .select("price, status")
          .gte("scheduled_at", from.toISOString())
          .lte("scheduled_at", to.toISOString());
        return (rows ?? []).filter((r) => r.status !== "cancelled");
      };

      const [todayRows, weekRows, monthRows, goalRow] = await Promise.all([
        fetchRows(startToday, endToday),
        fetchRows(startWeek, endWeek),
        fetchRows(startMonth, endMonth),
        supabase.from("business_hours").select("daily_goal").eq("day_of_week", now.getDay()).maybeSingle(),
      ]);

      const sum = (rows: { price: number }[]) => rows.reduce((s, r) => s + Number(r.price), 0);

      setData({
        today:      sum(todayRows),
        week:       sum(weekRows),
        month:      sum(monthRows),
        goalToday:  Number(goalRow.data?.daily_goal ?? 0),
        count:      todayRows.length,
        countWeek:  weekRows.length,
        countMonth: monthRows.length,
      });
    })();
  }, []);

  const saveMonthlyGoal = () => {
    const val = Number(monthlyDraft);
    if (isNaN(val) || val < 0) return toast.error("Valor inválido");
    setMonthlyGoal(val);
    localStorage.setItem(MONTHLY_GOAL_KEY, String(val));
    setEditingMonthly(false);
    toast.success("Meta mensal salva");
  };

  const startEditMonthly = () => {
    setMonthlyDraft(String(monthlyGoal || ""));
    setEditingMonthly(true);
    setTimeout(() => monthlyInputRef.current?.focus(), 50);
  };

  const goalDayPct   = data.goalToday  > 0 ? Math.min(100, (data.today  / data.goalToday)  * 100) : 0;
  const goalMonthPct = monthlyGoal     > 0 ? Math.min(100, (data.month  / monthlyGoal)     * 100) : 0;

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">Financeiro</p>
        <h1 className="font-display text-4xl md:text-5xl uppercase tracking-wider">Visão geral</h1>
      </header>

      {/* Meta do dia */}
      <section className="surface border border-border rounded-xl p-6 md:p-8 mb-6">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Meta do dia</p>
            <p className="font-display text-5xl md:text-6xl text-accent mt-2">R$ {data.today.toFixed(0)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              de R$ {data.goalToday.toFixed(0)} · {data.count} {data.count === 1 ? "atendimento" : "atendimentos"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Meta definida em <strong className="text-foreground">Geral → Horários</strong> por dia da semana
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Progresso</p>
            <p className="font-display text-4xl mt-2">{goalDayPct.toFixed(0)}%</p>
          </div>
        </div>
        <Progress value={goalDayPct} className="h-2 bg-surface-3" />
      </section>

      {/* Meta do mês */}
      <section className="surface border border-border rounded-xl p-6 md:p-8 mb-6">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-4">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Meta do mês</p>
            <p className="font-display text-5xl md:text-6xl text-accent mt-2">R$ {data.month.toFixed(0)}</p>
            <div className="flex items-center gap-2 mt-1">
              {editingMonthly ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">de R$</span>
                  <Input
                    ref={monthlyInputRef}
                    type="number"
                    value={monthlyDraft}
                    onChange={(e) => setMonthlyDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveMonthlyGoal()}
                    className="w-28 h-8 text-sm bg-surface-2 border-border"
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveMonthlyGoal}>
                    <Check className="h-4 w-4 text-accent" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    de R$ {monthlyGoal > 0 ? monthlyGoal.toFixed(0) : "—"} · {data.countMonth} atendimentos
                  </p>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={startEditMonthly} title="Editar meta mensal">
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-accent" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Progresso</p>
            <p className="font-display text-4xl mt-2">{goalMonthPct.toFixed(0)}%</p>
          </div>
        </div>
        <Progress value={goalMonthPct} className="h-2 bg-surface-3" />
        {monthlyGoal === 0 && (
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
            💡 Clique no lápis para definir sua meta mensal
          </p>
        )}
      </section>

      {/* Cards de receita */}
      <div className="grid md:grid-cols-3 gap-px bg-border/60 rounded-xl overflow-hidden">
        {[
          { label: "Receita hoje",   value: data.today,  count: data.count },
          { label: "Semana atual",   value: data.week,   count: data.countWeek },
          { label: "Mês atual",      value: data.month,  count: data.countMonth },
        ].map((k) => (
          <div key={k.label} className="surface p-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{k.label}</div>
            <div className="font-display text-4xl mt-2">R$ {k.value.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.count} atendimento{k.count !== 1 ? "s" : ""}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
