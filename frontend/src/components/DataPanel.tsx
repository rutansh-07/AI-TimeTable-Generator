"use client";
import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  Building2,
  BookOpen,
  Users,
  GraduationCap,
  Clock,
  Link2,
  Plus,
  Trash2,
  Check,
  FlaskConical,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Faculty, Course, Section, Room, Assignment } from "@/lib/api";

export function DataPanel() {
  const { inputData, setInputData, loadSampleData, setActiveTab } = useApp();
  const { timeslots, rooms, courses, sections, faculty, assignments } = inputData;

  // Active form modal state
  const [modalType, setModalType] = useState<
    "faculty" | "course" | "section" | "room" | "assignment" | null
  >(null);

  // Form states
  const [facultyForm, setFacultyForm] = useState<{
    id: string;
    name: string;
    available_timeslots: number[];
    preferred_timeslots: number[];
  }>({
    id: `F${faculty.length + 1}`,
    name: "",
    available_timeslots: timeslots.map((t) => t.id),
    preferred_timeslots: [],
  });

  const [courseForm, setCourseForm] = useState<Course>({
    id: `C${courses.length + 1}`,
    name: "",
    requires_lab: false,
  });

  const [sectionForm, setSectionForm] = useState<Section>({
    id: `S${sections.length + 1}`,
    name: "",
    student_count: 30,
  });

  const [roomForm, setRoomForm] = useState<Room>({
    id: `R${rooms.length + 1}`,
    name: "",
    capacity: 40,
    is_lab: false,
  });

  const [assignmentForm, setAssignmentForm] = useState<Assignment>({
    id: `A${assignments.length + 1}`,
    section_id: sections[0]?.id || "",
    course_id: courses[0]?.id || "",
    faculty_id: faculty[0]?.id || "",
    weekly_periods: 3,
  });

  // Handlers
  const handleAddFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyForm.id || !facultyForm.name) return;
    setInputData({
      ...inputData,
      faculty: [...faculty, facultyForm],
    });
    setFacultyForm({
      id: `F${faculty.length + 2}`,
      name: "",
      available_timeslots: timeslots.map((t) => t.id),
      preferred_timeslots: [],
    });
    setModalType(null);
  };

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.id || !courseForm.name) return;
    setInputData({
      ...inputData,
      courses: [...courses, courseForm],
    });
    setCourseForm({
      id: `C${courses.length + 2}`,
      name: "",
      requires_lab: false,
    });
    setModalType(null);
  };

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionForm.id || !sectionForm.name) return;
    setInputData({
      ...inputData,
      sections: [...sections, sectionForm],
    });
    setSectionForm({
      id: `S${sections.length + 2}`,
      name: "",
      student_count: 30,
    });
    setModalType(null);
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.id || !roomForm.name) return;
    setInputData({
      ...inputData,
      rooms: [...rooms, roomForm],
    });
    setRoomForm({
      id: `R${rooms.length + 2}`,
      name: "",
      capacity: 40,
      is_lab: false,
    });
    setModalType(null);
  };

  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentForm.id) return;
    setInputData({
      ...inputData,
      assignments: [...assignments, assignmentForm],
    });
    setAssignmentForm({
      id: `A${assignments.length + 2}`,
      section_id: sections[0]?.id || "",
      course_id: courses[0]?.id || "",
      faculty_id: faculty[0]?.id || "",
      weekly_periods: 3,
    });
    setModalType(null);
  };

  const deleteItem = (
    type: "faculty" | "courses" | "sections" | "rooms" | "assignments",
    id: string
  ) => {
    setInputData({
      ...inputData,
      [type]: inputData[type].filter((item: any) => item.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            University Entity & Course Assignment Manager
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add or edit faculty members, courses (theory/lab), sections/classes, rooms,
            and their weekly teaching allocations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSampleData}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Reset Sample Data
          </button>
          <button
            onClick={() => setActiveTab("generate")}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Timetable
          </button>
        </div>
      </div>

      {/* Summary cards row with quick Add Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <SummaryCard
          icon={GraduationCap}
          label="Faculty"
          count={faculty.length}
          color="blue"
          onAdd={() => setModalType("faculty")}
        />
        <SummaryCard
          icon={BookOpen}
          label="Courses"
          count={courses.length}
          color="violet"
          onAdd={() => setModalType("course")}
        />
        <SummaryCard
          icon={Users}
          label="Sections"
          count={sections.length}
          color="emerald"
          onAdd={() => setModalType("section")}
        />
        <SummaryCard
          icon={Building2}
          label="Rooms / Labs"
          count={rooms.length}
          color="amber"
          onAdd={() => setModalType("room")}
        />
        <SummaryCard
          icon={Link2}
          label="Assignments"
          count={assignments.length}
          color="cyan"
          onAdd={() => setModalType("assignment")}
        />
      </div>

      {/* Assignments Manager (Core linking table) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-cyan-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Teaching Assignments (Faculty ↔ Course ↔ Section / Lab)
            </h3>
          </div>
          <button
            onClick={() => setModalType("assignment")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 font-semibold text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Assignment
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <th className="px-4 py-2.5 text-left border-b border-slate-100">ID</th>
                <th className="px-4 py-2.5 text-left border-b border-slate-100">Section / Class</th>
                <th className="px-4 py-2.5 text-left border-b border-slate-100">Course / Subject</th>
                <th className="px-4 py-2.5 text-left border-b border-slate-100">Faculty Assigned</th>
                <th className="px-4 py-2.5 text-center border-b border-slate-100">Weekly Periods</th>
                <th className="px-4 py-2.5 text-right border-b border-slate-100">Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a, i) => {
                const sec = sections.find((s) => s.id === a.section_id);
                const crs = courses.find((c) => c.id === a.course_id);
                const fac = faculty.find((f) => f.id === a.faculty_id);
                return (
                  <tr key={a.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="px-4 py-3 font-mono font-medium text-slate-600 border-b border-slate-100">
                      {a.id}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 border-b border-slate-100">
                      {sec?.name ?? a.section_id}
                    </td>
                    <td className="px-4 py-3 text-slate-700 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span>{crs?.name ?? a.course_id}</span>
                        {crs?.requires_lab && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700 font-semibold flex items-center gap-0.5">
                            <FlaskConical className="w-2.5 h-2.5" /> Lab
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 border-b border-slate-100 font-medium">
                      👨‍🏫 {fac?.name ?? a.faculty_id}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-blue-600 border-b border-slate-100">
                      {a.weekly_periods} periods/wk
                    </td>
                    <td className="px-4 py-3 text-right border-b border-slate-100">
                      <button
                        onClick={() => deleteItem("assignments", a.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                        title="Delete Assignment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid of entities */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Faculty List */}
        <EntityTable
          title="Faculty Members"
          icon={GraduationCap}
          onAdd={() => setModalType("faculty")}
          headers={["ID", "Name", "Available Slots", "Action"]}
          rows={faculty.map((f) => [
            f.id,
            f.name,
            `${f.available_timeslots.length} slots (${f.preferred_timeslots.length} preferred)`,
            <button
              key={f.id}
              onClick={() => deleteItem("faculty", f.id)}
              className="text-slate-400 hover:text-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>,
          ])}
        />

        {/* Courses */}
        <EntityTable
          title="Courses & Subjects"
          icon={BookOpen}
          onAdd={() => setModalType("course")}
          headers={["ID", "Name", "Type", "Action"]}
          rows={courses.map((c) => [
            c.id,
            c.name,
            c.requires_lab ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700">
                Lab Required
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                Lecture Theory
              </span>
            ),
            <button
              key={c.id}
              onClick={() => deleteItem("courses", c.id)}
              className="text-slate-400 hover:text-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>,
          ])}
        />

        {/* Sections / Classes */}
        <EntityTable
          title="Sections / Classes / Batches"
          icon={Users}
          onAdd={() => setModalType("section")}
          headers={["ID", "Name", "Student Strength", "Action"]}
          rows={sections.map((s) => [
            s.id,
            s.name,
            `${s.student_count} students`,
            <button
              key={s.id}
              onClick={() => deleteItem("sections", s.id)}
              className="text-slate-400 hover:text-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>,
          ])}
        />

        {/* Rooms & Labs */}
        <EntityTable
          title="Classrooms & Laboratories"
          icon={Building2}
          onAdd={() => setModalType("room")}
          headers={["ID", "Room Name", "Capacity & Type", "Action"]}
          rows={rooms.map((r) => [
            r.id,
            r.name,
            `${r.capacity} seats (${r.is_lab ? "Lab" : "Classroom"})`,
            <button
              key={r.id}
              onClick={() => deleteItem("rooms", r.id)}
              className="text-slate-400 hover:text-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>,
          ])}
        />
      </div>

      {/* Faculty Availability Matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">
              Faculty Weekly Availability & Preferences
            </h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide border-b border-r border-slate-100">
                  Faculty
                </th>
                {timeslots.map((t) => (
                  <th
                    key={t.id}
                    className="px-2 py-2.5 text-center font-medium text-slate-400 border-b border-r border-slate-100 last:border-r-0 whitespace-nowrap"
                  >
                    <span className="block text-[10px]">{t.day.slice(0, 3)}</span>
                    <span className="block font-semibold text-slate-600">{t.time}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {faculty.map((f, fi) => (
                <tr key={f.id} className={fi % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                  <td className="px-4 py-3 font-semibold text-slate-700 border-r border-b border-slate-100 whitespace-nowrap">
                    {f.name}
                  </td>
                  {timeslots.map((t) => {
                    const avail = f.available_timeslots.includes(t.id);
                    const pref = f.preferred_timeslots.includes(t.id);
                    return (
                      <td
                        key={t.id}
                        className="px-2 py-3 text-center border-r border-b border-slate-100 last:border-r-0"
                      >
                        <span
                          title={pref ? "Preferred" : avail ? "Available" : "Unavailable"}
                          className={cn(
                            "inline-block w-4 h-4 rounded-full",
                            pref
                              ? "bg-emerald-400"
                              : avail
                              ? "bg-blue-200"
                              : "bg-slate-100"
                          )}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
              Preferred
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-200 inline-block" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-100 border border-slate-200 inline-block" />
              Unavailable
            </span>
          </div>
        </div>
      </div>

      {/* MODAL DIALOGS FOR ADDING ENTITIES */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            
            {/* ADD FACULTY MODAL */}
            {modalType === "faculty" && (
              <form onSubmit={handleAddFaculty} className="space-y-4">
                <h3 className="font-bold text-base text-slate-900">Add Faculty Member</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty ID</label>
                  <input
                    type="text"
                    value={facultyForm.id}
                    onChange={(e) => setFacultyForm({ ...facultyForm, id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Name & Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Jane Doe"
                    value={facultyForm.name}
                    onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 rounded-lg border hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Save Faculty
                  </button>
                </div>
              </form>
            )}

            {/* ADD COURSE MODAL */}
            {modalType === "course" && (
              <form onSubmit={handleAddCourse} className="space-y-4">
                <h3 className="font-bold text-base text-slate-900">Add Course / Subject</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course ID</label>
                  <input
                    type="text"
                    value={courseForm.id}
                    onChange={(e) => setCourseForm({ ...courseForm, id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Database Systems"
                    value={courseForm.name}
                    onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="lab_req"
                    checked={courseForm.requires_lab}
                    onChange={(e) => setCourseForm({ ...courseForm, requires_lab: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <label htmlFor="lab_req" className="text-xs font-medium text-slate-700">
                    Requires Laboratory Room
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 rounded-lg border hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Save Course
                  </button>
                </div>
              </form>
            )}

            {/* ADD SECTION MODAL */}
            {modalType === "section" && (
              <form onSubmit={handleAddSection} className="space-y-4">
                <h3 className="font-bold text-base text-slate-900">Add Section / Class Batch</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Section ID</label>
                  <input
                    type="text"
                    value={sectionForm.id}
                    onChange={(e) => setSectionForm({ ...sectionForm, id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Section / Batch Name</label>
                  <input
                    type="text"
                    placeholder="e.g. CS Year 2 - Div A"
                    value={sectionForm.name}
                    onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Student Strength</label>
                  <input
                    type="number"
                    value={sectionForm.student_count}
                    onChange={(e) => setSectionForm({ ...sectionForm, student_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    required
                    min={1}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 rounded-lg border hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Save Section
                  </button>
                </div>
              </form>
            )}

            {/* ADD ROOM / LAB MODAL */}
            {modalType === "room" && (
              <form onSubmit={handleAddRoom} className="space-y-4">
                <h3 className="font-bold text-base text-slate-900">Add Room / Laboratory</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room ID</label>
                  <input
                    type="text"
                    value={roomForm.id}
                    onChange={(e) => setRoomForm({ ...roomForm, id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room Name</label>
                  <input
                    type="text"
                    placeholder="e.g. AI & Networks Lab"
                    value={roomForm.name}
                    onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    required
                    min={1}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_lab_check"
                    checked={roomForm.is_lab}
                    onChange={(e) => setRoomForm({ ...roomForm, is_lab: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <label htmlFor="is_lab_check" className="text-xs font-medium text-slate-700">
                    Is Specialized Laboratory Room
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 rounded-lg border hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Save Room
                  </button>
                </div>
              </form>
            )}

            {/* ADD ASSIGNMENT MODAL */}
            {modalType === "assignment" && (
              <form onSubmit={handleAddAssignment} className="space-y-4">
                <h3 className="font-bold text-base text-slate-900">
                  Assign Subject to Faculty & Section/Lab
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assignment ID</label>
                  <input
                    type="text"
                    value={assignmentForm.id}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Section / Class</label>
                  <select
                    value={assignmentForm.section_id}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, section_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  >
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.student_count} students)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course / Subject</label>
                  <select
                    value={assignmentForm.course_id}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, course_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.requires_lab ? "(Requires Lab)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Faculty</label>
                  <select
                    value={assignmentForm.faculty_id}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, faculty_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  >
                    {faculty.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Weekly Class Periods</label>
                  <input
                    type="number"
                    value={assignmentForm.weekly_periods}
                    onChange={(e) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        weekly_periods: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    min={1}
                    max={10}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 rounded-lg border hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Save Assignment
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  count,
  color,
  onAdd,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  color: "blue" | "violet" | "emerald" | "amber" | "cyan";
  onAdd: () => void;
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
  };

  return (
    <div className={cn("rounded-2xl border p-4 flex flex-col justify-between gap-3 shadow-2xs", colorMap[color])}>
      <div className="flex items-center justify-between">
        <Icon className="w-5 h-5 opacity-80" />
        <button
          onClick={onAdd}
          className="p-1 rounded-lg bg-white/80 hover:bg-white text-slate-700 transition-colors shadow-2xs"
          title={`Add ${label}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div>
        <p className="text-2xl font-black">{count}</p>
        <p className="text-xs font-semibold opacity-75">{label}</p>
      </div>
    </div>
  );
}

function EntityTable({
  title,
  icon: Icon,
  headers,
  rows,
  onAdd,
}: {
  title: string;
  icon: React.ElementType;
  headers: string[];
  rows: (string | React.ReactNode)[][];
  onAdd: () => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50">
              {headers.map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    "px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100",
                    i === headers.length - 1 ? "text-right" : "text-left"
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={cn(
                      "px-4 py-2.5 text-slate-600 border-b border-slate-100 last:border-b-0",
                      ci === row.length - 1 ? "text-right" : "text-left"
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
