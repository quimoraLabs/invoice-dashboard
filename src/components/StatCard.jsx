import React from "react";
import * as FiIcons from "react-icons/fi";

// A clean dictionary to map icon name strings to React Icons components
const IconController = ({ name, className }) => {
  const IconComponent = FiIcons[name];
  if (!IconComponent) return <FiIcons.FiHelpCircle className={className} />;
  return <IconComponent className={className} />;
};

// Unique color accent variants configuration mapping using semantic theme classes
const themeVariants = {
  blue: {
    border: "hover:border-primary/40",
    bg: "hover:bg-surface",
    iconContainer: "bg-primary-muted text-primary group-hover:bg-primary group-hover:text-primary-foreground",
    valueText: "text-foreground group-hover:text-primary",
  },
  purple: {
    border: "hover:border-violet-400/40",
    bg: "hover:bg-surface",
    iconContainer: "bg-violet-500/10 text-violet-500 group-hover:bg-violet-600 group-hover:text-white",
    valueText: "text-foreground group-hover:text-violet-500",
  },
  amber: {
    border: "hover:border-warning/40",
    bg: "hover:bg-surface",
    iconContainer: "bg-warning-muted text-warning group-hover:bg-warning group-hover:text-white",
    valueText: "text-foreground group-hover:text-warning",
  },
  emerald: {
    border: "hover:border-success/40",
    bg: "hover:bg-surface",
    iconContainer: "bg-success-muted text-success group-hover:bg-success group-hover:text-white",
    valueText: "text-success group-hover:text-success",
  },
};

function StatCard({ title, value, detail, iconName, theme = "blue" }) {
  const activeTheme = themeVariants[theme] || themeVariants.blue;

  return (
    <div className={`group rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${activeTheme.border} ${activeTheme.bg} flex items-center gap-4`}>
      
      {/* Left side: Colored icon container */}
      <div className={`p-4 rounded-xl transition-all duration-200 shrink-0 ${activeTheme.iconContainer}`}>
        <IconController name={iconName} className="w-6 height-6 sm:w-7 sm:h-7" />
      </div>

      {/* Right side: Clean, stacked data values */}
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
          {title}
        </p>
        <p className={`text-2xl font-bold tracking-tight transition-colors duration-200 sm:text-3xl ${activeTheme.valueText}`}>
          {value}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {detail}
        </p>
      </div>

    </div>
  );
}

export default StatCard;