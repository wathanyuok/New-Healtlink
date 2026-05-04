"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Stack,
  Avatar,
  Grid,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import { useUserStore } from "@/stores/userStore";
import { useAuthStore } from "@/stores/authStore";

interface UserProfile {
  id: string;
  prefix?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  position?: string;
  identifyNumber?: string;
  numberCallSign?: string;
  depOfMedicine?: string;
  phone?: string;
  username?: string;
  email?: string;
  avatar?: string;
  isActive?: boolean;
  permissionGroup?: {
    id: string;
    name: string;
    role?: {
      id: string;
      name: string;
    };
    zone?: {
      id: string;
      name: string;
    };
    hospital?: {
      id: string;
      name: string;
      type?: string;
    };
  };
}

const roleDisplay = (roleName?: string): string => {
  switch (roleName) {
    case "superAdmin":
      return "Super Admin";
    case "superAdminZone":
      return "Zone User";
    case "superAdminHospital":
      return "Hospital User";
    default:
      return roleName || "ไม่มีข้อมูล";
  }
};

export default function UserAccountReadPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const userStore = useUserStore();
  const authStore = useAuthStore();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await userStore.getDataUserById(userId);
        setUser(userData);
      } catch (err) {
        setError("ไม่สามารถโหลดข้อมูลผู้ใช้");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId, userStore]);

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    router.push(`/management/user-account/edit/${userId}`);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            p: 3,
            bgcolor: "#fee",
            border: "1px solid #fcc",
            borderRadius: 1,
            mb: 3,
          }}
        >
          <Typography color="error">{error || "ไม่พบข้อมูลผู้ใช้"}</Typography>
        </Box>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} variant="outlined">
          ย้อนกลับ
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Title Bar */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          variant="text"
          sx={{ minWidth: "auto" }}
        />
        <Typography variant="h5" fontWeight={600}>
          บัญชีเจ้าหน้าที่
        </Typography>
      </Stack>

      {/* Avatar Section */}
      <Box sx={{ mb: 4 }}>
        <Avatar
          src={user.avatar}
          alt={`${user.firstName} ${user.lastName}`}
          sx={{ width: 60, height: 60 }}
        />
      </Box>

      {/* Section 1: ข้อมูลเบื้องต้น */}
      <Paper sx={{ mb: 3, border: "1px solid #e5e7eb", borderRadius: 2 }}>
        {/* Green Gradient Header */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #c6f6d5, #e6fffa)",
            p: 2,
            borderBottomLeft: "1px solid #e5e7eb",
            borderBottomRight: "1px solid #e5e7eb",
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} color="#047857">
            ข้อมูลเบื้องต้น
          </Typography>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          {/* Row 1: Prefix, First Name, Middle Name, Last Name */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={1.5}>
              <Box>
                <Typography variant="body2" fontWeight={500} color="#6b7280" sx={{ mb: 0.5 }}>
                  คำนำหน้า
                </Typography>
                <Typography variant="body2">
                  {user.prefix || "—"}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2.5}>
              <Box>
                <Typography variant="body2" fontWeight={500} color="#6b7280" sx={{ mb: 0.5 }}>
                  ชื่อ
                </Typography>
                <Typography variant="body2">
                  {user.firstName || "—"}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2.5}>
              <Box>
                <Typography variant="body2" fontWeight={500} color="#6b7280" sx={{ mb: 0.5 }}>
                  ชื่อกลาง
                </Typography>
                <Typography variant="body2">
                  {user.middleName || "—"}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2.5}>
              <Box>
                <Typography variant="body2" fontWeight={500} color="#6b7280" sx={{ mb: 0.5 }}>
                  นามสกุล
                </Typography>
                <Typography variant="body2">
                  {user.lastName || "—"}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Row 2: Position, ID/License, Department, Phone */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography variant="body2" fontWeight={500} color="#6b7280" sx={{ mb: 0.5 }}>
                  ตำแหน่งเจ้าหน้าที่
                </Typography>
                <Typography variant="body2">
                  {user.position || "—"}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography variant="body2" fontWeight={500} color="#6b7280" sx={{ mb: 0.5 }}>
                  เลข ว./เลขใบประกอบวิชาชีพ
                </Typography>
                <Typography variant="body2">
                  {user.identifyNumber || user.numberCallSign || "—"}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography variant="body2" fontWeight={500} color="#6b7280" sx={{ mb: 0.5 }}>
                  ภาควิชาแพทย์
                </Typography>
                <Typography variant="body2">
                  {user.depOfMedicine || "—"}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography variant="body2" fontWeight={500} color="#6b7280" sx={{ mb: 0.5 }}>
                  เบอร์โทร
                </Typography>
                <Typography variant="body2">
                  {user.phone || "—"}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Row 3: Username, Email */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="body2" fontWeight={500} color="#6b7280" sx={{ mb: 0.5 }}>
                  Username
                </Typography>
                <Typography variant="body2">
                  {user.username || "—"}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="body2" fontWeight={500} color="#6b7280" sx={{ mb: 0.5 }}>
                  Email
                </Typography>
                <Typography variant="body2">
                  {user.email || "—"}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Section 2: ระดับบัญชี */}
      <Paper sx={{ mb: 3, border: "1px solid #e5e7eb", borderRadius: 2 }}>
        {/* Green Gradient Header */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #c6f6d5, #e6fffa)",
            p: 2,
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} color="#047857">
            ระดับบัญชี
          </Typography>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          <Typography variant="body2">
            {user.permissionGroup?.role?.name
              ? roleDisplay(user.permissionGroup.role.name)
              : "ไม่มีข้อมูล"}
          </Typography>
        </Box>
      </Paper>

      {/* Section 3: Conditional Hospital/Zone Information */}
      {user.permissionGroup?.zone || user.permissionGroup?.hospital ? (
        <>
          {/* Hospital Responsibility Section */}
          {(user.permissionGroup?.zone || user.permissionGroup?.hospital) && (
            <Paper sx={{ mb: 3, border: "1px solid #e5e7eb", borderRadius: 2 }}>
              {/* Green Gradient Header */}
              <Box
                sx={{
                  background: "linear-gradient(135deg, #c6f6d5, #e6fffa)",
                  p: 2,
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} color="#047857">
                  สถานพยาบาลที่รับผิดชอบ
                </Typography>
              </Box>

              {/* Content */}
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {user.permissionGroup?.zone && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          color="#6b7280"
                          sx={{ mb: 0.5 }}
                        >
                          โซนสถานพยาบาล
                        </Typography>
                        <Typography variant="body2">
                          {user.permissionGroup.zone.name || "—"}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  {user.permissionGroup?.hospital?.type && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          color="#6b7280"
                          sx={{ mb: 0.5 }}
                        >
                          ประเภทสถานพยาบาล
                        </Typography>
                        <Typography variant="body2">
                          {user.permissionGroup.hospital.type || "—"}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  {user.permissionGroup?.hospital && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          color="#6b7280"
                          sx={{ mb: 0.5 }}
                        >
                          สถานพยาบาล
                        </Typography>
                        <Typography variant="body2">
                          {user.permissionGroup.hospital.name || "—"}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Paper>
          )}

          {/* Permission Group Section */}
          {user.permissionGroup?.name && (
            <Paper sx={{ mb: 3, border: "1px solid #e5e7eb", borderRadius: 2 }}>
              {/* Green Gradient Header */}
              <Box
                sx={{
                  background: "linear-gradient(135deg, #c6f6d5, #e6fffa)",
                  p: 2,
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} color="#047857">
                  กลุ่มสิทธิ์การใช้งาน
                </Typography>
              </Box>

              {/* Content */}
              <Box sx={{ p: 3 }}>
                <Typography variant="body2">
                  {user.permissionGroup.name}
                </Typography>
              </Box>
            </Paper>
          )}
        </>
      ) : null}

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          ย้อนกลับ
        </Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={handleEdit}
          sx={{
            backgroundColor: "#fbbf24",
            color: "#1f2937",
            fontWeight: 600,
            "&:hover": {
              backgroundColor: "#f59e0b",
            },
          }}
        >
          แก้ไขข้อมูล
        </Button>
      </Stack>
    </Container>
  );
}
