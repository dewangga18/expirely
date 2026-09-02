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
          ...(disabled && { pointerEvents: 'none' }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box
        component="img"
        alt="Expirely"
        src={isSingle ? '/brand/expirely-icon.svg' : '/brand/expirely-lockup.svg'}
        sx={{
          width: isSingle ? 36 : 140,
          height: 36,
          display: 'block',
          objectFit: 'contain',
          flexShrink: 0,
        }}
      />
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
