"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  Pagination,
  Stack,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useReferralStore } from "@/stores/referralStore";

/* ------------------------------------------------------------------ */
/*  Thai date/time formatter  — "08 เม.ย. 2569 16:51 น."              */
/* ------------------------------------------------------------------ */

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
    return `${day} ${month} ${year}\n${hh}:${mm} น.`;
  } catch {
    return "-";
  }
}

/* ------------------------------------------------------------------ */
/*  Status text color — matches Nuxt historyRefer.vue                  */
/* ------------------------------------------------------------------ */

const STATUS_TEXT_COLORS: Record<string, string> = {
  ยกเลิก: "#EF4444",
  ยืนยันนัดหมาย: "#3B82F6",
  เปลี่ยนแปลงนัดหมาย: "#F97316",
  รับเข้ารักษา: "#22C55E",
  นัดรักษาต่อเนื่อง: "#22C55E",
  รอตอบรับ: "#EAB308",
  สิ้นสุดการส่งตัว: "#036245",
  ปฏิเสธการตอบรับ: "#EF4444",
};

function getStatusColor(status: string | undefined): string {
  if (!status) return "#616161";
  return STATUS_TEXT_COLORS[status] || "#616161";
}

/* ------------------------------------------------------------------ */
/*  Status badge (same style as TableReferralList)                     */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  ฉบับร่าง:             { bg: "#E0E0E0", color: "#616161" },
  รอตอบรับ:             { bg: "#FEF1CC", color: "#DC4040" },
  ยืนยันนัดหมาย:        { bg: "#EBF6FF", color: "#0D8CEE" },
  เปลี่ยนแปลงนัดหมาย:    { bg: "#FEF1CC", color: "#F47A00" },
  รับเข้ารักษา:          { bg: "#DAEEE0", color: "#139539" },
  ตอบรับ:               { bg: "#DAEEE0", color: "#139539" },
  ปฏิเสธ:               { bg: "#FEF2F2", color: "#DC4040" },
  ปฏิเสธการตอบรับ:       { bg: "#FEF2F2", color: "#DC4040" },
  ยกเลิก:               { bg: "#FEF2F2", color: "#DC4040" },
  สิ้นสุดการส่งตัว:       { bg: "#139539", color: "#FFFFFF" },
  สำเร็จ:               { bg: "#139539", color: "#FFFFFF" },
  นัดรักษาต่อเนื่อง:     { bg: "#F0FDF4", color: "#22C55E" },
};

function StatusBadge({ status }: { status?: string }) {
  const label = status || "-";
  const s = STATUS_STYLES[label] || { bg: "#E0E0E0", color: "#616161" };
  return (
    <Chip
      label={label}
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

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  open: boolean;
  referralDocumentId: string | number | null;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Headers — match Nuxt staging 7-column layout                       */
/* ------------------------------------------------------------------ */

const HEADERS = [
  { id: "no", label: "ลำดับ" },
  { id: "prevStatus", label: "สถานะก่อนหน้า" },
  { id: "newStatus", label: "เปลี่ยนสถานะเป็น" },
  { id: "reason", label: "เหตุผล" },
  { id: "detail", label: "รายละเอียด" },
  { id: "date", label: "เปลี่ยนเมื่อ" },
  { id: "changedBy", label: "เปลี่ยนโดย" },
];

const COL_COUNT = HEADERS.length;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function HistoryReferralModal({
  open,
  referralDocumentId,
  onClose,
}: Props) {
  const findAndCountReferralHistory = useReferralStore(
    (s) => s.findAndCountReferralHistory
  );

  const [historyData, setHistoryData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!referralDocumentId) return;
    setLoading(true);
    try {
      const res = await findAndCountReferralHistory({
        referralDocumentId,
        limit,
        offset: page,
      });
      setHistoryData(res?.logReferralDocumentLocals || []);
      setTotalCount(res?.totalCount || 0);
    } catch (err) {
      console.error("Error fetching referral history:", err);
      setHistoryData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [referralDocumentId, limit, page, findAndCountReferralHistory]);

  useEffect(() => {
    if (open && referralDocumentId) {
      setPage(1);
      setLimit(10);
    }
  }, [open, referralDocumentId]);

  useEffect(() => {
    if (open && referralDocumentId) {
      fetchHistory();
    }
  }, [open, referralDocumentId, page, limit, fetchHistory]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "80vw",
          maxWidth: 1900,
          minWidth: 400,
          borderRadius: "8px",       /* Nuxt: 8px */
          overflow: "hidden",
        },
      }}
    >
      {/* ---- Green header bar — Nuxt: bg-green-clicked = #00AF75 ---- */}
      <DialogTitle
        sx={{
          bgcolor: "#00AF75",         /* Nuxt: rgb(0,175,117) */
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 2,
          px: 3,
          minHeight: 68,              /* Nuxt: 68px */
        }}
      >
        <Typography
          sx={{ fontWeight: 600, fontSize: 18, color: "#fff" }}
        >
          ประวัติการเปลี่ยนแปลงสถานะใบส่งตัว
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* ---- Body ---- */}
      <DialogContent sx={{ p: 0 }}>
        <TableContainer>
          <Table size="medium">
            {/* ---- Dark-green table header — Nuxt thead: #036245 ---- */}
            <TableHead>
              <TableRow>
                {HEADERS.map((h) => (
                  <TableCell
                    key={h.id}
                    align="center"
                    sx={{
                      bgcolor: "#036245",
                      color: "#fff",
                      fontWeight: 400,          /* Nuxt: 400 */
                      fontSize: 16,             /* Nuxt: 16px */
                      borderBottom: "none",
                      whiteSpace: "nowrap",
                      py: 1,
                      px: 1.5,
                      ...(h.id === "prevStatus" || h.id === "newStatus"
                        ? { minWidth: 160 }
                        : {}),
                    }}
                  >
                    {h.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={COL_COUNT} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: "#00AF75" }} />
                  </TableCell>
                </TableRow>
              ) : historyData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={COL_COUNT}
                    align="center"
                    sx={{ py: 6, color: "#9e9e9e" }}
                  >
                    ไม่พบข้อมูลประวัติ
                  </TableCell>
                </TableRow>
              ) : (
                historyData.map((item, index) => (
                  <TableRow
                    key={item.id || index}
                    sx={{
                      /* Nuxt: no alternating bg, transparent rows */
                      bgcolor: "transparent",
                      "&:hover": { bgcolor: "#e6f5ec" },
                      borderBottom: "1px solid #e0e0e0",
                    }}
                  >
                    {/* ลำดับ */}
                    <TableCell align="center" sx={{ fontSize: 14, py: 2 }}>
                      {(page - 1) * limit + index + 1}
                    </TableCell>

                    {/* สถานะก่อนหน้า */}
                    <TableCell align="center" sx={{ py: 2 }}>
                      <StatusBadge status={item.prevTextStatus} />
                    </TableCell>

                    {/* เปลี่ยนสถานะเป็น */}
                    <TableCell align="center" sx={{ py: 2 }}>
                      <StatusBadge status={item.textStatus} />
                    </TableCell>

                    {/* เหตุผล */}
                    <TableCell align="center" sx={{ py: 2 }}>
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: getStatusColor(item.textStatus),
                        }}
                      >
                        ({item.referralStatusDetailCurrent || "-"})
                      </Typography>
                    </TableCell>

                    {/* รายละเอียด */}
                    <TableCell align="center" sx={{ py: 2 }}>
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: getStatusColor(item.textStatus),
                        }}
                      >
                        ({item.referralStatusDetailCurrentText || "-"})
                      </Typography>
                    </TableCell>

                    {/* เปลี่ยนเมื่อ */}
                    <TableCell
                      align="center"
                      sx={{
                        fontSize: 14,
                        whiteSpace: "pre-line",
                        py: 2,
                        lineHeight: 1.4,
                      }}
                    >
                      {formatThaiDateTime(item.date || item.createdAt)}
                    </TableCell>

                    {/* เปลี่ยนโดย */}
                    <TableCell align="center" sx={{ fontSize: 14, py: 2 }}>
                      {item.username || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ---- Pagination bar ---- */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 3, pt: 2, pb: 1 }}
        >
          {/* Rows per page */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontSize: 14, color: "#616161" }}>
              แถวต่อหน้า
            </Typography>
            <Select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              size="small"
              sx={{
                fontSize: 14,
                height: 32,
                minWidth: 60,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#d1d5db",
                },
              }}
            >
              {[5, 10, 25, 50].map((v) => (
                <MenuItem key={v} value={v}>
                  {v}
                </MenuItem>
              ))}
            </Select>
            <Typography sx={{ fontSize: 14, color: "#616161" }}>
              ทั้งหมด {totalCount} รายการ
            </Typography>
          </Stack>

          {/* Page numbers — Nuxt: active btn #2FD897, 40x40, borderRadius 4px */}
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            shape="rounded"
            sx={{
              "& .MuiPaginationItem-root": {
                width: 40,
                height: 40,
                borderRadius: "4px",
                fontSize: 14,
              },
              "& .Mui-selected": {
                bgcolor: "#2FD897 !important",
                color: "#fff",
              },
            }}
          />
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
