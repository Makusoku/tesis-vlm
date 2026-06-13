"use client";

import { useEffect, useState } from "react";
import type { ScreenId } from "@/lib/types";
import { expert } from "@/lib/mock-data";
import { DatabaseIcon, LeafIcon, PinIcon } from "./icons";

interface SidebarProps {
  active: ScreenId;
  onChange: (screen: ScreenId) => void;
}

const navItems = [
  { id: "expert-judgment" as const, label: "Juicio experto", icon: LeafIcon },
  { id: "dataset" as const, label: "Dataset", icon: DatabaseIcon },
];

const expertInitial = expert.name.trim().charAt(0).toUpperCase();

export function Sidebar({ active, onChange }: SidebarProps) {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
      className={`relative flex w-full flex-col gap-3 overflow-hidden bg-canopy-900 p-4 text-white transition-all duration-300 ease-out lg:sticky lg:top-0 lg:h-screen lg:shrink-0 ${
        isExpanded ? "lg:w-72" : "lg:w-20"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-14 w-64 shrink-0">
        <div className="absolute left-0 top-0 flex h-12 w-12 min-w-0 items-center justify-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/20">
            <LeafIcon className="h-7 w-7 text-emerald-300" />
          </div>
        </div>
        <div
          className="absolute left-16 right-14 top-1 min-w-0 overflow-hidden"
        >
          <h1 className="truncate text-xl font-bold leading-tight">AgroCafeLLM</h1>
          <p className="truncate text-xs text-emerald-100/70">Curacion experta multimodal</p>
        </div>

        <button
          aria-label={isPinned ? "Desfijar sidebar" : "Fijar sidebar"}
          aria-pressed={isPinned}
          className={`absolute right-0 top-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
            isPinned ? "bg-emerald-400 text-emerald-950" : "bg-white/10 text-white/80 hover:bg-white/15"
          }`}
          onClick={togglePinned}
          tabIndex={isExpanded ? 0 : -1}
          title={isPinned ? "Desfijar sidebar" : "Fijar sidebar"}
          type="button"
        >
          <PinIcon className={`h-5 w-5 transition ${isPinned ? "rotate-45" : ""}`} />
        </button>
      </div>

      <div className="h-px w-full bg-white/10" />

      <nav className="flex w-64 gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {navItems.map((item) => {
          const Icon = item.icon;
          const selected = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`grid h-14 shrink-0 grid-cols-[3rem_1fr] items-center overflow-hidden rounded-2xl px-0 text-sm transition-all duration-300 ease-out ${
                isExpanded ? "w-64" : "w-12"
              } ${
                selected ? "bg-emerald-400 font-semibold text-emerald-950" : "text-white/80 hover:bg-white/10"
              }`}
              title={item.label}
              type="button"
            >
              <span className="flex h-12 w-12 items-center justify-center">
                <Icon className="h-5 w-5 shrink-0" />
              </span>
              <span className="whitespace-nowrap text-left">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto lg:absolute lg:bottom-4 lg:left-3">
        <div
          className={`relative h-14 overflow-hidden rounded-2xl border border-white/10 bg-white/10 transition-all duration-300 ease-out ${
            isExpanded ? "w-64" : "w-14"
          }`}
        >
          <span className="absolute left-0 top-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400 text-2xl font-semibold leading-none text-emerald-950">
            {expertInitial}
          </span>
          <div
            className="absolute left-[4.5rem] right-4 top-1/2 min-w-0 -translate-y-1/2"
          >
            <p className="truncate text-base font-bold leading-tight">{expert.name}</p>
            <p className="truncate text-sm font-semibold leading-tight text-white/60">{expert.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
