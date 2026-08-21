import React from "react";

type ChartCardProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export default function ChartCard({
  title,
  subtitle,
  action,
  children,
  className = "",
}: ChartCardProps) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}
