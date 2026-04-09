"use client";

import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";

interface LoadingOverlayProps {
  open: boolean;
  message?: string;
  /** Minimum time in ms the overlay stays visible once it opens.
   *  Prevents the overlay from flashing by too quickly to see. */
  minDuration?: number;
}

/**
 * Full-screen loading overlay with ECG heartbeat pulse animation,
 * matching the Nuxt version used across the app.
 *
 * Usage:
 *   <LoadingOverlay open={isLoading} />
 *   <LoadingOverlay open={isLoading} message="กำลังบันทึก..." />
 *   <LoadingOverlay open={isLoading} minDuration={2000} />
 */
export default function LoadingOverlay({
  open,
  message = "กำลังโหลดข้อมูล กรุณารอสักครู่",
  minDuration = 600,
}: LoadingOverlayProps) {
  // Keep overlay visible for at least `minDuration` ms after it opens,
  // so users can actually see the ECG animation.
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setVisible(true);
      return;
    }
    // When the caller closes it, hold visible until the min duration has elapsed.
    const t = setTimeout(() => setVisible(false), minDuration);
    return () => clearTimeout(t);
  }, [open, minDuration]);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes ecgPulse {
          0% { clip: rect(0, 0, 100px, 0); opacity: 0.4; }
          4% { clip: rect(0, 66.667px, 100px, 0); opacity: 0.6; }
          15% { clip: rect(0, 133.333px, 100px, 0); opacity: 0.8; }
          20% { clip: rect(0, 300px, 100px, 0); opacity: 1; }
          80% { clip: rect(0, 300px, 100px, 0); opacity: 0; }
          90% { opacity: 0; }
          100% { clip: rect(0, 300px, 100px, 0); opacity: 0; }
        }
      `}</style>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          bgcolor: "rgba(0, 0, 0, 0.7)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            height: 100,
            width: 200,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "block",
              background: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><polyline fill="none" stroke-width="3px" stroke="%232fd897" points="2.4,58.7 70.8,58.7 76.1,46.2 81.1,58.7 89.9,58.7 93.8,66.5 102.8,22.7 110.6,78.7 115.3,58.7 126.4,58.7 134.4,54.7 142.4,58.7 197.8,58.7"/></svg>') 0 0 no-repeat`,
              width: "100%",
              height: "100%",
              position: "absolute",
              animation: "ecgPulse 2s linear infinite",
              clip: "rect(0, 0, 100px, 0)",
            }}
          />
        </div>
        <Typography
          sx={{
            color: "#2fd897",
            fontSize: "1rem",
            mt: 1,
            fontFamily: "Sarabun, sans-serif",
          }}
        >
          {message}
        </Typography>
      </Box>
    </>
  );
}
