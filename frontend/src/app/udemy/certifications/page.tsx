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
  TextField,
  Grid
} from '@mui/material';

import {
  Search as SearchIcon,
  WorkspacePremium as CertificateIcon
} from '@mui/icons-material';

export default function UdemyCertificationsPage() {
  const [search, setSearch] = useState('');

  const { data: certs, isLoading, error } = useQuery({
    queryKey: ['udemyCertifications'],
    queryFn: () => fetch('/api/udemy?type=certifications').then(res => res.json())
  });

  const getFilteredCerts = () => {
    if (!certs || !Array.isArray(certs)) return [];
    
    return certs.filter(c =>
      c.user.name.toLowerCase().includes(search.toLowerCase()) ||
      c.course.title.toLowerCase().includes(search.toLowerCase()) ||
      c.certificateName.toLowerCase().includes(search.toLowerCase())
    );
  };

  const filtered = getFilteredCerts();

  return (
    <Layout>
      <Box sx={{ width: '100%' }}>
        <Card sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                placeholder="Search by employee, course, or certificate code..."
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
          <Alert severity="error">Failed to load certifications.</Alert>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">No certifications found.</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Employee Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Course Completed</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Certificate Code</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Completion Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((c: any) => (
                  <TableRow key={c.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.user.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.user.employeeId}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{c.course.title}</TableCell>
                    <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
                      <CertificateIcon color="warning" fontSize="small" />
                      <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                        {c.certificateName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(c.completionDate).toLocaleDateString()}
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
