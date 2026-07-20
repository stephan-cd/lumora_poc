'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
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
  Slider,
  Avatar,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';

import {
  Search as SearchIcon,
  Sort as SortIcon,
  FilterAlt as FilterIcon
} from '@mui/icons-material';

export default function TalentDiscoveryPage() {
  const [skillSearch, setSkillSearch] = useState('');
  const [minHours, setMinHours] = useState<number>(0);
  const [sortBy, setSortBy] = useState('hours'); // hours, recent

  // Queries
  const { data: skills } = useQuery({
    queryKey: ['skills'],
    queryFn: () => fetch('/api/skills').then(res => res.json())
  });

  const { data: results, isLoading, refetch } = useQuery({
    queryKey: ['talentSearch', skillSearch, minHours, sortBy],
    queryFn: () => {
      const params = new URLSearchParams();
      if (skillSearch) params.append('skillQuery', skillSearch);
      if (minHours > 0) params.append('minHours', minHours.toString());
      return fetch(`/api/learning/talent?${params.toString()}`).then(res => res.json());
    }
  });

  const handleClearFilters = () => {
    setSkillSearch('');
    setMinHours(0);
    setSortBy('hours');
  };

  const getProficiencyWeight = (level: string) => {
    switch (level) {
      case 'EXPERT': return 4;
      case 'ADVANCED': return 3;
      case 'INTERMEDIATE': return 2;
      default: return 1;
    }
  };

  const getSortedResults = () => {
    if (!results || !Array.isArray(results)) return [];
    
    return [...results].sort((a: any, b: any) => {
      if (sortBy === 'hours') {
        return b.hours - a.hours;
      }
      if (sortBy === 'proficiency') {
        return getProficiencyWeight(b.proficiency) - getProficiencyWeight(a.proficiency);
      }
      if (sortBy === 'recent') {
        return new Date(b.lastLearningDate).getTime() - new Date(a.lastLearningDate).getTime();
      }
      return 0;
    });
  };

  const sortedResults = getSortedResults();

  return (
    <Layout>
      <Box sx={{ width: '100%' }}>
        <Grid container spacing={3}>
          {/* Advanced Search Panel */}
          <Grid size={{ xs: 12, md: 4, lg: 3.5 }}>
            <Card sx={{ p: 3, position: 'sticky', top: '80px' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon color="primary" /> Search Parameters
              </Typography>

              <TextField
                select
                fullWidth
                label="Search by Skill"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                margin="normal"
                slotProps={{ select: { displayEmpty: true } }}
              >
                <MenuItem value="">Select Skill</MenuItem>
                {Array.isArray(skills) && skills.map((s: any) => (
                  <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>
                ))}
              </TextField>

              <Box sx={{ mt: 3, mb: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Minimum Learning Hours: <strong>{minHours} hrs</strong>
                </Typography>
                <Slider
                  value={minHours}
                  onChange={(e, val) => setMinHours(val as number)}
                  min={0}
                  max={100}
                  step={5}
                  valueLabelDisplay="auto"
                />
              </Box>

              <TextField
                select
                fullWidth
                label="Sort Results By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                margin="normal"
                slotProps={{ select: { displayEmpty: true } }}
              >
                <MenuItem value="hours">Total Learning Hours</MenuItem>
                <MenuItem value="recent">Recent Activity</MenuItem>
              </TextField>

              <Box sx={{ mt: 4, display: 'flex', gap: 1.5 }}>
                <Button variant="outlined" fullWidth onClick={handleClearFilters}>
                  Reset
                </Button>
                <Button variant="contained" fullWidth onClick={() => refetch()}>
                  Search
                </Button>
              </Box>
            </Card>
          </Grid>

          {/* Search Results list */}
          <Grid size={{ xs: 12, md: 8, lg: 8.5 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Discovered Talent ({sortedResults.length} matches)
              </Typography>
              
              {isLoading ? (
                <Box sx={{ display: 'flex', py: 8, justifyContent: 'center' }}>
                  <CircularProgress />
                </Box>
              ) : sortedResults.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No resources found. Select a skill to search or adjust sliders.
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
                        <TableCell sx={{ fontWeight: 700 }}>Skill</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Approved Hours</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Code Quality (Avg)</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Last Logged Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedResults.map((row: any, idx: number) => (
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
                          <TableCell>{new Date(row.lastLearningDate).toLocaleDateString()}</TableCell>
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
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
}
