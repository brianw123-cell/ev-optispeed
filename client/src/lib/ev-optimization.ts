export interface VehicleConfig {
  dragCoefficient: number;
  frontalArea: number; // m²
  rollingResistance: number;
  mass: number; // kg
  batteryCapacity: number; // kWh
  chargingEfficiency: number;
}

export type OptimizationMode = 'total-time' | 'driving-only';

export interface OptimizationInput {
  remainingRange: number; // miles
  distanceToCharger: number; // miles
  vehicleType: string;
  ambientTemp: number; // Fahrenheit
  minArrivalCharge: number; // percentage
  hasBikeRack: boolean; // adds aerodynamic drag
  mode?: OptimizationMode; // default: 'total-time'
  targetChargePercent?: number; // SoC to charge back up to (default 80)
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

  // Energy consumption per mile (kWh/mile)
  // Temperature already affects this through air density (cold air = denser = more drag).
  // We do NOT divide by battery efficiency here — that would double-count cold weather
  // because the user's reported remaining range is already weather-derated by their dash GOM.
  return powerKw / speedMph;
}

// Instantaneous charging power as a fraction of the vehicle's nameplate peak,
// at a given SoC. Curve shape modelled after real DC fast charging data from
// Fastned / EV-Database charts (Tesla M3/Y, Lucid Air, Hyundai IONIQ 5, F-150).
// Nameplate peak is sustained only briefly around 15-30%; tapers from there.
// Average power over 10-80% comes out to roughly 50% of nameplate, which
// matches owner-reported averages across the vehicle list.
function chargingPowerFactor(soc: number): number {
  if (soc < 10) return 0.40 + soc * 0.035;              // ramps 0.40 → 0.75
  if (soc < 25) return 0.75;                            // peak plateau
  if (soc < 50) return 0.75 - (soc - 25) / 25 * 0.25;   // 0.75 → 0.50
  if (soc < 65) return 0.50 - (soc - 50) / 15 * 0.20;   // 0.50 → 0.30
  if (soc < 80) return 0.30 - (soc - 65) / 15 * 0.15;   // 0.30 → 0.15
  if (soc < 90) return 0.15 - (soc - 80) / 10 * 0.07;   // 0.15 → 0.08
  return Math.max(0.04, 0.08 - (soc - 90) / 10 * 0.04); // 0.08 → 0.04
}

// Charging time computed by numerical integration over the SoC curve.
// Much more accurate than the prior single-power-factor model, especially
// for sessions that cross multiple curve regions (e.g. 5% → 80%).
function calculateChargingTime(
  fromPercent: number,
  toPercent: number,
  chargerPower: number,
  vehicle: VehicleConfig
): number {
  if (toPercent <= fromPercent) return 0;
  const STEP = 0.5; // 0.5% SoC increments
  let timeHours = 0;
  for (let soc = fromPercent; soc < toPercent; soc += STEP) {
    const stepSize = Math.min(STEP, toPercent - soc);
    const power = chargerPower * chargingPowerFactor(soc) * vehicle.chargingEfficiency;
    const energyAdded = (stepSize / 100) * vehicle.batteryCapacity;
    timeHours += energyAdded / power;
  }
  return timeHours;
}

// Calculate driving time, energy used, and arrival charge for a given test speed.
// Uses a single physics model. The user's reported remaining range is treated at face
// value as miles available at typical highway speed in current weather — i.e. the dash's
// GOM estimate. We back into starting energy from that, then deduct the energy this trip
// would consume at the test speed.
function calculateDrivingMetrics(
  speedMph: number,
  input: OptimizationInput,
  vehicle: VehicleConfig
): { drivingTime: number; arrivalCharge: number; energyUsed: number; energyConsumption: number } {
  const drivingTime = input.distanceToCharger / speedMph;

  // Per-mile consumption at the test speed (pure physics, weather-adjusted via air density)
  const energyConsumption = calculateEnergyConsumption(speedMph, vehicle, input.ambientTemp, input.hasBikeRack);
  const energyUsed = energyConsumption * input.distanceToCharger;

  // Starting energy in the battery: derived from the user's reported range at a typical
  // highway baseline (65 mph) in current weather. This makes the model self-consistent —
  // if the user says "I have 150 miles," we trust that means 150 miles at typical driving.
  const baselineConsumption = calculateEnergyConsumption(65, vehicle, input.ambientTemp, input.hasBikeRack);
  const startingEnergy = input.remainingRange * baselineConsumption;

  // Arrival energy and charge percentage of nominal battery capacity
  const energyAfterTrip = startingEnergy - energyUsed;
  const arrivalChargePercent = (energyAfterTrip / vehicle.batteryCapacity) * 100;

  return {
    drivingTime,
    arrivalCharge: arrivalChargePercent,
    energyUsed,
    energyConsumption
  };
}

// Find the optimal speed.
// In 'total-time' mode (default): minimize driving + charging time. Faster speeds save drive
// time but leave a lower arrival SoC, which requires more charging. The sweet spot depends
// on the vehicle's charging curve and the trip distance.
// In 'driving-only' mode: just find the highest feasible speed (useful when the user has
// time to charge anyway — e.g. dinner stop, overnight).
export function optimizeSpeed(input: OptimizationInput): OptimizationResult {
  const vehicle = getVehicleConfig(input.vehicleType);
  const vehicleProfile = getVehicleProfile(input.vehicleType);
  const mode: OptimizationMode = input.mode ?? 'total-time';
  const targetChargePercent = input.targetChargePercent ?? 80;
  const maxChargingSpeed = vehicleProfile?.maxChargingSpeed ?? 150;

  const SPEED_MIN = 35;
  const SPEED_MAX = 120;

  const computeChargingTime = (arrivalCharge: number): number => {
    if (mode !== 'total-time') return 0;
    if (arrivalCharge >= targetChargePercent) return 0;
    return calculateChargingTime(arrivalCharge, targetChargePercent, maxChargingSpeed, vehicle);
  };

  const emptyResult = (arrivalCharge: number, energyUsed: number): OptimizationResult => ({
    optimalSpeed: 0,
    totalTime: Infinity,
    drivingTime: 0,
    chargingTime: 0,
    arrivalCharge,
    energyConsumption: 0,
    energyUsed,
    avgChargingPower: 0,
    speedComparison: { speed55: Infinity, speed65: Infinity, speed75: Infinity },
    speedVsTimeData: []
  });

  type Candidate = {
    speed: number;
    drivingTime: number;
    chargingTime: number;
    totalTime: number;
    arrivalCharge: number;
    energyConsumption: number;
    energyUsed: number;
  };

  let best: Candidate | null = null;
  const speedVsTimeData: Array<{ speed: number; time: number; feasible: boolean }> = [];

  for (let speed = SPEED_MIN; speed <= SPEED_MAX; speed++) {
    const m = calculateDrivingMetrics(speed, input, vehicle);
    const feasible = m.arrivalCharge >= input.minArrivalCharge;
    const chargingTime = feasible ? computeChargingTime(m.arrivalCharge) : 0;
    const totalTime = m.drivingTime + chargingTime;

    speedVsTimeData.push({ speed, time: totalTime, feasible });

    if (!feasible) continue;

    const objective = mode === 'driving-only' ? m.drivingTime : totalTime;
    const bestObjective = best
      ? (mode === 'driving-only' ? best.drivingTime : best.totalTime)
      : Infinity;

    // Strict < ensures we pick the FIRST minimum we see (lowest speed at the tie in driving-only
    // would be wrong — we want highest feasible speed there). Handle ties explicitly per mode.
    const isBetter = mode === 'driving-only'
      ? m.drivingTime < bestObjective // lower driving time = higher speed; first hit at min
      : objective < bestObjective;

    if (isBetter) {
      best = {
        speed,
        drivingTime: m.drivingTime,
        chargingTime,
        totalTime,
        arrivalCharge: m.arrivalCharge,
        energyConsumption: m.energyConsumption,
        energyUsed: m.energyUsed
      };
    }
  }

  if (!best) {
    const fallback = calculateDrivingMetrics(SPEED_MIN, input, vehicle);
    return emptyResult(fallback.arrivalCharge, fallback.energyUsed);
  }

  // Speed comparisons reflect the same objective as the optimization mode
  const compareAt = (s: number): number => {
    const m = calculateDrivingMetrics(s, input, vehicle);
    if (m.arrivalCharge < input.minArrivalCharge) return Infinity;
    const ct = computeChargingTime(m.arrivalCharge);
    return mode === 'driving-only' ? m.drivingTime : m.drivingTime + ct;
  };

  // Average charging power during the charging session (kW)
  const energyToAdd = best.chargingTime > 0
    ? ((targetChargePercent - best.arrivalCharge) / 100) * vehicle.batteryCapacity
    : 0;
  const avgChargingPower = best.chargingTime > 0 ? energyToAdd / best.chargingTime : 0;

  const result: OptimizationResult = {
    optimalSpeed: best.speed,
    totalTime: best.totalTime,
    drivingTime: best.drivingTime,
    chargingTime: best.chargingTime,
    arrivalCharge: best.arrivalCharge,
    energyConsumption: best.energyConsumption,
    energyUsed: best.energyUsed,
    avgChargingPower,
    speedComparison: {
      speed55: compareAt(55),
      speed65: compareAt(65),
      speed75: compareAt(75)
    },
    speedVsTimeData
  };

  // NaN / infinity guard — fail loudly rather than silently displaying garbage
  const numericFields: Array<keyof OptimizationResult> = [
    'optimalSpeed', 'totalTime', 'drivingTime', 'chargingTime',
    'arrivalCharge', 'energyConsumption', 'energyUsed', 'avgChargingPower'
  ];
  for (const f of numericFields) {
    const v = result[f] as number;
    if (typeof v === 'number' && !isFinite(v)) {
      throw new Error(`Calculation produced invalid value for ${f}. Please check your inputs.`);
    }
  }

  return result;
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
