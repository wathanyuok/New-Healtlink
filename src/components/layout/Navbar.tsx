"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Box, Typography, Select, MenuItem, FormControl,
  Avatar, Menu as MuiMenu, ListItemIcon, ListItemText, MenuItem as MuiMenuItem,
  TextField, InputAdornment, CircularProgress,
} from "@mui/material";
import {
  Logout as LogoutIcon,
  Person as PersonIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useAuthStore } from "@/stores/authStore";
import { NAVBAR_HEIGHT } from "./Sidebar";
import api from "@/lib/api";
import { MOCK_HOSPITALS } from "@/mocks/dashboardMock";

export default function Navbar() {
  const router = useRouter();
  const { profile, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const roleName = useMemo(() => (profile as any)?.permissionGroup?.role?.name || "", [profile]);
  const isSuperAdminHospital = roleName === "superAdminHospital";

  useEffect(() => {
    if (isSuperAdminHospital) return;
    const load = async () => {
      try {
        setLoading(true);
        const zoneId = (profile as any)?.permissionGroup?.zone?.id;
        const params: any = {};
        if (zoneId) params.zone = zoneId;
        const res = await api.get("main-service/hospital/find", { params: { ...params, offset: 1, limit: 10000 } });
        const data = res.data;
        const list = data?.data?.hospitals || data?.hospitals || [];
        const excludeId = (profile as any)?.permissionGroup?.hospital?.id;
        setHospitals(excludeId ? list.filter((h: any) => h.id !== excludeId) : list);
      } catch {
        console.warn("[MOCK] Hospital API unavailable, using mock data");
        setHospitals(MOCK_HOSPITALS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile, isSuperAdminHospital]);

  const filteredHospitals = useMemo(() => {
    if (!searchText) return hospitals;
    return hospitals.filter((h: any) => h.name?.toLowerCase().includes(searchText.toLowerCase()));
  }, [hospitals, searchText]);

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    router.push("/login");
  };

  return (
    <Box
      component="nav"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        height: NAVBAR_HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: { xs: 2, md: 3 },
        bgcolor: "#fff",
        borderBottom: "1px solid",
        borderColor: "divider",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* Left: Logo + App name */}
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", flexShrink: 0 }}
        onClick={() => router.push("/dashboard")}
      >
        <Image src="/images/logo.png" alt="HealthLink" width={50} height={50} style={{ objectFit: "contain" }} />
        <Typography sx={{
          color: "#00AF75", fontWeight: 500, fontSize: 14,
          whiteSpace: "nowrap",
          display: { xs: "none", md: "block" },
        }}>
          ระบบเชื่อมโยงข้อมูลสุขภาพ
        </Typography>
      </Box>

      {/* Right: Hospital selector + User profile */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, ml: "auto", minWidth: 0 }}>
        {/* Hospital selector dropdown */}
        {!isSuperAdminHospital ? (
          <FormControl size="small" sx={{ minWidth: { xs: 200, md: 400 } }}>
            <Select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              displayEmpty
              renderValue={(v) => {
                if (!v) return (
                  <Typography color="text.secondary" fontSize={14} noWrap>
                    ค้นหา/เลือกสถานพยาบาล...สำหรับสร้างใบส่งตัว
                  </Typography>
                );
                const h = hospitals.find((h: any) => String(h.id) === v);
                return <Typography fontSize={14} noWrap>{h?.name || v}</Typography>;
              }}
              MenuProps={{ PaperProps: { sx: { maxHeight: 400 } }, autoFocus: false }}
              sx={{
                bgcolor: "#F8FFFE",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E0E0E0" },
                borderRadius: 1,
              }}
            >
              <Box sx={{ px: 1.5, py: 1, position: "sticky", top: 0, bgcolor: "#fff", zIndex: 1 }}>
                <TextField
                  size="small" fullWidth placeholder="ค้นหาสถานพยาบาล..."
                  value={searchText} onChange={(e) => setSearchText(e.target.value)}
                  onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                />
              </Box>
              <MenuItem value="">
                <Typography color="text.secondary" fontSize={14}>-- ไม่เลือก --</Typography>
              </MenuItem>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}><CircularProgress size={24} /></Box>
              ) : filteredHospitals.length === 0 ? (
                <MenuItem disabled><Typography color="text.secondary" fontSize={14}>ไม่พบโรงพยาบาล</Typography></MenuItem>
              ) : (
                filteredHospitals.map((h: any) => (
                  <MenuItem key={h.id} value={String(h.id)}><Typography fontSize={14}>{h.name}</Typography></MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        ) : (
          (profile as any)?.permissionGroup?.hospital?.name && (
            <Box sx={{ px: 2, py: 1, borderRadius: 1, border: "1px solid", borderColor: "divider", bgcolor: "#F8FFFE" }}>
              <Typography fontSize={14}>{(profile as any).permissionGroup.hospital.name}</Typography>
            </Box>
          )
        )}

        {/* User profile */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", flexShrink: 0 }}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          <Avatar sx={{ bgcolor: "#E0E0E0", color: "#666", width: 40, height: 40 }}>
            {(profile?.fullName || profile?.username || "U").charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
            <Typography fontSize={14} fontWeight={600} lineHeight={1.3} noWrap>
              {profile?.fullName || profile?.username || ""}
            </Typography>
            <Typography fontSize={12} color="text.secondary" noWrap>
              {profile?.username}
            </Typography>
          </Box>
        </Box>

        <MuiMenu
          anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MuiMenuItem onClick={() => { setAnchorEl(null); router.push("/profile"); }}>
            <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
            <ListItemText>โปรไฟล์</ListItemText>
          </MuiMenuItem>
          <MuiMenuItem onClick={handleLogout}>
            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
            <ListItemText>ออกจากระบบ</ListItemText>
          </MuiMenuItem>
        </MuiMenu>
      </Box>
    </Box>
  );
}
