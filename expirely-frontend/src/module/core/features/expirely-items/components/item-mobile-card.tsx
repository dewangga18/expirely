import type { ExpirelyItem } from '../types';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

import { UrgencyBadge } from './urgency-badge';

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
            <Stack sx={{ flexShrink: 0, alignSelf: 'flex-start' }}>
              <UrgencyBadge expiryDate={item.expiry_date} />
            </Stack>
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
