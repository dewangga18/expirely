import { useState } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';
import { Iconify } from 'src/shared/ui/iconify';

import { useAuthContext } from '../../hooks';
import { getErrorMessage } from '../../utils';
import { FormHead } from '../../components/form-head';

export function JwtSignInView() {
  const router = useRouter();
  const { signInWithGoogle } = useAuthContext();
  const { t } = useTranslate('auth');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setErrorMessage(null);
      await signInWithGoogle();
      router.refresh();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      {/* MOBILE ILLUSTRATION BANNER */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          flexDirection: 'column',
          alignItems: 'center',
          mb: 3.5,
        }}
      >
        <Box
          sx={(theme) => ({
            width: 1,
            maxWidth: 320,
            p: 1.25,
            border: '1px solid',
            borderColor: varAlpha(theme.vars.palette.primary.mainChannel, 0.24),
            borderRadius: 3,
            bgcolor: varAlpha(theme.vars.palette.primary.lighterChannel, 0.12),
            boxShadow: `0 16px 32px ${varAlpha(theme.vars.palette.common.blackChannel, 0.16)}`,
            backdropFilter: 'blur(12px)',
          })}
        >
          <Box
            component="img"
            alt="Dashboard illustration"
            src={`${CONFIG.assetsDir}/assets/illustrations/illustration-dashboard.webp`}
            sx={{
              width: 1,
              display: 'block',
              aspectRatio: '4/3',
              borderRadius: 2,
              objectFit: 'cover',
            }}
          />
        </Box>
      </Box>

      <FormHead
        title={t('signIn.title')}
        description={t('signIn.googleDescription')}
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Stack spacing={1.5} sx={{ width: 1 }}>
        <Button
          fullWidth
          size="large"
          variant="contained"
          color="inherit"
          loading={googleLoading}
          loadingIndicator={t('signIn.googleSubmitting')}
          onClick={handleGoogleSignIn}
          startIcon={<Iconify width={22} icon="socials:google" />}
          sx={{
            minHeight: 52,
            borderRadius: 2,
            fontWeight: 700,
            bgcolor: 'common.white',
            color: 'grey.800',
            boxShadow: (theme) => theme.customShadows.z8,
            '&:hover': {
              bgcolor: 'grey.100',
            },
          }}
        >
          {t('signIn.googleSubmit')}
        </Button>
        <Typography
          variant="caption"
          sx={{ display: 'block', textAlign: 'center', color: 'text.secondary' }}
        >
          {t('signIn.trustNote')}
        </Typography>
      </Stack>
    </>
  );
}
