"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Avatar,
  Chip,
  Stack,
} from "@mui/material";
import type { SelectedHospital } from "@/stores/referralCreateStore";

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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        รายการสถานพยาบาลที่ส่งไป
      </DialogTitle>
      <DialogContent>
        {hospitals.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ py: 4, textAlign: "center" }}>
            ไม่มีสถานพยาบาลที่เลือก
          </Typography>
        ) : (
          <TableContainer component={Paper} sx={{ boxShadow: "none", border: "1px solid #e5e7eb" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f9fafb" }}>
                  <TableCell sx={{ fontWeight: 600, width: 60 }}>ลำดับ</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 60 }}>รูปภาพ</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>สถานพยาบาล</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>เบอร์โทรศัพท์</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>สาขา/แผนก</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hospitals.map((h, i) => (
                  <TableRow key={h.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "#e5e7eb" }}>
                        {h.name?.charAt(0) || "H"}
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {h.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{h.phone || "-"}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {(h.selectedBranches || []).map((b) => (
                          <Chip key={b.value} label={b.name} size="small" />
                        ))}
                        {(!h.selectedBranches || h.selectedBranches.length === 0) && "-"}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
}
