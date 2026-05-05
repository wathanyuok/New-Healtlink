"use client";
import React, { useState, useEffect, useCallback } from "react";
import GreenSwitch from "@/components/common/GreenSwitch";
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  CircularProgress,
  // Switch replaced by GreenSwitch
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Pagination,
  FormControl,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/userStore";
import { useHospitalStore } from "@/stores/hospitalStore";
import { useAuthStore } from "@/stores/authStore";

/* ── MUI Select border style (Nuxt-matching) ── */
const selectSx = {
  bgcolor: "#F8FFFE",
  borderRadius: 1,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#00AF75" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#00AF75" },
};
const dropdownMenuProps = { PaperProps: { sx: { maxHeight: 240 } } };

/* ── Render placeholder for empty Select (shows placeholder text when no value selected) ── */
const renderPlaceholder = (placeholder: string) => (selected: any) => {
  if (selected === "" || selected === undefined || selected === null) {
    return <span style={{ color: "#9ca3af" }}>{placeholder}</span>;
  }
  return undefined;
};

/* ── Table header columns (from Nuxt headerManageUser.json) ── */
const ALL_HEADERS = [
  { id: 1, Name: "ลำดับ" },
  { id: 2, Name: "รูปภาพ" },
  { id: 3, Name: "ชื่อเจ้าหน้าที่" },
  { id: 4, Name: "ระดับบัญชี" },
  { id: 5, Name: "กลุ่มสิทธิ์" },
  { id: 6, Name: "สถานพยาบาล" },
  { id: 7, Name: "การใช้งานบัญชี" },
  { id: 8, Name: "จัดการข้อมูล" },
];

export default function UserAccountPage() {
  const router = useRouter();
  const userStore = useUserStore();
  const hospitalStore = useHospitalStore();
  const authStore = useAuthStore();

  /* ── Profile & role ── */
  const profile = authStore.profile;
  const roleName = profile?.permissionGroup?.role?.name || "superAdmin";

  /* ── Filter state ── */
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<number | "">("");
  const [zoneFilter, setZoneFilter] = useState<number | "">("");
  const [typeFilter, setTypeFilter] = useState<number | "">("");
  const [hospitalFilter, setHospitalFilter] = useState<number | "">("");
  const [groupFilter, setGroupFilter] = useState<number | "">("");

  /* ── Options state ── */
  const [roleOptions, setRoleOptions] = useState<any[]>([]);
  const [zoneOptions, setZoneOptions] = useState<any[]>([]);
  const [typeOptions, setTypeOptions] = useState<any[]>([]);
  const [hospitalOptions, setHospitalOptions] = useState<any[]>([]);
  const [groupOptions, setGroupOptions] = useState<any[]>([]);

  /* ── Table state ── */
  const [users, setUsers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);

  /* ── Toggle states (isActive) ── */
  const [toggleStates, setToggleStates] = useState<Record<number, boolean>>({});

  /* ── Delete modal state ── */
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any>(null);

  /* ── Filter headers based on role (same as Nuxt) ── */
  const filteredHeaders = ALL_HEADERS.filter((h) => {
    if (roleName === "superAdminZone" && h.Name === "กลุ่มสิทธิ์") return false;
    if (roleName === "superAdminHospital" && (h.Name === "ระดับบัญชี" || h.Name === "สถานพยาบาล")) return false;
    return true;
  });

  /* ── Fetch users ── */
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        offset,
        limit,
        search,
      };

      // Role-based zone/hospital filter
      if (roleName === "superAdminZone") {
        params.zone = profile?.permissionGroup?.zone?.id || zoneFilter || null;
      } else if (zoneFilter) {
        params.zone = zoneFilter;
      }

      if (roleName === "superAdminHospital") {
        params.hospital = profile?.permissionGroup?.hospital?.id || hospitalFilter || null;
      } else if (hospitalFilter) {
        params.hospital = hospitalFilter;
      }

      if (typeFilter) params.subType = typeFilter;
      if (roleFilter) params.role = roleFilter;
      if (groupFilter) params.permissionGroup = groupFilter;

      const res = await userStore.getDataUser(params);
      const userRows = res?.users || res?.rows || [];
      setUsers(userRows);
      setTotalCount(res?.totalCount || res?.count || 0);

      // Initialize toggle states
      const newToggles: Record<number, boolean> = {};
      userRows.forEach((u: any) => {
        newToggles[u.id] = typeof u.isActive === "boolean" ? u.isActive : !!u.isActive?.active;
      });
      setToggleStates((prev) => ({ ...prev, ...newToggles }));
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, [offset, limit, search, roleFilter, zoneFilter, typeFilter, hospitalFilter, groupFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /* ── Transform API response to options { value, name } ── */
  const transformOptions = (arr: any[]) =>
    (arr || []).map((item: any) => ({ value: item.id, name: item.name, displayName: item.displayName }));

  /* ── Fetch roles (with role-based filtering matching Nuxt) ── */
  const loadRoles = async () => {
    try {
      const res = await hospitalStore.getOptionRole();
      let filtered = res?.roles || [];
      if (roleName === "superAdminZone") {
        filtered = filtered.filter((r: any) => r.displayName !== "Super Admin");
      } else if (roleName === "superAdminHospital") {
        filtered = filtered.filter((r: any) => r.displayName !== "Super Admin" && r.displayName !== "Zone User");
      }
      setRoleOptions(filtered.map((r: any) => ({ value: r.id, name: r.displayName || r.name })));
    } catch (err) {
      console.error("Error loading roles:", err);
    }
  };

  /* ── Fetch zones ── */
  const loadZones = async () => {
    try {
      const params: any = { zone: null, subType: null, hospital: null };
      if (roleName === "superAdminZone") {
        params.zone = profile?.permissionGroup?.zone?.id || null;
      }
      const res = await hospitalStore.getOptionHosZone(params);
      setZoneOptions(transformOptions(res?.hospitalZones || res || []));
    } catch (err) {
      console.error("Error loading zones:", err);
    }
  };

  /* ── Fetch types ── */
  const loadTypes = async (zone?: number | "") => {
    try {
      const params: any = { zone: zone || null, subType: null, hospital: null };
      const res = await hospitalStore.getOptionHosType(params);
      setTypeOptions(transformOptions(res?.hospitalSubTypes || res || []));
    } catch (err) {
      console.error("Error loading types:", err);
    }
  };

  /* ── Fetch hospitals ── */
  const loadHospitals = async (zone?: number | "", subType?: number | "") => {
    try {
      const params: any = { zone: zone || null, subType: subType || null, hospital: null };
      if (roleName === "superAdminZone") {
        params.zone = profile?.permissionGroup?.zone?.id || zone || null;
      }
      const res = await hospitalStore.getOptionHospital(params);
      setHospitalOptions(transformOptions(res?.hospitals || res || []));
    } catch (err) {
      console.error("Error loading hospitals:", err);
    }
  };

  /* ── Fetch permission groups ── */
  const loadGroups = async (zone?: number | "", subType?: number | "", hospital?: number | "") => {
    try {
      const params: any = { zone: zone || null, subType: subType || null, hospital: hospital || null };
      const res = await hospitalStore.getOptionGroupPer(params);
      setGroupOptions(transformOptions(res?.permissionsGroup || res?.rows || res || []));
    } catch (err) {
      console.error("Error loading groups:", err);
    }
  };

  /* ── Fetch all options on mount ── */
  useEffect(() => {
    const init = async () => {
      await Promise.all([
        loadRoles(),
        loadZones(),
        loadTypes(),
        loadHospitals(),
        loadGroups(),
      ]);
    };
    init();
  }, []);

  /* ── Refetch dependents when zone/type/hospital filter change ── */
  useEffect(() => {
    loadHospitals(zoneFilter, typeFilter);
    loadGroups(zoneFilter, typeFilter, hospitalFilter);
  }, [zoneFilter, typeFilter, hospitalFilter]);

  /* ── Toggle active/inactive ── */
  const handleToggle = async (item: any, newValue: boolean) => {
    setToggleStates((prev) => ({ ...prev, [item.id]: newValue }));
    try {
      await userStore.updateUser(item.id, { isActive: newValue });
    } catch (err) {
      console.error("Error toggling user:", err);
      // Revert on failure
      setToggleStates((prev) => ({ ...prev, [item.id]: !newValue }));
    }
  };

  /* ── Clear all filters ── */
  const clearFilters = () => {
    setSearch("");
    setRoleFilter("");
    setZoneFilter("");
    setTypeFilter("");
    setHospitalFilter("");
    setGroupFilter("");
    setOffset(1);
  };

  /* ── Delete ── */
  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;
    try {
      await userStore.deleteUser(deleteItem.id);
      setDeleteOpen(false);
      setDeleteItem(null);
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  /* ── Pagination ── */
  const totalPages = Math.ceil(totalCount / limit);

  /* ── Row number helper ── */
  const getRowNo = (index: number) => (offset - 1) * limit + index + 1;

  return (
    <Box sx={{ width: "100%" }}>
      {/* ── Title bar ── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#036245" }}>
          จัดการบัญชีผู้ใช้งาน
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => router.push("/management/user-account/add")}
          sx={{
            borderColor: "#00AF75",
            color: "#00AF75",
            fontWeight: 600,
            "&:hover": { borderColor: "#009966", bgcolor: "#f0fdf4" },
          }}
        >
          เพิ่มบัญชีใหม่
        </Button>
      </Box>

      {/* ── Filter panel ── */}
      <Box sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: 2, p: 2.5, mb: 2 }}>
        {/* ── Search ── */}
        {(roleName === "superAdmin" || roleName === "superAdminZone" || roleName === "superAdminHospital") && (
          <TextField
            placeholder="ค้นหาชื่อเจ้าหน้าที่"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOffset(1); }}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#9ca3af" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#d1d5db" },
                "&:hover fieldset": { borderColor: "#00AF75" },
                "&.Mui-focused fieldset": { borderColor: "#00AF75" },
              },
            }}
          />
        )}

        {/* ── Filters row (superAdmin) ── */}
        {roleName === "superAdmin" && (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
            {/* ระดับบัญชี */}
            <FormControl size="small" fullWidth>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                สำหรับระดับบัญชี
              </Typography>
              <Select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value as any); setOffset(1); }}
                displayEmpty
                renderValue={renderPlaceholder("เลือกระดับบัญชี")}
                sx={selectSx}
                MenuProps={dropdownMenuProps}
              >
                {roleOptions.map((r: any) => (
                  <MenuItem key={r.value} value={r.value}>{r.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* โซนสถานพยาบาล */}
            <FormControl size="small" fullWidth>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                โซนสถานพยาบาล
              </Typography>
              <Select
                value={zoneFilter}
                onChange={(e) => {
                  setZoneFilter(e.target.value as any);
                  setTypeFilter("");
                  setHospitalFilter("");
                  setOffset(1);
                }}
                displayEmpty
                renderValue={renderPlaceholder("เลือกโซนสถานพยาบาล")}
                sx={selectSx}
                MenuProps={dropdownMenuProps}
              >
                {zoneOptions.map((z: any) => (
                  <MenuItem key={z.value} value={z.value}>{z.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* ประเภทสถานพยาบาล */}
            <FormControl size="small" fullWidth>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                ประเภทสถานพยาบาล
              </Typography>
              <Select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as any);
                  setHospitalFilter("");
                  setOffset(1);
                }}
                displayEmpty
                renderValue={renderPlaceholder("เลือกประเภทสถานพยาบาล")}
                sx={selectSx}
                MenuProps={dropdownMenuProps}
              >
                {typeOptions.map((t: any) => (
                  <MenuItem key={t.value} value={t.value}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* สถานพยาบาล */}
            <FormControl size="small" fullWidth>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                สถานพยาบาล
              </Typography>
              <Select
                value={hospitalFilter}
                onChange={(e) => { setHospitalFilter(e.target.value as any); setOffset(1); }}
                displayEmpty
                renderValue={renderPlaceholder("เลือกสถานพยาบาล")}
                sx={selectSx}
                MenuProps={dropdownMenuProps}
              >
                {hospitalOptions.map((h: any) => (
                  <MenuItem key={h.value} value={h.value}>{h.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* กลุ่มสิทธิ์ */}
            <FormControl size="small" fullWidth>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                กลุ่มสิทธิ์
              </Typography>
              <Select
                value={groupFilter}
                onChange={(e) => { setGroupFilter(e.target.value as any); setOffset(1); }}
                displayEmpty
                renderValue={renderPlaceholder("เลือกกลุ่มสิทธิ์")}
                sx={selectSx}
                MenuProps={dropdownMenuProps}
              >
                {groupOptions.map((g: any) => (
                  <MenuItem key={g.value} value={g.value}>{g.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* ล้างตัวกรอง */}
            <Box sx={{ display: "flex", alignItems: "flex-end" }}>
              <Button
                variant="outlined"
                onClick={clearFilters}
                sx={{
                  borderColor: "#d1d5db",
                  color: "#374151",
                  fontWeight: 500,
                  height: 40,
                  "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" },
                }}
              >
                ล้างตัวกรอง
              </Button>
            </Box>
          </Box>
        )}

        {/* ── Filters row (superAdminZone) ── */}
        {roleName === "superAdminZone" && (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
            <FormControl size="small" fullWidth>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                สำหรับบัญชีระดับ
              </Typography>
              <Select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value as any); setOffset(1); }}
                displayEmpty
                renderValue={renderPlaceholder("เลือกระดับบัญชี")}
                sx={selectSx}
                MenuProps={dropdownMenuProps}
              >
                {roleOptions.map((r: any) => (
                  <MenuItem key={r.value} value={r.value}>{r.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                ประเภทสถานพยาบาล
              </Typography>
              <Select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value as any); setHospitalFilter(""); setOffset(1); }}
                displayEmpty
                renderValue={renderPlaceholder("เลือกประเภทสถานพยาบาล")}
                sx={selectSx}
                MenuProps={dropdownMenuProps}
              >
                {typeOptions.map((t: any) => (
                  <MenuItem key={t.value} value={t.value}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                สถานพยาบาล
              </Typography>
              <Select
                value={hospitalFilter}
                onChange={(e) => { setHospitalFilter(e.target.value as any); setOffset(1); }}
                displayEmpty
                renderValue={renderPlaceholder("เลือกสถานพยาบาล")}
                sx={selectSx}
                MenuProps={dropdownMenuProps}
              >
                {hospitalOptions.map((h: any) => (
                  <MenuItem key={h.value} value={h.value}>{h.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", alignItems: "flex-end" }}>
              <Button
                variant="outlined"
                onClick={clearFilters}
                sx={{ borderColor: "#d1d5db", color: "#374151", fontWeight: 500, height: 40, "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" } }}
              >
                ล้างตัวกรอง
              </Button>
            </Box>
          </Box>
        )}

        {/* ── Filters row (superAdminHospital) ── */}
        {roleName === "superAdminHospital" && (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
            <FormControl size="small" fullWidth>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                กลุ่มสิทธิ์
              </Typography>
              <Select
                value={groupFilter}
                onChange={(e) => { setGroupFilter(e.target.value as any); setOffset(1); }}
                displayEmpty
                renderValue={renderPlaceholder("เลือกกลุ่มสิทธิ์")}
                sx={selectSx}
                MenuProps={dropdownMenuProps}
              >
                {groupOptions.map((g: any) => (
                  <MenuItem key={g.value} value={g.value}>{g.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", alignItems: "flex-end" }}>
              <Button
                variant="outlined"
                onClick={clearFilters}
                sx={{ borderColor: "#d1d5db", color: "#374151", fontWeight: 500, height: 40, "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" } }}
              >
                ล้างตัวกรอง
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* ── Table ── */}
      <Box sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: 2, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 6 }}>
            <CircularProgress sx={{ color: "#00AF75" }} />
            <Typography sx={{ ml: 2, color: "#6b7280" }}>กำลังโหลดข้อมูล...</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#036245" }}>
                    {filteredHeaders.map((h) => (
                      <TableCell
                        key={h.id}
                        sx={{ color: "#fff", fontWeight: 600, textAlign: "center", whiteSpace: "nowrap" }}
                      >
                        {h.Name}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={filteredHeaders.length} align="center" sx={{ py: 4, color: "#6b7280" }}>
                        ไม่พบข้อมูล
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((item, index) => (
                      <TableRow
                        key={item.id}
                        sx={{
                          "&:hover": { bgcolor: "#f0fdf4" },
                          cursor: "pointer",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {filteredHeaders.map((h) => (
                          <TableCell key={h.id} align="center" sx={{ py: 1.5 }}>
                            {/* ลำดับ */}
                            {h.Name === "ลำดับ" && (
                              <Typography variant="body2">{getRowNo(index)}</Typography>
                            )}

                            {/* รูปภาพ */}
                            {h.Name === "รูปภาพ" && (
                              item.avatar ? (
                                <Box
                                  sx={{
                                    width: 35,
                                    height: 35,
                                    borderRadius: 1,
                                    overflow: "hidden",
                                    bgcolor: "#f3f4f6",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <img
                                    src={item.avatar}
                                    alt=""
                                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "cover", borderRadius: 4 }}
                                  />
                                </Box>
                              ) : (
                                <Typography variant="body2" sx={{ color: "#9ca3af" }}>ไม่มีรูปภาพ</Typography>
                              )
                            )}

                            {/* ชื่อเจ้าหน้าที่ */}
                            {h.Name === "ชื่อเจ้าหน้าที่" && (
                              <Box>
                                <Typography variant="body2">
                                  {item.firstName && item.lastName
                                    ? `${item.firstName} - ${item.lastName}`
                                    : item.fullName || "ไม่ระบุชื่อ"}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                                  <Box component="span" sx={{ fontSize: 10 }}>👤</Box>
                                  {item.username || "ไม่ระบุ username"}
                                </Typography>
                              </Box>
                            )}

                            {/* ระดับบัญชี */}
                            {h.Name === "ระดับบัญชี" && (
                              <Typography variant="body2">
                                {item.permissionGroup?.role?.displayName || "ไม่มีระดับบัญชี"}
                              </Typography>
                            )}

                            {/* กลุ่มสิทธิ์ */}
                            {h.Name === "กลุ่มสิทธิ์" && (
                              <Typography variant="body2">
                                {item.permissionGroup?.name || "ไม่มีกลุ่มสิทธิ์"}
                              </Typography>
                            )}

                            {/* สถานพยาบาล */}
                            {h.Name === "สถานพยาบาล" && (
                              <Typography variant="body2">
                                {item.permissionGroup?.hospital?.name || "ไม่มีสถานพยาบาล"}
                              </Typography>
                            )}

                            {/* การใช้งานบัญชี (toggle) */}
                            {h.Name === "การใช้งานบัญชี" && (
                              <GreenSwitch
                                checked={toggleStates[item.id] ?? false}
                                onChange={(e) => handleToggle(item, e.target.checked)}
                              />
                            )}

                            {/* จัดการข้อมูล (action buttons) */}
                            {h.Name === "จัดการข้อมูล" && (
                              <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                                {/* View */}
                                <IconButton
                                  size="small"
                                  onClick={() => router.push(`/management/user-account/read/${item.id}`)}
                                  sx={{
                                    bgcolor: "#3b82f6",
                                    color: "#fff",
                                    width: 30,
                                    height: 30,
                                    "&:hover": { bgcolor: "#2563eb" },
                                  }}
                                >
                                  <VisibilityIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                                {/* Edit */}
                                <IconButton
                                  size="small"
                                  onClick={() => router.push(`/management/user-account/edit/${item.id}`)}
                                  sx={{
                                    bgcolor: "#f59e0b",
                                    color: "#fff",
                                    width: 30,
                                    height: 30,
                                    "&:hover": { bgcolor: "#d97706" },
                                  }}
                                >
                                  <EditIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                                {/* Delete */}
                                <IconButton
                                  size="small"
                                  onClick={() => { setDeleteItem(item); setDeleteOpen(true); }}
                                  sx={{
                                    bgcolor: "#ef4444",
                                    color: "#fff",
                                    width: 30,
                                    height: 30,
                                    "&:hover": { bgcolor: "#dc2626" },
                                  }}
                                >
                                  <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Box>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* ── Pagination ── */}
            {totalPages > 0 && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <Pagination
                  count={totalPages}
                  page={offset}
                  onChange={(_, page) => setOffset(page)}
                  color="standard"
                  sx={{
                    "& .Mui-selected": { bgcolor: "#00AF75 !important", color: "#fff" },
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Box>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: "#ef4444", fontWeight: 700 }}>
          ลบข้อมูลสิทธิ์
        </DialogTitle>
        <DialogContent>
          <Typography>
            ต้องการลบข้อมูล &quot;{deleteItem?.firstName ? `${deleteItem.firstName} ${deleteItem.lastName}` : deleteItem?.fullName || deleteItem?.username}&quot; หรือไม่
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteOpen(false)}
            variant="outlined"
            sx={{ borderColor: "#d1d5db", color: "#374151" }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" } }}
          >
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
