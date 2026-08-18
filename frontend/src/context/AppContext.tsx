// Zustand-free global state using React Context
"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import { GenerateRequest, SAMPLE_DATA, TimetableResponse } from "@/lib/api";

interface AppState {
  inputData: GenerateRequest;
  setInputData: (data: GenerateRequest) => void;
  loadSampleData: () => void;
  timetableResult: TimetableResponse | null;
  setTimetableResult: (r: TimetableResponse | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [inputData, setInputData] = useState<GenerateRequest>(SAMPLE_DATA);
  const [timetableResult, setTimetableResult] = useState<TimetableResponse | null>(null);
  const [activeTab, setActiveTab] = useState("generate");

  const loadSampleData = useCallback(() => {
    setInputData(SAMPLE_DATA);
    setTimetableResult(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        inputData,
        setInputData,
        loadSampleData,
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
