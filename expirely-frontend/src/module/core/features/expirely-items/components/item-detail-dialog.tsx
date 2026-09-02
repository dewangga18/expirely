import type { ExpirelyItem } from '../types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { Iconify } from 'src/shared/ui/iconify';
import { MotionDialog } from 'src/shared/ui/animate';

// ----------------------------------------------------------------------

function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
}

type Props = {
  open: boolean;
  item: ExpirelyItem | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onMarkConsumed: (id: string) => void;
  onMarkWasted: (id: string) => void;
  actionLoading?: boolean;
};

export function ItemDetailDialog({
  open,
  item,
  onClose,
  onEdit,
  onMarkConsumed,
  onMarkWasted,
  actionLoading = false,
}: Props) {
  const { t } = useTranslate('expirely');
  const { t: tCommon } = useTranslate('common');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const title = item?.nama_produk ?? t('expirely:detail.title');

  return (
    <MotionDialog open={open} onClose={onClose} fullScreen={isMobile} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, pr: 2.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" noWrap>
            {title}
          </Typography>
        </Box>
        {item && (
          <Label variant="soft" color={item.status === 'active' ? 'success' : 'default'}>
            {t(`expirely:status.${item.status}`)}
          </Label>
        )}
        <IconButton size="small" aria-label={tCommon('actions.close')} onClick={onClose}>
          <Iconify icon="mingcute:close-line" width={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        {item && (
          <Box
            sx={{
              display: 'grid',
              gap: 2.5,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            }}
          >
            <DetailItem label={t('expirely:form.namaProduk')} value={item.nama_produk} />
            <DetailItem
              label={t('expirely:form.expiryDate')}
              value={new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(
                new Date(`${item.expiry_date}T00:00:00`)
              )}
            />
            <DetailItem
              label={t('expirely:detail.daysLeft')}
              value={String(getDaysUntilExpiry(item.expiry_date))}
            />
            <DetailItem
              label={t('expirely:detail.source')}
              value={
                item.source === 'ai_photo' ? t('expirely:source.ai') : t('expirely:source.manual')
              }
            />
            <DetailItem
              label={t('expirely:detail.estimated')}
              value={
                item.is_estimated
                  ? t('expirely:estimation.estimated')
                  : t('expirely:estimation.exact')
              }
            />
            {item.kategori && (
              <DetailItem
                label={t('expirely:detail.kategori')}
                value={t(`expirely:categories.${item.kategori}`)}
              />
            )}
            {item.estimate_basis && (
              <Box
                sx={{
                  gridColumn: { md: '1 / -1' },
                  p: { xs: 2, md: 2.5 },
                  border: '1px solid',
                  borderColor: 'warning.main',
                  borderRadius: 2.5,
                  bgcolor: 'background.neutral',
                }}
              >
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                  <Iconify
                    icon="solar:info-circle-bold"
                    width={22}
                    color="warning.main"
                    sx={{ mt: 0.25, flexShrink: 0 }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" color="warning.main" fontWeight={700}>
                      {t('estimateBasis.title', { count: item.estimate_basis.estimate_days })}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{ mt: 0.5, lineHeight: 1.5 }}
                    >
                      {t(`estimateBasis.tips.${item.estimate_basis.category}.storage`)}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{ mt: 0.75, lineHeight: 1.5 }}
                    >
                      {t(`estimateBasis.tips.${item.estimate_basis.category}.useBy`)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 1.25, lineHeight: 1.5 }}
                    >
                      {t('estimateBasis.disclaimer')}
                    </Typography>
                    <Box
                      component="a"
                      href={item.estimate_basis.source_url}
                      target="_blank"
                      rel="noreferrer"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mt: 1.25,
                        color: 'primary.main',
                        fontSize: 13,
                        fontWeight: 700,
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      {t('estimateBasis.source')}
                      <Iconify icon="eva:external-link-fill" width={15} />
                    </Box>
                  </Box>
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          gap: 1,
          p: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          '& > :not(style) ~ :not(style)': { ml: { xs: 0, sm: 1 } },
        }}
      >
        {item && (
          <>
            <Button
              variant="outlined"
              color="warning"
              fullWidth={isMobile}
              disabled={actionLoading}
              startIcon={<Iconify icon="solar:check-circle-bold" />}
              onClick={() => onMarkConsumed(item.id)}
            >
              {t('expirely:actions.markConsumed')}
            </Button>
            <Button
              variant="outlined"
              color="error"
              fullWidth={isMobile}
              disabled={actionLoading}
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={() => onMarkWasted(item.id)}
            >
              {t('expirely:actions.markWasted')}
            </Button>
            <Button
              variant="outlined"
              fullWidth={isMobile}
              disabled={actionLoading}
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={() => onEdit(item.id)}
            >
              {tCommon('actions.edit')}
            </Button>
          </>
        )}
      </DialogActions>
    </MotionDialog>
  );
}

// ----------------------------------------------------------------------

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
        {value || '—'}
      </Typography>
    </Stack>
  );
}
