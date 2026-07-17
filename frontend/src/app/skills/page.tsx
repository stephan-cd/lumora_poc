'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip
} from '@mui/material';

import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Check as ApproveIcon,
  Close as RejectIcon
} from '@mui/icons-material';

import { requestCustomSkillAction, processSkillRequestAction, addAdminSkillAction } from '@/app/actions';
import CustomTabPanel from '@/components/atoms/CustomTabPanel';
import StatusChip from '@/components/atoms/StatusChip';
import EmptyState from '@/components/organisms/EmptyState';

const CATEGORIES = [
  'Programming Languages',
  'Frontend',
  'Backend',
  'Database',
  'Cloud',
  'DevOps',
  'Testing',
  'AI',
  'Security',
  'Project Management',
  'System & Architecture'
];

export default function SkillsPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const user = session?.user;
  const userRole = user?.role;

  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Dialogs State
  const [requestOpen, setRequestOpen] = useState(false);
  const [adminSkillOpen, setAdminSkillOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approveComments, setApproveComments] = useState('');

  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const showSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  const { register: regRequest, handleSubmit: handleRequestSubmit, reset: resetRequestForm } = useForm();
  const { register: regAdminSkill, handleSubmit: handleAdminSkillSubmit, reset: resetAdminSkillForm } = useForm();

  // Queries
  const { data: skills, isLoading: skillsLoading } = useQuery({
    queryKey: ['skills', searchTerm, selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      return fetch(`/api/skills?${params.toString()}`).then(res => res.json());
    }
  });

  const { data: pendingRequests, isLoading: pendingLoading } = useQuery({
    queryKey: ['pendingRequests'],
    queryFn: () => fetch('/api/skills/requests').then(res => res.json()),
    enabled: userRole !== 'TEAM_MEMBER'
  });

  const { data: requestsHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['requestsHistory'],
    queryFn: () => fetch('/api/skills/requests?history=true').then(res => res.json())
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setActionSuccess('');
    setActionError('');
  };

  const onRequestCustomSkill = async (data: any) => {
    setActionSuccess('');
    setActionError('');
    try {
      await requestCustomSkillAction({
        skillName: data.skillName,
        category: data.category,
        description: data.description
      });
      showSuccess('Custom skill request submitted successfully! Pending approval.');
      resetRequestForm();
      queryClient.invalidateQueries({ queryKey: ['requestsHistory'] });
      setTimeout(() => setRequestOpen(false), 2000);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to submit skill request.');
    }
  };

  const onAddAdminSkill = async (data: any) => {
    setActionSuccess('');
    setActionError('');
    try {
      await addAdminSkillAction({
        name: data.name,
        category: data.category,
        description: data.description
      });
      showSuccess('Global skill added successfully!');
      resetAdminSkillForm();
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      setTimeout(() => setAdminSkillOpen(false), 2000);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to add global skill.');
    }
  };

  const handleProcessRequest = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedRequest) return;
    setActionSuccess('');
    setActionError('');
    try {
      await processSkillRequestAction(selectedRequest.id, status, approveComments);
      showSuccess(`Custom skill request has been ${status.toLowerCase()}!`);
      setApproveComments('');
      setApprovalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
      queryClient.invalidateQueries({ queryKey: ['requestsHistory'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    } catch (err: any) {
      setActionError(err?.message || 'Failed to process request.');
    }
  };

  return (
    <Layout>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Skills Directory" />
            <Tab label="Skill Requests" />
          </Tabs>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setRequestOpen(true)}
            >
              Request Custom Skill
            </Button>
            {userRole === 'TOWER_HEAD' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAdminSkillOpen(true)}
              >
                Add Global Skill
              </Button>
            )}
          </Box>
        </Box>

        {actionSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{actionSuccess}</Alert>}
        {actionError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{actionError}</Alert>}

        {/* --- TABS PANEL 1: SKILLS DIRECTORY --- */}
        <CustomTabPanel value={activeTab} index={0}>
          <Card sx={{ p: 3 }}>
            <Grid container spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  placeholder="Search skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Category"
                  slotProps={{ select: { displayEmpty: true } }}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {CATEGORIES.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            {skillsLoading ? (
              <Box sx={{ display: 'flex', py: 8, justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            ) : !skills || skills.length === 0 ? (
              <EmptyState message="No skills found. Try modifying filters or request a new custom skill." />
            ) : (
              <Grid container spacing={2}>
                {skills.map((skill: any) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={skill.id}>
                    <Card variant="outlined" sx={{ borderRadius: 3, transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 } }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>{skill.name}</Typography>
                        <Chip label={skill.category} size="small" color="primary" variant="outlined" sx={{ mb: 1, fontSize: '0.7rem' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', minHeight: 40 }}>
                          {skill.description || 'No description provided.'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Card>
        </CustomTabPanel>

        {/* --- TABS PANEL 2: SKILL REQUESTS --- */}
        <CustomTabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            {/* Approver View: Pending approvals list */}
            {userRole !== 'TEAM_MEMBER' && (
              <Grid size={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Skill Requests Pending Your Approval
                </Typography>
                <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 4 }}>
                  <Table>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Skill Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Requested By</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center"><CircularProgress size={24} /></TableCell>
                        </TableRow>
                      ) : !pendingRequests || pendingRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">No pending skill requests.</TableCell>
                        </TableRow>
                      ) : (
                        pendingRequests.map((req: any) => (
                          <TableRow key={req.id}>
                            <TableCell sx={{ fontWeight: 600 }}>{req.skillName}</TableCell>
                            <TableCell>{req.category}</TableCell>
                            <TableCell>{req.requestedBy.name}</TableCell>
                            <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>{req.description || 'N/A'}</TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                <Tooltip title="Process Request">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => { setSelectedRequest(req); setApprovalOpen(true); }}
                                  >
                                    Review
                                  </Button>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}

            {/* General View: Request history */}
            <Grid size={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                Skill Requests Log
              </Typography>
              <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Table>
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Skill Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Requested By</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Comments</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center"><CircularProgress size={24} /></TableCell>
                      </TableRow>
                    ) : !requestsHistory || requestsHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">No request history found.</TableCell>
                      </TableRow>
                    ) : (
                      requestsHistory.map((req: any) => (
                        <TableRow key={req.id}>
                          <TableCell sx={{ fontWeight: 600 }}>{req.skillName}</TableCell>
                          <TableCell>{req.category}</TableCell>
                          <TableCell>{req.requestedBy.name}</TableCell>
                          <TableCell>
                            <StatusChip status={req.status} />
                          </TableCell>
                          <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>{req.comments || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </CustomTabPanel>
      </Box>

      {/* Request Custom Skill Dialog */}
      <Dialog open={requestOpen} onClose={() => setRequestOpen(false)} slotProps={{ paper: { sx: { borderRadius: 3, width: 440 } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Request Custom Skill</DialogTitle>
        <form onSubmit={handleRequestSubmit(onRequestCustomSkill)}>
          <DialogContent sx={{ py: 1 }}>
            <TextField
              {...regRequest('skillName')}
              label="Skill Name"
              fullWidth
              margin="normal"
              required
              slotProps={{ inputLabel: { shrink: true } }}
              placeholder="e.g. Astro Framework"
            />
            <TextField
              {...regRequest('category')}
              select
              label="Category"
              fullWidth
              margin="normal"
              required
              defaultValue=""
              slotProps={{ inputLabel: { shrink: true } }}
            >
              {CATEGORIES.map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </TextField>
            <TextField
              {...regRequest('description')}
              label="Description"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              slotProps={{ inputLabel: { shrink: true } }}
              placeholder="Brief description of the skill and its business value..."
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setRequestOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained">Submit Request</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Admin Add Global Skill Dialog */}
      <Dialog open={adminSkillOpen} onClose={() => setAdminSkillOpen(false)} slotProps={{ paper: { sx: { borderRadius: 3, width: 440 } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Global Skill</DialogTitle>
        <form onSubmit={handleAdminSkillSubmit(onAddAdminSkill)}>
          <DialogContent sx={{ py: 1 }}>
            <TextField
              {...regAdminSkill('name')}
              label="Skill Name"
              fullWidth
              margin="normal"
              required
              slotProps={{ inputLabel: { shrink: true } }}
              placeholder="e.g. Django"
            />
            <TextField
              {...regAdminSkill('category')}
              select
              label="Category"
              fullWidth
              margin="normal"
              required
              defaultValue=""
              slotProps={{ inputLabel: { shrink: true } }}
            >
              {CATEGORIES.map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </TextField>
            <TextField
              {...regAdminSkill('description')}
              label="Description"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              slotProps={{ inputLabel: { shrink: true } }}
              placeholder="Provide a description..."
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setAdminSkillOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained">Create Skill</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Process Request Dialog */}
      <Dialog open={approvalOpen} onClose={() => setApprovalOpen(false)} slotProps={{ paper: { sx: { borderRadius: 3, width: 400 } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Review Skill Request</DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>Skill:</strong> {selectedRequest?.skillName}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>Category:</strong> {selectedRequest?.category}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Requested By:</strong> {selectedRequest?.requestedBy.name}
          </Typography>
          <TextField
            label="Comments / Rationale"
            fullWidth
            multiline
            rows={2}
            value={approveComments}
            onChange={(e) => setApproveComments(e.target.value)}
            placeholder="Provide comments for approval or rejection..."
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
          <Button onClick={() => setApprovalOpen(false)} color="inherit">Close</Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<RejectIcon />}
              onClick={() => handleProcessRequest('REJECTED')}
            >
              Reject
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<ApproveIcon />}
              onClick={() => handleProcessRequest('APPROVED')}
            >
              Approve
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
