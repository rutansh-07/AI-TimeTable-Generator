"use client";
import { Header } from "@/components/Header";
import { GeneratePanel } from "@/components/GeneratePanel";
import { DataPanel } from "@/components/DataPanel";
import { PipelineFlowchart } from "@/components/PipelineFlowchart";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { Sparkles, LayoutGrid, Workflow } from "lucide-react";

const TABS = [
  { id: "generate", label: "Schedule Generator", icon: Sparkles },
  { id: "pipeline", label: "Solver Architecture Flow", icon: Workflow },
  { id: "data", label: "University Data", icon: LayoutGrid },
];

export default function Home() {
  const { activeTab, setActiveTab } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <Header />

      {/* Tab bar */}
      <div className="border-b border-slate-200 bg-white sticky top-16 z-40 shadow-2xs">
        <div className="max-w-screen-xl mx-auto px-6">
          <nav className="flex -mb-px gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all cursor-pointer",
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600 bg-blue-50/40"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-screen-xl mx-auto px-6 py-8">
        {activeTab === "generate" && <GeneratePanel />}
        {activeTab === "pipeline" && <PipelineFlowchart />}
        {activeTab === "data" && <DataPanel />}
      </main>
    </div>
  );
}
