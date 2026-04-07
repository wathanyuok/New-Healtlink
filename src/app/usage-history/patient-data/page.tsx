"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Card,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Stack,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Grid,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterAltOff as ClearFilterIcon,
} from "@mui/icons-material";
import api from "@/lib/api";
import { useHospitalStore } from "@/stores/hospitalStore";

interface PatientViewerLog {
  id: number;
  createdAt: string;
  patientFullName: string;
  patientCid: string;
  hospital: string;
  userFullname: string;
  user?: {
    role?: { name: string };
  };
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear() + 543;
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export default function PatientDataHistoryPage() {
  const hospitalStore = useHospitalStore();

  const [logs, setLogs] = useState<PatientViewerLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientIdCard, setPatientIdCard] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState<number | "">("");

  // Options
  const [hospitals, setHospitals] = useState<any[]>([]);

  // Debounce
  const debounceRef = useRef<NodeJS.Timeout>();

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        offset: page + 1,
        limit: rowsPerPage,
      };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (patientName) params.patientFullName = patientName;
      if (patientIdCard) params.patientCid = patientIdCard;
      if (hospitalFilter) params.hospital = hospitalFilter;

      const response = await api.get(
        "main-service/log/user/patientHistoryView/findAndCount",
        { params }
      );
      setLogs(response.data?.rows || []);
      setTotalCount(response.data?.count || 0);
    } catch (err) {
      setError("ไม่สามารถโหลดข้อมูลได้");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, startDate, endDate, patientName, patientIdCard, hospitalFilter]);

  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const data = await hospitalStore.getOptionHospital({ limit: 10000 });
        setHospitals(Array.isArray(data) ? data : data?.hospitals || []);
      } catch (err) {
        console.error("Failed to load hospitals:", err);
      }
    };
    loadHospitals();
  }, [hospitalStore]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleDebouncedSearch = (setter: (val: string) => void, value: string) => {
    setter(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPage(0), 500);
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setPatientName("");
    setPatientIdCard("");
    setHospitalFilter("");
    setPage(0);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        ประวัติการเข้าดูข้อมูลผู้ป่วย
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ p: 2 }}>
        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 2 }} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="วันที่เริ่มต้น"
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="วันที่สิ้นสุด"
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              placeholder="ค้นหาชื่อผู้ป่วย"
              value={patientName}
              onChange={(e) => handleDebouncedSearch(setPatientName, e.target.value)}
              size="small"
              fullWidth
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: "grey.400" }} /> }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              placeholder="ค้นหาเลขบัตรประชาชน"
              value={patientIdCard}
              onChange={(e) => handleDebouncedSearch(setPatientIdCard, e.target.value)}
              size="small"
              fullWidth
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: "grey.400" }} /> }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>โรงพยาบาล</InputLabel>
              <Select
                value={hospitalFilter}
                label="โรงพยาบาล"
                onChange={(e) => { setHospitalFilter(e.target.value as number); setPage(0); }}
              >
                <MenuItem value="">ทั้งหมด</MenuItem>
                {hospitals.map((h: any) => (
                  <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="outlined"
              startIcon={<ClearFilterIcon />}
              onClick={handleClearFilters}
              fullWidth
              size="small"
              sx={{ height: 40 }}
            >
              ล้างตัวกรอง
            </Button>
          </Grid>
        </Grid>

        {/* Table */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#036245" }}>
                  <TableRow>
                    {["วันที่เข้าดู", "ชื่อผู้ป่วย", "เลขบัตรประชาชน", "โรงพยาบาล", "ชื่อผู้เข้าใช้งาน", "ระดับบัญชี"].map(
                      (header) => (
                        <TableCell key={header} sx={{ color: "white", fontWeight: 600 }}>
                          {header}
                        </TableCell>
                      )
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">ไม่พบข้อมูล</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow
                        key={log.id}
                        sx={{ "&:nth-of-type(odd)": { bgcolor: "#f0fdf4" } }}
                      >
                        <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                        <TableCell>
                          <Tooltip title={log.patientFullName || ""}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                              {log.patientFullName || "-"}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{log.patientCid || "-"}</TableCell>
                        <TableCell>
                          <Tooltip title={log.hospital || ""}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                              {log.hospital || "-"}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={log.userFullname || ""}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                              {log.userFullname || "-"}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{log.user?.role?.name || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              labelRowsPerPage="แสดง"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count} รายการ`}
            />
          </>
        )}
      </Card>
    </Box>
  );
}

