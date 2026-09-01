import type { ExpirelyItem, Recommendation } from '../types';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { MotionDialog } from 'src/shared/ui/animate';

import { getRecommendations } from '../api';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  items: ExpirelyItem[];
  onClose: () => void;
  onGenerated?: () => void;
};

export function RecommendationDialog({ open, items, onClose, onGenerated }: Props) {
  const { t } = useTranslate('expirely');
  const { t: tCommon } = useTranslate('common');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setRecommendations([]);
      setError(null);
    }
  }, [open, items]);

  const handleGetRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getRecommendations(
        items.map((it) => ({ id: it.id, nama_produk: it.nama_produk }))
      );
      setRecommendations(result);
      onGenerated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.recommendFailed'));
    } finally {
      setLoading(false);
    }
  }, [items, onGenerated, t]);

  return (
    <MotionDialog open={open} onClose={onClose} fullScreen={isMobile} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, pr: 2.5 }}>
        <Iconify icon="solar:info-circle-bold" width={24} color="warning.main" />
        <Box sx={{ flex: 1 }}>{t('recommendation.title')}</Box>
        <IconButton size="small" aria-label={tCommon('actions.close')} onClick={onClose}>
          <Iconify icon="mingcute:close-line" width={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {t('recommendation.description', { count: items.length })}
        </Typography>

        {!recommendations.length && !loading && !error && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Iconify icon="solar:tea-cup-bold" />}
              onClick={handleGetRecommendations}
              disabled={items.length === 0}
            >
              {t('recommendation.getButton')}
            </Button>
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
            <Button variant="outlined" onClick={handleGetRecommendations}>
              {t('recommendation.retry')}
            </Button>
          </Box>
        )}

        {recommendations.length > 0 && (
          <Stack spacing={2}>
            {recommendations.map((rec) => (
              <Card key={rec.item_id} variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Iconify
                      icon="solar:tea-cup-bold"
                      width={24}
                      color="primary.main"
                      sx={{ mt: 0.5 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {rec.nama_produk}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {rec.rekomendasi}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {t('recommendation.close')}
        </Button>
      </DialogActions>
    </MotionDialog>
  );
}
