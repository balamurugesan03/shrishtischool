import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip,
  List, ListItem, ListItemText, ListItemAvatar, Avatar,
  Divider, Alert, CircularProgress, Paper
} from '@mui/material';
import {
  IconScan, IconCheck, IconX, IconBrandWhatsapp,
  IconArrowRight, IconClock, IconSchool
} from '@tabler/icons-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import api from '../../services/api';

export default function AttendanceScan() {
  const { enqueueSnackbar } = useSnackbar();
  const qrRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null); // { type, student, whatsappSent, timestamp }
  const [recentScans, setRecentScans] = useState([]);
  const [cameraError, setCameraError] = useState(null);
  const processingRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (qrRef.current) {
      try { await qrRef.current.stop(); } catch (_) {}
      qrRef.current = null;
    }
    setScanning(false);
  }, []);

  const handleScanResult = useCallback(async (decodedText) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);

    try {
      const res = await api.post('/attendance/scan', { studentId: decodedText });
      const result = {
        type: res.data.type,
        student: res.data.student,
        whatsappSent: res.data.whatsappSent,
        whatsappError: res.data.whatsappError,
        phoneCount: res.data.phoneCount,
        timestamp: new Date()
      };
      setLastResult(result);
      setRecentScans(prev => [result, ...prev.slice(0, 19)]);
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setProcessing(false);
      // Resume after 3 seconds
      setTimeout(() => { processingRef.current = false; }, 3000);
    }
  }, [enqueueSnackbar]);

  const startScanner = useCallback(async () => {
    setCameraError(null);
    setScanning(true);

    try {
      const qr = new Html5Qrcode('qr-reader');
      qrRef.current = qr;

      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1 },
        handleScanResult,
        () => {} // ignore decode errors
      );
    } catch (err) {
      setCameraError('Camera not accessible. Please allow camera permission and try again.');
      setScanning(false);
      qrRef.current = null;
    }
  }, [handleScanResult]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const resultColor = lastResult?.type === 'IN' ? 'success' : 'warning';
  const resultIcon = lastResult?.type === 'IN' ? <IconArrowRight size={20} /> : <IconX size={20} />;

  return (
    <Box>
      <PageHeader
        title="Attendance Scanner"
        subtitle="Scan student QR codes to mark IN / OUT attendance"
      />

      <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>

        {/* Scanner panel */}
        <Box sx={{ flex: '0 0 auto', width: { xs: '100%', md: 360 } }}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconScan size={18} /> Camera Scanner
              </Typography>

              {/* Camera area — html5-qrcode renders into this div */}
              <Box
                id="qr-reader"
                sx={{
                  width: '100%',
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: scanning ? 'transparent' : 'transparent',
                  display: scanning ? 'block' : 'none',
                  '& video': { borderRadius: 2, width: '100% !important' },
                  '& #qr-reader__dashboard_section_csr button': { display: 'none' },
                  '& #qr-reader__header_message': { display: 'none' },
                  '& #qr-reader__status_span': { display: 'none' },
                }}
              />

              {!scanning && (
                <Box sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  minHeight: 300, flexDirection: 'column', gap: 1
                }}>
                  <IconScan size={40} color="#94a3b8" />
                  <Typography variant="body2" color="text.secondary">
                    Click Start to open camera
                  </Typography>
                </Box>
              )}

              {cameraError && (
                <Alert severity="error" sx={{ mt: 1, fontSize: '12px' }}>{cameraError}</Alert>
              )}

              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                {!scanning ? (
                  <Button
                    fullWidth variant="contained" size="large"
                    startIcon={<IconScan size={18} />}
                    onClick={startScanner}
                  >
                    Start Scanning
                  </Button>
                ) : (
                  <Button
                    fullWidth variant="outlined" color="error" size="large"
                    onClick={stopScanner}
                  >
                    Stop Camera
                  </Button>
                )}
              </Box>

              {processing && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, justifyContent: 'center' }}>
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="text.secondary">Processing...</Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Last scan result */}
          {lastResult && (
            <Card
              variant="outlined"
              sx={{
                mt: 2, borderRadius: 3,
                borderColor: lastResult.type === 'IN' ? 'success.main' : 'warning.main',
                borderWidth: 2
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Chip
                    label={lastResult.type === 'IN' ? 'ENTERED' : 'LEFT'}
                    color={resultColor}
                    size="small"
                    icon={resultIcon}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(lastResult.timestamp)}
                  </Typography>
                </Box>

                <Typography variant="h6" fontWeight={700}>
                  {lastResult.student.firstName} {lastResult.student.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {lastResult.student.studentId} &bull; Class {lastResult.student.class} - {lastResult.student.section}
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconBrandWhatsapp size={16} color={lastResult.whatsappSent ? '#25D366' : '#94a3b8'} />
                  <Typography variant="caption" color={lastResult.whatsappSent ? 'success.main' : 'text.secondary'}>
                    {lastResult.whatsappSent
                      ? `WhatsApp sent (${lastResult.phoneCount || 1} number${(lastResult.phoneCount || 1) > 1 ? 's' : ''})`
                      : lastResult.whatsappError
                        ? `Failed: ${lastResult.whatsappError}`
                        : 'No phone number on record'
                    }
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Recent scans log */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconClock size={18} /> Today&apos;s Scan Log
              </Typography>

              {recentScans.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <IconSchool size={40} color="#94a3b8" />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    No scans yet. Start scanning to see the log.
                  </Typography>
                </Box>
              ) : (
                <List dense disablePadding>
                  {recentScans.map((scan, i) => (
                    <Box key={i}>
                      {i > 0 && <Divider />}
                      <ListItem disableGutters sx={{ py: 1 }}>
                        <ListItemAvatar sx={{ minWidth: 40 }}>
                          <Avatar
                            sx={{
                              width: 32, height: 32,
                              bgcolor: scan.type === 'IN' ? 'success.light' : 'warning.light',
                              color: scan.type === 'IN' ? 'success.dark' : 'warning.dark',
                              fontSize: '11px', fontWeight: 800
                            }}
                          >
                            {scan.type}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={600}>
                              {scan.student.firstName} {scan.student.lastName}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {scan.student.studentId} &bull; Class {scan.student.class}-{scan.student.section} &bull; {formatTime(scan.timestamp)}
                            </Typography>
                          }
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                          <IconBrandWhatsapp size={14} color={scan.whatsappSent ? '#25D366' : '#94a3b8'} />
                        </Box>
                      </ListItem>
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
