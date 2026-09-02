import type { LinkProps } from '@mui/material/Link';

import { mergeClasses } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { styled } from '@mui/material/styles';

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
          gap: 1.25,
          ...(disabled && { pointerEvents: 'none' }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box
        component="img"
        alt="Expirely Icon"
        src="/brand/expirely-icon.svg"
        sx={{
          width: 36,
          height: 36,
          display: 'block',
          objectFit: 'contain',
          flexShrink: 0,
        }}
      />
      {!isSingle && (
        <Box
          component="span"
          sx={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: -0.6,
            color: 'text.primary',
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          Expirely
        </Box>
      )}
    </BrandLogoRoot>
  );
}

// ----------------------------------------------------------------------

const BrandLogoRoot = styled(Link)(() => ({
  flexShrink: 0,
  display: 'inline-flex',
  verticalAlign: 'middle',
}));
