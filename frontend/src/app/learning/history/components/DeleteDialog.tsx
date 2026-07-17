import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Divider,
  Button
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteDialog({ open, onClose, onConfirm }: DeleteDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 400, maxWidth: '96vw' } } }}
    >
      <Box sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Confirm Deletion
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Typography variant="body1">
          Are you sure you want to delete this pending learning entry? This action cannot be undone.
        </Typography>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onConfirm} color="error" variant="contained" sx={{ fontWeight: 600, px: 3 }}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
