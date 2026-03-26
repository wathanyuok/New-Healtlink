"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  List, ListItemButton, ListItemIcon, ListItemText,
  Collapse, Box, SvgIcon,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

/* ────── Custom SVG icon wrapper ────── */
function SidebarIcon({ children, ...props }: { children: React.ReactNode } & any) {
  return (
    <SvgIcon {...props} sx={{ fontSize: 22, color: "#fff", ...props.sx }}>
      {children}
    </SvgIcon>
  );
}

/* ────── Icon components ────── */
const DashboardIcon = () => (
  <SidebarIcon viewBox="0 0 24 24">
    <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" fill="currentColor" />
  </SidebarIcon>
);

const MonitorIcon = () => (
  <SidebarIcon viewBox="0 0 24 24">
    <path d="M4 3h16a2 2 0 012 2v10a2 2 0 01-2 2h-6v2h3v2H7v-2h3v-2H4a2 2 0 01-2-2V5a2 2 0 012-2zm0 2v10h16V5H4zm9 2l3 3-3 3v-2H8V9h5V7z" fill="currentColor" />
  </SidebarIcon>
);

const ReferralIcon = () => (
  <SidebarIcon viewBox="0 0 24 24">
    <path d="M16 4h-2V2h-4v2H8a2 2 0 00-2 2v1h12V6a2 2 0 00-2-2zM4 8v11a2 2 0 002 2h12a2 2 0 002-2V8H4zm4 9H6v-2h2v2zm0-4H6v-2h2v2zm4 4h-2v-2h2v2zm0-4h-2v-2h2v2zm4 4h-2v-2h2v2zm0-4h-2v-2h2v2z" fill="currentColor" />
  </SidebarIcon>
);

const UserSettingsIcon = () => (
  <SidebarIcon viewBox="0 0 24 24">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-1 2c-2.67 0-8 1.34-8 4v2h12v-2c0-1.1-.56-1.95-1.36-2.62M19.43 18.02l.74-.74c.18-.18.18-.47 0-.65l-.41-.41a.465.465 0 00-.65 0l-.74.74-1.68-1.68-.36.36a4.4 4.4 0 01-.52 3.52l1.94 1.94.36-.36-1.68-1.68.74-.74c.18-.18.47-.18.65 0l.41.41c.18.18.18.47 0 .65l-.74.74 1.94 1.94" fill="currentColor" />
  </SidebarIcon>
);

const HospitalIcon = () => (
  <SidebarIcon viewBox="0 0 24 24">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" fill="currentColor" />
  </SidebarIcon>
);

const MapPointIcon = () => (
  <SidebarIcon viewBox="0 0 24 24">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" fill="currentColor" />
  </SidebarIcon>
);

const NoteAddIcon = () => (
  <SidebarIcon viewBox="0 0 24 24">
    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 14h-3v3h-2v-3H8v-2h3v-3h2v3h3v2zm-3-7V3.5L18.5 9H13z" fill="currentColor" />
  </SidebarIcon>
);

const HistoryIcon = () => (
  <SidebarIcon viewBox="0 0 24 24">
    <path d="M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0013 21a9 9 0 000-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" fill="currentColor" />
  </SidebarIcon>
);

/* ────── Menu Structure ────── */
interface MenuItem {
  name: string;
  icon: React.ReactNode;
  path: string;
  children?: { name: string; path: string }[];
}

const DRAWER_WIDTH = 280;
const DRAWER_COLLAPSED = 75;
const NAVBAR_HEIGHT = 74;

const allMenuItems: MenuItem[] = [
  {
    name: "แดชบอร์ด",
    icon: <DashboardIcon />,
    path: "/dashboard",
    children: [
      { name: "แดชบอร์ดรวม", path: "/dashboard" },
      { name: "Refer In", path: "/dashboard/refer-in" },
      { name: "Refer Out", path: "/dashboard/refer-out" },
    ],
  },
  {
    name: "ติดตามการส่งตัว",
    icon: <MonitorIcon />,
    path: "/follow-delivery",
  },
  {
    name: "รับ-ส่งตัวผู้ป่วย",
    icon: <ReferralIcon />,
    path: "/refer",
    children: [
      { name: "สร้างใบส่งตัว", path: "/create" },
      { name: "ส่งตัวผู้ป่วยออก (Refer Out)", path: "/refer-out/all" },
      { name: "รับผู้ป่วยเข้า (Refer In)", path: "/refer-in/all" },
      { name: "ส่งตัวกลับ (Refer Back)", path: "/refer-back/all" },
      { name: "พิจารณารับตัวกลับ", path: "/refer-receive/all" },
      { name: "ร้องขอส่งตัว (Request Refer)", path: "/request-refer-out/all" },
      { name: "พิจารณาคำร้องขอให้ส่งตัว", path: "/request-refer-back/all" },
    ],
  },
  {
    name: "ตั้งค่าผู้ใช้",
    icon: <UserSettingsIcon />,
    path: "/management/permission-group",
    children: [
      { name: "จัดการกลุ่มสิทธิ์", path: "/management/permission-group" },
      { name: "จัดการบัญชีผู้ใช้งาน", path: "/management/user-account" },
    ],
  },
  {
    name: "ตั้งค่าสถานพยาบาล",
    icon: <HospitalIcon />,
    path: "/management/hospital",
  },
  {
    name: "ตั้งค่าจุดรับส่ง",
    icon: <MapPointIcon />,
    path: "/setting-delivery-point",
    children: [
      { name: "จุดรับ-ส่งตัวผู้ป่วย", path: "/setting-delivery-point/default-settings" },
      { name: "สาขา/แผนกที่ส่งตัว", path: "/setting-delivery-point/docter-branch" },
    ],
  },
  {
    name: "ตั้งค่าสาเหตุและเหตุผล",
    icon: <NoteAddIcon />,
    path: "/setting-reason",
    children: [
      { name: "เหตุผล", path: "/setting-reason/reason-for-transfer" },
      { name: "สาเหตุ", path: "/setting-reason/cause-for-refer" },
    ],
  },
  {
    name: "ประวัติการเข้าใช้งาน",
    icon: <HistoryIcon />,
    path: "/usage-history",
    children: [
      { name: "ประวัติการเข้าดูข้อมูลผู้ป่วย", path: "/usage-history/patient-data" },
      { name: "ประวัติการเข้าใช้งานระบบ", path: "/usage-history/system-usage" },
    ],
  },
];

// TODO: เปิดเมนูอื่นๆ เมื่อ port เสร็จแล้ว
const enabledPaths = new Set(["/dashboard"]);

const menuItems: MenuItem[] = allMenuItems.filter((item) => item.path === "/dashboard");

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>(["/dashboard"]);

  const expanded = hovered;

  const toggleMenu = (path: string) => {
    setOpenMenus((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const isActive = (path: string) => pathname === path;
  const isParentActive = (item: MenuItem) =>
    item.children?.some((c) => pathname === c.path || pathname?.startsWith(c.path + "/")) ||
    pathname === item.path || pathname?.startsWith(item.path + "/");

  const currentWidth = expanded ? DRAWER_WIDTH : DRAWER_COLLAPSED;

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        position: "fixed",
        left: 0,
        top: NAVBAR_HEIGHT,
        height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        width: currentWidth,
        background: "linear-gradient(0deg, #46BEE8 0%, #24D89D 100%)",
        color: "#fff",
        transition: "width 0.25s ease-in-out",
        overflowX: "hidden",
        overflowY: "auto",
        zIndex: 1200,
        boxShadow: expanded ? "4px 0 16px rgba(0,0,0,0.15)" : "2px 0 8px rgba(0,0,0,0.1)",
      }}
    >
      {/* Menu items */}
      <List sx={{ pt: 2, px: 1 }}>
        {menuItems.map((item) => (
          <Box key={item.path} sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => (item.children ? toggleMenu(item.path) : router.push(item.path))}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                py: 1.5,
                px: expanded ? 1.5 : 1,
                bgcolor: isParentActive(item) ? "rgba(255,255,255,0.25)" : "transparent",
                boxShadow: isParentActive(item) ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
                justifyContent: expanded ? "initial" : "center",
                minHeight: 48,
              }}
            >
              <ListItemIcon sx={{
                color: "#fff", minWidth: expanded ? 40 : "auto",
                justifyContent: "center",
              }}>
                {item.icon}
              </ListItemIcon>
              {expanded && (
                <>
                  <ListItemText
                    primary={item.name}
                    primaryTypographyProps={{ fontSize: 14, fontWeight: 500, whiteSpace: "nowrap" }}
                  />
                  {item.children && (
                    openMenus.includes(item.path) ? <ExpandLess /> : <ExpandMore />
                  )}
                </>
              )}
            </ListItemButton>

            {/* Children submenu */}
            {expanded && item.children && (
              <Collapse in={openMenus.includes(item.path)} timeout="auto">
                <List component="div" disablePadding sx={{ ml: 3, borderLeft: "1px solid rgba(255,255,255,0.2)", pl: 2 }}>
                  {item.children.map((child) => {
                    const disabled = !enabledPaths.has(child.path);
                    return (
                      <ListItemButton
                        key={child.path}
                        disabled={disabled}
                        onClick={() => !disabled && router.push(child.path)}
                        sx={{
                          borderRadius: 1.5,
                          mb: 0.3,
                          py: 1,
                          bgcolor: isActive(child.path) ? "rgba(255,255,255,0.25)" : "transparent",
                          "&:hover": { bgcolor: disabled ? "transparent" : "rgba(255,255,255,0.1)" },
                          opacity: disabled ? 0.45 : 1,
                          cursor: disabled ? "not-allowed" : "pointer",
                          "&.Mui-disabled": { opacity: 0.45, color: "#fff" },
                        }}
                      >
                        <ListItemText
                          primary={disabled ? `${child.name} (เร็วๆ นี้)` : child.name}
                          primaryTypographyProps={{
                            fontSize: 13,
                            fontWeight: isActive(child.path) ? 600 : 400,
                            whiteSpace: "nowrap",
                          }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Collapse>
            )}
          </Box>
        ))}
      </List>
    </Box>
  );
}

export { DRAWER_WIDTH, DRAWER_COLLAPSED, NAVBAR_HEIGHT };
