import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

export interface ChartProps {
  /** One object per x-axis point, e.g. [{ label: 'Mon', value: 40 }]. */
  data: Array<Record<string, string | number>>;
  /** Key in `data` holding the x-axis label. */
  labelKey?: string;
  /** Keys in `data` to plot as series. Keys must be CSS-variable-safe. */
  series: string[];
  /** Optional display names per series key, e.g. { windSolar: 'Wind & solar' }. */
  labels?: Record<string, string>;
  kind?: 'bar' | 'line';
  height?: number;
}

/**
 * The whole Recharts composition lives in this one file on purpose: composing
 * context-based React components across the Astro template boundary breaks at
 * build time, because Astro renders each JSX element as its own root.
 */
export function Chart({
  data,
  labelKey = 'label',
  series,
  labels,
  kind = 'bar',
  height = 260,
}: ChartProps) {
  const config: ChartConfig = Object.fromEntries(
    series.map((key, i) => [
      key,
      { label: labels?.[key] ?? key, color: `var(--chart-${(i % 5) + 1})` },
    ]),
  );

  const axes = (
    <>
      <CartesianGrid vertical={false} stroke="var(--border)" />
      <XAxis
        dataKey={labelKey}
        tickLine={false}
        axisLine={false}
        tickMargin={10}
        fontSize={12}
      />
      <YAxis tickLine={false} axisLine={false} width={32} fontSize={12} />
      <ChartTooltip content={<ChartTooltipContent />} />
      {series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
    </>
  );

  return (
    <ChartContainer config={config} style={{ height }} className="w-full">
      {kind === 'line' ? (
        <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
          {axes}
          {series.map((key) => (
            <Line
              key={key}
              dataKey={key}
              stroke={`var(--color-${key})`}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      ) : (
        <BarChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
          {axes}
          {series.map((key) => (
            <Bar
              key={key}
              dataKey={key}
              fill={`var(--color-${key})`}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      )}
    </ChartContainer>
  );
}

export default Chart;
