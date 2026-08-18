"use client";
import { useMutation } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { generateTimetable, reoptimizeTimetable } from "@/lib/api";
import {
  Sparkles,
  RefreshCw,
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Workflow,
  Cpu,
  Layers,
  Calendar,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MetricsDashboard } from "./MetricsDashboard";
import { TimetableGrid } from "./TimetableGrid";
import { InfeasibilityExplanation } from "./InfeasibilityExplanation";

export function GeneratePanel() {
  const { inputData, timetableResult, setTimetableResult, loadSampleData, setActiveTab } =
    useApp();

  const generateMutation = useMutation({
    mutationFn: () => generateTimetable(inputData),
    onSuccess: (data) => setTimetableResult(data),
  });

  const reoptMutation = useMutation({
    mutationFn: () => reoptimizeTimetable(inputData),
    onSuccess: (data) => setTimetableResult(data),
  });

  const isLoading = generateMutation.isPending || reoptMutation.isPending;
  const error = generateMutation.error || reoptMutation.error;

  const totalSessions = inputData.assignments.reduce(
    (acc, curr) => acc + curr.weekly_periods,
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Generator Controller */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                OR-Tools CP-SAT Engine
              </span>
              <span className="text-xs text-slate-500">
                {totalSessions} weekly class sessions to schedule
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Constraint Programming Scheduler
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Solves 7 hard constraints & optimizes 4 soft objectives simultaneously.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab("pipeline")}
              className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Workflow className="w-4 h-4 text-indigo-600" />
              View Flowchart
            </button>
            <button
              onClick={loadSampleData}
              className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              <Database className="w-4 h-4 text-slate-500" />
              Reset Sample Data
            </button>
            {timetableResult && (
              <button
                onClick={() => reoptMutation.mutate()}
                disabled={isLoading}
                className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-2xs"
              >
                {reoptMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                )}
                Reoptimize
              </button>
            )}
            <button
              onClick={() => generateMutation.mutate()}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {generateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Generate Timetable
            </button>
          </div>
        </div>

        {/* Dynamic Status Banner */}
        {isLoading && (
          <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100 animate-pulse">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
            <p className="text-xs text-blue-800 font-medium">
              Formulating decision variables and solving constraints with Google OR-Tools CP-SAT…
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-3 px-4 py-3 bg-red-50 rounded-xl border border-red-100">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">
              Connection failed. Ensure the FastAPI server is running on{" "}
              <code className="font-mono text-[11px] bg-red-100 px-1 py-0.5 rounded">
                {process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}
              </code>
            </p>
          </div>
        )}

        {timetableResult && !isLoading && (
          <div
            className={cn(
              "mt-4 flex items-start gap-3 px-4 py-3 rounded-xl border",
              timetableResult.status === "SUCCESS"
                ? "bg-emerald-50 border-emerald-200"
                : "bg-amber-50 border-amber-200"
            )}
          >
            {timetableResult.status === "SUCCESS" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <span
                className={cn(
                  "font-bold",
                  timetableResult.status === "SUCCESS"
                    ? "text-emerald-800"
                    : "text-amber-800"
                )}
              >
                {timetableResult.status === "SUCCESS"
                  ? "Schedule Successfully Generated & Verified!"
                  : `Solver Status: ${timetableResult.status}`}
              </span>{" "}
              <span
                className={
                  timetableResult.status === "SUCCESS"
                    ? "text-emerald-700"
                    : "text-amber-700"
                }
              >
                {timetableResult.message}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Result Section: Infeasible Branch vs Valid Master Timetable Branch */}
      {timetableResult && timetableResult.status !== "SUCCESS" && (
        <InfeasibilityExplanation
          message={timetableResult.message}
          errors={timetableResult.errors}
        />
      )}

      {timetableResult?.status === "SUCCESS" && (
        <>
          {timetableResult.metrics && (
            <MetricsDashboard metrics={timetableResult.metrics} />
          )}
          <TimetableGrid
            schedule={timetableResult.schedule}
            inputData={inputData}
          />
        </>
      )}
    </div>
  );
}
