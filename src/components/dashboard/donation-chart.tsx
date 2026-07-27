"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { day: "Pzt", amount: 32400 },
  { day: "Sal", amount: 41800 },
  { day: "Çar", amount: 37600 },
  { day: "Per", amount: 58200 },
  { day: "Cum", amount: 51900 },
  { day: "Cmt", amount: 69400 },
  { day: "Paz", amount: 63200 },
];

export function DonationChart() {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 6, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="donationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.24} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e9efec" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={8} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={(v: number) => `${v / 1000}B`} />
          <Tooltip
            cursor={{ stroke: "#10b981", strokeDasharray: "4 4" }}
            contentStyle={{ border: 0, borderRadius: 12, boxShadow: "0 10px 30px #0f172a18", fontSize: 12 }}
            formatter={(value) => [`${Number(value).toLocaleString("tr-TR")} ₺`, "Bağış"]}
          />
          <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fill="url(#donationGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
