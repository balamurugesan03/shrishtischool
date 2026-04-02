import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography,
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

export default function ConfirmModal({ opened, onClose, onConfirm, title, message, loading }) {
  return (
    <Dialog open={!!opened} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={700}>{title || 'Confirm Action'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <Box sx={{
            width: 44, height: 44, minWidth: 44,
            background: 'linear-gradient(135deg,#fef2f2,#fee2e2)',
            border: '1px solid #fecaca',
            borderRadius: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <WarningAmberRoundedIcon sx={{ color: '#ef4444', fontSize: 22 }} />
          </Box>
          <Typography variant="body2" pt={0.5}>
            {message || 'Are you sure? This action cannot be undone.'}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="text" color="inherit" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
