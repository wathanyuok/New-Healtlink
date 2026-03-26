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
            pt: `${NAVBAR_HEIGHT}px`,
            p: 3,
            paddingTop: `calc(${NAVBAR_HEIGHT}px + 24px)`,
            minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
            overflow: "auto",
          }}
        >
          {children}
        </Box>
      </Box>
    </AuthGuard>
  );
}
