'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  Typography,
  Grid,
  Button,
  Alert
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { LearningType, LearningSource } from '@prisma/client';

import {
  submitLearningLogAction,
  editLearningLogAction,
  deleteLearningLogAction
} from '@/app/actions';

import HistoryTable from './components/HistoryTable';
import DetailDialog from './components/DetailDialog';
import LogDialog from './components/LogDialog';
import DeleteDialog from './components/DeleteDialog';

export default function LearningHistoryPage() {
  const queryClient = useQueryClient();
  const [logOpen, setLogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [viewingLog, setViewingLog] = useState<any>(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  const { data: skills } = useQuery({
    queryKey: ['skills'],
    queryFn: () => fetch('/api/skills').then(res => res.json())
  });

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['learningHistory'],
    queryFn: () => fetch('/api/learning/history').then(res => res.json())
  });

  const handleOpenAdd = () => {
    setEditingLog(null);
    setSubmitError('');
    setLogOpen(true);
  };

  const handleOpenEdit = (log: any) => {
    setEditingLog(log);
    setSubmitError('');
    setLogOpen(true);
  };

  const onSubmitForm = async (data: any) => {
    setSubmitError('');
    try {
      if (editingLog) {
        await editLearningLogAction(editingLog.id, { ...data, learningType: data.learningType as LearningType, learningSource: data.learningSource as LearningSource });
        showSuccess('Entry updated successfully.');
      } else {
        await submitLearningLogAction({ ...data, learningType: data.learningType as LearningType, learningSource: data.learningSource as LearningSource });
        showSuccess('Entry submitted. Pending manager approval.');
      }
      queryClient.invalidateQueries({ queryKey: ['learningHistory'] });
      setTimeout(() => setLogOpen(false), 1800);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit entry.');
    }
  };

  const confirmDelete = (logId: string) => {
    setDeleteConfirmId(logId);
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    const logId = deleteConfirmId;
    setDeleteConfirmId(null);
    setActionSuccess(''); setActionError('');
    try {
      await deleteLearningLogAction(logId);
      showSuccess('Entry deleted.');
      queryClient.invalidateQueries({ queryKey: ['learningHistory'] });
      if (viewingLog && viewingLog.id === logId) {
        setViewingLog(null);
      }
    } catch (err: any) {
      setActionError(err?.message || 'Failed to delete entry.');
    }
  };

  const history = historyData?.history || [];

  return (
    <Layout>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Card>
            {/* Header */}
            <Box sx={{ px: 3, py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>Learning Logs History</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, fontSize: '0.8rem' }}>
                  Click any row to view full details
                </Typography>
              </Box>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ fontWeight: 600 }}>
                Log Hours
              </Button>
            </Box>

            {/* Alerts */}
            {actionSuccess && <Alert severity="success" sx={{ mx: 3, mt: 2, mb: 2 }}>{actionSuccess}</Alert>}
            {actionError && <Alert severity="error" sx={{ mx: 3, mt: 2, mb: 2 }}>{actionError}</Alert>}

            {/* Table */}
            <HistoryTable
              isLoading={isLoading}
              history={history}
              onViewLog={setViewingLog}
              onEditLog={handleOpenEdit}
              onDeleteLog={confirmDelete}
            />
          </Card>
        </Grid>
      </Grid>

      {/* Detail View Dialog */}
      <DetailDialog
        viewingLog={viewingLog}
        onClose={() => setViewingLog(null)}
        onEdit={(log) => { setViewingLog(null); handleOpenEdit(log); }}
        onDelete={confirmDelete}
      />

      {/* Log / Edit Hours Dialog */}
      <LogDialog
        open={logOpen}
        editingLog={editingLog}
        skills={skills}
        submitError={submitError}
        onClose={() => setLogOpen(false)}
        onSubmit={onSubmitForm}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={executeDelete}
      />
    </Layout>
  );
}
