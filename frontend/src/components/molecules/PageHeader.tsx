import React from 'react';
import { Box, Typography } from '@mui/material';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1, letterSpacing: '-0.02em' }}>
          {title}
        </Typography>
        {subtitle && <Typography variant="body1" color="text.secondary">{subtitle}</Typography>}
      </Box>
      {action && <Box>{action}</Box>}
    </Box>
  );
}
