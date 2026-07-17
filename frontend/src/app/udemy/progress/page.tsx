'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  LinearProgress,
  TextField,
  Grid
} from '@mui/material';

import { Search as SearchIcon } from '@mui/icons-material';

export default function UdemyProgressPage() {
  const [search, setSearch] = useState('');

  const { data: progress, isLoading, error } = useQuery({
    queryKey: ['udemyProgress'],
    queryFn: () => fetch('/api/udemy?type=progress').then(res => res.json())
  });

  const getFilteredProgress = () => {
    if (!progress || !Array.isArray(progress)) return [];
    
    return progress.filter(p =>
      p.user.name.toLowerCase().includes(search.toLowerCase()) ||
      p.course.title.toLowerCase().includes(search.toLowerCase())
    );
  };

  const filtered = getFilteredProgress();

  return (
    <Layout>
      <Box sx={{ width: '100%' }}>
        <Card sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                placeholder="Search by employee name or course title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                  }
                }}
              />
            </Grid>
          </Grid>
        </Card>

        {isLoading ? (
          <Box sx={{ display: 'flex', py: 8, justifyContent: 'center' }}><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="error">Failed to load progress logs.</Alert>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">No matching progress logs found.</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Course Title</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Progress %</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Time Spent</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Last Access Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((p: any) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.user.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{p.user.employeeId}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{p.course.title}</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={p.progressPercent}
                            color={p.progressPercent === 100 ? 'success' : 'primary'}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {p.progressPercent}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{p.timeSpent} hrs</TableCell>
                    <TableCell>
                      {p.lastAccessDate ? new Date(p.lastAccessDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Layout>
  );
}
