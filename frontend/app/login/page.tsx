import Link from "next/link";
import { GoogleIcon, LeafIcon } from "@/components/icons";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-canopy-50 text-slate-950">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-5 py-8 lg:grid-cols-[1fr_25rem] lg:px-8">
        <div className="hidden min-h-[34rem] flex-col justify-between rounded-[2rem] bg-canopy-900 p-8 text-white shadow-panel lg:flex">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/20">
              <LeafIcon className="h-8 w-8 text-emerald-300" />
            </div>
            <p className="text-2xl font-bold">AgroCafeLLM</p>
          </div>

          <div>
            <p className="max-w-md text-4xl font-bold leading-tight">
              Curación experta para datasets foliares de café.
            </p>
            <p className="mt-5 max-w-md text-sm leading-6 text-emerald-50/70">
              Ingesta, juicio experto y preparación multimodal con trazabilidad clínica.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-2xl font-bold">812</p>
              <p className="mt-1 text-white/60">registros curados</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-2xl font-bold">24</p>
              <p className="mt-1 text-white/60">expertos activos</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-2xl font-bold">91%</p>
              <p className="mt-1 text-white/60">consenso medio</p>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-canopy-900">
              <LeafIcon className="h-7 w-7 text-emerald-300" />
            </div>
            <p className="text-2xl font-bold">AgroCafeLLM</p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-panel sm:p-8">
            <div>
              <p className="text-2xl font-bold">Iniciar sesión</p>
              <p className="mt-2 text-sm text-slate-500">Accede a la plataforma de anotación experta.</p>
            </div>

            <Link
              href="/juicio-experto"
              className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              <GoogleIcon className="h-5 w-5" />
              Continuar con Google
            </Link>

            <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              o
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
