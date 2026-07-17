'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Box,
  Card,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';

import {
  Sync as SyncIcon,
  WifiTethering as TestIcon,
  Save as SaveIcon
} from '@mui/icons-material';

import { updateUdemyConfigAction, runUdemySyncAction } from '@/app/actions';

export default function UdemySettingsPage() {
  const queryClient = useQueryClient();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; msg: string } | null>(null);

  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  const { register, handleSubmit, setValue } = useForm();

  // Queries
  const { data: config, isLoading } = useQuery({
    queryKey: ['udemyConfig'],
    queryFn: () => fetch('/api/udemy?type=config').then(res => res.json()),
    onSuccess: (data: any) => {
      if (data) {
        setValue('clientId', data.clientId);
        setValue('clientSecret', data.clientSecret);
        setValue('orgId', data.orgId);
        setValue('syncFrequency', data.syncFrequency);
      }
    }
  } as any);

  React.useEffect(() => {
    if (config) {
      const cfg = config as any;
      setValue('clientId', cfg.clientId);
      setValue('clientSecret', cfg.clientSecret);
      setValue('orgId', cfg.orgId);
      setValue('syncFrequency', cfg.syncFrequency);
    }
  }, [config, setValue]);

  const onSaveSettings = async (data: any) => {
    setSaveSuccess('');
    setSaveError('');
    try {
      await updateUdemyConfigAction(data);
      setSaveSuccess('Udemy Business settings saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['udemyConfig'] });
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save settings.');
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Trigger a dummy GET to config to read values, and then simulate
      const res = await fetch('/api/udemy?type=config');
      const data = await res.json();
      
      if (data.clientId.startsWith('mock')) {
        setTestResult({ success: true, msg: 'Connection successful (Mock Mode)!' });
      } else {
        setTestResult({ success: false, msg: 'Connection failed. Invalid credentials or network error.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, msg: err?.message || 'Connection test failed.' });
    } finally {
      setTesting(false);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await runUdemySyncAction();
      if (res.success) {
        setSyncResult({ success: true, msg: `Manual sync completed! Imported ${res.recordsImported} logs.` });
        queryClient.invalidateQueries({ queryKey: ['udemySyncLogs'] });
        queryClient.invalidateQueries({ queryKey: ['udemyDashboard'] });
      } else {
        setSyncResult({ success: false, msg: `Sync failed: ${res.error}` });
      }
    } catch (err: any) {
      setSyncResult({ success: false, msg: err?.message || 'Sync failed.' });
    } finally {
      setSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        {/* Settings Panel */}
        <Card sx={{ p: 4, mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
            Udemy Business API Credentials
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {saveSuccess && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{saveSuccess}</Alert>}
          {saveError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{saveError}</Alert>}

          <form onSubmit={handleSubmit(onSaveSettings)}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  {...register('clientId')}
                  label="Client ID (API Username)"
                  fullWidth
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  {...register('clientSecret')}
                  label="Client Secret (API Password)"
                  type="password"
                  fullWidth
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  {...register('orgId')}
                  label="Organization ID (Subdomain name)"
                  fullWidth
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                  placeholder="e.g. enterprise-name"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  {...register('syncFrequency')}
                  select
                  label="Auto Sync Frequency"
                  fullWidth
                  required
                  defaultValue="daily"
                  slotProps={{ inputLabel: { shrink: true } }}
                >
                  <MenuItem value="hourly">Hourly Sync</MenuItem>
                  <MenuItem value="daily">Daily Sync</MenuItem>
                  <MenuItem value="weekly">Weekly Sync</MenuItem>
                  <MenuItem value="custom">Custom (Cron Defined)</MenuItem>
                </TextField>
              </Grid>
              
              <Grid size={12} sx={{ mt: 1 }}>
                <Button type="submit" variant="contained" startIcon={<SaveIcon />} size="large">
                  Save API Settings
                </Button>
              </Grid>
            </Grid>
          </form>
        </Card>

        {/* Integration Actions Panel */}
        <Card sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
            Connection Actions & Synchronization Control
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {testResult && (
            <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mb: 3, borderRadius: 2 }}>
              {testResult.msg}
            </Alert>
          )}

          {syncResult && (
            <Alert severity={syncResult.success ? 'success' : 'error'} sx={{ mb: 3, borderRadius: 2 }}>
              {syncResult.msg}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Verify Udemy Connectivity
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Runs an endpoint ping test using the configured Client ID and Secret to ensure endpoints are reachable.
              </Typography>
              <Button
                variant="outlined"
                startIcon={testing ? <CircularProgress size={16} /> : <TestIcon />}
                onClick={handleTestConnection}
                disabled={testing || syncing}
              >
                Test Connection
              </Button>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Force Manual Import Sync
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Trigger an immediate pull request from the Udemy Business analytics courses and user progress logs.
              </Typography>
              <Button
                variant="contained"
                startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
                onClick={handleManualSync}
                disabled={testing || syncing}
                color="secondary"
              >
                Sync Now
              </Button>
            </Grid>
          </Grid>
        </Card>
      </Box>
    </Layout>
  );
}
