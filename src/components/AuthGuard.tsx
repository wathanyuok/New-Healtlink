"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { useAuthStore } from "@/stores/authStore";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { getProfile } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Only access localStorage on the client
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    getProfile()
      .catch(() => {
        // Profile fetch failed, but still let user see dashboard
        console.warn("Profile fetch failed");
      })
      .finally(() => setReady(true));
  }, [getProfile, router]);

  if (!ready) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}
