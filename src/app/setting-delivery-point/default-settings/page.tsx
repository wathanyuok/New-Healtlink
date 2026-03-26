"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Stack,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import api from "@/lib/api";

interface DeliveryPoint {
  id: number;
  name: string;
  type?: string;
  status?: string;
}

export default function DefaultSettingsPage() {
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<DeliveryPoint>>({});

  const fetchDeliveryPoints = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(
        "main-service/referral/deliveryPointTypeStart/findAndCount",
        {
          params: {
            offset: page,
            limit: rowsPerPage,
            search: search,
          },
        }
      );
      setDeliveryPoints(response.data?.rows || []);
      setTotalCount(response.data?.count || 0);
    } catch (err) {
      setError("Failed to fetch delivery points");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryPoints();
  }, [page, rowsPerPage, search]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({});
    setOpenDialog(true);
  };

  const handleEditClick = (point: DeliveryPoint) => {
    setEditingId(point.id);
    setFormData(point);
    setOpenDialog(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (confirm("Are you sure you want to delete this delivery point?")) {
      try {
        setLoading(true);
        await api.delete(`main-service/referral/deliveryPointTypeStart/delete/${id}`);
        setError(null);
        fetchDeliveryPoints();
      } catch (err) {
        setError("Failed to delete delivery point");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (editingId) {
        await api.put(
          `main-service/referral/deliveryPointTypeStart/update/${editingId}`,
          formData
        );
      } else {
        await api.post(
          "main-service/referral/deliveryPointTypeStart/create",
          formData
        );
      }
      setError(null);
      setOpenDialog(false);
      setFormData({});
      fetchDeliveryPoints();
    } catch (err) {
      setError("Failed to save delivery point");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        จัดการจุดส่งตัว
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            placeholder="ค้นหาจุดส่งตัว"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
          >
            เพิ่มใหม่
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell>ลำดับ</TableCell>
                    <TableCell>ชื่อจุดส่ง</TableCell>
                    <TableCell>ประเภท</TableCell>
                    <TableCell>สถานะ</TableCell>
                    <TableCell>จัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deliveryPoints.map((point, index) => (
                    <TableRow key={point.id}>
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>{point.name}</TableCell>
                      <TableCell>{point.type}</TableCell>
                      <TableCell>{point.status}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(point)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(point.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? "แก้ไขจุดส่งตัว" : "เพิ่มจุดส่งตัวใหม่"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="ชื่อจุดส่ง"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="ประเภท"
              value={formData.type || ""}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              fullWidth
            />
            <TextField
              label="สถานะ"
              value={formData.status || ""}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>ยกเลิก</Button>
          <Button onClick={handleSave} variant="contained">
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
