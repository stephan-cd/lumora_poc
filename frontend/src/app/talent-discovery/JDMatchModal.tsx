import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Chip,
  Paper,
  Divider
} from '@mui/material';
import { AutoAwesome as AutoAwesomeIcon } from '@mui/icons-material';

interface JDMatchModalProps {
  open: boolean;
  onClose: () => void;
  teamId?: string;
}

export default function JDMatchModal({ open, onClose, teamId }: JDMatchModalProps) {
  const [jdText, setJdText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMatch = async () => {
    if (!jdText.trim()) return;
    
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      const response = await fetch('/api/talent/match-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdText, teamId })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to match JD');
      }
      
      setResults(data.matches || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setJdText('');
    setResults(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoAwesomeIcon color="secondary" /> AI Talent Matcher
      </DialogTitle>
      
      <DialogContent dividers>
        {!results && !loading && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Paste your Job Description below. Our AI will analyze the requirements and find the best candidates in your organization based on their skills, learning hours, and code quality.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={10}
              variant="outlined"
              placeholder="e.g. We are looking for a Senior React Developer with experience in Node.js..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
            />
          </>
        )}

        {loading && (
          <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress color="secondary" />
            <Typography variant="body2" color="text.secondary">
              Analyzing Job Description and evaluating candidates...
            </Typography>
          </Box>
        )}

        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            Error: {error}
          </Typography>
        )}

        {results && !loading && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Top Matches ({results.length})
            </Typography>
            
            {results.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No suitable candidates found for this Job Description.
              </Typography>
            ) : (
              <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {results.map((match, idx) => (
                  <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {match.user?.name?.charAt(0) || '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {match.user?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {match.user?.role} • {match.user?.department}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h5" color={match.score >= 80 ? 'success.main' : 'warning.main'} sx={{ fontWeight: 800 }}>
                          {match.score}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Match Score
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 1.5 }} />
                    
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', mb: 2 }}>
                      "{match.explanation}"
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip size="small" label={`Learning: ${match.user?.learningHours || 0} hrs`} />
                      <Chip size="small" label={`Code Quality: ${match.user?.avgCodeQualityScore || 'N/A'}`} />
                      {match.user?.skills?.slice(0, 3).map((s: any, i: number) => (
                        <Chip key={i} size="small" variant="outlined" label={`${s.name} (${s.level})`} />
                      ))}
                      {match.user?.skills?.length > 3 && (
                        <Chip size="small" variant="outlined" label={`+${match.user.skills.length - 3} more`} />
                      )}
                    </Box>
                  </Paper>
                ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} color="inherit">
          {results ? 'Close' : 'Cancel'}
        </Button>
        {!results && !loading && (
          <Button onClick={handleMatch} variant="contained" color="secondary" disabled={!jdText.trim()}>
            Find Matches
          </Button>
        )}
        {results && !loading && (
          <Button onClick={() => setResults(null)} variant="outlined" color="primary">
            Try Another JD
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
