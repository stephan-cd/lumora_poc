import React from 'react';
import { Box, Typography } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

interface EmptyStateProps {
  message: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
      <InboxIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
      <Typography variant="body1">{message}</Typography>
    </Box>
  );
}
