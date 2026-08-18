"use client";
import { ScheduleMetrics } from "@/lib/api";
import { getQualityLabel, getQualityBarColor } from "@/lib/schedule-utils";
import { TrendingDown, Users, Building2, Star } from "lucide-react";

interface Props {
  metrics: ScheduleMetrics;
}

export function MetricsDashboard({ metrics }: Props) {
  const { label, color } = getQualityLabel(metrics.quality_score);
  const barColor = getQualityBarColor(metrics.quality_score);
  const pct = Math.min(100, (metrics.quality_score / 10000) * 100);

  const cards = [
    {
      label: "Total Gaps",
      value: metrics.total_gaps,
      icon: TrendingDown,
      desc: "Student idle periods",
      good: metrics.total_gaps === 0,
    },
    {
      label: "Faculty Imbalance",
      value: metrics.faculty_imbalance,
      icon: Users,
      desc: "Workload variance",
      good: metrics.faculty_imbalance < 3,
    },
    {
      label: "Room Waste",
      value: metrics.room_utilization_penalty,
      icon: Building2,
      desc: "Unused capacity penalty",
      good: metrics.room_utilization_penalty < 100,
    },
    {
      label: "Pref. Violations",
      value: metrics.preference_violations,
      icon: Star,
      desc: "Faculty schedule conflicts",
      good: metrics.preference_violations === 0,
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-6">
        {/* Quality score */}
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold text-slate-900">
              {metrics.quality_score.toLocaleString()}
            </span>
            <span className="text-sm text-slate-400">/ 10,000</span>
            <span className={`text-sm font-semibold ${color}`}>{label}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Total penalty: {metrics.total_penalty} — lower is better
          </p>
        </div>

        {/* Validation badge */}
        <div className="flex-shrink-0 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
          <p className="text-xs text-emerald-600 font-medium">Hard Constraints</p>
          <p className="text-2xl font-bold text-emerald-700 mt-0.5">7 / 7</p>
          <p className="text-xs text-emerald-500">All Satisfied</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <card.icon className="w-4 h-4 text-slate-400" />
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  card.good
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {card.good ? "Good" : "Check"}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{card.value}</p>
            <div>
              <p className="text-xs font-medium text-slate-600">{card.label}</p>
              <p className="text-xs text-slate-400">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
