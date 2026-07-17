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
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  OutlinedInput,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';

import {
  Download as ExportIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SkillMatrixPage() {
  // Filter States
  const [managerFilter, setManagerFilter] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Queries
  const { data: managers } = useQuery({
    queryKey: ['managers'],
    queryFn: () => fetch('/api/organization/users?type=managers').then(res => res.json())
  });

  const { data: allSkills } = useQuery({
    queryKey: ['skills'],
    queryFn: () => fetch('/api/skills').then(res => res.json())
  });

  const { data: matrixData, isLoading } = useQuery({
    queryKey: ['matrix', managerFilter, startDateFilter, endDateFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (managerFilter) params.append('managerId', managerFilter);
      if (startDateFilter) params.append('startDate', startDateFilter);
      if (endDateFilter) params.append('endDate', endDateFilter);
      return fetch(`/api/learning/matrix?${params.toString()}`).then(res => res.json());
    }
  });

  const handleClearFilters = () => {
    setManagerFilter('');
    setSelectedSkills([]);
    setStartDateFilter('');
    setEndDateFilter('');
  };

  const employees = matrixData?.employees || [];
  const activeSkillsInLogs = matrixData?.skills || [];

  // Filter columns (skills) to display: either all skills with logged hours, or only the selected skills
  const skillsToDisplay = activeSkillsInLogs.filter((s: any) =>
    selectedSkills.length === 0 || selectedSkills.includes(s.id)
  );

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'EXPERT': return 'secondary';
      case 'ADVANCED': return 'primary';
      case 'INTERMEDIATE': return 'success';
      default: return 'default';
    }
  };

  // --- EXPORT FUNCS ---

  // CSV Export
  const handleExportCSV = () => {
    if (employees.length === 0) return;

    let csvContent = 'Employee Name,Employee ID,Department,';
    csvContent += skillsToDisplay.map((s: any) => `"${s.name} (hrs)"`).join(',') + '\n';

    employees.forEach((emp: any) => {
      let row = `"${emp.name}","${emp.employeeId}","${emp.department}",`;
      row += skillsToDisplay.map((s: any) => {
        const cell = emp.skills[s.id];
        return cell ? cell.hoursSpent : 0;
      }).join(',');
      csvContent += row + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Skill_Matrix_Report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel Export (xlsx)
  const handleExportExcel = () => {
    if (employees.length === 0) return;

    const data: any[] = [];
    employees.forEach((emp: any) => {
      const row: any = {
        'Employee Name': emp.name,
        'Employee ID': emp.employeeId,
        'Department': emp.department,
      };
      skillsToDisplay.forEach((s: any) => {
        const cell = emp.skills[s.id];
        row[`${s.name} (hours)`] = cell ? cell.hoursSpent : 0;
      });
      data.push(row);
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Skill Matrix');
    XLSX.writeFile(workbook, 'Skill_Matrix_Report.xlsx');
  };

  // PDF Export (jsPDF + autotable)
  const handleExportPDF = () => {
    if (employees.length === 0) return;

    const doc = new jsPDF('l', 'mm', 'a4');

    doc.text('Lumora - Employee Skill Competency Matrix', 14, 15);

    const headers = ['Employee Name', 'ID', 'Department', ...skillsToDisplay.map((s: any) => s.name)];
    const body = employees.map((emp: any) => [
      emp.name,
      emp.employeeId,
      emp.department,
      ...skillsToDisplay.map((s: any) => {
        const cell = emp.skills[s.id];
        return cell ? `${cell.hoursSpent}h` : '0h';
      })
    ]);

    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 22,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save('Skill_Matrix_Report.pdf');
  };

  return (
    <Layout>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Competency Skill Matrix Grid</Typography>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExportCSV}>CSV</Button>
            <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExportExcel}>Excel</Button>
            <Button variant="contained" startIcon={<ExportIcon />} onClick={handleExportPDF}>PDF Report</Button>
          </Box>
        </Box>

        {/* Filters Card */}
        <Card sx={{ p: 3, mb: 4 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon fontSize="small" /> Matrix Filter Controls
          </Typography>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                select
                fullWidth
                label="Team / Manager"
                value={managerFilter}
                onChange={(e) => setManagerFilter(e.target.value)}
                slotProps={{ select: { displayEmpty: true } }}
              >
                <MenuItem value="">All Teams</MenuItem>
                {managers && managers.map((m: any) => (
                  <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel shrink id="skills-filter-label">Compare Skills</InputLabel>
                <Select
                  labelId="skills-filter-label"
                  multiple
                  displayEmpty
                  value={selectedSkills}
                  onChange={(e) => setSelectedSkills(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                  input={<OutlinedInput label="Compare Skills" />}
                  renderValue={(selected) => {
                    if (selected.length === 0) return 'All Skills in Logs';
                    return `${selected.length} skills selected`;
                  }}
                >
                  {allSkills && allSkills.map((s: any) => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                type="date"
                fullWidth
                label="Start Date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                type="date"
                fullWidth
                label="End Date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 2 }} sx={{ textAlign: 'right' }}>
              <Button variant="text" color="inherit" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Card>

        {/* Matrix Grid */}
        {isLoading ? (
          <Box sx={{ display: 'flex', py: 8, justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : employees.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">No learning logs match the filter criteria.</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Employee Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Employee ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                  {skillsToDisplay.map((s: any) => (
                    <TableCell key={s.id} sx={{ fontWeight: 700, minWidth: 120 }} align="center">
                      {s.name}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((emp: any) => (
                  <TableRow key={emp.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{emp.name}</TableCell>
                    <TableCell>{emp.employeeId}</TableCell>
                    <TableCell>{emp.department}</TableCell>
                    {skillsToDisplay.map((s: any) => {
                      const cell = emp.skills[s.id];
                      return (
                        <TableCell key={s.id} align="center">
                          {cell ? (
                            <Tooltip
                              title={
                                <Box sx={{ p: 0.5 }}>
                                  <Typography variant="caption" sx={{ display: 'block' }}>Hours Spent: {cell.hoursSpent} hrs</Typography>
                                  <Typography variant="caption" sx={{ display: 'block' }}>
                                    Last Active: {new Date(cell.lastLearningDate).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              }
                              arrow
                            >
                              <Box sx={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                  {cell.hoursSpent} hrs
                                </Typography>
                              </Box>
                            </Tooltip>
                          ) : (
                            <Typography variant="body2" color="text.disabled">-</Typography>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Layout>
  );
}
