import { Card, CardContent } from "@/components/ui/card";
import { Gauge, Clock, Battery, AlertTriangle } from "lucide-react";
import { SpeedTimeGraph } from "@/components/speed-time-graph";
import type { OptimizationResult } from "@/lib/ev-optimization";

interface ResultsDisplayProps {
  results: OptimizationResult | null;
  minArrivalCharge?: number;
  distanceUnit?: 'miles' | 'kilometers';
}

export function ResultsDisplay({ results, minArrivalCharge = 5, distanceUnit = 'miles' }: ResultsDisplayProps) {
  if (!results) return null;

  // Convert speed and speed unit based on distance preference
  const speedUnit = distanceUnit === 'kilometers' ? 'km/h' : 'mph';
  const displaySpeed = distanceUnit === 'kilometers' 
    ? Math.round(results.optimalSpeed * 1.60934) // Convert mph to km/h
    : Math.round(results.optimalSpeed);

  // Check if trip is not possible (insufficient charge)
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

  return (
    <Card className="border border-border shadow-sm" data-testid="results-section">
      <CardContent className="p-1.5">
        <h2 className="text-base font-semibold text-foreground mb-1 flex items-center">
          <Gauge className="text-secondary mr-1 h-5 w-5" />
          Optimization Results
        </h2>
        
        {/* Key Results - Single Card */}
        <div className="mb-2">
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-2 rounded w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 opacity-80" />
                <span className="text-sm font-medium opacity-80">OPTIMAL SPEED</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold" data-testid="text-optimal-speed">
                  {displaySpeed}
                </div>
                <div className="text-lg opacity-90">{speedUnit}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="border-t border-border pt-1 space-y-1">
          <h3 className="text-sm font-medium text-foreground">Detailed Breakdown</h3>
          
          <div className="grid md:grid-cols-2 gap-1 text-sm">
            <div className="space-y-0.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Driving Time:</span>
                <span className="font-medium" data-testid="text-driving-time">
                  {results.drivingTime.toFixed(1)} hours
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Energy Consumption:</span>
                <span className="font-medium" data-testid="text-energy-consumption">
                  {results.energyConsumption.toFixed(2)} kWh/mi
                </span>
              </div>

            </div>
            
            <div className="space-y-0.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Arrival Charge:</span>
                <span className="font-medium" data-testid="text-arrival-charge">
                  {Math.round(results.arrivalCharge)}% {results.arrivalCharge >= minArrivalCharge ? "✓" : "⚠️"}
                </span>
              </div>
            </div>
          </div>
        </div>


      </CardContent>
    </Card>
  );
}

// Separate wrapper component for the complete results display with graph
export function CompleteResultsDisplay({ results, minArrivalCharge = 5, distanceUnit = 'miles' }: ResultsDisplayProps) {
  if (!results) return null;

  return (
    <div className="space-y-4">
      <ResultsDisplay results={results} minArrivalCharge={minArrivalCharge} distanceUnit={distanceUnit} />
      {/* Only show graph if we have valid results and speedVsTimeData */}
      {results.optimalSpeed > 0 && results.speedVsTimeData && results.speedVsTimeData.length > 0 && (
        <SpeedTimeGraph results={results} />
      )}
    </div>
  );
}
