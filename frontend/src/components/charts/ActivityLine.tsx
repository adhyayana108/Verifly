import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ActivityLine({ checkedByDay }: { checkedByDay: Record<string, number> }) {
  const data = Object.entries(checkedByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count,
    }));

  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4DD9C0" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#4DD9C0" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#1A1E24" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#7C8590", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}
            axisLine={{ stroke: "#22262C" }}
            tickLine={false}
          />
          <YAxis allowDecimals={false} tick={{ fill: "#7C8590", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            contentStyle={{ background: "#12151A", border: "1px solid #22262C", borderRadius: 6, fontSize: 12 }}
            itemStyle={{ color: "#4DD9C0" }}
            labelStyle={{ color: "#7C8590" }}
          />
          <Area type="monotone" dataKey="count" stroke="#4DD9C0" strokeWidth={2} fill="url(#activityFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}