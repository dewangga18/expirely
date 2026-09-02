import type { IconifyName } from 'src/shared/ui/iconify';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Rating from '@mui/material/Rating';
import Container from '@mui/material/Container';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { BrandLogo } from 'src/shared/ui/logo';
import { Iconify } from 'src/shared/ui/iconify';
import { allLangs, useTranslate } from 'src/locales';
import { useAuthContext } from 'src/module/core/features/auth/hooks';
import { LanguagePopover } from 'src/layouts/components/language-popover';

import Prism from 'src/components/Prism';

// ----------------------------------------------------------------------

type StorageLocation = 'room' | 'fridge' | 'freezer' | 'pantry';

export function LandingView() {
  const { t } = useTranslate('landing');
  const { authenticated } = useAuthContext();

  // Interactive Demo state
  const [activeTab, setActiveTab] = useState(0);
  const [storageLoc, setStorageLoc] = useState<StorageLocation>('fridge');
  const [quotaCount, setQuotaCount] = useState(2);
  const [showRewardedAdMsg, setShowRewardedAdMsg] = useState(false);

  // FAQ expanded state
  const [expandedFaq, setExpandedFaq] = useState<string | false>('panel0');

  // Smooth scroll handler with offset for sticky header
  const handleScrollTo = useCallback(
    (id: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        const yOffset = -80;
        const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    },
    []
  );

  const handleFaqChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedFaq(isExpanded ? panel : false);
  };

  const handleWatchRewardedAd = () => {
    setShowRewardedAdMsg(true);
    setTimeout(() => {
      setQuotaCount((prev) => prev + 1);
      setShowRewardedAdMsg(false);
    }, 1200);
  };

  return (
    <Box sx={{ minHeight: 1, bgcolor: 'background.default' }}>
      {/* STICKY HEADER WITH CARD CONTAINER FOR MAX CONTRAST */}
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: (theme) => `rgba(${theme.vars.palette.background.paperChannel} / 0.9)`,
          backdropFilter: 'blur(16px)',
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
          {/* LOGO WITH CRISP TYPOGRAPHY */}
          <BrandLogo />

          <Stack
            direction="row"
            spacing={2.5}
            alignItems="center"
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            <Button
              color="inherit"
              onClick={handleScrollTo('features')}
              size="small"
              sx={{ fontWeight: 600 }}
            >
              {t('header.nav.features')}
            </Button>
            <Button
              color="inherit"
              onClick={handleScrollTo('demo')}
              size="small"
              sx={{ fontWeight: 600 }}
            >
              {t('header.nav.demo')}
            </Button>
            <Button
              color="inherit"
              onClick={handleScrollTo('how-it-works')}
              size="small"
              sx={{ fontWeight: 600 }}
            >
              {t('header.nav.howItWorks')}
            </Button>
            <Button
              color="inherit"
              onClick={handleScrollTo('sponsors')}
              size="small"
              sx={{ fontWeight: 600 }}
            >
              {t('header.nav.sponsors')}
            </Button>
            <Button
              color="inherit"
              onClick={handleScrollTo('testimonials')}
              size="small"
              sx={{ fontWeight: 600 }}
            >
              {t('header.nav.testimonials')}
            </Button>
            <Button
              color="inherit"
              onClick={handleScrollTo('faq')}
              size="small"
              sx={{ fontWeight: 600 }}
            >
              {t('header.nav.faq')}
            </Button>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <LanguagePopover data={allLangs} />
            <Button
              component={RouterLink}
              href={authenticated ? paths.dashboard.root : paths.auth.jwt.signIn}
              variant="contained"
              color="primary"
              sx={{ boxShadow: (theme) => theme.customShadows.primary, px: 2.5, fontWeight: 700 }}
            >
              {authenticated ? t('header.dashboard') : t('header.signIn')}
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* HERO SECTION WITH UNIFIED SEAMLESS BACKGROUND & HIGH CONTRAST */}
      <Box
        component="main"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        {/* SEAMLESS BACKDROP PRISM */}
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            zIndex: 0,
            inset: 0,
            opacity: 0.18,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <Prism
            animationType="3drotate"
            bloom={0.8}
            colorFrequency={0.7}
            glow={0.8}
            height={4.5}
            hueShift={2.15}
            lightMode
            noise={0.06}
            scale={4.5}
            suspendWhenOffscreen
            timeScale={0.2}
          />
        </Box>

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 8, md: 12 } }}>
          <Box
            sx={{
              display: 'grid',
              alignItems: 'center',
              gap: { xs: 6, md: 8 },
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.15fr) minmax(380px, 0.85fr)' },
            }}
          >
            <Stack spacing={3.5} alignItems={{ xs: 'center', md: 'flex-start' }}>
              <Chip
                icon={<Iconify icon="solar:tea-cup-bold" width={18} />}
                label={t('hero.eyebrow')}
                color="primary"
                variant="soft"
                sx={{ px: 1.5, py: 2.4, borderRadius: 3, fontWeight: 700, fontSize: 13 }}
              />

              <Typography
                variant="h1"
                sx={{
                  maxWidth: 680,
                  textAlign: { xs: 'center', md: 'left' },
                  fontSize: { xs: 38, sm: 52, md: 62 },
                  lineHeight: 1.1,
                  letterSpacing: -1.5,
                  fontWeight: 800,
                  color: 'text.primary',
                }}
              >
                Makanan yang baik pantas dipakai,{' '}
                <Box component="span" sx={{ color: 'primary.main', display: 'inline' }}>
                  bukan terlupakan.
                </Box>
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  maxWidth: 570,
                  color: 'text.secondary',
                  textAlign: { xs: 'center', md: 'left' },
                  fontWeight: 400,
                  lineHeight: 1.65,
                }}
              >
                {t('hero.description')}
              </Typography>

              {/* DYNAMIC METRICS BADGES */}
              <Stack direction="row" spacing={2} sx={{ py: 0.5 }}>
                <Paper
                  elevation={0}
                  sx={{
                    px: 2,
                    py: 1.25,
                    borderRadius: 2.5,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: (theme) => theme.customShadows.z8,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                    ⚡ 99.8% Accuracy
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    Gemini AI Vision OCR
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    px: 2,
                    py: 1.25,
                    borderRadius: 2.5,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: (theme) => theme.customShadows.z8,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={800} color="success.main">
                    🌱 0 Food Waste
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    Zero-Waste Smart Recipes
                  </Typography>
                </Paper>
              </Stack>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ width: { xs: 1, sm: 'auto' } }}
              >
                <Button
                  component={RouterLink}
                  href={authenticated ? paths.dashboard.root : paths.auth.jwt.signIn}
                  size="large"
                  variant="contained"
                  color="primary"
                  startIcon={<Iconify icon="solar:camera-add-bold" />}
                  sx={{
                    minHeight: 54,
                    px: 4,
                    borderRadius: 2.5,
                    fontWeight: 700,
                    boxShadow: (theme) => theme.customShadows.primary,
                  }}
                >
                  {authenticated ? t('header.dashboard') : t('hero.primaryCta')}
                </Button>
                <Button
                  onClick={handleScrollTo('demo')}
                  size="large"
                  variant="outlined"
                  color="inherit"
                  startIcon={<Iconify icon="solar:play-circle-bold" />}
                  sx={{ minHeight: 54, px: 3.5, borderRadius: 2.5, fontWeight: 700 }}
                >
                  {t('hero.secondaryCta')}
                </Button>
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                ✓ {t('hero.reassurance')}
              </Typography>
            </Stack>

            {/* HERO PREVIEW CARD WITH CRISP DARK/LIGHT THEME CONTRAST */}
            <Card
              sx={{
                p: 3.5,
                borderRadius: 4,
                boxShadow: (theme) => theme.customShadows.z24,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Stack spacing={2.5}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 2.5,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        boxShadow: (theme) => theme.customShadows.primary,
                      }}
                    >
                      <Iconify icon="solar:camera-add-bold" width={24} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                        {t('preview.title')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('preview.subtitle')}
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    label="Gemini AI Active"
                    size="small"
                    color="success"
                    variant="soft"
                    icon={<Iconify icon="solar:tea-cup-bold" width={14} />}
                  />
                </Stack>

                <Stack spacing={1.5}>
                  <PreviewItem
                    icon="solar:danger-triangle-bold"
                    name={t('preview.itemOne')}
                    detail={t('preview.itemOneDetail')}
                    tone="error"
                    location="Kulkas"
                  />
                  <PreviewItem
                    icon="solar:calendar-date-bold"
                    name={t('preview.itemTwo')}
                    detail={t('preview.itemTwoDetail')}
                    tone="warning"
                    location="Pantry"
                  />
                  <PreviewItem
                    icon="solar:check-circle-bold"
                    name={t('preview.itemThree')}
                    detail={t('preview.itemThreeDetail')}
                    tone="success"
                    location="Suhu Ruang"
                  />
                </Stack>

                {/* AI TIP BOX WITH HIGH-CONTRAST BORDER & TEXT */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.25,
                    borderRadius: 2.5,
                    bgcolor: 'background.neutral',
                    border: '1px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Iconify
                      icon="solar:tea-cup-bold"
                      width={22}
                      color="primary.main"
                      sx={{ mt: 0.25 }}
                    />
                    <Box>
                      <Typography variant="subtitle2" color="primary.main" fontWeight={700}>
                        {t('preview.tipTitle')}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        sx={{ mt: 0.25, lineHeight: 1.5 }}
                      >
                        {t('preview.tipDescription')}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Stack>
            </Card>
          </Box>
        </Container>
      </Box>

      {/* SECTION: INTERACTIVE DEMO SIMULATOR */}
      <Box id="demo" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.neutral' }}>
        <Container maxWidth="lg">
          <Stack spacing={1.5} alignItems="center" textAlign="center" sx={{ mb: 6 }}>
            <Chip
              label={t('demo.eyebrow')}
              color="primary"
              variant="soft"
              icon={<Iconify icon="solar:play-circle-bold" width={14} />}
            />
            <Typography variant="h2" fontWeight={800}>
              {t('demo.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth={640}>
              {t('demo.description')}
            </Typography>
          </Stack>

          <Card
            sx={{
              p: { xs: 2.5, md: 4 },
              borderRadius: 4,
              boxShadow: (theme) => theme.customShadows.z20,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
            >
              <Tab
                icon={<Iconify icon="solar:camera-add-bold" width={20} />}
                label={t('demo.tabs.scanner')}
                iconPosition="start"
              />
              <Tab
                icon={<Iconify icon="solar:bill-list-bold" width={20} />}
                label={t('demo.tabs.tracker')}
                iconPosition="start"
              />
              <Tab
                icon={<Iconify icon="solar:tea-cup-bold" width={20} />}
                label={t('demo.tabs.recipe')}
                iconPosition="start"
              />
              <Tab
                icon={<Iconify icon="solar:wad-of-money-bold" width={20} />}
                label={t('demo.tabs.quota')}
                iconPosition="start"
              />
            </Tabs>

            {/* TAB 0: AI VISION SCANNER */}
            {activeTab === 0 && (
              <Box sx={{ py: 1 }}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {t('demo.scanner.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {t('demo.scanner.subtitle')}
                </Typography>

                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      {t('demo.scanner.storageLabel')}
                    </Typography>
                    <ToggleButtonGroup
                      value={storageLoc}
                      exclusive
                      onChange={(_, val) => val && setStorageLoc(val)}
                      color="primary"
                      size="small"
                    >
                      <ToggleButton value="fridge">
                        🧊 {t('demo.scanner.locations.fridge')}
                      </ToggleButton>
                      <ToggleButton value="room">
                        🌡️ {t('demo.scanner.locations.room')}
                      </ToggleButton>
                      <ToggleButton value="freezer">
                        ❄️ {t('demo.scanner.locations.freezer')}
                      </ToggleButton>
                      <ToggleButton value="pantry">
                        🥫 {t('demo.scanner.locations.pantry')}
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2.5,
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    }}
                  >
                    {/* Packaging OCR Item */}
                    <Paper
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        bgcolor: 'background.default',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            bgcolor: 'primary.lighter',
                            display: 'grid',
                            placeItems: 'center',
                            color: 'primary.main',
                          }}
                        >
                          <Iconify icon="solar:camera-add-bold" width={24} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {t('demo.scanner.scannedProduct')}
                          </Typography>
                          <Chip
                            label={t('demo.scanner.detectionMethod')}
                            size="small"
                            color="info"
                            variant="soft"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </Stack>
                      <Typography
                        variant="body2"
                        color="success.main"
                        fontWeight={600}
                        sx={{ mb: 1 }}
                      >
                        ✓ {t('demo.scanner.detectedDate')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('demo.scanner.spoilageRisk')}{' '}
                        <Typography
                          component="span"
                          variant="caption"
                          fontWeight={700}
                          color={storageLoc === 'fridge' ? 'success.main' : 'warning.main'}
                        >
                          {storageLoc === 'fridge'
                            ? t('demo.scanner.riskLow')
                            : t('demo.scanner.riskModerate')}
                        </Typography>
                      </Typography>
                    </Paper>

                    {/* Fresh Produce Item */}
                    <Paper
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        bgcolor: 'background.default',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            bgcolor: 'warning.lighter',
                            display: 'grid',
                            placeItems: 'center',
                            color: 'warning.main',
                          }}
                        >
                          <Iconify icon="solar:clock-circle-bold" width={24} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {t('demo.scanner.freshProduct')}
                          </Typography>
                          <Chip
                            label={t('demo.scanner.estimateMethod')}
                            size="small"
                            color="warning"
                            variant="soft"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </Stack>
                      <Typography
                        variant="body2"
                        color="warning.dark"
                        fontWeight={600}
                        sx={{ mb: 1 }}
                      >
                        ⏱ {t('demo.scanner.estimatedDays')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('demo.scanner.spoilageRisk')}{' '}
                        <Typography
                          component="span"
                          variant="caption"
                          fontWeight={700}
                          color="success.main"
                        >
                          {t('demo.scanner.riskLow')}
                        </Typography>
                      </Typography>
                    </Paper>
                  </Box>
                </Stack>
              </Box>
            )}

            {/* TAB 1: URGENCY TRACKER */}
            {activeTab === 1 && (
              <Box sx={{ py: 1 }}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {t('demo.tracker.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {t('demo.tracker.subtitle')}
                </Typography>

                <Stack spacing={1.5}>
                  <PreviewItem
                    icon="solar:danger-triangle-bold"
                    name="Yogurt Blueberry 200g"
                    detail={`${t('demo.tracker.status.urgent')} — Hari ini`}
                    tone="error"
                    location="Kulkas"
                  />
                  <PreviewItem
                    icon="solar:danger-bold"
                    name="Roti Tawar Gandum"
                    detail={`${t('demo.tracker.status.urgent')} — Besok`}
                    tone="error"
                    location="Pantry"
                  />
                  <PreviewItem
                    icon="solar:calendar-date-bold"
                    name="Keju Cheddar 250g"
                    detail={`${t('demo.tracker.status.warning')} — 5 Hari lagi`}
                    tone="warning"
                    location="Kulkas"
                  />
                  <PreviewItem
                    icon="solar:check-circle-bold"
                    name="Beras Premium 5kg"
                    detail={`${t('demo.tracker.status.safe')} — 45 Hari lagi`}
                    tone="success"
                    location="Pantry"
                  />
                </Stack>
              </Box>
            )}

            {/* TAB 2: AI RECIPE RECOMMENDATIONS */}
            {activeTab === 2 && (
              <Box sx={{ py: 1 }}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {t('demo.recipe.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {t('demo.recipe.subtitle')}
                </Typography>

                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: 'background.neutral',
                    border: '1px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Chip
                        label={t('demo.recipe.expiringIngredients')}
                        color="error"
                        variant="soft"
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </Stack>
                    <Box>
                      <Typography variant="h6" fontWeight={700} color="primary.main">
                        ✨ {t('demo.recipe.aiSuggestionTitle')}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        sx={{ mt: 1, lineHeight: 1.6 }}
                      >
                        {t('demo.recipe.aiSuggestionDesc')}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Box>
            )}

            {/* TAB 3: FREEMIUM QUOTA & ADS */}
            {activeTab === 3 && (
              <Box sx={{ py: 1 }}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {t('demo.quota.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {t('demo.quota.subtitle')}
                </Typography>

                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack spacing={2.5}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle1" fontWeight={700}>
                        {t('demo.quota.dailyQuotaLabel')}
                      </Typography>
                      <Chip
                        label={`Remaining: ${quotaCount}`}
                        color={quotaCount > 0 ? 'success' : 'error'}
                      />
                    </Stack>

                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<Iconify icon="solar:play-circle-bold" />}
                      onClick={handleWatchRewardedAd}
                      disabled={showRewardedAdMsg}
                    >
                      {showRewardedAdMsg
                        ? 'Unlocking Bonus Scan...'
                        : '+ Watch Rewarded Ad for Extra AI Scan'}
                    </Button>

                    <Typography variant="body2" color="text.secondary">
                      ℹ️ {t('demo.quota.rewardedAdInfo')}
                    </Typography>
                    <Typography variant="caption" color="success.main" fontWeight={600}>
                      ✓ {t('demo.quota.unlimitedManual')}
                    </Typography>
                  </Stack>
                </Paper>
              </Box>
            )}
          </Card>
        </Container>
      </Box>

      {/* SECTION: PRD CORE FEATURES BENTO GRID */}
      <Container id="features" maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Stack spacing={1.5} alignItems="center" textAlign="center" sx={{ mb: 8 }}>
          <Chip label={t('features.eyebrow')} color="primary" variant="soft" />
          <Typography variant="h2" fontWeight={800}>
            {t('features.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth={640}>
            {t('features.description')}
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          }}
        >
          {[
            { icon: 'solar:camera-add-bold', key: 0 },
            { icon: 'solar:clock-circle-bold', key: 1 },
            { icon: 'solar:danger-triangle-bold', key: 2 },
            { icon: 'solar:bill-list-bold', key: 3 },
            { icon: 'solar:tea-cup-bold', key: 4 },
            { icon: 'solar:wad-of-money-bold', key: 5 },
          ].map((item) => (
            <Paper
              key={item.key}
              sx={{
                p: 3.5,
                borderRadius: 3.5,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease',
                boxShadow: (theme) => theme.customShadows.z8,
                '&:hover': {
                  boxShadow: (theme) => theme.customShadows.z24,
                  transform: 'translateY(-6px)',
                  borderColor: 'primary.main',
                },
              }}
            >
              <Box
                sx={{
                  width: 54,
                  height: 54,
                  borderRadius: 2.5,
                  bgcolor: 'primary.lighter',
                  color: 'primary.main',
                  display: 'grid',
                  placeItems: 'center',
                  mb: 2.5,
                  boxShadow: (theme) => theme.customShadows.primary,
                }}
              >
                <Iconify icon={item.icon as IconifyName} width={28} />
              </Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                {t(`features.items.${item.key}.title`)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {t(`features.items.${item.key}.description`)}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>

      {/* SECTION: SPONSORS & ADS PLACEHOLDER */}
      <Box id="sponsors" sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Stack spacing={1.5} alignItems="center" textAlign="center" sx={{ mb: 8 }}>
            <Chip
              label={t('ads.eyebrow')}
              color="warning"
              variant="soft"
              icon={<Iconify icon="solar:wad-of-money-bold" width={14} />}
            />
            <Typography variant="h2" fontWeight={800}>
              {t('ads.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth={640}>
              {t('ads.description')}
            </Typography>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gap: 3.5,
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            }}
          >
            {/* Banner Ad Placeholder */}
            <Paper
              sx={{
                p: 3.5,
                borderRadius: 4,
                bgcolor: 'background.paper',
                border: '2px dashed',
                borderColor: 'warning.main',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: (theme) => theme.customShadows.z16,
              }}
            >
              <Chip
                label={t('ads.bannerAdLabel')}
                color="warning"
                size="small"
                sx={{ mb: 2, fontWeight: 700 }}
              />
              <Typography variant="h5" fontWeight={800} gutterBottom>
                🏷️ {t('ads.bannerAdTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                {t('ads.bannerAdDesc')}
              </Typography>
              <Button variant="outlined" color="warning" size="small">
                {t('ads.cta')}
              </Button>
            </Paper>

            {/* Sponsored Recommendation Placeholder */}
            <Paper
              sx={{
                p: 3.5,
                borderRadius: 4,
                bgcolor: 'background.paper',
                border: '2px dashed',
                borderColor: 'primary.main',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: (theme) => theme.customShadows.z16,
              }}
            >
              <Chip
                label={t('ads.sponsoredLabel')}
                color="primary"
                size="small"
                sx={{ mb: 2, fontWeight: 700 }}
              />
              <Typography variant="h5" fontWeight={800} gutterBottom>
                ⭐ {t('ads.sponsoredTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                {t('ads.sponsoredDesc')}
              </Typography>
              <Button variant="outlined" color="primary" size="small">
                {t('ads.cta')}
              </Button>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* SECTION: TESTIMONIALS */}
      <Box id="testimonials" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.neutral' }}>
        <Container maxWidth="lg">
          <Stack spacing={1.5} alignItems="center" textAlign="center" sx={{ mb: 8 }}>
            <Chip label={t('testimonials.eyebrow')} color="primary" variant="soft" />
            <Typography variant="h2" fontWeight={800}>
              {t('testimonials.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth={640}>
              {t('testimonials.description')}
            </Typography>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            }}
          >
            {[0, 1, 2].map((index) => (
              <Paper
                key={index}
                sx={{
                  p: 3.5,
                  borderRadius: 3.5,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  boxShadow: (theme) => theme.customShadows.z12,
                }}
              >
                <Stack spacing={2}>
                  <Rating value={5} readOnly size="small" />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: 'italic', lineHeight: 1.6 }}
                  >
                    &quot;{t(`testimonials.items.${index}.comment`)}&quot;
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 3 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700 }}>
                    {t(`testimonials.items.${index}.name`).charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {t(`testimonials.items.${index}.name`)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t(`testimonials.items.${index}.role`)}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* SECTION: IMPACT STATS */}
      <Box id="impact" sx={{ py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <Stack spacing={1.5} alignItems="center" textAlign="center" sx={{ mb: 6 }}>
            <Chip label={t('impact.eyebrow')} color="primary" variant="soft" />
            <Typography variant="h2" fontWeight={800}>
              {t('impact.title')}
            </Typography>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            }}
          >
            {[0, 1, 2, 3].map((index) => (
              <Paper
                key={index}
                sx={{
                  p: 3.5,
                  textAlign: 'center',
                  borderRadius: 3.5,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: (theme) => theme.customShadows.z8,
                }}
              >
                <Typography variant="h3" fontWeight={800} color="primary.main" gutterBottom>
                  {t(`impact.stats.${index}.value`)}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  {t(`impact.stats.${index}.label`)}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* SECTION: HOW IT WORKS */}
      <Box id="how-it-works" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.neutral' }}>
        <Container maxWidth="lg">
          <Stack spacing={1.5} alignItems="center" textAlign="center" sx={{ mb: 8 }}>
            <Chip label={t('steps.eyebrow')} color="primary" variant="soft" />
            <Typography variant="h2" fontWeight={800}>
              {t('steps.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth={640}>
              {t('steps.description')}
            </Typography>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            }}
          >
            {[0, 1, 2].map((index) => (
              <Paper
                key={index}
                sx={{
                  p: 4,
                  borderRadius: 4,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: (theme) => theme.customShadows.z12,
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2.5,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800,
                    fontSize: 20,
                    mb: 3,
                    boxShadow: (theme) => theme.customShadows.primary,
                  }}
                >
                  {index + 1}
                </Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {t(`steps.items.${index}.title`)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {t(`steps.items.${index}.description`)}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* SECTION: FAQ ACCORDION */}
      <Container id="faq" maxWidth="md" sx={{ py: { xs: 8, md: 12 } }}>
        <Stack spacing={1.5} alignItems="center" textAlign="center" sx={{ mb: 6 }}>
          <Chip label={t('faq.eyebrow')} color="primary" variant="soft" />
          <Typography variant="h2" fontWeight={800}>
            {t('faq.title')}
          </Typography>
        </Stack>

        <Stack spacing={2}>
          {[0, 1, 2, 3].map((index) => {
            const panelId = `panel${index}`;
            return (
              <Accordion
                key={index}
                expanded={expandedFaq === panelId}
                onChange={handleFaqChange(panelId)}
                sx={{
                  borderRadius: 3,
                  '&:before': { display: 'none' },
                  boxShadow: 'none',
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary
                  expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
                  sx={{ py: 1.5, px: 3 }}
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    {t(`faq.items.${index}.question`)}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {t(`faq.items.${index}.answer`)}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
      </Container>

      {/* BOTTOM CTA BANNER */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: 'background.neutral' }}>
        <Container maxWidth="lg">
          <Card
            sx={{
              p: { xs: 4, md: 7 },
              borderRadius: 5,
              textAlign: 'center',
              background: (theme) =>
                `linear-gradient(135deg, ${theme.vars.palette.primary.darker} 0%, ${theme.vars.palette.primary.main} 100%)`,
              color: 'primary.contrastText',
              boxShadow: (theme) => theme.customShadows.z24,
            }}
          >
            <Stack spacing={3} alignItems="center" maxWidth={680} mx="auto">
              <Chip
                label="Gemini AI Inventory Tracker"
                variant="soft"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'common.white', fontWeight: 700 }}
              />
              <Typography variant="h2" fontWeight={800} color="common.white">
                {t('cta.title')}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, lineHeight: 1.6 }}>
                {t('cta.subtitle')}
              </Typography>
              <Button
                component={RouterLink}
                href={paths.auth.jwt.signIn}
                size="large"
                variant="contained"
                sx={{
                  bgcolor: 'common.white',
                  color: 'primary.darker',
                  fontWeight: 800,
                  px: 4,
                  minHeight: 54,
                  borderRadius: 2.5,
                  fontSize: 16,
                  '&:hover': { bgcolor: 'grey.100' },
                }}
              >
                {t('cta.button')}
              </Button>
            </Stack>
          </Card>
        </Container>
      </Box>

      {/* FOOTER */}
      <Box
        component="footer"
        sx={{ py: 6, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
          >
            <Box>
              <BrandLogo />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('footer.note')}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              © {new Date().getFullYear()} Expirely. {t('footer.rights')}
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

type PreviewItemProps = {
  icon: IconifyName;
  name: string;
  detail: string;
  tone: 'error' | 'warning' | 'success';
  location?: string;
};

function PreviewItem({ icon, name, detail, tone, location }: PreviewItemProps) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      sx={{ p: 1.5, borderRadius: 2.25, bgcolor: 'background.neutral' }}
    >
      <Box
        sx={{
          display: 'grid',
          width: 38,
          height: 38,
          placeItems: 'center',
          borderRadius: 1.75,
          bgcolor: `${tone}.lighter`,
          color: `${tone}.main`,
          flexShrink: 0,
        }}
      >
        <Iconify icon={icon} width={20} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle2" noWrap fontWeight={600} color="text.primary">
            {name}
          </Typography>
          {location && (
            <Chip
              label={location}
              size="small"
              variant="soft"
              sx={{ height: 20, fontSize: 10, px: 0.5 }}
            />
          )}
        </Stack>
        <Typography variant="caption" sx={{ color: `${tone}.main`, fontWeight: 700 }}>
          {detail}
        </Typography>
      </Box>
    </Stack>
  );
}
