"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import {
  getSemesters,
  getSemesterStudents,
  StudentDetail,
} from "@/lib/api";
import {
  Users,
  Building2,
  FlaskConical,
  BookOpen,
  Shuffle,
  Calendar,
  Sparkles,
  Search,
  GraduationCap,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Info,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function StudentViewPanel() {
  const { selectedSemesterId, setSelectedSemesterId, setActiveTab } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  // Query semesters list
  const { data: semesters = [], isLoading: isLoadingSemesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: getSemesters,
    staleTime: 60000,
  });

  // Query students for the selected semester
  const {
    data: studentData,
    isLoading: isLoadingStudents,
    isError,
    error,
  } = useQuery({
    queryKey: ["semesterStudents", selectedSemesterId],
    queryFn: () => getSemesterStudents(selectedSemesterId),
    enabled: !!selectedSemesterId,
    staleTime: 60000,
  });

  const studentsList: StudentDetail[] = studentData?.students || [];

  // Filter students by section, batch, and search query
  const filteredStudents = studentsList.filter((s) => {
    const matchesSection = selectedSection === "all" || s.section_name === selectedSection;
    const matchesBatch = selectedBatch === "all" || s.batch_code === selectedBatch;
    const matchesSearch =
      searchQuery.trim() === "" ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.section_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.dept_code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesBatch && matchesSearch;
  });

  const uniqueSections = Array.from(new Set(studentsList.map((s) => s.section_name))).filter(Boolean);
  const enrolledElectiveCount = studentsList.filter((s) => !!s.enrolled_elective).length;

  return (
    <div className="space-y-6">
      {/* Top Header Card & Semester Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Student Academic Cohort
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                Read-Only Inspector
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Student Cohorts, Lab Batches & Electives
            </h2>
            <p className="text-sm text-slate-500">
              Inspect student section allocations, 4-batch lab assignments, elective track enrollment, and curriculum in {selectedSemesterId}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("generate")}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Go to Schedule Generator
            </button>
          </div>
        </div>

        {/* Semester Selection Bar */}
        <div className="pt-6">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Select Academic Semester
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {isLoadingSemesters ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading semesters…
              </div>
            ) : (
              semesters.map((sem) => (
                <button
                  key={sem.id}
                  onClick={() => setSelectedSemesterId(sem.id)}
                  className={cn(
                    "px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer",
                    selectedSemesterId === sem.id
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs font-bold ring-2 ring-indigo-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                  )}
                >
                  {sem.name}
                  {sem.id === "SEM5" && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                      MVP Active
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingStudents && (
        <div className="flex items-center justify-center p-12 bg-white border border-slate-200 rounded-2xl">
          <div className="flex items-center gap-3 text-sm text-indigo-700 font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            Loading student records for {selectedSemesterId}…
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-800">Failed to load student information</h4>
            <p className="text-xs text-red-700 mt-1">
              {(error as Error)?.message || "Could not connect to backend student API."}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoadingStudents && !isError && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Users className="w-3.5 h-3.5 text-violet-500" />
                <span>Student Cohort</span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {studentData?.cohort_student_count || 504}
              </div>
              <div className="text-[11px] text-slate-400">
                {studentData?.total_registered_students ?? studentsList.length} registered records
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                <span>Sections</span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {uniqueSections.length}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {uniqueSections.join(", ") || "None"}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <FlaskConical className="w-3.5 h-3.5 text-emerald-500" />
                <span>Lab Batches</span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                4 Batches / Sec
              </div>
              <div className="text-[11px] text-slate-400">A, B, C, D (~21 studs/batch)</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Shuffle className="w-3.5 h-3.5 text-purple-500" />
                <span>Elective Selections</span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {enrolledElectiveCount}
              </div>
              <div className="text-[11px] text-slate-400">Assigned elective choices</div>
            </div>
          </div>

          {/* Search, Section & Batch Filter Controls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student roll number, name, or section…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Lab Batch Quick Filters */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <span className="text-[11px] font-bold text-slate-400 px-2">Batch:</span>
                {["all", "A", "B", "C", "D"].map((b) => (
                  <button
                    key={b}
                    onClick={() => setSelectedBatch(b)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                      selectedBatch === b
                        ? "bg-white text-emerald-700 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {b === "all" ? "All" : `Batch ${b}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Section Filter Pills */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-400 flex-shrink-0">Section:</span>
              <button
                onClick={() => setSelectedSection("all")}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap",
                  selectedSection === "all"
                    ? "bg-blue-50 border-blue-300 text-blue-800 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                )}
              >
                All Sections ({studentsList.length})
              </button>
              {uniqueSections.map((secName) => {
                const count = studentsList.filter((s) => s.section_name === secName).length;
                return (
                  <button
                    key={secName}
                    onClick={() => setSelectedSection(secName)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap",
                      selectedSection === secName
                        ? "bg-blue-50 border-blue-300 text-blue-800 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {secName} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Students Grid */}
          {filteredStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStudents.map((stu) => {
                const isSelected = expandedStudent === stu.id;
                return (
                  <div
                    key={stu.id}
                    className="border border-slate-200 rounded-2xl bg-white shadow-2xs overflow-hidden flex flex-col justify-between"
                  >
                    {/* Student Card Top */}
                    <div className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-800 flex items-center justify-center font-black text-xs">
                            {stu.batch_code !== "—" ? `B-${stu.batch_code}` : "STU"}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{stu.name}</h4>
                            <p className="text-xs font-mono text-slate-500 mt-0.5">
                              Roll: {stu.roll_number}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800">
                            Section {stu.section_name}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Lab Batch {stu.batch_code}
                          </span>
                        </div>
                      </div>

                      {/* Elective Status Banner */}
                      {stu.enrolled_elective ? (
                        <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 flex items-start gap-2">
                          <ShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[11px] font-bold text-purple-900 block">
                              Enrolled Elective: {stu.enrolled_elective.elective_group_name}
                            </span>
                            <span className="text-[10px] text-purple-700">
                              Option in {stu.enrolled_elective.elective_group_id} (Synchronized timeslot)
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs text-slate-500">
                          <span className="text-[11px]">
                            Elective Track: {stu.available_elective_groups.length} available baskets
                          </span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
                            Core Curriculum
                          </span>
                        </div>
                      )}

                      {/* Course Curriculum Summary */}
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                          Curriculum ({stu.compulsory_courses.length} courses)
                        </span>
                        <div className="space-y-1.5">
                          {stu.compulsory_courses.slice(0, isSelected ? undefined : 4).map((c) => (
                            <div
                              key={c.id}
                              className="text-xs p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <BookOpen className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span className="font-medium text-slate-800 truncate">
                                  {c.course_name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {c.requires_lab ? (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                    Batch {stu.batch_code} Lab (2-hr)
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700">
                                    Theory
                                  </span>
                                )}
                                <span className="text-[11px] text-slate-400">
                                  {c.weekly_periods}h
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Expanded Personalized Schedule (if available) */}
                      {isSelected && stu.has_schedule && (
                        <div className="pt-2 space-y-2 border-t border-slate-100">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                            Personalized Timetable Schedule
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {stu.schedule.map((sc, idx) => (
                              <div
                                key={idx}
                                className="bg-emerald-50/40 border border-emerald-200 rounded-lg p-2 text-xs space-y-0.5"
                              >
                                <div className="flex items-center justify-between font-bold text-slate-800">
                                  <span>{sc.day} {sc.time}</span>
                                  <span className="text-[10px] bg-white px-1.5 py-0.2 rounded border border-emerald-200">
                                    {sc.room_name}
                                  </span>
                                </div>
                                <div className="text-[11px] text-emerald-900 truncate font-semibold">
                                  {sc.course_name}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  Faculty: {sc.faculty_name}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Footer Toggle */}
                    <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">
                        {stu.dept_code} Department • {stu.semester_id}
                      </span>
                      <button
                        onClick={() => setExpandedStudent(isSelected ? null : stu.id)}
                        className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isSelected ? "Less Details" : "View Full Curriculum"}</span>
                        {isSelected ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No student records found</h4>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery
                  ? `No students match search term "${searchQuery}".`
                  : `No student records found for ${selectedSemesterId}.`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
