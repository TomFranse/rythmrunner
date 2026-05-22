import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@/shared/theme/theme";
import { MotionPermissionGate } from "./MotionPermissionGate";

function renderGate(status: "unknown" | "granted" | "denied" | "unsupported") {
  const onRequest = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <MotionPermissionGate status={status} onRequestPermission={onRequest} />
    </ThemeProvider>
  );
  return onRequest;
}

describe("MotionPermissionGate", () => {
  it("should render nothing when permission is granted", () => {
    renderGate("granted");
    expect(screen.queryByRole("button", { name: /enable motion/i })).toBeNull();
  });

  it("should show enable button when permission is unknown", () => {
    renderGate("unknown");
    expect(screen.getByRole("button", { name: /enable motion/i })).toBeInTheDocument();
  });

  it("should call handler when enable is clicked", async () => {
    const user = userEvent.setup();
    const onRequest = renderGate("unknown");
    await user.click(screen.getByRole("button", { name: /enable motion/i }));
    expect(onRequest).toHaveBeenCalled();
  });
});
