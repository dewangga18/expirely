import type { IconButtonProps } from '@mui/material/IconButton';

import { varAlpha } from 'minimal-shared/utils';

import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/shared/ui/iconify';

// ----------------------------------------------------------------------

export type NavToggleButtonProps = IconButtonProps & {
  isNavMini: boolean;
};

export function NavToggleButton({ isNavMini, sx, ...other }: NavToggleButtonProps) {
  return (
    <IconButton
      size="small"
      sx={[
        (theme) => ({
          p: 0.5,
          position: 'absolute',
          color: 'action.active',
          bgcolor: 'background.default',
          transform: 'translate(-50%, 50%)',
          zIndex: 'var(--layout-nav-zIndex)',
          // Anchored to the account footer instead of the header: the offset is
          // the footer's bottom padding (16px) + half the profile row height
          // (52px expanded / 40px mini), so the button sits level with the avatar.
          bottom: isNavMini ? 36 : 42,
          left: isNavMini ? 'var(--layout-nav-mini-width)' : 'var(--layout-nav-vertical-width)',
          border: `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
          transition: theme.transitions.create(['left', 'bottom'], {
            easing: 'var(--layout-transition-easing)',
            duration: 'var(--layout-transition-duration)',
          }),
          '&:hover': {
            color: 'text.primary',
            bgcolor: 'background.neutral',
          },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Iconify
        width={16}
        icon={isNavMini ? 'eva:arrow-ios-forward-fill' : 'eva:arrow-ios-back-fill'}
        sx={(theme) => ({
          ...(theme.direction === 'rtl' && { transform: 'scaleX(-1)' }),
        })}
      />
    </IconButton>
  );
}
