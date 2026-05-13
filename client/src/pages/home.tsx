import { useState } from "react";
import { Zap } from "lucide-react";
import { SpeedCalculator } from "@/components/speed-calculator";
import { CompleteResultsDisplay } from "@/components/results-display";
import { MethodologySection } from "@/components/methodology-section";
import type { OptimizationResult } from "@/lib/ev-optimization";

export default function Home() {
  const [results, setResults] = useState<OptimizationResult | null>(null);
  const [minArrivalCharge, setMinArrivalCharge] = useState<number>(5);
  const [distanceUnit, setDistanceUnit] = useState<'miles' | 'kilometers'>('miles');

  const handleResults = (newResults: OptimizationResult, inputData: any) => {
    setResults(newResults);
    setMinArrivalCharge(inputData.minArrivalCharge);

    const savedPreferences = localStorage.getItem('ev-optimizer-unit-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setDistanceUnit(parsed.distanceToCharger || 'miles');
      } catch (error) {
        setDistanceUnit('miles');
      }
    }

    setTimeout(() => {
      const resultsElement = document.querySelector('[data-testid="results-section"]') ||
                            document.querySelector('[data-testid="error-section"]');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-3 py-1.5">
          <div className="flex items-center gap-2">
            <Zap className="text-primary h-4 w-4" />
            <h1 className="text-base font-semibold text-foreground">EV Speed Optimizer</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 py-2 space-y-2">
        <SpeedCalculator onResults={handleResults} />
        <CompleteResultsDisplay results={results} minArrivalCharge={minArrivalCharge} distanceUnit={distanceUnit} />
        <MethodologySection />
      </main>

      <footer className="bg-card border-t border-border mt-8">
        <div className="max-w-4xl mx-auto px-3 py-3">
          <div className="text-center text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} EV Speed Optimizer</p>
            <p className="mt-0.5">
              Estimates only — real-world conditions vary. Always plan with a safety margin.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
