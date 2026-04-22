"use client";

import { usePathname } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Pagination,
  Stack,
  Chip,
  Tooltip,
  Typography,
  Box,
  Skeleton,
  CircularProgress,
} from "@mui/material";
import {
  Edit as EditIcon,
  Description as DocumentSearchIcon,
  History as HistoryIcon,
  WarningAmber as WarningIcon,
} from "@mui/icons-material";

export interface TableHeader {
  id: string | number;
  Name: string;
}

export interface TableReferralListProps {
  headers: TableHeader[];
  tableData: any[];
  totalPage?: number;
  offset?: number;
  limit?: number;
  isLoading?: boolean;
  buttonLoading?: boolean;
  loadingItemId?: string | number | null;
  activeTab?: "all" | "refer-opd" | "refer-ipd" | "refer-er";
  onAction?: (actionType: string, item: any) => void;
  onPaginationChange?: (data: { page: number; limit: number }) => void;
}

// Thai month abbreviations
const THAI_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

function formatThaiDateTime(iso: string | undefined): string {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    const day = String(d.getDate()).padStart(2, "0");
    const month = THAI_MONTHS[d.getMonth()];
    const year = d.getFullYear() + 543;
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year} ${hh}:${mm}`;
  } catch {
    return "-";
  }
}

function formatStartDateThai(iso: string | undefined): string {
  if (!iso) return "ไม่ระบุ";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "ไม่ระบุ";
    return `${String(d.getDate()).padStart(2, "0")} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
  } catch {
    return "ไม่ระบุ";
  }
}

function getElapsedTime(
  createdAt: string,
  updatedAt: string,
  statusName?: string
): string {
  try {
    const baseIso = statusName === "รอตอบรับ" ? createdAt : updatedAt || createdAt;
    if (!baseIso) return "-";
    const base = new Date(baseIso).getTime();
    if (isNaN(base)) return "-";
    const diffMs = Date.now() - base;
    if (diffMs < 0) return "เพิ่งอัปเดต";
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} วันที่แล้ว`;
    if (hours > 0) return `${hours} ชม.ที่แล้ว`;
    if (mins > 0) return `${mins} นาทีที่แล้ว`;
    return "เพิ่งอัปเดต";
  } catch {
    return "-";
  }
}

function formatDx(dx: string | undefined | null): string {
  if (!dx) return "ไม่มี";
  return dx.length > 27 ? dx.slice(0, 27) + "..." : dx;
}

// Status badge colors — mirrors Nuxt StatusBadge + base-badge-label variants
const STATUS_STYLES: Record<
  string,
  { bg: string; color: string; border?: string }
> = {
  ฉบับร่าง:             { bg: "#E0E0E0", color: "#616161" },              // default
  รอตอบรับ:             { bg: "#FEF1CC", color: "#DC4040" },              // warn_danger
  ยืนยันนัดหมาย:        { bg: "#EBF6FF", color: "#0D8CEE" },              // info
  เปลี่ยนแปลงนัดหมาย:    { bg: "#FEF1CC", color: "#F47A00" },              // warning
  รับเข้ารักษา:          { bg: "#DAEEE0", color: "#139539" },              // success
  ตอบรับ:               { bg: "#DAEEE0", color: "#139539" },              // success (alias)
  ปฏิเสธ:               { bg: "#FEF2F2", color: "#DC4040" },              // danger
  ปฎิเสธ:               { bg: "#FEF2F2", color: "#DC4040" },              // danger (typo variant)
  ปฏิเสธการตอบรับ:       { bg: "#FEF2F2", color: "#DC4040" },              // danger
  ยกเลิก:               { bg: "#FEF2F2", color: "#DC4040" },              // danger
  สิ้นสุดการส่งตัว:       { bg: "#139539", color: "#FFFFFF" },              // success-solid
  สำเร็จ:               { bg: "#139539", color: "#FFFFFF" },              // success-solid (alias)
  นัดรักษาต่อเนื่อง:     { bg: "#F0FDF4", color: "#22C55E" },              // refer-continue
};

function StatusBadge({ status }: { status?: string }) {
  const s = STATUS_STYLES[status || ""] || { bg: "#E0E0E0", color: "#616161" };
  return (
    <Chip
      label={status || "-"}
      size="small"
      sx={{
        bgcolor: s.bg,
        color: s.color,
        fontWeight: 400,
        fontSize: 14,
        borderRadius: "9999px",
        height: 32,
        border: "none",
      }}
    />
  );
}

// Filter headers based on current route — mirrors filteredHeaders computed
function filterHeaders(headers: TableHeader[], pathname: string): TableHeader[] {
  return headers.filter((item) => {
    if (pathname === "/refer-out/all") {
      if (
        item.Name === "สถานพยาบาลต้นทาง" ||
        item.Name === "สถานพยาบาลส่งคำขอไป" ||
        item.Name === "สถานพยาบาลส่งคำขอมา"
      )
        return false;
    }
    if (pathname === "/refer-in/all") {
      if (
        item.Name === "สถานพยาบาลปลายทาง" ||
        item.Name === "สถานพยาบาลส่งคำขอไป" ||
        item.Name === "สถานพยาบาลส่งคำขอมา"
      )
        return false;
    }
    if (pathname === "/request-refer-out/all") {
      if (
        item.Name === "สถานพยาบาลต้นทาง" ||
        item.Name === "สถานพยาบาลปลายทาง" ||
        item.Name === "สถานพยาบาลส่งคำขอมา"
      )
        return false;
    }
    if (pathname === "/request-refer-back/all") {
      if (
        item.Name === "สถานพยาบาลปลายทาง" ||
        item.Name === "สถานพยาบาลต้นทาง" ||
        item.Name === "สถานพยาบาลส่งคำขอไป"
      )
        return false;
    }
    if (pathname === "/refer-back/all") {
      if (
        item.Name === "สถานพยาบาลต้นทาง" ||
        item.Name === "สถานพยาบาลส่งคำขอไป" ||
        item.Name === "สถานพยาบาลส่งคำขอมา"
      )
        return false;
    }
    if (pathname === "/refer-receive/all") {
      if (
        item.Name === "สถานพยาบาลปลายทาง" ||
        item.Name === "สถานพยาบาลส่งคำขอไป" ||
        item.Name === "สถานพยาบาลส่งคำขอมา"
      )
        return false;
    }
    return true;
  });
}

export default function TableReferralList({
  headers,
  tableData,
  totalPage = 0,
  offset = 1,
  limit = 10,
  isLoading = false,
  loadingItemId = null,
  activeTab = "all",
  onAction,
  onPaginationChange,
}: TableReferralListProps) {
  const pathname = usePathname() || "";
  const filteredHeaders = filterHeaders(headers, pathname);

  const totalPages = Math.max(1, Math.ceil((totalPage || 0) / (limit || 10)));

  const handlePageChange = (_: any, value: number) => {
    onPaginationChange?.({ page: value, limit });
  };

  const isItemLoading = (id: any) => loadingItemId === id;

  const canEditItem = (item: any): boolean => {
    // Simplified permission logic — assume granted for superAdmin.
    // Real Nuxt version checks per-route × referralKind × activeTab permissions.
    const status = item.referralStatus?.name;
    if (status === "ฉบับร่าง") return true;
    // Only allow edit on pending items outside of refer-in / refer-receive / request-refer-back
    if (status !== "รอตอบรับ") return false;
    if (
      pathname.includes("refer-in") ||
      pathname.includes("refer-receive") ||
      pathname.includes("request-refer-back")
    )
      return false;
    return true;
  };

  const renderCell = (headerName: string, item: any, idx: number) => {
    switch (headerName) {
      case "No": {
        const runNumber = item.runNumber;
        if (runNumber === "รอปลายทางยืนยัน")
          return <Typography sx={{ color: "#EAB308" }}>รอยืนยัน</Typography>;
        if (runNumber === "รอต้นทางยืนยัน")
          return <Typography sx={{ color: "#9CA3AF" }}>-</Typography>;
        return <Typography>{runNumber || (offset - 1) * limit + idx + 1}</Typography>;
      }
      case "วัน/เวลาที่ส่งตัว":
        return <Typography variant="body2">{formatThaiDateTime(item.createdAt)}</Typography>;
      case "เลขบัตรประชาชน":
        return (
          <Typography variant="body2">
            {item.data?.patient?.patient_pid || item.patient?.patient_pid || "-"}
          </Typography>
        );
      case "ชื่อผู้ป่วย": {
        const first =
          item.data?.patient?.patient_firstname ||
          item.patient?.patient_firstname ||
          "";
        const last =
          item.data?.patient?.patient_lastname ||
          item.patient?.patient_lastname ||
          "";
        const name = `${first} ${last}`.trim() || "-";
        const showReqBadge =
          item.reqRefer === true &&
          ((item.referralType?.id === 2 &&
            (pathname === "/request-refer-out/all" ||
              pathname === "/request-refer-back/all")) ||
            (item.referralType?.name === "REFER_BACK" &&
              pathname !== "/request-refer-out/all" &&
              pathname !== "/request-refer-back/all"));
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 180 }}>
            <Typography sx={{ color: "#3B82F6" }}>{name}</Typography>
            {showReqBadge && (
              <Chip
                label={
                  item.referralType?.name === "REFER_BACK" &&
                  pathname !== "/request-refer-out/all" &&
                  pathname !== "/request-refer-back/all"
                    ? "ตามคำขอ"
                    : "ขอส่งตัวกลับ"
                }
                size="small"
                sx={{ bgcolor: "#F0FDF4", color: "#22C55E", fontWeight: 500 }}
              />
            )}
          </Box>
        );
      }
      case "สถานพยาบาลปลายทาง": {
        const kind = item.referralKind?.name;
        const runNumber = item.runNumber;
        if (
          pathname === "/refer-out/all" &&
          (kind === "IPD" || kind === "EMERGENCY") &&
          runNumber === "รอปลายทางยืนยัน"
        ) {
          return (
            <Typography sx={{ color: "#EAB308", fontWeight: 700 }}>รอยืนยัน</Typography>
          );
        }
        return <Typography sx={{ whiteSpace: "nowrap" }}>{item.toHospital?.name || "-"}</Typography>;
      }
      case "สถานพยาบาลต้นทาง":
        return <Typography sx={{ whiteSpace: "nowrap" }}>{item.fromHospital?.name || "-"}</Typography>;
      case "สถานพยาบาลส่งคำขอไป":
        return <Typography sx={{ whiteSpace: "nowrap" }}>{item.fromHospital?.name || "-"}</Typography>;
      case "สถานพยาบาลส่งคำขอมา":
        return <Typography sx={{ whiteSpace: "nowrap" }}>{item.toHospital?.name || "-"}</Typography>;
      case "โรคหลัก": {
        const icd10 = item.data?.visitData?.icd10;
        if (!Array.isArray(icd10) || icd10.length === 0)
          return <Typography variant="body2">ไม่มี</Typography>;
        return (
          <Box sx={{ maxWidth: 200 }}>
            {icd10.map((dx: any, i: number) => (
              <Tooltip
                key={i}
                title={`${dx.diagename}\n${dx.diagetname}`}
                arrow
                placement="bottom"
              >
                <Box>
                  <Typography variant="body2">{formatDx(dx.diagename)}</Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {formatDx(dx.diagetname)}
                  </Typography>
                </Box>
              </Tooltip>
            ))}
          </Box>
        );
      }
      case "สถานะใบส่งตัว":
        return <StatusBadge status={item.referralStatus?.name} />;
      case "เวลาดำเนินการ": {
        const statusName = item.referralStatus?.name;
        if (statusName === "ยืนยันนัดหมาย" || statusName === "เปลี่ยนแปลงนัดหมาย") {
          const d = item.appointmentData?.[0]?.appointmentDate;
          return (
            <Box>
              <Typography variant="caption">
                ({statusName === "ยืนยันนัดหมาย" ? "นัดหมาย" : "เปลี่ยนแปลงนัดหมาย"})
              </Typography>
              <Typography variant="body2">{formatStartDateThai(d)}</Typography>
            </Box>
          );
        }
        const elapsed = getElapsedTime(item.createdAt, item.updatedAt, statusName);
        const isWarning = statusName === "รอตอบรับ" && elapsed.includes("ที่แล้ว");
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              color: isWarning ? "#EF4444" : "inherit",
            }}
          >
            {isWarning && <WarningIcon sx={{ fontSize: 16 }} />}
            <Typography variant="body2">{elapsed}</Typography>
          </Box>
        );
      }
      case "จัดการข้อมูล": {
        const status = item.referralStatus?.name;
        const isDraft = status === "ฉบับร่าง";
        const loading = isItemLoading(item.id);
        return (
          <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
            {isDraft && canEditItem(item) && (
              <Tooltip title="แก้ไข">
                <span>
                  <IconButton
                    size="small"
                    sx={{ bgcolor: "#EAB308", color: "#fff", "&:hover": { bgcolor: "#856504" } }}
                    disabled={loading}
                    onClick={() => onAction?.("edit", item)}
                  >
                    {loading ? <CircularProgress size={16} /> : <EditIcon fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {!isDraft && (
              <>
                {canEditItem(item) && status === "รอตอบรับ" && (
                  <Tooltip title="แก้ไข">
                    <span>
                      <IconButton
                        size="small"
                        sx={{ bgcolor: "#EAB308", color: "#fff", "&:hover": { bgcolor: "#856504" } }}
                        disabled={loading}
                        onClick={() => onAction?.("edit", item)}
                      >
                        {loading ? <CircularProgress size={16} /> : <EditIcon fontSize="small" />}
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
                <Tooltip title="ดูรายละเอียด">
                  <span>
                    <IconButton
                      size="small"
                      sx={{ bgcolor: "#3B82F6", color: "#fff", "&:hover": { bgcolor: "#1C3D73" } }}
                      disabled={loading}
                      onClick={() => onAction?.("read", item)}
                    >
                      <DocumentSearchIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="ประวัติ">
                  <span>
                    <IconButton
                      size="small"
                      sx={{ bgcolor: "#A955F7", color: "#fff", "&:hover": { bgcolor: "#69339C" } }}
                      disabled={loading}
                      onClick={() => onAction?.("history", item)}
                    >
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </>
            )}
          </Stack>
        );
      }
      default:
        return <Typography variant="body2">-</Typography>;
    }
  };

  return (
    <Box>
      <TableContainer
        sx={{
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Table size="small">
          <TableHead sx={{ bgcolor: "#036245" }}>
            <TableRow>
              {filteredHeaders.map((h, i) => (
                <TableCell
                  key={`${h.id}-${i}`}
                  sx={{ color: "#fff", fontWeight: 600, whiteSpace: "nowrap" }}
                >
                  {h.Name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {filteredHeaders.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : tableData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={filteredHeaders.length} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">ไม่พบข้อมูล</Typography>
                </TableCell>
              </TableRow>
            ) : (
              tableData.map((item, idx) => (
                <TableRow key={item.id ?? idx} hover>
                  {filteredHeaders.map((h, j) => (
                    <TableCell key={`${h.id}-${j}`}>
                      {renderCell(h.Name, item, idx)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
          พบ {totalPage || 0} รายการ
        </Typography>
        <Pagination
          count={totalPages}
          page={offset}
          onChange={handlePageChange}
          color="primary"
          size="small"
        />
      </Box>
    </Box>
  );
}
