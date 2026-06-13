"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Sidebar } from "@/components/sidebar";
import { DatasetView } from "@/features/dataset/dataset-view";
import { ExpertJudgmentView } from "@/features/expert-judgment/expert-judgment-view";
import type { ScreenId } from "@/lib/types";

export default function Home() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>("expert-judgment");

  return (
    <main className="min-h-screen bg-canopy-50 lg:flex lg:h-screen lg:overflow-hidden">
      <Sidebar active={activeScreen} onChange={setActiveScreen} />
      <section className="min-w-0 flex-1 p-4 md:p-6 xl:p-8 lg:h-screen lg:overflow-y-auto">
        <AppHeader />
        {activeScreen === "expert-judgment" ? <ExpertJudgmentView /> : <DatasetView />}
      </section>
    </main>
  );
}
