import { useEffect, useState, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, CircularProgress, Chip,
} from '@mui/material';
import { IconBrandWhatsapp, IconRefresh, IconPlugConnectedX } from '@tabler/icons-react';
import { whatsappAPI } from '../services/api';

const STATUS_LABEL = {
  disconnected: { label: 'Disconnected', color: 'default' },
  initializing: { label: 'Connecting…',  color: 'warning' },
  qr:           { label: 'Scan QR',       color: 'info'    },
  connected:    { label: 'Connected',     color: 'success' },
};

export default function WhatsAppModal({ open, onClose }) {
  const [status, setStatus]   = useState('disconnected');
  const [qr, setQr]           = useState(null);
  const [loading, setLoading] = useState(false);

  const poll = useCallback(async () => {
    try {
      const res = await whatsappAPI.getStatus();
      setStatus(res.status);
      setQr(res.qr || null);
    } catch (_) {}
  }, []);

  // Poll every 2.5 s while modal is open
  useEffect(() => {
    if (!open) return;
    poll();
    const t = setInterval(poll, 2500);
    return () => clearInterval(t);
  }, [open, poll]);

  const handleConnect = async () => {
    setLoading(true);
    try { await whatsappAPI.connect(); } catch (_) {}
    setLoading(false);
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try { await whatsappAPI.disconnect(); setStatus('disconnected'); setQr(null); } catch (_) {}
    setLoading(false);
  };

  const { label, color } = STATUS_LABEL[status] || STATUS_LABEL.disconnected;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
        <Box sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconBrandWhatsapp size={19} color="#fff" />
        </Box>
        WhatsApp Connect
        <Chip label={label} color={color} size="small" sx={{ ml: 'auto', fontWeight: 600 }} />
      </DialogTitle>

      <DialogContent>
        {/* Connected state */}
        {status === 'connected' && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: 'rgba(37,211,102,0.12)', border: '2px solid #25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
              <IconBrandWhatsapp size={32} color="#25D366" />
            </Box>
            <Typography variant="subtitle1" fontWeight={700} color="success.main">WhatsApp Connected!</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Invoices will be sent directly from your WhatsApp account.
            </Typography>
          </Box>
        )}

        {/* QR state */}
        {status === 'qr' && qr && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Open WhatsApp on your phone → <strong>Linked Devices</strong> → <strong>Link a Device</strong> → scan this QR
            </Typography>
            <Box sx={{ border: '2px solid', borderColor: 'divider', borderRadius: 2, p: 1, display: 'inline-block' }}>
              <img src={qr} alt="WhatsApp QR Code" style={{ width: 220, height: 220, display: 'block' }} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1.5 }}>
              <CircularProgress size={14} />
              <Typography variant="caption" color="text.secondary">Waiting for scan…</Typography>
            </Box>
          </Box>
        )}

        {/* Initializing */}
        {status === 'initializing' && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={40} sx={{ color: '#25D366' }} />
            <Typography variant="body2" color="text.secondary" mt={2}>Starting WhatsApp client…</Typography>
          </Box>
        )}

        {/* Disconnected */}
        {status === 'disconnected' && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Click <strong>Connect</strong> to link your WhatsApp account. A QR code will appear — scan it once and invoices will be sent automatically.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button variant="text" onClick={onClose}>Close</Button>
        {status === 'disconnected' && (
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <IconBrandWhatsapp size={16} />}
            onClick={handleConnect}
            disabled={loading}
            sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1ebe5c' } }}
          >
            Connect
          </Button>
        )}
        {status === 'connected' && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<IconPlugConnectedX size={16} />}
            onClick={handleDisconnect}
            disabled={loading}
          >
            Disconnect
          </Button>
        )}
        {(status === 'qr' || status === 'initializing') && (
          <Button
            variant="outlined"
            startIcon={<IconRefresh size={16} />}
            onClick={poll}
          >
            Refresh
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
