import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Box, Button, IconButton, Typography, Avatar,
  Menu, MenuItem, Drawer, List, ListItem, ListItemButton, ListItemText,
  ListItemIcon, Collapse, Divider, Tooltip, Badge, useMediaQuery, useTheme,
} from '@mui/material';
import {
  IconSchool, IconMenu2, IconSun, IconMoon, IconBell,
  IconDashboard, IconUsers, IconPackage, IconFileInvoice,
  IconUserCheck, IconCalculator, IconChevronDown, IconChevronRight,
  IconChevronUp, IconList, IconTag, IconShoppingCart, IconSend,
  IconHistory, IconChartBar, IconCash, IconBook, IconReceipt,
  IconCurrencyRupee, IconBrandWhatsapp, IconLogout,
  IconScan, IconQrcode, IconClipboardList,
} from '@tabler/icons-react';
import { useColorMode } from '../App';
import WhatsAppModal from './WhatsAppModal';
import { whatsappAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: IconDashboard },
  { label: 'Students',  path: '/students', icon: IconUsers },
  {
    label: 'Inventory', icon: IconPackage,
    children: [
      { label: 'Products',       path: '/inventory/products',  icon: IconList },
      { label: 'Categories',     path: '/inventory/categories',icon: IconTag },
      { label: 'Purchase Entry', path: '/inventory/purchases', icon: IconShoppingCart },
      { label: 'Issue Inventory',path: '/inventory/issue',     icon: IconSend },
      { label: 'Issue History',  path: '/inventory/issue-history', icon: IconHistory },
      { label: 'Stock Report',   path: '/inventory/stock',     icon: IconChartBar },
    ],
  },
  {
    label: 'Billing', icon: IconFileInvoice,
    children: [
      { label: 'Invoices', path: '/billing/invoices', icon: IconReceipt },
      { label: 'Fees',     path: '/billing/fees',     icon: IconCurrencyRupee },
    ],
  },
  {
    label: 'Attendance', icon: IconScan,
    children: [
      { label: 'Scan QR',         path: '/attendance/scan',    icon: IconScan },
      { label: 'Student QR Cards',path: '/attendance/qr',      icon: IconQrcode },
      { label: 'History',         path: '/attendance/history', icon: IconClipboardList },
    ],
  },
  { label: 'Staff', path: '/staff', icon: IconUserCheck },
  {
    label: 'Accounting', icon: IconCalculator,
    children: [
      { label: 'Ledger',   path: '/accounting/ledger',   icon: IconBook },
      { label: 'Day Book', path: '/accounting/daybook',  icon: IconList },
      { label: 'Cash Book',path: '/accounting/cashbook', icon: IconCash },
      { label: 'Payments', path: '/accounting/payments', icon: IconReceipt },
    ],
  },
];

function NavDropdown({ item, location }) {
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(null);
  const Icon = item.icon;
  const isActive = item.children?.some(c => location.pathname.startsWith(c.path));

  return (
    <>
      <Button
        onClick={(e) => setAnchor(e.currentTarget)}
        endIcon={<IconChevronDown size={14} />}
        sx={{
          color: isActive ? 'primary.main' : 'text.primary',
          fontWeight: isActive ? 700 : 500,
          fontSize: '13px',
          px: 1.5,
          py: 0.75,
          borderRadius: 1.5,
          '&:hover': { bgcolor: 'action.hover' },
        }}
        startIcon={<Icon size={16} />}
      >
        {item.label}
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        PaperProps={{ sx: { mt: 0.5, minWidth: 200, borderRadius: 2 } }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        {item.children.map(child => {
          const CIcon = child.icon;
          return (
            <MenuItem
              key={child.path}
              onClick={() => { navigate(child.path); setAnchor(null); }}
              selected={location.pathname === child.path}
              sx={{ fontSize: '13px', gap: 1.5, borderRadius: 1, mx: 0.5, my: 0.25 }}
            >
              <CIcon size={15} />
              {child.label}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

function MobileDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSections, setOpenSections] = useState({});

  const toggle = (label) => setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));

  return (
    <Drawer anchor="left" open={open} onClose={onClose} PaperProps={{ sx: { width: 280 } }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 32, height: 32, bgcolor: 'primary.main', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconSchool size={18} color="#fff" />
        </Box>
        <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: '-0.2px' }}>
          EduManage Pro
        </Typography>
      </Box>
      <Divider />
      <List dense>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          if (!item.children) {
            return (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => { navigate(item.path); onClose(); }}
                  sx={{ borderRadius: 1, mx: 1, my: 0.25 }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}><Icon size={18} /></ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '13px', fontWeight: 600 }} />
                </ListItemButton>
              </ListItem>
            );
          }
          return (
            <Box key={item.label}>
              <ListItem disablePadding>
                <ListItemButton onClick={() => toggle(item.label)} sx={{ borderRadius: 1, mx: 1, my: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}><Icon size={18} /></ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '13px', fontWeight: 600 }} />
                  {openSections[item.label] ? <IconChevronUp size={14} /> : <IconChevronRight size={14} />}
                </ListItemButton>
              </ListItem>
              <Collapse in={Boolean(openSections[item.label])}>
                <List dense disablePadding>
                  {item.children.map(child => {
                    const CIcon = child.icon;
                    return (
                      <ListItem key={child.path} disablePadding>
                        <ListItemButton
                          selected={location.pathname === child.path}
                          onClick={() => { navigate(child.path); onClose(); }}
                          sx={{ pl: 5, borderRadius: 1, mx: 1, my: 0.25 }}
                        >
                          <ListItemIcon sx={{ minWidth: 28 }}><CIcon size={15} /></ListItemIcon>
                          <ListItemText primary={child.label} primaryTypographyProps={{ fontSize: '12px' }} />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </List>
    </Drawer>
  );
}

export default function TopNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { mode, toggleColorMode } = useColorMode();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waStatus, setWaStatus] = useState('disconnected');

  const handleLogout = () => { logout(); navigate('/login'); };

  const pollWA = useCallback(async () => {
    try { const r = await whatsappAPI.getStatus(); setWaStatus(r.status); } catch (_) {}
  }, []);

  useEffect(() => {
    pollWA();
    const t = setInterval(pollWA, 5000);
    return () => clearInterval(t);
  }, [pollWA]);

  const waColor = waStatus === 'connected' ? '#25D366' : waStatus === 'qr' || waStatus === 'initializing' ? '#f59e0b' : '#94a3b8';

  return (
    <>
      <AppBar position="fixed" elevation={0} sx={{ height: 64, justifyContent: 'center' }}>
        <Toolbar sx={{ gap: 1, minHeight: '64px !important', px: { xs: 2, sm: 3 } }}>

          {/* Mobile hamburger */}
          {isMobile && (
            <IconButton onClick={() => setDrawerOpen(true)} size="small">
              <IconMenu2 size={20} />
            </IconButton>
          )}

          {/* Logo + Brand */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mr: 2 }}
            onClick={() => navigate('/')}
          >
            <Box sx={{
              width: 32, height: 32,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: 1.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <IconSchool size={18} color="#fff" />
            </Box>
            <Typography
              variant="subtitle1"
              fontWeight={800}
              sx={{ letterSpacing: '-0.3px', display: { xs: 'none', sm: 'block' }, whiteSpace: 'nowrap' }}
            >
              EduManage Pro
            </Typography>
          </Box>

          {/* Desktop navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, overflow: 'hidden' }}>
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                if (item.children) {
                  return <NavDropdown key={item.label} item={item} location={location} />;
                }
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    startIcon={<Icon size={16} />}
                    sx={{
                      color: isActive ? 'primary.main' : 'text.primary',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '13px',
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 1.5,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>
          )}

          <Box sx={{ flex: isMobile ? 1 : 'unset' }} />

          {/* Right controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Theme toggle */}
            <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
              <IconButton onClick={toggleColorMode} size="small">
                {mode === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
              </IconButton>
            </Tooltip>

            {/* WhatsApp status */}
            <Tooltip title={`WhatsApp: ${waStatus}`}>
              <IconButton size="small" onClick={() => setWaModalOpen(true)}
                sx={{ position: 'relative' }}>
                <IconBrandWhatsapp size={18} color={waColor} />
                <Box sx={{
                  position: 'absolute', top: 6, right: 6,
                  width: 7, height: 7, borderRadius: '50%',
                  bgcolor: waColor, border: '1.5px solid',
                  borderColor: 'background.paper',
                }} />
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton size="small">
                <Badge badgeContent={3} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '10px', minWidth: 16, height: 16 } }}>
                  <IconBell size={18} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 0.5, pl: 1, borderLeft: '1px solid', borderColor: 'divider' }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '13px', fontWeight: 700 }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="caption" fontWeight={700} display="block" lineHeight={1.2}>{user?.name || 'Admin'}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" lineHeight={1} fontSize="10px" sx={{ textTransform: 'capitalize' }}>{user?.role || 'Administrator'}</Typography>
              </Box>
              <Tooltip title="Logout">
                <IconButton size="small" onClick={handleLogout} sx={{ ml: 0.5, color: 'text.secondary' }}>
                  <IconLogout size={16} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <WhatsAppModal open={waModalOpen} onClose={() => setWaModalOpen(false)} />
    </>
  );
}
