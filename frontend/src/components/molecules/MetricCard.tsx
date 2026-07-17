import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  subtitle?: React.ReactNode;
}

export default function MetricCard({ title, value, icon, iconBgColor = 'primary.light', iconColor = 'white', subtitle }: MetricCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
        <Box sx={{ p: 1.5, bgcolor: iconBgColor, borderRadius: 3, color: iconColor, display: 'flex' }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">{title}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>{value}</Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
