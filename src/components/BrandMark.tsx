import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const sizes = {
  sm: { img: "h-16",    gap: "gap-2" },
  md: { img: "h-24",    gap: "gap-3" },
  lg: { img: "h-40",    gap: "gap-4" },
  xl: { img: "h-52",    gap: "gap-4" },
};

export function BrandMark({
  size = "md",
  to = "/",
  showWordmark = false,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  to?: string | null;
  showWordmark?: boolean;
}) {
  const s = sizes[size];

  const inner = (
    <div className={`flex items-center ${s.gap} select-none`}>
      <img
        src={logo}
        alt="Zeca Barbearia"
        className={`${s.img} w-auto object-contain`}
        style={{ mixBlendMode: "screen" }}
        draggable={false}
      />
      {showWordmark && (
        <div className="leading-none hidden sm:block">
          <div className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
            Tradição & Estilo
          </div>
        </div>
      )}
    </div>
  );

  if (!to) return inner;
  return (
    <Link to={to} className="inline-flex items-center" draggable={false}>
      {inner}
    </Link>
  );
}

/** Logo grande para hero da landing */
export function BrandHero() {
  return (
    <div className="flex flex-col items-center select-none">
      <img
        src={logo}
        alt="Zeca Barbearia"
        className="h-64 sm:h-80 w-auto object-contain"
        style={{ mixBlendMode: "screen" }}
        draggable={false}
      />
    </div>
  );
}
