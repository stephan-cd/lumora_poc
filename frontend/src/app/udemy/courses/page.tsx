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
  Alert,
  Rating,
  Button,
  Chip
} from '@mui/material';

import {
  Search as SearchIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';

export default function UdemyCoursesPage() {
  const [search, setSearch] = useState('');

  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['udemyCourses'],
    queryFn: () => fetch('/api/udemy?type=courses').then(res => res.json())
  });

  const getFilteredCourses = () => {
    if (!courses || !Array.isArray(courses)) return [];
    
    return courses.filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
    );
  };

  const filtered = getFilteredCourses();

  return (
    <Layout>
      <Box sx={{ width: '100%' }}>
        <Card sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                placeholder="Search courses by title, instructor, or category..."
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
          <Alert severity="error">Failed to load courses database.</Alert>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">No courses found matching the criteria.</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filtered.map((c: any) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={c.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                  <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, display: 'block', mb: 0.5 }}>
                      {c.category}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3, mb: 1, minHeight: 45 }}>
                      {c.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.85rem' }}>
                      Instructor: {c.instructor}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Rating value={c.rating} precision={0.1} readOnly size="small" />
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{c.rating}</Typography>
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Duration: {c.duration} hours | Language: {c.language}
                    </Typography>
                    
                    {c.skill && (
                      <Box sx={{ mt: 1.5 }}>
                        <Chip label={`Maps to: ${c.skill.name}`} size="small" color="primary" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                      </Box>
                    )}
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0, mt: 'auto' }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      href={c.url || '#'}
                      target="_blank"
                      endIcon={<LaunchIcon />}
                    >
                      View on Udemy
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Layout>
  );
}
