import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

export function AdBanner() {
  const { t } = useTranslate('expirely');

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      justifyContent="center"
      sx={{
        py: 1,
        px: 2,
        borderRadius: 1.5,
        color: 'text.secondary',
        border: '1px dashed',
        borderColor: 'divider',
        bgcolor: 'background.neutral',
      }}
    >
      <Iconify icon="solar:tag-horizontal-bold-duotone" width={16} />
      <Typography variant="caption">{t('ads.banner')}</Typography>
    </Stack>
  );
}
