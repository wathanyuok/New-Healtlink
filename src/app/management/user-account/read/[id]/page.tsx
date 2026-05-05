"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import { useUserStore } from "@/stores/userStore";
import { useAuthStore } from "@/stores/authStore";

// ─── Constants ───────────────────────────────────────────────────────
const POSITION_OPTIONS = [
  { value: "DENTIST", name: "ทันตแพทย์" },
  { value: "DOCTOR", name: "แพทย์" },
  { value: "MEDICAL_TECH", name: "เทคนิคการแพทย์" },
  { value: "NURSE", name: "พยาบาล" },
  { value: "PHARMACIST", name: "เภสัชกร" },
  { value: "PHYSIO", name: "นักกายภาพบำบัด" },
  { value: "TRADITIONAL_MED", name: "แพทย์แผนไทย" },
  { value: "AUDITOR", name: "ผู้ตรวจสอบการเบิกจ่ายเงินของคนไข้" },
  { value: "GENERAL", name: "เจ้าหน้าที่ทั่วไป" },
];

function getPositionName(position?: string | null): string {
  if (!position) return "-";
  const found = POSITION_OPTIONS.find((item) => item.value === position);
  return found ? found.name : position;
}

// ─── Permission menu definitions (static, same as dataSetManagePermission.json) ─
interface MenuPermission {
  id: number;
  name: string;
  menu_name: string;
  active: Record<string, { id: number; active: boolean }>;
  firstPage: { value: number; name: string }[];
}

const DATA_PERMISSIONS: MenuPermission[] = [
  { id: 101, name: "dashboard_read", menu_name: "Dashboard", active: { Read: { id: 101, active: true } }, firstPage: [{ value: 101, name: "" }] },
  { id: 102, name: "followDelivery_read", menu_name: "ติดตามการส่งตัว", active: { Read: { id: 148, active: true } }, firstPage: [{ value: 102, name: "" }] },
  { id: 103, name: "createReferral_read", menu_name: "สร้างใบส่งตัว", active: { Read: { id: 149, active: true } }, firstPage: [{ value: 103, name: "" }] },
  { id: 104, name: "referOut_all_read", menu_name: "ส่งผู้ป่วยออก (Refer Out) - (Tab ทั้งหมด)", active: { Read: { id: 150, active: true } }, firstPage: [{ value: 104, name: "" }] },
  { id: 105, name: "referOut_opd_read", menu_name: "• ส่งผู้ป่วยออก OPD (Tab)", active: { Read: { id: 102, active: true }, Create: { id: 103, active: true }, Update: { id: 104, active: true } }, firstPage: [{ value: 105, name: "" }] },
  { id: 106, name: "referOut_er_read", menu_name: "• ส่งผู้ป่วยออก Emergency (Tab)", active: { Read: { id: 152, active: true }, Create: { id: 153, active: true }, Update: { id: 154, active: true } }, firstPage: [{ value: 106, name: "" }] },
  { id: 107, name: "referOut_ipd_read", menu_name: "• ส่งผู้ป่วยออก IPD (Tab)", active: { Read: { id: 155, active: true }, Create: { id: 156, active: true }, Update: { id: 157, active: true } }, firstPage: [{ value: 107, name: "" }] },
  { id: 108, name: "referIn_all_read", menu_name: "รับผู้ป่วยเข้า (Refer In) - (Tab ทั้งหมด)", active: { Read: { id: 158, active: true } }, firstPage: [{ value: 108, name: "" }] },
  { id: 109, name: "referIn_opd_read", menu_name: "• รับผู้ป่วยเข้า OPD  (Tab)", active: { Read: { id: 105, active: true }, Create: { id: 106, active: true }, Update: { id: 107, active: true } }, firstPage: [{ value: 109, name: "" }] },
  { id: 110, name: "referIn_er_read", menu_name: "• รับผู้ป่วยเข้า Emergency (Tab)", active: { Read: { id: 159, active: true }, Create: { id: 160, active: true }, Update: { id: 161, active: true } }, firstPage: [{ value: 110, name: "" }] },
  { id: 111, name: "referIn_ipd_read", menu_name: "• รับผู้ป่วยเข้า IPD (Tab)", active: { Read: { id: 162, active: true }, Create: { id: 163, active: true }, Update: { id: 164, active: true } }, firstPage: [{ value: 111, name: "" }] },
  { id: 112, name: "referBack_all_read", menu_name: "ส่งตัวกลับ (Refer Back) - (Tab ทั้งหมด)", active: { Read: { id: 165, active: true } }, firstPage: [{ value: 112, name: "" }] },
  { id: 113, name: "refeBack_opd_read", menu_name: "• ส่งตัวกลับ OPD  (Tab)", active: { Read: { id: 108, active: true }, Create: { id: 109, active: true }, Update: { id: 110, active: true } }, firstPage: [{ value: 113, name: "" }] },
  { id: 114, name: "referBack_er_read", menu_name: "• ส่งตัวกลับ Emergency (Tab)", active: { Read: { id: 166, active: true }, Create: { id: 167, active: true }, Update: { id: 168, active: true } }, firstPage: [{ value: 114, name: "" }] },
  { id: 115, name: "referBack_ipd_read", menu_name: "• ส่งตัวกลับ IPD (Tab)", active: { Read: { id: 169, active: true }, Create: { id: 170, active: true }, Update: { id: 171, active: true } }, firstPage: [{ value: 115, name: "" }] },
  { id: 116, name: "referReceive_all_read", menu_name: "รับตัวกลับ - (Tab ทั้งหมด)", active: { Read: { id: 172, active: true } }, firstPage: [{ value: 116, name: "" }] },
  { id: 117, name: "referReceive_opd_read", menu_name: "• รับตัวกลับ OPD (Tab)", active: { Read: { id: 179, active: true }, Create: { id: 180, active: true }, Update: { id: 181, active: true } }, firstPage: [{ value: 117, name: "" }] },
  { id: 118, name: "referReceive_er_read", menu_name: "• รับตัวกลับ Emergency (Tab)", active: { Read: { id: 173, active: true }, Create: { id: 174, active: true }, Update: { id: 175, active: true } }, firstPage: [{ value: 118, name: "" }] },
  { id: 119, name: "referReceive_ipd_read", menu_name: "• รับตัวกลับ IPD (Tab)", active: { Read: { id: 176, active: true }, Create: { id: 177, active: true }, Update: { id: 178, active: true } }, firstPage: [{ value: 119, name: "" }] },
  { id: 120, name: "referRequest_all_read", menu_name: "ร้องขอส่งตัว (Tab ทั้งหมด)", active: { Read: { id: 182, active: true } }, firstPage: [{ value: 120, name: "" }] },
  { id: 121, name: "referRequest_opd_read", menu_name: "• ร้องขอส่งตัว OPD (Tab)", active: { Read: { id: 111, active: true }, Create: { id: 112, active: true }, Update: { id: 113, active: true } }, firstPage: [{ value: 121, name: "" }] },
  { id: 122, name: "word_referRequest_all_read", menu_name: "คำขอส่งตัว (Tab ทั้งหมด)", active: { Read: { id: 183, active: true } }, firstPage: [{ value: 122, name: "" }] },
  { id: 123, name: "word_referRequest_opd_read", menu_name: "• คำขอส่งตัว OPD (Tab)", active: { Read: { id: 114, active: true }, Create: { id: 115, active: true }, Update: { id: 116, active: true } }, firstPage: [{ value: 123, name: "" }] },
  { id: 124, name: "view_treatment_history", menu_name: "ประวัติการเข้าดูข้อมูลผู้ป่วย", active: { Read: { id: 117, active: true } }, firstPage: [{ value: 124, name: "" }] },
  { id: 125, name: "loginHistory_read", menu_name: "ประวัติการเข้าใช้งานระบบ", active: { Read: { id: 118, active: true } }, firstPage: [{ value: 125, name: "" }] },
  { id: 126, name: "permissionGroup_read", menu_name: "จัดการกลุ่มสิทธิ์", active: { Read: { id: 184, active: true }, Create: { id: 185, active: true }, Update: { id: 186, active: true }, Delete: { id: 187, active: true } }, firstPage: [{ value: 126, name: "" }] },
  { id: 127, name: "user_read", menu_name: "จัดการบัญชีผู้ใช้งาน", active: { Read: { id: 122, active: true }, Create: { id: 123, active: true }, Update: { id: 124, active: true }, Delete: { id: 125, active: true } }, firstPage: [{ value: 127, name: "" }] },
  { id: 128, name: "settingHospital_read", menu_name: "ตั้งค่าสถานพยาบาล", active: { Read: { id: 127, active: true }, Create: { id: 128, active: true }, Update: { id: 129, active: true }, Delete: { id: 130, active: true } }, firstPage: [{ value: 128, name: "" }] },
  { id: 129, name: "settingZoneType_read", menu_name: "• ปุ่มจัดการประเภทและโซนสถานพยาบาล", active: { Read: { id: 131, active: true }, Create: { id: 132, active: true }, Update: { id: 133, active: true }, Delete: { id: 134, active: true } }, firstPage: [{ value: 129, name: "" }] },
  { id: 130, name: "settingReferPoint_read", menu_name: "จุดรับ-ส่งตัวผู้ป่วย", active: { Read: { id: 135, active: true }, Create: { id: 136, active: true }, Update: { id: 137, active: true }, Delete: { id: 138, active: true } }, firstPage: [{ value: 130, name: "" }] },
  { id: 131, name: "doctorBranch_read", menu_name: "สาขา/แผนกที่ส่งต่อ", active: { Read: { id: 139, active: true }, Create: { id: 140, active: true }, Update: { id: 141, active: true }, Delete: { id: 142, active: true } }, firstPage: [{ value: 131, name: "" }] },
  { id: 132, name: "settingDefault_read", menu_name: "ตั้งค่าเริ่มต้น (Default)", active: { Read: { id: 192, active: true }, Create: { id: 193, active: true }, Update: { id: 194, active: true }, Delete: { id: 195, active: true } }, firstPage: [{ value: 132, name: "" }] },
  { id: 133, name: "referStatusDetail_read", menu_name: "เหตุผล", active: { Read: { id: 196, active: true }, Create: { id: 197, active: true }, Update: { id: 198, active: true }, Delete: { id: 199, active: true } }, firstPage: [{ value: 133, name: "" }] },
  { id: 134, name: "referCause_create", menu_name: "สาเหตุ", active: { Read: { id: 143, active: true }, Create: { id: 144, active: true }, Update: { id: 145, active: true }, Delete: { id: 146, active: true } }, firstPage: [{ value: 134, name: "" }] },
];

// Highlight rows (parent menu items)
const HIGHLIGHT_MENUS = [
  "Dashboard", "ติดตามการส่งตัว", "สร้างใบส่งตัว",
  "ส่งผู้ป่วยออก (Refer Out) - (Tab ทั้งหมด)",
  "รับผู้ป่วยเข้า (Refer In) - (Tab ทั้งหมด)",
  "ส่งตัวกลับ (Refer Back) - (Tab ทั้งหมด)",
  "รับตัวกลับ - (Tab ทั้งหมด)",
  "ร้องขอส่งตัว (Tab ทั้งหมด)",
  "คำขอส่งตัว (Tab ทั้งหมด)",
  "ประวัติการเข้าดูข้อมูลผู้ป่วย", "ประวัติการเข้าใช้งานระบบ",
  "จัดการกลุ่มสิทธิ์", "จัดการบัญชีผู้ใช้งาน",
  "ตั้งค่าสถานพยาบาล", "จุดรับ-ส่งตัวผู้ป่วย", "สาขา/แผนกที่ส่งต่อ",
  "ตั้งค่าเริ่มต้น (Default)", "สาเหตุ", "เหตุผล",
];

// ─── Styles ──────────────────────────────────────────────────────────
const greenGradientSx = {
  background: "linear-gradient(135deg, #c6f6d5, #e6fffa)",
  px: 2,
  py: 1.5,
};

const sectionBorderSx = {
  border: "1px solid #e5e7eb",
  borderRadius: 1,
  overflow: "hidden",
};

const labelSx = {
  color: "#9ca3af",
  fontSize: "14px",
  fontWeight: 500,
  mb: 0.5,
};

const valueSx = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#111827",
  ml: 2,
  mt: 1,
};

// ─── Component ───────────────────────────────────────────────────────
export default function UserAccountReadPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const userStore = useUserStore();
  const authStore = useAuthStore();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<any[]>([]);

  // Get logged-in user's role for determining which section layout to show
  const loggedInProfile = authStore.profile;
  const viewerRoleName = loggedInProfile?.permissionGroup?.role?.name;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await userStore.getDataUserById(userId);
        // Extract .user from API response (same fix as edit page)
        const userData = res?.user || res?.data?.user || res?.data || res;
        console.log("[Read] User data:", userData);
        setUser(userData);

        // Extract permissions from mapPermissions
        if (userData?.permissionGroup?.mapPermissions) {
          const perms = userData.permissionGroup.mapPermissions.map(
            (p: any) => p.permission
          );
          setUserPermissions(perms);
        }
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
  }, [userId]);

  // Check if user has a specific permission by matching permission IDs
  const hasPermission = (menuItem: MenuPermission, type: string): boolean => {
    const permId = menuItem.active?.[type]?.id;
    if (!permId) return false;
    return userPermissions.some((p: any) => p.id === permId);
  };

  // Filter menus based on viewer role (same logic as Nuxt filteredMenuPermissions)
  const filteredMenus = useMemo(() => {
    // All roles currently show all menus in read view
    return DATA_PERMISSIONS;
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    router.push(`/management/user-account/edit/${userId}?permissions=true`);
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await userStore.deleteUser(Number(userId));
      setDeleteDialogOpen(false);
      setSnackbar({
        open: true,
        message: "ลบบัญชีผู้ใช้สำเร็จ",
        severity: "success",
      });
      // Navigate back to user account list after short delay
      setTimeout(() => {
        router.push("/management/user-account");
      }, 1000);
    } catch (err) {
      console.error("Delete user error:", err);
      setDeleteDialogOpen(false);
      setSnackbar({
        open: true,
        message: "ไม่สามารถลบข้อมูลได้",
        severity: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Box>
        <Box sx={{ p: 3, bgcolor: "#fee", border: "1px solid #fcc", borderRadius: 1, mb: 3 }}>
          <Typography color="error">{error || "ไม่พบข้อมูลผู้ใช้"}</Typography>
        </Box>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} variant="outlined">
          ย้อนกลับ
        </Button>
      </Box>
    );
  }

  // Build full name
  const fullName = user.middleName
    ? `${user.firstName || "-"} ${user.middleName || "-"} ${user.lastName || "-"}`
    : `${user.firstName || "-"} ${user.lastName || "-"}`;

  const roleName = user.permissionGroup?.role?.name;
  const zoneName = user.permissionGroup?.zone?.name;
  const typeName =
    user.permissionGroup?.subType?.name ||
    user.permissionGroup?.hospital?.subType?.name;
  const hospitalName = user.permissionGroup?.hospital?.name;
  const groupName = user.permissionGroup?.name;

  // Determine if we show side-by-side or single card
  const showHospitalSection =
    viewerRoleName === "superAdmin" || viewerRoleName === "superAdminZone";
  const showGroupOnlySection = viewerRoleName === "superAdminHospital";

  return (
    <Box>
      {/* Title Bar */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <Button
          onClick={handleBack}
          sx={{
            minWidth: 40,
            width: 40,
            height: 40,
            borderRadius: 1,
            border: "1px solid #e5e7eb",
            color: "#111827",
          }}
        >
          <ArrowBackIcon fontSize="small" />
        </Button>
        <Typography variant="h6" fontWeight={600} color="#047857">
          บัญชีเจ้าหน้าที่
        </Typography>
      </Box>

      {/* Main Panel: Avatar LEFT + Data RIGHT */}
      <Box
        sx={{
          bgcolor: "white",
          borderRadius: 2,
          border: "1px solid #e5e7eb",
          p: 2,
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
          {/* Avatar */}
          <Box
            sx={{
              width: 240,
              height: 240,
              minWidth: 240,
              borderRadius: 2,
              overflow: "hidden",
              bgcolor: "#1f2937",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: user.avatar ? "4px solid white" : "1px solid #d1d5db",
            }}
          >
            {user.avatar ? (
              <Box
                component="img"
                src={user.avatar}
                alt="Avatar"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <Box
                component="img"
                src="/images/userPlaceholder2.jpg"
                alt="Preview"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                onError={(e: any) => {
                  e.target.style.display = "none";
                }}
              />
            )}
          </Box>

          {/* Data sections */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Section 1: ข้อมูลเบื้องต้น */}
            <Box sx={sectionBorderSx}>
              <Box sx={greenGradientSx}>
                <Typography sx={{ fontSize: "18px", fontWeight: 600, color: "#047857" }}>
                  ข้อมูลเบื้องต้น
                </Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                {/* Row 1: ชื่อ - นามสกุล */}
                <Box sx={{ mb: 2 }}>
                  <Typography sx={labelSx}>ชื่อ - นามสกุล</Typography>
                  <Typography sx={valueSx}>{fullName}</Typography>
                </Box>

                {/* Row 2: ประเภทเจ้าหน้าที่ / เลข ว. / ภาควิชาแพทย์. / เบอร์โทร */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr 1fr 1fr" },
                    gap: 2,
                    mb: 2,
                    mt: 2,
                  }}
                >
                  <Box>
                    <Typography sx={labelSx}>ประเภทเจ้าหน้าที่</Typography>
                    <Typography sx={valueSx}>
                      {getPositionName(user.position)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={labelSx}>เลข ว./เลขใบประกอบวิชาชีพ</Typography>
                    <Typography sx={valueSx}>
                      {user.identifyNumber || "-"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={labelSx}>ภาควิชาแพทย์.</Typography>
                    <Typography sx={valueSx}>
                      {user.department || user.depOfMedicine || "-"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={labelSx}>เบอร์โทร</Typography>
                    <Typography sx={valueSx}>{user.phone || "-"}</Typography>
                  </Box>
                </Box>

                {/* Row 3: ชื่อผู้ใช้ / Email */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
                    gap: 2,
                    mt: 2,
                  }}
                >
                  <Box>
                    <Typography sx={labelSx}>ชื่อผู้ใช้</Typography>
                    <Typography sx={valueSx}>{user.username || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={labelSx}>Email</Typography>
                    <Typography sx={valueSx}>{user.email || "-"}</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Section 2: ระดับบัญชี */}
            <Box sx={sectionBorderSx}>
              <Box sx={greenGradientSx}>
                <Typography sx={{ fontSize: "18px", fontWeight: 600, color: "#047857" }}>
                  ระดับบัญชี
                </Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                <Typography sx={labelSx}>ระดับบัญชี</Typography>
                <Typography sx={valueSx}>{roleName || "-"}</Typography>
              </Box>
            </Box>

            {/* Section 3: Admin sections (side-by-side or single) */}
            {showHospitalSection && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
                  gap: 2,
                }}
              >
                {/* สถานพยาบาลที่รับผิดชอบ */}
                <Box sx={sectionBorderSx}>
                  <Box sx={greenGradientSx}>
                    <Typography sx={{ fontSize: "18px", fontWeight: 600, color: "#047857" }}>
                      สถานพยาบาลที่รับผิดชอบ
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography sx={labelSx}>โซนสถานพยาบาล</Typography>
                        <Typography sx={{ ...valueSx, fontSize: "14px" }}>
                          {zoneName || "-"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={labelSx}>ประเภทสถานพยาบาล</Typography>
                        <Typography sx={valueSx}>{typeName || "-"}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={labelSx}>สถานพยาบาล</Typography>
                        <Typography sx={{ ...valueSx, fontSize: "14px" }}>
                          {hospitalName || "-"}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* กลุ่มสิทธิ์การใช้งาน */}
                <Box sx={sectionBorderSx}>
                  <Box sx={greenGradientSx}>
                    <Typography sx={{ fontSize: "18px", fontWeight: 600, color: "#047857" }}>
                      กลุ่มสิทธิ์การใช้งาน
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Typography sx={labelSx}>กลุ่มสิทธิ์การใช้งาน</Typography>
                    <Typography sx={valueSx}>
                      {groupName || "ไม่มีกลุ่มสิทธิ์การใช้งาน"}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {showGroupOnlySection && (
              <Box sx={sectionBorderSx}>
                <Box sx={greenGradientSx}>
                  <Typography sx={{ fontSize: "18px", fontWeight: 600, color: "#047857" }}>
                    กลุ่มสิทธิ์การใช้งาน
                  </Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                  <Typography sx={labelSx}>กลุ่มสิทธิ์การใช้งาน</Typography>
                  <Typography sx={valueSx}>
                    {groupName || "ไม่มีกลุ่มสิทธิ์การใช้งาน"}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Fallback: if viewer role is not recognized, show both sections */}
            {!showHospitalSection && !showGroupOnlySection && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <Box sx={sectionBorderSx}>
                  <Box sx={greenGradientSx}>
                    <Typography sx={{ fontSize: "18px", fontWeight: 600, color: "#047857" }}>
                      สถานพยาบาลที่รับผิดชอบ
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography sx={labelSx}>โซนสถานพยาบาล</Typography>
                        <Typography sx={{ ...valueSx, fontSize: "14px" }}>
                          {zoneName || "-"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={labelSx}>ประเภทสถานพยาบาล</Typography>
                        <Typography sx={valueSx}>{typeName || "-"}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={labelSx}>สถานพยาบาล</Typography>
                        <Typography sx={{ ...valueSx, fontSize: "14px" }}>
                          {hospitalName || "-"}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <Box sx={sectionBorderSx}>
                  <Box sx={greenGradientSx}>
                    <Typography sx={{ fontSize: "18px", fontWeight: 600, color: "#047857" }}>
                      กลุ่มสิทธิ์การใช้งาน
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Typography sx={labelSx}>กลุ่มสิทธิ์การใช้งาน</Typography>
                    <Typography sx={valueSx}>
                      {groupName || "ไม่มีกลุ่มสิทธิ์การใช้งาน"}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Section 4: ข้อมูลสิทธิ์การเข้าถึง */}
            <Box sx={sectionBorderSx}>
              <Box sx={greenGradientSx}>
                <Typography sx={{ fontSize: "18px", fontWeight: 600, color: "#047857" }}>
                  ข้อมูลสิทธ์การเข้าถึง
                </Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                <TableContainer>
                  <Table size="small" sx={{ border: "1px solid #e5e7eb" }}>
                    <TableHead>
                      <TableRow
                        sx={{
                          bgcolor: "#1f5c45",
                          "& th": {
                            color: "white",
                            fontWeight: 600,
                            fontSize: "14px",
                            borderRight: "1px solid rgba(255,255,255,0.2)",
                            py: 1.5,
                          },
                        }}
                      >
                        <TableCell sx={{ width: "40%" }}>เมนูที่เข้าถึงได้</TableCell>
                        <TableCell align="center" sx={{ width: "12%" }}>หน้าแรก</TableCell>
                        <TableCell align="center" sx={{ width: "12%" }}>Read</TableCell>
                        <TableCell align="center" sx={{ width: "12%" }}>Create</TableCell>
                        <TableCell align="center" sx={{ width: "12%" }}>Update</TableCell>
                        <TableCell align="center" sx={{ width: "12%" }}>Delete</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredMenus.map((menu) => {
                        const isHighlight = HIGHLIGHT_MENUS.includes(menu.menu_name);
                        return (
                          <TableRow
                            key={menu.id}
                            sx={{
                              bgcolor: isHighlight ? "#f0fdf4" : "white",
                              "&:hover": { bgcolor: "#f0fdf4" },
                              "& td": {
                                borderRight: "1px solid #e5e7eb",
                                borderBottom: "1px solid #e5e7eb",
                                py: 1,
                                fontSize: "14px",
                              },
                            }}
                          >
                            <TableCell>{menu.menu_name}</TableCell>
                            <TableCell align="center">
                              {/* หน้าแรก column - empty for now */}
                            </TableCell>
                            {["Read", "Create", "Update", "Delete"].map((type) => (
                              <TableCell key={type} align="center">
                                {menu.active[type] !== undefined && hasPermission(menu, type) && (
                                  <CheckCircleIcon
                                    sx={{ color: "#4ade80", fontSize: 24 }}
                                  />
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>

            {/* Action Buttons — matching Nuxt: ลบบัญชีผู้ใช้ (red) + แก้ไขข้อมูล (yellow) */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="contained"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
                sx={{
                  backgroundColor: "#ef4444",
                  color: "white",
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                  py: 1,
                  "&:hover": {
                    backgroundColor: "#dc2626",
                  },
                }}
              >
                ลบบัญชีผู้ใช้
              </Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                sx={{
                  backgroundColor: "#fbbf24",
                  color: "#334155",
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                  py: 1,
                  "&:hover": {
                    backgroundColor: "#f59e0b",
                  },
                }}
              >
                แก้ไขข้อมูล
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* ─── Delete Confirmation Dialog (matching Nuxt) ─── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 500, overflow: "hidden" },
        }}
      >
        {/* Red header — matching Nuxt variant="delete" */}
        <DialogTitle
          sx={{
            bgcolor: "#ef4444",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 1.5,
            px: 2,
          }}
        >
          <Typography fontWeight={600} fontSize="16px" color="white">
            ยืนยันการดำเนินการนี้
          </Typography>
          <IconButton
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            sx={{ color: "white" }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ py: 3, px: 3, mt: 1 }}>
          <Typography fontSize="16px">
            ต้องการลบ &quot;{user?.username}&quot; หรือไม่
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            variant="outlined"
            sx={{
              color: "#374151",
              borderColor: "#d1d5db",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              px: 3,
              "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" },
            }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            variant="contained"
            sx={{
              bgcolor: "#ef4444",
              color: "white",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              px: 3,
              "&:hover": { bgcolor: "#dc2626" },
            }}
          >
            {deleting ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              "ยืนยัน"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Snackbar for success/error feedback ─── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
