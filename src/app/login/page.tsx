"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, getProfile, loading } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(username, password);
      await getProfile();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "เข้าสู่ระบบไม่สำเร็จ");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #46bee8 0%, #24d89d 100%)",
      }}
    >
      <Paper sx={{ p: 4, width: 400, maxWidth: "90vw", borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 1, color: "#036245", textAlign: "center" }}>
          ระบบเชื่อมโยงข้อมูลสุขภาพ
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: "center" }}>
          กรุณาเข้าสู่ระบบ
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="ชื่อผู้ใช้"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            sx={{ mb: 2 }}
            size="small"
          />
          <TextField
            fullWidth
            label="รหัสผ่าน"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{ mb: 3 }}
            size="small"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.2,
              background: "linear-gradient(90deg, #46bee8 0%, #24d89d 100%)",
              fontWeight: 600,
              fontSize: 16,
              "&:hover": {
                background: "linear-gradient(90deg, #3aa8d4 0%, #1fc48d 100%)",
              },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "เข้าสู่ระบบ"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
