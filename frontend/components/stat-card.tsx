import type { ComponentType, SVGProps } from "react";
import { Card, CardContent } from "./ui/card";

interface StatCardProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  sub: string;
}

export function StatCard({ icon: Icon, label, value, sub }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-950">{value}</p>
          <p className="truncate text-xs text-slate-400">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}
