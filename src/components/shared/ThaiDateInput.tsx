"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Box, Typography, IconButton, Button } from "@mui/material";

const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

// Monday-first day names (จ อ พ พฤ ศ ส อา)
const THAI_DAY_NAMES = ["จ.", "อ.", "พ.", "พฤ", "ศ.", "ส.", "อา"];

type ViewMode = "day" | "month" | "year";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

/** Format ISO date (yyyy-mm-dd or yyyy-mm-ddTHH:mm:ss) to Thai Buddhist era: "24 เม.ย. 2569" */
export function formatThaiDate(dateStr: string): string {
  if (!dateStr) return "";
  // Strip time portion if present (e.g. "2021-04-02T00:00:00.000Z" → "2021-04-02")
  const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  return `${d} ${THAI_MONTHS_SHORT[m - 1]} ${y + 543}`;
}

/**
 * Build a 6-row calendar grid starting on Monday.
 * Each cell is { day, month, year, isCurrentMonth }.
 */
function buildCalendarGrid(year: number, month: number) {
  const daysInMonth = getDaysInMonth(year, month);
  // getDay() is 0=Sun..6=Sat → convert to Mon=0..Sun=6
  const firstDaySun = new Date(year, month, 1).getDay();
  const firstDayMon = firstDaySun === 0 ? 6 : firstDaySun - 1;

  const cells: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = [];

  // Previous month fill
  if (firstDayMon > 0) {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevDays = getDaysInMonth(prevYear, prevMonth);
    for (let i = firstDayMon - 1; i >= 0; i--) {
      cells.push({ day: prevDays - i, month: prevMonth, year: prevYear, isCurrentMonth: false });
    }
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month, year, isCurrentMonth: true });
  }

  // Next month fill (up to 42 cells = 6 rows)
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({ day: nextDay++, month: nextMonth, year: nextYear, isCurrentMonth: false });
  }

  // Split into weeks (rows of 7)
  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  // Remove trailing empty weeks (all next-month)
  while (weeks.length > 5 && weeks[weeks.length - 1].every((c) => !c.isCurrentMonth)) {
    weeks.pop();
  }

  return weeks;
}

export default function ThaiDateInput({
  value,
  onChange,
  disabled,
  error,
  placeholder = "เลือกวันที่",
  maxDate,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
  /** ISO date string (yyyy-mm-dd) — days after this are disabled */
  maxDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Temp selections for month/year pickers
  const [tempMonth, setTempMonth] = useState(today.getMonth());
  const [tempYear, setTempYear] = useState(today.getFullYear());

  // Year grid page
  const [yearPageStart, setYearPageStart] = useState(today.getFullYear() - 6);

  // Normalize value: strip time portion if present
  const normalizedValue = value && value.includes("T") ? value.split("T")[0] : value;

  // Sync calendar to selected date — only when opening (not during navigation)
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current && normalizedValue) {
      const [y, m] = normalizedValue.split("-").map(Number);
      if (y && m) { setViewYear(y); setViewMonth(m - 1); }
    }
    prevOpenRef.current = open;
  }, [open, normalizedValue]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
        setViewMode("day");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleToggle = () => {
    if (disabled) return;
    if (!open) {
      setViewMode("day");
      setTempMonth(viewMonth);
      setTempYear(viewYear);
      setYearPageStart(viewYear - 6);
    }
    setOpen((prev) => !prev);
  };

  const handleSelectDay = (day: number, month: number, year: number) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${year}-${mm}-${dd}`);
    setOpen(false);
    setViewMode("day");
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  // Selected date parts
  const selectedDay = normalizedValue ? Number(normalizedValue.split("-")[2]) : null;
  const selectedMonth = normalizedValue ? Number(normalizedValue.split("-")[1]) - 1 : null;
  const selectedYear = normalizedValue ? Number(normalizedValue.split("-")[0]) : null;

  const borderColor = error ? "#ef4444" : "#d1d5db";

  // Dropdown position for portal — prefer above (like Nuxt)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const updateDropdownPos = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // Use actual dropdown height if available, otherwise estimate
      const actualHeight = dropdownRef.current?.offsetHeight || 420;
      const spaceAbove = rect.top;
      if (spaceAbove >= actualHeight + 8) {
        // Position above the input
        setDropdownPos({ top: rect.top - actualHeight - 8, left: rect.left });
      } else {
        // Fallback: position below
        setDropdownPos({ top: rect.bottom + 4, left: rect.left });
      }
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    updateDropdownPos();
    // Re-calculate after a frame so dropdownRef has its real height
    const raf = requestAnimationFrame(() => updateDropdownPos());
    window.addEventListener("scroll", updateDropdownPos, true);
    window.addEventListener("resize", updateDropdownPos);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updateDropdownPos, true);
      window.removeEventListener("resize", updateDropdownPos);
    };
  }, [open, viewMode, updateDropdownPos]);

  // --- View mode handlers ---
  const openMonthPicker = () => {
    setTempMonth(viewMonth);
    setTempYear(viewYear);
    setViewMode("month");
  };
  const openYearPicker = () => {
    setTempYear(viewYear);
    setYearPageStart(viewYear - 6);
    setViewMode("year");
  };

  const confirmMonth = () => {
    setViewMonth(tempMonth);
    setViewYear(tempYear);
    setViewMode("day");
  };
  const confirmYear = () => {
    setViewMode("month");
  };
  const cancelPicker = () => {
    if (viewMode === "year") {
      setTempYear(viewYear);
      setViewMode("month");
    } else if (viewMode === "month") {
      setTempMonth(viewMonth);
      setTempYear(viewYear);
      setViewMode("day");
    } else {
      setOpen(false);
    }
  };

  // Build calendar
  const weeks = buildCalendarGrid(viewYear, viewMonth);

  // Year grid: 5 rows x 3 cols = 15
  const yearGridItems: number[] = [];
  for (let i = 0; i < 15; i++) yearGridItems.push(yearPageStart + i);

  /* ---- DAY VIEW ---- */
  const renderDayView = () => (
    <>
      {/* Header: < เม.ย.   2569 > */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <IconButton size="small" onClick={prevMonth} sx={{ color: "#374151" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography
            onClick={openMonthPicker}
            sx={{ fontWeight: 600, fontSize: "0.95rem", color: "#1f2937", cursor: "pointer", "&:hover": { color: "#00AF75" } }}
          >
            {THAI_MONTHS_SHORT[viewMonth]}
          </Typography>
          <Typography
            onClick={openYearPicker}
            sx={{ fontWeight: 600, fontSize: "0.95rem", color: "#1f2937", cursor: "pointer", "&:hover": { color: "#00AF75" } }}
          >
            {viewYear + 543}
          </Typography>
        </Box>
        <IconButton size="small" onClick={nextMonth} disabled={!!maxDate && `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}` >= maxDate.substring(0, 7)} sx={{ color: "#374151", "&.Mui-disabled": { opacity: 0.3 } }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconButton>
      </Box>

      {/* Day name headers (Monday-first) */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.25, mb: 0.5 }}>
        {THAI_DAY_NAMES.map((d) => (
          <Typography key={d} sx={{
            textAlign: "center", fontSize: "0.75rem", color: "#374151", fontWeight: 600, py: 0.25,
          }}>{d}</Typography>
        ))}
      </Box>

      {/* Day grid */}
      {weeks.map((w, wi) => (
        <Box key={wi} sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.25 }}>
          {w.map((cell, di) => {
            const isSelected = cell.day === selectedDay && cell.month === selectedMonth && cell.year === selectedYear;
            const isToday = cell.day === today.getDate() && cell.month === today.getMonth() && cell.year === today.getFullYear();
            const cellDateStr = `${cell.year}-${String(cell.month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
            const isDisabled = maxDate ? cellDateStr > maxDate : false;
            return (
              <Box
                key={di}
                onClick={() => !isDisabled && handleSelectDay(cell.day, cell.month, cell.year)}
                sx={{
                  width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "50%", cursor: isDisabled ? "default" : "pointer", fontSize: "0.85rem", mx: "auto",
                  opacity: isDisabled ? 0.3 : 1,
                  bgcolor: isSelected ? "#00AF75" : "transparent",
                  color: isSelected ? "#fff" : !cell.isCurrentMonth ? "#c4c4c4" : isToday ? "#00AF75" : "#374151",
                  fontWeight: isSelected || isToday ? 700 : 400,
                  border: isToday && !isSelected ? "1px solid #00AF75" : "none",
                  "&:hover": isDisabled ? {} : { bgcolor: isSelected ? "#036245" : "#f0fdf4" },
                }}
              >
                {cell.day}
              </Box>
            );
          })}
        </Box>
      ))}

      {/* ยกเลิก / เลือก buttons */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1.5 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => { setOpen(false); setViewMode("day"); }}
          sx={{
            borderColor: "#d1d5db", color: "#374151", textTransform: "none",
            fontSize: "0.85rem", borderRadius: "8px", px: 2,
            "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" },
          }}
        >
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={() => {
            // Select today if no date selected yet
            if (!normalizedValue) {
              const mm = String(today.getMonth() + 1).padStart(2, "0");
              const dd = String(today.getDate()).padStart(2, "0");
              onChange(`${today.getFullYear()}-${mm}-${dd}`);
            }
            setOpen(false);
            setViewMode("day");
          }}
          sx={{
            bgcolor: "#00AF75", textTransform: "none",
            fontSize: "0.85rem", borderRadius: "8px", px: 2,
            "&:hover": { bgcolor: "#036245" },
          }}
        >
          เลือก
        </Button>
      </Box>
    </>
  );

  /* ---- MONTH VIEW ---- */
  const renderMonthView = () => (
    <>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, mb: 2 }}>
        {THAI_MONTHS_SHORT.map((m, idx) => {
          const isCurrent = idx === tempMonth;
          const monthDisabled = maxDate ? `${tempYear}-${String(idx + 1).padStart(2, "0")}` > maxDate.substring(0, 7) : false;
          return (
            <Box
              key={idx}
              onClick={() => {
                if (monthDisabled) return;
                setViewMonth(idx);
                setViewYear(tempYear);
                setViewMode("day");
              }}
              sx={{
                display: "flex", alignItems: "center", justifyContent: "center",
                py: 1.5, borderRadius: "8px", cursor: monthDisabled ? "default" : "pointer",
                fontSize: "0.9rem", fontWeight: isCurrent ? 700 : 400,
                opacity: monthDisabled ? 0.3 : 1,
                bgcolor: isCurrent ? "#00AF75" : "transparent",
                color: isCurrent ? "#fff" : "#374151",
                border: isCurrent ? "none" : "1px solid #e5e7eb",
                "&:hover": monthDisabled ? {} : { bgcolor: isCurrent ? "#036245" : "#f0fdf4" },
              }}
            >
              {m}
            </Box>
          );
        })}
      </Box>

      {/* Calendar icon → back to day view */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        <IconButton onClick={() => { setViewMonth(tempMonth); setViewYear(tempYear); setViewMode("day"); }} sx={{ color: "#9ca3af" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
        <Button variant="outlined" size="small" onClick={cancelPicker}
          sx={{ borderColor: "#d1d5db", color: "#374151", textTransform: "none", fontSize: "0.85rem", borderRadius: "8px", px: 2, "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" } }}
        >ยกเลิก</Button>
        <Button variant="contained" size="small" onClick={confirmMonth}
          sx={{ bgcolor: "#00AF75", textTransform: "none", fontSize: "0.85rem", borderRadius: "8px", px: 2, "&:hover": { bgcolor: "#036245" } }}
        >เลือก</Button>
      </Box>
    </>
  );

  /* ---- YEAR VIEW ---- */
  const renderYearView = () => (
    <>
      {/* Year page navigation */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <IconButton size="small" onClick={() => setYearPageStart((p) => p - 15)} sx={{ color: "#374151" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconButton>
        <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: "#1f2937" }}>
          {yearPageStart + 543} - {yearPageStart + 14 + 543}
        </Typography>
        <IconButton
          size="small"
          onClick={() => setYearPageStart((p) => p + 15)}
          disabled={!!maxDate && yearPageStart + 15 > Number(maxDate.substring(0, 4))}
          sx={{ color: "#374151", "&.Mui-disabled": { opacity: 0.3 } }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconButton>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, mb: 2 }}>
        {yearGridItems.map((yr) => {
          const isCurrent = yr === tempYear;
          const maxYear = maxDate ? Number(maxDate.substring(0, 4)) : null;
          const yearDisabled = maxYear !== null && yr > maxYear;
          return (
            <Box
              key={yr}
              onClick={() => {
                if (yearDisabled) return;
                setTempYear(yr);
                setViewYear(yr);
                setViewMode("day");
              }}
              sx={{
                display: "flex", alignItems: "center", justifyContent: "center",
                py: 1.5, borderRadius: "8px", cursor: yearDisabled ? "default" : "pointer",
                fontSize: "0.9rem", fontWeight: isCurrent ? 700 : 400,
                opacity: yearDisabled ? 0.3 : 1,
                bgcolor: isCurrent ? "#00AF75" : "transparent",
                color: isCurrent ? "#fff" : "#374151",
                border: isCurrent ? "2px solid #00AF75" : "1px solid #e5e7eb",
                "&:hover": yearDisabled ? {} : { bgcolor: isCurrent ? "#036245" : "#f0fdf4" },
              }}
            >
              {yr + 543}
            </Box>
          );
        })}
      </Box>

      {/* Calendar icon → back to day view */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        <IconButton onClick={() => { setViewMonth(tempMonth); setViewYear(tempYear); setViewMode("day"); }} sx={{ color: "#9ca3af" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
        <Button variant="outlined" size="small" onClick={cancelPicker}
          sx={{ borderColor: "#d1d5db", color: "#374151", textTransform: "none", fontSize: "0.85rem", borderRadius: "8px", px: 2, "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" } }}
        >ยกเลิก</Button>
        <Button variant="contained" size="small" onClick={confirmYear}
          sx={{ bgcolor: "#00AF75", textTransform: "none", fontSize: "0.85rem", borderRadius: "8px", px: 2, "&:hover": { bgcolor: "#036245" } }}
        >เลือก</Button>
      </Box>
    </>
  );

  return (
    <Box ref={containerRef} sx={{ position: "relative" }}>
      {/* Display box */}
      <Box
        onClick={handleToggle}
        sx={{
          display: "flex", alignItems: "center",
          border: `1px solid ${borderColor}`, borderRadius: "8px",
          px: 1.5, height: 40,
          bgcolor: disabled ? "#f9fafb" : "#fff",
          cursor: disabled ? "default" : "pointer",
          "&:hover": disabled ? {} : { borderColor: "#9ca3af" },
        }}
      >
        <Typography sx={{
          flex: 1, fontSize: "0.875rem",
          color: normalizedValue ? "#1f2937" : "#9ca3af",
          pointerEvents: "none",
        }}>
          {normalizedValue ? formatThaiDate(normalizedValue) : placeholder}
        </Typography>
        {normalizedValue ? (
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            sx={{ p: 0.25, color: "#9ca3af" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </IconButton>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: "#9ca3af", flexShrink: 0 }}>
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </Box>

      {/* Calendar dropdown via Portal */}
      {open && typeof document !== "undefined" && createPortal(
        <Box ref={dropdownRef} sx={{
          position: "fixed", top: dropdownPos.top, left: dropdownPos.left, zIndex: 1300,
          bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", p: 2, minWidth: 300,
        }}>
          {viewMode === "day" && renderDayView()}
          {viewMode === "month" && renderMonthView()}
          {viewMode === "year" && renderYearView()}
        </Box>,
        document.body
      )}
    </Box>
  );
}
