import type { QuotaInfo } from '../types';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

import { getQuota, claimRewardQuota } from '../api';

type QuotaKind = 'recognition' | 'recommendation';

type Props = {
  refreshKey?: number;
};

export function QuotaPanel({ refreshKey = 0 }: Props) {
  const { t } = useTranslate('expirely');
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [rewarding, setRewarding] = useState<QuotaKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setQuota(await getQuota());
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.quotaFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const claim = async (kind: QuotaKind) => {
    setRewarding(kind);
    setError(null);
    try {
      setQuota(await claimRewardQuota(kind));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.rewardFailed'));
    } finally {
      setRewarding(null);
    }
  };

  if (loading) return <Skeleton variant="rounded" height={112} />;

  return (
    <Card variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="subtitle1">{t('quota.title')}</Typography>
            <Typography variant="caption" color="text.secondary">
              {t('quota.description')}
            </Typography>
          </Box>
          <Iconify icon="solar:clock-circle-bold" width={28} color="primary.main" />
        </Stack>

        {error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={load}>
                {t('quota.retry')}
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {quota && (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            }}
          >
            <QuotaMeter
              label={t('quota.photo')}
              used={quota.recognition_used}
              limit={quota.recognition_limit}
              rewardLabel={t('quota.reward')}
              rewarding={rewarding === 'recognition'}
              onReward={() => claim('recognition')}
            />
            <QuotaMeter
              label={t('quota.recommendation')}
              used={quota.recommendation_used}
              limit={quota.recommendation_limit}
              rewardLabel={t('quota.reward')}
              rewarding={rewarding === 'recommendation'}
              onReward={() => claim('recommendation')}
            />
          </Box>
        )}
      </Stack>
    </Card>
  );
}

function QuotaMeter({
  label,
  used,
  limit,
  rewardLabel,
  rewarding,
  onReward,
}: {
  label: string;
  used: number;
  limit: number;
  rewardLabel: string;
  rewarding: boolean;
  onReward: () => void;
}) {
  const remaining = Math.max(limit - used, 0);
  return (
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" fontWeight={700}>
          {remaining}/{limit}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        color={remaining === 0 ? 'error' : 'primary'}
        value={limit === 0 ? 100 : Math.min((used / limit) * 100, 100)}
      />
      {remaining === 0 && (
        <Button size="small" variant="text" loading={rewarding} onClick={onReward}>
          {rewardLabel}
        </Button>
      )}
    </Stack>
  );
}
