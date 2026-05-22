import { describe, it, expect, vi, afterEach } from "vitest";
import { needsExplicitPermission, requestMotionPermission } from "./motionPermissionService";

describe("motionPermissionService", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return unsupported when requesting without motion API", async () => {
    const original = globalThis.DeviceMotionEvent;
    Reflect.deleteProperty(globalThis, "DeviceMotionEvent");
    await expect(requestMotionPermission()).resolves.toBe("unsupported");
    globalThis.DeviceMotionEvent = original;
  });

  it("should detect iOS-style permission API", () => {
    vi.stubGlobal("DeviceMotionEvent", {
      requestPermission: vi.fn(),
    });
    expect(needsExplicitPermission()).toBe(true);
  });

  it("should return granted when permission resolves granted", async () => {
    vi.stubGlobal("DeviceMotionEvent", {
      requestPermission: vi.fn().mockResolvedValue("granted"),
    });
    await expect(requestMotionPermission()).resolves.toBe("granted");
  });

  it("should return denied when permission resolves denied", async () => {
    vi.stubGlobal("DeviceMotionEvent", {
      requestPermission: vi.fn().mockResolvedValue("denied"),
    });
    await expect(requestMotionPermission()).resolves.toBe("denied");
  });
});
