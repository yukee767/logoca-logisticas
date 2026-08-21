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
    <div className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <div
              className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
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
          className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl shadow-sm ${colorMap[color]}`}
        >
          <i className={`bi ${icon}`} />
        </div>
      </div>
    </div>
  );
}
