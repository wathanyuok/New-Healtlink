"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface FileItem {
  id?: number | null;
  code?: string;
  name?: string;
  type?: string;
  detail?: string;
  url?: any[] | string;
  textContent?: string;
  createdAt?: string;
}

interface Props {
  open: boolean;
  file: FileItem | null;
  onClose: () => void;
}

function getFileName(url: string) {
  return url.split("/").pop() || "unknown";
}

function getFileExtension(url: string) {
  return url.split(".").pop()?.toLowerCase() || "";
}

function previewUrl(url: string) {
  if (typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function ReadFileModal({ open, file, onClose }: Props) {
  if (!file) return null;

  const urls: { url: string; name?: string }[] = Array.isArray(file.url)
    ? file.url
    : typeof file.url === "string" && file.url
      ? [{ url: file.url, name: getFileName(file.url) }]
      : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography sx={{ fontWeight: 600, fontSize: "1.125rem" }}>
          รายละเอียดเอกสาร
        </Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Document info */}
        <Box sx={{ mb: 2 }}>
          {file.type && (
            <Box sx={{ mb: 1 }}>
              <Typography sx={{ fontSize: "0.875rem", color: "#6b7280" }}>ประเภทเอกสาร</Typography>
              <Typography sx={{ fontSize: "1rem" }}>{file.type}</Typography>
            </Box>
          )}
          {file.code && (
            <Box sx={{ mb: 1 }}>
              <Typography sx={{ fontSize: "0.875rem", color: "#6b7280" }}>รหัสเอกสาร</Typography>
              <Typography sx={{ fontSize: "1rem" }}>{file.code}</Typography>
            </Box>
          )}
          {file.name && (
            <Box sx={{ mb: 1 }}>
              <Typography sx={{ fontSize: "0.875rem", color: "#6b7280" }}>ชื่อเอกสาร</Typography>
              <Typography sx={{ fontSize: "1rem" }}>{file.name}</Typography>
            </Box>
          )}
          {file.detail && (
            <Box sx={{ mb: 1 }}>
              <Typography sx={{ fontSize: "0.875rem", color: "#6b7280" }}>รายละเอียด</Typography>
              <Typography sx={{ fontSize: "1rem" }}>{file.detail}</Typography>
            </Box>
          )}
        </Box>

        {/* File list */}
        {urls.length > 0 ? (
          <Box>
            <Typography sx={{ fontWeight: 500, mb: 1 }}>ไฟล์แนบ ({urls.length} ไฟล์)</Typography>
            {urls.map((u, i) => {
              const ext = getFileExtension(u.url);
              const isImage = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(ext);
              const isPdf = ext === "pdf";

              return (
                <Box key={i} sx={{ mb: 2, border: "1px solid #E5E7EB", borderRadius: "8px", overflow: "hidden" }}>
                  {/* Preview */}
                  {isImage && (
                    <Box sx={{ p: 2, textAlign: "center", bgcolor: "#f9fafb" }}>
                      <img
                        src={u.url}
                        alt={u.name || "preview"}
                        style={{ maxWidth: "100%", maxHeight: 400, objectFit: "contain" }}
                      />
                    </Box>
                  )}
                  {isPdf && (
                    <Box sx={{ height: 400 }}>
                      <iframe src={u.url} width="100%" height="100%" style={{ border: "none" }} />
                    </Box>
                  )}

                  {/* File info + actions */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, py: 1.5, borderTop: isImage || isPdf ? "1px solid #E5E7EB" : "none" }}>
                    <Typography sx={{ fontSize: "0.875rem" }}>
                      {u.name || getFileName(u.url)}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => previewUrl(u.url)}
                      sx={{ textTransform: "none", fontSize: "0.8rem", borderColor: "#d1d5db", color: "#374151" }}
                    >
                      เปิดในแท็บใหม่
                    </Button>
                  </Box>
                </Box>
              );
            })}
          </Box>
        ) : (
          <Typography sx={{ color: "#6b7280", textAlign: "center", py: 4 }}>
            ไม่มีไฟล์แนบ
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
