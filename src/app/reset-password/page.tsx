"use client";
import React, { useState, useEffect, Suspense } from "react";
import {
  Box, Container, Card, TextField, Button, Typography, Alert,
  CircularProgress, Stack,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setError("Invalid reset link");
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) { setError("กรุณากรอกข้อมูลให้ครบ"); return; }
    if (password !== confirmPassword) { setError("รหัสผ่านไม่ตรงกัน"); return; }
    if (password.length < 6) { setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"); return; }
    try {
      setLoading(true); setError(null);
      await api.post("auth-service/auth/resetPassword", { token, newPassword: password });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch { setError("ไม่สามารถรีเซ็ตรหัสผ่านได้ ลิงก์อาจหมดอายุ"); } finally { setLoading(false); }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default" }}>
      <Container maxWidth="sm">
        <Card sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" mb={1}>รีเซ็ตรหัสผ่าน</Typography>
            <Typography variant="body2" color="textSecondary">กรุณากำหนดรหัสผ่านใหม่</Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>รีเซ็ตสำเร็จ กำลังไปหน้าเข้าสู่ระบบ...</Alert>}
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField label="รหัสผ่านใหม่" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth disabled={loading || success} />
              <TextField label="ยืนยันรหัสผ่านใหม่" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} fullWidth disabled={loading || success} />
              <Button type="submit" variant="contained" fullWidth disabled={loading || success}>
                {loading ? <CircularProgress size={24} /> : "รีเซ็ตรหัสผ่าน"}
              </Button>
              <Button variant="text" fullWidth onClick={() => router.push("/login")}>กลับไปเข้าสู่ระบบ</Button>
            </Stack>
          </form>
        </Card>
      </Container>
    </Box>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
