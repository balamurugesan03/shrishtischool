import { useState } from 'react';
import skisLogo from '../assets/logo.png';
import {
  AppShell, ScrollArea, Box, Text,
  UnstyledButton, Tooltip, Collapse, Avatar,
} from '@mantine/core';
import { useLocation, Link } from 'react-router-dom';
import {
  IconLayoutDashboard, IconUsers, IconPackages,
  IconReceiptRupee, IconId, IconReportMoney,
  IconChevronRight, IconLogout,
  IconBook, IconWallet, IconCoin, IconChartBar,
  IconBackpack, IconSettings, IconQrcode, IconUserCheck, IconShield,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import classes from './Sidebar.module.css';

/* ─── NAV SECTIONS CONFIG ──────────────────────────── */
// roles: ['admin'] = admin+superadmin only | ['all'] = everyone | ['staff'] = staff only
const NAV_SECTIONS = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', icon: IconLayoutDashboard, path: '/', color: '#6366f1', bg: 'rgba(99,102,241,0.16)', roles: ['all'] },
    ],
  },
  {
    title: 'Academic',
    items: [
      {
        label: 'Students', icon: IconUsers, color: '#10b981', bg: 'rgba(16,185,129,0.16)', roles: ['all'],
        links: [
          { label: 'All Students', path: '/students' },
          { label: 'Add Student',  path: '/students/add' },
        ],
      },
      { label: 'Student Inventory', icon: IconBackpack, path: '/student-inventory', color: '#8b5cf6', bg: 'rgba(139,92,246,0.16)', roles: ['admin'] },
    ],
  },
  {
    title: 'Finance',
    roles: ['admin'],
    items: [
      {
        label: 'Billing', icon: IconReceiptRupee, color: '#3b82f6', bg: 'rgba(59,130,246,0.16)', roles: ['admin'],
        links: [
          { label: 'All Invoices',   path: '/billing/invoices' },
          { label: 'Create Invoice', path: '/billing/invoices/create' },
        ],
      },
      { label: 'Fees', icon: IconCoin, path: '/billing/fees', color: '#ec4899', bg: 'rgba(236,72,153,0.16)', roles: ['admin'] },
      {
        label: 'Accounting', icon: IconReportMoney, color: '#f97316', bg: 'rgba(249,115,22,0.16)', roles: ['admin'],
        links: [
          { label: 'Ledger',   path: '/accounting/ledger' },
          { label: 'Payments', path: '/accounting/payments' },
        ],
      },
      { label: 'Day Book', icon: IconBook, path: '/accounting/daybook', color: '#84cc16', bg: 'rgba(132,204,22,0.16)', roles: ['admin'] },
      { label: 'Cash Book', icon: IconWallet, path: '/accounting/cashbook', color: '#06b6d4', bg: 'rgba(6,182,212,0.16)', roles: ['admin'] },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        label: 'Inventory', icon: IconPackages, color: '#f59e0b', bg: 'rgba(245,158,11,0.16)', roles: ['admin'],
        links: [
          { label: 'Products',        path: '/inventory/products' },
          { label: 'Categories',      path: '/inventory/categories' },
          { label: 'Purchase Entry',  path: '/inventory/purchases' },
          { label: 'Issue Inventory', path: '/inventory/issue' },
          { label: 'Issue History',   path: '/inventory/issue-history' },
          { label: 'Stock Report',    path: '/inventory/stock' },
        ],
      },
      {
        label: 'Staff', icon: IconId, color: '#14b8a6', bg: 'rgba(20,184,166,0.16)', roles: ['admin'],
        links: [
          { label: 'All Staff', path: '/staff' },
          { label: 'Add Staff', path: '/staff/add' },
        ],
      },
      {
        label: 'Student Attendance', icon: IconQrcode, color: '#6366f1', bg: 'rgba(99,102,241,0.16)', roles: ['all'],
        links: [
          { label: 'Student QR Codes',   path: '/attendance/qr' },
          { label: 'Scan Attendance',    path: '/attendance/scan' },
          { label: 'Attendance History', path: '/attendance/history' },
        ],
      },
      {
        label: 'Staff Attendance', icon: IconUserCheck, color: '#f97316', bg: 'rgba(249,115,22,0.16)', roles: ['all'],
        links: [
          { label: 'Staff QR Codes',        path: '/staff-attendance/qr' },
          { label: 'Scan Attendance',       path: '/staff-attendance/scan' },
          { label: 'Attendance History',    path: '/staff-attendance/history' },
        ],
      },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Reports', icon: IconChartBar, path: '/reports', color: '#a855f7', bg: 'rgba(168,85,247,0.16)', roles: ['admin'] },
      { label: 'Settings', icon: IconSettings, path: '/settings', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', roles: ['admin'] },
      { label: 'User Management', icon: IconShield, path: '/users', color: '#e11d48', bg: 'rgba(225,29,72,0.16)', roles: ['admin'] },
    ],
  },
];

/* ─── COLLAPSED ITEM (icon + tooltip) ─────────────── */
function CollapsedItem({ item }) {
  const { pathname } = useLocation();
  const isLeaf     = !item.links;
  const childActive = !isLeaf && item.links.some(l => pathname === l.path);
  const isActive    = (isLeaf && pathname === item.path) || childActive;

  const btn = (
    <UnstyledButton
      component={isLeaf ? Link : undefined}
      to={isLeaf ? item.path : undefined}
      className={`${classes.collapsedBtn} ${isActive ? classes.collapsedBtnActive : ''}`}
      style={isActive ? { background: item.bg } : {}}
    >
      {isActive && (
        <Box
          className={classes.indicator}
          style={{ background: item.color, boxShadow: `0 0 10px ${item.color}` }}
        />
      )}
      <Box
        className={classes.iconBox}
        style={{
          background: isActive ? item.bg : 'rgba(255,255,255,0.07)',
          boxShadow:  isActive ? `0 4px 14px ${item.color}45` : 'none',
        }}
      >
        <item.icon
          size={20}
          color={isActive ? item.color : '#ffffff'}
          stroke={isActive ? 2.2 : 1.7}
        />
      </Box>
    </UnstyledButton>
  );

  return (
    <Tooltip label={item.label} position="right" withArrow offset={14} color="dark">
      {btn}
    </Tooltip>
  );
}

/* ─── FULL NAV ITEM ────────────────────────────────── */
function NavItem({ item }) {
  const { pathname } = useLocation();
  const isLeaf      = !item.links;
  const childActive = !isLeaf && item.links.some(l => pathname === l.path);
  const isActive    = (isLeaf && pathname === item.path) || childActive;
  const [open, setOpen] = useState(childActive);

  const iconStyle = {
    background: isActive ? item.bg : 'rgba(255,255,255,0.07)',
    boxShadow:  isActive ? `0 4px 14px ${item.color}45` : 'none',
  };

  const indicator = isActive && (
    <Box
      className={classes.indicator}
      style={{ background: item.color, boxShadow: `0 0 10px ${item.color}` }}
    />
  );

  if (isLeaf) {
    return (
      <Box mb={2}>
        <UnstyledButton
          component={Link}
          to={item.path}
          className={`${classes.navBtn} ${isActive ? classes.navBtnActive : ''}`}
          style={isActive ? { background: item.bg } : {}}
        >
          {indicator}
          <Box className={classes.iconBox} style={iconStyle}>
            <item.icon size={19} color={isActive ? item.color : '#ffffff'} stroke={isActive ? 2.2 : 1.7} />
          </Box>
          <Text className={`${classes.navLabel} ${isActive ? classes.navLabelActive : ''}`}>
            {item.label}
          </Text>
        </UnstyledButton>
      </Box>
    );
  }

  return (
    <Box mb={2}>
      <UnstyledButton
        onClick={() => setOpen(o => !o)}
        className={`${classes.navBtn} ${isActive ? classes.navBtnActive : ''}`}
        style={isActive ? { background: item.bg } : {}}
      >
        {indicator}
        <Box className={classes.iconBox} style={iconStyle}>
          <item.icon size={19} color={isActive ? item.color : '#ffffff'} stroke={isActive ? 2.2 : 1.7} />
        </Box>
        <Text className={`${classes.navLabel} ${isActive ? classes.navLabelActive : ''}`}>
          {item.label}
        </Text>
        <IconChevronRight
          size={14}
          className={`${classes.chevron} ${open ? classes.chevronOpen : ''}`}
        />
      </UnstyledButton>

      <Collapse in={open}>
        <Box
          className={classes.subMenu}
          style={{
            borderLeftColor: childActive
              ? `${item.color}60`
              : 'rgba(255,255,255,0.07)',
          }}
        >
          {item.links.map(link => {
            const active = pathname === link.path;
            return (
              <UnstyledButton
                key={link.path}
                component={Link}
                to={link.path}
                className={`${classes.subBtn} ${active ? classes.subBtnActive : ''}`}
              >
                <Box
                  className={`${classes.subDot} ${active ? classes.subDotActive : ''}`}
                  style={{
                    background: active ? item.color : 'transparent',
                    boxShadow: active ? `0 0 8px ${item.color}` : 'none',
                  }}
                />
                <Text
                  className={`${classes.subLabel} ${active ? classes.subLabelActive : ''}`}
                  style={active ? { color: item.color } : {}}
                >
                  {link.label}
                </Text>
              </UnstyledButton>
            );
          })}
        </Box>
      </Collapse>
    </Box>
  );
}

/* ─── SIDEBAR EXPORT ───────────────────────────────── */
export function Sidebar({ collapsed }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  const canSee = (item) => {
    if (!item.roles || item.roles.includes('all')) return true;
    if (item.roles.includes('admin') && isAdmin) return true;
    return false;
  };

  return (
    <AppShell.Navbar className={classes.navbar} p={0}>
      {/* Inner wrapper handles ambient glows safely */}
      <Box className={classes.navInner}>

        {/* Brand */}
        <Box className={classes.brand}>
          <Box component="img" src={skisLogo} alt="SKIS Logo"
            style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6, flexShrink: 0 }} />
          {!collapsed && (
            <>
              <Box style={{ flex: 1, overflow: 'hidden' }}>
                <Text className={classes.brandName} truncate>Shrishti Kinder</Text>
                <Text className={classes.brandSub}>International School</Text>
              </Box>
              <Box className={classes.versionBadge}>v2.0</Box>
            </>
          )}
        </Box>

        {/* Nav sections — flex column + min-height:0 allows ScrollArea to measure */}
        <AppShell.Section
          grow
          style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
        >
          <ScrollArea style={{ flex: 1 }} scrollbarSize={4} offsetScrollbars>
            <Box py={8}>
              {NAV_SECTIONS.map((section, idx) => {
                const visibleItems = section.items.filter(canSee);
                if (visibleItems.length === 0) return null;
                return (
                <Box key={section.title}>
                  {idx > 0 && (
                    <Box className={collapsed ? classes.collapsedDivider : classes.sectionDivider} />
                  )}
                  {!collapsed && (
                    <Text className={classes.sectionTitle}>{section.title}</Text>
                  )}
                  <Box px={10}>
                    {visibleItems.map(item =>
                      collapsed
                        ? <CollapsedItem key={item.label} item={item} />
                        : <NavItem key={item.label} item={item} />
                    )}
                  </Box>
                </Box>
                );
              })}
            </Box>
          </ScrollArea>
        </AppShell.Section>

      {/* User profile footer */}
      <Box className={classes.userSection}>
        {collapsed ? (
          <Tooltip label={user?.name || 'User'} position="right" withArrow offset={14} color="dark">
            <Box className={classes.userAvatarOnly}>
              <Avatar size={36} radius="xl" className={classes.avatar}>{(user?.name || 'U')[0].toUpperCase()}</Avatar>
            </Box>
          </Tooltip>
        ) : (
          <Box className={classes.userCard}>
            <Avatar size={36} radius="xl" className={classes.avatar}>{(user?.name || 'U')[0].toUpperCase()}</Avatar>
            <Box style={{ flex: 1, overflow: 'hidden' }}>
              <Text className={classes.userName} truncate>{user?.name || 'User'}</Text>
              <Text className={classes.userRole}>{user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'Staff'}</Text>
            </Box>
            <Tooltip label="Logout" withArrow>
              <UnstyledButton className={classes.logoutBtn} onClick={logout}>
                <IconLogout size={16} color="rgba(255,255,255,0.45)" />
              </UnstyledButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      </Box> {/* end navInner */}
    </AppShell.Navbar>
  );
}
