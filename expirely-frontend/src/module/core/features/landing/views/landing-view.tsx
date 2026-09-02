import type { IconifyName } from 'src/shared/ui/iconify';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { BrandLogo } from 'src/shared/ui/logo';
import { Iconify } from 'src/shared/ui/iconify';

import Prism from 'src/components/Prism';

const stepIcons: IconifyName[] = [
  'solar:camera-add-bold',
  'solar:calendar-date-bold',
  'solar:tea-cup-bold',
];

export function LandingView() {
  const { t } = useTranslate('landing');

  return (
    <Box sx={{ minHeight: 1, bgcolor: 'background.default' }}>
      <Box
        component="header"
        sx={{
          position: 'relative',
          zIndex: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            minHeight: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <BrandLogo />
          <Button
            component={RouterLink}
            href={paths.auth.jwt.signIn}
            variant="outlined"
            color="inherit"
          >
            {t('header.signIn')}
          </Button>
        </Container>
      </Box>

      <Box
        component="main"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: (theme) =>
            `radial-gradient(circle at 84% 8%, ${theme.vars.palette.primary.lighter} 0%, transparent 23%), linear-gradient(180deg, ${theme.vars.palette.background.neutral} 0%, ${theme.vars.palette.background.default} 100%)`,
        }}
      >
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            zIndex: 0,
            top: 0,
            right: 0,
            width: { md: '58%' },
            height: { md: 620 },
            display: { xs: 'none', md: 'block' },
            opacity: 0.24,
            pointerEvents: 'none',
          }}
        >
          <Prism
            animationType="3drotate"
            bloom={0.72}
            colorFrequency={0.65}
            glow={0.72}
            height={3.8}
            hueShift={2.15}
            lightMode
            noise={0.08}
            scale={3.9}
            suspendWhenOffscreen
            timeScale={0.22}
          />
        </Box>
        <Box
          sx={{
            position: 'absolute',
            top: 90,
            left: { xs: -180, md: -90 },
            width: 320,
            height: 320,
            borderRadius: '50%',
            bgcolor: 'primary.lighter',
            opacity: 0.42,
            filter: 'blur(18px)',
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 8, md: 13 } }}>
          <Box
            sx={{
              display: 'grid',
              alignItems: 'center',
              gap: { xs: 6, md: 9 },
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.05fr) minmax(360px, 0.95fr)' },
            }}
          >
            <Stack spacing={3} alignItems={{ xs: 'center', md: 'flex-start' }}>
              <Chip
                icon={<Iconify icon="solar:tea-cup-bold" width={17} />}
                label={t('hero.eyebrow')}
                color="primary"
                variant="soft"
              />
              <Typography
                variant="h1"
                sx={{
                  maxWidth: 680,
                  textAlign: { xs: 'center', md: 'left' },
                  fontSize: { xs: 42, sm: 54, md: 68 },
                  lineHeight: 1.04,
                  letterSpacing: -1.8,
                }}
              >
                {t('hero.title')}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  maxWidth: 570,
                  color: 'text.secondary',
                  textAlign: { xs: 'center', md: 'left' },
                  fontWeight: 400,
                  lineHeight: 1.55,
                }}
              >
                {t('hero.description')}
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                sx={{ width: { xs: 1, sm: 'auto' } }}
              >
                <Button
                  component={RouterLink}
                  href={paths.auth.jwt.signIn}
                  size="large"
                  variant="contained"
                  startIcon={<Iconify icon="solar:tea-cup-bold" />}
                  sx={{ minHeight: 52, px: 3 }}
                >
                  {t('hero.primaryCta')}
                </Button>
                <Button
                  component="a"
                  href="#how-it-works"
                  size="large"
                  variant="text"
                  color="inherit"
                  sx={{ minHeight: 52 }}
                >
                  {t('hero.secondaryCta')}
                </Button>
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('hero.reassurance')}
              </Typography>
            </Stack>

            <Box
              sx={{
                position: 'relative',
                mx: 'auto',
                width: 1,
                maxWidth: 480,
                p: { xs: 2, sm: 2.5 },
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 5,
                bgcolor: 'background.paper',
                boxShadow: (theme) => theme.customShadows.z24,
              }}
            >
              <Stack spacing={2.25}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box
                      sx={{
                        display: 'grid',
                        width: 40,
                        height: 40,
                        placeItems: 'center',
                        borderRadius: '14px 14px 14px 4px',
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                      }}
                    >
                      <Iconify icon="solar:tea-cup-bold" width={21} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">{t('preview.title')}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {t('preview.subtitle')}
                      </Typography>
                    </Box>
                  </Stack>
                  <Iconify icon="solar:bell-bing-bold" width={21} color="warning.main" />
                </Stack>

                <PreviewItem
                  icon="solar:danger-triangle-bold"
                  name={t('preview.itemOne')}
                  detail={t('preview.itemOneDetail')}
                  tone="error"
                />
                <PreviewItem
                  icon="solar:calendar-date-bold"
                  name={t('preview.itemTwo')}
                  detail={t('preview.itemTwoDetail')}
                  tone="warning"
                />
                <PreviewItem
                  icon="solar:check-circle-bold"
                  name={t('preview.itemThree')}
                  detail={t('preview.itemThreeDetail')}
                  tone="success"
                />

                <Box sx={{ borderRadius: 2.5, p: 2, bgcolor: 'primary.lighter' }}>
                  <Stack direction="row" spacing={1.25} alignItems="flex-start">
                    <Iconify icon="solar:tea-cup-bold" width={22} color="primary.main" />
                    <Box>
                      <Typography variant="subtitle2">{t('preview.tipTitle')}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
                        {t('preview.tipDescription')}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Container>

        <Container
          id="how-it-works"
          maxWidth="lg"
          sx={{ position: 'relative', zIndex: 1, pb: { xs: 8, md: 13 } }}
        >
          <Stack spacing={1.25} sx={{ mb: 4, maxWidth: 560 }}>
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1.2 }}
            >
              {t('steps.eyebrow')}
            </Typography>
            <Typography variant="h3">{t('steps.title')}</Typography>
            <Typography sx={{ color: 'text.secondary' }}>{t('steps.description')}</Typography>
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            }}
          >
            {[0, 1, 2].map((index) => (
              <Box
                key={stepIcons[index]}
                sx={{
                  minHeight: 210,
                  p: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    width: 48,
                    height: 48,
                    placeItems: 'center',
                    borderRadius: 2,
                    bgcolor: 'primary.lighter',
                    color: 'primary.main',
                  }}
                >
                  <Iconify icon={stepIcons[index]} width={25} />
                </Box>
                <Typography variant="h6" sx={{ mt: 3 }}>
                  {t(`steps.items.${index}.title`)}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mt: 1, color: 'text.secondary', lineHeight: 1.6 }}
                >
                  {t(`steps.items.${index}.description`)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Box component="footer" sx={{ py: 4, borderTop: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
          >
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('footer.note')}
            </Typography>
            <BrandLogo />
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

type PreviewItemProps = {
  icon: IconifyName;
  name: string;
  detail: string;
  tone: 'error' | 'warning' | 'success';
};

function PreviewItem({ icon, name, detail, tone }: PreviewItemProps) {
  return (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="center"
      sx={{ p: 1.25, borderRadius: 2.25, bgcolor: 'background.neutral' }}
    >
      <Box
        sx={{
          display: 'grid',
          width: 36,
          height: 36,
          placeItems: 'center',
          borderRadius: 1.5,
          bgcolor: `${tone}.lighter`,
          color: `${tone}.main`,
        }}
      >
        <Iconify icon={icon} width={20} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="subtitle2" noWrap>
          {name}
        </Typography>
        <Typography variant="caption" sx={{ color: `${tone}.main` }}>
          {detail}
        </Typography>
      </Box>
    </Stack>
  );
}
