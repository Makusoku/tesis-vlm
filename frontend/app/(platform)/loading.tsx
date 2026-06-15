function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/70 ${className}`} />;
}

export default function PlatformLoading() {
  return (
    <div className="space-y-6" aria-label="Cargando vista">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl bg-white p-5 shadow-panel">
            <div className="flex items-center gap-4">
              <SkeletonBlock className="h-14 w-14 shrink-0" />
              <div className="min-w-0 flex-1 space-y-3">
                <SkeletonBlock className="h-3 w-24" />
                <SkeletonBlock className="h-7 w-16" />
                <SkeletonBlock className="h-3 w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-12">
        <div className="overflow-hidden rounded-2xl bg-white shadow-panel 2xl:col-span-7">
          <div className="border-b border-slate-100 p-5">
            <SkeletonBlock className="h-4 w-36" />
            <SkeletonBlock className="mt-3 h-8 w-64 max-w-full" />
          </div>
          <div className="bg-slate-100 p-5">
            <SkeletonBlock className="h-[420px] md:h-[560px]" />
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <SkeletonBlock className="h-10" />
              <SkeletonBlock className="h-10" />
              <SkeletonBlock className="h-10" />
            </div>
          </div>
        </div>

        <div className="space-y-5 2xl:col-span-5">
          <div className="rounded-2xl bg-white p-5 shadow-panel">
            <SkeletonBlock className="h-5 w-56 max-w-full" />
            <div className="mt-5 grid grid-cols-2 gap-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-9" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-panel">
            <SkeletonBlock className="h-5 w-40" />
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-9" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-panel">
            <SkeletonBlock className="h-5 w-52 max-w-full" />
            <SkeletonBlock className="mt-4 h-28" />
            <SkeletonBlock className="mt-4 h-11" />
          </div>
        </div>
      </div>
    </div>
  );
}
