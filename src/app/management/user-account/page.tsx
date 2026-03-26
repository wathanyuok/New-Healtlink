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
import { useUserStore } from "@/stores/userStore";

interface User {
  id: number;
  username: string;
  fullName: string;
  hospital?: string;
  permissionGroup?: string;
  status?: string;
}

export default function UserAccountPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});

  const userStore = useUserStore();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("auth-service/user/findAndCount", {
        params: {
          offset: page,
          limit: rowsPerPage,
          search: search,
        },
      });
      setUsers(response.data?.rows || []);
      setTotalCount(response.data?.count || 0);
    } catch (err) {
      setError("Failed to fetch users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
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

  const handleEditClick = (user: User) => {
    setEditingId(user.id);
    setFormData(user);
    setOpenDialog(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        setLoading(true);
        await userStore.deleteUser(id);
        setError(null);
        fetchUsers();
      } catch (err) {
        setError("Failed to delete user");
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
        await userStore.updateUser(editingId, formData);
      } else {
        await userStore.createUser(formData);
      }
      setError(null);
      setOpenDialog(false);
      setFormData({});
      fetchUsers();
    } catch (err) {
      setError("Failed to save user");
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
        จัดการบัญชีผู้ใช้
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            placeholder="ค้นหาผู้ใช้"
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
                    <TableCell>ชื่อผู้ใช้</TableCell>
                    <TableCell>ชื่อ-สกุล</TableCell>
                    <TableCell>โรงพยาบาล</TableCell>
                    <TableCell>กลุ่มสิทธิ์</TableCell>
                    <TableCell>สถานะ</TableCell>
                    <TableCell>จัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>{user.hospital}</TableCell>
                      <TableCell>{user.permissionGroup}</TableCell>
                      <TableCell>{user.status}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(user)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(user.id)}
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
          {editingId ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="ชื่อผู้ใช้"
              value={formData.username || ""}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              fullWidth
            />
            <TextField
              label="ชื่อ-สกุล"
              value={formData.fullName || ""}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              fullWidth
            />
            <TextField
              label="โรงพยาบาล"
              value={formData.hospital || ""}
              onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
              fullWidth
            />
            <TextField
              label="กลุ่มสิทธิ์"
              value={formData.permissionGroup || ""}
              onChange={(e) => setFormData({ ...formData, permissionGroup: e.target.value })}
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
