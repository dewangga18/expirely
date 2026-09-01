import type { IconifyName } from 'src/shared/ui/iconify';
import type { ExpirelyItem } from 'src/module/core/features/expirely-items/types';

import { varAlpha } from 'minimal-shared/utils';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { getStats, listItems } from 'src/module/core/features/expirely-items/api';

import { useAuthContext } from '../../auth/hooks';

// ----------------------------------------------------------------------

type ColorKey = 'primary' | 'info' | 'success' | 'warning' | 'error';

type ShortcutKey = 'items' | 'addItem' | 'scan';

type StatsData = {
  total_active: number;
  total_consumed: number;
  total_wasted: number;
  expiring_soon: number;
};

const shortcutIcons: Record<ShortcutKey, { icon: IconifyName; color: ColorKey; descKey: string }> =
  {
    items: { icon: 'solar:list-bold', color: 'primary', descKey: 'shortcuts.itemsDesc' },
    addItem: { icon: 'solar:check-circle-bold', color: 'info', descKey: 'shortcuts.addItemDesc' },
    scan: { icon: 'solar:camera-add-bold', color: 'success', descKey: 'shortcuts.scanDesc' },
  };

const shortcuts: { key: ShortcutKey; href: string }[] = [
  { key: 'items', href: paths.dashboard.expirely.items },
  { key: 'addItem', href: `${paths.dashboard.expirely.items}?action=add` },
  { key: 'scan', href: `${paths.dashboard.expirely.items}?action=scan` },
];

export function HomeView() {
  const { t } = useTranslate('home');
  const theme = useTheme();
  const { user } = useAuthContext();

  const [stats, setStats] = useState<StatsData>({
    total_active: 0,
    total_consumed: 0,
    total_wasted: 0,
    expiring_soon: 0,
  });
  const [urgentItems, setUrgentItems] = useState<ExpirelyItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [nextStats, result] = await Promise.all([getStats(), listItems()]);
      setStats(nextStats);
      setUrgentItems(result.data.slice(0, 3));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.load'));
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const name = user?.full_name || user?.username || '';
  const tint = (color: ColorKey) => varAlpha(theme.vars.palette[color].mainChannel, 0.12);

  const statCards: { key: string; value: number; icon: IconifyName; color: ColorKey }[] = [
    { key: 'tracked', value: stats.total_active, icon: 'solar:inbox-bold', color: 'primary' },
    {
      key: 'expiringSoon',
      value: stats.expiring_soon,
      icon: 'solar:danger-triangle-bold',
      color: 'warning',
    },
    {
      key: 'consumed',
      value: stats.total_consumed,
      icon: 'solar:check-circle-bold',
      color: 'success',
    },
    {
      key: 'wasted',
      value: stats.total_wasted,
      icon: 'solar:trash-bin-trash-bold',
      color: 'error',
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h4">{name ? t('greeting', { name }) : t('greetingGuest')}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('intro')}
        </Typography>
      </Stack>

      {/* Quick stats */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        }}
      >
        {statCards.map((s) => (
          <Card key={s.key} sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                flexShrink: 0,
                display: 'flex',
                borderRadius: '50%',
                alignItems: 'center',
                justifyContent: 'center',
                color: `${s.color}.main`,
                bgcolor: tint(s.color),
              }}
            >
              <Iconify icon={s.icon} width={26} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5">{s.value}</Typography>
              <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
                {t(`stats.${s.key}`)}
              </Typography>
            </Box>
          </Card>
        ))}
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mt: 3 }}
          action={
            <Button color="inherit" size="small" onClick={load}>
              {t('errors.retry')}
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {urgentItems.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6">{t('useFirst.title')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('useFirst.description')}
              </Typography>
            </Box>
            <Button component={RouterLink} href={paths.dashboard.expirely.items}>
              {t('useFirst.viewAll')}
            </Button>
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            }}
          >
            {urgentItems.map((item) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const days = Math.ceil(
                (new Date(`${item.expiry_date}T00:00:00`).getTime() - today.getTime()) / 86400000
              );
              return (
                <Card key={item.id} variant="outlined" sx={{ p: 2.5 }}>
                  <Typography variant="subtitle1" noWrap>
                    {item.nama_produk}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={days <= 3 ? 'error.main' : 'warning.main'}
                    sx={{ mt: 0.5 }}
                  >
                    {days < 0
                      ? t('useFirst.expired')
                      : days === 0
                        ? t('useFirst.today')
                        : t('useFirst.days', { count: days })}
                  </Typography>
                </Card>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Shortcuts */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('shortcuts.title')}
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          }}
        >
          {shortcuts.map((s) => {
            const info = shortcutIcons[s.key];
            return (
              <Card key={s.key}>
                <CardActionArea component={RouterLink} href={s.href} sx={{ p: 3, height: '100%' }}>
                  <Stack spacing={1.5}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        display: 'flex',
                        borderRadius: 1.5,
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: `${info.color}.main`,
                        bgcolor: tint(info.color),
                      }}
                    >
                      <Iconify icon={info.icon} width={28} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1">{t(`shortcuts.${s.key}`)}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {t(info.descKey)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
