import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import { QueryProvider } from "@shared/context/QueryProvider";
import { viewportMainSx, viewportRootSx } from "@shared/utils/viewportLayout";
import { MainLayout } from "@/layouts/MainLayout/MainLayout";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { QueryErrorBoundary } from "@/components/common/QueryErrorBoundary";

const HomePage = lazy(() => import("@pages/HomePage").then((m) => ({ default: m.HomePage })));

function AppContent() {
  return (
    <Box sx={viewportRootSx}>
      <Box component="main" sx={viewportMainSx(0)}>
        <QueryErrorBoundary>
          <Suspense fallback={<PageLoadingState />}>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </QueryErrorBoundary>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryProvider>
  );
}

export default App;
