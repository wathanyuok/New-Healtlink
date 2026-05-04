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
  Checkbox,
  ListItemText,
  ListSubheader,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CloseIcon from "@mui/icons-material/Close";

/* Extend HTMLInputElement for showPicker */
declare global {
  interface HTMLInputElement {
    showPicker?: () => void;
  }
}
import { useSystemLogsStore } from "@/stores/systemLogsStore";
import { useHospitalStore } from "@/stores/hospitalStore";

/* ── Shared select styling ── */
const selectSx = {
  bgcolor: "#F8FFFE",
  borderRadius: 1,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#00AF75" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#00AF75" },
};

/* ── Dropdown MenuProps ── */
const dropdownMenuProps = { PaperProps: { sx: { maxHeight: 240 } } };

/* ── Activity type options ── */
const ACTIVITY_OPTIONS = [
  { name: "เข้าดูข้อมูล", value: "View" },
  { name: "แก้ไขข้อมูล", value: "Edit" },
  { name: "ลบข้อมูล", value: "Delete" },
  { name: "เข้าสู่ระบบ", value: "Login" },
  { name: "ออกจากระบบ", value: "Logout" },
];

/* ── Activity text mapper (plain text, NOT chips) ── */
const ACTIVITY_MAP: Record<string, string> = {
  Login: "เข้าสู่ระบบ",
  Logout: "ออกจากระบบ",
  View: "เข้าดูข้อมูล",
  Edit: "แก้ไขข้อมูล",
  Delete: "ลบข้อมูล",
};

/* ── Format date to dd/mm/yyyy HH:mm ── */
function formatDateTime(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SystemUsageHistoryPage() {
  const logsStore = useSystemLogsStore();
  const hospitalStore = useHospitalStore();

  /* ── Data state ── */
  const [items, setItems] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Filter state ── */
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userFullname, setUserFullname] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>([]);
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [activityType, setActivityType] = useState<string>("");

  /* ── Options state ── */
  const [hospitalOptions, setHospitalOptions] = useState<any[]>([]);
  const [roleOptions, setRoleOptions] = useState<any[]>([]);

  /* ── Date range picker state ── */
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement | null>(null);

  // Close date picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setDatePickerOpen(false);
      }
    };
    if (datePickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [datePickerOpen]);

  /* Format date range display text */
  const dateRangeDisplay = startDate && endDate
    ? `${startDate.split("-").reverse().join("/")} - ${endDate.split("-").reverse().join("/")}`
    : startDate
    ? `${startDate.split("-").reverse().join("/")} - ...`
    : "";

  /* Debounce ref */
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  /* ── Fetch options ── */
  const fetchOptions = useCallback(async () => {
    try {
      const [hospitalRes, roleRes] = await Promise.all([
        hospitalStore.getOptionHospital({ offset: 1, limit: 10000 }),
        hospitalStore.getOptionRole({ offset: 1, limit: 10000, search: "" }),
      ]);
      setHospitalOptions(hospitalRes?.hospitals || []);
      // API returns { roles: [...] } from auth-service/role/findAndCount
      const rolesArr = roleRes?.roles || (Array.isArray(roleRes) ? roleRes : []);
      setRoleOptions(rolesArr);
    } catch (err) {
      console.error("Error fetching options:", err);
    }
  }, []);

  /* ── Fetch main data ── */
  const doFetch = useCallback(async (
    p: number,
    limit: number,
    sDate: string,
    eDate: string,
    fullname: string,
    role: string,
    hospitals: string[],
    activity: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        offset: p,
        limit,
      };
      if (sDate) params.startDate = sDate;
      if (eDate) params.endDate = eDate;
      if (fullname.trim()) params.userFullname = fullname.trim();
      if (role) params.roleId = role;
      if (hospitals.length > 0) params.hospitalId = hospitals.join(",");
      if (activity) params.text = activity;

      const res = await logsStore.findAndCountSystemLogs(params);
      // API response: { logUserLogins: [...], totalCount: N }
      const rows = res?.logUserLogins || res?.rows || [];
      const count = res?.totalCount ?? res?.count ?? rows.length;
      setItems(rows);
      setTotalCount(count);
    } catch (err) {
      setError("ไม่สามารถโหลดข้อมูลได้");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Initial load ── */
  useEffect(() => {
    fetchOptions();
    doFetch(1, rowsPerPage, "", "", "", "", [], "");
  }, []);

  /* ── Refetch on filter/page changes (non-debounced) ── */
  const refetch = useCallback(() => {
    doFetch(page, rowsPerPage, startDate, endDate, userFullname, roleFilter, selectedHospitals, activityType);
  }, [page, rowsPerPage, startDate, endDate, userFullname, roleFilter, selectedHospitals, activityType]);

  useEffect(() => {
    refetch();
  }, [page, rowsPerPage, startDate, endDate, roleFilter, selectedHospitals, activityType]);

  /* ── Debounced search for text input ── */
  const handleTextSearchChange = (value: string) => {
    setUserFullname(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      doFetch(1, rowsPerPage, startDate, endDate, value, roleFilter, selectedHospitals, activityType);
    }, 500);
  };

  /* ── Reset filters ── */
  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setUserFullname("");
    setRoleFilter("");
    setSelectedHospitals([]);
    setHospitalSearch("");
    setActivityType("");
    setPage(1);
    doFetch(1, rowsPerPage, "", "", "", "", [], "");
  };

  /* ── Filtered hospital options for search ── */
  const filteredHospitals = hospitalSearch
    ? hospitalOptions.filter((h: any) =>
        h.name?.toLowerCase().includes(hospitalSearch.toLowerCase())
      )
    : hospitalOptions;

  /* ── Running number ── */
  const getDisplayNo = (index: number) => (page - 1) * rowsPerPage + index + 1;

  /* ── Pagination ── */
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  /* ════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════ */
  return (
    <Box sx={{ width: "100%" }}>
      {/* ── Title ── */}
      <Typography variant="h5" sx={{ fontWeight: 700, color: "#036245", mb: 3 }}>
        ประวัติการเข้าใช้งานระบบ
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* ── Filter panel + Table ── */}
      <Box sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: 2, p: 2.5 }}>
        {/* Filters row — 6 columns matching Nuxt grid-cols-6 */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(6, 1fr)" }, gap: 2, mb: 2 }}>
          {/* ช่วงเวลาการเข้าดู — Thai date range picker */}
          <Box ref={datePickerRef} sx={{ position: "relative" }}>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>ช่วงเวลาการเข้าดู</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="เลือกช่วงเวลาการเข้าดู"
              value={dateRangeDisplay}
              onClick={() => setDatePickerOpen((v) => !v)}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    {dateRangeDisplay ? (
                      <CloseIcon
                        sx={{ color: "#9ca3af", fontSize: 20, cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setStartDate("");
                          setEndDate("");
                          setDatePickerOpen(false);
                          setPage(1);
                        }}
                      />
                    ) : (
                      <CalendarTodayIcon sx={{ color: "#9ca3af", fontSize: 20 }} />
                    )}
                  </InputAdornment>
                ),
              }}
              sx={{ cursor: "pointer", "& input": { cursor: "pointer" } }}
            />
            {datePickerOpen && (
              <Box
                sx={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  zIndex: 10,
                  bgcolor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 2,
                  boxShadow: 3,
                  p: 2,
                  mt: 0.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  minWidth: 260,
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: "#374151", fontWeight: 600 }}>วันเริ่มต้น</Typography>
                  <Box sx={{ position: "relative" }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="วว/ดด/ปปปป"
                      value={startDate ? startDate.split("-").reverse().join("/") : ""}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <CalendarTodayIcon sx={{ color: "#374151", fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ cursor: "pointer", "& input": { cursor: "pointer" } }}
                      onClick={() => {
                        const el = document.getElementById("sys-date-start-hidden");
                        if (el) el.showPicker?.();
                      }}
                    />
                    <input
                      id="sys-date-start-hidden"
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (!endDate || e.target.value > endDate) setEndDate(e.target.value);
                        setPage(1);
                      }}
                      style={{ position: "absolute", opacity: 0, width: 0, height: 0, top: 0, left: 0, pointerEvents: "none" }}
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "#374151", fontWeight: 600 }}>วันสิ้นสุด</Typography>
                  <Box sx={{ position: "relative" }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="วว/ดด/ปปปป"
                      value={endDate ? endDate.split("-").reverse().join("/") : ""}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <CalendarTodayIcon sx={{ color: "#374151", fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ cursor: "pointer", "& input": { cursor: "pointer" } }}
                      onClick={() => {
                        const el = document.getElementById("sys-date-end-hidden");
                        if (el) el.showPicker?.();
                      }}
                    />
                    <input
                      id="sys-date-end-hidden"
                      type="date"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                      style={{ position: "absolute", opacity: 0, width: 0, height: 0, top: 0, left: 0, pointerEvents: "none" }}
                    />
                  </Box>
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => setDatePickerOpen(false)}
                  sx={{ bgcolor: "#00AF75", "&:hover": { bgcolor: "#009966" }, alignSelf: "flex-end" }}
                >
                  ตกลง
                </Button>
              </Box>
            )}
          </Box>

          {/* ค้นหาชื่อผู้ใช้งาน */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>ค้นหาชื่อผู้ใช้งาน</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="ค้นหาชื่อผู้ใช้งาน"
              value={userFullname}
              onChange={(e) => handleTextSearchChange(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon sx={{ color: "#9ca3af" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* ระดับบัญชี */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>ระดับบัญชี</Typography>
            <Select
              fullWidth
              size="small"
              displayEmpty
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              sx={selectSx}
              MenuProps={dropdownMenuProps}
            >
              <MenuItem value="">ทั้งหมด</MenuItem>
              {roleOptions.map((r: any) => (
                <MenuItem key={r.id} value={String(r.id)}>
                  {r.name}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* โรงพยาบาล — multiple + searchable matching Nuxt */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>โรงพยาบาล</Typography>
            <Select
              fullWidth
              size="small"
              multiple
              displayEmpty
              value={selectedHospitals}
              onChange={(e) => {
                const val = e.target.value as string[];
                setSelectedHospitals(val);
                setPage(1);
              }}
              renderValue={(selected) => {
                if ((selected as string[]).length === 0) return "ทั้งหมด";
                return (selected as string[])
                  .map((id) => hospitalOptions.find((h: any) => String(h.id) === id)?.name || id)
                  .join(", ");
              }}
              sx={selectSx}
              MenuProps={{
                PaperProps: { sx: { maxHeight: 300 } },
                autoFocus: false,
              }}
              onClose={() => setHospitalSearch("")}
            >
              <ListSubheader sx={{ bgcolor: "#fff", p: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="เลือกสถานพยาบาล"
                  value={hospitalSearch}
                  onChange={(e) => setHospitalSearch(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <SearchIcon sx={{ color: "#9ca3af", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </ListSubheader>
              {filteredHospitals.map((h: any) => (
                <MenuItem key={h.id} value={String(h.id)}>
                  <Checkbox size="small" checked={selectedHospitals.includes(String(h.id))} />
                  <ListItemText primary={h.name} />
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* ประเภทการใช้งานระบบ */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>ประเภทการใช้งานระบบ</Typography>
            <Select
              fullWidth
              size="small"
              displayEmpty
              value={activityType}
              onChange={(e) => { setActivityType(e.target.value); setPage(1); }}
              sx={selectSx}
              MenuProps={dropdownMenuProps}
            >
              <MenuItem value="">ทั้งหมด</MenuItem>
              {ACTIVITY_OPTIONS.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.name}
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
                  { label: "วัน/เวลาที่รักษา", width: "12%" },
                  { label: "ชื่อผู้ใช้งาน", width: "12%" },
                  { label: "ชื่อผู้ใช้", width: "12%" },
                  { label: "ระดับบัญชี", width: "12%" },
                  { label: "กลุ่มสิทธิ์", width: "14%" },
                  { label: "สถานพยาบาล", width: "15%" },
                  { label: "ประเภทการใช้งาน", width: "15%" },
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
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} sx={{ color: "#036245" }} />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: "#9ca3af" }}>
                    ไม่พบข้อมูล
                  </TableCell>
                </TableRow>
              ) : (
                items.map((log: any, idx: number) => (
                  <TableRow
                    key={log.id}
                    hover
                    sx={{ "&:nth-of-type(even)": { bgcolor: "#f0fdf4" } }}
                  >
                    <TableCell>{getDisplayNo(idx)}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={log.userFullname || ""} arrow>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                          {log.userFullname || "-"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={log.username || ""} arrow>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                          {log.username || "-"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {log.user?.role?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={log.user?.permissionGroup?.name || ""} arrow>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                          {log.user?.permissionGroup?.name || "-"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={log.user?.permissionGroup?.hospital?.name || ""} arrow>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                          {log.user?.permissionGroup?.hospital?.name || "-"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {ACTIVITY_MAP[log.text] || log.text || "-"}
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
    </Box>
  );
}
