import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { Sidebar } from "@/components/sidebar";

interface AppShellProps {
  children: ReactNode;
  user: {
    email?: string | null;
    name: string;
    role?: string | null;
  };
}

export function AppShell({ children, user }: AppShellProps) {
  return (
    <main className="min-h-screen bg-canopy-50 lg:flex lg:h-screen lg:overflow-hidden">
      <Sidebar user={user} />
      <section className="min-w-0 flex-1 p-4 md:p-6 xl:p-8 lg:h-screen lg:overflow-y-auto">
        <AppHeader />
        {children}
      </section>
    </main>
  );
}
