import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Grid, Box, Typography, Card, CardContent, Avatar, Divider, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, Button, CircularProgress, Chip, Paper,
} from '@mui/material';
import {
  IconEdit, IconArrowLeft, IconPackage, IconFileInvoice, IconCurrencyRupee,
  IconBrandWhatsapp, IconEye,
} from '@tabler/icons-react';
import { studentAPI, whatsappAPI } from '../../services/api';
import { useSnackbar } from 'notistack';
import StatusBadge from '../../components/StatusBadge';
import PageHeader from '../../components/PageHeader';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function InfoRow({ label, value }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={500}>{value || '-'}</Typography>
    </Box>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="subtitle1" fontWeight={800} color={color}>{value}</Typography>
    </Paper>
  );
}

function TabPanel({ children, value, index }) {
  return value === index ? <Box>{children}</Box> : null;
}

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    studentAPI.getProfile(id)
      .then(res => setProfile(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}><CircularProgress /></Box>;
  if (!profile) return <Box sx={{ display: 'flex', justifyContent: 'center', height: 400, alignItems: 'center' }}><Typography color="text.secondary">Student not found</Typography></Box>;

  const { student, inventory, invoices, fees } = profile;

  // Fee summary totals
  const feeTotal   = (fees || []).reduce((s, f) => s + (f.amount || 0), 0);
  const feePaid    = (fees || []).reduce((s, f) => s + (f.paidAmount || 0), 0);
  const feePending = (fees || []).reduce((s, f) => s + (f.balance || 0), 0);

  // Invoice summary totals
  const invTotal   = (invoices || []).reduce((s, i) => s + (i.totalAmount || 0), 0);
  const invPaid    = (invoices || []).reduce((s, i) => s + (i.paidAmount || 0), 0);
  const invBalance = (invoices || []).reduce((s, i) => s + (i.balance || 0), 0);

  const sendWhatsApp = async (inv) => {
    if (!student.phone) { enqueueSnackbar('Student phone number not available', { variant: 'warning' }); return; }
    const invDate = inv.date ? new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const dueDate = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    const msg = [
      `🎓 *Shrishti Kinder International School*`,
      `📄 Invoice: *#${inv.invoiceNumber}*`,
      ``,
      `Dear *${student.firstName} ${student.lastName}*,`,
      `*Student ID:* ${student.studentId}`,
      `*Class:* ${student.class}-${student.section}`,
      `*Invoice Date:* ${invDate}`,
      inv.dueDate ? `*Due Date:* ${dueDate}` : null,
      ``,
      `*Total:* ${fmt(inv.totalAmount)}`,
      `✅ *Paid:* ${fmt(inv.paidAmount)}`,
      `${inv.balance > 0 ? '⚠️' : '✅'} *Balance:* ${fmt(inv.balance)}`,
      `*Status:* ${inv.paymentStatus}`,
      ``,
      `Thank you! 🙏`,
    ].filter(Boolean).join('\n');

    try {
      await whatsappAPI.send(student.phone, msg);
      enqueueSnackbar(`Invoice sent to ${student.phone}`, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    }
  };

  return (
    <>
      <PageHeader
        title="Student Profile"
        breadcrumbs={[{ label: 'Students', path: '/students' }, { label: `${student.firstName} ${student.lastName}` }]}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="text" startIcon={<IconArrowLeft size={16} />} onClick={() => navigate('/students')}>Back</Button>
            <Button variant="contained" startIcon={<IconEdit size={16} />} onClick={() => navigate(`/students/edit/${id}`)}>Edit</Button>
          </Box>
        }
      />

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 28, fontWeight: 700, mb: 1.5 }}>
                  {student.firstName?.[0]}{student.lastName?.[0]}
                </Avatar>
                <Typography variant="h6" fontWeight={700}>{student.firstName} {student.lastName}</Typography>
                <Typography variant="body2" color="text.secondary">{student.studentId}</Typography>
                <Box mt={0.5}><StatusBadge status={student.status} /></Box>
              </Box>
              <Divider sx={{ mb: 1.5 }} />
              <InfoRow label="Class" value={`Class ${student.class} - ${student.section}`} />
              <InfoRow label="Roll No." value={student.rollNumber} />
              <InfoRow label="Email" value={student.email} />
              <InfoRow label="Phone" value={student.phone} />
              <InfoRow label="Blood Group" value={student.bloodGroup} />
              <InfoRow label="Academic Year" value={student.academicYear} />
              <InfoRow label="Admission Date" value={student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : '-'} />
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2, mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} mb={1.5}>Parent Details</Typography>
              <InfoRow label="Father" value={student.parentDetails?.fatherName} />
              <InfoRow label="Father Phone" value={student.parentDetails?.fatherPhone} />
              <InfoRow label="Mother" value={student.parentDetails?.motherName} />
              <InfoRow label="Mother Phone" value={student.parentDetails?.motherPhone} />
            </CardContent>
          </Card>

          {/* Fee Summary Card */}
          <Card sx={{ borderRadius: 2, mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} mb={1.5}>Fee Summary</Typography>
              <Grid container spacing={1}>
                <Grid item xs={4}><SummaryCard label="Total" value={fmt(feeTotal)} color="text.primary" /></Grid>
                <Grid item xs={4}><SummaryCard label="Paid" value={fmt(feePaid)} color="success.main" /></Grid>
                <Grid item xs={4}><SummaryCard label="Pending" value={fmt(feePending)} color={feePending > 0 ? 'error.main' : 'success.main'} /></Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Tab icon={<IconCurrencyRupee size={14} />} iconPosition="start" label={`Fees (${fees?.length || 0})`} />
            <Tab icon={<IconFileInvoice size={14} />} iconPosition="start" label={`Invoices (${invoices?.length || 0})`} />
            <Tab icon={<IconPackage size={14} />} iconPosition="start" label={`Inventory (${inventory?.length || 0})`} />
          </Tabs>

          {/* ── FEES TAB ── */}
          <TabPanel value={tab} index={0}>
            {/* Invoice totals summary bar */}
            <Grid container spacing={1.5} mb={2}>
              <Grid item xs={4}><SummaryCard label="Total Fees" value={fmt(feeTotal)} color="text.primary" /></Grid>
              <Grid item xs={4}><SummaryCard label="Paid" value={fmt(feePaid)} color="success.main" /></Grid>
              <Grid item xs={4}><SummaryCard label="Pending" value={fmt(feePending)} color={feePending > 0 ? 'error.main' : 'success.main'} /></Grid>
            </Grid>
            <Card sx={{ borderRadius: 2 }}>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {['Fee Type', 'Total Amount', 'Paid', 'Pending', 'Due Date', 'Status'].map(h => (
                        <TableCell key={h}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fees?.length > 0 ? fees.map(fee => (
                      <TableRow key={fee._id} hover>
                        <TableCell><Typography variant="body2" fontWeight={500}>{fee.feeType}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{fmt(fee.amount)}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="success.main" fontWeight={500}>{fmt(fee.paidAmount)}</Typography></TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color={fee.balance > 0 ? 'error.main' : 'success.main'}>
                            {fmt(fee.balance)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell><StatusBadge status={fee.status} /></TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary" py={2}>No fee records found</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Card>
          </TabPanel>

          {/* ── INVOICES TAB ── */}
          <TabPanel value={tab} index={1}>
            <Grid container spacing={1.5} mb={2}>
              <Grid item xs={4}><SummaryCard label="Total" value={fmt(invTotal)} color="text.primary" /></Grid>
              <Grid item xs={4}><SummaryCard label="Paid" value={fmt(invPaid)} color="success.main" /></Grid>
              <Grid item xs={4}><SummaryCard label="Balance" value={fmt(invBalance)} color={invBalance > 0 ? 'error.main' : 'success.main'} /></Grid>
            </Grid>
            <Card sx={{ borderRadius: 2 }}>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {['Invoice #', 'Type', 'Total', 'Paid', 'Balance', 'Status', ''].map(h => (
                        <TableCell key={h}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices?.length > 0 ? invoices.map(inv => (
                      <TableRow key={inv._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="primary">{inv.invoiceNumber}</Typography>
                        </TableCell>
                        <TableCell>{inv.invoiceType}</TableCell>
                        <TableCell>{fmt(inv.totalAmount)}</TableCell>
                        <TableCell><Typography variant="body2" color="success.main">{fmt(inv.paidAmount)}</Typography></TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color={inv.balance > 0 ? 'error.main' : 'success.main'}>
                            {fmt(inv.balance)}
                          </Typography>
                        </TableCell>
                        <TableCell><StatusBadge status={inv.paymentStatus} /></TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<IconEye size={13} />}
                              onClick={() => navigate(`/billing/invoices/${inv._id}`)}
                              sx={{ fontSize: '11px', py: 0.25, px: 1 }}
                            >
                              View
                            </Button>
                            {student.phone && (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<IconBrandWhatsapp size={13} />}
                                onClick={() => sendWhatsApp(inv)}
                                sx={{ fontSize: '11px', py: 0.25, px: 1, bgcolor: '#25D366', '&:hover': { bgcolor: '#1ebe5c' } }}
                              >
                                WA
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary" py={2}>No invoices found</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Card>
          </TabPanel>

          {/* ── INVENTORY TAB ── */}
          <TabPanel value={tab} index={2}>
            <Card sx={{ borderRadius: 2 }}>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {['Product', 'Qty', 'Price', 'Total', 'Date', 'Status'].map(h => <TableCell key={h}>{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventory?.length > 0 ? inventory.map(item => (
                      <TableRow key={item._id} hover>
                        <TableCell><Typography variant="body2">{item.product?.name}</Typography></TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{fmt(item.pricePerUnit)}</TableCell>
                        <TableCell>{fmt(item.totalPrice)}</TableCell>
                        <TableCell>{new Date(item.issueDate).toLocaleDateString()}</TableCell>
                        <TableCell><StatusBadge status={item.status} /></TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary" py={2}>No inventory items issued</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Card>
          </TabPanel>
        </Grid>
      </Grid>
    </>
  );
}
