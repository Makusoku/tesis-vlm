"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DatabaseIcon, LeafIcon, LogoutIcon, MenuIcon, SidebarPinIcon, XIcon } from "./icons";

const navItems = [
  { href: "/juicio-experto", label: "Juicio experto", icon: LeafIcon },
  { href: "/dataset", label: "Dataset", icon: DatabaseIcon },
];

interface SidebarProps {
  user: {
    email?: string | null;
    name: string;
    role?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isExpanded = isPinned || isHovered;
  const postLogoutRedirectURL = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/login`
    : "/login";
  const logoutHref = `/api/auth/logout?post_logout_redirect_url=${encodeURIComponent(postLogoutRedirectURL)}`;
  const userInitial = user.name.trim().charAt(0).toUpperCase() || "U";
  const userSubtitle = user.email || user.role || "Sesión activa";

  useEffect(() => {
    setIsPinned(window.localStorage.getItem("agrocafellm-sidebar-pinned") === "true");
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  function togglePinned() {
    setIsPinned((current) => {
      const next = !current;
      window.localStorage.setItem("agrocafellm-sidebar-pinned", String(next));
      return next;
    });
  }

  function renderSidebarContent(expanded: boolean, mode: "desktop" | "mobile") {
    return (
      <>
        <div className={`relative h-14 shrink-0 ${mode === "mobile" ? "w-full" : "w-72"}`}>
          <div className="absolute left-0 top-0 flex h-12 w-12 min-w-0 items-center justify-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/20">
              <LeafIcon className="h-7 w-7 text-emerald-300" />
            </div>
          </div>
          <div className="absolute left-16 right-14 top-0 flex h-12 min-w-0 items-center overflow-hidden">
            <h1 className="truncate text-xl font-bold leading-tight">AgroCafeLLM</h1>
          </div>

          {mode === "desktop" ? (
            <button
              aria-label={isPinned ? "Desfijar barra lateral" : "Fijar barra lateral abierta"}
              aria-pressed={isPinned}
              className={`absolute right-0 top-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                isPinned ? "bg-emerald-400 text-emerald-950" : "bg-white/10 text-white/80 hover:bg-white/15"
              }`}
              onClick={togglePinned}
              tabIndex={expanded ? 0 : -1}
              title={isPinned ? "Desfijar barra lateral" : "Fijar barra lateral abierta"}
              type="button"
            >
              <SidebarPinIcon className="h-5 w-5" />
            </button>
          ) : (
            <button
              aria-label="Cerrar menú"
              className="absolute right-0 top-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80 transition hover:bg-white/15"
              onClick={() => setIsMobileOpen(false)}
              type="button"
            >
              <XIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="h-px w-full bg-white/10" />

        <nav className={mode === "mobile" ? "flex w-full flex-col gap-2 overflow-visible" : "flex w-72 gap-2 overflow-x-auto lg:flex-col lg:overflow-visible"}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const selected = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`grid h-14 shrink-0 grid-cols-[3rem_1fr] items-center overflow-hidden rounded-2xl px-0 text-sm transition-all duration-300 ease-out ${
                  mode === "mobile" ? "w-full" : expanded ? "w-72" : "w-12"
                } ${
                  selected ? "bg-emerald-400 font-semibold text-emerald-950" : "text-white/80 hover:bg-white/10"
                }`}
                title={item.label}
              >
                <span className="flex h-12 w-12 items-center justify-center">
                  <Icon className="h-5 w-5 shrink-0" />
                </span>
                <span className="whitespace-nowrap text-left">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={mode === "mobile" ? "mt-auto w-full" : "mt-auto lg:absolute lg:bottom-4 lg:left-3"}>
          <div
            className={`relative h-14 overflow-hidden rounded-2xl border border-white/10 bg-white/10 transition-all duration-300 ease-out ${
              mode === "mobile" ? "w-full" : expanded ? "w-72" : "w-14"
            }`}
          >
            <span className="absolute left-0 top-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400 text-2xl font-semibold leading-none text-emerald-950">
              {userInitial}
            </span>
            <div className="absolute left-[4.5rem] right-14 top-1/2 min-w-0 -translate-y-1/2">
              <p className="truncate text-base font-bold leading-tight">{user.name}</p>
              <p className="truncate text-sm font-semibold leading-tight text-white/60">{userSubtitle}</p>
            </div>
            <Link
              aria-label="Cerrar sesión"
              className={`absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/10 hover:text-white ${
                expanded ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              href={logoutHref}
              tabIndex={expanded ? 0 : -1}
              title="Cerrar sesión"
            >
              <LogoutIcon className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between bg-canopy-900 px-4 text-white shadow-lg lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/20">
            <LeafIcon className="h-7 w-7 text-emerald-300" />
          </div>
          <span className="text-lg font-bold">AgroCafeLLM</span>
        </div>
        <button
          aria-label="Abrir menú"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/15"
          onClick={() => setIsMobileOpen(true)}
          type="button"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </div>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => setIsMobileOpen(false)}
            type="button"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] flex-col gap-3 overflow-hidden bg-canopy-900 p-4 text-white shadow-2xl">
            {renderSidebarContent(true, "mobile")}
          </aside>
        </div>
      ) : null}

      <aside
        className={`relative hidden flex-col gap-3 overflow-hidden bg-canopy-900 p-4 text-white transition-all duration-300 ease-out lg:sticky lg:top-0 lg:flex lg:h-screen lg:shrink-0 ${
          isExpanded ? "lg:w-80" : "lg:w-20"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {renderSidebarContent(isExpanded, "desktop")}
      </aside>
    </>
  );
}
