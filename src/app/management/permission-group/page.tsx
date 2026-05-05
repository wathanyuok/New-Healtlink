"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
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
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  InputAdornment,
  Pagination,
  Tooltip,
  IconButton,
  Dialog,
  DialogContent,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import FindInPageIcon from "@mui/icons-material/FindInPage";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { useRouter } from "next/navigation";
import { usePermissionStore } from "@/stores/permissionStore";
import { useHospitalStore } from "@/stores/hospitalStore";

/* ── Shared select styling ── */
const selectSx = {
  bgcolor: "#F8FFFE",
  borderRadius: 1,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#00AF75" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#00AF75" },
};
const dropdownMenuProps = { PaperProps: { sx: { maxHeight: 240 } } };

/* ── Thai date formatter (Buddhist era) ── */
function formatThaiDateTime(isoString?: string) {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Bangkok",
    }).format(d);
  } catch {
    return isoString;
  }
}

export default function PermissionGroupPage() {
  const router = useRouter();
  const permissionStore = usePermissionStore();
  const hospitalStore = useHospitalStore();

  /* ── Data state ── */
  const [items, setItems] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Filter state ── */
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [zoneFilter, setZoneFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [hospitalFilter, setHospitalFilter] = useState<string>("");

  /* ── Options state ── */
  const [roleOptions, setRoleOptions] = useState<any[]>([]);
  const [zoneOptions, setZoneOptions] = useState<any[]>([]);
  const [typeOptions, setTypeOptions] = useState<any[]>([]);
  const [hospitalOptions, setHospitalOptions] = useState<any[]>([]);

  /* ── Delete modal state ── */
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ── Debounce ref ── */
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  /* ── Fetch options ── */
  const fetchOptions = useCallback(async () => {
    try {
      const [roleRes, zoneRes, typeRes, hosRes] = await Promise.all([
        hospitalStore.getOptionRole(),
        hospitalStore.getOptionHosZone(),
        hospitalStore.getOptionHosType(),
        hospitalStore.getOptionHospital({ offset: 1, limit: 10000 }),
      ]);
      // roles: auth-service/role/find → { roles: [...] }
      const roles = roleRes?.roles || (Array.isArray(roleRes) ? roleRes : []);
      setRoleOptions(
        roles.map((r: any) => ({
          id: r.id,
          name: r.displayName || r.name,
          value: r.id,
        }))
      );
      // zones
      const zones = zoneRes?.hospitalZones || (Array.isArray(zoneRes) ? zoneRes : []);
      setZoneOptions(zones);
      // types
      const types = typeRes?.hospitalSubTypes || (Array.isArray(typeRes) ? typeRes : []);
      setTypeOptions(types);
      // hospitals
      setHospitalOptions(hosRes?.hospitals || []);
    } catch (err) {
      console.error("Error fetching options:", err);
    }
  }, []);

  /* ── Fetch hospital options with zone/type params (cascading) ── */
  const refetchHospitalOptions = useCallback(async (zone: string, subType: string) => {
    try {
      const params: any = { offset: 1, limit: 10000 };
      if (zone) params.zone = zone;
      if (subType) params.subType = subType;
      const hosRes = await hospitalStore.getOptionHospital(params);
      setHospitalOptions(hosRes?.hospitals || []);
    } catch (err) {
      console.error("Error fetching hospital options:", err);
    }
  }, []);

  /* ── Fetch main data ── */
  const doFetch = useCallback(
    async (
      p: number,
      limit: number,
      searchVal: string,
      role: string,
      zone: string,
      subType: string,
      hospital: string
    ) => {
      try {
        setLoading(true);
        setError(null);
        const params: any = { offset: p, limit };
        if (searchVal.trim()) params.search = searchVal.trim();
        if (zone) params.zone = zone;
        if (subType) params.subType = subType;
        if (role) params.role = role;
        if (hospital) params.hospital = hospital;

        const res = await permissionStore.getDataPermissionGroup(params);
        const rows = res?.permissionGroups || res?.rows || [];
        const count = res?.totalCount ?? res?.count ?? rows.length;
        setItems(rows);
        setTotalCount(count);
      } catch (err) {
        setError("ไม่สามารถโหลดข้อมูลได้");
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* ── Initial load ── */
  useEffect(() => {
    fetchOptions();
    doFetch(1, rowsPerPage, "", "", "", "", "");
  }, []);

  /* ── Refetch on filter/page changes ── */
  useEffect(() => {
    doFetch(page, rowsPerPage, search, roleFilter, zoneFilter, typeFilter, hospitalFilter);
  }, [page, rowsPerPage, roleFilter, zoneFilter, typeFilter, hospitalFilter]);

  /* ── Cascading: zone change → reset type & hospital, refetch hospitals ── */
  const handleZoneChange = (val: string) => {
    setZoneFilter(val);
    setTypeFilter("");
    setHospitalFilter("");
    setPage(1);
    refetchHospitalOptions(val, "");
  };

  /* ── Cascading: type change → reset hospital, refetch hospitals ── */
  const handleTypeChange = (val: string) => {
    setTypeFilter(val);
    setHospitalFilter("");
    setPage(1);
    refetchHospitalOptions(zoneFilter, val);
  };

  /* ── Debounced search ── */
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      doFetch(1, rowsPerPage, value, roleFilter, zoneFilter, typeFilter, hospitalFilter);
    }, 500);
  };

  /* ── Clear filters ── */
  const resetFilters = () => {
    setSearch("");
    setRoleFilter("");
    setZoneFilter("");
    setTypeFilter("");
    setHospitalFilter("");
    setPage(1);
    refetchHospitalOptions("", "");
    doFetch(1, rowsPerPage, "", "", "", "", "");
  };

  /* ── Actions ── */
  const handleRead = (item: any) => {
    router.push(`/management/permission-group/read/${item.id}?read=true`);
  };
  const handleEdit = (item: any) => {
    router.push(`/management/permission-group/edit/${item.id}?permissions=true`);
  };
  const handleDelete = (item: any) => {
    setDeleteTarget(item);
    setDeleteOpen(true);
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await permissionStore.deletePermissionGroup(deleteTarget.id);
      setDeleteOpen(false);
      setDeleteTarget(null);
      doFetch(page, rowsPerPage, search, roleFilter, zoneFilter, typeFilter, hospitalFilter);
    } catch (err) {
      setError("ไม่สามารถลบข้อมูลได้");
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ── Running number ── */
  const getDisplayNo = (index: number) => (page - 1) * rowsPerPage + index + 1;
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  /* ════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════ */
  return (
    <Box sx={{ width: "100%" }}>
      {/* ── Title bar ── */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#036245" }}>
          จัดการกลุ่มสิทธิ์การเข้าถึง
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => router.push("/management/permission-group/add")}
          sx={{
            borderColor: "#00AF75",
            color: "#00AF75",
            fontWeight: 600,
            "&:hover": { borderColor: "#009966", bgcolor: "#f0fdf4" },
          }}
        >
          เพิ่มข้อมูล
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Filter panel + Table ── */}
      <Box sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: 2, p: 2.5 }}>
        {/* Filters — 3 columns per row matching Nuxt grid-cols-3 */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" },
            gap: 2,
            mb: 2,
          }}
        >
          {/* ค้นหา */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>ค้นหา</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="ค้นหาชื่อกลุ่มจัดการสิทธิ์"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon sx={{ color: "#9ca3af" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* สำหรับบัญชีระดับ */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>สำหรับบัญชีระดับ</Typography>
            <Select
              fullWidth
              size="small"
              displayEmpty
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              sx={selectSx}
              MenuProps={dropdownMenuProps}
            >
              <MenuItem value="">เลือกระดับบัญชี</MenuItem>
              {roleOptions.map((r: any) => (
                <MenuItem key={r.id} value={String(r.id)}>
                  {r.name}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* โซนสถานพยาบาล */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>โซนสถานพยาบาล</Typography>
            <Select
              fullWidth
              size="small"
              displayEmpty
              value={zoneFilter}
              onChange={(e) => handleZoneChange(e.target.value)}
              sx={selectSx}
              MenuProps={dropdownMenuProps}
            >
              <MenuItem value="">เลือกโซนสถานพยาบาล</MenuItem>
              {zoneOptions.map((z: any) => (
                <MenuItem key={z.id} value={String(z.id)}>
                  {z.name}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* ประเภทสถานพยาบาล */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>ประเภทสถานพยาบาล</Typography>
            <Select
              fullWidth
              size="small"
              displayEmpty
              value={typeFilter}
              onChange={(e) => handleTypeChange(e.target.value)}
              sx={selectSx}
              MenuProps={dropdownMenuProps}
            >
              <MenuItem value="">เลือกประเภทสถานพยาบาล</MenuItem>
              {typeOptions.map((t: any) => (
                <MenuItem key={t.id} value={String(t.id)}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {t.name}
                    {t.hospitalCount != null && (
                      <Box
                        component="span"
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: 22,
                          height: 22,
                          borderRadius: "50%",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "#fff",
                          bgcolor:
                            t.hospitalCount >= 50
                              ? "#16a34a"
                              : t.hospitalCount >= 20
                              ? "#eab308"
                              : t.hospitalCount >= 5
                              ? "#3b82f6"
                              : "#9ca3af",
                          px: 0.5,
                        }}
                      >
                        {t.hospitalCount}
                      </Box>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* สถานพยาบาล */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>สถานพยาบาล</Typography>
            <Select
              fullWidth
              size="small"
              displayEmpty
              value={hospitalFilter}
              onChange={(e) => { setHospitalFilter(e.target.value); setPage(1); }}
              sx={selectSx}
              MenuProps={dropdownMenuProps}
            >
              <MenuItem value="">เลือกสถานพยาบาล</MenuItem>
              {hospitalOptions.map((h: any) => (
                <MenuItem key={h.id} value={String(h.id)}>
                  {h.name}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* ล้างตัวกรอง */}
          <Box sx={{ display: "flex", alignItems: "flex-end" }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={resetFilters}
              sx={{
                borderColor: "#d1d5db",
                color: "#374151",
                height: 40,
                "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" },
              }}
            >
              ล้างตัวกรอง
            </Button>
          </Box>
        </Box>

        {/* ── Table ── */}
        <TableContainer sx={{ mt: 2 }}>
          <Table size="small" sx={{ tableLayout: "fixed" }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#036245" }}>
                {[
                  { label: "ลำดับ", width: "8%" },
                  { label: "กลุ่มจัดการสิทธิ์", width: "22%" },
                  { label: "ระดับบัญชี", width: "18%" },
                  { label: "โซนสถานพยาบาล", width: "15%" },
                  { label: "สถานพยาบาล", width: "15%" },
                  { label: "ผู้ใช้งาน", width: "8%" },
                  { label: "รายละเอียด", width: "14%" },
                ].map((col) => (
                  <TableCell
                    key={col.label}
                    sx={{
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      whiteSpace: "nowrap",
                      width: col.width,
                    }}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} sx={{ color: "#036245" }} />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: "#9ca3af" }}>
                    ไม่พบข้อมูล
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item: any, idx: number) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{
                      cursor: "pointer",
                      "&:nth-of-type(even)": { bgcolor: "#f0fdf4" },
                      "&:hover": { bgcolor: "#dcfce7" },
                    }}
                  >
                    <TableCell align="center">{getDisplayNo(idx)}</TableCell>
                    <TableCell>
                      <Tooltip title={item.name || ""} arrow>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {item.name || "ยังไม่มีกลุ่มจัดการสิทธิ์"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      {item.name || "ไม่มีประเภท"}
                    </TableCell>
                    <TableCell align="center">
                      {item.zone?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={item.hospital?.name || ""} arrow>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                          {item.hospital?.name || "-"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      {item.userCount || "-"}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleRead(item)}
                          sx={{
                            bgcolor: "#3b82f6",
                            color: "#fff",
                            width: 30,
                            height: 30,
                            "&:hover": { bgcolor: "#2563eb" },
                          }}
                        >
                          <FindInPageIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(item)}
                          sx={{
                            bgcolor: "#eab308",
                            color: "#fff",
                            width: 30,
                            height: 30,
                            "&:hover": { bgcolor: "#ca8a04" },
                          }}
                        >
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(item)}
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── Thai Pagination ── */}
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", mt: 2, gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ color: "#374151" }}>แถวต่อหน้า</Typography>
            <Select
              size="small"
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
              sx={{ ...selectSx, minWidth: 70 }}
            >
              {[10, 25, 50].map((n) => (
                <MenuItem key={n} value={n}>{n}</MenuItem>
              ))}
            </Select>
            <Typography variant="body2" sx={{ color: "#6B7280", ml: 1 }}>
              ทั้งหมด {totalCount} รายการ
            </Typography>
          </Box>
          {totalPages > 0 && (
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              shape="rounded"
              size="small"
              sx={{
                "& .MuiPaginationItem-root.Mui-selected": {
                  bgcolor: "#036245",
                  color: "#fff",
                  "&:hover": { bgcolor: "#024d36" },
                },
              }}
            />
          )}
        </Box>
      </Box>

      {/* ── Delete Confirmation Modal ── */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {/* Header — red gradient */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 1.5,
            background: "linear-gradient(135deg, #fecaca, #fef2f2)",
            borderBottom: "1px solid #fca5a5",
          }}
        >
          <Typography sx={{ fontWeight: 700, color: "#991b1b" }}>
            ยืนยันการดำเนินการนี้
          </Typography>
          <IconButton size="small" onClick={() => setDeleteOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ py: 3 }}>
          <Typography>
            ต้องการลบ &quot;{deleteTarget?.name}&quot; หรือไม่
          </Typography>
        </DialogContent>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setDeleteOpen(false)}
            sx={{ borderColor: "#d1d5db", color: "#374151" }}
          >
            ยกเลิก
          </Button>
          <Button
            variant="outlined"
            onClick={confirmDelete}
            disabled={deleteLoading}
            sx={{ borderColor: "#374151", color: "#374151" }}
          >
            {deleteLoading ? <CircularProgress size={20} /> : "ยืนยัน"}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
