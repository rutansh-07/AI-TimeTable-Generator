// Zustand-free global state using React Context
"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import { GenerateRequest, SAMPLE_DATA, TimetableResponse, getSemesterInputData } from "@/lib/api";

interface AppState {
  inputData: GenerateRequest;
  setInputData: (data: GenerateRequest) => void;
  loadSampleData: () => void;
  selectedSemesterId: string;
  setSelectedSemesterId: (id: string) => void;
  loadSemesterData: (semesterId: string) => Promise<void>;
  timetableResult: TimetableResponse | null;
  setTimetableResult: (r: TimetableResponse | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [inputData, setInputData] = useState<GenerateRequest>(SAMPLE_DATA);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("SEM5");
  const [timetableResult, setTimetableResult] = useState<TimetableResponse | null>(null);
  const [activeTab, setActiveTab] = useState("generate");

  const loadSampleData = useCallback(() => {
    setInputData(SAMPLE_DATA);
    setTimetableResult(null);
  }, []);

  const loadSemesterData = useCallback(async (semesterId: string) => {
    try {
      const data = await getSemesterInputData(semesterId);
      setInputData(data);
      setSelectedSemesterId(semesterId);
    } catch (e) {
      console.error("Failed to load semester data:", e);
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        inputData,
        setInputData,
        loadSampleData,
        selectedSemesterId,
        setSelectedSemesterId,
        loadSemesterData,
        timetableResult,
        setTimetableResult,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

