'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Card,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';

import {
  PersonAdd as AddIcon,
  Edit as EditIcon,
  Block as DisableIcon,
  AccountTree as TreeIcon,
  List as ListIcon
} from '@mui/icons-material';

import {
  createReportingManagerAction,
  createTeamMemberAction,
  editReportingManagerAction,
  editTeamMemberAction,
  disableUserAction
} from '@/app/actions';

import CustomTabPanel from '@/components/atoms/CustomTabPanel';
import StatusChip from '@/components/atoms/StatusChip';
import EmptyState from '@/components/organisms/EmptyState';

export default function OrganizationPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const user = session?.user;
  const userRole = user?.role as string | undefined;

  const [activeTab, setActiveTab] = useState(0);

  // Dialog States
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const showSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  const { register, handleSubmit, reset, setValue } = useForm();

  // Queries
  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ['orgUsers'],
    queryFn: () => fetch('/api/organization/users').then(res => res.json())
  });

  const users = Array.isArray(usersResponse) ? usersResponse : [];

  const { data: hierarchy, isLoading: treeLoading } = useQuery({
    queryKey: ['orgHierarchy'],
    queryFn: () => fetch('/api/organization/hierarchy').then(res => res.json())
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setActionSuccess('');
    setActionError('');
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    reset({
      employeeId: '',
      name: '',
      email: '',
      designation: '',
      department: ''
    });
    setUserDialogOpen(true);
  };

  const handleOpenEdit = (target: any) => {
    setEditingUser(target);
    reset({
      employeeId: target.employeeId,
      name: target.name,
      email: target.email,
      designation: target.designation,
      department: target.department
    });
    setUserDialogOpen(true);
  };

  const onSubmit = async (data: any) => {
    setActionSuccess('');
    setActionError('');
    try {
      if (editingUser) {
        if (editingUser.role === 'REPORTING_MANAGER') {
          await editReportingManagerAction(editingUser.id, data);
        } else {
          await editTeamMemberAction(editingUser.id, data);
        }
        showSuccess('User updated successfully!');
      } else {
        if (userRole === 'TOWER_HEAD') {
          await createReportingManagerAction(data);
          showSuccess('Reporting Manager created successfully! Default password is "password123".');
        } else if (userRole === 'REPORTING_MANAGER') {
          await createTeamMemberAction(data);
          showSuccess('Team Member created successfully! Default password is "password123".');
        }
      }
      queryClient.invalidateQueries({ queryKey: ['orgUsers'] });
      queryClient.invalidateQueries({ queryKey: ['orgHierarchy'] });
      setTimeout(() => setUserDialogOpen(false), 2500);
    } catch (err: any) {
      setActionError(err?.message || 'Action failed.');
    }
  };

  const handleDisable = async (targetId: string) => {
    if (!window.confirm('Are you sure you want to disable this user? This will block their login access.')) return;
    setActionSuccess('');
    setActionError('');
    try {
      await disableUserAction(targetId);
      showSuccess('User has been disabled successfully.');
      queryClient.invalidateQueries({ queryKey: ['orgUsers'] });
      queryClient.invalidateQueries({ queryKey: ['orgHierarchy'] });
    } catch (err: any) {
      setActionError(err?.message || 'Failed to disable user.');
    }
  };

  // Recursive renderer for Hierarchy Tree
  const renderTree = (nodes: any[]) => {
    if (!nodes || nodes.length === 0) return null;

    return (
      <Box sx={{ pl: 3, borderLeft: '1px dashed #cbd5e1', mt: 1 }}>
        {nodes.map((node) => (
          <Box key={node.id} sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  bgcolor: node.role === 'TOWER_HEAD' ? 'error.main' : node.role === 'REPORTING_MANAGER' ? 'primary.main' : 'secondary.main',
                  width: 32,
                  height: 32,
                  fontSize: '0.8rem'
                }}
              >
                {node.name.split(' ').map((n: string) => n[0]).join('')}
              </Avatar>
              <Box>
                <Typography component="div" variant="body2" sx={{ fontWeight: 700 }}>
                  {node.name} <StatusChip status={node.role} sx={{ ml: 1 }} />
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {node.designation} | {node.department} | {node.email}
                </Typography>
              </Box>
            </Box>
            {node.children && renderTree(node.children)}
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Layout>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab icon={<ListIcon fontSize="small" />} iconPosition="start" label="Members Directory" />
            <Tab icon={<TreeIcon fontSize="small" />} iconPosition="start" label="Reporting Hierarchy Tree" />
          </Tabs>

          {activeTab === 0 && userRole !== 'TRAINING_DEPT' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAdd}
            >
              {userRole === 'TOWER_HEAD' ? 'Add Reporting Manager' : 'Add Team Member'}
            </Button>
          )}
        </Box>

        {actionSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{actionSuccess}</Alert>}
        {actionError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{actionError}</Alert>}

        {/* --- TAB PANEL 1: MEMBERS DIRECTORY --- */}
        <CustomTabPanel value={activeTab} index={0}>
          <Card sx={{ p: 3 }}>
            {usersLoading ? (
              <Box sx={{ display: 'flex', py: 8, justifyContent: 'center' }}><CircularProgress /></Box>
            ) : !users || users.length === 0 ? (
              <EmptyState message="No members found in directory." />
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Table>
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Employee Info</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Employee ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Reporting Manager</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((item: any) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.email} | {item.designation}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{item.employeeId}</TableCell>
                        <TableCell>{item.department}</TableCell>
                        <TableCell>
                          <StatusChip status={item.role} variant="outlined" />
                        </TableCell>
                        <TableCell>{item.manager?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <StatusChip status={item.status} />
                        </TableCell>
                        <TableCell align="center">
                          {item.id === user?.id ? (
                            <Typography variant="caption" color="text.secondary">You</Typography>
                          ) : (
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              {/* Manager can only edit their direct subordinates, Tower Head can edit anyone */}
                              {(userRole === 'TOWER_HEAD' || item.managerId === user?.id) && (
                                <Tooltip title="Edit Member">
                                  <IconButton size="small" onClick={() => handleOpenEdit(item)}>
                                    <EditIcon fontSize="small" color="primary" />
                                  </IconButton>
                                </Tooltip>
                              )}

                              {/* Manager can only disable active direct subordinates, Tower Head can disable anyone */}
                              {item.status === 'ACTIVE' && (userRole === 'TOWER_HEAD' || item.managerId === user?.id) && (
                                <Tooltip title="Disable Member">
                                  <IconButton size="small" onClick={() => handleDisable(item.id)}>
                                    <DisableIcon fontSize="small" color="error" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </CustomTabPanel>

        {/* --- TAB PANEL 2: HIERARCHY TREE --- */}
        <CustomTabPanel value={activeTab} index={1}>
          <Card sx={{ p: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>
              Organizational Reporting Chain
            </Typography>
            {treeLoading ? (
              <Box sx={{ display: 'flex', py: 8, justifyContent: 'center' }}><CircularProgress /></Box>
            ) : !hierarchy || hierarchy.length === 0 ? (
              <EmptyState message="No reporting hierarchies found." />
            ) : (
              <Box>
                {/* Seed Tree Rendering */}
                {hierarchy.map((rootNode: any) => (
                  <Box key={rootNode.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: 'error.main', width: 36, height: 36 }}>
                        {rootNode.name.split(' ').map((n: string) => n[0]).join('')}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          {rootNode.name} <StatusChip status={rootNode.role} color="error" sx={{ ml: 1 }} />
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {rootNode.designation} | {rootNode.department} | {rootNode.email}
                        </Typography>
                      </Box>
                    </Box>
                    {rootNode.children && renderTree(rootNode.children)}
                  </Box>
                ))}
              </Box>
            )}
          </Card>
        </CustomTabPanel>
      </Box>

      {/* Add / Edit User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} slotProps={{ paper: { sx: { borderRadius: 3, width: 440 } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingUser ? `Edit ${editingUser.name}` : `Create New User`}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ py: 1 }}>
            {!editingUser && (
              <TextField
                {...register('employeeId')}
                label="Employee ID"
                fullWidth
                margin="normal"
                required
                slotProps={{ inputLabel: { shrink: true } }}
                placeholder="e.g. ST-12345"
              />
            )}

            <TextField
              {...register('name')}
              label="Full Name"
              fullWidth
              margin="normal"
              required
              slotProps={{ inputLabel: { shrink: true } }}
              placeholder="e.g. John Doe"
            />

            {!editingUser && (
              <TextField
                {...register('email')}
                label="Email Address"
                type="email"
                fullWidth
                margin="normal"
                required
                slotProps={{ inputLabel: { shrink: true } }}
                placeholder="e.g. jdoe@skilltrack.com"
              />
            )}

            <TextField
              {...register('designation')}
              label="Designation"
              fullWidth
              margin="normal"
              required
              slotProps={{ inputLabel: { shrink: true } }}
              placeholder="e.g. Software Engineer"
            />

            <TextField
              {...register('department')}
              label="Department"
              fullWidth
              margin="normal"
              required
              slotProps={{ inputLabel: { shrink: true } }}
              placeholder="e.g. Engineering"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setUserDialogOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained">
              {editingUser ? 'Update Member' : 'Create Account'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Layout>
  );
}
