'use client';

import React, { useState, useRef } from 'react';
import Layout from '@/components/Layout';
import { useSession } from 'next-auth/react';
import {
  Box,
  Card,
  Typography,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  ErrorOutlined as ErrorIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import Link from 'next/link';

export default function CodeReviewUpload() {
  const { data: session } = useSession();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [reviewResults, setReviewResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleReview = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsProcessing(true);
    setError('');
    setReviewResults([]);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });
    
    // Add useLocalLLM preference if session has it (or fallback to false)
    const useLocalLLM = (session?.user as any)?.useLocalLLM || false;
    formData.append('useLocalLLM', String(useLocalLLM));

    try {
      const res = await fetch('http://localhost:8080/api/v1/reviews/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setReviewResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to process code review');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton component={Link} href="/code-review" color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: 'var(--font-outfit)' }}>
          Direct File Code Review
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
        <Card sx={{ p: 4, flex: 1, height: 'fit-content' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Upload Source Files
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Upload coding files to instantly get an AI-powered code review. 
            These files are processed ephemerally and are not permanently stored. 
            High-risk files (e.g. binaries, executables) will be rejected.
          </Typography>

          <input
            type="file"
            multiple
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          
          <Box
            onClick={handleUploadClick}
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              p: 6,
              textAlign: 'center',
              cursor: 'pointer',
              mb: 4,
              '&:hover': {
                bgcolor: 'action.hover',
                borderColor: 'primary.main'
              }
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              Click to select files or drag and drop
            </Typography>
          </Box>

          {selectedFiles.length > 0 && (
            <List sx={{ mb: 4, bgcolor: 'background.default', borderRadius: 2 }}>
              {selectedFiles.map((file, idx) => (
                <ListItem
                  key={idx}
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveFile(idx)}>
                      <DeleteIcon color="error" />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    <FileIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(1)} KB`} />
                </ListItem>
              ))}
            </List>
          )}

          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={selectedFiles.length === 0 || isProcessing}
            onClick={handleReview}
            startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isProcessing ? 'Analyzing Code...' : 'Review Uploaded Files'}
          </Button>
        </Card>

        {/* Results Panel */}
        {reviewResults.length > 0 && (
          <Box sx={{ flex: 1.5 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Review Feedback
            </Typography>
            {reviewResults.map((res: any, idx: number) => (
              <Accordion key={idx} defaultExpanded sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' }, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <FileIcon color="primary" />
                    <Typography sx={{ fontWeight: 600 }}>{res.filename}</Typography>
                    {res.error ? (
                      <Chip label="Error" color="error" size="small" sx={{ ml: 'auto' }} />
                    ) : res.issues?.length > 0 ? (
                      <Chip label={`${res.issues.length} Issues`} color="warning" size="small" sx={{ ml: 'auto' }} />
                    ) : (
                      <Chip label="Clean" color="success" size="small" sx={{ ml: 'auto' }} />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {res.error ? (
                    <Alert severity="error">{res.error}</Alert>
                  ) : res.issues?.length === 0 ? (
                    <Alert severity="success">No issues found in this file.</Alert>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {res.issues?.map((issue: any, i: number) => (
                        <Card key={i} variant="outlined" sx={{ p: 2, borderColor: issue.severity === 'high' ? 'error.light' : issue.severity === 'medium' ? 'warning.light' : 'divider' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            {issue.severity === 'high' ? <ErrorIcon color="error" fontSize="small" /> : <WarningIcon color="warning" fontSize="small" />}
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {issue.rule_violated} (Line {issue.line_number})
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>{issue.explanation}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Recommendation:</strong> {issue.recommendation}
                          </Typography>
                          {issue.suggested_fix && (
                            <Box sx={{ bgcolor: 'background.default', p: 1.5, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.85rem', overflowX: 'auto' }}>
                              {issue.suggested_fix}
                            </Box>
                          )}
                        </Card>
                      ))}
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </Box>
    </Layout>
  );
}
