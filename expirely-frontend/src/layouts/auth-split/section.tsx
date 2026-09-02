import type { BoxProps } from '@mui/material/Box';
import type { Breakpoint } from '@mui/material/styles';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { CONFIG } from 'src/shared/config';

// ----------------------------------------------------------------------

export type AuthSplitSectionProps = BoxProps & {
  title?: string;
  method?: string;
  imgUrl?: string;
  subtitle?: string;
  layoutQuery?: Breakpoint;
  methods?: {
    path: string;
    icon: string;
    label: string;
  }[];
};

export function AuthSplitSection({
  sx,
  method,
  methods,
  layoutQuery = 'md',
  title = 'Manage the job',
  imgUrl = `${CONFIG.assetsDir}/assets/illustrations/illustration-dashboard.webp`,
  subtitle = 'More effectively with optimized workflows.',
  ...other
}: AuthSplitSectionProps) {
  return (
    <Box
      sx={[
        (theme) => ({
          ...theme.mixins.bgGradient({
            images: [
              `radial-gradient(circle at 90% 12%, ${varAlpha(theme.vars.palette.primary.lighterChannel, 0.34)}, transparent 32%)`,
              `linear-gradient(155deg, #063F35 0%, ${theme.vars.palette.primary.dark} 45%, ${theme.vars.palette.primary.main} 100%)`,
            ],
          }),
          px: 3,
          pb: 3,
          width: 1,
          maxWidth: 480,
          display: 'none',
          position: 'relative',
          pt: 'var(--layout-header-desktop-height)',
          [theme.breakpoints.up(layoutQuery)]: {
            gap: 8,
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            justifyContent: 'center',
          },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography variant="h3" sx={{ color: 'common.white', textAlign: 'center' }}>
          {title}
        </Typography>

        {subtitle && (
          <Typography
            sx={(theme) => ({
              maxWidth: 360,
              marginInline: 'auto',
              color: varAlpha(theme.vars.palette.common.whiteChannel, 0.76),
              textAlign: 'center',
              marginTop: theme.spacing(2),
            })}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      <Box
        sx={(theme) => ({
          zIndex: 1,
          width: 1,
          padding: theme.spacing(1.5),
          border: '1px solid',
          borderColor: varAlpha(theme.vars.palette.common.whiteChannel, 0.18),
          borderRadius: 3.5,
          bgcolor: varAlpha(theme.vars.palette.common.whiteChannel, 0.1),
          boxShadow: `0 24px 56px ${varAlpha(theme.vars.palette.common.blackChannel, 0.24)}`,
          backdropFilter: 'blur(12px)',
        })}
      >
        <Box
          component="img"
          alt="Dashboard illustration"
          src={imgUrl}
          sx={{
            width: 1,
            display: 'block',
            aspectRatio: '4/3',
            borderRadius: 2.5,
            objectFit: 'cover',
          }}
        />
      </Box>

      {!!methods?.length && method && (
        <Box component="ul" sx={{ gap: 2, display: 'flex' }}>
          {methods.map((option) => {
            const selected = method === option.label.toLowerCase();

            return (
              <Box
                key={option.label}
                component="li"
                sx={{
                  ...(!selected && {
                    cursor: 'not-allowed',
                    filter: 'grayscale(1)',
                  }),
                }}
              >
                <Tooltip title={option.label} placement="top">
                  <Link
                    component={RouterLink}
                    href={option.path}
                    sx={{ ...(!selected && { pointerEvents: 'none' }) }}
                  >
                    <Box
                      component="img"
                      alt={option.label}
                      src={option.icon}
                      sx={{ width: 32, height: 32 }}
                    />
                  </Link>
                </Tooltip>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
