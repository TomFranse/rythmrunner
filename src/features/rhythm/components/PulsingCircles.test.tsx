import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { PulsingCircles } from "./PulsingCircles";
import { theme } from "@shared/theme/theme";
import type { AudioLayerState } from "@/features/rhythm/types/rhythm.types";

function renderCircles(layerState: AudioLayerState) {
  return render(
    <ThemeProvider theme={theme}>
      <PulsingCircles layers={layerState} bpm={120} reducedMotion />
    </ThemeProvider>
  );
}

const allActiveState: AudioLayerState = {
  beatGridLayers: {
    L64: { active: true, gain: 0.25 },
    L32: { active: true, gain: 0.35 },
    L16: { active: true, gain: 0.5 },
    L8: { active: true, gain: 1 },
  },
  isPeak: true,
  beatInCycle: 30,
  masterGain: 0.8,
};

describe("PulsingCircles", () => {
  it("should render four layer circles", () => {
    const { container } = renderCircles(allActiveState);
    const circles = container.querySelectorAll('[class*="MuiBox"]');
    expect(circles.length).toBeGreaterThanOrEqual(4);
  });
});
