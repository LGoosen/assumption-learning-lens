import {
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    LabelList,
  } from 'recharts';
  
  /**
   * Accessible bar chart of average Likert scores.
   *
   * Accessibility notes:
   * - We don't rely on colour alone — the bar is labelled with its numeric
   *   value, and the question text is shown both on the X axis and in a
   *   text fallback list below the chart.
   * - The chart container has role="img" and an aria-label that describes
   *   the highest and lowest items in plain English.
   */
  export default function LikertAverageChart({ data, height = 240 }) {
    if (!data?.length) return null;
  
    // Trim long question text into a short label for the X axis,
    // but keep the full text in the tooltip and the screen-reader summary.
    const chartData = data.map((d, i) => ({
      short: `Q${i + 1}`,
      full: d.text,
      average: d.average,
      count: d.count,
    }));
  
    const sorted = [...chartData].sort((a, b) => b.average - a.average);
    const ariaLabel =
      `Average scores out of 5 across ${chartData.length} questions. ` +
      `Highest: "${sorted[0].full}" at ${sorted[0].average}. ` +
      `Lowest: "${sorted[sorted.length - 1].full}" at ${sorted[sorted.length - 1].average}.`;
  
    return (
      <div>
        <div
          role="img"
          aria-label={ariaLabel}
          style={{ width: '100%', height }}
          className="bg-white rounded-lg"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ece8df" vertical={false} />
              <XAxis dataKey="short" stroke="#6478a4" fontSize={12} />
              <YAxis
                domain={[0, 5]}
                ticks={[0, 1, 2, 3, 4, 5]}
                stroke="#6478a4"
                fontSize={12}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  borderRadius: 8,
                  border: '1px solid #ece8df',
                  fontSize: 13,
                }}
                labelFormatter={(label, payload) =>
                  payload?.[0]?.payload?.full || label
                }
                formatter={(value, _name, item) => [
                  `${value} / 5`,
                  `Average (${item?.payload?.count || 0} responses)`,
                ]}
              />
              <Bar dataKey="average" fill="#1f2a45" radius={[6, 6, 0, 0]}>
                <LabelList
                  dataKey="average"
                  position="top"
                  formatter={(v) => v.toFixed(1)}
                  style={{ fill: '#171f33', fontSize: 11, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
  
        {/* Text fallback list — equally informative without the chart. */}
        <ol className="mt-4 space-y-1.5 text-sm">
          {chartData.map((d, i) => (
            <li key={d.short} className="flex items-start gap-3">
              <span className="text-stone-400 w-6 shrink-0">{d.short}</span>
              <span className="text-navy-800 flex-1">{d.full}</span>
              <span className="text-navy-900 font-semibold tabular-nums shrink-0">
                {d.average.toFixed(1)} / 5
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  }