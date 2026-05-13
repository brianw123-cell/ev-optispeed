import { useState } from "react";
import { Zap } from "lucide-react";
import { SpeedCalculator } from "@/components/speed-calculator";
import { CompleteResultsDisplay } from "@/components/results-display";
import { MethodologySection } from "@/components/methodology-section";
import type { OptimizationResult, OptimizationMode } from "@/lib/ev-optimization";

export default function Home() {
  const [results, setResults] = useState<OptimizationResult | null>(null);
  const [minArrivalCharge, setMinArrivalCharge] = useState<number>(5);
  const [distanceUnit, setDistanceUnit] = useState<'miles' | 'kilometers'>('miles');
  const [mode, setMode] = useState<OptimizationMode>('total-time');

  const handleResults = (newResults: OptimizationResult, inputData: any) => {
    setResults(newResults);
    setMinArrivalCharge(inputData.minArrivalCharge);
    if (inputData.mode) setMode(inputData.mode);
    
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
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-3">
            <Zap className="text-primary h-5 w-5" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">EV Speed Optimizer</h1>
              <p className="text-[10px] text-muted-foreground">Calculate the fastest driving speed with current range</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        <SpeedCalculator onResults={handleResults} />
        <CompleteResultsDisplay results={results} minArrivalCharge={minArrivalCharge} distanceUnit={distanceUnit} mode={mode} />
        <MethodologySection />
      </main>

      <footer className="bg-card border-t border-border mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} EV Speed Optimizer. Built for efficient electric vehicle travel.</p>
            <p className="text-xs mt-1">
              Calculations are estimates. Real-world conditions vary — always plan with a safety margin.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
