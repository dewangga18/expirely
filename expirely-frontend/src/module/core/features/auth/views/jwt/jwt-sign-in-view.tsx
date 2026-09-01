import { useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
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

      <Button
        fullWidth
        size="large"
        variant="contained"
        loading={googleLoading}
        loadingIndicator={t('signIn.googleSubmitting')}
        onClick={handleGoogleSignIn}
        startIcon={<Iconify width={22} icon="socials:google" />}
      >
        {t('signIn.googleSubmit')}
      </Button>
    </>
  );
}
