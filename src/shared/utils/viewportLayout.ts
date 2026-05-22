import type { SxProps, Theme } from "@mui/material/styles";

/** Dynamic viewport height with static fallback for older browsers. */
export const APP_VIEWPORT_HEIGHT = "100dvh";

export const viewportRootSx: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  minHeight: APP_VIEWPORT_HEIGHT,
  height: APP_VIEWPORT_HEIGHT,
  width: "100%",
  overflow: "hidden",
};

export const viewportMainSx = (toolbarHeight: number | string): SxProps<Theme> => ({
  flex: 1,
  minHeight: 0,
  width: "100%",
  display: "flex",
  flexDirection: "column",
  pt: typeof toolbarHeight === "number" ? `${toolbarHeight}px` : toolbarHeight,
  overflowX: "hidden",
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
});

export const viewportPageSx: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  width: "100%",
  maxWidth: "sm",
  mx: "auto",
  px: { xs: 2, sm: 3 },
  py: { xs: 2, sm: 3 },
  boxSizing: "border-box",
  "@media (max-height: 500px)": {
    py: 1,
    "& h1": {
      fontSize: "1.5rem",
      mb: 0.5,
    },
    "& p": {
      mb: 1,
    },
  },
};

export const viewportFlexibleRegionSx: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

/** Square visual area that scales with both width and height. */
export const pulsingCirclesViewportSx: SxProps<Theme> = {
  position: "relative",
  width: "min(85vw, 45dvh, 360px)",
  height: "min(85vw, 45dvh, 360px)",
  maxWidth: "100%",
  maxHeight: "100%",
  flexShrink: 0,
  "@media (max-height: 500px)": {
    width: "min(70vw, 38dvh, 280px)",
    height: "min(70vw, 38dvh, 280px)",
  },
};
