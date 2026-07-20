'use client';

import React from 'react';
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
  Chip
} from '@mui/material';

export default function UdemySyncLogsPage() {
  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['udemySyncLogs'],
    queryFn: () => fetch('/api/udemy?type=logs').then(res => res.json())
  });

  return (
    <Layout>
      <Box sx={{ width: '100%' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Udemy Synchronization Logs</Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', py: 8, justifyContent: 'center' }}><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="error">Failed to load sync logs history.</Alert>
        ) : !Array.isArray(logs) || logs.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">No sync logs found. Run a manual sync in Settings.</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Sync Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Records Imported</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Error Logs</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log: any) => (
                  <TableRow key={log.id} hover>
                    <TableCell>{new Date(log.syncTime).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.status}
                        size="small"
                        color={log.status === 'SUCCESS' ? 'success' : log.status === 'FAILED' ? 'error' : 'warning'}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{log.recordsImported}</TableCell>
                    <TableCell sx={{ color: 'error.main', fontSize: '0.8rem', fontFamily: 'monospace', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.errorLogs || 'None'}
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
