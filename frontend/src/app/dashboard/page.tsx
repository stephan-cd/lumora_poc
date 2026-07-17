'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Button,
  TextField,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar,
  Chip
} from '@mui/material';

import {
  TrendingUp as TrendIcon,
  EmojiEvents as TrophyIcon,
  Timeline as MonthlyIcon,
  QueryBuilder as ClockIcon,
  Settings as SettingsIcon,
  ThumbUpAlt as ApprovedIcon,
  ErrorOutlined as PendingIcon,
  Star as StarIcon,
  WorkspacePremium as CertificateIcon
} from '@mui/icons-material';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

import { updateProfileAction, changePasswordAction, setLearningGoalAction } from '@/app/actions';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

import CustomTabPanel from '@/components/atoms/CustomTabPanel';
import MetricCard from '@/components/molecules/MetricCard';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const { data: session } = useSession();
  const user = session?.user;

  // Queries
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => fetch('/api/dashboard').then(res => res.json())
  });

  const { data: profileHistory } = useQuery({
    queryKey: ['profileHistory'],
    queryFn: () => fetch('/api/learning/history').then(res => res.json())
  });

  // Goal modal states
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalType, setGoalType] = useState('MONTHLY');
  const [goalHours, setGoalHours] = useState(20);
  const [goalSuccessMsg, setGoalSuccessMsg] = useState('');

  // Password / Profile forms
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { register: regProfile, handleSubmit: handleProfileSubmit } = useForm();
  const { register: regPassword, handleSubmit: handlePasswordSubmit, reset: resetPasswordForm } = useForm();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleGoalSubmit = async () => {
    try {
      await setLearningGoalAction(goalType as any, goalHours);
      setGoalSuccessMsg('Learning goal updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['profileHistory'] });
      setTimeout(() => {
        setGoalOpen(false);
        setGoalSuccessMsg('');
      }, 2000);
    } catch (err: any) {
      console.error(err);
    }
  };

  const onUpdateProfile = async (data: any) => {
    setProfileSuccess('');
    setProfileError('');
    try {
      await updateProfileAction({
        name: data.name,
        email: data.email,
        designation: data.designation,
        department: data.department
      });
      setProfileSuccess('Profile details updated successfully!');
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to update profile.');
    }
  };

  const onChangePassword = async (data: any) => {
    setPasswordSuccess('');
    setPasswordError('');
    if (data.newPassword !== data.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    try {
      await changePasswordAction(data.currentPassword, data.newPassword);
      setPasswordSuccess('Password updated successfully!');
      resetPasswordForm();
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to change password. Make sure current password is correct.');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error || !dashboardData) {
    return (
      <Layout>
        <Alert severity="error">Failed to load dashboard data. Please try again later.</Alert>
      </Layout>
    );
  }

  const role = dashboardData.role;
  const widgets = dashboardData.widgets || {};
  const charts = dashboardData.charts || {};

  return (
    <Layout>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
            <Tab label="Overview" />
            <Tab label="Profile" />
          </Tabs>
        </Box>

        {/* --- OVERVIEW TAB --- */}
        <CustomTabPanel value={tabValue} index={0}>
          {/* Dashboard Metrics Widgets */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {role === 'TEAM_MEMBER' && (
              <>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <MetricCard title="Total Hours" value={`${widgets.totalHours || 0} hrs`} icon={<ClockIcon />} iconBgColor="primary.light" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <MetricCard title="Approved Hours" value={`${widgets.approvedHours || 0} hrs`} icon={<ApprovedIcon />} iconBgColor="primary.light" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <MetricCard title="Pending Hours" value={`${widgets.pendingHours || 0} hrs`} icon={<PendingIcon />} iconBgColor="warning.main" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <MetricCard title="Skills Learned" value={widgets.skillsLearned || 0} icon={<StarIcon />} iconBgColor="info.main" />
                </Grid>
              </>
            )}

            {role === 'REPORTING_MANAGER' && (
              <>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <MetricCard title="Team Hours" value={`${widgets.teamLearningHours || 0} hrs`} icon={<ClockIcon />} iconBgColor="primary.main" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <MetricCard title="Pending Approvals" value={widgets.pendingApprovals || 0} icon={<PendingIcon />} iconBgColor="warning.main" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <MetricCard title="Active Learners" value={widgets.activeLearners || 0} icon={<TrophyIcon />} iconBgColor="success.main" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <MetricCard title="Team Skill Coverage" value={widgets.teamSkillCoverage || 0} icon={<StarIcon />} iconBgColor="info.main" />
                </Grid>
              </>
            )}

            {role === 'TOWER_HEAD' && (
              <>
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                  <MetricCard title="Org Hours" value={`${widgets.orgLearningHours || 0} hrs`} icon={<ClockIcon />} iconBgColor="primary.main" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                  <MetricCard title="Active Learners" value={widgets.activeLearners || 0} icon={<TrophyIcon />} iconBgColor="success.main" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                  <MetricCard title="Unique Skills" value={widgets.skillCoverage || 0} icon={<StarIcon />} iconBgColor="text.secondary" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                  <MetricCard title="Total Skills" value={widgets.totalSkills || 0} icon={<ApprovedIcon />} iconBgColor="info.main" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                  <MetricCard title="Pending Approvals" value={widgets.pendingApprovals || 0} icon={<PendingIcon />} iconBgColor="warning.main" />
                </Grid>
              </>
            )}
          </Grid>

          {/* Goal progress card for Team Members */}
          {role === 'TEAM_MEMBER' && widgets.goalProgress && (
            <Card sx={{ mb: 4, p: 2 }}>
              <Box sx={{ display: 'flex', justifyContext: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Monthly Learning Goal Progress</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Target: {widgets.goalProgress.targetHours} hours this month | Achieved: {widgets.goalProgress.achievedHours} hours
                  </Typography>
                </Box>
                <Button sx={{ ml: 12 }} size="small" onClick={() => setGoalOpen(true)} variant="outlined">
                  Set Goals
                </Button>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={widgets.goalProgress.percent}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{widgets.goalProgress.percent}%</Typography>
              </Box>
            </Card>
          )}

          {/* Graphical Insights */}
          <Grid container spacing={3}>
            {/* Monthly Trend */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Card sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  {role === 'TEAM_MEMBER' ? 'My Monthly Learning Hours (Yearly Trend)' : 'Organization Learning Trend'}
                </Typography>
                <Box sx={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.monthlyTrend || charts.learningTrend || []}>
                      <defs>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="hours" stroke="#2563eb" fillOpacity={1} fill="url(#colorHours)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            </Grid>

            {/* Distribution Charts */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  {role === 'TEAM_MEMBER' ? 'Hours by Skill Category' : 'Top Skills Distribution'}
                </Typography>
                <Box sx={{ height: 300, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.skillDistribution || charts.teamSkillDistribution || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10b981">
                        {(charts.skillDistribution || charts.teamSkillDistribution || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </CustomTabPanel>

        {/* --- PROFILE TAB --- */}
        <CustomTabPanel value={tabValue} index={1}>
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Profile Section */}
            <Card sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2.5 }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2.5rem', fontWeight: 700 }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>{user?.name}</Typography>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 0.5 }}>{(user as any)?.designation}</Typography>
                  <Chip label={(user as any)?.role} size="small" color="primary" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                </Box>
              </Box>

              <Divider sx={{ mb: 4 }} />

              <Grid container spacing={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                    Email Address
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {user?.email || '—'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                    Employee ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {(user as any)?.employeeId || '—'}
                  </Typography>
                </Grid>
              </Grid>
            </Card>

            {/* Security Section */}
            <Card sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Change Account Password</Typography>
              {passwordSuccess && <Alert severity="success" sx={{ mb: 2 }}>{passwordSuccess}</Alert>}
              {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}

              <form onSubmit={handlePasswordSubmit(onChangePassword)}>
                <TextField
                  {...regPassword('currentPassword')}
                  label="Current Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  {...regPassword('newPassword')}
                  label="New Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  {...regPassword('confirmPassword')}
                  label="Confirm New Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                />

                <Button type="submit" variant="contained" sx={{ mt: 3 }} color="primary" size="large">
                  Change Password
                </Button>
              </form>
            </Card>
          </Box>
        </CustomTabPanel>
      </Box>

      {/* Goals Dialog */}
      <Dialog open={goalOpen} onClose={() => setGoalOpen(false)} slotProps={{ paper: { sx: { borderRadius: 3, width: 320 } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Set Up Learning Goal</DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          {goalSuccessMsg ? (
            <Alert severity="success">{goalSuccessMsg}</Alert>
          ) : (
            <>
              <FormControl fullWidth margin="normal">
                <InputLabel shrink id="goal-type-label">Goal Period</InputLabel>
                <Select
                  labelId="goal-type-label"
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value)}
                  label="Goal Period"
                  displayEmpty
                >
                  <MenuItem value="MONTHLY">Monthly Goal</MenuItem>
                  <MenuItem value="QUARTERLY">Quarterly Goal</MenuItem>
                  <MenuItem value="YEARLY">Yearly Goal</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Target Hours"
                type="number"
                fullWidth
                margin="normal"
                value={goalHours}
                onChange={(e) => setGoalHours(parseInt(e.target.value))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </>
          )}
        </DialogContent>
        {!goalSuccessMsg && (
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setGoalOpen(false)} color="inherit">Cancel</Button>
            <Button onClick={handleGoalSubmit} variant="contained">Set Goal</Button>
          </DialogActions>
        )}
      </Dialog>
    </Layout>
  );
}
