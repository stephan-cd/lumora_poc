'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Layout from '@/components/Layout';
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
  Chip,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';

import {
  CheckCircle as CheckCircleIcon,
  Autorenew as ProcessingIcon,
  Code as CodeIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const fetchReviews = async () => {
  const res = await fetch('http://localhost:8080/api/v1/reviews');
  if (!res.ok) throw new Error('Failed to fetch reviews');
  const data = await res.json();
  return data.map((review: any) => ({
    id: review.id,
    repo: review.commit?.repository?.name || 'Unknown Repo',
    commit: review.commit?.commit_hash ? review.commit.commit_hash.substring(0, 7) : 'unknown',
    status: review.status,
    score: review.score,
    issues: review.issues ? review.issues.length : 0,
    time: new Date(review.created_at).toLocaleString(),
  }));
};

export default function CodeReviewDashboard() {
  const { data: reviews, isLoading, error } = useQuery({ 
    queryKey: ['codeReviews'], 
    queryFn: fetchReviews 
  });

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'var(--font-outfit)' }}>
          Recent Code Reviews
        </Typography>
        <Button variant="contained" color="primary">
          Add Repository
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">Failed to load code reviews. Ensure the AI Code Review backend is running.</Alert>
      ) : (
        <Card sx={{ borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Repository</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Commit</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Score</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reviews?.map((review: any) => (
                  <TableRow key={review.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{review.repo}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontFamily: 'monospace', color: 'text.secondary' }}>
                        <CodeIcon fontSize="small" />
                        {review.commit}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {review.status === 'completed' ? (
                        <Chip
                          icon={<CheckCircleIcon fontSize="small" />}
                          label="Completed"
                          color="success"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      ) : (
                        <Chip
                          icon={<ProcessingIcon fontSize="small" />}
                          label="Processing"
                          color="info"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {review.score !== undefined && review.score !== null ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, color: review.score > 80 ? 'success.main' : 'warning.main' }}
                          >
                            {review.score}/100
                          </Typography>
                          {review.issues > 0 && (
                            <Chip
                              icon={<WarningIcon fontSize="small" />}
                              label={`${review.issues} issues`}
                              color="warning"
                              size="small"
                              variant="outlined"
                              sx={{ height: 24 }}
                            />
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/code-review/${review.id}`} passHref legacyBehavior>
                        <Button size="small" variant="text" color="primary" sx={{ fontWeight: 600 }}>
                          View Details &rarr;
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Layout>
  );
}
