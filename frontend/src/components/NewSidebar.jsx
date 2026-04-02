import { Avatar, Badge, Box, Flex, Text, UnstyledButton } from '@mantine/core';
import {
  IconSmartHome,
  IconUsers,
  IconCalendar,
  IconFileText,
  IconChartPie,
  IconChevronRight,
  IconPointFilled,
  IconSettings,
} from '@tabler/icons-react';
import classes from './NewSidebar.module.css';

const mainLinks = [
  { icon: IconSmartHome, label: 'Dashboard', active: true },
  { icon: IconUsers, label: 'Team' },
  { icon: IconCalendar, label: 'Calendar', badge: 4 },
  { icon: IconFileText, label: 'Documents', badge: 5 },
  { icon: IconChartPie, label: 'Reports' },
];

const projectLinks = [
  { label: 'Website redesign' },
  { label: 'GraphQL API' },
  { label: 'Customer migration guides' },
  { label: 'Profit sharing program' },
];

export function NewSidebar() {
  return (
    <Box className={classes.sidebar}>
      <Flex direction="column" h="100%">
        {/* Brand/Logo */}
        <Box className={classes.brand}>
          <Text className={classes.brandText}>PRO DASHBOARD</Text>
        </Box>

        {/* Main Links */}
        <Box className={classes.mainLinks}>
          {mainLinks.map((link) => (
            <UnstyledButton key={link.label} className={`${classes.mainLink} ${link.active ? classes.mainLinkActive : ''}`}>
              <link.icon className={classes.mainLinkIcon} />
              <Text>{link.label}</Text>
              {link.badge && <Badge className={classes.badge}>{link.badge}</Badge>}
            </UnstyledButton>
          ))}
        </Box>

        {/* Projects Section */}
        <Box className={classes.projectsSection}>
          <Text className={classes.sectionTitle}>PROJECTS</Text>
          {projectLinks.map((link) => (
            <UnstyledButton key={link.label} className={classes.projectLink}>
              <IconPointFilled className={classes.projectLinkIcon} />
              <Text>{link.label}</Text>
            </UnstyledButton>
          ))}
        </Box>

        {/* Spacer */}
        <Box style={{ flexGrow: 1 }} />

        {/* Profile Section */}
        <Box className={classes.profileSection}>
          <Flex align="center">
            <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Dianne Robertson" radius="xl" />
            <Box ml="md">
              <Text className={classes.profileName}>Dianne Robertson</Text>
              <Text className={classes.profileLink}>View Profile</Text>
            </Box>
          </Flex>
          <UnstyledButton className={classes.settingsButton}>
            <IconSettings />
          </UnstyledButton>
        </Box>
      </Flex>
    </Box>
  );
}
