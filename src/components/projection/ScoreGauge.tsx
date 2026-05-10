type ScoreGaugeProps = {
  label: string;
  value: number;
  tone?: "green" | "amber" | "red" | "blue";
};

export function ScoreGauge({ label, value, tone = "blue" }: ScoreGaugeProps) {
  const percentage = Math.max(0, Math.min(100, value));
  
  const colors = {
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    blue: "bg-indigo-500",
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-inherit opacity-70">
          {label}
        </span>
        <strong className="text-sm font-bold">{Math.round(value)}</strong>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${colors[tone]}`} 
          style={{ width: `${percentage}%` }} 
        />
      </div>
    </div>
  );
}
