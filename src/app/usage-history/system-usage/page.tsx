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
  Chip,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterAltOff as ClearFilterIcon,
} from "@mui/icons-material";
import api from "@/lib/api";
import { useHospitalStore } from "@/stores/hospitalStore";

interface LoginLog {
  id: number;
  createdAt: string;
  username: string;
  userFullname: string;
  text: string;
  user?: {
    role?: { name: string };
    permissionGroup?: {
      name: string;
      hospital?: { name: string };
    };
  };
}

const ACTIVITY_TYPES = [
  { name: "ทั้งหมด", value: "" },
  { name: "เข้าดูข้อมูล", value: "View" },
  { name: "แก้ไขข้อมูล", value: "Edit" },
  { name: "ลบข้อมูล", value: "Delete" },
  { name: "เข้าสู่ระบบ", value: "Login" },
  { name: "ออกจากระบบ", value: "Logout" },
];

const ACTIVITY_LABEL_MAP: Record<string, { label: string; color: string }> = {
  View: { label: "เข้าดูข้อมูล", color: "#3B82F6" },
  Edit: { label: "แก้ไขข้อมูล", color: "#F59E0B" },
  Delete: { label: "ลบข้อมูล", color: "#EF4444" },
  Login: { label: "เข้าสู่ระบบ", color: "#10B981" },
  Logout: { label: "ออกจากระบบ", color: "#6B7280" },
};

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

export default function SystemUsageHistoryPage() {
  const hospitalStore = useHospitalStore();

  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userFullname, setUserFullname] = useState("");
  const [activityType, setActivityType] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState<number | "">("");
  const [roleFilter, setRoleFilter] = useState<number | "">("");

  // Options
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

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
      if (userFullname) params.userFullname = userFullname;
      if (activityType) params.text = activityType;
      if (hospitalFilter) params.hospitalId = hospitalFilter;
      if (roleFilter) params.roleId = roleFilter;

      const response = await api.get(
        "auth-service/log/user/login/findAndCount",
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
  }, [page, rowsPerPage, startDate, endDate, userFullname, activityType, hospitalFilter, roleFilter]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [hospitalData, roleData] = await Promise.all([
          hospitalStore.getOptionHospital({ limit: 10000 }),
          hospitalStore.getOptionRole(),
        ]);
        setHospitals(Array.isArray(hospitalData) ? hospitalData : hospitalData?.hospitals || []);
        setRoles(Array.isArray(roleData) ? roleData : []);
      } catch (err) {
        console.error("Failed to load options:", err);
      }
    };
    loadOptions();
  }, [hospitalStore]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleDebouncedSearch = (value: string) => {
    setUserFullname(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPage(0), 500);
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setUserFullname("");
    setActivityType("");
    setHospitalFilter("");
    setRoleFilter("");
    setPage(0);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        ประวัติการเข้าใช้งานระบบ
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
              placeholder="ค้นหาชื่อผู้ใช้งาน"
              value={userFullname}
              onChange={(e) => handleDebouncedSearch(e.target.value)}
              size="small"
              fullWidth
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: "grey.400" }} /> }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={1.5}>
            <FormControl size="small" fullWidth>
              <InputLabel>ระดับบัญชี</InputLabel>
              <Select
                value={roleFilter}
                label="ระดับบัญชี"
                onChange={(e) => { setRoleFilter(e.target.value as number); setPage(0); }}
              >
                <MenuItem value="">ทั้งหมด</MenuItem>
                {roles.map((r: any) => (
                  <MenuItem key={r.id} value={r.id}>{r.displayName || r.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={1.5}>
            <FormControl size="small" fullWidth>
              <InputLabel>ประเภทการใช้งาน</InputLabel>
              <Select
                value={activityType}
                label="ประเภทการใช้งาน"
                onChange={(e) => { setActivityType(e.target.value); setPage(0); }}
              >
                {ACTIVITY_TYPES.map((t) => (
                  <MenuItem key={t.value || "all"} value={t.value}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={1.5}>
            <FormControl size="small" fullWidth>
              <InputLabel>สถานพยาบาล</InputLabel>
              <Select
                value={hospitalFilter}
                label="สถานพยาบาล"
                onChange={(e) => { setHospitalFilter(e.target.value as number); setPage(0); }}
              >
                <MenuItem value="">ทั้งหมด</MenuItem>
                {hospitals.map((h: any) => (
                  <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={1.5}>
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
                    {["ลำดับ", "วัน/เวลา", "ชื่อผู้ใช้งาน", "ชื่อผู้ใช้", "ระดับบัญชี", "กลุ่มสิทธิ์", "สถานพยาบาล", "ประเภทการใช้งาน"].map(
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
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">ไม่พบข้อมูล</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log, index) => {
                      const activity = ACTIVITY_LABEL_MAP[log.text] || { label: log.text || "-", color: "#999" };
                      return (
                        <TableRow
                          key={log.id}
                          sx={{ "&:nth-of-type(odd)": { bgcolor: "#f0fdf4" } }}
                        >
                          <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateTime(log.createdAt)}</TableCell>
                          <TableCell>
                            <Tooltip title={log.username || ""}>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>
                                {log.username || "-"}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={log.userFullname || ""}>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>
                                {log.userFullname || "-"}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>{log.user?.role?.name || "-"}</TableCell>
                          <TableCell>{log.user?.permissionGroup?.name || "-"}</TableCell>
                          <TableCell>
                            <Tooltip title={log.user?.permissionGroup?.hospital?.name || ""}>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                {log.user?.permissionGroup?.hospital?.name || "-"}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={activity.label}
                              size="small"
                              sx={{
                                bgcolor: activity.color,
                                color: "white",
                                fontWeight: 600,
                                fontSize: "0.7rem",
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
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
