"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
} from "@mui/material";
import { Close as CloseIcon, Phone as PhoneIcon } from "@mui/icons-material";
import type { SelectedHospital } from "@/stores/referralCreateStore";

const DEFAULT_AVATAR = "/images/Image_Avatar.png";

interface ViewSelectedHospitalsModalProps {
  open: boolean;
  onClose: () => void;
  hospitals: SelectedHospital[];
}

export default function ViewSelectedHospitalsModal({
  open,
  onClose,
  hospitals,
}: ViewSelectedHospitalsModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, overflow: "hidden" } }}
    >
      {/* Blue header */}
      <Box
        sx={{
          bgcolor: "#3b82f6",
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>
          รายการสถานพยาบาลที่ส่งไป
        </Typography>
        <IconButton onClick={onClose} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {hospitals.length === 0 ? (
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ py: 4, textAlign: "center" }}
          >
            ไม่มีข้อมูลสถานพยาบาลที่เลือก
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: "#036245",
                    "& th": { color: "#fff", fontWeight: 600, fontSize: "0.9rem", textAlign: "center" },
                  }}
                >
                  <TableCell>ลำดับ</TableCell>
                  <TableCell>รูปภาพ</TableCell>
                  <TableCell>ชื่อสถานพยาบาล</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hospitals.filter((h) => h.name || h.phone || (h as any).image).map((h, i) => (
                  <TableRow
                    key={h.id}
                    sx={{ borderBottom: "1px solid #e5e7eb", "&:hover": { bgcolor: "#f9fafb" } }}
                  >
                    <TableCell sx={{ width: 80, textAlign: "center", fontSize: "1rem" }}>
                      {i + 1}
                    </TableCell>
                    <TableCell sx={{ width: 80, textAlign: "center" }}>
                      <Avatar
                        src={(h as any).image || DEFAULT_AVATAR}
                        alt={h.name}
                        sx={{ width: 40, height: 40, mx: "auto" }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <Typography sx={{ fontWeight: 600, fontSize: "0.95rem" }}>
                        {h.name}
                      </Typography>
                      {h.phone && (
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mt: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 14, color: "#9ca3af" }} />
                          <Typography sx={{ fontSize: "0.8rem", color: "#6b7280" }}>
                            {h.phone}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>
  );
}
