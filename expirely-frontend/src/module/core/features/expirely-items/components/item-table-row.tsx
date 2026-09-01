import type { ExpirelyItem } from '../types';

import { useState } from 'react';

import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { Iconify } from 'src/shared/ui/iconify';
import { CustomPopover } from 'src/shared/ui/custom-popover';

// ----------------------------------------------------------------------

function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
}

function getExpiryColor(days: number): 'error' | 'warning' | 'success' {
  if (days <= 0) return 'error';
  if (days <= 3) return 'error';
  if (days <= 7) return 'warning';
  return 'success';
}

function getExpiryLabel(
  days: number,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  if (days < 0) return t('expirely:status.expired');
  if (days === 0) return t('expirely:status.today');
  return t('expirely:status.daysLeft', { count: days });
}

type Props = {
  row: ExpirelyItem;
  disabled?: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onMarkConsumed: (id: string) => void;
  onMarkWasted: (id: string) => void;
};

export function ItemTableRow({
  row,
  disabled = false,
  onView,
  onEdit,
  onMarkConsumed,
  onMarkWasted,
}: Props) {
  const { t } = useTranslate('expirely');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const handleClose = () => setAnchorEl(null);

  const days = getDaysUntilExpiry(row.expiry_date);
  const color = getExpiryColor(days);

  return (
    <>
      <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => onView(row.id)}>
        <TableCell>
          <Typography variant="body2" noWrap>
            {row.nama_produk}
          </Typography>
        </TableCell>

        <TableCell>
          <Label color={color} variant="soft">
            {getExpiryLabel(days, t)}
          </Label>
        </TableCell>

        <TableCell>
          <Typography variant="body2">
            {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
              new Date(`${row.expiry_date}T00:00:00`)
            )}
          </Typography>
        </TableCell>

        <TableCell>
          <Label color={row.source === 'ai_photo' ? 'primary' : 'default'} variant="soft">
            {row.source === 'ai_photo' ? t('expirely:source.ai') : t('expirely:source.manual')}
          </Label>
        </TableCell>

        <TableCell>
          <Label color={row.is_estimated ? 'warning' : 'info'} variant="soft">
            {row.is_estimated ? t('expirely:estimation.estimated') : t('expirely:estimation.exact')}
          </Label>
        </TableCell>

        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
          <IconButton
            aria-label={t('rowActions.openMenu', { name: row.nama_produk })}
            disabled={disabled}
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={handleClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            disabled={disabled}
            onClick={() => {
              handleClose();
              onView(row.id);
            }}
          >
            <Iconify icon="solar:eye-bold" />
            {t('expirely:rowActions.viewDetail')}
          </MenuItem>

          <MenuItem
            disabled={disabled}
            onClick={() => {
              handleClose();
              onEdit(row.id);
            }}
          >
            <Iconify icon="solar:pen-bold" />
            {t('expirely:rowActions.edit')}
          </MenuItem>

          <Divider sx={{ borderStyle: 'dashed' }} />

          <MenuItem
            disabled={disabled}
            onClick={() => {
              handleClose();
              onMarkConsumed(row.id);
            }}
          >
            <Iconify icon="solar:check-circle-bold" />
            {t('expirely:rowActions.markConsumed')}
          </MenuItem>

          <MenuItem
            disabled={disabled}
            sx={{ color: 'error.main' }}
            onClick={() => {
              handleClose();
              onMarkWasted(row.id);
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {t('expirely:rowActions.markWasted')}
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}
