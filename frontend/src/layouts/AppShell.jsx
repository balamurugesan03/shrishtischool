import { useState } from 'react';
import skisLogo from '../assets/logo.png';
import {
  AppShell, Burger, Group, Text, ScrollArea,
  Avatar, useMantineColorScheme, ActionIcon,
  Tooltip, Box, UnstyledButton, Collapse
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, useLocation } from 'react-router-dom';
import {
  IconLayoutDashboard, IconUsers, IconPackages,
  IconReceiptRupee, IconId, IconReportMoney,
  IconChevronRight, IconSun, IconMoon, IconSchool,
  IconBell, IconSettings, IconLogout,
} from '@tabler/icons-react';
import classes from './AppShell.module.css';

/* ── nav config ────────────────────────────────── */
const NAV = [
  {
    label: 'Dashboard',
    icon: IconLayoutDashboard,
    path: '/',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.22)',
    activeBg: 'rgba(167,139,250,0.12)',
  },
  {
    label: 'Students',
    icon: IconUsers,
    color: '#34d399',
    bg: 'rgba(52,211,153,0.22)',
    activeBg: 'rgba(52,211,153,0.1)',
    links: [
      { label: 'All Students', path: '/students' },
      { label: 'Add Student',  path: '/students/add' },
    ],
  },
  {
    label: 'Inventory',
    icon: IconPackages,
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.22)',
    activeBg: 'rgba(251,146,60,0.1)',
    links: [
      { label: 'Products',        path: '/inventory/products' },
      { label: 'Categories',      path: '/inventory/categories' },
      { label: 'Purchase Entry',  path: '/inventory/purchases' },
      { label: 'Issue Inventory', path: '/inventory/issue' },
      { label: 'Stock Report',    path: '/inventory/stock' },
    ],
  },
  {
    label: 'Billing',
    icon: IconReceiptRupee,
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.22)',
    activeBg: 'rgba(56,189,248,0.1)',
    links: [
      { label: 'All Invoices',   path: '/billing/invoices' },
      { label: 'Create Invoice', path: '/billing/invoices/create' },
      { label: 'Fee Management', path: '/billing/fees' },
    ],
  },
  {
    label: 'Staff',
    icon: IconId,
    color: '#f472b6',
    bg: 'rgba(244,114,182,0.22)',
    activeBg: 'rgba(244,114,182,0.1)',
    links: [
      { label: 'All Staff', path: '/staff' },
      { label: 'Add Staff', path: '/staff/add' },
      {label :'students attendance' ,path:"/staff-attendance/scan"}
    ],
  },
  {
    label: 'Accounting',
    icon: IconReportMoney,
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.22)',
    activeBg: 'rgba(251,191,36,0.1)',
    links: [
      { label: 'Ledger',    path: '/accounting/ledger' },
      { label: 'Day Book',  path: '/accounting/daybook' },
      { label: 'Cash Book', path: '/accounting/cashbook' },
      { label: 'Payments',  path: '/accounting/payments' },
    ],
  },
];

/* ── single nav entry ──────────────────────────── */
function NavItem({ item }) {
  const { pathname } = useLocation();
  const isLeaf      = !item.links;
  const childActive = !isLeaf && item.links.some(l => pathname === l.path);
  const leafActive  = isLeaf  && pathname === item.path;
  const isActive    = leafActive || childActive;

  const [open, setOpen] = useState(childActive);

  const iconStyle = {
    background: isActive ? item.bg : 'rgba(255,255,255,0.06)',
    boxShadow:  isActive ? `0 4px 18px ${item.color}45` : 'none',
  };

  /* colored left indicator bar */
  const indicator = isActive && (
    <Box
      style={{
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 3,
        height: '54%',
        borderRadius: '0 4px 4px 0',
        background: item.color,
        boxShadow: `0 0 10px ${item.color}`,
      }}
    />
  );

  if (isLeaf) {
    return (
      <Box className={classes.navGroup}>
        <UnstyledButton
          component={Link}
          to={item.path}
          className={`${classes.navBtn} ${isActive ? classes.navBtnActive : ''}`}
          style={isActive ? { background: item.activeBg } : {}}
        >
          {indicator}
          <Box className={classes.iconBox} style={iconStyle}>
            <item.icon
              size={19}
              color={isActive ? item.color : 'rgba(255,255,255,0.35)'}
              stroke={isActive ? 2.2 : 1.7}
            />
          </Box>
          <Text className={`${classes.navLabel} ${isActive ? classes.navLabelActive : ''}`}>
            {item.label}
          </Text>
        </UnstyledButton>
      </Box>
    );
  }

  return (
    <Box className={classes.navGroup}>
      <UnstyledButton
        onClick={() => setOpen(o => !o)}
        className={`${classes.navBtn} ${isActive ? classes.navBtnActive : ''}`}
        style={isActive ? { background: item.activeBg } : {}}
      >
        {indicator}
        <Box className={classes.iconBox} style={iconStyle}>
          <item.icon
            size={19}
            color={isActive ? item.color : 'rgba(255,255,255,0.35)'}
            stroke={isActive ? 2.2 : 1.7}
          />
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
        {/* sub-menu border adopts item color when parent is active */}
        <Box
          className={classes.subMenu}
          style={{
            borderLeftColor: childActive
              ? `${item.color}55`
              : 'rgba(255,255,255,0.06)',
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
                {/* colored dot */}
                <Box
                  className={`${classes.subDot} ${active ? classes.subDotActive : ''}`}
                  style={{
                    background: active ? item.color : 'transparent',
                    boxShadow: active ? `0 0 8px ${item.color}90` : 'none',
                  }}
                />
                {/* label picks up item color when active */}
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

/* ── layout ─────────────────────────────────────── */
export default function AppLayout({ children }) {
  const [mobileOpen, { toggle }] = useDisclosure();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <AppShell
      header={{ height: 62 }}
      navbar={{ width: 272, breakpoint: 'sm', collapsed: { mobile: !mobileOpen } }}
      padding={0}
    >
      {/* ══ HEADER ══════════════════════════════════ */}
      <AppShell.Header className={classes.header}>
        <Group h="100%" px="lg" justify="space-between">

          <Group gap={10}>
            <Burger opened={mobileOpen} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Box component="img" src={skisLogo} alt="SKIS Logo"
              style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6 }} />
            <Box>
              <Text fw={800} size="sm" lh={1.2} c="#1e1b4b" style={{ letterSpacing: '-0.2px' }}>
                Shrishti Kinder International School
              </Text>
              <Text size="10px" c="#94a3b8" lh={1} mt={1}>School Management System</Text>
            </Box>
          </Group>

          <Group gap={6}>
            <Tooltip label={colorScheme === 'dark' ? 'Light mode' : 'Dark mode'} withArrow>
              <ActionIcon variant="subtle" size={38} color="gray" onClick={() => toggleColorScheme()} radius="md">
                {colorScheme === 'dark' ? <IconSun size={17} /> : <IconMoon size={17} />}
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Notifications" withArrow>
              <Box className={classes.notifBtn}>
                <IconBell size={17} color="#64748b" />
                <Box className={classes.notifDot} />
              </Box>
            </Tooltip>

            <Box className={classes.headerUserWrap}>
              <Avatar size={32} radius="xl" className={classes.headerAvatar}>AD</Avatar>
              <Box visibleFrom="sm">
                <Text size="13px" fw={700} c="#1e293b" lh={1.2}>Admin</Text>
                <Text size="11px" c="#94a3b8" lh={1}>Administrator</Text>
              </Box>
            </Box>
          </Group>
        </Group>
      </AppShell.Header>

      {/* ══ SIDEBAR ═════════════════════════════════ */}
      <AppShell.Navbar className={classes.navbar} p={0}>

        {/* Brand */}
        <Box className={classes.brand}>
          <Box component="img" src={skisLogo} alt="SKIS Logo"
            style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6, flexShrink: 0 }} />
          <Box style={{ overflow: 'hidden', flex: 1 }}>
            <Text size="13px" fw={800} c="white" lh={1.3} truncate style={{ letterSpacing: '-0.2px' }}>
              Shrishti Kinder International School
            </Text>
            <Text size="11px" c="rgba(255,255,255,0.35)" lh={1} mt={2}>
              Academic Year 2026–27
            </Text>
          </Box>
          <Box className={classes.versionTag}>v1.0</Box>
        </Box>

        {/* Nav items */}
        <AppShell.Section grow component={ScrollArea} scrollbarSize={3} offsetScrollbars py={6}>
          <Text className={classes.sectionLabel}>Main Menu</Text>
          {NAV.map(item => <NavItem key={item.label} item={item} />)}
        </AppShell.Section>

        {/* Bottom buttons */}
        <Box className={classes.sidebarBottom}>
          <UnstyledButton className={classes.bottomBtn}>
            <Box style={{
              width: 34, height: 34,
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconSettings size={17} color="#818cf8" />
            </Box>
            <Text size="13.5px" c="rgba(255,255,255,0.88)" fw={500}>Settings</Text>
          </UnstyledButton>

          <UnstyledButton className={classes.bottomBtn}>
            <Box style={{
              width: 34, height: 34,
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconLogout size={17} color="#f87171" />
            </Box>
            <Text size="13.5px" c="rgba(255,255,255,0.88)" fw={500}>Logout</Text>
          </UnstyledButton>
        </Box>
      </AppShell.Navbar>

      {/* ══ MAIN ════════════════════════════════════ */}
      <AppShell.Main className={classes.main}>
        <Box p="xl">{children}</Box>
      </AppShell.Main>
    </AppShell>
  );
}
