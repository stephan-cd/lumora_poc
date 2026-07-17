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
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab
} from '@mui/material';

import {
  Check as ApproveIcon,
  Close as RejectIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

import { processApprovalAction, processBulkApprovalsAction } from '@/app/actions';
import StatusChip from '@/components/atoms/StatusChip';
import EmptyState from '@/components/organisms/EmptyState';

export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0); // 0 = Pending, 1 = History

  // Filter States
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Bulk operation states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkComments, setBulkComments] = useState('');
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');

  // Single review states
  const [reviewLog, setReviewLog] = useState<any>(null);
  const [reviewComments, setReviewComments] = useState('');

  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const showSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  // Queries
  const { data: skills } = useQuery({
    queryKey: ['skills'],
    queryFn: () => fetch('/api/skills').then(res => res.json())
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/organization/users').then(res => res.json())
  });

  const { data: records, isLoading } = useQuery({
    queryKey: ['approvals', activeTab, employeeFilter, skillFilter, startDateFilter, endDateFilter, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('pending', activeTab === 0 ? 'true' : 'false');
      if (employeeFilter) params.append('employeeId', employeeFilter);
      if (skillFilter) params.append('skillId', skillFilter);
      if (startDateFilter) params.append('startDate', startDateFilter);
      if (endDateFilter) params.append('endDate', endDateFilter);
      if (statusFilter) params.append('status', statusFilter);
      return fetch(`/api/learning/approvals?${params.toString()}`).then(res => res.json());
    }
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setSelectedIds([]);
    setActionSuccess('');
    setActionError('');
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && records) {
      setSelectedIds(records.map((r: any) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleOpenBulk = (status: 'APPROVED' | 'REJECTED') => {
    setBulkActionType(status);
    setBulkComments('');
    setBulkDialogOpen(true);
  };

  const handleBulkSubmit = async () => {
    setActionSuccess('');
    setActionError('');
    try {
      const res = await processBulkApprovalsAction(selectedIds, bulkActionType, bulkComments);
      showSuccess(`Successfully bulk-processed ${res.count} entries!`);
      setSelectedIds([]);
      setBulkDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    } catch (err: any) {
      setActionError(err?.message || 'Failed to complete bulk operations.');
    }
  };

  const handleSingleSubmit = async (status: 'APPROVED' | 'REJECTED') => {
    if (!reviewLog) return;
    setActionSuccess('');
    setActionError('');
    try {
      await processApprovalAction(reviewLog.id, status, reviewComments);
      showSuccess(`Learning record has been ${status.toLowerCase()}!`);
      setReviewLog(null);
      setReviewComments('');
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    } catch (err: any) {
      setActionError(err?.message || 'Failed to process record.');
    }
  };

  const handleClearFilters = () => {
    setEmployeeFilter('');
    setSkillFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setStatusFilter('');
  };

  const isAllSelected = !!(records && records.length > 0 && selectedIds.length === records.length);

  return (
    <Layout>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Pending Approvals" />
            <Tab label="Decision History" />
          </Tabs>
        </Box>

        {actionSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{actionSuccess}</Alert>}
        {actionError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{actionError}</Alert>}

        {/* Filters Card */}
        <Card sx={{ p: 3, mb: 4 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon fontSize="small" /> Filter Approvals
          </Typography>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <TextField
                select
                fullWidth
                label="Team Member"
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                slotProps={{ select: { displayEmpty: true } }}
              >
                <MenuItem value="">All Members</MenuItem>
                {users && users.map((u: any) => (
                  <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <TextField
                select
                fullWidth
                label="Skill"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                slotProps={{ select: { displayEmpty: true } }}
              >
                <MenuItem value="">All Skills</MenuItem>
                {skills && skills.map((s: any) => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <TextField
                type="date"
                fullWidth
                label="Start Date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <TextField
                type="date"
                fullWidth
                label="End Date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            {activeTab === 1 && (
              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  slotProps={{ select: { displayEmpty: true } }}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </TextField>
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 6, md: activeTab === 1 ? 12 : 2.4 }} sx={{ textAlign: 'right' }}>
              <Button variant="text" color="inherit" onClick={handleClearFilters}>
                Clear
              </Button>
            </Grid>
          </Grid>
        </Card>

        {/* Bulk Action Buttons (only visible in Pending Tab and when entries are selected) */}
        {activeTab === 0 && selectedIds.length > 0 && (
          <Box sx={{ mb: 2, display: 'flex', gap: 1.5, p: 2, bgcolor: 'action.selected', borderRadius: 3, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {selectedIds.length} entries selected
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<ApproveIcon />}
              onClick={() => handleOpenBulk('APPROVED')}
            >
              Bulk Approve
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<RejectIcon />}
              onClick={() => handleOpenBulk('REJECTED')}
            >
              Bulk Reject
            </Button>
          </Box>
        )}

        {/* Records Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                {activeTab === 0 && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedIds.length > 0 && !isAllSelected}
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                )}
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Skill</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Hours Spent</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                {activeTab === 1 && <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>}
                {activeTab === 1 && <TableCell sx={{ fontWeight: 700 }}>Comments</TableCell>}
                <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={activeTab === 0 ? 8 : 9} align="center"><CircularProgress size={24} /></TableCell>
                </TableRow>
              ) : !records || records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeTab === 0 ? 8 : 9} align="center" sx={{ p: 0 }}>
                    <EmptyState message="No learning logs found." />
                  </TableCell>
                </TableRow>
              ) : (
                records.map((log: any) => (
                  <TableRow key={log.id}>
                    {activeTab === 0 && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(log.id)}
                          onChange={() => handleSelectOne(log.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{log.user.name}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{log.skill.name}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{log.hoursSpent} hrs</TableCell>
                    <TableCell><Chip label={log.learningType} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} /></TableCell>
                    <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.description}
                    </TableCell>
                    {activeTab === 1 && (
                      <TableCell>
                        <StatusChip status={log.status} />
                      </TableCell>
                    )}
                    {activeTab === 1 && <TableCell sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>{log.comments || '-'}</TableCell>}
                    <TableCell align="center">
                      {activeTab === 0 ? (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => { setReviewLog(log); setReviewComments(''); }}
                        >
                          Review
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary">Processed</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Individual Review Dialog */}
      <Dialog open={!!reviewLog} onClose={() => setReviewLog(null)} slotProps={{ paper: { sx: { borderRadius: 3, width: 440 } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Review Learning Log</DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Employee:</strong> {reviewLog?.user.name} ({reviewLog?.user.employeeId})
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Skill:</strong> {reviewLog?.skill.name}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Hours Spent:</strong> {reviewLog?.hoursSpent} hrs
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Description:</strong> {reviewLog?.description}
          </Typography>
          <TextField
            label="Approver Comments"
            fullWidth
            multiline
            rows={3}
            value={reviewComments}
            onChange={(e) => setReviewComments(e.target.value)}
            placeholder="Add feedback or reasons for this approval/rejection decision..."
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
          <Button onClick={() => setReviewLog(null)} color="inherit">Cancel</Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<RejectIcon />}
              onClick={() => handleSingleSubmit('REJECTED')}
            >
              Reject
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<ApproveIcon />}
              onClick={() => handleSingleSubmit('APPROVED')}
            >
              Approve
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} slotProps={{ paper: { sx: { borderRadius: 3, width: 400 } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Bulk {bulkActionType === 'APPROVED' ? 'Approve' : 'Reject'} Entries
        </DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
            You are about to bulk {bulkActionType.toLowerCase()} <strong>{selectedIds.length}</strong> selected learning entries.
          </Typography>
          <TextField
            label="Bulk Comments"
            fullWidth
            multiline
            rows={2}
            value={bulkComments}
            onChange={(e) => setBulkComments(e.target.value)}
            placeholder="Applies to all selected records..."
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setBulkDialogOpen(false)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            color={bulkActionType === 'APPROVED' ? 'success' : 'error'}
            onClick={handleBulkSubmit}
          >
            Process Bulk {bulkActionType === 'APPROVED' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
