import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from 'lucide-react';
import type { OptimizationResult } from '@/lib/ev-optimization';

interface SpeedTimeGraphProps {
  results: OptimizationResult;
}

export function SpeedTimeGraph({ results }: SpeedTimeGraphProps) {
  // Convert the data for the chart
  const chartData = results.speedVsTimeData.map(point => ({
    speed: point.speed,
    time: point.time * 60, // Convert hours to minutes for better readability
    feasible: point.feasible
  }));

  // X-axis: show the FULL speed range so users can see the cliff above optimal.
  const xAxisMin = Math.min(...chartData.map(point => point.speed));
  const xAxisMax = Math.max(...chartData.map(point => point.speed));

  // Y-axis: focus on the feasible portion plus a bit of context. Showing the full
  // y-range (which can be huge if low speeds map to long charging times) crushes
  // the interesting variation, so we clip the top.
  const feasibleTimes = chartData.filter(p => p.feasible).map(p => p.time);
  const allTimes = chartData.map(p => p.time);
  const minTime = feasibleTimes.length > 0 ? Math.min(...feasibleTimes) : Math.min(...allTimes);
  const maxFeasibleTime = feasibleTimes.length > 0 ? Math.max(...feasibleTimes) : Math.max(...allTimes);
  const yAxisMin = Math.max(0, Math.floor(minTime - 5));
  const yAxisMax = Math.ceil(maxFeasibleTime * 1.4 + 5);

  // Find the threshold where feasibility flips so we can shade the infeasible zone
  const infeasiblePoints = chartData.filter(p => !p.feasible);
  const feasibilityCutoff = infeasiblePoints.length > 0
    ? Math.min(...infeasiblePoints.map(p => p.speed))
    : null;

  const feasibleData = chartData.filter(point => point.feasible);
  const infeasibleData = chartData.filter(point => !point.feasible);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
          <p className="text-sm font-medium">{`Speed: ${label} mph`}</p>
          <p className="text-sm">{`Time: ${data.time.toFixed(1)} minutes`}</p>
          <p className={`text-xs ${data.feasible ? 'text-green-600' : 'text-red-600'}`}>
            {data.feasible ? 'Feasible' : 'Insufficient charge'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-1 pt-2">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center">
          <TrendingUp className="text-primary mr-1 h-3 w-3" />
          Speed vs Travel Time Analysis
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">
          Shows how driving speed affects total travel time. Green points are feasible.
        </p>
      </CardHeader>
      <CardContent className="pt-0 pb-2">
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              {feasibilityCutoff !== null && (
                <ReferenceArea
                  x1={feasibilityCutoff}
                  x2={xAxisMax}
                  y1={yAxisMin}
                  y2={yAxisMax}
                  fill="#ef4444"
                  fillOpacity={0.06}
                  stroke="none"
                />
              )}
              <XAxis 
                dataKey="speed" 
                type="number"
                domain={[xAxisMin, xAxisMax]}
                tick={{ fontSize: 12 }}
                label={{ value: 'Speed (mph)', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fontSize: '12px' } }}
              />
              <YAxis 
                domain={[yAxisMin, yAxisMax]}
                tickFormatter={(value) => Math.round(value).toString()}
                tick={{ fontSize: 12 }}
                label={{ value: 'Time (minutes)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '12px' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Feasible data points - green line */}
              {feasibleData.length > 0 && (
                <Line
                  data={feasibleData}
                  type="monotone"
                  dataKey="time"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                  connectNulls={false}
                />
              )}
              
              {/* Infeasible data points - red dashed line */}
              {infeasibleData.length > 0 && (
                <Line
                  data={infeasibleData}
                  type="monotone"
                  dataKey="time"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                  connectNulls={false}
                />
              )}
              
              {/* Reference line for optimal speed */}
              {results.optimalSpeed > 0 && (
                <ReferenceLine 
                  x={results.optimalSpeed} 
                  stroke="#8b5cf6" 
                  strokeDasharray="3 3"
                  strokeWidth={2}
                  label={{ 
                    value: `Optimal: ${results.optimalSpeed} mph`, 
                    position: 'top',
                    style: { fontSize: '11px', fill: '#8b5cf6' }
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-green-500"></div>
            <span className="text-muted-foreground">Feasible speeds</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-red-500 border-dashed"></div>
            <span className="text-muted-foreground">Insufficient charge</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-purple-500 border-dashed"></div>
            <span className="text-muted-foreground">Optimal speed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}