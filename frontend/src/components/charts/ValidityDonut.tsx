import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = { valid: "#3FB88F", invalid: "#E5484D" };

export function ValidityDonut({ valid, invalid }: { valid: number; invalid: number }) {
  const total = valid + invalid;
  const data = [
    { name: "Fully configured", value: valid, color: COLORS.valid },
    { name: "Not fully configured", value: invalid, color: COLORS.invalid },
  ];

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-36 w-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={44} outerRadius={64} paddingAngle={total > 0 ? 3 : 0} stroke="none">
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#12151A", border: "1px solid #22262C", borderRadius: 6, fontSize: 12 }}
              itemStyle={{ color: "#E4E7EB" }}
              formatter={(value: number) => [value, undefined]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-xl text-ink">{total}</span>
          <span className="text-[10px] text-ink-faint">checked</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 text-sm">
        <Legend color={COLORS.valid} label="Fully configured" value={valid} />
        <Legend color={COLORS.invalid} label="Not fully configured" value={invalid} />
      </div>
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-sm" style={{ background: color }} aria-hidden="true" />
      <span className="text-ink-dim">{label}</span>
      <span className="font-mono text-ink-faint ml-auto">{value}</span>
    </div>
  );
}