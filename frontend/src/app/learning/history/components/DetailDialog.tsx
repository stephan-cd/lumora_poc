import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  Stack,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { statusColor, typeChipColor, typeChipText } from './constants';

/** Small labelled row used in the detail view */
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}>
      <Typography
        variant="caption"
        sx={{
          width: 160, minWidth: 160, color: 'text.secondary', fontWeight: 700,
          fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.6, pt: 0.2
        }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1 }}>{value}</Box>
    </Box>
  );
}

interface DetailDialogProps {
  viewingLog: any;
  onClose: () => void;
  onEdit: (log: any) => void;
  onDelete: (logId: string) => void;
}

export default function DetailDialog({ viewingLog, onClose, onEdit, onDelete }: DetailDialogProps) {
  if (!viewingLog) return null;

  return (
    <Dialog
      open={!!viewingLog}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 580, maxWidth: '96vw', overflow: 'hidden' } } }}
    >
      <Box sx={{ bgcolor: 'primary.main', px: 3, pt: 3, pb: 2.5, color: '#fff', position: 'relative' }}>
        <IconButton size="small" onClick={onClose}
          sx={{ position: 'absolute', top: 12, right: 12, color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.12)' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
        <Typography variant="overline" sx={{ fontSize: '0.65rem', letterSpacing: 1.5, opacity: 0.75 }}>Learning Log</Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5, fontSize: '1.05rem' }}>{viewingLog.skill?.name}</Typography>
        <Stack direction="row" spacing={2.5} sx={{ mt: 1.5, alignItems: 'center' }}>
          <Stack direction="row" spacing={0.7} sx={{ alignItems: 'center' }}>
            <CalendarIcon sx={{ fontSize: 14, opacity: 0.8 }} />
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.82rem' }}>
              {new Date(viewingLog.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.7} sx={{ alignItems: 'center' }}>
            <AccessTimeIcon sx={{ fontSize: 14, opacity: 0.8 }} />
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.82rem' }}>{viewingLog.hoursSpent} hrs</Typography>
          </Stack>
          <Box sx={{ flex: 1 }} />
          <Chip label={viewingLog.status} size="small" color={statusColor(viewingLog.status)}
            sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }} />
        </Stack>
      </Box>

      <DialogContent sx={{ px: 3, py: 0 }}>
        <Box sx={{ py: 0.5 }}>
          <DetailRow label="Skill" value={<Typography variant="body2" sx={{ fontWeight: 600 }}>{viewingLog.skill?.name}</Typography>} />
          <DetailRow label="Category" value={<Typography variant="body2">{viewingLog.skill?.category || '—'}</Typography>} />
          <DetailRow label="Learning Type" value={
            <Box sx={{
              display: 'inline-block', px: 1, py: 0.3, borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700,
              bgcolor: typeChipColor[viewingLog.learningType] || '#f1f5f9', color: typeChipText[viewingLog.learningType] || '#475569'
            }}>
              {viewingLog.learningType.replace(/_/g, ' ')}
            </Box>
          } />
          <DetailRow label="Source" value={<Typography variant="body2">{viewingLog.learningSource}</Typography>} />
          <DetailRow label="Description" value={
            <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'text.primary' }}>{viewingLog.description}</Typography>
          } />
          {viewingLog.attachmentPath && (
            <DetailRow label="Attachment" value={
              <Typography variant="body2">
                <a href={viewingLog.attachmentPath} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>{viewingLog.attachmentPath}</a>
              </Typography>
            } />
          )}
          <DetailRow label="Status" value={
            <Chip label={viewingLog.status} size="small" color={statusColor(viewingLog.status)}
              sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }} />
          } />
          {viewingLog.approver && (
            <DetailRow label="Reviewed By" value={<Typography variant="body2" sx={{ fontWeight: 600 }}>{viewingLog.approver.name}</Typography>} />
          )}
          {viewingLog.comments && (
            <DetailRow label="Comments" value={
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>"{viewingLog.comments}"</Typography>
            } />
          )}
          <DetailRow label="Submitted On" value={
            <Typography variant="body2" color="text.secondary">{new Date(viewingLog.createdAt).toLocaleString()}</Typography>
          } />
        </Box>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        {viewingLog.status === 'PENDING' && (
          <>
            <Button size="small" startIcon={<EditIcon />} onClick={() => { onClose(); onEdit(viewingLog); }}
              sx={{ fontWeight: 600 }}>Edit</Button>
            <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => onDelete(viewingLog.id)}
              sx={{ fontWeight: 600 }}>Delete</Button>
          </>
        )}
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
