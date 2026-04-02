import { useEffect, useState } from 'react';
import {
  Grid, Box, Typography, Paper, Table, TableHead, TableBody,
  TableRow, TableCell, CircularProgress, Chip, LinearProgress, Stack,
} from '@mui/material';
import {
  IconUsers, IconPackage, IconFileInvoice, IconUserCheck,
  IconCurrencyRupee, IconAlertTriangle, IconArrowUpRight, IconSchool,
} from '@tabler/icons-react';
import { dashboardAPI } from '../services/api';

function StatCard({ title, value, subtitle, icon: Icon, color, trend, trendLabel }) {
  return (
    <Paper sx={{ p: 2.5, position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '8px 8px 0 0' }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mt: 0.5 }}>
        <Box>
          <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary' }}>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-1px', mt: 0.5, lineHeight: 1 }}>
            {value}
          </Typography>
          {subtitle && <Typography variant="caption" color="text.secondary" display="block" mt={0.75}>{subtitle}</Typography>}
        </Box>
        <Box sx={{
          width: 44, height: 44, borderRadius: 1.5,
          background: `${color}18`, border: `1px solid ${color}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={22} color={color} strokeWidth={1.75} />
        </Box>
      </Box>
      {trend !== undefined && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 0.5,
            background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 10, px: 1, py: 0.25,
          }}>
            <IconArrowUpRight size={11} color="#4ade80" />
            <Typography variant="caption" fontWeight={700} sx={{ color: '#4ade80' }}>{Math.abs(trend)}%</Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">{trendLabel}</Typography>
        </Box>
      )}
    </Paper>
  );
}

function SectionHeading({ children }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <Box sx={{ width: 3, height: 18, background: 'linear-gradient(180deg, #6366f1, #8b5cf6)', borderRadius: 1 }} />
      <Typography variant="body2" fontWeight={700}>{children}</Typography>
    </Box>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getData()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 2 }}>
        <CircularProgress color="primary" />
        <Typography variant="body2" color="text.secondary">Loading dashboard…</Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <Typography variant="body2" color="text.secondary">Failed to load dashboard data.</Typography>
      </Box>
    );
  }

  const { students, staff, inventory, finance, recentInvoices } = data;
  const incomeRatio = finance?.monthlyIncome > 0
    ? Math.round((finance.monthlyIncome / (finance.monthlyIncome + finance.monthlyExpense)) * 100)
    : 0;

  return (
    <Stack spacing={3}>
      {/* Page header */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
            Good morning, Admin
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Here's what's happening at Bright Future School today.
          </Typography>
        </Box>
        <Chip
          label="Academic Year 2026–27"
          color="primary"
          variant="outlined"
          icon={<IconSchool size={13} />}
          sx={{ fontWeight: 600 }}
        />
      </Box>

      {/* Stat cards */}
      <Grid container spacing={2}>
        {[
          { title: 'Total Students', value: students?.total ?? 0, subtitle: `${students?.active ?? 0} active enrolled`, icon: IconUsers, color: '#6366f1', trend: 8, trendLabel: 'vs last month' },
          { title: 'Staff Members', value: staff?.total ?? 0, subtitle: `${staff?.active ?? 0} currently active`, icon: IconUserCheck, color: '#ec4899', trend: 2, trendLabel: 'new this month' },
          { title: 'Inventory Items', value: inventory?.totalProducts ?? 0, subtitle: `${inventory?.lowStockCount ?? 0} low stock alerts`, icon: IconPackage, color: '#f59e0b' },
          { title: "Today's Collection", value: `₹${(finance?.todayCollection ?? 0).toLocaleString()}`, subtitle: `${finance?.pendingInvoices ?? 0} invoices pending`, icon: IconCurrencyRupee, color: '#10b981', trend: 12, trendLabel: 'vs yesterday' },
        ].map(card => (
          <Grid item xs={12} sm={6} lg={3} key={card.title}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>

      {/* Main content grid */}
      <Grid container spacing={2}>
        {/* Recent invoices */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2.5, borderRadius: 2 }}>
            <SectionHeading>Recent Invoices</SectionHeading>
            <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Invoice #', 'Student', 'Amount', 'Status'].map(h => (
                    <TableCell key={h}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {recentInvoices?.length > 0 ? recentInvoices.map(inv => (
                  <TableRow key={inv._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary">{inv.invoiceNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{
                          width: 28, height: 28,
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Typography variant="caption" color="white" fontWeight={700}>
                            {inv.student?.firstName?.[0] ?? '?'}
                          </Typography>
                        </Box>
                        <Typography variant="body2">{inv.student?.firstName} {inv.student?.lastName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>₹{inv.totalAmount?.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={inv.paymentStatus}
                        size="small"
                        color={inv.paymentStatus === 'Paid' ? 'success' : inv.paymentStatus === 'Partial' ? 'warning' : 'error'}
                        variant="outlined"
                        sx={{ fontSize: '11px', height: 20, fontWeight: 600 }}
                      />
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary" py={2}>No recent invoices found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </Box>
          </Paper>
        </Grid>

        {/* Right panel */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={2}>
            {/* Monthly finance */}
            <Paper sx={{ p: 2.5, borderRadius: 2 }}>
              <SectionHeading>Monthly Finance</SectionHeading>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, background: '#10b981', borderRadius: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">Income</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={700} color="success.main">
                    ₹{(finance?.monthlyIncome ?? 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, background: '#ef4444', borderRadius: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">Expense</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={700} color="error.main">
                    ₹{(finance?.monthlyExpense ?? 0).toLocaleString()}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={incomeRatio}
                  sx={{ height: 7, borderRadius: 4, backgroundColor: 'rgba(239,68,68,0.2)', '& .MuiLinearProgress-bar': { borderRadius: 4, backgroundColor: '#10b981' } }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Income {incomeRatio}%</Typography>
                  <Typography variant="caption" color="text.secondary">Expense {100 - incomeRatio}%</Typography>
                </Box>
                <Box sx={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 1.5, p: 1.5 }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Balance</Typography>
                  <Typography
                    variant="h6" fontWeight={800} mt={0.25}
                    color={(finance?.monthlyIncome ?? 0) >= (finance?.monthlyExpense ?? 0) ? 'success.main' : 'error.main'}
                  >
                    ₹{Math.abs((finance?.monthlyIncome ?? 0) - (finance?.monthlyExpense ?? 0)).toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Low stock alert */}
            {inventory?.lowStockItems?.length > 0 && (
              <Paper sx={{ p: 2.5, borderRadius: 2, borderColor: 'warning.main', background: 'rgba(245,158,11,0.05)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Box sx={{ width: 30, height: 30, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconAlertTriangle size={15} color="#f59e0b" />
                  </Box>
                  <Typography variant="body2" fontWeight={700} flex={1}>Low Stock Alert</Typography>
                  <Chip label={inventory.lowStockItems.length} color="warning" size="small" sx={{ height: 18, fontSize: '11px' }} />
                </Box>
                <Stack spacing={0.75}>
                  {inventory.lowStockItems.map(item => (
                    <Box key={item._id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">{item.name}</Typography>
                      <Chip label={`${item.currentStock} left`} color="warning" variant="outlined" size="small" sx={{ height: 18, fontSize: '11px', fontWeight: 600 }} />
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
