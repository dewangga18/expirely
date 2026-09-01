import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

// ----------------------------------------------------------------------

type Props = {
  onCreateManual: () => void;
  onCreateFromPhoto: () => void;
};

export function ItemEmptyState({ onCreateManual, onCreateFromPhoto }: Props) {
  const { t } = useTranslate('expirely');

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: { xs: 3, md: 5 },
        gap: 2.5,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          display: 'flex',
          borderRadius: 1.5,
          alignItems: 'center',
          justifyContent: 'center',
          color: 'primary.main',
          bgcolor: (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.1),
        }}
      >
        <Iconify icon="solar:camera-add-bold" width={32} />
      </Box>

      <Typography variant="h4">{t('expirely:emptyState.title')}</Typography>
      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 460 }}
      >
        {t('expirely:emptyState.description')}
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button
          size="large"
          variant="contained"
          startIcon={<Iconify icon="solar:camera-add-bold" />}
          onClick={onCreateFromPhoto}
        >
          {t('expirely:emptyState.photoUpload')}
        </Button>
        <Button
          size="large"
          color="inherit"
          variant="outlined"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={onCreateManual}
        >
          {t('expirely:emptyState.manualAdd')}
        </Button>
      </Stack>
    </Box>
  );
}
