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
import { usePermissionStore } from "@/stores/permissionStore";

interface PermissionGroup {
  id: number;
  name: string;
  role?: string;
  userCount?: number;
}

export default function PermissionGroupPage() {
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<PermissionGroup>>({});

  const permissionStore = usePermissionStore();

  const fetchPermissionGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("auth-service/permission/group/findAndCount", {
        params: {
          offset: page,
          limit: rowsPerPage,
          search: search,
        },
      });
      setGroups(response.data?.rows || []);
      setTotalCount(response.data?.count || 0);
    } catch (err) {
      setError("Failed to fetch permission groups");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissionGroups();
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

  const handleEditClick = (group: PermissionGroup) => {
    setEditingId(group.id);
    setFormData(group);
    setOpenDialog(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (confirm("Are you sure you want to delete this permission group?")) {
      try {
        setLoading(true);
        await permissionStore.deletePermissionGroup(id);
        setError(null);
        fetchPermissionGroups();
      } catch (err) {
        setError("Failed to delete permission group");
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
        await permissionStore.updatePermissionGroup(editingId, formData);
      } else {
        await permissionStore.createPermissionGroup(formData);
      }
      setError(null);
      setOpenDialog(false);
      setFormData({});
      fetchPermissionGroups();
    } catch (err) {
      setError("Failed to save permission group");
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
        จัดการกลุ่มสิทธิ์
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            placeholder="ค้นหากลุ่มสิทธิ์"
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
                    <TableCell>ชื่อกลุ่มสิทธิ์</TableCell>
                    <TableCell>บทบาท</TableCell>
                    <TableCell>จำนวนผู้ใช้</TableCell>
                    <TableCell>จัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groups.map((group, index) => (
                    <TableRow key={group.id}>
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>{group.name}</TableCell>
                      <TableCell>{group.role}</TableCell>
                      <TableCell>{group.userCount || 0}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(group)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(group.id)}
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
          {editingId ? "แก้ไขกลุ่มสิทธิ์" : "เพิ่มกลุ่มสิทธิ์ใหม่"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="ชื่อกลุ่มสิทธิ์"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="บทบาท"
              value={formData.role || ""}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
