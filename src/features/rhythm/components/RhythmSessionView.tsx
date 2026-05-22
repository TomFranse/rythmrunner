import { Box, Container, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { MotionPermissionGate } from "@/features/rhythm/components/MotionPermissionGate";
import { MotionSimulatorPanel } from "@/features/rhythm/components/dev/MotionSimulatorPanel";
import { PulsingCircles } from "@/features/rhythm/components/PulsingCircles";
import { SessionControls } from "@/features/rhythm/components/SessionControls";
import { useRhythmSession } from "@/features/rhythm/hooks/useRhythmSession";

export function RhythmSessionView() {
  const theme = useTheme();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const session = useRhythmSession();

  return (
    <Container
      maxWidth="sm"
      onClick={session.revealControls}
      sx={{ py: theme.spacing(4), minHeight: "70vh" }}
    >
      <Typography variant="h4" component="h1" textAlign="center" gutterBottom>
        Rhythm Runner
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" paragraph>
        Music that follows your cadence
      </Typography>

      <MotionPermissionGate
        status={session.permissionStatus}
        onRequestPermission={session.handleRequestPermission}
      />

      <Box sx={{ my: theme.spacing(4) }}>
        <PulsingCircles
          layers={session.layerState}
          bpm={session.stepState.bpm}
          reducedMotion={reducedMotion}
        />
      </Box>

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
    </Container>
  );
}
