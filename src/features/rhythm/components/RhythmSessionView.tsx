import { Box, useMediaQuery } from "@mui/material";
import { MotionPermissionGate } from "@/features/rhythm/components/MotionPermissionGate";
import { MotionSimulatorPanel } from "@/features/rhythm/components/dev/MotionSimulatorPanel";
import { PulsingCircles } from "@/features/rhythm/components/PulsingCircles";
import { SessionControls } from "@/features/rhythm/components/SessionControls";
import { useRhythmSession } from "@/features/rhythm/hooks/useRhythmSession";
import { viewportFlexibleRegionSx, viewportPageSx } from "@shared/utils/viewportLayout";

export function RhythmSessionView() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const session = useRhythmSession();

  return (
    <Box onClick={session.revealControls} sx={viewportPageSx}>
      <MotionPermissionGate
        status={session.permissionStatus}
        onRequestPermission={session.handleRequestPermission}
      />

      <Box sx={viewportFlexibleRegionSx}>
        <PulsingCircles
          layers={session.layerState}
          bpm={session.stepState.bpm}
          reducedMotion={reducedMotion}
        />
      </Box>

      <Box sx={{ flexShrink: 0 }}>
        <SessionControls
          sessionPhase={session.sessionPhase}
          bpm={session.stepState.bpm}
          isFallback={session.stepState.isFallback}
          visible={session.controlsVisible || session.sessionPhase !== "running"}
          startError={session.startError}
          onStart={session.handleStart}
          onStop={session.handleStop}
        />

        <MotionSimulatorPanel
          enabled={session.simulatorEnabled}
          bpm={session.simulatorBpm}
          onEnabledChange={session.setSimulatorEnabled}
          onBpmChange={session.setSimulatorBpm}
        />
      </Box>
    </Box>
  );
}
