"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/juicio-experto");
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Correo institucional</span>
        <input
          className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          name="email"
          placeholder="marcos@universidad.edu"
          type="email"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Contraseña</span>
        <span className="relative mt-2 block">
          <input
            className="h-12 w-full rounded-2xl border border-slate-200 px-4 pr-12 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            name="password"
            placeholder="********"
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            onClick={() => setShowPassword((current) => !current)}
            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            type="button"
          >
            {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </span>
      </label>

      <div className="flex items-center justify-between gap-3 text-sm">
        <label className="flex items-center gap-2 text-slate-600">
          <input className="h-4 w-4 rounded border-slate-300 text-emerald-700" type="checkbox" />
          Recordarme
        </label>
        <Link className="font-semibold text-emerald-700 hover:text-emerald-800" href="/login">
          Recuperar acceso
        </Link>
      </div>

      <button
        className="h-12 w-full rounded-2xl bg-emerald-700 text-sm font-bold text-white transition hover:bg-emerald-800"
        type="submit"
      >
        Entrar
      </button>
    </form>
  );
}
