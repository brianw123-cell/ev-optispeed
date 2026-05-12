export interface VehicleConfig {
  dragCoefficient: number;
  frontalArea: number; // m²
  rollingResistance: number;
  mass: number; // kg
  batteryCapacity: number; // kWh
  chargingEfficiency: number;
}

export interface OptimizationInput {
  remainingRange: number; // miles
  distanceToCharger: number; // miles
  vehicleType: string;
  ambientTemp: number; // Fahrenheit
  minArrivalCharge: number; // percentage
  hasBikeRack: boolean; // adds aerodynamic drag
}

export interface OptimizationResult {
  optimalSpeed: number; // mph
  totalTime: number; // hours
  drivingTime: number; // hours
  chargingTime: number; // hours
  arrivalCharge: number; // percentage
  energyConsumption: number; // kWh/mile
  energyUsed: number; // kWh
  avgChargingPower: number; // kW
  speedComparison: {
    speed55: number;
    speed65: number;
    speed75: number;
  };
  speedVsTimeData: Array<{
    speed: number;
    time: number;
    feasible: boolean;
  }>;
}

export interface VehicleProfile {
  id: string;
  brand: string;
  model: string;
  year: string;
  category: string;
  config: VehicleConfig;
  epaRange: number; // EPA estimated range in miles
  maxChargingSpeed: number; // kW
}

const VEHICLE_PROFILES: Record<string, VehicleProfile> = {
  // Tesla Models
  "tesla-model-3": {
    id: "tesla-model-3",
    brand: "Tesla",
    model: "Model 3",
    year: "2024",
    category: "Sedan",
    config: {
      dragCoefficient: 0.219,
      frontalArea: 2.22,
      rollingResistance: 0.013,
      mass: 1765,
      batteryCapacity: 75,
      chargingEfficiency: 0.94
    },
    epaRange: 358,
    maxChargingSpeed: 250
  },
  "tesla-model-s": {
    id: "tesla-model-s",
    brand: "Tesla",
    model: "Model S",
    year: "2024", 
    category: "Sedan",
    config: {
      dragCoefficient: 0.208,
      frontalArea: 2.34,
      rollingResistance: 0.013,
      mass: 2162,
      batteryCapacity: 100,
      chargingEfficiency: 0.94
    },
    epaRange: 405,
    maxChargingSpeed: 250
  },
  "tesla-model-x": {
    id: "tesla-model-x",
    brand: "Tesla",
    model: "Model X",
    year: "2024",
    category: "SUV",
    config: {
      dragCoefficient: 0.25,
      frontalArea: 2.53,
      rollingResistance: 0.015,
      mass: 2459,
      batteryCapacity: 100,
      chargingEfficiency: 0.93
    },
    epaRange: 348,
    maxChargingSpeed: 250
  },
  "tesla-model-y": {
    id: "tesla-model-y",
    brand: "Tesla",
    model: "Model Y",
    year: "2024",
    category: "SUV",
    config: {
      dragCoefficient: 0.23,
      frontalArea: 2.52,
      rollingResistance: 0.014,
      mass: 1995,
      batteryCapacity: 75,
      chargingEfficiency: 0.94
    },
    epaRange: 330,
    maxChargingSpeed: 250
  },
  // Ford Models
  "ford-mustang-mach-e": {
    id: "ford-mustang-mach-e",
    brand: "Ford",
    model: "Mustang Mach-E",
    year: "2024",
    category: "SUV",
    config: {
      dragCoefficient: 0.29,
      frontalArea: 2.65,
      rollingResistance: 0.015,
      mass: 2095,
      batteryCapacity: 91,
      chargingEfficiency: 0.90
    },
    epaRange: 312,
    maxChargingSpeed: 150
  },
  "ford-f150-lightning": {
    id: "ford-f150-lightning", 
    brand: "Ford",
    model: "F-150 Lightning",
    year: "2024",
    category: "Truck",
    config: {
      dragCoefficient: 0.42,
      frontalArea: 3.2,
      rollingResistance: 0.018,
      mass: 2995,
      batteryCapacity: 131,
      chargingEfficiency: 0.88
    },
    epaRange: 320,
    maxChargingSpeed: 150
  },
  // BMW Models
  "bmw-i4": {
    id: "bmw-i4",
    brand: "BMW", 
    model: "i4",
    year: "2024",
    category: "Sedan",
    config: {
      dragCoefficient: 0.24,
      frontalArea: 2.35,
      rollingResistance: 0.014,
      mass: 2125,
      batteryCapacity: 83.9,
      chargingEfficiency: 0.91
    },
    epaRange: 270,
    maxChargingSpeed: 200
  },
  "bmw-ix": {
    id: "bmw-ix",
    brand: "BMW",
    model: "iX",
    year: "2024", 
    category: "SUV",
    config: {
      dragCoefficient: 0.25,
      frontalArea: 2.65,
      rollingResistance: 0.015,
      mass: 2585,
      batteryCapacity: 111.5,
      chargingEfficiency: 0.90
    },
    epaRange: 324,
    maxChargingSpeed: 200
  },
  // Mercedes Models
  "mercedes-eqs": {
    id: "mercedes-eqs",
    brand: "Mercedes-Benz",
    model: "EQS",
    year: "2024",
    category: "Sedan",
    config: {
      dragCoefficient: 0.20,
      frontalArea: 2.5,
      rollingResistance: 0.013,
      mass: 2480,
      batteryCapacity: 107.8,
      chargingEfficiency: 0.92
    },
    epaRange: 453,
    maxChargingSpeed: 200
  },
  // Audi Models
  "audi-e-tron-gt": {
    id: "audi-e-tron-gt",
    brand: "Audi",
    model: "e-tron GT",
    year: "2024",
    category: "Sedan",
    config: {
      dragCoefficient: 0.24,
      frontalArea: 2.35,
      rollingResistance: 0.014,
      mass: 2345,
      batteryCapacity: 93.4,
      chargingEfficiency: 0.91
    },
    epaRange: 238,
    maxChargingSpeed: 270
  },
  // Hyundai Models - Updated Ioniq 5 2025
  "hyundai-ioniq-5": {
    id: "hyundai-ioniq-5",
    brand: "Hyundai",
    model: "IONIQ 5",
    year: "2025",
    category: "SUV",
    config: {
      dragCoefficient: 0.288,
      frontalArea: 2.61,
      rollingResistance: 0.014,
      mass: 2050,
      batteryCapacity: 84,
      chargingEfficiency: 0.92
    },
    epaRange: 318,
    maxChargingSpeed: 350
  },
  // Rivian Models
  "rivian-r1t": {
    id: "rivian-r1t",
    brand: "Rivian",
    model: "R1T",
    year: "2024",
    category: "Truck",
    config: {
      dragCoefficient: 0.30,
      frontalArea: 3.1,
      rollingResistance: 0.017,
      mass: 3175,
      batteryCapacity: 135,
      chargingEfficiency: 0.87
    },
    epaRange: 314,
    maxChargingSpeed: 210
  },
  // Lucid Models
  "lucid-air": {
    id: "lucid-air",
    brand: "Lucid",
    model: "Air Dream Range",
    year: "2024", 
    category: "Sedan",
    config: {
      dragCoefficient: 0.197,
      frontalArea: 2.4,
      rollingResistance: 0.012,
      mass: 2360,
      batteryCapacity: 118,
      chargingEfficiency: 0.95
    },
    epaRange: 516,
    maxChargingSpeed: 300
  },
  // Nissan Models
  "nissan-leaf": {
    id: "nissan-leaf",
    brand: "Nissan",
    model: "Leaf",
    year: "2025",
    category: "Hatchback",
    config: {
      dragCoefficient: 0.29,
      frontalArea: 2.28,
      rollingResistance: 0.015,
      mass: 1580,
      batteryCapacity: 60,
      chargingEfficiency: 0.89
    },
    epaRange: 212,
    maxChargingSpeed: 50
  },
  // Kia Models
  "kia-ev6": {
    id: "kia-ev6",
    brand: "Kia",
    model: "EV6",
    year: "2024",
    category: "SUV",
    config: {
      dragCoefficient: 0.28,
      frontalArea: 2.55,
      rollingResistance: 0.014,
      mass: 2009,
      batteryCapacity: 77.4,
      chargingEfficiency: 0.92
    },
    epaRange: 310,
    maxChargingSpeed: 225
  },
  "kia-niro-ev": {
    id: "kia-niro-ev",
    brand: "Kia",
    model: "Niro EV",
    year: "2024",
    category: "SUV",
    config: {
      dragCoefficient: 0.29,
      frontalArea: 2.45,
      rollingResistance: 0.015,
      mass: 1737,
      batteryCapacity: 64.8,
      chargingEfficiency: 0.90
    },
    epaRange: 253,
    maxChargingSpeed: 75
  },
  // Genesis Models
  "genesis-gv60": {
    id: "genesis-gv60",
    brand: "Genesis",
    model: "GV60",
    year: "2025",
    category: "Luxury SUV",
    config: {
      dragCoefficient: 0.28,
      frontalArea: 2.55,
      rollingResistance: 0.014,
      mass: 2155,
      batteryCapacity: 77.4,
      chargingEfficiency: 0.92
    },
    epaRange: 294,
    maxChargingSpeed: 350
  },
  "genesis-gv70-electrified": {
    id: "genesis-gv70-electrified",
    brand: "Genesis",
    model: "GV70 Electrified",
    year: "2025",
    category: "Luxury SUV",
    config: {
      dragCoefficient: 0.29,
      frontalArea: 2.65,
      rollingResistance: 0.015,
      mass: 2310,
      batteryCapacity: 77.4,
      chargingEfficiency: 0.91
    },
    epaRange: 236,
    maxChargingSpeed: 240
  },
  // Volkswagen Models
  "volkswagen-id4": {
    id: "volkswagen-id4",
    brand: "Volkswagen",
    model: "ID.4",
    year: "2024",
    category: "SUV",
    config: {
      dragCoefficient: 0.28,
      frontalArea: 2.59,
      rollingResistance: 0.014,
      mass: 2000,
      batteryCapacity: 82,
      chargingEfficiency: 0.91
    },
    epaRange: 275,
    maxChargingSpeed: 135
  },
  // Polestar Models
  "polestar-2": {
    id: "polestar-2",
    brand: "Polestar",
    model: "2",
    year: "2024",
    category: "Sedan",
    config: {
      dragCoefficient: 0.27,
      frontalArea: 2.35,
      rollingResistance: 0.014,
      mass: 2123,
      batteryCapacity: 78,
      chargingEfficiency: 0.91
    },
    epaRange: 270,
    maxChargingSpeed: 155
  }
};

// Helper functions for vehicle profiles
export function getVehicleProfiles(): VehicleProfile[] {
  return Object.values(VEHICLE_PROFILES);
}

export function getVehicleProfile(id: string): VehicleProfile | null {
  return VEHICLE_PROFILES[id] || null;
}

export function getVehiclesByCategory(): Record<string, VehicleProfile[]> {
  const profilesByCategory: Record<string, VehicleProfile[]> = {};
  
  Object.values(VEHICLE_PROFILES).forEach(profile => {
    if (!profilesByCategory[profile.category]) {
      profilesByCategory[profile.category] = [];
    }
    profilesByCategory[profile.category].push(profile);
  });

  // Sort vehicles within each category by brand then model
  Object.keys(profilesByCategory).forEach(category => {
    profilesByCategory[category].sort((a, b) => {
      if (a.brand !== b.brand) {
        return a.brand.localeCompare(b.brand);
      }
      return a.model.localeCompare(b.model);
    });
  });

  return profilesByCategory;
}

// Helper function to get vehicle config (supports both legacy and new system)
function getVehicleConfig(vehicleType: string): VehicleConfig {
  // Check if it's a vehicle profile ID
  const profile = getVehicleProfile(vehicleType);
  if (profile) {
    return profile.config;
  }

  // Fall back to legacy system
  return VEHICLE_CONFIGS[vehicleType] || VEHICLE_CONFIGS.default;
}

// Legacy vehicle configs for backward compatibility
const VEHICLE_CONFIGS: Record<string, VehicleConfig> = {
  default: {
    dragCoefficient: 0.28,
    frontalArea: 2.22,
    rollingResistance: 0.015,
    mass: 1800,
    batteryCapacity: 75,
    chargingEfficiency: 0.9
  }
};

// Convert mph to m/s
const mphToMs = (mph: number): number => mph * 0.44704;

// Convert m/s to mph
const msToMph = (ms: number): number => ms / 0.44704;

// Convert miles to meters
const milesToMeters = (miles: number): number => miles * 1609.34;

// Calculate temperature-adjusted air density
function getAirDensity(tempF: number): number {
  // Convert Fahrenheit to Celsius
  const tempC = (tempF - 32) * 5/9;
  
  // Calculate air density using ideal gas law approximation
  // Standard air density at 15°C (59°F) and sea level: 1.225 kg/m³
  const standardTemp = 15; // Celsius
  const standardDensity = 1.225; // kg/m³
  
  // Air density decreases with temperature: ρ = ρ₀ × (T₀ / T)
  // Using absolute temperature (Kelvin)
  const airDensity = standardDensity * ((standardTemp + 273.15) / (tempC + 273.15));
  
  return airDensity;
}

// Calculate battery efficiency factor based on temperature
function getBatteryEfficiencyFactor(tempF: number): number {
  // Battery efficiency is optimal around 70-80°F
  // More realistic temperature effects - EVs are more efficient than this calculation was assuming
  
  if (tempF < 20) {
    // Extremely cold: 70% efficiency
    return 0.75;
  } else if (tempF < 40) {
    // Cold: 85% efficiency  
    return 0.88;
  } else if (tempF >= 40 && tempF <= 90) {
    // Optimal range: 98% efficiency
    return 0.98;
  } else if (tempF > 90 && tempF <= 105) {
    // Hot: 95% efficiency
    return 0.95;
  } else {
    // Very hot: 90% efficiency
    return 0.92;
  }
}

// Calculate energy consumption at given speed (kWh/mile)
function calculateEnergyConsumption(speedMph: number, vehicle: VehicleConfig, tempF: number, hasBikeRack: boolean = false): number {
  const speedMs = mphToMs(speedMph);
  const airDensity = getAirDensity(tempF);
  
  // Adjust aerodynamic properties for bike rack
  let adjustedDragCoeff = vehicle.dragCoefficient;
  let adjustedFrontalArea = vehicle.frontalArea;
  
  if (hasBikeRack) {
    // Bike rack adds significant drag - roughly 15-25% increase in drag coefficient
    // and some additional frontal area from bikes
    adjustedDragCoeff = vehicle.dragCoefficient * 1.20; // 20% increase in drag coefficient
    adjustedFrontalArea = vehicle.frontalArea * 1.10;   // 10% increase in frontal area
  }
  
  // Aerodynamic drag force: 0.5 * ρ * Cd * A * v²
  const dragForce = 0.5 * airDensity * adjustedDragCoeff * adjustedFrontalArea * speedMs * speedMs;
  
  // Rolling resistance force: Crr * m * g
  const rollingForce = vehicle.rollingResistance * vehicle.mass * 9.81;
  
  // Total force
  const totalForce = dragForce + rollingForce;
  
  // Power needed (Watts): Force * velocity
  const powerWatts = totalForce * speedMs;
  
  // Convert to kW and account for drivetrain efficiency (~92% for modern EVs)
  const powerKw = (powerWatts / 1000) / 0.92;
  
  // Apply temperature effect on battery efficiency
  const batteryEfficiency = getBatteryEfficiencyFactor(tempF);
  const adjustedPowerKw = powerKw / batteryEfficiency;
  
  // Energy consumption per mile (kWh/mile)
  const energyPerMile = adjustedPowerKw / speedMph;
  
  // Sanity check: Most EVs consume 0.2-0.7 kWh/mile at highway speeds
  // If calculation seems way off, there might be an error in parameters
  if (energyPerMile > 1.0) {
    console.warn(`Warning: Very high energy consumption calculated: ${energyPerMile.toFixed(3)} kWh/mile at ${speedMph} mph`);
  }
  
  return energyPerMile;
}

// Calculate charging time based on charging curve
function calculateChargingTime(
  fromPercent: number, 
  toPercent: number, 
  chargerPower: number, 
  vehicle: VehicleConfig
): number {
  // Simplified charging curve - real curves are more complex
  // Charging power decreases as battery fills
  const avgPercent = (fromPercent + toPercent) / 2;
  
  // Power reduction factor based on state of charge
  let powerFactor = 1.0;
  if (avgPercent > 80) {
    powerFactor = 0.4;
  } else if (avgPercent > 60) {
    powerFactor = 0.7;
  } else if (avgPercent > 40) {
    powerFactor = 0.9;
  }
  
  // Effective charging power
  const effectivePower = Math.min(chargerPower * powerFactor, chargerPower) * vehicle.chargingEfficiency;
  
  // Energy to add (kWh)
  const energyToAdd = (toPercent - fromPercent) / 100 * vehicle.batteryCapacity;
  
  // Time in hours
  return energyToAdd / effectivePower;
}

// Calculate driving time and energy for a given speed
function calculateDrivingMetrics(
  speedMph: number,
  input: OptimizationInput,
  vehicle: VehicleConfig
): { drivingTime: number; arrivalCharge: number; energyUsed: number } {
  // Driving time
  const drivingTime = input.distanceToCharger / speedMph;
  
  // Energy consumption
  const energyConsumption = calculateEnergyConsumption(speedMph, vehicle, input.ambientTemp, input.hasBikeRack);
  const energyUsed = energyConsumption * input.distanceToCharger;
  
  // Calculate current energy based on remaining range
  // Convert remaining range to energy by using vehicle's EPA range and battery capacity
  const vehicleProfile = getVehicleProfile(input.vehicleType);
  const epaRange = vehicleProfile?.epaRange || 300; // Default fallback
  
  // Calculate remaining energy as percentage of full battery
  const remainingPercentage = Math.min(100, (input.remainingRange / epaRange) * 100);
  const currentEnergy = (remainingPercentage / 100) * vehicle.batteryCapacity;
  
  // EPA-calibrated energy consumption check
  // EPA efficiency assumes mixed driving; pure highway efficiency varies by speed
  const epaEfficiency = vehicle.batteryCapacity / epaRange; // kWh/mile at EPA conditions
  
  // More realistic speed efficiency factors based on aerodynamic impact
  let speedEfficiencyFactor;
  if (speedMph <= 45) {
    speedEfficiencyFactor = 0.85; // Very efficient at low speeds
  } else if (speedMph <= 65) {
    speedEfficiencyFactor = 0.95; // Near optimal at moderate highway speeds
  } else if (speedMph <= 75) {
    speedEfficiencyFactor = 1.05; // Slightly less efficient
  } else if (speedMph <= 85) {
    speedEfficiencyFactor = 1.15; // Noticeable efficiency loss
  } else {
    speedEfficiencyFactor = 1.25 + (speedMph - 85) * 0.02; // Significant efficiency loss at high speeds
  }
  
  const calibratedEnergyConsumption = epaEfficiency * speedEfficiencyFactor;
  
  // Use a balanced approach: average of physics and EPA-calibrated, but never lower than 80% of EPA
  const minRealisticConsumption = epaEfficiency * 0.80; // Never more efficient than 80% of EPA
  const balancedConsumption = (energyConsumption + calibratedEnergyConsumption) / 2;
  const adjustedEnergyConsumption = Math.max(minRealisticConsumption, Math.min(energyConsumption, balancedConsumption));
  const adjustedEnergyUsed = adjustedEnergyConsumption * input.distanceToCharger;
  
  // Energy remaining after trip (using adjusted consumption)
  const energyAfterTrip = currentEnergy - adjustedEnergyUsed;
  const arrivalChargePercent = Math.max(0, (energyAfterTrip / vehicle.batteryCapacity) * 100);
  
  // Debug logging for energy calculations
  if (typeof window !== 'undefined' && window.console) {
    const vehicleName = vehicleProfile?.brand + ' ' + vehicleProfile?.model || input.vehicleType;
    console.log(`Energy Debug: ${vehicleName}, Speed=${speedMph}mph, Range=${input.remainingRange}mi, Distance=${input.distanceToCharger}mi, EPA=${epaRange}mi, CurrentEnergy=${currentEnergy.toFixed(1)}kWh, EPAEfficiency=${epaEfficiency.toFixed(3)}kWh/mi, SpeedFactor=${speedEfficiencyFactor.toFixed(2)}, PhysicsConsumption=${energyConsumption.toFixed(3)}kWh/mi, CalibratedConsumption=${calibratedEnergyConsumption.toFixed(3)}kWh/mi, UsedConsumption=${adjustedEnergyConsumption.toFixed(3)}kWh/mi, EnergyUsed=${adjustedEnergyUsed.toFixed(1)}kWh, ArrivalCharge=${arrivalChargePercent.toFixed(1)}%`);
  }
  
  return {
    drivingTime,
    arrivalCharge: arrivalChargePercent,
    energyUsed: adjustedEnergyUsed
  };
}

// Find optimal speed that minimizes driving time only
export function optimizeSpeed(input: OptimizationInput): OptimizationResult {
  const vehicle = getVehicleConfig(input.vehicleType);
  
  // Early feasibility check: Basic physics constraint
  // Check if trip is possible even at the most efficient speed (45 mph)
  const mostEfficientResult = calculateDrivingMetrics(45, input, vehicle);
  if (mostEfficientResult.arrivalCharge < input.minArrivalCharge) {
    return {
      optimalSpeed: 0,
      totalTime: Infinity,
      drivingTime: 0,
      chargingTime: 0,
      arrivalCharge: mostEfficientResult.arrivalCharge,
      energyConsumption: 0,
      energyUsed: mostEfficientResult.energyUsed,
      avgChargingPower: 0,
      speedComparison: {
        speed55: Infinity,
        speed65: Infinity,
        speed75: Infinity
      },
      speedVsTimeData: []
    };
  }
  
  let optimalSpeed = 60;
  let minDrivingTime = Infinity;
  let bestResult: any = null;
  let validSpeedsFound = false;
  
  // Generate speed vs time data for graph
  const speedVsTimeData: Array<{speed: number; time: number; feasible: boolean}> = [];
  
  // Test speeds from 45 to 120 mph in 1 mph increments for optimization
  for (let speed = 45; speed <= 120; speed += 1) {
    const drivingResult = calculateDrivingMetrics(speed, input, vehicle);
    const feasible = drivingResult.arrivalCharge >= input.minArrivalCharge;
    
    // Add to speed vs time data (using driving time only)
    speedVsTimeData.push({
      speed,
      time: drivingResult.drivingTime,
      feasible
    });
    
    // Skip invalid speeds for optimization
    if (!feasible) {
      continue;
    }
    
    validSpeedsFound = true;
    
    // Find speed that minimizes DRIVING time only
    if (drivingResult.drivingTime < minDrivingTime) {
      minDrivingTime = drivingResult.drivingTime;
      optimalSpeed = speed;
      bestResult = drivingResult;
    }
  }
  
  // If no valid speeds found, check if trip is even possible
  if (!validSpeedsFound) {
    // Try the most efficient speed (55 mph) to see minimum energy needed
    const mostEfficientResult = calculateDrivingMetrics(55, input, vehicle);
    
    // Return an error result indicating insufficient charge
    return {
      optimalSpeed: 0,
      totalTime: Infinity,
      drivingTime: 0,
      chargingTime: 0,
      arrivalCharge: mostEfficientResult.arrivalCharge,
      energyConsumption: 0,
      energyUsed: mostEfficientResult.energyUsed,
      avgChargingPower: 0,
      speedComparison: {
        speed55: Infinity,
        speed65: Infinity,
        speed75: Infinity
      },
      speedVsTimeData
    };
  }
  
  // Calculate speed comparisons (driving time only)
  const speed55Result = calculateDrivingMetrics(55, input, vehicle);
  const speed65Result = calculateDrivingMetrics(65, input, vehicle);
  const speed75Result = calculateDrivingMetrics(75, input, vehicle);

  return {
    optimalSpeed,
    totalTime: bestResult.drivingTime, // Total time = driving time only
    drivingTime: bestResult.drivingTime,
    chargingTime: 0, // No charging time included
    arrivalCharge: bestResult.arrivalCharge,
    energyConsumption: calculateEnergyConsumption(optimalSpeed, vehicle, input.ambientTemp, input.hasBikeRack),
    energyUsed: bestResult.energyUsed,
    avgChargingPower: 0, // No charging calculations
    speedComparison: {
      speed55: speed55Result.arrivalCharge >= input.minArrivalCharge ? speed55Result.drivingTime : Infinity,
      speed65: speed65Result.arrivalCharge >= input.minArrivalCharge ? speed65Result.drivingTime : Infinity,
      speed75: speed75Result.arrivalCharge >= input.minArrivalCharge ? speed75Result.drivingTime : Infinity
    },
    speedVsTimeData
  };
}

// Export function to calculate energy consumption at a specific speed for validation testing
export function calculateConsumptionAtSpeed(
  vehicleType: string,
  speedMph: number,
  tempF: number,
  hasBikeRack: boolean = false
): number {
  const profile = getVehicleProfile(vehicleType);
  if (!profile) {
    return 0;
  }
  return calculateEnergyConsumption(speedMph, profile.config, tempF, hasBikeRack);
}
