import { SearchIcon, UploadIcon } from "./icons";
import { Button } from "./ui/button";

export function AppHeader() {
  return (
    <header className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <p className="text-sm font-semibold text-emerald-700">Plataforma de recoleccion de conocimiento experto</p>
        <h2 className="text-2xl font-bold text-slate-950 md:text-3xl">Diagnostico nutricional en hojas de cafe</h2>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            className="h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm shadow-sm outline-none transition focus:border-emerald-500 sm:w-72"
            placeholder="Buscar imagen o experto"
          />
        </div>
        <Button>
          <UploadIcon className="h-4 w-4" />
          Subir hojas
        </Button>
      </div>
    </header>
  );
}
