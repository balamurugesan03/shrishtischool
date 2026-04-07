import { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, TextField, MenuItem, Typography, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack, Tooltip,
  Table, TableHead, TableBody, TableRow, TableCell, Paper, Avatar
} from '@mui/material';
import { IconPlus, IconTrash, IconKey, IconShield } from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import api from '../../services/api';

const ROLE_COLORS = { superadmin: 'error', admin: 'primary', staff: 'success' };
const FORM_INIT = { username: '', password: '', name: '', role: 'staff' };

export default function UserManagement() {
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formValues, setFormValues] = useState(FORM_INIT);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (e) {
      enqueueSnackbar(e.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/auth/users', formValues);
      enqueueSnackbar('User created successfully', { variant: 'success' });
      setFormOpen(false);
      setFormValues(FORM_INIT);
      fetchUsers();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || err.message, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      enqueueSnackbar('User deleted', { variant: 'success' });
      fetchUsers();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || err.message, { variant: 'error' });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/auth/users/${selectedUser._id}/reset-password`, { password: newPassword });
      enqueueSnackbar('Password reset successfully', { variant: 'success' });
      setResetOpen(false);
      setNewPassword('');
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || err.message, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => setFormValues(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <Box>
      <PageHeader
        title="User Management"
        subtitle="Create and manage staff login accounts"
        action={
          <Button variant="contained" startIcon={<IconPlus size={16} />} onClick={() => setFormOpen(true)}>
            Add User
          </Button>
        }
      />

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>Loading...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No users found</TableCell></TableRow>
            ) : users.map(u => (
              <TableRow key={u._id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '14px', fontWeight: 700 }}>
                      {u.name[0].toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" fontWeight={600}>{u.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">@{u.username}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={u.role} size="small" color={ROLE_COLORS[u.role] || 'default'}
                    sx={{ fontWeight: 700, fontSize: '11px', textTransform: 'capitalize' }} />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(u.createdAt).toLocaleDateString('en-IN')}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Reset Password">
                    <IconButton size="small" onClick={() => { setSelectedUser(u); setNewPassword(''); setResetOpen(true); }}>
                      <IconKey size={16} />
                    </IconButton>
                  </Tooltip>
                  {u.username !== 'superadmin' && (
                    <Tooltip title="Delete User">
                      <IconButton size="small" color="error" onClick={() => handleDelete(u._id)}>
                        <IconTrash size={16} />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Create User Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleCreate}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
            <IconShield size={20} /> Create New User
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} pt={0.5}>
              <TextField label="Full Name" size="small" fullWidth required
                value={formValues.name} onChange={set('name')} />
              <TextField label="Username" size="small" fullWidth required
                value={formValues.username} onChange={set('username')}
                helperText="Lowercase, no spaces" />
              <TextField label="Password" type="password" size="small" fullWidth required
                value={formValues.password} onChange={set('password')} />
              <TextField select label="Role" size="small" fullWidth
                value={formValues.role} onChange={set('role')}>
                <MenuItem value="staff">Staff — Students & Attendance only</MenuItem>
                <MenuItem value="admin">Admin — Full access</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="text" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Creating...' : 'Create User'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onClose={() => setResetOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleResetPassword}>
          <DialogTitle fontWeight={700}>Reset Password — {selectedUser?.name}</DialogTitle>
          <DialogContent>
            <TextField label="New Password" type="password" size="small" fullWidth required
              value={newPassword} onChange={e => setNewPassword(e.target.value)}
              sx={{ mt: 1 }} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="text" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="warning" disabled={saving}>
              {saving ? 'Saving...' : 'Reset Password'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
