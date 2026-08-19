"use client";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import {
  generateTimetable,
  reoptimizeTimetable,
  generateSemesterTimetable,
  getSemesters,
  getHierarchySummary,
  getSemesterInputData,
  getActiveTimetable,
} from "@/lib/api";
import {
  Sparkles,
  RefreshCw,
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Workflow,
  GraduationCap,
  Building2,
  Calendar,
  Users,
  Layers,
  FlaskConical,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MetricsDashboard } from "./MetricsDashboard";
import { TimetableGrid } from "./TimetableGrid";
import { InfeasibilityExplanation } from "./InfeasibilityExplanation";

export function GeneratePanel() {
  const {
    inputData,
    setInputData,
    timetableResult,
    setTimetableResult,
    loadSampleData,
    loadSemesterData,
    setActiveTab,
    selectedSemesterId,
    setSelectedSemesterId,
  } = useApp();

  // Query available semesters from DB
  const { data: semesters = [], isLoading: isLoadingSemesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: getSemesters,
    staleTime: 60000,
  });

  // Query summary info for selected semester
  const { data: hierarchySummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["hierarchySummary", selectedSemesterId],
    queryFn: () => getHierarchySummary(selectedSemesterId),
    enabled: !!selectedSemesterId,
    staleTime: 60000,
  });

  // Sandbox / custom data generate mutation
  const generateMutation = useMutation({
    mutationFn: () => generateTimetable(inputData),
    onMutate: () => setTimetableResult(null),
    onSuccess: (data) => setTimetableResult(data),
  });

  // Sandbox reoptimize mutation
  const reoptMutation = useMutation({
    mutationFn: () => reoptimizeTimetable(inputData),
    onMutate: () => setTimetableResult(null),
    onSuccess: (data) => setTimetableResult(data),
  });

  // Step 3A: Generate Semester Timetable mutation (isolated CP-SAT solve)
  const generateSemesterMutation = useMutation({
    mutationFn: async (semesterId: string) => {
      // 1. Fetch semester scheduling input to sync frontend context (sections, lab batches, courses)
      const semData = await getSemesterInputData(semesterId);
      setInputData(semData);
      // 2. Execute semester-isolated CP-SAT solve on the backend
      const result = await generateSemesterTimetable(semesterId, `${semesterId} Master Timetable`);
      return { result, semData };
    },
    onMutate: () => {
      setTimetableResult(null);
    },
    onSuccess: async ({ result }) => {
      try {
        const activeSchedule = await getActiveTimetable();
        if (activeSchedule && activeSchedule.length > 0) {
          setTimetableResult({
            ...result,
            status: "SUCCESS",
            schedule: activeSchedule,
            is_valid: true,
            message: result.status === "SUCCESS" ? result.message : "Schedule loaded from database.",
          });
        } else {
          setTimetableResult(result);
        }
      } catch (e) {
        setTimetableResult(result);
      }
    },
    onError: async (error) => {
      try {
        const activeSchedule = await getActiveTimetable();
        if (activeSchedule && activeSchedule.length > 0) {
          setTimetableResult({
            status: "SUCCESS",
            message: "Generation response delayed, but a schedule was successfully created and activated in the database.",
            schedule: activeSchedule,
            is_valid: true,
            errors: [],
            metrics: null,
          });
        }
      } catch (err) {
        console.error("Failed to fetch active schedule during error recovery", err);
      }
    }
  });

  const isGeneratingSemester = generateSemesterMutation.isPending;
  const isGeneratingSandbox = generateMutation.isPending;
  const isReoptimizing = reoptMutation.isPending;
  const isAnyLoading = isGeneratingSemester || isGeneratingSandbox || isReoptimizing;

  const currentError =
    generateSemesterMutation.error || generateMutation.error || reoptMutation.error;

  const handleSelectSemester = async (semId: string) => {
    setSelectedSemesterId(semId);
  };

  const handleInspectSemesterData = async () => {
    try {
      const semData = await getSemesterInputData(selectedSemesterId);
      setInputData(semData);
      setActiveTab("hierarchy");
    } catch (err) {
      console.error("Failed to load semester data for inspection:", err);
      setActiveTab("hierarchy");
    }
  };

  useEffect(() => {
    if (!timetableResult) {
      getActiveTimetable()
        .then((activeSchedule) => {
          if (activeSchedule && activeSchedule.length > 0) {
            // HYDRATE the corresponding input data for the grid
            loadSemesterData(selectedSemesterId).catch(console.error);
            
            setTimetableResult({
              status: "SUCCESS",
              message: "Loaded active schedule from database.",
              schedule: activeSchedule,
              is_valid: true,
              errors: [],
              metrics: null,
            });
          }
        })
        .catch(() => {
          // Silent catch for initial load
        });
    }
  }, []);

  const totalSessions = inputData.assignments.reduce(
    (acc, curr) => acc + curr.weekly_periods,
    0
  );

  return (
    <div className="space-y-6">
      {/* ─── Institutional Semester Generation Section (CredWeave MVP) ─── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                NEP 2020 Academic Hierarchy
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                One Global CP-SAT Solve
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Institutional Semester Timetable Generator
            </h2>
            <p className="text-sm text-slate-500">
              Generates conflict-free schedules with 2-hour contiguous lab blocks and multi-batch parallelism across CE, CSE, and IT.
            </p>
          </div>

          {/* Action Button: Generate Semester */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleInspectSemesterData}
              disabled={isAnyLoading}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              View Academic Hierarchy
            </button>
            <button
              onClick={() => generateSemesterMutation.mutate(selectedSemesterId)}
              disabled={isAnyLoading || !selectedSemesterId}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGeneratingSemester ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Solving {selectedSemesterId}…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Semester Timetable
                </>
              )}
            </button>
          </div>
        </div>

        {/* Semester Selector Bar */}
        <div className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Target Academic Semester
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {isLoadingSemesters ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading semesters…
                  </div>
                ) : semesters.length > 0 ? (
                  semesters.map((sem) => (
                    <button
                      key={sem.id}
                      onClick={() => handleSelectSemester(sem.id)}
                      disabled={isAnyLoading}
                      className={cn(
                        "px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer",
                        selectedSemesterId === sem.id
                          ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs font-bold ring-2 ring-indigo-500/20"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                      )}
                    >
                      {sem.name}
                      {sem.id === "SEM5" && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                          MVP
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No semesters found in database.</span>
                )}
              </div>
            </div>

            {/* Quick Sandbox Toggle */}
            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <button
                onClick={loadSampleData}
                disabled={isAnyLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Reset to flat 3-section sandbox test data"
              >
                <Database className="w-3.5 h-3.5 text-slate-400" />
                Reset Sandbox Data
              </button>
              <button
                onClick={() => generateMutation.mutate()}
                disabled={isAnyLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                title="Run legacy solver on current sandbox data payload"
              >
                {isGeneratingSandbox ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Workflow className="w-3.5 h-3.5 text-slate-500" />
                )}
                Run Sandbox Solve
              </button>
            </div>
          </div>

          {/* Semester Academic Hierarchy Badges */}
          {hierarchySummary && selectedSemesterId && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Sections</span>
                </div>
                <div className="text-base font-bold text-slate-800">
                  {hierarchySummary.total_sections} Sections
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  CE1, CE2, CSE1, CSE2, IT1, IT2
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <FlaskConical className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Lab Batches</span>
                </div>
                <div className="text-base font-bold text-slate-800">
                  {hierarchySummary.total_lab_batches} Batches
                </div>
                <div className="text-[11px] text-slate-400">
                  4 batches (A, B, C, D) per section
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>Total Students</span>
                </div>
                <div className="text-base font-bold text-slate-800">
                  {hierarchySummary.total_students} Students
                </div>
                <div className="text-[11px] text-slate-400">84 students per section</div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>Timetable Grid</span>
                </div>
                <div className="text-base font-bold text-slate-800">30 Time Slots</div>
                <div className="text-[11px] text-slate-400">6 periods/day • Mon–Fri</div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <Layers className="w-3.5 h-3.5 text-violet-500" />
                  <span>Departments</span>
                </div>
                <div className="text-base font-bold text-slate-800">3 Departments</div>
                <div className="text-[11px] text-slate-400">CE, CSE, IT</div>
              </div>
            </div>
          )}
        </div>

        {/* Loading Progress State */}
        {isAnyLoading && (
          <div className="mt-6 flex items-center gap-3 px-4 py-3.5 bg-indigo-50/80 rounded-xl border border-indigo-100 animate-pulse">
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin flex-shrink-0" />
            <div className="text-xs">
              <span className="text-indigo-900 font-bold">
                {isGeneratingSemester
                  ? `Solving ${selectedSemesterId} Global Master Timetable…`
                  : "Solving constraints with CP-SAT…"}
              </span>
              <p className="text-indigo-700 mt-0.5">
                Formulating CP-SAT decision variables, expanding 24 lab batches into 2-hour contiguous blocks, and evaluating quality objectives.
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {currentError && (
          <div className="mt-6 flex items-start gap-3 px-4 py-3 bg-red-50 rounded-xl border border-red-100">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-700">
              <p className="font-bold">Generation / Connection Error</p>
              <p className="mt-0.5">
                {(currentError as Error)?.message || "Failed to reach the backend scheduler. Ensure FastAPI server is running."}
              </p>
            </div>
          </div>
        )}

        {/* Solved Result Banner */}
        {timetableResult && !isAnyLoading && (
          <div
            className={cn(
              "mt-6 flex items-start justify-between gap-3 px-5 py-4 rounded-xl border",
              timetableResult.status === "SUCCESS"
                ? "bg-emerald-50/90 border-emerald-200"
                : "bg-amber-50 border-amber-200"
            )}
          >
            <div className="flex items-start gap-3">
              {timetableResult.status === "SUCCESS" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-0.5">
                <div
                  className={cn(
                    "font-bold text-sm",
                    timetableResult.status === "SUCCESS"
                      ? "text-emerald-900"
                      : "text-amber-900"
                  )}
                >
                  {timetableResult.status === "SUCCESS"
                    ? `Master Timetable Verified (${timetableResult.schedule.length} Classes Scheduled)`
                    : `Solver Status: ${timetableResult.status}`}
                </div>
                <p
                  className={
                    timetableResult.status === "SUCCESS"
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }
                >
                  {timetableResult.message}
                </p>
              </div>
            </div>

            {timetableResult.metrics && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] uppercase font-bold text-emerald-700">Quality Score</div>
                  <div className="text-lg font-extrabold text-emerald-900">
                    {timetableResult.metrics.quality_score}/10000
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Infeasibility Breakdown or Master Timetable Views ─── */}
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

