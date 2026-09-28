import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface AdoptionBarsProps {
  mx: number;
  spf: number;
  dmarc: number;
}

export function AdoptionBars({ mx, spf, dmarc }: AdoptionBarsProps) {
  const data = [
    { name: "MX", rate: mx },
    { name: "SPF", rate: spf },
    { name: "DMARC", rate: dmarc },
  ];

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }} barSize={36}>
          <CartesianGrid vertical={false} stroke="#1A1E24" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#7C8590", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}
            axisLine={{ stroke: "#22262C" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#7C8590", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={32}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            contentStyle={{ background: "#12151A", border: "1px solid #22262C", borderRadius: 6, fontSize: 12 }}
            itemStyle={{ color: "#4DD9C0" }}
            formatter={(value: number) => [`${value}%`, "adoption"]}
          />
          <Bar dataKey="rate" fill="#4DD9C0" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}