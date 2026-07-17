'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Forgot Password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false
      });

      if (res?.error) {
        setErrorMessage(res.error);
        setLoading(false);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    // Simulate sending reset link
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotOpen(false);
      setForgotSuccess(false);
      setForgotEmail('');
    }, 3000);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        bgcolor: (theme) => theme.palette.mode === 'light' ? '#f1f5f9' : '#090d16',
        backgroundImage: (theme) => theme.palette.mode === 'light'
          ? 'radial-gradient(at 50% 0%, rgba(37, 99, 235, 0.08) 0, transparent 50%)'
          : 'radial-gradient(at 50% 0%, rgba(59, 130, 246, 0.15) 0, transparent 50%)'
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420, borderRadius: 4, overflow: 'hidden', boxShadow: 6 }}>
        <Box sx={{ bgcolor: 'primary.main', height: 6, width: '100%' }} />
        <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box
            sx={{
              width: 46,
              height: 46,
              bgcolor: 'primary.main',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              mb: 2
            }}
          >
            <LockOutlinedIcon />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, fontFamily: 'var(--font-outfit)' }}>
            Lumora Login
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sign in to track skills and learning hours
          </Typography>

          {errorMessage && (
            <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
              {errorMessage}
            </Alert>
          )}

          {errorParam && !errorMessage && (
            <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
              Authentication failed. Please check your credentials.
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
            <TextField
              {...register('email')}
              label="Email Address"
              fullWidth
              margin="normal"
              error={!!errors.email}
              helperText={errors.email?.message}
              slotProps={{ inputLabel: { shrink: true } }}
              placeholder="e.g. employee@lumora.com"
            />
            <TextField
              {...register('password')}
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
              slotProps={{ inputLabel: { shrink: true } }}
              placeholder="••••••••"
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1rem', borderRadius: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="text"
                size="small"
                onClick={() => setForgotOpen(true)}
                sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
              >
                Forgot Password?
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Forgot Password?</DialogTitle>
        <form onSubmit={handleForgotPassword}>
          <DialogContent>
            {forgotSuccess ? (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                Mock reset link sent! Check your simulated inbox.
              </Alert>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Enter your email address and we will send a mock password reset link.
                </Typography>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                  placeholder="e.g. user@lumora.com"
                />
              </>
            )}
          </DialogContent>
          {!forgotSuccess && (
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={() => setForgotOpen(false)} color="inherit">Cancel</Button>
              <Button type="submit" variant="contained">Send Reset Link</Button>
            </DialogActions>
          )}
        </form>
      </Dialog>
    </Box>
  );
}
