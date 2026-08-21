type KpiCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color?: "primary" | "success" | "warning" | "danger" | "info";
  trend?: { value: string; positive: boolean };
};

const colorMap: Record<string, string> = {
  primary: "bg-[#0d3b66] text-white",
  success: "bg-emerald-500 text-white",
  warning: "bg-amber-500 text-white",
  danger: "bg-red-500 text-white",
  info: "bg-sky-500 text-white",
};

export default function KpiCard({
  title,
  value,
  subtitle,
  icon,
  color = "primary",
  trend,
}: KpiCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-black tracking-tight text-slate-900 truncate">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-[11px] sm:text-xs text-slate-500 truncate">{subtitle}</p>
          )}
          {trend && (
            <div
              className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] sm:text-xs font-semibold ${
                trend.positive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <i
                className={`bi ${
                  trend.positive ? "bi-arrow-up-short" : "bi-arrow-down-short"
                }`}
              />
              {trend.value}
            </div>
          )}
        </div>
        <div
          className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl text-lg sm:text-xl shadow-sm ${colorMap[color]}`}
        >
          <i className={`bi ${icon}`} />
        </div>
      </div>
    </div>
  );
}
