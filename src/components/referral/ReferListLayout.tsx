"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  Button,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  OutlinedInput,
  Popover,
  IconButton,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {
  AddCircleOutline as AddCircleIcon,
  Search as SearchIcon,
  FilterAltOff as ClearIcon,
  CalendarMonth as CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";

import { useAuthStore } from "@/stores/authStore";
import { useReferralStore } from "@/stores/referralStore";
import { useHospitalFormOptionsAll } from "@/hooks/useHospitalFormOptionsAll";
import TableReferralList from "./TableReferralList";
import { headerReferralTable } from "@/data/headerReferralTable";
import LoadingOverlay from "@/components/common/LoadingOverlay";

type ReferralType =
  | "referIn"
  | "referOut"
  | "referReceive"
  | "referBack"
  | "requestReferOut"
  | "requestReferBack"
  | "referIPD";

interface Props {
  pageName: string;
  referralType: ReferralType;
  networkType?: string;
}

type TabKey = "all" | "refer-opd" | "refer-ipd" | "refer-er";

const REFERRAL_TYPES = {
  REFER_OUT: { id: 1, name: "referOut" },
  REFER_BACK: { id: 2, name: "referBack" },
  REFER_IN: { id: 3, name: "referIn" },
  REFER_IN_RECEIVE: { id: 4, name: "referReceive" },
  REFER_REQUEST_OUT: { id: 5, name: "requestReferOut" },
  REFER_REQUEST_BACK: { id: 7, name: "requestReferBack" },
  REFER_IPD: { id: 8, name: "referIPD" },
} as const;

function getTypes(
  referType: string,
  networkType?: string
): Array<{ id: number; name: string }> {
  const types: Array<{ id: number; name: string }> = [];
  switch (referType) {
    case "referOut":
      types.push(REFERRAL_TYPES.REFER_OUT);
      break;
    case "referIn":
      types.push(REFERRAL_TYPES.REFER_IN);
      break;
    case "referBack":
      types.push(REFERRAL_TYPES.REFER_BACK);
      break;
    case "referReceive":
      types.push(REFERRAL_TYPES.REFER_IN_RECEIVE);
      break;
    case "requestReferOut":
      types.push(REFERRAL_TYPES.REFER_REQUEST_OUT);
      break;
    case "requestReferBack":
      types.push(REFERRAL_TYPES.REFER_REQUEST_BACK);
      break;
    case "referIPD":
      types.push(REFERRAL_TYPES.REFER_IPD);
      break;
    default:
      types.push(
        REFERRAL_TYPES.REFER_OUT,
        REFERRAL_TYPES.REFER_BACK,
        REFERRAL_TYPES.REFER_IN,
        REFERRAL_TYPES.REFER_IN_RECEIVE,
        REFERRAL_TYPES.REFER_REQUEST_OUT,
        REFERRAL_TYPES.REFER_REQUEST_BACK
      );
      break;
  }
  return types;
}

const optionSelectedTime = [
  { value: 1, name: "7 วัน" },
  { value: 2, name: "30 วัน" },
  { value: 3, name: "90 วัน" },
  { value: 4, name: "กำหนดเอง" },
];

// Nuxt-style dropdown: label above field, bordered box, gray placeholder, plain
// menu items. Mirrors base-select-noinput from the Nuxt codebase.
type NuxtOption = {
  value: string | number | null | undefined;
  name: string;
  count?: number;
};

function NuxtSelect(props: {
  label: string;
  placeholder: string;
  value: string | number | "";
  onChange: (value: string | number | "") => void;
  options: NuxtOption[];
  showCount?: boolean;
  countLabel?: string;
}) {
  const { label, placeholder, value, onChange, options, showCount, countLabel } =
    props;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Typography
        component="label"
        sx={{
          fontSize: 14,
          fontWeight: 500,
          color: "#1f2937",
          lineHeight: 1.4,
        }}
      >
        {label}
      </Typography>
      <Select
        displayEmpty
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value as string | number | "")}
        input={<OutlinedInput />}
        renderValue={(selected) => {
          if (selected === "" || selected === null || selected === undefined) {
            return (
              <Typography component="span" sx={{ color: "#9ca3af", fontSize: 14 }}>
                {placeholder}
              </Typography>
            );
          }
          const found = options.find((o) => o.value === selected);
          return (
            <Typography component="span" sx={{ fontSize: 14, color: "#111827" }}>
              {found ? found.name : String(selected)}
            </Typography>
          );
        }}
        sx={{
          backgroundColor: "#fff",
          borderRadius: "4px",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#d1d5db",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#9ca3af",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#036245",
            borderWidth: "1px",
          },
          "& .MuiSelect-select": {
            py: "9px",
            px: "12px",
            minHeight: "22px !important",
            display: "flex",
            alignItems: "center",
          },
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              mt: 0.5,
              borderRadius: "4px",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
              maxHeight: 320,
              "& .MuiMenuItem-root": {
                fontSize: 14,
                py: 1,
                px: 1.5,
                "&:hover": { backgroundColor: "#eff6ff" },
                "&.Mui-selected": {
                  backgroundColor: "#eff6ff",
                  color: "#036245",
                  fontWeight: 500,
                  "&:hover": { backgroundColor: "#dbeafe" },
                },
              },
            },
          },
        }}
      >
        {options.map((o, idx) => (
          <MenuItem
            key={`${String(o.value)}-${idx}`}
            value={o.value as string | number}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                gap: 1,
              }}
            >
              <span>{o.name}</span>
              {showCount && o.count !== undefined && (() => {
                // Match Nuxt thresholds: low=10, medium=50, high=100
                const c = o.count;
                let bg = "#f3f4f6";
                let fg = "#4b5563";
                if (c >= 100) {
                  bg = "#d1fae5"; // green-200
                  fg = "#065f46"; // green-800
                } else if (c >= 50) {
                  bg = "#fde68a"; // yellow
                  fg = "#78350f";
                } else if (c >= 10) {
                  bg = "#dbeafe"; // blue-200
                  fg = "#1e40af";
                }
                return (
                  <Box
                    component="span"
                    sx={{
                      fontSize: 11,
                      fontWeight: 500,
                      px: 1,
                      py: 0.25,
                      borderRadius: 999,
                      backgroundColor: bg,
                      color: fg,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.toLocaleString()} {countLabel || "รายการ"}
                  </Box>
                );
              })()}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}

// Nuxt-style date range picker: single bordered field showing
// "DD ม.ค. YYYY ~ DD ม.ค. YYYY" in Thai Buddhist year, calendar icon on right,
// two-month popover calendar with range selection.
const TH_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];
const TH_MONTHS_LONG = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const TH_DAYS_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function parseISODate(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatThaiBuddhist(iso: string): string {
  const d = parseISODate(iso);
  if (!d) return "";
  return `${String(d.getDate()).padStart(2, "0")} ${TH_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildCalendarGrid(year: number, month: number): Array<Date | null> {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function NuxtDateRangePicker(props: {
  label: string;
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}) {
  const { label, startDate, endDate, onChange } = props;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [viewDate, setViewDate] = useState<Date>(() => {
    const d = parseISODate(startDate) || new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [pendingStart, setPendingStart] = useState<Date | null>(() =>
    parseISODate(startDate)
  );
  const [pendingEnd, setPendingEnd] = useState<Date | null>(() =>
    parseISODate(endDate)
  );
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setPendingStart(parseISODate(startDate));
    setPendingEnd(parseISODate(endDate));
    const anchor = parseISODate(startDate) || new Date();
    setViewDate(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setHoverDate(null);
  };

  const handleDayClick = (d: Date) => {
    if (!pendingStart || (pendingStart && pendingEnd)) {
      setPendingStart(d);
      setPendingEnd(null);
    } else if (d < pendingStart) {
      setPendingStart(d);
      setPendingEnd(null);
    } else {
      setPendingEnd(d);
    }
  };

  const handleApply = () => {
    if (pendingStart && pendingEnd) {
      onChange(toISODate(pendingStart), toISODate(pendingEnd));
    } else if (pendingStart) {
      onChange(toISODate(pendingStart), toISODate(pendingStart));
    }
    handleClose();
  };

  const handleClear = () => {
    setPendingStart(null);
    setPendingEnd(null);
    setHoverDate(null);
  };

  const display =
    startDate && endDate
      ? `${formatThaiBuddhist(startDate)} ~ ${formatThaiBuddhist(endDate)}`
      : "เลือกช่วงวันที่";

  const prevMonth = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const prevYear = () =>
    setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1));
  const nextYear = () =>
    setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1));

  const cells = buildCalendarGrid(viewDate.getFullYear(), viewDate.getMonth());

  const isInRange = (d: Date): boolean => {
    if (!pendingStart) return false;
    const end = pendingEnd || hoverDate;
    if (!end) return false;
    const lo = pendingStart <= end ? pendingStart : end;
    const hi = pendingStart <= end ? end : pendingStart;
    return d >= lo && d <= hi;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Typography
        component="label"
        sx={{
          fontSize: 14,
          fontWeight: 500,
          color: "#1f2937",
          lineHeight: 1.4,
        }}
      >
        {label}
      </Typography>
      <Box
        onClick={handleOpen}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          backgroundColor: "#fff",
          border: "1px solid #d1d5db",
          borderRadius: "4px",
          px: 1.5,
          py: "10px",
          minHeight: 42,
          transition: "border-color 0.15s",
          "&:hover": { borderColor: "#9ca3af" },
          ...(open && {
            borderColor: "#036245",
          }),
        }}
      >
        <Typography
          component="span"
          sx={{
            fontSize: 14,
            color: startDate && endDate ? "#111827" : "#9ca3af",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {display}
        </Typography>
        <CalendarIcon sx={{ color: "#9ca3af", fontSize: 20, flexShrink: 0 }} />
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              borderRadius: "6px",
              boxShadow:
                "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
              p: 2,
              minWidth: 300,
            },
          },
        }}
      >
        {/* Month / year navigation */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <IconButton size="small" onClick={prevYear} title="ปีก่อนหน้า">
              <ChevronLeftIcon fontSize="small" />
              <ChevronLeftIcon fontSize="small" sx={{ ml: "-14px" }} />
            </IconButton>
            <IconButton size="small" onClick={prevMonth} title="เดือนก่อนหน้า">
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
            {TH_MONTHS_LONG[viewDate.getMonth()]} {viewDate.getFullYear() + 543}
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <IconButton size="small" onClick={nextMonth} title="เดือนถัดไป">
              <ChevronRightIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={nextYear} title="ปีถัดไป">
              <ChevronRightIcon fontSize="small" />
              <ChevronRightIcon fontSize="small" sx={{ ml: "-14px" }} />
            </IconButton>
          </Box>
        </Box>

        {/* Weekday header */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 0.25,
            mb: 0.5,
          }}
        >
          {TH_DAYS_SHORT.map((d) => (
            <Box
              key={d}
              sx={{
                textAlign: "center",
                fontSize: 12,
                fontWeight: 500,
                color: "#6b7280",
                py: 0.5,
              }}
            >
              {d}
            </Box>
          ))}
        </Box>

        {/* Day grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 0.25,
          }}
        >
          {cells.map((cell, idx) => {
            if (!cell) return <Box key={idx} sx={{ height: 34 }} />;
            const inRange = isInRange(cell);
            const isStart = pendingStart && sameDay(cell, pendingStart);
            const isEnd = pendingEnd && sameDay(cell, pendingEnd);
            const isEndpoint = isStart || isEnd;
            return (
              <Box
                key={idx}
                onClick={() => handleDayClick(cell)}
                onMouseEnter={() => setHoverDate(cell)}
                sx={{
                  height: 34,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  cursor: "pointer",
                  borderRadius: "4px",
                  color: isEndpoint ? "#fff" : "#111827",
                  backgroundColor: isEndpoint
                    ? "#036245"
                    : inRange
                      ? "#d1fae5"
                      : "transparent",
                  fontWeight: isEndpoint ? 600 : 400,
                  "&:hover": {
                    backgroundColor: isEndpoint ? "#024f38" : "#ecfdf5",
                  },
                }}
              >
                {cell.getDate()}
              </Box>
            );
          })}
        </Box>

        {/* Actions */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 1,
            mt: 2,
            pt: 1.5,
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <Button size="small" onClick={handleClear} sx={{ color: "#6b7280" }}>
            ล้าง
          </Button>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button size="small" onClick={handleClose} sx={{ color: "#6b7280" }}>
              ยกเลิก
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleApply}
              disabled={!pendingStart}
              sx={{
                backgroundColor: "#036245",
                "&:hover": { backgroundColor: "#024f38" },
              }}
            >
              ตกลง
            </Button>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
}

// Label-above TextField wrapper matching the Nuxt base-text-input look.
function NuxtTextField(props: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  startIcon?: React.ReactNode;
}) {
  const { label, placeholder, value, onChange, type, startIcon } = props;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Typography
        component="label"
        sx={{
          fontSize: 14,
          fontWeight: 500,
          color: "#1f2937",
          lineHeight: 1.4,
        }}
      >
        {label}
      </Typography>
      <TextField
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        InputLabelProps={type === "date" ? { shrink: true } : undefined}
        InputProps={{
          startAdornment: startIcon ? (
            <InputAdornment position="start">{startIcon}</InputAdornment>
          ) : undefined,
          sx: {
            fontSize: 14,
            backgroundColor: "#fff",
            borderRadius: "4px",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#9ca3af" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#036245",
              borderWidth: "1px",
            },
          },
        }}
        sx={{
          "& input": { py: "10px", px: "4px" },
          "& input::placeholder": { color: "#9ca3af", opacity: 1 },
        }}
      />
    </Box>
  );
}

// ISO date helpers (YYYY-MM-DD)
function today(): string {
  return new Date().toISOString().split("T")[0];
}
function minusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}
function minusMonthsStartOfMonth(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setDate(1);
  return d.toISOString().split("T")[0];
}

// Simple debounce hook for a callback with latest-args semantics
function useDebouncedCallback<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
) {
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);
  return useCallback(
    (...args: Parameters<T>) => {
      if (ref.current) clearTimeout(ref.current);
      ref.current = setTimeout(() => {
        fnRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

export default function ReferListLayout({
  pageName,
  referralType,
  networkType = "",
}: Props) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();

  // Auth — reactive subscriptions
  const profile = useAuthStore((s) => s.profile);
  const optionHospital = useAuthStore((s) => s.optionHospital);

  const { findAndCountReferral, updateReadReferral, findGroupCase } = useReferralStore();

  // Hospital form options (mirrors Nuxt composable)
  const {
    options,
    isLoading: optionsLoading,
    fetchTypes,
    fetchZones,
    fetchHospitals,
    fetchReferralStatus,
    fetchReferralPoint,
    fetchDoctorBranch,
  } = useHospitalFormOptionsAll();

  // Filter state — mirrors all Nuxt refs
  const [selectTime, setSelectTime] = useState<number | "">("");
  const [selectStatus, setSelectStatus] = useState<number | "">("");
  const [selectReferralTypeStart, setSelectReferralTypeStart] = useState<
    number | ""
  >("");
  const [selectReferralTypeEnd, setSelectReferralTypeEnd] = useState<
    number | ""
  >("");
  const [selectDoctorBranch, setSelectDoctorBranch] = useState<number | "">("");
  const [selectZone, setSelectZone] = useState<number | "">("");
  const [selectSubType, setSelectSubType] = useState<number | "">("");
  const [selectHospital, setSelectHospital] = useState<number | "">("");
  const [searchPatient, setSearchPatient] = useState("");
  const [searchReferNumber, setSearchReferNumber] = useState("");
  const [searchICD, setSearchICD] = useState("");

  // Date range — default last 6 months
  const [dateFrom, setDateFrom] = useState<string>(() =>
    minusMonthsStartOfMonth(6)
  );
  const [dateTo, setDateTo] = useState<string>(() => today());

  // Pagination
  const [offset, setOffset] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Data
  const [referralDocuments, setReferralDocuments] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [loadingItemId, setLoadingItemId] = useState<string | number | null>(
    null
  );

  // Active tab (read from URL query)
  const tabFromQuery = searchParams?.get("tab") as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>(
    tabFromQuery && ["all", "refer-opd", "refer-ipd", "refer-er"].includes(tabFromQuery)
      ? tabFromQuery
      : "all"
  );

  // Memoized derived values
  const isReferOut = referralType === "referOut";
  const isReferBack = referralType === "referBack";
  const isReferIn = referralType === "referIn";
  const isReferReceive = referralType === "referReceive";
  const isRequestReferOut = referralType === "requestReferOut";
  const isRequestReferBack = referralType === "requestReferBack";
  const isReferIPD = referralType === "referIPD";

  const showTabs =
    referralType === "referBack" ||
    referralType === "referOut" ||
    referralType === "referReceive" ||
    referralType === "referIn";

  const createButtonLabel = useMemo(() => {
    if (isReferOut) return "สร้างใบส่งตัว";
    if (isReferBack) return "สร้างใบส่งตัวกลับ";
    if (isReferIPD) return "สร้างใบส่งตัว IPD";
    if (isRequestReferOut) return "สร้างการร้องขอส่งตัว";
    return "สร้างใบส่งตัว";
  }, [isReferOut, isReferBack, isReferIPD, isRequestReferOut]);

  const showCreateReferralButton = useMemo(() => {
    const hasHospital =
      !!optionHospital || !!(profile as any)?.permissionGroup?.hospital?.id;
    const isCorrectRoute = [
      "/refer-out/all",
      "/refer-back/all",
      "/request-refer-out/all",
    ].includes(pathname);
    return hasHospital && isCorrectRoute;
  }, [optionHospital, profile, pathname]);

  // Thai date range display
  const dateRangePlaceholder = useMemo(() => {
    const fmt = (iso: string) => {
      if (!iso) return "";
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      const thaiMonths = [
        "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
        "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
      ];
      return `${String(d.getDate()).padStart(2, "0")} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
    };
    if (dateFrom && dateTo) return `${fmt(dateFrom)} ~ ${fmt(dateTo)}`;
    return "เลือกช่วงวันที่";
  }, [dateFrom, dateTo]);

  // Handle selectTime preset changes
  useEffect(() => {
    if (selectTime === "" || selectTime === null) {
      setDateFrom(minusMonthsStartOfMonth(6));
      setDateTo(today());
    } else if (selectTime === 1) {
      setDateFrom(minusDays(7));
      setDateTo(today());
    } else if (selectTime === 2) {
      setDateFrom(minusDays(30));
      setDateTo(today());
    } else if (selectTime === 3) {
      setDateFrom(minusDays(90));
      setDateTo(today());
    }
    // selectTime === 4 = custom range, don't override
  }, [selectTime]);

  // Watchers for clearing related filters (mirrors Nuxt behavior)
  useEffect(() => {
    if (selectZone) {
      setSelectSubType("");
      setSelectHospital("");
    }
  }, [selectZone]);

  useEffect(() => {
    if (selectSubType) {
      setSelectHospital("");
    }
  }, [selectSubType]);

  // Build API params — mirrors Nuxt updateParam
  const buildApiParams = useCallback(() => {
    const param: any = {
      limit,
      offset,
      referralType: getTypes(referralType, networkType).map((t) => t.id),
      referralKind: null as number | null,
      referralStatus: selectStatus ? Number(selectStatus) : null,
      deliveryPointTypeStart: null as number | null,
      doctorBranch: selectDoctorBranch ? Number(selectDoctorBranch) : null,
      zone: selectZone ? Number(selectZone) : null,
      subType: selectSubType ? Number(selectSubType) : null,
      hospital: null as any,
      startDate: null as string | null,
      endDate: null as string | null,
      fromHospital: null as string | null,
      toHospital: null as string | null,
      runNumberSearch: searchReferNumber ? String(searchReferNumber) : null,
      toHospitalSearch: null as string | null,
      fromHospitalSearch: null as string | null,
      patientSearch: searchPatient ? String(searchPatient) : null,
      icd10Search: searchICD ? String(searchICD) : null,
    };

    // Tab → referralKind
    if (activeTab === "all") param.referralKind = null;
    else if (activeTab === "refer-opd") param.referralKind = 3;
    else if (activeTab === "refer-ipd") param.referralKind = 4;
    else if (activeTab === "refer-er") param.referralKind = 1;

    // delivery point
    if (isReferOut || isReferBack) {
      param.deliveryPointTypeStart = selectReferralTypeStart
        ? Number(selectReferralTypeStart)
        : null;
    } else if (isReferIn || isReferReceive) {
      param.deliveryPointTypeStart = selectReferralTypeEnd
        ? Number(selectReferralTypeEnd)
        : null;
    }

    // hospital resolution
    const ownHospitalId = (profile as any)?.permissionGroup?.hospital?.id;
    const activeHospital = optionHospital || ownHospitalId || null;

    if (pathname === "/refer-in/all" || pathname === "/refer-receive/all") {
      param.fromHospital = selectHospital ? String(selectHospital) : null;
      param.toHospital = activeHospital ? String(activeHospital) : null;
    }
    if (pathname === "/refer-out/all" || pathname === "/refer-back/all") {
      param.toHospital = selectHospital ? String(selectHospital) : null;
      param.fromHospital = activeHospital ? String(activeHospital) : null;
    }
    if (pathname === "/request-refer-out/all") {
      const sel = selectHospital ? String(selectHospital) : null;
      param.toHospital = sel || (activeHospital ? String(activeHospital) : null);
    }
    if (pathname === "/request-refer-back/all") {
      const sel = selectHospital ? String(selectHospital) : null;
      param.fromHospital =
        sel || (activeHospital ? String(activeHospital) : null);
    }

    // dates — ISO with time boundaries
    if (dateFrom) param.startDate = `${dateFrom}T00:00:00.00Z`;
    if (dateTo) param.endDate = `${dateTo}T23:59:59.59Z`;

    return param;
  }, [
    limit,
    offset,
    referralType,
    networkType,
    selectStatus,
    selectDoctorBranch,
    selectZone,
    selectSubType,
    searchReferNumber,
    searchPatient,
    searchICD,
    activeTab,
    isReferOut,
    isReferBack,
    isReferIn,
    isReferReceive,
    selectReferralTypeStart,
    selectReferralTypeEnd,
    profile,
    optionHospital,
    pathname,
    selectHospital,
    dateFrom,
    dateTo,
  ]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoadingList(true);
      const params = buildApiParams();
      const res = await findAndCountReferral(params);
      setReferralDocuments(res?.referralDocuments || []);
      setTotalCount(res?.totalCount || 0);
    } catch (err) {
      console.error("Error fetching referrals:", err);
      setReferralDocuments([]);
      setTotalCount(0);
    } finally {
      setIsLoadingList(false);
    }
  }, [buildApiParams, findAndCountReferral]);

  const debouncedFetchData = useDebouncedCallback(fetchData, 500);

  // Initial option loading on mount + when navbar hospital changes
  useEffect(() => {
    const ownHospitalId = (profile as any)?.permissionGroup?.hospital?.id;
    const hospitalId = optionHospital || ownHospitalId || null;

    let useFor = "";
    if (isReferOut || isReferBack) useFor = "จุดสร้างใบส่งตัว";
    else if (isReferIn || isReferReceive) useFor = "จุดรับใบส่งตัว";

    Promise.all([
      fetchTypes({ hospital: hospitalId ? Number(hospitalId) : null }),
      fetchZones(),
      fetchHospitals(),
      fetchReferralStatus(),
      fetchDoctorBranch({ hospital: hospitalId ? Number(hospitalId) : null }),
      fetchReferralPoint({
        useFor,
        hospital: hospitalId ? Number(hospitalId) : null,
      }),
    ]).catch((err) => console.error("Error loading options:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionHospital, profile]);

  // Fetch data when filters change (debounced)
  useEffect(() => {
    debouncedFetchData();
  }, [
    activeTab,
    selectStatus,
    selectReferralTypeStart,
    selectReferralTypeEnd,
    selectDoctorBranch,
    selectZone,
    selectSubType,
    selectHospital,
    searchPatient,
    searchReferNumber,
    searchICD,
    dateFrom,
    dateTo,
    offset,
    limit,
    optionHospital,
    debouncedFetchData,
  ]);

  // Refetch hospitals when zone / subType changes
  useEffect(() => {
    fetchHospitals({
      zone: selectZone ? Number(selectZone) : undefined,
      subType: selectSubType ? Number(selectSubType) : undefined,
    });
    fetchTypes({
      zone: selectZone ? Number(selectZone) : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectZone, selectSubType]);

  const clearFilters = () => {
    setSelectTime("");
    setSelectStatus("");
    setSelectReferralTypeStart("");
    setSelectReferralTypeEnd("");
    setSelectDoctorBranch("");
    setSelectZone("");
    setSelectSubType("");
    setSelectHospital("");
    setSearchPatient("");
    setSearchReferNumber("");
    setSearchICD("");
    setDateFrom(minusMonthsStartOfMonth(6));
    setDateTo(today());
    setOffset(1);
  };

  const handlePaginationChange = (data: { page: number; limit: number }) => {
    setOffset(data.page);
    setLimit(data.limit);
  };

  // Action handler — mirrors Nuxt handleActionType (most-used paths)
  const handleActionType = async (actionType: string, item: any) => {
    try {
      if (item?.id) await updateReadReferral(item.id);
    } catch {}

    if (actionType === "read") {
      const readMap: Record<string, string> = {
        "/refer-in/all": "/refer-in/in",
        "/refer-out/all": "/refer-out/in",
        "/refer-back/all": "/refer-back/in",
        "/refer-receive/all": "/refer-receive/in",
        "/request-refer-out/all": "/request-refer-out/in",
        "/request-refer-back/all": "/request-refer-back/in",
      };
      const next = readMap[pathname];
      if (next) router.push(`${next}?id=${item.id}`);
      return;
    }

    if (actionType === "edit") {
      const kindName = item.referralKind?.name;

      // --- EMERGENCY edit (refer-out/all) → /create/er ---
      if (
        pathname === "/refer-out/all" &&
        kindName === "EMERGENCY" &&
        item?.groupCase?.id
      ) {
        try {
          const groupCaseRefer = await findGroupCase(item.groupCase.id.toString());
          const docs = groupCaseRefer?.referralDocuments || [];
          const hospitalsData = docs.map((hospital: any) => ({
            id: hospital.id,
            name: hospital.toHospital?.name || hospital.name,
            phone: hospital.toHospital?.phone || hospital.phone,
            zone: hospital.toHospital?.zone || hospital.zone,
            subType: hospital.toHospital?.subType || hospital.subType,
            selectedBranches: hospital.appointmentData
              ? hospital.appointmentData.map((a: any) => ({
                  value: a.doctorBranchObj?.id || a.doctorBranch,
                  name: a.doctorBranchName,
                }))
              : [],
          }));
          const q = new URLSearchParams({
            kind: "referER",
            hospitals: JSON.stringify(hospitalsData),
            draft: JSON.stringify({ id: item.id }),
            groupCaseId: item.groupCase.id.toString(),
          });
          router.push(`/create/er?${q.toString()}`);
        } catch (error) {
          console.error("Error fetching group case:", error);
        }
        return;
      }

      // --- IPD edit (refer-out/all) → /create/ipd ---
      if (
        pathname === "/refer-out/all" &&
        kindName === "IPD" &&
        item?.groupCase?.id
      ) {
        try {
          const groupCaseRefer = await findGroupCase(item.groupCase.id.toString());
          const docs = groupCaseRefer?.referralDocuments || [];
          const hospitalsData = docs.map((hospital: any) => ({
            id: hospital.id,
            name: hospital.toHospital?.name || hospital.name,
            phone: hospital.toHospital?.phone || hospital.phone,
            zone: hospital.toHospital?.zone || hospital.zone,
            subType: hospital.toHospital?.subType || hospital.subType,
            selectedBranches: hospital.appointmentData
              ? hospital.appointmentData.map((a: any) => ({
                  value: a.doctorBranchObj?.id || a.doctorBranch,
                  name: a.doctorBranchName,
                }))
              : [],
          }));
          const q = new URLSearchParams({
            kind: "referIPD",
            hospitals: JSON.stringify(hospitalsData),
            draft: JSON.stringify({ id: item.id }),
            groupCaseId: item.groupCase.id.toString(),
          });
          router.push(`/create/ipd?${q.toString()}`);
        } catch (error) {
          console.error("Error fetching group case:", error);
        }
        return;
      }

      // --- reqRefer items on refer-out/all → /create/request (matches Nuxt) ---
      if (
        pathname === "/refer-out/all" &&
        kindName === "OPD" &&
        item.reqRefer === true
      ) {
        const appointmentData = item.appointmentData;
        const hasBranches = Array.isArray(appointmentData) && appointmentData.length > 0;
        const q = new URLSearchParams({
          kind: "requestReferOut",
          hospital: item.fromHospital?.name || "",
          hospitalID: item.fromHospital?.id?.toString() || "",
          referPoint: item.deliveryPointTypeEnd?.id?.toString() || "",
          deliveryPoint: item.deliveryPointTypeStart?.id ? "true" : "false",
          docter_branch: appointmentData ? "true" : "false",
          branch_ids: hasBranches
            ? appointmentData.map((a: any) => typeof a.doctorBranch === "object" ? a.doctorBranch?.id : a.doctorBranch).join(", ")
            : "",
          branch_names: hasBranches
            ? appointmentData.map((a: any) => a.doctorBranchName || a.doctorBranch?.name || "").join(", ")
            : "ไม่ระบุสาขา",
          branch_type: hasBranches
            ? appointmentData.map((a: any) => a.appointmentType).join(", ")
            : "",
          datetime: hasBranches
            ? appointmentData.map((a: any) => a.appointmentDate).join(", ")
            : "",
          draft: JSON.stringify({ id: item.id }),
        });
        router.push(`/create/request?${q.toString()}`);
        return;
      }

      // --- OPD edit (refer-out/all, refer-back/all) → /create/opd ---
      if (
        (pathname === "/refer-out/all" || pathname === "/refer-back/all") &&
        kindName === "OPD"
      ) {
        const appointmentData = item.appointmentData;
        const hasBranches = Array.isArray(appointmentData) && appointmentData.length > 0;
        const referPointId = (pathname === "/refer-out/all"
          ? item.deliveryPointTypeEnd?.id
          : item.deliveryPointTypeStart?.id
        )?.toString() || "";
        const q = new URLSearchParams({
          kind: pathname === "/refer-out/all" ? "referOut" : "referBack",
          hospital: item.toHospital?.name || "",
          hospitalID: item.toHospital?.id?.toString() || "",
          referPoint: referPointId,
          deliveryPoint: referPointId ? "true" : "false",
          docter_branch: hasBranches ? "true" : "false",
          branch_ids: hasBranches
            ? appointmentData.map((a: any) => typeof a.doctorBranch === "object" ? a.doctorBranch?.id : a.doctorBranch).join(", ")
            : "",
          branch_names: hasBranches
            ? appointmentData.map((a: any) => a.doctorBranchName || a.doctorBranch?.name || "").join(", ")
            : "ไม่ระบุสาขา",
          draft: JSON.stringify({ id: item.id }),
        });
        router.push(`/create/opd?${q.toString()}`);
        return;
      }

      // --- Request refer out/back edit → /create/request ---
      if (pathname === "/request-refer-out/all" && kindName === "OPD") {
        const appointmentData = item.appointmentData;
        const hasBranches = Array.isArray(appointmentData) && appointmentData.length > 0;
        const q = new URLSearchParams({
          kind: "requestReferOut",
          hospital: item.fromHospital?.name || "",
          hospitalID: item.fromHospital?.id?.toString() || "",
          referPoint: item.deliveryPointTypeEnd?.id?.toString() || "",
          deliveryPoint: item.deliveryPointTypeStart?.id ? "true" : "false",
          docter_branch: appointmentData ? "true" : "false",
          branch_ids: hasBranches
            ? appointmentData.map((a: any) => typeof a.doctorBranch === "object" ? a.doctorBranch?.id : a.doctorBranch).join(", ")
            : "",
          branch_names: hasBranches
            ? appointmentData.map((a: any) => a.doctorBranchName || a.doctorBranch?.name || "").join(", ")
            : "ไม่ระบุสาขา",
          branch_type: hasBranches
            ? appointmentData.map((a: any) => a.appointmentType).join(", ")
            : "",
          datetime: hasBranches
            ? appointmentData.map((a: any) => a.appointmentDate).join(", ")
            : "",
          draft: JSON.stringify({ id: item.id }),
        });
        router.push(`/create/request?${q.toString()}`);
        return;
      }
      if (pathname === "/request-refer-back/all" && kindName === "OPD") {
        const q = new URLSearchParams({
          kind: "requestReferBack",
          hospital: item.toHospital?.name || "",
          hospitalID: item.toHospital?.id?.toString() || "",
          draft: JSON.stringify({ id: item.id }),
        });
        router.push(`/create/request?${q.toString()}`);
        return;
      }
    }

    if (actionType === "history") {
      // TODO: open history modal
      console.log("history", item.id);
    }
  };

  const gotoCreateReferral = () => {
    let effectiveType: string = referralType;
    if (activeTab === "refer-ipd") effectiveType = "referIPD";
    const typeMapping = getTypes(effectiveType, networkType);
    const kindValue = typeMapping.map((t) => t.name);
    const q = new URLSearchParams();
    q.set("kind", kindValue.length === 1 ? kindValue[0] : kindValue.join(","));
    if (activeTab === "refer-ipd") q.set("step", "1");

    if (pathname === "/refer-out/all" || pathname === "/refer-back/all") {
      router.push(`/create/opd?${q.toString()}`);
    } else {
      router.push(`/create/request?${q.toString()}`);
    }
  };

  // Derived label for referral-point field
  const showReferPointStart =
    referralType === "referOut" ||
    referralType === "referBack" ||
    referralType === "requestReferOut";
  const showReferPointEnd =
    referralType === "referIn" ||
    referralType === "referReceive" ||
    referralType === "requestReferBack";

  const tabList: Array<{ key: TabKey; label: string; show: boolean }> = [
    { key: "all", label: "ทั้งหมด", show: true },
    { key: "refer-opd", label: "OPD - ผู้ป่วยนอก", show: true },
    { key: "refer-ipd", label: "IPD - ผู้ป่วยใน", show: showTabs },
    { key: "refer-er", label: "ER - ผู้ป่วยฉุกเฉิน", show: showTabs },
  ];
  const visibleTabs = tabList.filter((t) => t.show);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <LoadingOverlay open={isLoadingList || optionsLoading} />
      {/* Create button */}
      {showCreateReferralButton && (
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            disableElevation
            startIcon={<AddCircleIcon />}
            onClick={gotoCreateReferral}
            sx={{
              bgcolor: "#16a34a",
              color: "#fff",
              fontFamily: "Sarabun, sans-serif",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "8px",
              px: 2.5,
              py: 1,
              boxShadow: "none",
              "&:hover": { bgcolor: "#15803d", boxShadow: "none" },
            }}
          >
            {createButtonLabel}
          </Button>
        </Box>
      )}

      {/* Tabs + Paper wrapper — no gap so tabs sit flush against the Paper */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Tabs header — Nuxt-style chunky tabs with white active background */}
      <Box
        sx={{
          display: "flex",
          gap: 0,
          alignItems: "flex-end",
        }}
      >
        {visibleTabs.map((t, idx) => {
          const isActive = activeTab === t.key;
          return (
            <Box
              key={t.key}
              onClick={() => {
                setActiveTab(t.key as TabKey);
                setOffset(1);
              }}
              sx={{
                width: 192,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 1,
                px: 2,
                py: 1.5,
                cursor: "pointer",
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                borderLeft: "1px solid #e5e7eb",
                borderRight: "1px solid #e5e7eb",
                borderTop: "1px solid #e5e7eb",
                borderBottom: isActive ? "none" : "1px solid #e5e7eb",
                marginLeft: idx === 0 ? 0 : "-1px",
                paddingBottom: isActive ? "calc(12px + 2px)" : 1.5,
                position: "relative",
                zIndex: isActive ? 2 : 1,
                backgroundColor: isActive ? "#fff" : "#f9fafb",
                transition: "background-color 0.2s, box-shadow 0.2s",
                "&:hover": {
                  backgroundColor: isActive ? "#fff" : "#f3f4f6",
                  boxShadow: isActive ? "none" : "0 1px 2px rgba(0,0,0,0.05)",
                },
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Sarabun, sans-serif",
                  fontSize: 16,
                  lineHeight: 1.5,
                  color: isActive ? "#00AF75" : "#374151",
                  fontWeight: isActive ? 600 : 500,
                  transition: "color 0.2s",
                }}
              >
                {t.label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          border: "1px solid #e5e7eb",
          borderTop: "none",
          mt: "-2px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Typography
          variant="h6"
          sx={{ color: "#00AF75", fontWeight: 700, mb: 2 }}
        >
          {pageName}
        </Typography>

        {/* Filter row 1 — time range, status, point, doctor branch */}
        <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <NuxtSelect
              label="ช่วงเวลา"
              placeholder="เลือกช่วงเวลา"
              value={selectTime ?? ""}
              onChange={(v) => setSelectTime(v === "" ? "" : (v as number))}
              options={optionSelectedTime}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <NuxtDateRangePicker
              label="เลือกช่วงวันที่"
              startDate={dateFrom}
              endDate={dateTo}
              onChange={(start, end) => {
                setSelectTime(4);
                setDateFrom(start);
                setDateTo(end);
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <NuxtSelect
              label="สถานะใบส่งตัว"
              placeholder="เลือกสถานะใบส่งตัว"
              value={selectStatus ?? ""}
              onChange={(v) => setSelectStatus(v === "" ? null : (v as any))}
              options={(options.referstatus || []) as NuxtOption[]}
            />
          </Grid>

          {showReferPointStart && (
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <NuxtSelect
                label="จุดสร้างใบส่งตัว"
                placeholder="เลือกจุดสร้างใบส่งตัว"
                value={selectReferralTypeStart ?? ""}
                onChange={(v) =>
                  setSelectReferralTypeStart(v === "" ? null : (v as any))
                }
                options={(options.referpoint || []) as NuxtOption[]}
              />
            </Grid>
          )}

          {showReferPointEnd && (
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <NuxtSelect
                label="จุดรับใบส่งตัว"
                placeholder="เลือกจุดรับใบส่งตัว"
                value={selectReferralTypeEnd ?? ""}
                onChange={(v) =>
                  setSelectReferralTypeEnd(v === "" ? null : (v as any))
                }
                options={(options.referpoint || []) as NuxtOption[]}
              />
            </Grid>
          )}

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <NuxtSelect
              label="สาขา / แผนกที่ส่งต่อ"
              placeholder="เลือกสาขา / แผนกที่ส่งต่อ"
              value={selectDoctorBranch ?? ""}
              onChange={(v) =>
                setSelectDoctorBranch(v === "" ? null : (v as any))
              }
              options={(options.docterbranch || []) as NuxtOption[]}
            />
          </Grid>
        </Grid>

        {/* Filter row 2 — zone, type, hospital, clear */}
        <Grid container spacing={1.5} sx={{ mb: 1.5 }} alignItems="flex-end">
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <NuxtSelect
              label="โซน"
              placeholder="เลือกโซน"
              value={selectZone ?? ""}
              onChange={(v) => setSelectZone(v === "" ? null : (v as any))}
              options={(options.zones || []) as NuxtOption[]}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <NuxtSelect
              label="ประเภทสถานพยาบาล"
              placeholder="เลือกประเภทโรงพยาบาล"
              value={selectSubType ?? ""}
              onChange={(v) => setSelectSubType(v === "" ? null : (v as any))}
              options={(options.types || []) as NuxtOption[]}
              showCount
              countLabel="สถานพยาบาล"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NuxtSelect
              label="สถานพยาบาล"
              placeholder="เลือกสถานพยาบาล"
              value={selectHospital ?? ""}
              onChange={(v) => setSelectHospital(v === "" ? null : (v as any))}
              options={(options.hospitals || []) as NuxtOption[]}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              sx={{ height: 42, borderColor: "#d1d5db", color: "#374151" }}
            >
              ล้างตัวกรอง
            </Button>
          </Grid>
        </Grid>

        {/* Search row */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <NuxtTextField
              label="ค้นหาชื่อผู้ป่วย"
              placeholder="ชื่อนามสกุล - HN"
              value={searchPatient}
              onChange={(v) => {
                setSearchPatient(v);
                setOffset(1);
              }}
              startIcon={<SearchIcon fontSize="small" sx={{ color: "#9ca3af" }} />}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <NuxtTextField
              label="ค้นหาหมายเลขใบส่งตัว"
              placeholder="ค้นหา No"
              value={searchReferNumber}
              onChange={(v) => {
                setSearchReferNumber(v);
                setOffset(1);
              }}
              startIcon={<SearchIcon fontSize="small" sx={{ color: "#9ca3af" }} />}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <NuxtTextField
              label="ค้นหาวินิจฉัยโรคล่าสุด"
              placeholder="ค้นหาวินิจฉัยโรคล่าสุด"
              value={searchICD}
              onChange={(v) => {
                setSearchICD(v);
                setOffset(1);
              }}
              startIcon={<SearchIcon fontSize="small" sx={{ color: "#9ca3af" }} />}
            />
          </Grid>
        </Grid>

        {/* Table */}
        <TableReferralList
          headers={headerReferralTable}
          tableData={referralDocuments}
          totalPage={totalCount}
          offset={offset}
          limit={limit}
          isLoading={isLoadingList}
          loadingItemId={loadingItemId}
          activeTab={activeTab}
          onAction={handleActionType}
          onPaginationChange={handlePaginationChange}
        />
      </Paper>
      </Box>
    </Box>
  );
}
