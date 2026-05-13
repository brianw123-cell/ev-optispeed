import { lazy, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Gauge, Clock, Battery, AlertTriangle, Zap } from "lucide-react";
import type { OptimizationResult } from "@/lib/ev-optimization";

// Lazy-load the chart so recharts (~300 kB) drops out of the initial bundle.
const SpeedTimeGraph = lazy(() =>
  import("@/components/speed-time-graph").then(m => ({ default: m.SpeedTimeGraph }))
);

interface ResultsDisplayProps {
  results: OptimizationResult | null;
  minArrivalCharge?: number;
  distanceUnit?: 'miles' | 'kilometers';
}

// Format hours as "Xh Ym" or "Ym"
function formatHours(hours: number): string {
  if (!isFinite(hours) || hours <= 0) return '—';
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function ResultsDisplay({ results, minArrivalCharge = 5, distanceUnit = 'miles' }: ResultsDisplayProps) {
  if (!results) return null;

  const speedUnit = distanceUnit === 'kilometers' ? 'km/h' : 'mph';
  const displaySpeed = distanceUnit === 'kilometers'
    ? Math.round(results.optimalSpeed * 1.60934)
    : Math.round(results.optimalSpeed);

  // Trip not possible state
  if (results.totalTime === Infinity || results.optimalSpeed === 0) {
    return (
      <Card className="border border-destructive shadow-sm" data-testid="error-section">
        <CardContent className="p-3">
          <h2 className="text-base font-semibold text-destructive mb-2 flex items-center">
            <AlertTriangle className="text-destructive mr-1.5 h-4 w-4" />
            Trip Not Possible
          </h2>
          <div className="bg-destructive/10 border border-destructive/20 rounded p-2 text-sm">
            <p className="text-foreground mb-1.5">
              <strong>Not enough charge</strong> to reach the destination with a {minArrivalCharge}% safety buffer at any speed.
            </p>
            <p className="text-xs text-muted-foreground">Minimum energy needed: {results.energyUsed.toFixed(1)} kWh</p>
            <ul className="list-disc list-inside text-xs text-muted-foreground mt-1 space-y-0.5">
              <li>Charge before starting</li>
              <li>Find a closer charger</li>
              <li>Try a different route</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  const showCharging = results.chargingTime > 0;

  // Speed comparison rows — what the trip would look like at common highway speeds
  const comparisonSpeeds = [
    { mph: 55, total: results.speedComparison.speed55 },
    { mph: 65, total: results.speedComparison.speed65 },
    { mph: 75, total: results.speedComparison.speed75 }
  ];
  const optimalTotal = results.totalTime;

  return (
    <Card className="border border-border shadow-sm" data-testid="results-section">
      <CardContent className="p-2.5" aria-live="polite">
        {/* Headline: speed + total time + arrival, all in one compact card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-2.5 rounded-lg w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Gauge className="h-4 w-4 opacity-80" />
              <span className="text-[10px] font-medium opacity-90 tracking-wide">OPTIMAL SPEED</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <div className="text-3xl font-bold leading-none" data-testid="text-optimal-speed">{displaySpeed}</div>
              <div className="text-sm opacity-90">{speedUnit}</div>
            </div>
          </div>
          <div className="text-[11px] opacity-90 mt-1.5 pt-1.5 border-t border-white/20 grid grid-cols-3 gap-1">
            <div>Total: <span className="font-medium">{formatHours(results.totalTime)}</span></div>
            <div className="text-center">Drive: <span className="font-medium">{formatHours(results.drivingTime)}</span></div>
            <div className="text-right">Arrive: <span className="font-medium">{Math.round(results.arrivalCharge)}%</span></div>
          </div>
        </div>

        {/* Compact breakdown grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs mt-2">
          {showCharging && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" />Charge:</span>
                <span className="font-medium" data-testid="text-charging-time">{formatHours(results.chargingTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg pwr:</span>
                <span className="font-medium">{Math.round(results.avgChargingPower)} kW</span>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Energy:</span>
            <span className="font-medium" data-testid="text-energy-consumption">{results.energyConsumption.toFixed(2)} kWh/mi</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1"><Battery className="h-3 w-3" />SoC:</span>
            <span className="font-medium" data-testid="text-arrival-charge">
              {Math.round(results.arrivalCharge)}% {results.arrivalCharge >= minArrivalCharge ? '✓' : '⚠️'}
            </span>
          </div>
        </div>

        {/* Speed comparison — compact 3-row table */}
        <div className="mt-2 pt-2 border-t border-border">
          <div className="text-[10px] text-muted-foreground mb-0.5 flex items-center justify-between">
            <span>vs Common Speeds</span>
            <span className="italic">total trip time</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[11px]">
            {comparisonSpeeds.map(({ mph, total }) => {
              const speedLabel = distanceUnit === 'kilometers' ? `${Math.round(mph * 1.60934)}` : `${mph}`;
              const infeasible = !isFinite(total);
              const diffMin = infeasible ? null : Math.round((total - optimalTotal) * 60);
              return (
                <div key={mph} className="bg-muted/40 rounded px-1.5 py-1 flex flex-col items-center">
                  <span className="text-muted-foreground text-[10px]">{speedLabel} {distanceUnit === 'kilometers' ? 'km/h' : 'mph'}</span>
                  {infeasible ? (
                    <span className="text-destructive font-medium">N/A</span>
                  ) : diffMin === 0 ? (
                    <span className="font-medium">{formatHours(total)}</span>
                  ) : (
                    <span className="font-medium text-center">
                      {formatHours(total)}
                      <span className={`ml-1 ${diffMin && diffMin > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                        {diffMin && diffMin > 0 ? `+${diffMin}` : diffMin}m
                      </span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Wrapper that adds the lazy-loaded speed-vs-time graph
export function CompleteResultsDisplay({ results, minArrivalCharge = 5, distanceUnit = 'miles' }: ResultsDisplayProps) {
  if (!results) return null;
  return (
    <div className="space-y-2">
      <ResultsDisplay results={results} minArrivalCharge={minArrivalCharge} distanceUnit={distanceUnit} />
      {results.optimalSpeed > 0 && results.speedVsTimeData && results.speedVsTimeData.length > 0 && (
        <Suspense fallback={<div className="h-32 bg-muted/20 rounded animate-pulse" />}>
          <SpeedTimeGraph results={results} />
        </Suspense>
      )}
    </div>
  );
}
