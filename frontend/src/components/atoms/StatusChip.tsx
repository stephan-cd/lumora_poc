import React from 'react';
import { Chip, ChipProps } from '@mui/material';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: string;
  color?: ChipProps['color'];
}

export default function StatusChip({ status, sx, color, ...props }: StatusChipProps) {
  const isSuccess = status === 'APPROVED' || status === 'ACTIVE';
  const isError = status === 'REJECTED';
  const isWarning = status === 'PENDING';
  
  const defaultColor = isSuccess ? 'success' : isError ? 'error' : isWarning ? 'warning' : 'default';

  // Format standard roles/statuses
  const label = status ? status.replace('_', ' ') : 'UNKNOWN';

  return (
    <Chip
      label={label}
      size="small"
      color={color || defaultColor}
      sx={{ fontSize: '0.75rem', fontWeight: 600, ...sx }}
      {...props}
    />
  );
}
