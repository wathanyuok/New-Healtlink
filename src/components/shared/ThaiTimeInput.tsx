"use client";

import React, { useRef } from "react";
import { Box, Typography, IconButton } from "@mui/material";

/** Format time (HH:mm) to Thai display: "14:30 น." */
export function formatThaiTime(timeStr: string): string {
  if (!timeStr) return "";
  return `${timeStr} น.`;
}

/**
 * Thai time input:
 * - No value: shows placeholder + native clock icon, click anywhere opens picker
 * - Has value: shows Thai time + X clear button
 */
export default function ThaiTimeInput({
  value,
  onChange,
  disabled,
  error,
  placeholder = "เลือกเวลา",
  minWidth = 150,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
  minWidth?: number | string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    if (disabled) return;
    try {
      ref.current?.showPicker();
    } catch {
      ref.current?.focus();
    }
  };

  const borderColor = error ? "#ef4444" : disabled ? "#e5e7eb" : "#d1d5db";

  /* ---- Has value: show Thai time + X button ---- */
  if (value) {
    return (
      <Box
        onClick={openPicker}
        sx={{
          display: "flex",
          alignItems: "center",
          border: `1px solid ${borderColor}`,
          borderRadius: "8px",
          px: 1.5,
          height: 40,
          bgcolor: "#fff",
          cursor: "pointer",
          minWidth,
          position: "relative",
          "&:hover": { borderColor: "#9ca3af" },
        }}
      >
        <Typography
          sx={{
            flex: 1,
            fontSize: "0.875rem",
            color: "#1f2937",
            pointerEvents: "none",
          }}
        >
          {formatThaiTime(value)}
        </Typography>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onChange("");
          }}
          sx={{ p: 0.25, color: "#9ca3af" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </IconButton>
        {/* Hidden input for showPicker */}
        <input
          ref={ref}
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            position: "absolute",
            opacity: 0,
            width: 0,
            height: 0,
            pointerEvents: "none",
          }}
        />
      </Box>
    );
  }

  /* ---- No value: native input with placeholder overlay + clock icon ---- */
  return (
    <Box
      onClick={openPicker}
      sx={{
        position: "relative",
        minWidth,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <Typography
        sx={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: "0.875rem",
          color: "#9ca3af",
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        {placeholder}
      </Typography>
      <input
        ref={ref}
        type="time"
        value=""
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          openPicker();
        }}
        style={{
          width: "100%",
          height: 40,
          border: `1px solid ${borderColor}`,
          borderRadius: 8,
          padding: "6px 12px",
          fontSize: "0.875rem",
          color: "transparent",
          backgroundColor: disabled ? "#f9fafb" : "#fff",
          cursor: disabled ? "default" : "pointer",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </Box>
  );
}
