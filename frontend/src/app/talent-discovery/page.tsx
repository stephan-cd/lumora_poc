'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar
} from '@mui/material';

import {
  Search as SearchIcon
} from '@mui/icons-material';

export default function TalentDiscoveryPage() {
  const [teamId, setTeamId] = useState('');
  const [searchEmployee, setSearchEmployee] = useState('');

  // Queries
  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => fetch('/api/department/users?type=managers').then(res => res.json())
  });

  const { data: results, isLoading, refetch } = useQuery({
    queryKey: ['talentSearch', teamId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (teamId) params.append('teamId', teamId);
      return fetch(`/api/learning/talent?${params.toString()}`).then(res => res.json());
    }
  });

  const handleClearFilters = () => {
    setTeamId('');
    setSearchEmployee('');
  };

  const getFilteredResults = () => {
    if (!results || !Array.isArray(results)) return [];
    
    let filtered = [...results];
    
    if (searchEmployee.trim() !== '') {
      const lowerQuery = searchEmployee.toLowerCase();
      filtered = filtered.filter((r: any) => r.name.toLowerCase().includes(lowerQuery));
    }
    
    return filtered;
  };

  const displayedResults = getFilteredResults();

  return (
    <Layout>
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Horizontal Search Panel */}
        <Card sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, minWidth: '200px' }}>
              <SearchIcon color="primary" /> Talent Discovery
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: '300px' }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Select Team (Manager)"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                slotProps={{ select: { displayEmpty: true } }}
              >
                <MenuItem value="">All Users</MenuItem>
                {Array.isArray(teams) && teams.map((t: any) => (
                  <MenuItem key={t.id} value={t.id}>{t.name} ({t.department})</MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                size="small"
                label="Search Employee"
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button variant="outlined" onClick={handleClearFilters}>
                Reset
              </Button>
              <Button variant="contained" onClick={() => refetch()}>
                Search
              </Button>
            </Box>
          </Box>
        </Card>

        {/* Search Results list */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Search Results ({displayedResults.length} matches)
          </Typography>
          
          {isLoading ? (
            <Box sx={{ display: 'flex', py: 8, justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : displayedResults.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No resources found. Select a team to search.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Manager</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Top Skill</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Total Hours</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Code Quality (Avg)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedResults.map((row: any, idx: number) => (
                    <TableRow key={idx} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32, fontSize: '0.8rem' }}>
                            {row.name.split(' ').map((n: string) => n[0]).join('')}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{row.designation}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{row.department}</TableCell>
                      <TableCell>{row.managerName}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.skillName}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="center">{row.hours} hrs</TableCell>
                      <TableCell align="center">
                        {row.avgCodeQuality ? (
                          <Chip 
                            label={`${row.avgCodeQuality}/100`} 
                            size="small" 
                            color={row.avgCodeQuality >= 80 ? 'success' : row.avgCodeQuality >= 50 ? 'warning' : 'error'} 
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">No Data</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Button 
                          variant="outlined" 
                          size="small" 
                          href={`/talent-discovery/${row.userId}`}
                        >
                          AI Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Box>
    </Layout>
  );
}
