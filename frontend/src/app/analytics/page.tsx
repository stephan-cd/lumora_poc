'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  Box,
  Card,
  Typography,
  Grid,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider
} from '@mui/material';

import {
  BarChart as AnalyticsIcon,
  EmojiEvents as TrophyIcon,
  Warning as GapIcon,
  ArrowForward as ArrowIcon,
  Star as StarIcon,
  Groups as GroupIcon,
  Timeline as TrendIcon
} from '@mui/icons-material';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const COLORS = ['#0f2e5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#475a7a'];

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role as string | undefined;
  const [activeTab, setActiveTab] = useState(0);

  // Queries
  const { data: dashboardData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analyticsData'],
    queryFn: () => fetch('/api/dashboard').then(res => res.json())
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => fetch('/api/learning/leaderboard').then(res => res.json())
  });

  const { data: gapAnalysis, isLoading: gapLoading } = useQuery({
    queryKey: ['gapAnalysis'],
    queryFn: () => fetch('/api/dashboard/gap-analysis').then(res => res.json()),
    enabled: userRole === 'TOWER_HEAD' || userRole === 'TRAINING_DEPT'
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const charts = dashboardData?.charts || {};

  return (
    <Layout>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab icon={<AnalyticsIcon fontSize="small" />} iconPosition="start" label="Learning Analytics" />
            <Tab icon={<TrophyIcon fontSize="small" />} iconPosition="start" label="Monthly Leaderboard" />
            {(userRole === 'TOWER_HEAD' || userRole === 'TRAINING_DEPT') && (
              <Tab icon={<GapIcon fontSize="small" />} iconPosition="start" label="Skill Gap Analysis" />
            )}
          </Tabs>
        </Box>

        {/* --- TAB PANEL 1: ANALYTICS CHARTS --- */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {analyticsLoading ? (
              <Box sx={{ display: 'flex', py: 8, width: '100%', justifyContent: 'center' }}><CircularProgress /></Box>
            ) : (
              <>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ p: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>
                      Learning Hours by Department
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={charts.learningHoursByDepartment || charts.teamComparison || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="hours" fill="#0f2e5e" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ p: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>
                      Popular Skills Coverage
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={charts.teamSkillDistribution || charts.skillDistribution || []} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" width={100} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>
                </Grid>

                {charts.skillGrowthTrend && (
                  <Grid size={12}>
                    <Card sx={{ p: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>
                        Technology Domain Growth Trends
                      </Typography>
                      <Box sx={{ height: 320 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={charts.skillGrowthTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="AI" stroke="#8b5cf6" strokeWidth={3} />
                            <Line type="monotone" dataKey="Cloud" stroke="#0f2e5e" strokeWidth={3} />
                            <Line type="monotone" dataKey="Frontend" stroke="#10b981" strokeWidth={3} />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </Card>
                  </Grid>
                )}
              </>
            )}
          </Grid>
        )}

        {/* --- TAB PANEL 2: LEADERBOARD --- */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            {leaderboardLoading ? (
              <Box sx={{ display: 'flex', py: 8, width: '100%', justifyContent: 'center' }}><CircularProgress /></Box>
            ) : !leaderboard ? (
              <Box sx={{ p: 4, textAlign: 'center', width: '100%' }}><Alert severity="info">No leaderboard data this month.</Alert></Box>
            ) : (
              <>
                {/* Top Learners */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ p: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StarIcon color="warning" /> Top Learners
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <List>
                      {leaderboard.topLearners?.map((item: any, idx: number) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: idx < 3 ? 'warning.main' : 'grey.400' }}>
                              {idx + 1}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={<Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</Typography>}
                            secondary={`${item.department} | ${item.employeeId}`}
                          />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {item.hours} hrs
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Card>
                </Grid>

                {/* Top Skills */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ p: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AnalyticsIcon color="primary" /> Top Hot Skills
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <List>
                      {leaderboard.topSkills?.map((item: any, idx: number) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                              {idx + 1}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={<Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</Typography>}
                            secondary={item.category}
                          />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                            {item.hours} hrs
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Card>
                </Grid>

                {/* Top Teams */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ p: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GroupIcon color="secondary" /> Top Department Teams
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <List>
                      {leaderboard.topTeams?.map((item: any, idx: number) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'secondary.main' }}>
                              {idx + 1}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={<Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</Typography>}
                          />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'info.main' }}>
                            {item.hours} hrs
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Card>
                </Grid>
              </>
            )}
          </Grid>
        )}

        {/* --- TAB PANEL 3: SKILL GAP ANALYSIS --- */}
        {activeTab === 2 && (userRole === 'TOWER_HEAD' || userRole === 'TRAINING_DEPT') && (
          <Grid container spacing={3}>
            {gapLoading ? (
              <Box sx={{ display: 'flex', py: 8, width: '100%', justifyContent: 'center' }}><CircularProgress /></Box>
            ) : !gapAnalysis ? (
              <Box sx={{ p: 4, width: '100%' }}><Alert severity="info">Gap analysis report is compiling...</Alert></Box>
            ) : (
              <>
                {/* Emerging Skills (High Growth) */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ p: 3, borderLeft: '5px solid #10b981' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'success.main' }}>
                      Emerging Skills (High Demand)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Skills with highest relative hours logged in the last 30 days. Recommend expanding training.
                    </Typography>
                    <List>
                      {gapAnalysis.emergingSkills?.map((s: any, idx: number) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemText primary={<Typography sx={{ fontWeight: 600 }}>{s.name}</Typography>} secondary={s.category} />
                          <Chip label={`+${s.recentHours}h`} color="success" size="small" sx={{ fontWeight: 700 }} />
                        </ListItem>
                      ))}
                    </List>
                  </Card>
                </Grid>

                {/* Low Adoption Skills */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ p: 3, borderLeft: '5px solid #f59e0b' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'warning.main' }}>
                      Low Adoption Skills
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Skills preloaded in repository but logged for less than 10 total approved hours across teams.
                    </Typography>
                    <List>
                      {gapAnalysis.lowAdoptionSkills?.map((s: any, idx: number) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemText primary={<Typography sx={{ fontWeight: 600 }}>{s.name}</Typography>} secondary={s.category} />
                          <Chip label={`${s.totalHours}h`} color="warning" size="small" sx={{ fontWeight: 700 }} />
                        </ListItem>
                      ))}
                    </List>
                  </Card>
                </Grid>

                {/* Missing Skills (0 hours) */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ p: 3, borderLeft: '5px solid #ef4444' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'error.main' }}>
                      Missing Skill Capabilities
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Critical preloaded industry skills with 0 hours logged in the organization. Potential capability risk.
                    </Typography>
                    <List>
                      {gapAnalysis.missingSkills?.map((s: any, idx: number) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemText primary={<Typography sx={{ fontWeight: 600 }}>{s.name}</Typography>} secondary={s.category} />
                          <Chip label="Missing" color="error" size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                        </ListItem>
                      ))}
                    </List>
                  </Card>
                </Grid>
              </>
            )}
          </Grid>
        )}
      </Box>
    </Layout>
  );
}
