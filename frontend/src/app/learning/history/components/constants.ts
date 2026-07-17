import { z } from 'zod';

export const DESC_MAX = 500;
export const ATTACH_MAX = 300;

export const logSchema = z.object({
  skillId: z.string().min(1, 'Please select a skill'),
  date: z.string().refine(val => new Date(val) <= new Date(), { message: 'Date cannot be in the future' }).min(1, 'Please select a date'),
  hoursSpent: z.number({ error: 'Enter a valid number' }).min(0.5, 'Minimum 0.5 hrs').max(16, 'Maximum 16 hrs per entry'),
  learningType: z.string().min(1, 'Please select a learning type'),
  learningSource: z.string().min(1, 'Please select a learning source'),
  description: z.string().min(5, 'At least 5 characters required').max(DESC_MAX, `Max ${DESC_MAX} characters`),
  attachmentPath: z.string().max(ATTACH_MAX, `Max ${ATTACH_MAX} characters`).optional()
});

export type LogForm = z.infer<typeof logSchema>;

export const TYPES = ['COURSE', 'CERTIFICATION', 'WORKSHOP', 'INTERNAL_TRAINING', 'YOUTUBE', 'BOOK_READING', 'RESEARCH', 'CONFERENCE', 'SELF_LEARNING', 'OTHER'];
export const SOURCES = ['MANUAL', 'INTERNAL_LMS', 'UDEMY', 'COURSERA', 'OTHER'];

export const statusColor = (s: string) =>
  s === 'APPROVED' ? 'success' : s === 'REJECTED' ? 'error' : 'warning';

export const typeChipColor: Record<string, string> = {
  COURSE: 'rgba(59,130,246,0.15)', CERTIFICATION: 'rgba(245,158,11,0.15)', WORKSHOP: 'rgba(139,92,246,0.15)',
  INTERNAL_TRAINING: 'rgba(34,197,94,0.15)', YOUTUBE: 'rgba(239,68,68,0.15)', BOOK_READING: 'rgba(14,165,233,0.15)',
  RESEARCH: 'rgba(236,72,153,0.15)', CONFERENCE: 'rgba(249,115,22,0.15)', SELF_LEARNING: 'rgba(16,185,129,0.15)', OTHER: 'rgba(148,163,184,0.15)'
};

export const typeChipText: Record<string, string> = {
  COURSE: '#60a5fa', CERTIFICATION: '#fbbf24', WORKSHOP: '#a78bfa',
  INTERNAL_TRAINING: '#4ade80', YOUTUBE: '#f87171', BOOK_READING: '#38bdf8',
  RESEARCH: '#f472b6', CONFERENCE: '#fb923c', SELF_LEARNING: '#34d399', OTHER: '#94a3b8'
};
