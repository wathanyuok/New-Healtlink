"use client";

import { Box } from "@mui/material";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/AuthGuard";
import { NAVBAR_HEIGHT, DRAWER_COLLAPSED } from "./Sidebar";

/**
 * Shared app layout used by all authenticated pages:
 * - Full-width Navbar at top (z-index: 1300)
 * - Sidebar: fixed, collapsed by default, expands on hover as overlay
 * - Main content to the right of collapsed sidebar
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        {/* Navbar: full-width fixed at top */}
        <Navbar />

        {/* Below Navbar: sidebar (fixed overlay) + content */}
        <Sidebar />
        <Box
          component="main"
          sx={{
            ml: `${DRAWER_COLLAPSED}px`,
            px: 3,
            pb: 3,
            pt: `calc(${NAVBAR_HEIGHT}px + 24px)`,
            height: "100vh",
            overflow: "auto",
            boxSizing: "border-box",
          }}
        >
          {children}
        </Box>
      </Box>
    </AuthGuard>
  );
}
