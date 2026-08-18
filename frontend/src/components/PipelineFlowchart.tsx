"use client";
import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  Database,
  CheckCircle2,
  Layers,
  Cpu,
  ShieldCheck,
  Sliders,
  Calculator,
  Binary,
  Check,
  AlertTriangle,
  Users,
  GraduationCap,
  Building2,
  Calendar,
  Sparkles,
  Info,
  ChevronRight,
  Coffee,
  FlaskConical,
  Scale,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function PipelineFlowchart() {
  const { inputData, timetableResult, setActiveTab } = useApp();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Derived statistics for the pipeline
  const totalSections = inputData.sections.length;
  const totalFaculty = inputData.faculty.length;
  const totalRooms = inputData.rooms.length;
  const totalCourses = inputData.courses.length;
  const totalTimeslots = inputData.timeslots.length;
  const totalAssignments = inputData.assignments.length;

  const totalSessions = inputData.assignments.reduce(
    (acc, curr) => acc + curr.weekly_periods,
    0
  );

  const totalVariables = totalSessions * totalTimeslots * totalRooms;
  const isSolved = timetableResult !== null;
  const isSuccess = timetableResult?.status === "SUCCESS";
  const isInfeasible = isSolved && !isSuccess;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                OR-Tools CP-SAT Architecture
              </span>
              {isSolved && (
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1",
                    isSuccess
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  )}
                >
                  {isSuccess ? (
                    <>
                      <Check className="w-3 h-3" /> Solution Validated
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3" /> Infeasible Problem
                    </>
                  )}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-2">
              Timetable Generation Pipeline
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              End-to-end constraint programming pipeline: from raw university data,
              hard/soft constraints, CP-SAT solver, to multi-view timetables.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("generate")}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Go to Generator
            </button>
          </div>
        </div>
      </div>

      {/* Main Visual Flowchart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm overflow-x-auto">
        <div className="min-w-[760px] max-w-4xl mx-auto flex flex-col items-center">
          
          {/* STEP 1: UNIVERSITY DATA */}
          <FlowNode
            id="university_data"
            title="UNIVERSITY DATA"
            subtitle={`${totalFaculty} Faculty • ${totalSections} Sections • ${totalRooms} Rooms • ${totalCourses} Courses • ${totalTimeslots} Timeslots`}
            icon={Database}
            color="blue"
            isSelected={selectedNode === "university_data"}
            onClick={() => setSelectedNode(selectedNode === "university_data" ? null : "university_data")}
            badge="Input Layer"
          />

          <FlowArrow />

          {/* STEP 2: INPUT VALIDATION */}
          <FlowNode
            id="validation"
            title="INPUT VALIDATION"
            subtitle="Pydantic Schema Check • Non-empty datasets • ID integrity & references"
            icon={ShieldCheck}
            color="emerald"
            isSelected={selectedNode === "validation"}
            onClick={() => setSelectedNode(selectedNode === "validation" ? null : "validation")}
            badge="Integrity Guard"
          />

          <FlowArrow />

          {/* STEP 3: CREATE SESSIONS */}
          <FlowNode
            id="create_sessions"
            title="CREATE SESSIONS"
            subtitle={`${totalSessions} total class sessions generated from ${totalAssignments} course assignments`}
            icon={Layers}
            color="indigo"
            isSelected={selectedNode === "create_sessions"}
            onClick={() => setSelectedNode(selectedNode === "create_sessions" ? null : "create_sessions")}
            badge="Session Normalizer"
          />

          <FlowArrow />

          {/* STEP 4: CREATE VARIABLES */}
          <FlowNode
            id="create_variables"
            title="CREATE VARIABLES"
            subtitle={`X[session, timeslot, room] ∈ {0, 1} • Decision space: ~${totalVariables.toLocaleString()} Booleans`}
            icon={Binary}
            color="purple"
            isSelected={selectedNode === "create_variables"}
            onClick={() => setSelectedNode(selectedNode === "create_variables" ? null : "create_variables")}
            badge="CP-SAT Formulation"
          />

          <FlowArrow />

          {/* STEP 5 & 6: HARD & SOFT CONSTRAINTS (Side-by-Side Cards) */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 my-1">
            {/* HARD CONSTRAINTS */}
            <div
              onClick={() => setSelectedNode(selectedNode === "hard_constraints" ? null : "hard_constraints")}
              className={cn(
                "p-5 rounded-2xl border-2 transition-all cursor-pointer text-left bg-rose-50/60 hover:bg-rose-50",
                selectedNode === "hard_constraints"
                  ? "border-rose-500 shadow-md ring-2 ring-rose-200"
                  : "border-rose-200"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                    HC
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">HARD CONSTRAINTS</h3>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
                  Strict / Zero-Tolerance
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Every solution MUST satisfy 100% of these or problem is INFEASIBLE:
              </p>
              <ul className="space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                  <strong>Faculty conflicts</strong>: No double-booked professors
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                  <strong>Student conflicts</strong>: No section clash at same time
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                  <strong>Room conflicts</strong>: 1 class per room per timeslot
                </li>
                <li className="flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                  <strong>Lab requirements</strong>: Lab courses must map to lab rooms
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                  <strong>Availability</strong>: Honor faculty unavailable times
                </li>
                <li className="flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                  <strong>Recess / Breaks</strong>: Mandatory break intervals
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                  <strong>Capacity</strong>: Room seats ≥ Section enrollment
                </li>
              </ul>
            </div>

            {/* SOFT CONSTRAINTS */}
            <div
              onClick={() => setSelectedNode(selectedNode === "soft_constraints" ? null : "soft_constraints")}
              className={cn(
                "p-5 rounded-2xl border-2 transition-all cursor-pointer text-left bg-amber-50/60 hover:bg-amber-50",
                selectedNode === "soft_constraints"
                  ? "border-amber-500 shadow-md ring-2 ring-amber-200"
                  : "border-amber-200"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                    SC
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">SOFT CONSTRAINTS</h3>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                  Optimization Targets
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Penalties minimized to score and rank alternative valid schedules:
              </p>
              <ul className="space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <strong>Free time / Idle gaps</strong>: Group student classes together
                </li>
                <li className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <strong>Workload balance</strong>: Distribute faculty hours evenly
                </li>
                <li className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <strong>Fewer gaps</strong>: Minimize empty windows across days
                </li>
                <li className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <strong>Fewer consecutive</strong>: Avoid faculty/student fatigue
                </li>
                <li className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <strong>Less movement</strong>: Optimize room size & campus walk
                </li>
              </ul>
            </div>
          </div>

          <FlowArrow />

          {/* STEP 7: OBJECTIVE FUNCTION */}
          <FlowNode
            id="objective_function"
            title="OBJECTIVE FUNCTION"
            subtitle="Z = min Σ (w_gap · Gaps + w_load · Imbalance + w_room · Waste + w_pref · PrefViolation)"
            icon={Calculator}
            color="amber"
            isSelected={selectedNode === "objective_function"}
            onClick={() => setSelectedNode(selectedNode === "objective_function" ? null : "objective_function")}
            badge="Weighted Loss Formulation"
          />

          <FlowArrow />

          {/* STEP 8: GOOGLE OR-TOOLS CP-SAT */}
          <div className="w-full max-w-xl p-5 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-lg text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-center gap-2 mb-1">
              <Cpu className="w-6 h-6 text-blue-200" />
              <h3 className="text-lg font-black tracking-wide">Google OR-Tools CP-SAT</h3>
            </div>
            <p className="text-xs text-blue-100 font-medium">
              Constraint Programming & SAT Solver with Parallel Search & Lazy Clause Generation
            </p>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs">
              <span className="bg-white/20 px-3 py-1 rounded-full font-mono">
                Status: {timetableResult ? timetableResult.status : "Ready to Solve"}
              </span>
              {timetableResult?.metrics && (
                <span className="bg-emerald-500/30 text-emerald-100 px-3 py-1 rounded-full font-mono">
                  Score: {timetableResult.metrics.quality_score}/10,000
                </span>
              )}
            </div>
          </div>

          <FlowArrow />

          {/* STEP 9: SOLUTION FOUND */}
          <FlowNode
            id="solution_found"
            title="SOLUTION FOUND"
            subtitle="Raw decision variable matrix extracted into ScheduledClass records"
            icon={Sparkles}
            color="cyan"
            isSelected={selectedNode === "solution_found"}
            onClick={() => setSelectedNode(selectedNode === "solution_found" ? null : "solution_found")}
            badge="Matrix Decode"
          />

          <FlowArrow />

          {/* STEP 10: VALIDATOR */}
          <FlowNode
            id="validator"
            title="INDEPENDENT VALIDATOR"
            subtitle="Post-Solve Auditor verifying all 7 Hard Constraints independently"
            icon={ShieldCheck}
            color="emerald"
            isSelected={selectedNode === "validator"}
            onClick={() => setSelectedNode(selectedNode === "validator" ? null : "validator")}
            badge="Double-Check Guard"
          />

          {/* BRANCHING: VALID vs NO SOLUTION */}
          <div className="w-full mt-4 flex items-center justify-center">
            <div className="w-1/2 border-t-2 border-dashed border-slate-300 relative">
              <div className="absolute left-1/4 -top-2.5 bg-white px-2 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> Valid solution
              </div>
              <div className="absolute right-1/4 -top-2.5 bg-white px-2 text-[11px] font-bold text-rose-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> No solution
              </div>
            </div>
          </div>

          {/* TWO BRANCH DESTINATIONS */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            
            {/* SUCCESS BRANCH: MASTER TIMETABLE */}
            <div className="p-5 rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 shadow-sm text-left">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">MASTER TIMETABLE</h3>
                    <p className="text-[11px] text-slate-500">Central schedules synchronized</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                  Export Ready
                </span>
              </div>

              {/* 3 VIEWS */}
              <div className="mt-4 pt-3 border-t border-emerald-200/60">
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  3 Role-Tailored Views:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setActiveTab("generate")}
                    className="p-2 rounded-xl bg-white border border-emerald-200 text-center hover:border-emerald-400 transition-all shadow-2xs"
                  >
                    <Users className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                    <p className="text-[11px] font-bold text-slate-800">Student View</p>
                    <p className="text-[9px] text-slate-400">By Section</p>
                  </button>
                  <button
                    onClick={() => setActiveTab("generate")}
                    className="p-2 rounded-xl bg-white border border-emerald-200 text-center hover:border-emerald-400 transition-all shadow-2xs"
                  >
                    <GraduationCap className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                    <p className="text-[11px] font-bold text-slate-800">Faculty View</p>
                    <p className="text-[9px] text-slate-400">By Instructor</p>
                  </button>
                  <button
                    onClick={() => setActiveTab("generate")}
                    className="p-2 rounded-xl bg-white border border-emerald-200 text-center hover:border-emerald-400 transition-all shadow-2xs"
                  >
                    <Building2 className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                    <p className="text-[11px] font-bold text-slate-800">Room View</p>
                    <p className="text-[9px] text-slate-400">By Classroom</p>
                  </button>
                </div>
              </div>
            </div>

            {/* FAILURE BRANCH: EXPLANATION */}
            <div className="p-5 rounded-2xl border-2 border-rose-300 bg-rose-50/50 shadow-sm text-left">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">EXPLANATION & DIAGNOSTICS</h3>
                    <p className="text-[11px] text-slate-500">Root cause infeasibility diagnosis</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
                  AI Conflict Engine
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-rose-200/60 space-y-2 text-xs text-slate-600">
                <p className="font-medium text-slate-700">Identifies exact bottlenecks:</p>
                <ul className="space-y-1 list-disc list-inside text-slate-600 text-[11px]">
                  <li>Faculty availability undersupply vs required load</li>
                  <li>Room capacity shortages for large sections</li>
                  <li>Lab period oversubscription across timeslots</li>
                  <li>Constraint relaxation recommendations</li>
                </ul>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              Pipeline Stage Details: <span className="uppercase text-blue-700">{selectedNode.replace("_", " ")}</span>
            </h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100"
            >
              Close
            </button>
          </div>
          <div className="text-sm text-slate-600">
            {selectedNode === "university_data" && (
              <p>
                The University Data layer holds the core entities: Faculty with availability windows, Sections with student counts, Rooms with seating capacities and lab badges, Courses, Timeslots (Day + Time pairs), and weekly Assignment requirements.
              </p>
            )}
            {selectedNode === "validation" && (
              <p>
                Ensures zero broken foreign keys, verifies that section sizes do not exceed maximum campus room size, and validates that timeslot definitions are contiguous and valid.
              </p>
            )}
            {selectedNode === "create_sessions" && (
              <p>
                Flattens each assignment with <code>weekly_periods = k</code> into <code>k</code> distinct individual session units: <code>(assignment_id, period_0)</code>, <code>(assignment_id, period_1)</code>, etc.
              </p>
            )}
            {selectedNode === "create_variables" && (
              <p>
                For every session <code>s</code>, timeslot <code>t</code>, and room <code>r</code>, the engine registers a Boolean variable <code>X[s, t, r] ∈ {"{0, 1}"}</code> in Google OR-Tools CP-SAT.
              </p>
            )}
            {selectedNode === "hard_constraints" && (
              <p>
                Enforces strict non-overlapping intervals across Faculty, Sections, and Rooms, strictly honors faculty availability, ensures lab courses get lab-equipped rooms, and enforces room capacity.
              </p>
            )}
            {selectedNode === "soft_constraints" && (
              <p>
                Penalizes empty study gaps in student daily timetables, balances professor teaching distribution across week days, and prioritizes faculty preferred timeslots.
              </p>
            )}
            {selectedNode === "objective_function" && (
              <p>
                Linear objective function: <code>Minimize Σ (weight_i * penalty_i)</code>. The CP-SAT solver explores the feasible space to discover the schedule with the lowest cumulative penalty.
              </p>
            )}
            {selectedNode === "validator" && (
              <p>
                Independent Python/TypeScript validator that sweeps through the output schedule without referencing CP-SAT internals to mathematically certify that 0 hard constraints were violated.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function FlowArrow() {
  return (
    <div className="flex flex-col items-center my-2">
      <div className="w-0.5 h-6 bg-slate-300" />
      <div className="w-2 h-2 border-r-2 border-b-2 border-slate-400 rotate-45 -mt-1.5" />
    </div>
  );
}

interface FlowNodeProps {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: "blue" | "emerald" | "indigo" | "purple" | "amber" | "cyan" | "rose";
  isSelected: boolean;
  onClick: () => void;
  badge?: string;
}

const colorStyles = {
  blue: "border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-700",
  emerald: "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700",
  indigo: "border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700",
  purple: "border-purple-200 bg-purple-50/50 hover:bg-purple-50 text-purple-700",
  amber: "border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-700",
  cyan: "border-cyan-200 bg-cyan-50/50 hover:bg-cyan-50 text-cyan-700",
  rose: "border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-700",
};

const badgeStyles = {
  blue: "bg-blue-100 text-blue-800",
  emerald: "bg-emerald-100 text-emerald-800",
  indigo: "bg-indigo-100 text-indigo-800",
  purple: "bg-purple-100 text-purple-800",
  amber: "bg-amber-100 text-amber-800",
  cyan: "bg-cyan-100 text-cyan-800",
  rose: "bg-rose-100 text-rose-800",
};

function FlowNode({
  title,
  subtitle,
  icon: Icon,
  color,
  isSelected,
  onClick,
  badge,
}: FlowNodeProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "w-full max-w-xl p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-2xs flex items-center justify-between gap-4",
        colorStyles[color],
        isSelected ? "ring-2 ring-blue-400 border-blue-500 shadow-md scale-[1.01]" : ""
      )}
    >
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">{title}</h3>
            {badge && (
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", badgeStyles[color])}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{subtitle}</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
    </div>
  );
}
