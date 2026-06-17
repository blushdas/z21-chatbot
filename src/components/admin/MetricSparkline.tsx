import React, { useMemo } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface MetricSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

const MetricSparkline: React.FC<MetricSparklineProps> = ({ 
  data, 
  color = 'hsl(43, 39%, 49%)', // brand-yellow
  height = 32,
  className 
}) => {
  const chartData = useMemo(() => 
    data.map((value, index) => ({ value, day: index })),
    [data]
  );

  // Calculate trend percentage
  const trend = useMemo(() => {
    if (data.length < 2) return 0;
    const first = data[0] || 1;
    const last = data[data.length - 1] || 0;
    return Math.round(((last - first) / first) * 100);
  }, [data]);

  if (data.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center text-xs text-muted-foreground ${className}`}
        style={{ height }}
      >
        No data
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#gradient-${color.replace(/[^a-zA-Z0-9]/g, '')})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      {trend !== 0 && (
        <div className={`text-xs font-medium mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
};

export default MetricSparkline;
