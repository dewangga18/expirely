import type { ExpirelyItem } from '../types';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { Iconify } from 'src/shared/ui/iconify';

function daysUntil(expiryDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(`${expiryDate}T00:00:00`);
  return Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
}

type Props = {
  item: ExpirelyItem;
  disabled?: boolean;
  onView: (id: string) => void;
  onMarkConsumed: (id: string) => void;
  onMarkWasted: (id: string) => void;
};

export function ItemMobileCard({
  item,
  disabled = false,
  onView,
  onMarkConsumed,
  onMarkWasted,
}: Props) {
  const { t } = useTranslate('expirely');
  const days = daysUntil(item.expiry_date);
  const urgency = days <= 3 ? 'error' : days <= 7 ? 'warning' : 'success';
  const urgencyLabel =
    days < 0
      ? t('status.expired')
      : days === 0
        ? t('status.today')
        : t('status.daysLeft', { count: days });

  return (
    <Card variant="outlined">
      <CardActionArea onClick={() => onView(item.id)}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Stack spacing={0.75} sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" noWrap>
                {item.nama_produk}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
                  new Date(`${item.expiry_date}T00:00:00`)
                )}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.is_estimated ? t('estimation.estimated') : t('estimation.exact')}
              </Typography>
            </Stack>
            <Label color={urgency} variant="soft" sx={{ flexShrink: 0, alignSelf: 'flex-start' }}>
              {urgencyLabel}
            </Label>
          </Stack>
        </CardContent>
      </CardActionArea>

      <CardActions sx={{ px: 2, pt: 0, pb: 1.5 }}>
        <Button
          size="small"
          color="success"
          disabled={disabled}
          startIcon={<Iconify icon="solar:check-circle-bold" />}
          onClick={() => onMarkConsumed(item.id)}
        >
          {t('actions.markConsumedShort')}
        </Button>
        <Button
          size="small"
          color="error"
          disabled={disabled}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
          onClick={() => onMarkWasted(item.id)}
        >
          {t('actions.markWastedShort')}
        </Button>
      </CardActions>
    </Card>
  );
}
