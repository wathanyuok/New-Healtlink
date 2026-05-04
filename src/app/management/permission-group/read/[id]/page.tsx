"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  IconButton,
  CircularProgress,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import HomeIcon from "@mui/icons-material/Home";

/* ── Inline SVG icons matching Nuxt base-check-permission ── */
const CheckCircleFillIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <g fill="none">
      <path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
      <path fill="currentColor" d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2m3.535 6.381l-4.95 4.95l-2.12-2.121a1 1 0 0 0-1.415 1.414l2.758 2.758a1.1 1.1 0 0 0 1.556 0l5.586-5.586a1 1 0 0 0-1.415-1.415" />
    </g>
  </svg>
);

const XCircleFillIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256">
    <path fill="currentColor" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m37.66 130.34a8 8 0 0 1-11.32 11.32L128 139.31l-26.34 26.35a8 8 0 0 1-11.32-11.32L116.69 128l-26.35-26.34a8 8 0 0 1 11.32-11.32L128 116.69l26.34-26.35a8 8 0 0 1 11.32 11.32L139.31 128Z" />
  </svg>
);
import { useRouter, useParams } from "next/navigation";
import { usePermissionStore } from "@/stores/permissionStore";

/* ── Permission data (static, same as Nuxt dataSetManagePermission.json) ── */
const PERMISSION_DATA: any[] = [
  { id: 101, name: "dashboard_read", menu_name: "Dashboard", active: { Read: { id: 101, active: false } }, firstPage: [{ value: 101 }] },
  { id: 102, name: "followDelivery_read", menu_name: "ติดตามการส่งตัว", active: { Read: { id: 148, active: false } }, firstPage: [{ value: 102 }] },
  { id: 103, name: "createReferral_read", menu_name: "สร้างใบส่งตัว", active: { Read: { id: 149, active: false } }, firstPage: [{ value: 103 }] },
  { id: 104, name: "referOut_all_read", menu_name: "ส่งผู้ป่วยออก (Refer Out) - (Tab ทั้งหมด)", active: { Read: { id: 150, active: false } }, firstPage: [{ value: 104 }] },
  { id: 105, name: "referOut_opd_read", menu_name: "• ส่งผู้ป่วยออก OPD (Tab)", active: { Read: { id: 102, active: false }, Create: { id: 103, active: false }, Update: { id: 104, active: false } }, firstPage: [{ value: 105 }] },
  { id: 106, name: "referOut_er_read", menu_name: "• ส่งผู้ป่วยออก Emergency (Tab)", active: { Read: { id: 152, active: false }, Create: { id: 153, active: false }, Update: { id: 154, active: false } }, firstPage: [{ value: 106 }] },
  { id: 107, name: "referOut_ipd_read", menu_name: "• ส่งผู้ป่วยออก IPD (Tab)", active: { Read: { id: 155, active: false }, Create: { id: 156, active: false }, Update: { id: 157, active: false } }, firstPage: [{ value: 107 }] },
  { id: 108, name: "referIn_all_read", menu_name: "รับผู้ป่วยเข้า (Refer In) - (Tab ทั้งหมด)", active: { Read: { id: 158, active: false } }, firstPage: [{ value: 108 }] },
  { id: 109, name: "referIn_opd_read", menu_name: "• รับผู้ป่วยเข้า OPD  (Tab)", active: { Read: { id: 105, active: false }, Create: { id: 106, active: false }, Update: { id: 107, active: false } }, firstPage: [{ value: 109 }] },
  { id: 110, name: "referIn_er_read", menu_name: "• รับผู้ป่วยเข้า Emergency (Tab)", active: { Read: { id: 159, active: false }, Create: { id: 160, active: false }, Update: { id: 161, active: false } }, firstPage: [{ value: 110 }] },
  { id: 111, name: "referIn_ipd_read", menu_name: "• รับผู้ป่วยเข้า IPD (Tab)", active: { Read: { id: 162, active: false }, Create: { id: 163, active: false }, Update: { id: 164, active: false } }, firstPage: [{ value: 111 }] },
  { id: 112, name: "referBack_all_read", menu_name: "ส่งตัวกลับ (Refer Back) - (Tab ทั้งหมด)", active: { Read: { id: 165, active: false } }, firstPage: [{ value: 112 }] },
  { id: 113, name: "refeBack_opd_read", menu_name: "• ส่งตัวกลับ OPD  (Tab)", active: { Read: { id: 108, active: false }, Create: { id: 109, active: false }, Update: { id: 110, active: false } }, firstPage: [{ value: 113 }] },
  { id: 114, name: "referBack_er_read", menu_name: "• ส่งตัวกลับ Emergency (Tab)", active: { Read: { id: 166, active: false }, Create: { id: 167, active: false }, Update: { id: 168, active: false } }, firstPage: [{ value: 114 }] },
  { id: 115, name: "referBack_ipd_read", menu_name: "• ส่งตัวกลับ IPD (Tab)", active: { Read: { id: 169, active: false }, Create: { id: 170, active: false }, Update: { id: 171, active: false } }, firstPage: [{ value: 115 }] },
  { id: 116, name: "referReceive_all_read", menu_name: "รับตัวกลับ - (Tab ทั้งหมด)", active: { Read: { id: 172, active: false } }, firstPage: [{ value: 116 }] },
  { id: 117, name: "referReceive_opd_read", menu_name: "• รับตัวกลับ OPD (Tab)", active: { Read: { id: 179, active: false }, Create: { id: 180, active: false }, Update: { id: 181, active: false } }, firstPage: [{ value: 117 }] },
  { id: 118, name: "referReceive_er_read", menu_name: "• รับตัวกลับ Emergency (Tab)", active: { Read: { id: 173, active: false }, Create: { id: 174, active: false }, Update: { id: 175, active: false } }, firstPage: [{ value: 118 }] },
  { id: 119, name: "referReceive_ipd_read", menu_name: "• รับตัวกลับ IPD (Tab)", active: { Read: { id: 176, active: false }, Create: { id: 177, active: false }, Update: { id: 178, active: false } }, firstPage: [{ value: 119 }] },
  { id: 120, name: "referRequest_all_read", menu_name: "ร้องขอส่งตัว (Tab ทั้งหมด)", active: { Read: { id: 182, active: false } }, firstPage: [{ value: 120 }] },
  { id: 121, name: "referRequest_opd_read", menu_name: "• ร้องขอส่งตัว OPD (Tab)", active: { Read: { id: 111, active: false }, Create: { id: 112, active: false }, Update: { id: 113, active: false } }, firstPage: [{ value: 121 }] },
  { id: 122, name: "word_referRequest_all_read", menu_name: "คำขอส่งตัว (Tab ทั้งหมด)", active: { Read: { id: 183, active: false } }, firstPage: [{ value: 122 }] },
  { id: 123, name: "word_referRequest_opd_read", menu_name: "• คำขอส่งตัว OPD (Tab)", active: { Read: { id: 114, active: false }, Create: { id: 115, active: false }, Update: { id: 116, active: false } }, firstPage: [{ value: 123 }] },
  { id: 124, name: "view_treatment_history", menu_name: "ประวัติการเข้าดูข้อมูลผู้ป่วย", active: { Read: { id: 117, active: false } }, firstPage: [{ value: 124 }] },
  { id: 125, name: "loginHistory_read", menu_name: "ประวัติการเข้าใช้งานระบบ", active: { Read: { id: 118, active: false } }, firstPage: [{ value: 125 }] },
  { id: 126, name: "permissionGroup_read", menu_name: "จัดการกลุ่มสิทธิ์", active: { Read: { id: 184, active: false }, Create: { id: 185, active: false }, Update: { id: 186, active: false }, Delete: { id: 187, active: false } }, firstPage: [{ value: 126 }] },
  { id: 127, name: "user_read", menu_name: "จัดการบัญชีผู้ใช้งาน", active: { Read: { id: 122, active: false }, Create: { id: 123, active: false }, Update: { id: 124, active: false }, Delete: { id: 125, active: false } }, firstPage: [{ value: 127 }] },
  { id: 128, name: "settingHospital_read", menu_name: "ตั้งค่าสถานพยาบาล", active: { Read: { id: 127, active: false }, Create: { id: 128, active: false }, Update: { id: 129, active: false }, Delete: { id: 130, active: false } }, firstPage: [{ value: 128 }] },
  { id: 129, name: "settingZoneType_read", menu_name: "• ปุ่มจัดการประเภทและโซนสถานพยาบาล", active: { Read: { id: 131, active: false }, Create: { id: 132, active: false }, Update: { id: 133, active: false }, Delete: { id: 134, active: false } }, firstPage: [{ value: 129 }] },
  { id: 130, name: "settingReferPoint_read", menu_name: "จุดรับ-ส่งตัวผู้ป่วย", active: { Read: { id: 135, active: false }, Create: { id: 136, active: false }, Update: { id: 137, active: false }, Delete: { id: 138, active: false } }, firstPage: [{ value: 130 }] },
  { id: 131, name: "doctorBranch_read", menu_name: "สาขา/แผนกที่ส่งต่อ", active: { Read: { id: 139, active: false }, Create: { id: 140, active: false }, Update: { id: 141, active: false }, Delete: { id: 142, active: false } }, firstPage: [{ value: 131 }] },
  { id: 132, name: "settingDefault_read", menu_name: "ตั้งค่าเริ่มต้น (Default)", active: { Read: { id: 192, active: false }, Create: { id: 193, active: false }, Update: { id: 194, active: false }, Delete: { id: 195, active: false } }, firstPage: [{ value: 132 }] },
  { id: 133, name: "referStatusDetail_read", menu_name: "เหตุผล", active: { Read: { id: 196, active: false }, Create: { id: 197, active: false }, Update: { id: 198, active: false }, Delete: { id: 199, active: false } }, firstPage: [{ value: 133 }] },
  { id: 134, name: "referCause_create", menu_name: "สาเหตุ", active: { Read: { id: 143, active: false }, Create: { id: 144, active: false }, Update: { id: 145, active: false }, Delete: { id: 146, active: false } }, firstPage: [{ value: 134 }] },
];

/* ── Tooltip text ── */
const PERMISSION_TOOLTIP = `Read: เข้าถึงได้แค่ดูอย่างเดียว\nCreate: สามารถสร้าง/เพิ่มข้อมูลใหม่ได้\nUpdate: สามารถแก้ไขข้อมูลได้\nDelete: สามารถลบข้อมูลได้`;

/* ── Role display helper ── */
const roleDisplay = (roleName?: string) => {
  switch (roleName) {
    case "superAdmin": return "Super Admin";
    case "superAdminZone": return "Zone User";
    case "superAdminHospital": return "Hospital User";
    default: return roleName || "ไม่มีข้อมูล";
  }
};

/* ── Build permission rows from API data ── */
function buildPermissionRows(userPermissions: any[]): any[] {
  const permIds = new Set(userPermissions.map((p: any) => p.id));
  return PERMISSION_DATA.map((item) => ({
    ...item,
    active: item.active
      ? Object.keys(item.active).reduce((acc: any, key: string) => {
          acc[key] = { ...item.active[key], active: permIds.has(item.active[key].id) };
          return acc;
        }, {})
      : {},
  }));
}

/* ── Find firstPage value from API data ── */
function findFirstPage(apiFirstPage: string): string {
  const found = PERMISSION_DATA.find((r) => r.menu_name === apiFirstPage);
  return found ? String(found.firstPage?.[0]?.value) : "";
}

export default function ReadPermissionGroupPage() {
  const router = useRouter();
  const params = useParams();
  const permissionStore = usePermissionStore();
  const id = params?.id;

  /* ── State ── */
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [permissionRows, setPermissionRows] = useState<any[]>([]);
  const [firstPage, setFirstPage] = useState<string>("");

  /* ── Fetch data ── */
  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await permissionStore.getDataPermissionGroupById(id);
      const pg = res?.PermissionGroup || res;
      setData(pg);

      // Build permission rows from mapPermissions
      if (pg?.mapPermissions) {
        const userPerms = pg.mapPermissions.map((mp: any) => mp.permission);
        setPermissionRows(buildPermissionRows(userPerms));
      } else {
        setPermissionRows(buildPermissionRows([]));
      }

      // Set firstPage
      if (pg?.firstPage) {
        setFirstPage(findFirstPage(pg.firstPage));
      }
    } catch (err) {
      console.error("Error fetching permission group:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Handle edit navigation ── */
  const handleEdit = () => {
    router.push(`/management/permission-group/edit/${id}?permissions=true`);
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress sx={{ color: "#00AF75" }} />
        <Typography sx={{ ml: 2, color: "#6b7280" }}>กำลังโหลดข้อมูล...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* ── Title bar ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <IconButton onClick={() => router.back()} sx={{ color: "#374151" }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#036245" }}>
          บัญชีกลุ่มจัดการสิทธิ์
        </Typography>
      </Box>

      <Box sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: 2, p: 2.5 }}>
        {/* ═══ Section: ข้อมูลเบื้องต้น ═══ */}
        <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 2, mb: 3 }}>
          <Box sx={{ background: "linear-gradient(135deg, #c6f6d5, #e6fffa)", px: 2, py: 1.5, borderRadius: "8px 8px 0 0" }}>
            <Typography sx={{ fontWeight: 700, color: "#166534", fontSize: "1.1rem" }}>
              ข้อมูลเบื้องต้น
            </Typography>
          </Box>
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#6b7280" }}>
                  ชื่อกลุ่ม
                </Typography>
                <Typography>{data?.name || "ไม่มีข้อมูล"}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#6b7280" }}>
                  สำหรับบัญชีระดับ
                </Typography>
                <Typography>{roleDisplay(data?.role?.name)}</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ═══ Section: ใช้สำหรับสถานพยาบาล ═══ */}
        <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 2, mb: 3 }}>
          <Box sx={{ background: "linear-gradient(135deg, #c6f6d5, #e6fffa)", px: 2, py: 1.5, borderRadius: "8px 8px 0 0" }}>
            <Typography sx={{ fontWeight: 700, color: "#166534", fontSize: "1.1rem" }}>
              ใช้สำหรับสถานพยาบาล
            </Typography>
          </Box>
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#6b7280" }}>
                  โซนสถานพยาบาล
                </Typography>
                <Typography>{data?.zone?.name || "ไม่มีข้อมูล"}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#6b7280" }}>
                  ประเภทสถานพยาบาล
                </Typography>
                <Typography>
                  {data?.subType?.name || data?.hospital?.subType?.name || "ไม่มีข้อมูล"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#6b7280" }}>
                  สถานพยาบาล
                </Typography>
                <Typography>{data?.hospital?.name || "ไม่มีข้อมูล"}</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ═══ Section: ข้อมูลสิทธ์การเข้าถึง ═══ */}
        <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 2, mb: 3 }}>
          <Box
            sx={{
              background: "linear-gradient(135deg, #c6f6d5, #e6fffa)",
              px: 2,
              py: 1.5,
              borderRadius: "8px 8px 0 0",
            }}
          >
            <Typography sx={{ fontWeight: 700, color: "#166534", fontSize: "1.1rem" }}>
              ข้อมูลสิทธ์การเข้าถึง
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#036245" }}>
                    <TableCell sx={{ color: "#fff", fontWeight: 600, width: "40%" }}>เมนูที่เข้าถึงได้</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600, width: "12%", textAlign: "center" }}>หน้าแรก</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600, width: "12%", textAlign: "center" }}>Read</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600, width: "12%", textAlign: "center" }}>Create</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600, width: "12%", textAlign: "center" }}>Update</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600, width: "12%", textAlign: "center" }}>Delete</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {permissionRows.map((row) => (
                    <TableRow
                      key={row.id}
                      sx={{ bgcolor: row.menu_name?.startsWith("•") ? "#fff" : "#f0fdf4" }}
                    >
                      <TableCell>{row.menu_name}</TableCell>

                      {/* หน้าแรก — Green circle home icon (matching Nuxt) */}
                      <TableCell align="center">
                        {firstPage === String(row.firstPage?.[0]?.value) ? (
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              bgcolor: "#00AF75",
                            }}
                          >
                            <HomeIcon sx={{ color: "#fff", fontSize: 18 }} />
                          </Box>
                        ) : null}
                      </TableCell>

                      {/* Read / Create / Update / Delete — SVG icons matching Nuxt base-check-permission */}
                      {["Read", "Create", "Update", "Delete"].map((perm) => (
                        <TableCell key={perm} align="center">
                          {row.active?.[perm] !== undefined ? (
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: row.active[perm]?.active ? "#2FD897" : "#ef4444",
                                width: 24,
                                height: 24,
                              }}
                            >
                              {row.active[perm]?.active ? <CheckCircleFillIcon /> : <XCircleFillIcon />}
                            </Box>
                          ) : null}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>

        {/* ═══ Action buttons: ย้อนกลับ + แก้ไขข้อมูล ═══ */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.back()}
            sx={{
              borderColor: "#d1d5db",
              color: "#374151",
              fontWeight: 600,
              "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" },
            }}
          >
            ย้อนกลับ
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            sx={{
              bgcolor: "#f59e0b",
              color: "#fff",
              fontWeight: 600,
              "&:hover": { bgcolor: "#d97706" },
            }}
          >
            แก้ไขข้อมูล
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
