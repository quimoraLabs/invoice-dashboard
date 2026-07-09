import React from "react";
import * as FiIcons from "react-icons/fi";

// A clean dictionary to map icon name strings to React Icons components
const IconController = ({ name, className }) => {
  const IconComponent = FiIcons[name];
  if (!IconComponent) return <FiIcons.FiHelpCircle className={className} />;
  return <IconComponent className={className} />;
};

// Unique color accent variants configuration mapping
const themeVariants = {
  blue: {
    border: "hover:border-blue-200",
    bg: "bg-blue-50/50",
    iconContainer: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
    valueText: "text-slate-900 group-hover:text-blue-600",
  },
  purple: {
    border: "hover:border-purple-200",
    bg: "bg-purple-50/50",
    iconContainer: "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white",
    valueText: "text-slate-900 group-hover:text-purple-600",
  },
  amber: {
    border: "hover:border-amber-200",
    bg: "bg-amber-50/50",
    iconContainer: "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white",
    valueText: "text-slate-900 group-hover:text-amber-600",
  },
  emerald: {
    border: "hover:border-emerald-200",
    bg: "bg-emerald-50/50",
    iconContainer: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
    valueText: "text-emerald-600 group-hover:text-emerald-700",
  },
};

function StatCard({ title, value, detail, iconName, theme = "blue" }) {
  const activeTheme = themeVariants[theme] || themeVariants.blue;

  return (
    <div className={`group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${activeTheme.border} ${activeTheme.bg} flex items-center gap-4`}>
      
      {/* 2. Left side: Enlarged, responsive colored icon container */}
      <div className={`p-4 rounded-xl transition-all duration-200 shrink-0 ${activeTheme.iconContainer}`}>
        <IconController name={iconName} className="w-6 height-6 sm:w-7 sm:h-7" />
      </div>

      {/* Right side: Clean, stacked data values */}
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
          {title}
        </p>
        <p className={`text-2xl font-bold tracking-tight transition-colors duration-200 sm:text-3xl ${activeTheme.valueText}`}>
          {value}
        </p>
        <p className="text-xs text-slate-500 truncate">
          {detail}
        </p>
      </div>

    </div>
  );
}

export default StatCard;