import type { MotionPermissionStatus } from "@/features/rhythm/types/rhythm.types";

type DeviceMotionWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export function isMotionSupported(): boolean {
  return typeof window !== "undefined" && "DeviceMotionEvent" in window;
}

export function needsExplicitPermission(): boolean {
  if (!isMotionSupported()) {
    return false;
  }
  const motion = DeviceMotionEvent as DeviceMotionWithPermission;
  return typeof motion.requestPermission === "function";
}

export async function requestMotionPermission(): Promise<MotionPermissionStatus> {
  if (!isMotionSupported()) {
    return "unsupported";
  }

  const motion = DeviceMotionEvent as DeviceMotionWithPermission;
  if (typeof motion.requestPermission !== "function") {
    return "granted";
  }

  const result = await motion.requestPermission();
  return result === "granted" ? "granted" : "denied";
}
