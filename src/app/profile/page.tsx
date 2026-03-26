"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  TextField,
  Button,
  Stack,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Divider,
} from "@mui/material";
import api from "@/lib/api";

interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  hospital?: string;
  role?: string;
  email?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("auth-service/user/profile");
      setProfile(response.data);
    } catch (err) {
      setError("Failed to fetch profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChangePassword = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setError("All password fields are required");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    try {
      setPasswordLoading(true);
      setError(null);
      await api.post("auth-service/auth/changePassword", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccess(true);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Failed to change password");
      console.error(err);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        โปรไฟล์ของฉัน
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          เปลี่ยนรหัสผ่านสำเร็จ
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
              ข้อมูลส่วนตัว
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  ชื่อผู้ใช้
                </Typography>
                <Typography variant="body1">{profile?.username}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="textSecondary">
                  ชื่อ-สกุล
                </Typography>
                <Typography variant="body1">{profile?.fullName}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="textSecondary">
                  อีเมล
                </Typography>
                <Typography variant="body1">{profile?.email}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="textSecondary">
                  โรงพยาบาล
                </Typography>
                <Typography variant="body1">{profile?.hospital}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="textSecondary">
                  บทบาท
                </Typography>
                <Typography variant="body1">{profile?.role}</Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Change Password */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
              เปลี่ยนรหัสผ่าน
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="รหัสผ่านปัจจุบัน"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                fullWidth
              />
              <TextField
                label="รหัสผ่านใหม่"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                fullWidth
              />
              <TextField
                label="ยืนยันรหัสผ่านใหม่"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                fullWidth
              />
              <Button
                variant="contained"
                onClick={handleChangePassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
