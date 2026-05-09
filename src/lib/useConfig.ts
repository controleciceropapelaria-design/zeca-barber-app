import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BizConfig = {
  nome: string;
  barbeiro: string;
  endereco: string;
  whatsapp: string;
  instagram: string;
  bio: string;
  cor_tema: string;
};

const DEFAULTS: BizConfig = {
  nome: "Zeca Barbearia",
  barbeiro: "Zeca",
  endereco: "",
  whatsapp: "",
  instagram: "",
  bio: "Mais de 10 anos na tesoura. Ambiente acolhedor, atendimento preciso.",
  cor_tema: "gold",
};

const KEY = "zeca_biz_config";

function fromStorage(): BizConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function toStorage(cfg: BizConfig) {
  localStorage.setItem(KEY, JSON.stringify(cfg));
}

/* Tenta carregar do Supabase (tabela business_settings se existir),
   caso contrário usa localStorage. */
async function loadFromSupabase(): Promise<BizConfig | null> {
  try {
    const { data, error } = await (supabase as any)
      .from("business_settings")
      .select("value")
      .eq("key", "config")
      .maybeSingle();
    if (error || !data) return null;
    return { ...DEFAULTS, ...JSON.parse(data.value) };
  } catch {
    return null;
  }
}

async function saveToSupabase(cfg: BizConfig) {
  try {
    await (supabase as any)
      .from("business_settings")
      .upsert({ key: "config", value: JSON.stringify(cfg) }, { onConflict: "key" });
  } catch {
    // tabela opcional — ignora se não existir
  }
}

/* Hook para uso nos componentes */
export function useConfig() {
  const [config, setConfigState] = useState<BizConfig>(fromStorage);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFromSupabase().then((remote) => {
      if (remote) {
        setConfigState(remote);
        toStorage(remote);
      }
      setLoading(false);
    });
  }, []);

  const save = useCallback(async (next: BizConfig) => {
    setConfigState(next);
    toStorage(next);
    await saveToSupabase(next);
  }, []);

  return { config, save, loading };
}

/* Leitura síncrona simples (para componentes que não precisam de loading) */
export function getConfig(): BizConfig {
  return fromStorage();
}
