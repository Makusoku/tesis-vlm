"use client";

import type { ScreenId } from "@/lib/types";
import { expert } from "@/lib/mock-data";
import { DatabaseIcon, LeafIcon, TrophyIcon } from "./icons";

interface SidebarProps {
  active: ScreenId;
  onChange: (screen: ScreenId) => void;
}

const navItems = [
  { id: "expert-judgment" as const, label: "Juicio experto", icon: LeafIcon },
  { id: "dataset" as const, label: "Dataset", icon: DatabaseIcon },
];

export function Sidebar({ active, onChange }: SidebarProps) {
  const progress = Math.round((expert.xp / expert.nextLevelXp) * 100);

  return (
    <aside className="flex min-h-screen w-full flex-col gap-6 bg-canopy-900 p-5 text-white lg:w-72 lg:shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/20">
          <LeafIcon className="h-7 w-7 text-emerald-300" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-tight">AgroCafeLLM</h1>
          <p className="text-xs text-emerald-100/70">Curacion experta multimodal</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-200 font-bold text-emerald-950">EV</div>
          <div>
            <p className="text-sm font-semibold">{expert.name}</p>
            <p className="text-xs text-white/60">Nivel {expert.level} · {expert.role}</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-emerald-300" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-white/60">{expert.xp} / {expert.nextLevelXp} XP para el siguiente nivel</p>
      </div>

      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const selected = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                selected ? "bg-emerald-400 font-semibold text-emerald-950" : "text-white/80 hover:bg-white/10"
              }`}
              type="button"
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl bg-amber-300 p-4 text-amber-950">
        <div className="flex items-center gap-2 font-bold">
          <TrophyIcon className="h-5 w-5" />
          Mision semanal
        </div>
        <p className="mt-2 text-xs">Validar 30 hojas con razonamiento experto y diagnostico diferencial.</p>
        <div className="mt-3 flex justify-between text-xs font-semibold">
          <span>18 / 30</span>
          <span>+120 XP</span>
        </div>
      </div>
    </aside>
  );
}
