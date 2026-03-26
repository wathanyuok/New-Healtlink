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
import { useHospitalStore } from "@/stores/hospitalStore";

interface Hospital {
  id: number;
  name: string;
  code: string;
  type?: string;
  zone?: string;
  affiliation?: string;
  serviceLevel?: string;
}

export default function HospitalPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Hospital>>({});

  const hospitalStore = useHospitalStore();

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("main-service/hospital/findAndCount", {
        params: {
          offset: page,
          limit: rowsPerPage,
          search: search,
        },
      });
      setHospitals(response.data?.rows || []);
      setTotalCount(response.data?.count || 0);
    } catch (err) {
      setError("Failed to fetch hospitals");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
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

  const handleEditClick = (hospital: Hospital) => {
    setEditingId(hospital.id);
    setFormData(hospital);
    setOpenDialog(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (confirm("Are you sure you want to delete this hospital?")) {
      try {
        setLoading(true);
        await hospitalStore.deleteHospital(id);
        setError(null);
        fetchHospitals();
      } catch (err) {
        setError("Failed to delete hospital");
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
        await hospitalStore.updateHospital(editingId, formData);
      } else {
        await hospitalStore.createHospital(formData);
      }
      setError(null);
      setOpenDialog(false);
      setFormData({});
      fetchHospitals();
    } catch (err) {
      setError("Failed to save hospital");
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
        จัดการสถานพยาบาล
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            placeholder="ค้นหาสถานพยาบาล"
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
                    <TableCell>ชื่อสถานพยาบาล</TableCell>
                    <TableCell>รหัส</TableCell>
                    <TableCell>ประเภท</TableCell>
                    <TableCell>โซน</TableCell>
                    <TableCell>สังกัด</TableCell>
                    <TableCell>ระดับบริการ</TableCell>
                    <TableCell>จัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hospitals.map((hospital, index) => (
                    <TableRow key={hospital.id}>
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>{hospital.name}</TableCell>
                      <TableCell>{hospital.code}</TableCell>
                      <TableCell>{hospital.type}</TableCell>
                      <TableCell>{hospital.zone}</TableCell>
                      <TableCell>{hospital.affiliation}</TableCell>
                      <TableCell>{hospital.serviceLevel}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(hospital)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(hospital.id)}
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
          {editingId ? "แก้ไขสถานพยาบาล" : "เพิ่มสถานพยาบาลใหม่"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="ชื่อสถานพยาบาล"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="รหัส"
              value={formData.code || ""}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              fullWidth
            />
            <TextField
              label="ประเภท"
              value={formData.type || ""}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              fullWidth
            />
            <TextField
              label="โซน"
              value={formData.zone || ""}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
              fullWidth
            />
            <TextField
              label="สังกัด"
              value={formData.affiliation || ""}
              onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
              fullWidth
            />
            <TextField
              label="ระดับบริการ"
              value={formData.serviceLevel || ""}
              onChange={(e) => setFormData({ ...formData, serviceLevel: e.target.value })}
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
