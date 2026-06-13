"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { expert } from "@/lib/mock-data";
import { DatabaseIcon, LeafIcon, LogoutIcon, SidebarPinIcon } from "./icons";

const navItems = [
  { href: "/juicio-experto", label: "Juicio experto", icon: LeafIcon },
  { href: "/dataset", label: "Dataset", icon: DatabaseIcon },
];

const expertInitial = expert.name.trim().charAt(0).toUpperCase();

export function Sidebar() {
  const pathname = usePathname();
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
        isExpanded ? "lg:w-80" : "lg:w-20"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-14 w-72 shrink-0">
        <div className="absolute left-0 top-0 flex h-12 w-12 min-w-0 items-center justify-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/20">
            <LeafIcon className="h-7 w-7 text-emerald-300" />
          </div>
        </div>
        <div
          className="absolute left-16 right-14 top-0 flex h-12 min-w-0 items-center overflow-hidden"
        >
          <h1 className="truncate text-xl font-bold leading-tight">AgroCafeLLM</h1>
        </div>

        <button
          aria-label={isPinned ? "Desfijar barra lateral" : "Fijar barra lateral abierta"}
          aria-pressed={isPinned}
          className={`absolute right-0 top-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
            isPinned ? "bg-emerald-400 text-emerald-950" : "bg-white/10 text-white/80 hover:bg-white/15"
          }`}
          onClick={togglePinned}
          tabIndex={isExpanded ? 0 : -1}
          title={isPinned ? "Desfijar barra lateral" : "Fijar barra lateral abierta"}
          type="button"
        >
          <SidebarPinIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="h-px w-full bg-white/10" />

      <nav className="flex w-72 gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {navItems.map((item) => {
          const Icon = item.icon;
          const selected = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`grid h-14 shrink-0 grid-cols-[3rem_1fr] items-center overflow-hidden rounded-2xl px-0 text-sm transition-all duration-300 ease-out ${
                isExpanded ? "w-72" : "w-12"
              } ${
                selected ? "bg-emerald-400 font-semibold text-emerald-950" : "text-white/80 hover:bg-white/10"
              }`}
              title={item.label}
            >
              <span className="flex h-12 w-12 items-center justify-center">
                <Icon className="h-5 w-5 shrink-0" />
              </span>
              <span className="whitespace-nowrap text-left">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto lg:absolute lg:bottom-4 lg:left-3">
        <div
          className={`relative h-14 overflow-hidden rounded-2xl border border-white/10 bg-white/10 transition-all duration-300 ease-out ${
            isExpanded ? "w-72" : "w-14"
          }`}
        >
          <span className="absolute left-0 top-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400 text-2xl font-semibold leading-none text-emerald-950">
            {expertInitial}
          </span>
          <div
            className="absolute left-[4.5rem] right-14 top-1/2 min-w-0 -translate-y-1/2"
          >
            <p className="truncate text-base font-bold leading-tight">{expert.name}</p>
            <p className="truncate text-sm font-semibold leading-tight text-white/60">{expert.role}</p>
          </div>
          <button
            aria-label="Cerrar sesion"
            className={`absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/10 hover:text-white ${
              isExpanded ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            tabIndex={isExpanded ? 0 : -1}
            title="Cerrar sesion"
            type="button"
          >
            <LogoutIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </aside>
  );
}
