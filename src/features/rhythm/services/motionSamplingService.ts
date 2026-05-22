import type { MotionSample } from "@/features/rhythm/types/rhythm.types";

/** Slow EMA to separate gravity from steps when only `accelerationIncludingGravity` exists. */
export const GRAVITY_TRACKING_ALPHA = 0.08;

export interface GravityEstimator {
  x: number;
  y: number;
  z: number;
  initialized: boolean;
}

export function createGravityEstimator(): GravityEstimator {
  return { x: 0, y: 0, z: 0, initialized: false };
}

function hasReadableAcceleration(
  acc: DeviceMotionEvent["acceleration"] | DeviceMotionEvent["accelerationIncludingGravity"]
): acc is { x: number | null; y: number | null; z: number | null } {
  return acc !== null && (acc.x !== null || acc.y !== null || acc.z !== null);
}

export function deviceMotionTimestamp(event: DeviceMotionEvent): number {
  if (typeof event.timeStamp === "number" && event.timeStamp > 0) {
    return event.timeStamp;
  }
  return performance.now();
}

export function subtractGravity(
  estimator: GravityEstimator,
  x: number,
  y: number,
  z: number
): { x: number; y: number; z: number } {
  if (!estimator.initialized) {
    estimator.x = x;
    estimator.y = y;
    estimator.z = z;
    estimator.initialized = true;
    return { x: 0, y: 0, z: 0 };
  }

  estimator.x = GRAVITY_TRACKING_ALPHA * x + (1 - GRAVITY_TRACKING_ALPHA) * estimator.x;
  estimator.y = GRAVITY_TRACKING_ALPHA * y + (1 - GRAVITY_TRACKING_ALPHA) * estimator.y;
  estimator.z = GRAVITY_TRACKING_ALPHA * z + (1 - GRAVITY_TRACKING_ALPHA) * estimator.z;

  return {
    x: x - estimator.x,
    y: y - estimator.y,
    z: z - estimator.z,
  };
}

export function sampleFromDeviceMotion(
  event: DeviceMotionEvent,
  gravityEstimator: GravityEstimator
): MotionSample | null {
  const timestamp = deviceMotionTimestamp(event);

  const linear = event.acceleration;
  if (hasReadableAcceleration(linear)) {
    return {
      x: linear.x ?? 0,
      y: linear.y ?? 0,
      z: linear.z ?? 0,
      timestamp,
    };
  }

  const withGravity = event.accelerationIncludingGravity;
  if (!hasReadableAcceleration(withGravity)) {
    return null;
  }

  const gx = withGravity.x ?? 0;
  const gy = withGravity.y ?? 0;
  const gz = withGravity.z ?? 0;
  const corrected = subtractGravity(gravityEstimator, gx, gy, gz);

  return {
    x: corrected.x,
    y: corrected.y,
    z: corrected.z,
    timestamp,
  };
}
