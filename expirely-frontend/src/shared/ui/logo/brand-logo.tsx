import type { LinkProps } from '@mui/material/Link';

import { mergeClasses } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { logoClasses } from './classes';

// ----------------------------------------------------------------------

export type BrandLogoProps = LinkProps & {
  isSingle?: boolean;
  disabled?: boolean;
};

export function BrandLogo({
  sx,
  disabled,
  className,
  href = '/',
  isSingle = false,
  ...other
}: BrandLogoProps) {
  return (
    <BrandLogoRoot
      component={RouterLink}
      href={href}
      aria-label="Expirely"
      underline="none"
      className={mergeClasses([logoClasses.root, className])}
      sx={[
        {
          display: 'inline-flex',
          alignItems: 'center',
          ...(disabled && { pointerEvents: 'none' }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box
        component="span"
        sx={{
          width: 36,
          height: 36,
          display: 'grid',
          borderRadius: '12px 12px 12px 4px',
          placeItems: 'center',
          color: 'common.white',
          bgcolor: 'primary.main',
          fontSize: 18,
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        E
      </Box>
      {!isSingle && (
        <Typography
          component="span"
          sx={{
            ml: 1.25,
            color: 'text.primary',
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: -0.5,
          }}
        >
          Expirely
        </Typography>
      )}
    </BrandLogoRoot>
  );
}

// ----------------------------------------------------------------------

const BrandLogoRoot = styled(Link)(() => ({
  flexShrink: 0,
  color: 'transparent',
  display: 'inline-flex',
  verticalAlign: 'middle',
}));
