'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import ReactDiffViewer from 'react-diff-viewer-continued';
import {
  Box,
  Card,
  Typography,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Grid,
  Paper,
  Chip
} from '@mui/material';

import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

export default function ReviewDetails() {
  const params = useParams();
  const id = params?.id;
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:8080/api/v1/reviews/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setReview(data);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Alert severity="error">Error loading review: {error}</Alert>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Link href="/code-review" passHref legacyBehavior>
          <IconButton sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <ArrowBackIcon />
          </IconButton>
        </Link>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'var(--font-outfit)' }}>
            Review Details
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            Review ID: {id}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Diff Viewer */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: 700, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
            <Box sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)', px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>Code Diff</Typography>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.paper' }}>
              <ReactDiffViewer
                oldValue=""
                newValue={review?.diff || ''}
                splitView={false}
                hideLineNumbers={false}
              />
            </Box>
          </Card>
        </Grid>

        {/* Right Column: AI Comments */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: 700, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
            <Box sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)', px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
              <Chip label="AI" color="primary" size="small" sx={{ fontWeight: 700, mr: 1, height: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Review Feedback</Typography>
            </Box>

            <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
              {(!review?.issues || review.issues.length === 0) ? (
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  No issues found or still processing.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {review.issues.map((issue: any) => (
                    <Paper key={issue.id} variant="outlined" sx={{ p: 2, bgcolor: '#fff7ed', borderColor: '#fed7aa', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                          <WarningIcon color="warning" fontSize="small" sx={{ mt: 0.25 }} />
                          <Typography variant="subtitle2" sx={{ color: '#7c2d12', fontWeight: 600 }}>
                            {issue.rule_violated}
                          </Typography>
                        </Box>
                        <Chip
                          label={issue.severity}
                          size="small"
                          sx={{ bgcolor: '#ffedd5', color: '#9a3412', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', height: 20 }}
                        />
                      </Box>
                      
                      <Typography variant="body2" sx={{ color: '#9a3412', mb: 2, lineHeight: 1.6 }}>
                        {issue.explanation}
                      </Typography>

                      {issue.suggested_fix && (
                        <Box sx={{ mt: 2, mb: 2 }}>
                          <Typography variant="caption" sx={{ color: '#c2410c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Suggested Fix:
                          </Typography>
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              mt: 0.5,
                              bgcolor: 'rgba(255, 237, 213, 0.5)',
                              borderColor: '#fed7aa',
                              fontFamily: 'monospace',
                              fontSize: '0.8rem',
                              color: '#7c2d12',
                              overflowX: 'auto'
                            }}
                          >
                            <pre style={{ margin: 0 }}>{issue.suggested_fix}</pre>
                          </Paper>
                        </Box>
                      )}

                      <Button
                        variant="outlined"
                        fullWidth
                        color="warning"
                        startIcon={<CheckCircleIcon />}
                        sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: '#ffedd5' } }}
                      >
                        Resolve Issue
                      </Button>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Layout>
  );
}
