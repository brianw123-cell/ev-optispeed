import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { Calculator, Mic, MicOff } from "lucide-react";
import { optimizeSpeed, type OptimizationInput, type OptimizationResult, getVehiclesByCategory, getVehicleProfile } from "@/lib/ev-optimization";
import { useVoiceGuidedInput } from "@/hooks/use-voice-guided-input";
import { speakWithClearVoice } from "@/lib/voice-utils";
import { useToast } from "@/hooks/use-toast";

// Unit preferences types
type RangeUnit = "miles" | "kilometers" | "percentage";
type DistanceUnit = "miles" | "kilometers";
type TemperatureUnit = "fahrenheit" | "celsius";

interface UnitPreferences {
  remainingRange: RangeUnit;
  distanceToCharger: DistanceUnit;
  temperature: TemperatureUnit;
}

const formSchema = z.object({
  remainingRange: z.number().min(1, "Remaining range must be at least 1 mile").max(500, "Remaining range seems unrealistic"),
  distanceToCharger: z.number().min(1, "Distance must be at least 1 mile").max(400, "Distance seems too far for single leg"),
  vehicleType: z.string(),
  ambientTemp: z.number().min(-40, "Temperature too cold").max(120, "Temperature too hot"),
  minArrivalCharge: z.number().min(1, "Minimum arrival charge must be at least 1%").max(50, "Minimum arrival charge cannot exceed 50%"),
  targetChargePercent: z.number().min(20, "Target charge must be at least 20%").max(100, "Target charge cannot exceed 100%").default(80),
  hasBikeRack: z.boolean().default(false)
});

interface SpeedCalculatorProps {
  onResults: (results: OptimizationResult, inputData: OptimizationInput) => void;
}

export function SpeedCalculator({ onResults }: SpeedCalculatorProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();
  const [unitPreferences, setUnitPreferences] = useState<UnitPreferences>({
    remainingRange: "miles",
    distanceToCharger: "miles",
    temperature: "fahrenheit"
  });
  
  // Get vehicle profiles organized by category
  const vehiclesByCategory = getVehiclesByCategory();

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('ev-optimizer-unit-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setUnitPreferences(parsed);
      } catch (error) {
        console.error('Failed to parse saved preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage when they change
  const updateUnitPreference = <K extends keyof UnitPreferences>(
    key: K, 
    value: UnitPreferences[K]
  ) => {
    const newPreferences = { ...unitPreferences, [key]: value };
    
    // Convert temperature when unit changes
    if (key === "temperature" && value !== unitPreferences.temperature) {
      const currentTemp = form.getValues("ambientTemp");
      if (currentTemp !== 0) {
        let convertedTemp: number;
        if (value === "celsius" && unitPreferences.temperature === "fahrenheit") {
          // F to C: (F - 32) * 5/9
          convertedTemp = Math.round((currentTemp - 32) * 5/9);
        } else if (value === "fahrenheit" && unitPreferences.temperature === "celsius") {
          // C to F: (C * 9/5) + 32
          convertedTemp = Math.round((currentTemp * 9/5) + 32);
        } else {
          convertedTemp = currentTemp;
        }
        form.setValue("ambientTemp", convertedTemp);
      }
    }
    
    setUnitPreferences(newPreferences);
    localStorage.setItem('ev-optimizer-unit-preferences', JSON.stringify(newPreferences));
  };

  // Helper functions for unit display
  const getUnitLabel = (unit: RangeUnit | DistanceUnit | TemperatureUnit) => {
    switch (unit) {
      case "miles": return "mi";
      case "kilometers": return "km";
      case "percentage": return "%";
      case "fahrenheit": return "°F";
      case "celsius": return "°C";
      default: return "";
    }
  };

  const getUnitPlaceholder = (field: keyof UnitPreferences, unit: string) => {
    if (unit === "percentage") {
      return "50";
    }
    if (unit === "kilometers") {
      return field === "remainingRange" ? "320" : "240";
    }
    if (field === "temperature") {
      return unit === "celsius" ? "21" : "70";
    }
    // Default miles
    return field === "remainingRange" ? "200" : "150";
  };

  // Load saved form values from localStorage
  const getSavedFormValues = () => {
    const saved = localStorage.getItem('ev-optimizer-form-values');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Failed to parse saved form values:', error);
      }
    }
    return {
      remainingRange: 200,
      distanceToCharger: 150,
      vehicleType: "tesla-model-3",
      ambientTemp: 70,
      minArrivalCharge: 5,
      targetChargePercent: 80,
      hasBikeRack: false
    };
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getSavedFormValues()
  });

  // Save form values to localStorage when they change
  useEffect(() => {
    const subscription = form.watch((values) => {
      localStorage.setItem('ev-optimizer-form-values', JSON.stringify(values));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Voice parsing functions
  const parseNumber = (transcript: string): number => {
    // Remove common words and extract numbers
    const cleaned = transcript.toLowerCase()
      .replace(/\b(to|is|set|at|degrees?|miles?|kilometers?|percent|percentage)\b/g, '')
      .trim();
    
    const number = parseFloat(cleaned.match(/\d+\.?\d*/)?.[0] || '');
    return isNaN(number) ? 0 : number;
  };

  const parseVehicle = (transcript: string): string => {
    const text = transcript.toLowerCase();
    const vehicles = Object.values(vehiclesByCategory).flat();

    // Score each vehicle by how many of its tokens appear in the transcript
    let bestMatch: { id: string; score: number } | null = null;
    for (const vehicle of vehicles) {
      const tokens = `${vehicle.brand} ${vehicle.model}`.toLowerCase().split(/\s+/).filter(t => t.length > 1);
      const score = tokens.filter(t => text.includes(t)).length;
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { id: vehicle.id, score };
      }
    }
    return bestMatch ? bestMatch.id : form.getValues('vehicleType');
  };

  const parseBoolean = (transcript: string): boolean => {
    const text = transcript.toLowerCase();
    return text.includes('yes') || text.includes('add') || text.includes('true') || text.includes('on');
  };

  // Voice input configuration - only first 2 fields
  const voiceFields = [
    {
      name: 'remainingRange',
      label: 'Remaining Range',
      description: `What is your remaining range in ${unitPreferences.remainingRange === 'miles' ? 'miles' : unitPreferences.remainingRange === 'kilometers' ? 'kilometers' : 'percentage'}?`,
      type: 'number' as const,
      parseValue: parseNumber,
      validation: (value: number) => value >= 1 && value <= 500
    },
    {
      name: 'distanceToCharger',
      label: 'Distance to Charger',
      description: `What is the distance to your next charger in ${unitPreferences.distanceToCharger === 'miles' ? 'miles' : 'kilometers'}?`,
      type: 'number' as const,
      parseValue: parseNumber,
      validation: (value: number) => value >= 1 && value <= 400
    }
  ];

  const voiceInput = useVoiceGuidedInput({
    form,
    fields: voiceFields,
    onError: (message: string) => {
      toast({
        variant: "destructive",
        title: "Voice input unavailable",
        description: message
      });
    },
    onComplete: async () => {
      // Auto-submit form after voice input completion and read results
      const formData = form.getValues();
      try {
        const result = await onSubmitWithVoiceResult(formData);
        
        // Check if trip is not possible and announce accordingly
        if (result?.totalTime === Infinity || result?.optimalSpeed === 0) {
          const announcement = "Trip not possible. Insufficient battery charge to reach the destination.";
          setTimeout(() => {
            speakWithClearVoice(announcement, 1.0);
          }, 500);
        } else if (result?.optimalSpeed) {
          // Announce only the optimal speed result in appropriate units
          const speedUnit = unitPreferences.distanceToCharger === 'kilometers' ? 'kilometers per hour' : 'miles per hour';
          const displaySpeed = unitPreferences.distanceToCharger === 'kilometers' 
            ? Math.round(result.optimalSpeed * 1.60934) // Convert mph to km/h
            : Math.round(result.optimalSpeed);
          
          const announcement = `The optimal speed is ${displaySpeed} ${speedUnit}.`;
          setTimeout(() => {
            speakWithClearVoice(announcement, 1.0);
          }, 500);
        }
      } catch (error) {
        // No fallback announcement - just complete silently
        console.log('Voice calculation completed');
      }
    }
  });

  // Helper function to convert units to expected format (miles/percentage)
  const convertToOptimizationFormat = (data: z.infer<typeof formSchema>): OptimizationInput => {
    let convertedData: OptimizationInput = {
      remainingRange: data.remainingRange,
      distanceToCharger: data.distanceToCharger,
      vehicleType: data.vehicleType,
      ambientTemp: data.ambientTemp,
      minArrivalCharge: data.minArrivalCharge,
      hasBikeRack: data.hasBikeRack,
      mode: 'total-time',
      targetChargePercent: data.targetChargePercent
    };

    // Convert remaining range to miles if needed
    if (unitPreferences.remainingRange === "kilometers") {
      convertedData.remainingRange = data.remainingRange * 0.621371;
    } else if (unitPreferences.remainingRange === "percentage") {
      // Use the selected vehicle's actual EPA range, not a generic 300-mile assumption
      const vehicleProfile = getVehicleProfile(data.vehicleType);
      const epaRange = vehicleProfile?.epaRange ?? 300;
      convertedData.remainingRange = (data.remainingRange / 100) * epaRange;
    }

    // Convert distance to charger to miles if needed
    if (unitPreferences.distanceToCharger === "kilometers") {
      convertedData.distanceToCharger = data.distanceToCharger * 0.621371;
    }

    // Convert temperature to Fahrenheit if needed
    if (unitPreferences.temperature === "celsius") {
      convertedData.ambientTemp = (data.ambientTemp * 9/5) + 32;
    }

    return convertedData;
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsCalculating(true);

    // Simulate calculation time for better UX
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const convertedData = convertToOptimizationFormat(data);
      const results = optimizeSpeed(convertedData);
      onResults(results, data);
      // Signal that the app has been used at least once — install prompt waits on this.
      window.dispatchEvent(new Event('app:first-calculation'));
    } catch (error) {
      console.error("Optimization failed:", error);
      toast({
        variant: "destructive",
        title: "Calculation failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please check your inputs."
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Special submission for voice input that returns results
  const onSubmitWithVoiceResult = async (data: z.infer<typeof formSchema>) => {
    setIsCalculating(true);

    // Simulate calculation time for better UX
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const convertedData = convertToOptimizationFormat(data);
      const results = optimizeSpeed(convertedData);
      onResults(results, data);
      // Signal that the app has been used at least once — install prompt waits on this.
      window.dispatchEvent(new Event('app:first-calculation'));
      return results;
    } catch (error) {
      console.error("Optimization failed:", error);
      toast({
        variant: "destructive",
        title: "Calculation failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred."
      });
      return null;
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardContent className="p-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-1.5" data-testid="optimization-form">
            <div className="space-y-1">
              <FormField
                control={form.control}
                name="remainingRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Remaining Range</FormLabel>
                    <FormControl>
                      <div className="flex gap-1">
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            placeholder={getUnitPlaceholder("remainingRange", unitPreferences.remainingRange)}
                            min="1"
                            max="500"
                            {...field}
                            value={field.value === 0 ? '' : field.value}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === '' ? 0 : Number(value));
                            }}
                            className="pr-8 h-8 text-sm"
                            data-testid="input-remaining-range"
                          />
                          <span className="absolute right-2 top-2 text-muted-foreground text-xs">
                            {getUnitLabel(unitPreferences.remainingRange)}
                          </span>
                        </div>
                        <Select 
                          value={unitPreferences.remainingRange} 
                          onValueChange={(value: RangeUnit) => updateUnitPreference("remainingRange", value)}
                        >
                          <SelectTrigger className="w-16 h-8 text-xs" data-testid="select-remaining-range-unit">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="miles">Miles</SelectItem>
                            <SelectItem value="kilometers">Km</SelectItem>
                            <SelectItem value="percentage">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="distanceToCharger"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Distance to Charger</FormLabel>
                    <FormControl>
                      <div className="flex gap-1">
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            placeholder={getUnitPlaceholder("distanceToCharger", unitPreferences.distanceToCharger)}
                            min="1"
                            max="400"
                            {...field}
                            value={field.value === 0 ? '' : field.value}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === '' ? 0 : Number(value));
                            }}
                            className="pr-8 h-8 text-sm"
                            data-testid="input-distance-to-charger"
                          />
                          <span className="absolute right-2 top-2 text-muted-foreground text-xs">
                            {getUnitLabel(unitPreferences.distanceToCharger)}
                          </span>
                        </div>
                        <Select 
                          value={unitPreferences.distanceToCharger} 
                          onValueChange={(value: DistanceUnit) => updateUnitPreference("distanceToCharger", value)}
                        >
                          <SelectTrigger className="w-16 h-8 text-xs" data-testid="select-distance-unit">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="miles">Miles</SelectItem>
                            <SelectItem value="kilometers">Km</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>



            {/* Min Arrival | Target Charge | Temperature — 3-col compact row */}
            <div className="grid grid-cols-3 gap-1.5">
              <FormField
                control={form.control}
                name="minArrivalCharge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Min Arrival</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="5"
                          min="1"
                          max="50"
                          {...field}
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? 0 : Number(value));
                          }}
                          className="pr-6 h-8 text-sm"
                          data-testid="input-min-arrival-charge"
                        />
                        <span className="absolute right-1.5 top-2 text-muted-foreground text-xs">%</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetChargePercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Charge To</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="80"
                          min="20"
                          max="100"
                          {...field}
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? 0 : Number(value));
                          }}
                          className="pr-6 h-8 text-sm"
                          data-testid="input-target-charge"
                        />
                        <span className="absolute right-1.5 top-2 text-muted-foreground text-xs">%</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ambientTemp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Temp</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder={getUnitPlaceholder("temperature", unitPreferences.temperature)}
                          min={unitPreferences.temperature === "celsius" ? "-40" : "-40"}
                          max={unitPreferences.temperature === "celsius" ? "48" : "120"}
                          {...field}
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? 0 : Number(value));
                          }}
                          className="pr-9 h-8 text-sm"
                          data-testid="input-ambient-temp"
                        />
                        <button
                          type="button"
                          onClick={() => updateUnitPreference("temperature", unitPreferences.temperature === "fahrenheit" ? "celsius" : "fahrenheit")}
                          className="absolute right-0 top-0 h-8 w-8 text-xs text-muted-foreground hover:text-foreground border-l border-input"
                          data-testid="select-temperature-unit"
                          aria-label="Toggle temperature unit"
                        >
                          {unitPreferences.temperature === "fahrenheit" ? "°F" : "°C"}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>



            {/* Vehicle Model - Below temperature fields */}
            <div className="grid grid-cols-1 gap-1">
              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Vehicle Model</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="h-8 text-sm" data-testid="select-vehicle-type">
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {Object.entries(vehiclesByCategory).map(([category, vehicles]) => (
                            <div key={category}>
                              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                {category}
                              </div>
                              {vehicles.map((vehicle) => (
                                <SelectItem 
                                  key={vehicle.id} 
                                  value={vehicle.id}
                                  className="pl-6"
                                >
                                  {vehicle.brand} {vehicle.model} ({vehicle.year})
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>


            {/* Bike Rack + Voice — combined compact row */}
            <div className="flex items-center justify-between gap-2">
              <FormField
                control={form.control}
                name="hasBikeRack"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-1.5 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        data-testid="checkbox-bike-rack"
                      />
                    </FormControl>
                    <FormLabel className="text-xs font-medium cursor-pointer">
                      Loaded bike rack
                    </FormLabel>
                  </FormItem>
                )}
              />
              {voiceInput.isSupported && (
                <Button
                  type="button"
                  variant={voiceInput.isActive ? "destructive" : "secondary"}
                  size="sm"
                  onClick={voiceInput.isActive ? voiceInput.stopVoiceInput : voiceInput.startVoiceInput}
                  disabled={isCalculating}
                  className="h-7 text-xs px-2"
                  data-testid="button-voice-input"
                >
                  {voiceInput.isActive ? (
                    <><MicOff className="mr-1 h-3 w-3" />Stop</>
                  ) : (
                    <><Mic className="mr-1 h-3 w-3" />Voice</>
                  )}
                </Button>
              )}
            </div>
            {voiceInput.isActive && (voiceInput.currentMessage || voiceInput.isSpeaking || voiceInput.isListening) && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground italic">
                <div className={`w-2 h-2 rounded-full ${voiceInput.isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-green-500 animate-pulse'}`} />
                <span>{voiceInput.currentMessage || (voiceInput.isSpeaking ? 'Speaking' : 'Listening')}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-1.5 px-3 rounded-lg transition-all duration-200 h-7 text-sm mt-1"
              disabled={isCalculating || voiceInput.isActive}
              data-testid="button-calculate"
            >
              <Calculator className="mr-1 h-3 w-3" />
              {isCalculating ? "Calculating..." : "Calculate Optimal Speed"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
