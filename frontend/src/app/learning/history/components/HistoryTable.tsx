import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Stack,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  School as SchoolIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { statusColor, typeChipColor, typeChipText } from './constants';

interface HistoryTableProps {
  isLoading: boolean;
  history: any[];
  onViewLog: (log: any) => void;
  onEditLog: (log: any) => void;
  onDeleteLog: (logId: string) => void;
}

const thCell = {
  fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' as const,
  letterSpacing: 0.6, color: 'text.secondary', bgcolor: 'action.hover',
  borderBottom: '2px solid', borderColor: 'divider', py: 1.5, px: 2
};
const tdCell = { py: 1.5, px: 2, fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider' };

export default function HistoryTable({ isLoading, history, onViewLog, onEditLog, onDeleteLog }: HistoryTableProps) {
  if (isLoading) {
    return <Box sx={{ display: 'flex', py: 8, justifyContent: 'center' }}><CircularProgress size={32} /></Box>;
  }

  if (history.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <SchoolIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 1.5 }} />
        <Typography variant="body1" color="text.secondary">No learning hours logged yet.</Typography>
        <Typography variant="body2" color="text.disabled">Click "Log Hours" to add your first entry.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 0, boxShadow: 'none' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={thCell}>Date</TableCell>
            <TableCell sx={thCell}>Skill</TableCell>
            <TableCell sx={thCell}>Hours</TableCell>
            <TableCell sx={thCell}>Type</TableCell>
            <TableCell sx={thCell}>Source</TableCell>
            <TableCell sx={thCell}>Description</TableCell>
            <TableCell sx={thCell}>Status</TableCell>
            <TableCell sx={{ ...thCell, textAlign: 'center' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {history.map((log: any) => (
            <TableRow
              key={log.id}
              onClick={() => onViewLog(log)}
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, '&:last-child td': { borderBottom: 0 } }}
            >
              <TableCell sx={{ ...tdCell, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                {new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </TableCell>
              <TableCell sx={{ ...tdCell, fontWeight: 600 }}>{log.skill.name}</TableCell>
              <TableCell sx={{ ...tdCell, fontWeight: 700 }}>{log.hoursSpent}h</TableCell>
              <TableCell sx={tdCell}>
                <Box sx={{
                  display: 'inline-block', px: 1, py: 0.3,
                  fontSize: '0.68rem', fontWeight: 700,
                  bgcolor: typeChipColor[log.learningType] || '#f1f5f9',
                  color: typeChipText[log.learningType] || '#475569',
                  borderRadius: '4px'
                }}>
                  {log.learningType.replace(/_/g, ' ')}
                </Box>
              </TableCell>
              <TableCell sx={{ ...tdCell, color: 'text.secondary' }}>{log.learningSource}</TableCell>
              <TableCell sx={{ ...tdCell, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.secondary' }}>
                {log.description}
              </TableCell>
              <TableCell sx={tdCell}>
                <Chip label={log.status} size="small" color={statusColor(log.status)}
                  sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }} />
              </TableCell>
              <TableCell sx={{ ...tdCell, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                {log.status === 'PENDING' ? (
                  <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => onEditLog(log)} color="primary">
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => onDeleteLog(log.id)} color="error">
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ) : (
                  <Typography variant="caption" color="text.disabled">—</Typography>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
