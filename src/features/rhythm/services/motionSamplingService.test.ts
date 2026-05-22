import { describe, it, expect, vi } from "vitest";
import {
  computeMagnitude,
  createStepDetector,
  processMotionSample,
} from "@/features/rhythm/services/stepDetectionService";
import {
  createGravityEstimator,
  deviceMotionTimestamp,
  sampleFromDeviceMotion,
} from "@/features/rhythm/services/motionSamplingService";

function motionEvent(
  partial: Partial<DeviceMotionEvent> & {
    acceleration?: DeviceMotionEvent["acceleration"];
    accelerationIncludingGravity?: DeviceMotionEvent["accelerationIncludingGravity"];
  }
): DeviceMotionEvent {
  return {
    timeStamp: 1000,
    ...partial,
  } as DeviceMotionEvent;
}

describe("motionSamplingService", () => {
  it("should prefer linear acceleration when available", () => {
    const estimator = createGravityEstimator();
    const sample = sampleFromDeviceMotion(
      motionEvent({
        acceleration: { x: 1, y: 2, z: 2, interval: 0 } as DeviceMotionEvent["acceleration"],
        accelerationIncludingGravity: {
          x: 0,
          y: 0,
          z: 9.8,
          interval: 0,
        } as DeviceMotionEvent["accelerationIncludingGravity"],
      }),
      estimator
    );

    expect(sample).toEqual({ x: 1, y: 2, z: 2, timestamp: 1000 });
  });

  it("should subtract gravity from accelerationIncludingGravity when still", () => {
    const estimator = createGravityEstimator();
    let magnitude = Number.POSITIVE_INFINITY;

    for (let i = 0; i < 80; i += 1) {
      const sample = sampleFromDeviceMotion(
        motionEvent({
          timeStamp: 1000 + i * 16,
          acceleration: null,
          accelerationIncludingGravity: {
            x: 0,
            y: 0,
            z: 9.8,
            interval: 0,
          } as DeviceMotionEvent["accelerationIncludingGravity"],
        }),
        estimator
      );
      magnitude = computeMagnitude(sample!.x, sample!.y, sample!.z);
    }

    expect(magnitude).toBeLessThan(0.2);
  });

  it("should use performance.now when event timeStamp is zero", () => {
    const now = 4242;
    vi.spyOn(performance, "now").mockReturnValue(now);
    expect(deviceMotionTimestamp(motionEvent({ timeStamp: 0 }))).toBe(now);
    vi.restoreAllMocks();
  });
});

describe("still phone BPM", () => {
  it("should not report ~300 BPM from constant gravity magnitude", () => {
    const estimator = createGravityEstimator();
    const detector = createStepDetector();
    let bpm = 60;

    for (let i = 0; i < 200; i += 1) {
      const sample = sampleFromDeviceMotion(
        motionEvent({
          timeStamp: i * 16,
          acceleration: null,
          accelerationIncludingGravity: {
            x: 0,
            y: 0,
            z: 9.8,
            interval: 0,
          } as DeviceMotionEvent["accelerationIncludingGravity"],
        }),
        estimator
      );
      const magnitude = computeMagnitude(sample!.x, sample!.y, sample!.z);
      bpm = processMotionSample(detector, magnitude, sample!.timestamp).bpm;
    }

    expect(bpm).toBe(60);
    expect(detector.stepIntervalsMs).toHaveLength(0);
  });
});
