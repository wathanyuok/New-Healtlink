"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Select,
  MenuItem,
  Switch,
  Radio,
  Tooltip,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useHospitalStore } from "@/stores/hospitalStore";
import { usePermissionStore } from "@/stores/permissionStore";

/* ── Shared select styling ── */
const selectSx = {
  bgcolor: "#F8FFFE",
  borderRadius: 1,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#00AF75" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#00AF75" },
};
const dropdownMenuProps = { PaperProps: { sx: { maxHeight: 240 } } };

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

/* ── Collect active permission IDs from rows ── */
function collectActiveIds(rows: any[]): number[] {
  const ids: number[] = [];
  rows.forEach((row) => {
    if (row.active) {
      Object.keys(row.active).forEach((key) => {
        if (row.active[key]?.active) {
          ids.push(row.active[key].id);
        }
      });
    }
  });
  return ids;
}

export default function EditPermissionGroupPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const hospitalStore = useHospitalStore();
  const permissionStore = usePermissionStore();
  const id = params?.id;
  const isPermissionsMode = searchParams?.get("permissions") === "true";

  /* ── Form state ── */
  const [groupName, setGroupName] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [zoneId, setZoneId] = useState<string>("");
  const [typeId, setTypeId] = useState<string>("");
  const [hospitalId, setHospitalId] = useState<string>("");

  /* ── Options ── */
  const [roleOptions, setRoleOptions] = useState<any[]>([]);
  const [zoneOptions, setZoneOptions] = useState<any[]>([]);
  const [typeOptions, setTypeOptions] = useState<any[]>([]);
  const [hospitalOptions, setHospitalOptions] = useState<any[]>([]);

  /* ── Permission table state ── */
  const [permissionRows, setPermissionRows] = useState<any[]>([]);
  const [firstPage, setFirstPage] = useState<string>("");

  /* ── UI state ── */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingGroup, setSavingGroup] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);

  /* ── Fetch options ── */
  const fetchOptions = useCallback(async () => {
    try {
      const [roleRes, zoneRes, typeRes, hosRes] = await Promise.all([
        hospitalStore.getOptionRole(),
        hospitalStore.getOptionHosZone(),
        hospitalStore.getOptionHosType(),
        hospitalStore.getOptionHospital({ offset: 1, limit: 10000 }),
      ]);
      const roles = roleRes?.roles || [];
      setRoleOptions(
        roles.map((r: any) => ({
          id: r.id,
          name: r.displayName || r.name,
          value: r.id,
        }))
      );
      setZoneOptions(zoneRes?.hospitalZones || []);
      setTypeOptions(typeRes?.hospitalSubTypes || []);
      setHospitalOptions(hosRes?.hospitals || []);
    } catch (err) {
      console.error("Error fetching options:", err);
    }
  }, []);

  /* ── Fetch permission group data ── */
  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await permissionStore.getDataPermissionGroupById(id);
      const pg = res?.PermissionGroup || res;
      setOriginalData(pg);

      // Populate form
      setGroupName(pg?.name || "");
      setRoleId(pg?.role?.id ? String(pg.role.id) : "");
      setZoneId(pg?.zone?.id ? String(pg.zone.id) : "");
      setTypeId(pg?.hospital?.subType?.id ? String(pg.hospital.subType.id) : (pg?.subType?.id ? String(pg.subType.id) : ""));
      setHospitalId(pg?.hospital?.id ? String(pg.hospital.id) : "");

      // Build permission rows
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
      setError("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    Promise.all([fetchOptions(), fetchData()]);
  }, []);

  /* ── Cascading: zone → refetch type & hospital ── */
  const handleZoneChange = async (val: string) => {
    setZoneId(val);
    setTypeId("");
    setHospitalId("");
    if (val) {
      try {
        const [typeRes, hosRes] = await Promise.all([
          hospitalStore.getOptionHosType({ zone: val }),
          hospitalStore.getOptionHospital({ zone: val, offset: 1, limit: 10000 }),
        ]);
        setTypeOptions(typeRes?.hospitalSubTypes || []);
        setHospitalOptions(hosRes?.hospitals || []);
      } catch (err) {
        console.error(err);
      }
    }
  };

  /* ── Cascading: type → refetch hospital ── */
  const handleTypeChange = async (val: string) => {
    setTypeId(val);
    setHospitalId("");
    if (zoneId) {
      try {
        const hosRes = await hospitalStore.getOptionHospital({
          zone: zoneId,
          subType: val || undefined,
          offset: 1,
          limit: 10000,
        });
        setHospitalOptions(hosRes?.hospitals || []);
      } catch (err) {
        console.error(err);
      }
    }
  };

  /* ── Toggle permission ── */
  const togglePermission = (rowIndex: number, permType: string) => {
    setHasChanges(true);
    setPermissionRows((prev) => {
      const next = [...prev];
      const row = { ...next[rowIndex] };
      row.active = { ...row.active };
      if (row.active[permType]) {
        row.active[permType] = { ...row.active[permType], active: !row.active[permType].active };
      }
      next[rowIndex] = row;
      return next;
    });
  };

  /* ── Enable all permissions ── */
  const handleEnableAll = async () => {
    // Turn on all switches locally
    const allOnRows = permissionRows.map((row) => ({
      ...row,
      active: row.active
        ? Object.keys(row.active).reduce((acc: any, key: string) => {
            acc[key] = { ...row.active[key], active: true };
            return acc;
          }, {})
        : {},
    }));
    setPermissionRows(allOnRows);
    setHasChanges(true);

    // Save immediately
    try {
      setSavingAll(true);
      setError(null);
      const activeIds = collectActiveIds(allOnRows);
      const firstPageRow = allOnRows.find(
        (r: any) => r.firstPage?.some((fp: any) => String(fp.value) === firstPage)
      );
      const payload: any = {
        name: groupName.trim(),
        role: Number(roleId),
        permissions: activeIds,
        firstPage: firstPageRow?.menu_name || "",
      };
      if (zoneId) payload.zone = Number(zoneId);
      if (typeId) payload.subType = Number(typeId);
      if (hospitalId) payload.hospital = Number(hospitalId);

      await permissionStore.updatePermissionGroup(id, payload);
      // Refresh data
      await fetchData();
      setHasChanges(false);
    } catch (err) {
      setError("ไม่สามารถเปิดสิทธิ์ทั้งหมดได้");
      console.error(err);
    } finally {
      setSavingAll(false);
    }
  };

  /* ── Build payload ── */
  const buildPayload = () => {
    const activeIds = collectActiveIds(permissionRows);
    const firstPageRow = permissionRows.find(
      (r) => r.firstPage?.some((fp: any) => String(fp.value) === firstPage)
    );
    const payload: any = {
      name: groupName.trim(),
      role: Number(roleId),
      permissions: activeIds,
      firstPage: firstPageRow?.menu_name || "",
    };
    if (zoneId) payload.zone = Number(zoneId);
    if (typeId) payload.subType = Number(typeId);
    if (hospitalId) payload.hospital = Number(hospitalId);
    return payload;
  };

  /* ── Save: บันทึกการเปลี่ยนแปลง (save group only, stay on page) ── */
  const handleSaveGroup = async () => {
    try {
      setSavingGroup(true);
      setError(null);
      const payload = buildPayload();
      await permissionStore.updatePermissionGroup(id, payload);
      // Refresh data after save
      await fetchData();
    } catch (err) {
      setError("ไม่สามารถบันทึกข้อมูลได้");
      console.error(err);
    } finally {
      setSavingGroup(false);
    }
  };

  /* ── Save: บันทึกข้อมูล (save and go back to list) ── */
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const payload = buildPayload();
      await permissionStore.updatePermissionGroup(id, payload);
      router.push("/management/permission-group");
    } catch (err) {
      setError("ไม่สามารถบันทึกข้อมูลได้");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  /* ── Determine hospital section visibility ── */
  const roleIdNum = Number(roleId);
  const showHospitalSection = roleId && roleIdNum !== 1;
  const showTypeAndHospital = roleId && roleIdNum !== 1 && roleIdNum !== 2;

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
          แก้ไขกลุ่มจัดการสิทธิ์
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

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
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                  ชื่อกลุ่ม <span style={{ color: "red" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="กรอกชื่อกลุ่ม"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                  สำหรับบัญชีระดับ <span style={{ color: "red" }}>*</span>
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  displayEmpty
                  value={roleId}
                  onChange={(e) => {
                    setRoleId(e.target.value);
                    setZoneId("");
                    setTypeId("");
                    setHospitalId("");
                  }}
                  sx={selectSx}
                  MenuProps={dropdownMenuProps}
                >
                  {roleOptions.map((r: any) => (
                    <MenuItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ═══ Section: ข้อมูลสถานพยาบาล (conditional) ═══ */}
        {showHospitalSection && (
          <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 2, mb: 3 }}>
            <Box sx={{ background: "linear-gradient(135deg, #c6f6d5, #e6fffa)", px: 2, py: 1.5, borderRadius: "8px 8px 0 0" }}>
              <Typography sx={{ fontWeight: 700, color: "#166534", fontSize: "1.1rem" }}>
                ใช้สำหรับสถานพยาบาล
              </Typography>
            </Box>
            <Box sx={{ p: 2.5 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
                {/* โซนสถานพยาบาล */}
                <Box>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                    โซนสถานพยาบาล <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    displayEmpty
                    value={zoneId}
                    onChange={(e) => handleZoneChange(e.target.value)}
                    sx={selectSx}
                    MenuProps={dropdownMenuProps}
                  >
                    {zoneOptions.map((z: any) => (
                      <MenuItem key={z.id} value={String(z.id)}>
                        {z.name}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>

                {/* ประเภทสถานพยาบาล (hidden for superAdminZone, id=2) */}
                {showTypeAndHospital && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                      ประเภทสถานพยาบาล <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      displayEmpty
                      value={typeId}
                      onChange={(e) => handleTypeChange(e.target.value)}
                      sx={selectSx}
                      MenuProps={dropdownMenuProps}
                      disabled={!zoneId}
                    >
                      {typeOptions.map((t: any) => (
                        <MenuItem key={t.id} value={String(t.id)}>
                          {t.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                )}

                {/* สถานพยาบาล */}
                {showTypeAndHospital && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                      สถานพยาบาล <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      displayEmpty
                      value={hospitalId}
                      onChange={(e) => setHospitalId(e.target.value)}
                      sx={selectSx}
                      MenuProps={dropdownMenuProps}
                      disabled={!zoneId}
                    >
                      {hospitalOptions.map((h: any) => (
                        <MenuItem key={h.id} value={String(h.id)}>
                          {h.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}

        {/* ═══ Gray bar: จัดการสิทธิ์การเข้าถึงทั้งหมด ═══ */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "#d1d5db",
            borderRadius: 1,
            px: 2.5,
            py: 1.5,
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography sx={{ fontWeight: 700, color: "#374151", fontSize: "1rem" }}>
              จัดการสิทธิ์การเข้าถึงทั้งหมด
            </Typography>
            {hasChanges && (
              <Typography sx={{ color: "#6b7280", fontSize: "0.9rem" }}>
                มีการเปลี่ยนแปลง
              </Typography>
            )}
          </Box>
          <Button
            variant="outlined"
            onClick={handleEnableAll}
            disabled={savingAll}
            startIcon={savingAll ? <CircularProgress size={16} /> : undefined}
            sx={{
              borderColor: "#9ca3af",
              color: "#374151",
              fontWeight: 600,
              bgcolor: "#fff",
              "&:hover": { borderColor: "#6b7280", bgcolor: "#f3f4f6" },
            }}
          >
            เปิดสิทธิ์ทั้งหมด
          </Button>
        </Box>

        {/* ═══ Section: ข้อมูลสิทธ์การเข้าถึง ═══ */}
        <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 2, mb: 3 }}>
          <Box
            sx={{
              background: "linear-gradient(135deg, #c6f6d5, #e6fffa)",
              px: 2,
              py: 1.5,
              borderRadius: "8px 8px 0 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography sx={{ fontWeight: 700, color: "#166534", fontSize: "1.1rem" }}>
              ข้อมูลสิทธ์การเข้าถึง
            </Typography>
            <Tooltip
              title={
                <Box sx={{ whiteSpace: "pre-line", p: 1, fontSize: "0.85rem" }}>
                  {PERMISSION_TOOLTIP}
                </Box>
              }
              arrow
              placement="left"
            >
              <IconButton size="small">
                <HelpOutlineIcon sx={{ color: "#6b7280" }} />
              </IconButton>
            </Tooltip>
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
                  {permissionRows.map((row, idx) => {
                    const hasAnyActive = row.active
                      ? Object.values(row.active).some((v: any) => v?.active)
                      : false;
                    return (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{ bgcolor: hasAnyActive ? "#f0fdf4" : "#fff" }}
                    >
                      <TableCell>{row.menu_name}</TableCell>

                      {/* หน้าแรก — Radio */}
                      <TableCell align="center">
                        <Radio
                          size="small"
                          checked={firstPage === String(row.firstPage?.[0]?.value)}
                          onChange={() => setFirstPage(String(row.firstPage?.[0]?.value))}
                          sx={{ color: "#00AF75", "&.Mui-checked": { color: "#00AF75" } }}
                        />
                      </TableCell>

                      {/* Read / Create / Update / Delete — Switch toggles */}
                      {["Read", "Create", "Update", "Delete"].map((perm) => (
                        <TableCell key={perm} align="center">
                          {row.active?.[perm] !== undefined ? (
                            <Switch
                              size="small"
                              checked={!!row.active[perm]?.active}
                              onChange={() => togglePermission(idx, perm)}
                              sx={{
                                "& .MuiSwitch-switchBase.Mui-checked": { color: "#00AF75" },
                                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#00AF75" },
                              }}
                            />
                          ) : null}
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

        {/* ═══ Action buttons ═══ */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          {/* บันทึกการเปลี่ยนแปลง — save group + stay on page */}
          {isPermissionsMode && (
            <Button
              variant="outlined"
              startIcon={savingGroup ? <CircularProgress size={18} /> : <CheckCircleIcon />}
              onClick={handleSaveGroup}
              disabled={savingGroup || saving}
              sx={{
                borderColor: "#d1d5db",
                color: "#374151",
                fontWeight: 600,
                "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" },
              }}
            >
              บันทึกการเปลี่ยนแปลง
            </Button>
          )}

          {/* บันทึกข้อมูล — save and go to list */}
          <Button
            variant="outlined"
            startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving || savingGroup}
            sx={{
              borderColor: "#00AF75",
              color: "#00AF75",
              fontWeight: 600,
              "&:hover": { borderColor: "#009966", bgcolor: "#f0fdf4" },
            }}
          >
            บันทึกข้อมูล
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
