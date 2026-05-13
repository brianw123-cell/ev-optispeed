import { lazy, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Gauge, Clock, Battery, AlertTriangle, Zap } from "lucide-react";
import type { OptimizationResult, OptimizationMode } from "@/lib/ev-optimization";

// Lazy-load the chart so recharts (~300 kB) drops out of the initial bundle.
// The graph is below the fold and not needed until after the user submits.
const SpeedTimeGraph = lazy(() =>
  import("@/components/speed-time-graph").then(m => ({ default: m.SpeedTimeGraph }))
);

interface ResultsDisplayProps {
  results: OptimizationResult | null;
  minArrivalCharge?: number;
  distanceUnit?: 'miles' | 'kilometers';
  mode?: OptimizationMode;
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

export function ResultsDisplay({ results, minArrivalCharge = 5, distanceUnit = 'miles', mode = 'total-time' }: ResultsDisplayProps) {
  if (!results) return null;

  const speedUnit = distanceUnit === 'kilometers' ? 'km/h' : 'mph';
  const displaySpeed = distanceUnit === 'kilometers'
    ? Math.round(results.optimalSpeed * 1.60934)
    : Math.round(results.optimalSpeed);

  // Trip not possible state
  if (results.totalTime === Infinity || results.optimalSpeed === 0) {
    return (
      <Card className="border border-destructive shadow-sm" data-testid="error-section">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-destructive mb-4 flex items-center">
            <AlertTriangle className="text-destructive mr-2 h-5 w-5" />
            Trip Not Possible
          </h2>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-foreground mb-3">
              <strong>Insufficient battery charge:</strong> You don't have enough charge to reach the destination with the required {minArrivalCharge}% safety buffer at any reasonable speed.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Minimum energy needed:</strong> {results.energyUsed.toFixed(1)} kWh</p>
              <p><strong>Recommendations:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Charge your vehicle before starting this trip</li>
                <li>Find a closer charging station</li>
                <li>Check if there are alternative routes with charging stations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const showCharging = mode === 'total-time' && results.chargingTime > 0;

  // Speed comparison rows — what the trip would look like at common highway speeds
  const comparisonSpeeds = [
    { mph: 55, total: results.speedComparison.speed55 },
    { mph: 65, total: results.speedComparison.speed65 },
    { mph: 75, total: results.speedComparison.speed75 }
  ];
  const optimalTotal = results.totalTime;

  return (
    <Card className="border border-border shadow-sm" data-testid="results-section">
      <CardContent className="p-3" aria-live="polite">
        <h2 className="text-base font-semibold text-foreground mb-2 flex items-center">
          <Gauge className="text-secondary mr-1.5 h-5 w-5" />
          Optimization Results
        </h2>

        {/* Big headline: optimal speed */}
        <div className="mb-3">
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-3 rounded-lg w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 opacity-80" />
                <span className="text-xs font-medium opacity-90 tracking-wide">OPTIMAL SPEED</span>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold" data-testid="text-optimal-speed">
                  {displaySpeed}
                </div>
                <div className="text-base opacity-90">{speedUnit}</div>
              </div>
            </div>
            <div className="text-xs opacity-90 mt-1.5 pt-1.5 border-t border-white/20 flex items-center justify-between">
              <span>Total time: {formatHours(results.totalTime)}</span>
              <span>Arrival: {Math.round(results.arrivalCharge)}%</span>
            </div>
          </div>
        </div>

        {/* Detailed breakdown */}
        <div className="border-t border-border pt-2 space-y-2">
          <h3 className="text-sm font-medium text-foreground">Breakdown</h3>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Driving:
              </span>
              <span className="font-medium" data-testid="text-driving-time">
                {formatHours(results.drivingTime)}
              </span>
            </div>
            {showCharging && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Charging:
                </span>
                <span className="font-medium" data-testid="text-charging-time">
                  {formatHours(results.chargingTime)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Battery className="h-3 w-3" />
                Arrival:
              </span>
              <span className="font-medium" data-testid="text-arrival-charge">
                {Math.round(results.arrivalCharge)}% {results.arrivalCharge >= minArrivalCharge ? '✓' : '⚠️'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Energy use:</span>
              <span className="font-medium" data-testid="text-energy-consumption">
                {results.energyConsumption.toFixed(2)} kWh/mi
              </span>
            </div>
            {showCharging && (
              <div className="flex justify-between col-span-2">
                <span className="text-muted-foreground">Avg charging power:</span>
                <span className="font-medium">{Math.round(results.avgChargingPower)} kW</span>
              </div>
            )}
          </div>
        </div>

        {/* Comparison to common speeds */}
        <div className="border-t border-border pt-2 mt-2">
          <h3 className="text-sm font-medium text-foreground mb-1.5">
            Compared to common speeds
          </h3>
          <div className="space-y-1 text-xs">
            {comparisonSpeeds.map(({ mph, total }) => {
              const speedLabel = distanceUnit === 'kilometers' ? `${Math.round(mph * 1.60934)} km/h` : `${mph} mph`;
              const infeasible = !isFinite(total);
              const diffMin = infeasible ? null : Math.round((total - optimalTotal) * 60);
              return (
                <div key={mph} className="flex justify-between items-center bg-muted/40 rounded px-2 py-1">
                  <span className="text-muted-foreground">{speedLabel}</span>
                  {infeasible ? (
                    <span className="text-destructive font-medium">Not feasible</span>
                  ) : diffMin === 0 ? (
                    <span className="text-foreground font-medium">{formatHours(total)} (same)</span>
                  ) : diffMin && diffMin > 0 ? (
                    <span className="text-foreground">
                      {formatHours(total)} <span className="text-amber-600 dark:text-amber-400 font-medium ml-1">+{diffMin} min</span>
                    </span>
                  ) : (
                    <span className="text-foreground">
                      {formatHours(total)} <span className="text-green-600 dark:text-green-400 font-medium ml-1">{diffMin} min</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 italic">
            {mode === 'total-time'
              ? 'Total time includes driving + charging back to your target SoC.'
              : 'Driving time only — assumes you have separate time to charge.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Separate wrapper for the complete results display with graph
export function CompleteResultsDisplay({ results, minArrivalCharge = 5, distanceUnit = 'miles', mode = 'total-time' }: ResultsDisplayProps) {
  if (!results) return null;

  return (
    <div className="space-y-4">
      <ResultsDisplay results={results} minArrivalCharge={minArrivalCharge} distanceUnit={distanceUnit} mode={mode} />
      {results.optimalSpeed > 0 && results.speedVsTimeData && results.speedVsTimeData.length > 0 && (
        <Suspense fallback={<div className="h-40 bg-muted/20 rounded animate-pulse" />}>
          <SpeedTimeGraph results={results} />
        </Suspense>
      )}
    </div>
  );
}
