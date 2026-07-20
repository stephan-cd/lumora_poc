'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useQuery } from '@tanstack/react-query';
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
  Download as ExportIcon,
  Assessment as ReportIcon
} from '@mui/icons-material';

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const REPORT_TYPES = [
  { value: 'employee', label: 'Employee Learning Summary' },
  { value: 'team', label: 'Team Learning Hours Report' },
  { value: 'skill', label: 'Skill Adoption & Coverage' },
  { value: 'approval', label: 'Approval Decisions Log' }
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState('employee');
  const [employeeId, setEmployeeId] = useState('');
  const [skillId, setSkillId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Queries for selectors
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/organization/users').then(res => res.json())
  });

  const { data: skills } = useQuery({
    queryKey: ['skills'],
    queryFn: () => fetch('/api/skills').then(res => res.json())
  });

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    setExportLoading(true);
    setStatusMsg(`Compiling and generating ${format.toUpperCase()} report...`);
    
    try {
      // 1. Fetch data based on filters from approvals/logs API (which covers details)
      const params = new URLSearchParams();
      params.append('pending', 'false'); // Get processed approved records
      if (employeeId) params.append('employeeId', employeeId);
      if (skillId) params.append('skillId', skillId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const res = await fetch(`/api/learning/approvals?${params.toString()}`);
      const records = await res.json();

      if (!records || records.length === 0) {
        alert('No data found matching the report criteria.');
        setExportLoading(false);
        setStatusMsg('');
        return;
      }

      const reportTitle = REPORT_TYPES.find(r => r.value === reportType)?.label || 'Learning Report';

      // 2. Generate file
      if (format === 'csv') {
        let csv = 'Employee Name,Employee ID,Skill Name,Category,Date,Hours Spent,Type,Source,Approved By\n';
        records.forEach((r: any) => {
          csv += `"${r.user.name}","${r.user.employeeId}","${r.skill.name}","${r.skill.category}","${new Date(r.date).toLocaleDateString()}",${r.hoursSpent},"${r.learningType}","${r.learningSource}","${r.approver?.name || 'N/A'}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${reportType}_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'xlsx') {
        const rows = records.map((r: any) => ({
          'Employee Name': r.user.name,
          'Employee ID': r.user.employeeId,
          'Skill Name': r.skill.name,
          'Category': r.skill.category,
          'Date': new Date(r.date).toLocaleDateString(),
          'Hours Spent (hrs)': r.hoursSpent,
          'Learning Type': r.learningType,
          'Source': r.learningSource,
          'Approved By': r.approver?.name || 'N/A'
        }));
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
        XLSX.writeFile(workbook, `${reportType}_report.xlsx`);
      } else if (format === 'pdf') {
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.setFontSize(14);
        doc.text(`Lumora Report: ${reportTitle}`, 14, 15);
        doc.setFontSize(9);
        doc.text(`Generated on: ${new Date().toLocaleDateString()} | Filters: ${employeeId ? 'Selected Member' : 'All'} | ${skillId ? 'Selected Skill' : 'All'}`, 14, 20);

        const headers = ['Employee Name', 'ID', 'Skill', 'Date', 'Hours', 'Type', 'Source', 'Approved By'];
        const body = records.map((r: any) => [
          r.user.name,
          r.user.employeeId,
          r.skill.name,
          new Date(r.date).toLocaleDateString(),
          `${r.hoursSpent}h`,
          r.learningType,
          r.learningSource,
          r.approver?.name || 'N/A'
        ]);

        autoTable(doc, {
          head: [headers],
          body: body,
          startY: 25,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [37, 99, 235] }
        });

        doc.save(`${reportType}_report.pdf`);
      }
      
      setStatusMsg('Export completed successfully!');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err: any) {
      alert(`Failed to export report: ${err?.message}`);
      setStatusMsg('');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <Layout>
      <Card sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ReportIcon color="primary" fontSize="large" /> Lumora Reports Engine
        </Typography>
        <Divider sx={{ mb: 4 }} />

        {statusMsg && (
          <Alert severity={statusMsg.includes('success') ? 'success' : 'info'} sx={{ mb: 3, borderRadius: 2 }}>
            {statusMsg}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid size={12}>
            <TextField
              select
              fullWidth
              label="Report Template"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            >
              {REPORT_TYPES.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Filter by Employee (Subordinates)"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value="">All Employees</MenuItem>
              {Array.isArray(users) && users.map((u: any) => (
                <MenuItem key={u.id} value={u.id}>{u.name} (ID: {u.employeeId})</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Filter by Skill"
              value={skillId}
              onChange={(e) => setSkillId(e.target.value)}
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value="">All Skills</MenuItem>
              {Array.isArray(skills) && skills.map((s: any) => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              type="date"
              fullWidth
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              type="date"
              fullWidth
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={12} sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
              Generate & Download Report File
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={exportLoading ? <CircularProgress size={16} /> : <ExportIcon />}
                disabled={exportLoading}
                onClick={() => handleExport('csv')}
                size="large"
              >
                CSV Export
              </Button>
              <Button
                variant="outlined"
                startIcon={exportLoading ? <CircularProgress size={16} /> : <ExportIcon />}
                disabled={exportLoading}
                onClick={() => handleExport('xlsx')}
                size="large"
              >
                Excel Sheet
              </Button>
              <Button
                variant="contained"
                startIcon={exportLoading ? <CircularProgress size={16} /> : <ExportIcon />}
                disabled={exportLoading}
                onClick={() => handleExport('pdf')}
                size="large"
              >
                Print PDF Report
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Card>
    </Layout>
  );
}
