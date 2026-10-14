# EV OptiSpeed

Driving faster in an electric car burns more battery, which can mean a longer charging stop. EV OptiSpeed finds the cruising speed that gets you there soonest once charging time is counted, not just driving time.

**Live demo:** https://ev-optispeed.vercel.app (installable as a phone app)

## What it does

- Models per-mile energy use from speed (aerodynamic drag grows with the square of speed), outside temperature and a bike rack
- Two modes: the fastest speed that still arrives with a minimum battery charge, or the speed with the lowest total trip time including a charging stop
- Charts total trip time against speed so you can see the tradeoff
- Vehicle presets, plus voice input for hands-free entry

## Stack

Vite, React, TypeScript, Tailwind. The optimization logic is pure functions in `client/src/lib/ev-optimization.ts`.

## Tests

`npm test` runs the Vitest suite covering consumption by vehicle, temperature and bike-rack effects, speed effects, and both optimization modes, including impossible trips.

## Run it

```bash
npm install
npm run dev
```
