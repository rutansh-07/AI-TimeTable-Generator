"use client";
import { useQuery } from "@tanstack/react-query";
import { checkHealth } from "@/lib/api";
import { BrainCircuit, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["health"],
    queryFn: checkHealth,
    refetchInterval: 15000,
  });

  const isOnline = !isLoading && !isError && data?.status === "ok";

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-slate-900 leading-tight">
              AI Timetable Generator
            </h1>
            <p className="text-[11px] text-slate-400 leading-tight">Powered by OR-Tools CP-SAT</p>
          </div>
        </div>

        {/* Status pill */}
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
            isLoading && "bg-slate-50 border-slate-200 text-slate-400",
            isOnline && "bg-emerald-50 border-emerald-200 text-emerald-700",
            isError && "bg-red-50 border-red-200 text-red-600"
          )}
        >
          {isLoading ? (
            <><span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />Connecting</>
          ) : isOnline ? (
            <><Wifi className="w-3 h-3" />Backend Online</>
          ) : (
            <><WifiOff className="w-3 h-3" />Backend Offline</>
          )}
        </div>
      </div>
    </header>
  );
}
