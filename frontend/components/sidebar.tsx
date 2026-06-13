"use client";

import { useEffect, useState } from "react";
import type { ScreenId } from "@/lib/types";
import { expert } from "@/lib/mock-data";
import { DatabaseIcon, LeafIcon, PinIcon, TrophyIcon } from "./icons";

interface SidebarProps {
  active: ScreenId;
  onChange: (screen: ScreenId) => void;
}

const navItems = [
  { id: "expert-judgment" as const, label: "Juicio experto", icon: LeafIcon },
  { id: "dataset" as const, label: "Dataset", icon: DatabaseIcon },
];

export function Sidebar({ active, onChange }: SidebarProps) {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const progress = Math.round((expert.xp / expert.nextLevelXp) * 100);
  const isExpanded = isPinned || isHovered;

  useEffect(() => {
    setIsPinned(window.localStorage.getItem("agrocafellm-sidebar-pinned") === "true");
  }, []);

  function togglePinned() {
    setIsPinned((current) => {
      const next = !current;
      window.localStorage.setItem("agrocafellm-sidebar-pinned", String(next));
      return next;
    });
  }

  return (
    <aside
      className={`flex w-full flex-col gap-4 bg-canopy-900 p-4 text-white transition-all duration-300 ease-out lg:sticky lg:top-0 lg:min-h-screen lg:shrink-0 ${
        isExpanded ? "lg:w-72" : "lg:w-20"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`grid gap-3 ${isExpanded ? "grid-cols-[3rem_1fr_auto] items-center" : "grid-cols-[3rem] justify-center"}`}
      >
        <div className="flex h-12 w-12 min-w-0 items-center justify-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/20">
            <LeafIcon className="h-7 w-7 text-emerald-300" />
          </div>
        </div>
        <div
          className={`min-w-0 overflow-hidden transition-all duration-200 ${
            isExpanded ? "max-w-44 opacity-100" : "max-w-0 opacity-0 lg:pointer-events-none"
          }`}
        >
          <h1 className="whitespace-nowrap text-xl font-bold leading-tight">AgroCafeLLM</h1>
          <p className="whitespace-nowrap text-xs text-emerald-100/70">Curacion experta multimodal</p>
        </div>

        <button
          aria-label={isPinned ? "Desfijar sidebar" : "Fijar sidebar"}
          aria-pressed={isPinned}
          className={`${isExpanded ? "flex" : "hidden"} h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
            isPinned ? "bg-emerald-400 text-emerald-950" : "bg-white/10 text-white/80 hover:bg-white/15"
          }`}
          onClick={togglePinned}
          title={isPinned ? "Desfijar sidebar" : "Fijar sidebar"}
          type="button"
        >
          <PinIcon className={`h-5 w-5 transition ${isPinned ? "rotate-45" : ""}`} />
        </button>
      </div>

      <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {navItems.map((item) => {
          const Icon = item.icon;
          const selected = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`grid h-14 shrink-0 grid-cols-[3rem_1fr] items-center rounded-2xl px-0 text-sm transition lg:w-full ${
                selected ? "bg-emerald-400 font-semibold text-emerald-950" : "text-white/80 hover:bg-white/10"
              }`}
              title={item.label}
              type="button"
            >
              <span className="flex h-12 w-12 items-center justify-center">
                <Icon className="h-5 w-5 shrink-0" />
              </span>
              <span
                className={`whitespace-nowrap transition-all duration-200 ${
                  isExpanded ? "max-w-40 opacity-100" : "max-w-0 overflow-hidden opacity-0 lg:pointer-events-none"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div
          className={`overflow-hidden rounded-2xl border border-white/10 bg-white/10 transition-all duration-200 ${
            isExpanded ? "max-h-40 p-4 opacity-100" : "max-h-0 border-transparent p-0 opacity-0 lg:pointer-events-none"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-200 font-bold text-emerald-950">EV</div>
            <div className="min-w-0">
              <p className="whitespace-nowrap text-sm font-semibold">{expert.name}</p>
              <p className="whitespace-nowrap text-xs text-white/60">Nivel {expert.level} · {expert.role}</p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-emerald-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 whitespace-nowrap text-xs text-white/60">{expert.xp} / {expert.nextLevelXp} XP para el siguiente nivel</p>
        </div>

      <div
        className={`rounded-2xl bg-amber-300 text-amber-950 transition-all duration-200 ${
          isExpanded ? "max-h-40 p-4 opacity-100" : "max-h-0 overflow-hidden p-0 opacity-0 lg:pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2 font-bold">
          <TrophyIcon className="h-5 w-5 shrink-0" />
          <span className="whitespace-nowrap">Mision semanal</span>
        </div>
        <p className="mt-2 text-xs">Validar 30 hojas con razonamiento experto y diagnostico diferencial.</p>
        <div className="mt-3 flex justify-between text-xs font-semibold">
          <span>18 / 30</span>
          <span>+120 XP</span>
        </div>
      </div>
      </div>
    </aside>
  );
}
