import React from 'react';

export default function StatsCard({ title, value, subtext, icon: Icon, color = "indigo" }) {
  const colorMap = {
    indigo: {
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      border: "border-indigo-100",
      pill: "bg-indigo-100 text-indigo-700"
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-100",
      pill: "bg-emerald-100 text-emerald-700"
    },
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-100",
      pill: "bg-blue-100 text-blue-700"
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      border: "border-amber-100",
      pill: "bg-amber-100 text-amber-700"
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      border: "border-purple-100",
      pill: "bg-purple-100 text-purple-700"
    }
  };

  const c = colorMap[color] || colorMap.indigo;

  return (
    <div className="stats-card">
      <div className="stats-header">
        <span className="stats-title">{title}</span>
        {Icon && (
          <div className={`stats-icon-wrap ${c.text}`}>
            <Icon size={22} />
          </div>
        )}
      </div>
      <div className="stats-value">{value}</div>
      {subtext && <div className="stats-subtext">{subtext}</div>}
    </div>
  );
}
