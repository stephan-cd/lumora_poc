'use client';

import React from 'react';
import Layout from '@/components/Layout';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';

import {
  MenuBook as BookIcon,
  Timeline as TrendIcon,
  People as GroupIcon,
  CheckCircle as CompletionIcon,
  WorkspacePremium as CertificateIcon
} from '@mui/icons-material';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

import MetricCard from '@/components/molecules/MetricCard';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function UdemyDashboardPage() {
  const { data: udemyData, isLoading, error } = useQuery({
    queryKey: ['udemyDashboard'],
    queryFn: () => fetch('/api/udemy').then(res => res.json())
  });

  if (isLoading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>
      </Layout>
    );
  }

  if (error || !udemyData) {
    return (
      <Layout>
        <Alert severity="error">Failed to load Udemy Dashboard. Sync connection might not be configured.</Alert>
      </Layout>
    );
  }

  const widgets = udemyData.widgets || {};
  const charts = udemyData.charts || {};

  return (
    <Layout>
      <Box sx={{ width: '100%' }}>
        {/* Metric Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <MetricCard title="Total Courses" value={widgets.totalCourses || 0} icon={<BookIcon />} iconBgColor="primary.main" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <MetricCard title="Learning Hours" value={`${widgets.totalLearningHours || 0} hrs`} icon={<TrendIcon />} iconBgColor="success.main" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <MetricCard title="Active Learners" value={widgets.activeLearners || 0} icon={<GroupIcon />} iconBgColor="secondary.main" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <MetricCard title="Completed Courses" value={widgets.completedCourses || 0} icon={<CompletionIcon />} iconBgColor="info.main" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <MetricCard title="Certifications" value={widgets.certificationsEarned || 0} icon={<CertificateIcon />} iconBgColor="warning.main" />
          </Grid>
        </Grid>

        {/* Recharts Grid */}
        <Grid container spacing={3}>
          {/* Learning Trend */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>Udemy Learning Trend (Monthly Hours)</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.learningTrend || []}>
                    <defs>
                      <linearGradient id="colorUdemy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="hours" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorUdemy)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>

          {/* Course adoption by Category */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>Course Adoption by Domain</Typography>
              <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.courseAdoption || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(charts.courseAdoption || []).map((entry: any, idx: number) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', mt: 2 }}>
                {(charts.courseAdoption || []).map((entry: any, idx: number) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: COLORS[idx % COLORS.length], borderRadius: '50%' }} />
                    <Typography variant="caption">{entry.name} ({entry.value})</Typography>
                  </Box>
                ))}
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
}
