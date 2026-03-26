"use client";
import React, { useState } from "react";
import {
  Box,
  Container,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
} from "@mui/material";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.post("auth-service/auth/forgotPassword", { email });
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError("Failed to send reset link. Please check your email and try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: "bold" }}>
              ลืมรหัสผ่าน
            </Typography>
            <Typography variant="body2" color="textSecondary">
              กรุณาใส่อีเมลของคุณ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ส่งอีเมลรีเซ็ตรหัสผ่านสำเร็จ กรุณาตรวจสอบกล่องจดหมาย
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="อีเมล"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                disabled={loading || success}
                placeholder="example@email.com"
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading || success}
              >
                {loading ? <CircularProgress size={24} /> : "ส่งลิงก์รีเซ็ต"}
              </Button>
              <Button
                variant="text"
                fullWidth
                onClick={() => router.push("/login")}
              >
                กลับไปเข้าสู่ระบบ
              </Button>
            </Stack>
          </form>
        </Card>
      </Container>
    </Box>
  );
}
