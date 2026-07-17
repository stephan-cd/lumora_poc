import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  TextField,
  MenuItem,
  Alert,
  Grid,
  InputAdornment
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { logSchema, LogForm, DESC_MAX, ATTACH_MAX, TYPES, SOURCES } from './constants';
import { LearningType, LearningSource } from '@prisma/client';

interface LogDialogProps {
  open: boolean;
  editingLog: any;
  skills: any[];
  submitError: string;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function LogDialog({ open, editingLog, skills, submitError, onClose, onSubmit: parentOnSubmit }: LogDialogProps) {
  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<LogForm>({
    resolver: zodResolver(logSchema),
    defaultValues: { hoursSpent: 1, learningType: 'COURSE', learningSource: 'MANUAL', skillId: '', date: new Date().toISOString().split('T')[0], description: '', attachmentPath: '' }
  });

  const descValue = useWatch({ control, name: 'description', defaultValue: '' });
  const attachValue = useWatch({ control, name: 'attachmentPath', defaultValue: '' });

  useEffect(() => {
    if (open) {
      if (editingLog) {
        reset({
          skillId: editingLog.skillId,
          date: new Date(editingLog.date).toISOString().split('T')[0],
          hoursSpent: editingLog.hoursSpent,
          learningType: editingLog.learningType,
          learningSource: editingLog.learningSource,
          description: editingLog.description,
          attachmentPath: editingLog.attachmentPath || ''
        });
      } else {
        reset({
          skillId: '',
          date: new Date().toISOString().split('T')[0],
          hoursSpent: 1,
          learningType: 'COURSE',
          learningSource: 'MANUAL',
          description: '',
          attachmentPath: ''
        });
      }
    }
  }, [open, editingLog, reset]);

  const onSubmitForm = async (data: LogForm) => {
    await parentOnSubmit(data);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 520, maxWidth: '96vw' } } }}
    >
      <Box sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {editingLog ? 'Edit Learning Entry' : 'Log Learning Hours'}
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <form onSubmit={handleSubmit(onSubmitForm)}>
        <DialogContent sx={{ pt: 3, pb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {submitError && <Alert severity="error">{submitError}</Alert>}

          {/* Skill */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>Skill <span style={{ color: '#ef4444' }}>*</span></Typography>
            <Controller
              name="skillId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  size="small"
                  placeholder="Select a skill"
                  error={!!errors.skillId}
                  helperText={errors.skillId?.message}
                >
                  {!skills ? (
                    <MenuItem value="" disabled>Loading…</MenuItem>
                  ) : (
                    skills.map((s: any) => (
                      <MenuItem key={s.id} value={s.id}>{s.name} — {s.category}</MenuItem>
                    ))
                  )}
                </TextField>
              )}
            />
          </Box>

          {/* Date + Hours */}
          <Grid container spacing={2}>
            <Grid size={6}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>Date <span style={{ color: '#ef4444' }}>*</span></Typography>
              <TextField
                {...register('date')}
                type="date"
                fullWidth
                size="small"
                error={!!errors.date}
                helperText={errors.date?.message || 'No future dates'}
                slotProps={{ htmlInput: { max: new Date().toISOString().split('T')[0] } }}
              />
            </Grid>
            <Grid size={6}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>Hours Spent <span style={{ color: '#ef4444' }}>*</span></Typography>
              <TextField
                {...register('hoursSpent', { valueAsNumber: true })}
                type="number"
                fullWidth
                size="small"
                error={!!errors.hoursSpent}
                helperText={errors.hoursSpent?.message || '0.5 – 16 hrs'}
                slotProps={{
                  htmlInput: { step: '0.5', min: '0.5', max: '16' },
                  input: { endAdornment: <InputAdornment position="end">hrs</InputAdornment> }
                }}
              />
            </Grid>
          </Grid>

          {/* Type + Source */}
          <Grid container spacing={2}>
            <Grid size={6}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>Type <span style={{ color: '#ef4444' }}>*</span></Typography>
              <Controller
                name="learningType"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    size="small"
                    error={!!errors.learningType}
                    helperText={errors.learningType?.message}
                  >
                    {TYPES.map(t => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>)}
                  </TextField>
                )}
              />
            </Grid>
            <Grid size={6}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>Source <span style={{ color: '#ef4444' }}>*</span></Typography>
              <Controller
                name="learningSource"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    size="small"
                    error={!!errors.learningSource}
                    helperText={errors.learningSource?.message}
                  >
                    {SOURCES.map(s => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>)}
                  </TextField>
                )}
              />
            </Grid>
          </Grid>

          {/* Description */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>Description <span style={{ color: '#ef4444' }}>*</span></Typography>
            <TextField
              {...register('description')}
              fullWidth
              size="small"
              multiline
              rows={3}
              placeholder="Modules covered, key takeaways, tools used…"
              error={!!errors.description}
              helperText={
                <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{errors.description?.message || 'Min 5 characters'}</span>
                  <span style={{ color: (descValue?.length ?? 0) > DESC_MAX * 0.9 ? '#ef4444' : '#94a3b8' }}>
                    {descValue?.length ?? 0}/{DESC_MAX}
                  </span>
                </Box>
              }
              slotProps={{ htmlInput: { maxLength: DESC_MAX } }}
            />
          </Box>

          {/* Attachment URL */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>Certificate / Attachment URL</Typography>
            <TextField
              {...register('attachmentPath')}
              fullWidth
              size="small"
              placeholder="https://… (optional)"
              error={!!errors.attachmentPath}
              helperText={
                <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{errors.attachmentPath?.message || 'Certificate link or proof of completion'}</span>
                  <span style={{ color: (attachValue?.length ?? 0) > ATTACH_MAX * 0.9 ? '#ef4444' : '#94a3b8' }}>
                    {attachValue?.length ?? 0}/{ATTACH_MAX}
                  </span>
                </Box>
              }
              slotProps={{ htmlInput: { maxLength: ATTACH_MAX } }}
            />
          </Box>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button type="submit" variant="contained" sx={{ fontWeight: 600, px: 3 }}>
            {editingLog ? 'Update Entry' : 'Submit for Approval'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
