import type { UsageIdea, ExpirelyItem } from '../types';

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

import { Button as UiButton } from 'src/components/ui/button';

import { getUsageIdeas } from '../api';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  items: ExpirelyItem[];
  onClose: () => void;
  onGenerated?: () => void;
  onMarkConsumed?: (id: string) => Promise<boolean>;
};

export function RecommendationDialog({ open, items, onClose, onGenerated, onMarkConsumed }: Props) {
  const { t } = useTranslate('expirely');
  const { t: tCommon } = useTranslate('common');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(false);
  const [usageIdeas, setUsageIdeas] = useState<UsageIdea[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [consumedIds, setConsumedIds] = useState<string[]>([]);
  const [consumingIds, setConsumingIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setUsageIdeas([]);
      setError(null);
      setConsumedIds([]);
      setConsumingIds([]);
    }
  }, [open, items]);

  const handleGetUsageIdeas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUsageIdeas(
        items.map((it) => ({ id: it.id, nama_produk: it.nama_produk }))
      );
      setUsageIdeas(result);
      onGenerated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.recommendFailed'));
    } finally {
      setLoading(false);
    }
  }, [items, onGenerated, t]);

  const handleMarkConsumed = useCallback(
    async (id: string) => {
      if (!onMarkConsumed || consumedIds.includes(id) || consumingIds.includes(id)) return;
      setConsumingIds((current) => [...current, id]);
      try {
        const success = await onMarkConsumed(id);
        if (success) setConsumedIds((current) => [...current, id]);
      } finally {
        setConsumingIds((current) => current.filter((currentId) => currentId !== id));
      }
    },
    [consumedIds, consumingIds, onMarkConsumed]
  );

  return (
    <MotionDialog open={open} onClose={onClose} fullScreen={isMobile} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, pr: 2.5 }}>
        <Box
          sx={{
            display: 'grid',
            width: 36,
            height: 36,
            placeItems: 'center',
            borderRadius: 1.5,
            color: 'primary.contrastText',
            bgcolor: 'primary.main',
          }}
        >
          <Iconify icon="solar:tea-cup-bold" width={22} />
        </Box>
        <Box sx={{ flex: 1 }}>{t('recommendation.title')}</Box>
        <IconButton size="small" aria-label={tCommon('actions.close')} onClick={onClose}>
          <Iconify icon="mingcute:close-line" width={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <Box
              sx={{
                display: 'grid',
                width: 32,
                height: 32,
                flexShrink: 0,
                placeItems: 'center',
                borderRadius: '50%',
                color: 'primary.contrastText',
                bgcolor: 'primary.main',
              }}
            >
              <Iconify icon="solar:tea-cup-bold" width={18} />
            </Box>
            <Box sx={{ maxWidth: 560 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                {t('recommendation.assistantLabel')}
              </Typography>
              <Box
                sx={{
                  mt: 0.5,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.neutral',
                  px: 2,
                  py: 1.5,
                }}
              >
                <Typography variant="body2">
                  {t('recommendation.description', { count: items.length })}
                </Typography>
              </Box>
            </Box>
          </Stack>

          {!usageIdeas.length && !loading && !error && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <UiButton onClick={handleGetUsageIdeas} disabled={items.length === 0}>
                <Iconify icon="solar:tea-cup-bold" width={18} />
                {t('recommendation.getButton')}
              </UiButton>
            </Box>
          )}

          {loading && (
            <Stack direction="row" spacing={1.25} alignItems="flex-start">
              <Box
                sx={{
                  display: 'grid',
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                  placeItems: 'center',
                  borderRadius: '50%',
                  color: 'primary.contrastText',
                  bgcolor: 'primary.main',
                }}
              >
                <Iconify icon="solar:tea-cup-bold" width={18} />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.neutral',
                  px: 2,
                  py: 1.5,
                }}
              >
                <CircularProgress size={18} />
                <Typography variant="body2">{t('recommendation.analyzing')}</Typography>
              </Box>
            </Stack>
          )}

          {error && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
              <UiButton variant="outline" onClick={handleGetUsageIdeas}>
                {t('recommendation.retry')}
              </UiButton>
            </Box>
          )}

          {usageIdeas.length > 0 && (
            <Stack spacing={1.5}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {t('recommendation.resultsIntro')}
              </Typography>
              {usageIdeas.map((idea) => (
                <Stack
                  key={`${idea.title}-${idea.items.map((item) => item.id).join('-')}`}
                  direction="row"
                  spacing={1.25}
                  alignItems="flex-start"
                >
                  <Box
                    sx={{
                      display: 'grid',
                      width: 32,
                      height: 32,
                      flexShrink: 0,
                      placeItems: 'center',
                      borderRadius: '50%',
                      color: 'primary.contrastText',
                      bgcolor: 'primary.main',
                    }}
                  >
                    <Iconify icon="solar:tea-cup-bold" width={18} />
                  </Box>
                  <Card variant="outlined" sx={{ flex: 1, borderRadius: 2 }}>
                    <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                      <Stack spacing={1.5}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {idea.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            {idea.description}
                          </Typography>
                        </Box>
                        {onMarkConsumed && (
                          <Stack spacing={0.75}>
                            <Typography
                              variant="caption"
                              sx={{ color: 'text.secondary', fontWeight: 700 }}
                            >
                              {t('recommendation.itemsLabel')}
                            </Typography>
                            <Stack direction="row" flexWrap="wrap" gap={0.75}>
                              {idea.items.map((item) => {
                                const consumed = consumedIds.includes(item.id);
                                const consuming = consumingIds.includes(item.id);

                                return (
                                  <UiButton
                                    key={item.id}
                                    size="sm"
                                    variant={consumed ? 'secondary' : 'outline'}
                                    disabled={consumed || consuming}
                                    onClick={() => handleMarkConsumed(item.id)}
                                  >
                                    <Iconify icon="solar:check-circle-bold" width={16} />
                                    {consumed
                                      ? item.nama_produk
                                      : `${t('recommendation.markIngredient')}: ${item.nama_produk}`}
                                  </UiButton>
                                );
                              })}
                            </Stack>
                          </Stack>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {t('recommendation.close')}
        </Button>
      </DialogActions>
    </MotionDialog>
  );
}
