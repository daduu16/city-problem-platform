import { Area, AreaChart, ResponsiveContainer } from 'recharts';

type Props = {
  data: number[];
  color: string;
  id: string;
};

export function MiniSparkline({ data, color, id }: Props) {
  const rows = data.map((value, i) => ({ i, value }));
  if (rows.every((r) => r.value === 0)) {
    return <div className="h-8 w-full opacity-30" />;
  }

  const gradId = `spark-${id}`;

  return (
    <ResponsiveContainer width="100%" height={32}>
      <AreaChart data={rows} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradId})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
