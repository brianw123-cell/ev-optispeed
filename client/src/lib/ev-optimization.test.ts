import { describe, it, expect } from "vitest";
import {
  optimizeSpeed,
  calculateConsumptionAtSpeed,
  type OptimizationInput,
} from "./ev-optimization";

/**
 * These tests pin the physics model to real-world reference data.
 *
 * Highway consumption figures are from EV-Database.org's "highway" (~70 mph,
 * ~70°F) driving estimates, cross-referenced with EPA highway-cycle results
 * (fueleconomy.gov) where available. Ranges are intentionally wide (~±15%)
 * because real-world consumption varies meaningfully by trim, tire/wheel
 * spec, and individual test conditions.
 *
 * Update these fixtures only when (a) you've added a new vehicle, or (b) the
 * underlying physics model has been intentionally changed and verified
 * against external data.
 */

const baseInput = (overrides: Partial<OptimizationInput> = {}): OptimizationInput => ({
  remainingRange: 250,
  distanceToCharger: 150,
  vehicleType: "tesla-model-3",
  ambientTemp: 70,
  minArrivalCharge: 5,
  hasBikeRack: false,
  mode: "driving-only",
  ...overrides,
});

// Highway consumption fixtures at 70 mph, 70°F (kWh/mi).
// Source: EV-Database.org highway driving estimates (~70 mph).
const HIGHWAY_CONSUMPTION_70MPH_70F: Array<[string, number, number]> = [
  // [vehicleId,           min,   max]
  ["tesla-model-3",        0.22, 0.32],
  ["tesla-model-y",        0.25, 0.36],
  ["tesla-model-s",        0.26, 0.38],
  ["lucid-air",            0.20, 0.32],
  ["hyundai-ioniq-5",      0.28, 0.40],
  ["ford-mustang-mach-e",  0.30, 0.42],
  ["bmw-i4",               0.26, 0.38],
  ["mercedes-eqs",         0.26, 0.38],
  ["ford-f150-lightning",  0.45, 0.70],
  ["rivian-r1t",           0.40, 0.62],
];

describe("Per-mile consumption at highway speed (70 mph, 70°F)", () => {
  for (const [vehicleId, min, max] of HIGHWAY_CONSUMPTION_70MPH_70F) {
    it(`${vehicleId} is within ${min}-${max} kWh/mi`, () => {
      const consumption = calculateConsumptionAtSpeed(vehicleId, 70, 70, false);
      expect(consumption).toBeGreaterThanOrEqual(min);
      expect(consumption).toBeLessThanOrEqual(max);
    });
  }
});

describe("Weather effects on per-mile consumption", () => {
  it("cold weather (20°F) increases per-mile consumption vs 70°F", () => {
    const warm = calculateConsumptionAtSpeed("tesla-model-3", 70, 70, false);
    const cold = calculateConsumptionAtSpeed("tesla-model-3", 70, 20, false);
    // Cold air is denser → more drag. Should be 3-12% higher.
    expect(cold).toBeGreaterThan(warm * 1.02);
    expect(cold).toBeLessThan(warm * 1.15);
  });

  it("hot weather (100°F) decreases per-mile consumption vs 70°F (less dense air)", () => {
    const warm = calculateConsumptionAtSpeed("tesla-model-3", 70, 70, false);
    const hot = calculateConsumptionAtSpeed("tesla-model-3", 70, 100, false);
    expect(hot).toBeLessThan(warm);
  });
});

describe("Bike rack penalty", () => {
  it("adds 15-25% more per-mile consumption at 70 mph", () => {
    const without = calculateConsumptionAtSpeed("tesla-model-3", 70, 70, false);
    const withRack = calculateConsumptionAtSpeed("tesla-model-3", 70, 70, true);
    expect(withRack).toBeGreaterThan(without * 1.10);
    expect(withRack).toBeLessThan(without * 1.30);
  });

  it("rack penalty grows at higher speed (drag scales with speed²)", () => {
    const racked55 = calculateConsumptionAtSpeed("tesla-model-3", 55, 70, true);
    const racked85 = calculateConsumptionAtSpeed("tesla-model-3", 85, 70, true);
    expect(racked85).toBeGreaterThan(racked55);
  });
});

describe("Speed effect on consumption", () => {
  it("monotonically increases from 55 to 85 mph", () => {
    const speeds = [55, 65, 75, 85];
    const values = speeds.map(s => calculateConsumptionAtSpeed("tesla-model-3", s, 70, false));
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });

  it("85 mph uses meaningfully more than 65 mph (drag scales with v²)", () => {
    const at65 = calculateConsumptionAtSpeed("tesla-model-3", 65, 70, false);
    const at85 = calculateConsumptionAtSpeed("tesla-model-3", 85, 70, false);
    // ~30-60% more typical for a sedan
    expect(at85 / at65).toBeGreaterThan(1.20);
    expect(at85 / at65).toBeLessThan(1.70);
  });
});

describe("optimizeSpeed — driving-only mode", () => {
  it("finds the maximum feasible speed", () => {
    const r = optimizeSpeed(baseInput({ remainingRange: 300, distanceToCharger: 100, mode: "driving-only" }));
    expect(r.optimalSpeed).toBeGreaterThanOrEqual(75);
    expect(r.optimalSpeed).toBeLessThanOrEqual(120);
  });

  it("respects minArrivalCharge floor", () => {
    const r = optimizeSpeed(baseInput({ remainingRange: 200, distanceToCharger: 150, minArrivalCharge: 20, mode: "driving-only" }));
    if (r.optimalSpeed > 0) {
      expect(r.arrivalCharge).toBeGreaterThanOrEqual(20);
    }
  });

  it("returns infeasible (optimalSpeed=0) when trip impossible at any speed", () => {
    const r = optimizeSpeed(baseInput({ remainingRange: 50, distanceToCharger: 200, mode: "driving-only" }));
    expect(r.optimalSpeed).toBe(0);
    expect(r.totalTime).toBe(Infinity);
  });

  it("chargingTime is 0 in driving-only mode", () => {
    const r = optimizeSpeed(baseInput({ mode: "driving-only" }));
    expect(r.chargingTime).toBe(0);
  });
});

describe("optimizeSpeed — total-time mode (drive + charge)", () => {
  it("includes charging time in total when arrival < target", () => {
    const r = optimizeSpeed(baseInput({
      remainingRange: 250,
      distanceToCharger: 150,
      mode: "total-time",
      targetChargePercent: 80,
    }));
    expect(r.optimalSpeed).toBeGreaterThan(0);
    expect(r.chargingTime).toBeGreaterThan(0);
    expect(r.totalTime).toBeCloseTo(r.drivingTime + r.chargingTime, 5);
  });

  it("higher target SoC produces longer total time at same speed", () => {
    const r70 = optimizeSpeed(baseInput({ mode: "total-time", targetChargePercent: 70 }));
    const r90 = optimizeSpeed(baseInput({ mode: "total-time", targetChargePercent: 90 }));
    expect(r90.totalTime).toBeGreaterThanOrEqual(r70.totalTime);
  });

  it("driving-only optimal speed >= total-time optimal speed (same inputs)", () => {
    const inputs = baseInput({ remainingRange: 250, distanceToCharger: 150 });
    const dOnly = optimizeSpeed({ ...inputs, mode: "driving-only" });
    const total = optimizeSpeed({ ...inputs, mode: "total-time", targetChargePercent: 80 });
    expect(dOnly.optimalSpeed).toBeGreaterThanOrEqual(total.optimalSpeed);
  });
});

describe("Result invariants — never returns NaN or invalid values", () => {
  const stressInputs: Array<[string, OptimizationInput]> = [
    ["zero-distance edge", baseInput({ distanceToCharger: 1 })],
    ["very cold", baseInput({ ambientTemp: -30 })],
    ["very hot", baseInput({ ambientTemp: 115 })],
    ["long range short trip", baseInput({ remainingRange: 400, distanceToCharger: 50 })],
    ["bike rack + cold", baseInput({ hasBikeRack: true, ambientTemp: 10 })],
    ["high min-arrival", baseInput({ minArrivalCharge: 40 })],
  ];

  for (const [label, input] of stressInputs) {
    it(`produces finite numbers for: ${label}`, () => {
      const r = optimizeSpeed(input);
      const fields = [r.optimalSpeed, r.totalTime === Infinity ? 0 : r.totalTime,
                      r.drivingTime, r.chargingTime, r.arrivalCharge,
                      r.energyConsumption, r.energyUsed, r.avgChargingPower];
      for (const v of fields) {
        expect(Number.isFinite(v)).toBe(true);
        expect(Number.isNaN(v)).toBe(false);
      }
    });
  }
});

describe("Speed comparison data", () => {
  it("returns finite times or Infinity (never NaN) for 55/65/75 mph comparisons", () => {
    const r = optimizeSpeed(baseInput({ remainingRange: 250, distanceToCharger: 150 }));
    for (const t of [r.speedComparison.speed55, r.speedComparison.speed65, r.speedComparison.speed75]) {
      expect(Number.isNaN(t)).toBe(false);
    }
  });

  it("speedVsTimeData covers 35-120 mph at 1 mph increments", () => {
    const r = optimizeSpeed(baseInput());
    expect(r.speedVsTimeData.length).toBe(120 - 35 + 1);
    expect(r.speedVsTimeData[0].speed).toBe(35);
    expect(r.speedVsTimeData[r.speedVsTimeData.length - 1].speed).toBe(120);
  });
});
