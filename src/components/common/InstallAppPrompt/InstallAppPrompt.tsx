import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Alert, Box, Button, IconButton, Typography } from "@mui/material";
import { usePwaInstall } from "@shared/hooks/usePwaInstall";

export function InstallAppPrompt() {
  const { mode, canInstall, install, dismiss } = usePwaInstall();

  if (mode === "none") {
    return null;
  }

  const isIos = mode === "ios";

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.snackbar,
        px: 2,
        pt: "max(12px, env(safe-area-inset-top))",
        pointerEvents: "none",
      }}
    >
      <Alert
        severity="info"
        icon={isIos ? <IosShareRoundedIcon /> : <DownloadRoundedIcon />}
        action={
          <IconButton
            aria-label="Dismiss install prompt"
            color="inherit"
            size="small"
            onClick={dismiss}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        }
        sx={{
          pointerEvents: "auto",
          alignItems: "flex-start",
          boxShadow: 4,
        }}
      >
        <Typography variant="subtitle2" component="p" gutterBottom>
          Install Rhythm Runner
        </Typography>
        {isIos ? (
          <Typography variant="body2">
            Tap Share, then <strong>Add to Home Screen</strong> to open the app like a native app.
          </Typography>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Add this app to your home screen for quick access while you run.
            </Typography>
            <Button
              type="button"
              variant="contained"
              size="small"
              disabled={!canInstall}
              onClick={() => void install()}
            >
              Install app
            </Button>
          </>
        )}
      </Alert>
    </Box>
  );
}
