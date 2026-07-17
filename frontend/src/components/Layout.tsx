'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useAppTheme } from './ThemeContextProvider';

import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Collapse,
  Button
} from '@mui/material';

import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  LocalLibrary as SkillsIcon,
  History as HistoryIcon,
  GridOn as MatrixIcon,
  Search as SearchIcon,
  BarChart as AnalyticsIcon,
  Assessment as ReportsIcon,
  School as UdemyIcon,
  Notifications as BellIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Brightness4 as MoonIcon,
  Brightness7 as SunIcon,
  ExpandLess,
  ExpandMore,
  ExitToApp as LogoutIcon,
  Lock as LockIcon,
  AccountCircle as UserIcon,
  AssignmentTurnedIn as ApprovalsIcon,
  ReceiptLong as LogsIcon,
  Code as CodeIcon
} from '@mui/icons-material';

const drawerWidth = 260;

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { mode, toggleTheme } = useAppTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [udemyOpen, setUdemyOpen] = useState(false);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [notiAnchorEl, setNotiAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]); // We can fetch this from API

  const user = session?.user;
  const userRole = user?.role as string | undefined;

  React.useEffect(() => {
    // Check if we are inside a Udemy subpath to keep the menu expanded
    if (pathname?.startsWith('/udemy')) {
      setUdemyOpen(true);
    }
  }, [pathname]);

  // Fetch notifications helper
  React.useEffect(() => {
    if (session) {
      fetch('/api/notifications')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setNotifications(data);
          }
        })
        .catch(err => console.error('Failed to load notifications', err));
    }
  }, [session, pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  const handleNotiMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotiAnchorEl(event.currentTarget);
  };

  const handleNotiMenuClose = () => {
    setNotiAnchorEl(null);
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadNotiCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/login' });
  };

  const menuItems = userRole === 'TEAM_MEMBER' ? [
    { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { text: 'Code Review', path: '/code-review', icon: <CodeIcon /> },
    { text: 'Skills Repository', path: '/skills', icon: <SkillsIcon /> },
    { text: 'Log Learning Hours', path: '/learning/history', icon: <HistoryIcon /> }
  ] : [
    { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { text: 'Code Review', path: '/code-review', icon: <CodeIcon /> },
    { text: 'Skills Repository', path: '/skills', icon: <SkillsIcon /> },
    ...(userRole !== 'TRAINING_DEPT' ? [{ text: 'Log Learning Hours', path: '/learning/history', icon: <HistoryIcon /> }] : []),
    { text: 'Skill Matrix', path: '/skill-matrix', icon: <MatrixIcon /> },
    { text: 'Talent Discovery', path: '/talent-discovery', icon: <SearchIcon /> },
    { text: 'Analytics', path: '/analytics', icon: <AnalyticsIcon /> },
    { text: 'Reports', path: '/reports', icon: <ReportsIcon /> }
  ];

  // Role based additional menus
  const showApprovals = userRole === 'TOWER_HEAD' || userRole === 'REPORTING_MANAGER';
  const showUsers = userRole === 'TOWER_HEAD' || userRole === 'REPORTING_MANAGER' || userRole === 'TRAINING_DEPT';

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0f2e5e', color: '#ffffff' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 1 }}>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            fontFamily: 'var(--font-poppins)',
            fontWeight: 800,
            fontSize: '1.4rem',
            background: 'linear-gradient(90deg, #ffffff, #e2e8f0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em'
          }}
        >
          SkillTrack
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      <List sx={{ px: 1.5, py: 1, flexGrow: 1, overflowY: 'auto' }}>
        {menuItems.map((item) => {
          const active = pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={item.path}
                sx={{
                  borderRadius: '10px',
                  backgroundColor: active
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'transparent',
                  color: active
                    ? '#ffffff'
                    : 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff'
                  }
                }}
              >
                <ListItemIcon sx={{ color: active ? '#ffffff' : 'rgba(255, 255, 255, 0.7)', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: active ? 600 : 500, fontFamily: 'var(--font-poppins)' }}>
                      {item.text}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}

        {/* Dynamic Approval Center */}
        {showApprovals && (
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              href="/learning/approvals"
              sx={{
                borderRadius: '10px',
                backgroundColor: pathname === '/learning/approvals'
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'transparent',
                color: pathname === '/learning/approvals' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff'
                }
              }}
            >
              <ListItemIcon sx={{ color: pathname === '/learning/approvals' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)', minWidth: 40 }}>
                <ApprovalsIcon />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: pathname === '/learning/approvals' ? 600 : 500, fontFamily: 'var(--font-poppins)' }}>
                    Approval Center
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>
        )}

        {/* Dynamic User Management */}
        {showUsers && (
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              href="/organization"
              sx={{
                borderRadius: '10px',
                backgroundColor: pathname === '/organization'
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'transparent',
                color: pathname === '/organization' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff'
                }
              }}
            >
              <ListItemIcon sx={{ color: pathname === '/organization' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)', minWidth: 40 }}>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: pathname === '/organization' ? 600 : 500, fontFamily: 'var(--font-poppins)' }}>
                    Organization
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>
        )}

        <Divider sx={{ my: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Udemy Business Module (Submenu) */}
        {userRole !== 'TEAM_MEMBER' && (
          <ListItem disablePadding sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <ListItemButton
              onClick={() => setUdemyOpen(!udemyOpen)}
              sx={{
                borderRadius: '10px',
                color: pathname?.startsWith('/udemy') ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                mb: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff'
                }
              }}
            >
              <ListItemIcon sx={{ color: pathname?.startsWith('/udemy') ? '#ffffff' : 'rgba(255, 255, 255, 0.7)', minWidth: 40 }}>
                <UdemyIcon />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: pathname?.startsWith('/udemy') ? 600 : 500, fontFamily: 'var(--font-poppins)' }}>
                    Udemy Business
                  </Typography>
                }
              />
              {udemyOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            <Collapse in={udemyOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding sx={{ pl: 4 }}>
                <ListItemButton
                  component={Link}
                  href="/udemy/dashboard"
                  sx={{
                    borderRadius: '8px',
                    mb: 0.5,
                    py: 0.5,
                    backgroundColor: pathname === '/udemy/dashboard' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    color: pathname === '/udemy/dashboard' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: '#ffffff'
                    }
                  }}
                >
                  <ListItemText primary={<Typography sx={{ fontSize: '0.85rem', fontFamily: 'var(--font-poppins)' }}>Dashboard</Typography>} />
                </ListItemButton>
                <ListItemButton
                  component={Link}
                  href="/udemy/courses"
                  sx={{
                    borderRadius: '8px',
                    mb: 0.5,
                    py: 0.5,
                    backgroundColor: pathname === '/udemy/courses' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    color: pathname === '/udemy/courses' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: '#ffffff'
                    }
                  }}
                >
                  <ListItemText primary={<Typography sx={{ fontSize: '0.85rem', fontFamily: 'var(--font-poppins)' }}>Courses</Typography>} />
                </ListItemButton>
                <ListItemButton
                  component={Link}
                  href="/udemy/progress"
                  sx={{
                    borderRadius: '8px',
                    mb: 0.5,
                    py: 0.5,
                    backgroundColor: pathname === '/udemy/progress' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    color: pathname === '/udemy/progress' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: '#ffffff'
                    }
                  }}
                >
                  <ListItemText primary={<Typography sx={{ fontSize: '0.85rem', fontFamily: 'var(--font-poppins)' }}>Progress</Typography>} />
                </ListItemButton>
                <ListItemButton
                  component={Link}
                  href="/udemy/certifications"
                  sx={{
                    borderRadius: '8px',
                    mb: 0.5,
                    py: 0.5,
                    backgroundColor: pathname === '/udemy/certifications' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    color: pathname === '/udemy/certifications' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: '#ffffff'
                    }
                  }}
                >
                  <ListItemText primary={<Typography sx={{ fontSize: '0.85rem', fontFamily: 'var(--font-poppins)' }}>Certifications</Typography>} />
                </ListItemButton>
                <ListItemButton
                  component={Link}
                  href="/udemy/sync-logs"
                  sx={{
                    borderRadius: '8px',
                    mb: 0.5,
                    py: 0.5,
                    backgroundColor: pathname === '/udemy/sync-logs' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    color: pathname === '/udemy/sync-logs' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: '#ffffff'
                    }
                  }}
                >
                  <ListItemText primary={<Typography sx={{ fontSize: '0.85rem', fontFamily: 'var(--font-poppins)' }}>Sync Logs</Typography>} />
                </ListItemButton>

                {userRole === 'TOWER_HEAD' && (
                  <ListItemButton
                    component={Link}
                    href="/udemy/settings"
                    sx={{
                      borderRadius: '8px',
                      mb: 0.5,
                      py: 0.5,
                      backgroundColor: pathname === '/udemy/settings' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                      color: pathname === '/udemy/settings' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: '#ffffff'
                      }
                    }}
                  >
                    <ListItemText primary={<Typography sx={{ fontSize: '0.85rem', fontFamily: 'var(--font-poppins)' }}>Settings</Typography>} />
                  </ListItemButton>
                )}
              </List>
            </Collapse>
          </ListItem>
        )}
      </List>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
      {/* Sidebar Footer - User info */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: '#07152c' }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.9rem', fontFamily: 'var(--font-poppins)', color: '#ffffff' }}>
          {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
        </Avatar>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', color: '#ffffff', fontFamily: 'var(--font-poppins)' }}>
            {user?.name || 'User'}
          </Typography>
          <Typography variant="caption" noWrap sx={{ display: 'block', color: '#b3c5de', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-poppins)' }}>
            {userRole?.replace('_', ' ') || 'Team Member'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <CssBaseline />

      {/* HEADER / TOPBAR */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 'none',
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ fontFamily: 'var(--font-outfit)', fontWeight: 600 }}>
            {pathname === '/dashboard' && 'Dashboard'}
            {pathname === '/code-review' && 'AI Code Review'}
            {pathname?.startsWith('/code-review/') && 'Review Details'}
            {pathname === '/skills' && 'Skills Repository'}
            {pathname === '/learning/history' && 'My Learning Hours Log'}
            {pathname === '/learning/approvals' && 'Approval Center'}
            {pathname === '/skill-matrix' && 'Skill Competency Matrix'}
            {pathname === '/talent-discovery' && 'Talent Discovery Search'}
            {pathname === '/analytics' && 'Upskilling Analytics'}
            {pathname === '/reports' && 'Reports Generator'}
            {pathname?.startsWith('/udemy') && 'Udemy Business Sync'}
            {pathname === '/organization' && 'Organization Tree & Members'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Theme Toggle */}
            <Tooltip title={mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
              <IconButton onClick={toggleTheme} color="inherit">
                {mode === 'light' ? <MoonIcon /> : <SunIcon />}
              </IconButton>
            </Tooltip>

            {/* Notifications Dropdown */}
            <IconButton color="inherit" onClick={handleNotiMenuOpen}>
              <Badge badgeContent={unreadNotiCount} color="error">
                <BellIcon />
              </Badge>
            </IconButton>

            <Menu
              anchorEl={notiAnchorEl}
              open={Boolean(notiAnchorEl)}
              onClose={handleNotiMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  sx: { width: 320, maxHeight: 400, borderRadius: 3, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }
                }
              }}
            >
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Notifications</Typography>
                {unreadNotiCount > 0 && (
                  <Button size="small" onClick={handleMarkAllRead} sx={{ fontSize: '0.75rem' }}>Mark all read</Button>
                )}
              </Box>
              <Divider />
              {notifications.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No notifications yet.</Typography>
                </Box>
              ) : (
                notifications.map((n) => (
                  <MenuItem
                    key={n.id}
                    onClick={handleNotiMenuClose}
                    sx={{
                      whiteSpace: 'normal',
                      py: 1.5,
                      bgcolor: n.isRead ? 'transparent' : 'action.hover'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: n.isRead ? 400 : 600 }}>
                      {n.message}
                    </Typography>
                  </MenuItem>
                ))
              )}
            </Menu>

            {/* User Profile */}
            <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0, ml: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.main', color: '#fff', width: 34, height: 34, fontSize: '0.85rem', fontWeight: 600 }}>
                {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={profileAnchorEl}
              open={Boolean(profileAnchorEl)}
              onClose={handleProfileMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  sx: { width: 220, mt: 1, borderRadius: 3 }
                }
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" color="text.secondary">Employee ID</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{user?.employeeId || 'N/A'}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { handleProfileMenuClose(); router.push('/dashboard'); }}>
                <ListItemIcon><UserIcon fontSize="small" /></ListItemIcon>
                Profile & Goals
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* MOBILE DRAWER */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: '#0f2e5e',
              color: '#ffffff',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          {drawerContent}
        </Drawer>

        {/* DESKTOP DRAWER */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: '#0f2e5e',
              color: '#ffffff',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)'
            }
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* MAIN CONTENT AREA */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: { xs: 2, md: 3 },
          pb: { xs: 2, md: 3 },
          pt: { xs: '80px', md: '92px' }, // spacing below fixed navbar
          width: { md: `calc(100% - ${drawerWidth}px)` },
          height: '100vh',
          overflowY: 'auto',
          bgcolor: 'background.default'
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
