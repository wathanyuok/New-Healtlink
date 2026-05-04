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
import { usePatientLogsStore } from "@/stores/patientLogsStore";
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

/* ── Format date to Thai-style dd/mm/yyyy HH:mm ── */
function formatDateTime(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PatientDataHistoryPage() {
  const logsStore = usePatientLogsStore();
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
  const [patientName, setPatientName] = useState("");
  const [patientIdCard, setPatientIdCard] = useState("");
  const [selectedHospital, setSelectedHospital] = useState<string>("");

  /* ── Options state ── */
  const [hospitalOptions, setHospitalOptions] = useState<any[]>([]);

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

  /* ── Fetch hospital options ── */
  const fetchHospitalOptions = useCallback(async () => {
    try {
      const res = await hospitalStore.getOptionHospital({ offset: 1, limit: 10000 });
      setHospitalOptions(res?.hospitals || []);
    } catch (err) {
      console.error("Error fetching hospital options:", err);
    }
  }, []);

  /* ── Fetch main data ── */
  const doFetch = useCallback(async (
    p: number,
    limit: number,
    sDate: string,
    eDate: string,
    pName: string,
    pIdCard: string,
    hospital: string
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
      if (pName.trim()) params.patientFullName = pName.trim();
      if (pIdCard.trim()) params.patientCid = pIdCard.trim();
      if (hospital) params.hospital = hospital;

      const res = await logsStore.findAndCountPatientLogs(params);
      // API response: { logPatientHistoryViews: [...], totalCount: N }
      const rows = res?.logPatientHistoryViews || res?.rows || [];
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
    fetchHospitalOptions();
    doFetch(1, rowsPerPage, "", "", "", "", "");
  }, []);

  /* ── Refetch on filter/page changes (non-debounced) ── */
  const refetch = useCallback(() => {
    doFetch(page, rowsPerPage, startDate, endDate, patientName, patientIdCard, selectedHospital);
  }, [page, rowsPerPage, startDate, endDate, patientName, patientIdCard, selectedHospital]);

  useEffect(() => {
    refetch();
  }, [page, rowsPerPage, startDate, endDate, selectedHospital]);

  /* ── Debounced search for text inputs ── */
  const handleTextSearchChange = (setter: (val: string) => void, value: string) => {
    setter(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      doFetch(1, rowsPerPage, startDate, endDate,
        setter === setPatientName ? value : patientName,
        setter === setPatientIdCard ? value : patientIdCard,
        selectedHospital
      );
    }, 500);
  };

  /* ── Reset filters ── */
  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setPatientName("");
    setPatientIdCard("");
    setSelectedHospital("");
    setPage(1);
    doFetch(1, rowsPerPage, "", "", "", "", "");
  };

  /* ── Running number ── */
  const getDisplayNo = (index: number) => {
    return (page - 1) * rowsPerPage + index + 1;
  };

  /* ── Pagination ── */
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  /* ════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════ */
  return (
    <Box sx={{ width: "100%" }}>
      {/* ── Title ── */}
      <Typography variant="h5" sx={{ fontWeight: 700, color: "#036245", mb: 3 }}>
        ประวัติการเข้าดูข้อมูลผู้ป่วย
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* ── Filter panel + Table ── */}
      <Box sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: 2, p: 2.5 }}>
        {/* Filters row */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr 1fr 1fr" }, gap: 2, mb: 2 }}>
          {/* ช่วงเวลาการเข้าดู — Nuxt-style single field with calendar icon */}
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
                        const el = document.getElementById("date-start-hidden");
                        if (el) el.showPicker?.();
                      }}
                    />
                    <input
                      id="date-start-hidden"
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
                        const el = document.getElementById("date-end-hidden");
                        if (el) el.showPicker?.();
                      }}
                    />
                    <input
                      id="date-end-hidden"
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
          {/* ค้นหาชื่อผู้ป่วย */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>ค้นหาชื่อผู้ป่วย</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="ค้นหาชื่อ-นามสกุล"
              value={patientName}
              onChange={(e) => handleTextSearchChange(setPatientName, e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon sx={{ color: "#9ca3af" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          {/* ค้นหาเลขบัตรประชาชน */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>ค้นหาเลขบัตรประชาชน</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="ค้นหาเลขบัตรประชาชนผู้ป่วย"
              value={patientIdCard}
              onChange={(e) => handleTextSearchChange(setPatientIdCard, e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon sx={{ color: "#9ca3af" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          {/* โรงพยาบาล */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>โรงพยาบาล</Typography>
            <Select
              fullWidth
              size="small"
              displayEmpty
              value={selectedHospital}
              onChange={(e) => { setSelectedHospital(e.target.value); setPage(1); }}
              sx={selectSx}
              MenuProps={dropdownMenuProps}
            >
              <MenuItem value="">
                <em style={{ color: "#9ca3af" }}>เลือกโรงพยาบาล</em>
              </MenuItem>
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
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#036245" }}>
                {["ลำดับ", "วันที่เข้าดู", "ชื่อผู้ป่วย", "เลขบัตรประชาชน", "โรงพยาบาล", "ชื่อผู้เข้าใช้งาน", "ระดับบัญชี"].map(
                  (header) => (
                    <TableCell key={header} sx={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                      {header}
                    </TableCell>
                  )
                )}
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
                items.map((log, idx) => (
                  <TableRow
                    key={log.id}
                    hover
                    sx={{ "&:nth-of-type(even)": { bgcolor: "#f0fdf4" } }}
                  >
                    <TableCell sx={{ width: 60 }}>{getDisplayNo(idx)}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatDateTime(log.date || log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={log.patientFullName || ""} arrow>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                          {log.patientFullName || "-"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{log.patientCid || "-"}</TableCell>
                    <TableCell>
                      <Tooltip title={log.hospital || ""} arrow>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                          {log.hospital || "-"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={log.userFullname || ""} arrow>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                          {log.userFullname || "-"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {log.user?.role?.name || "-"}
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
        </Box>
      </Box>
    </Box>
  );
}
