import type { ButtonBaseProps } from '@mui/material/ButtonBase';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import { useAuthContext } from 'src/module/core/features/auth/hooks';

type WorkspacesPopoverProps = ButtonBaseProps;

export function WorkspacesPopover({ sx, ...other }: WorkspacesPopoverProps) {
  const { company } = useAuthContext();
  const name = company?.name ?? 'Expirely';
  const initial = name.charAt(0).toUpperCase();

  return (
    <ButtonBase
      disableRipple
      sx={[{ py: 0.5, gap: 1, width: '100%' }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>{initial}</Avatar>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap>
          {name}
        </Typography>
      </Box>
    </ButtonBase>
  );
}
