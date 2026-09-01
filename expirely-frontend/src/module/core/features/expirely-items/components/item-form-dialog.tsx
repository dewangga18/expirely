import type { TFunction } from 'i18next';
import type { ExpirelyItem } from '../types';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { MotionDialog } from 'src/shared/ui/animate';
import { Form, Field } from 'src/shared/ui/hook-form';
import { ErrorDialog } from 'src/shared/ui/error-dialog';

import { createItem, updateItem } from '../api';

// ----------------------------------------------------------------------

function makeSchema(t: TFunction) {
  return z.object({
    nama_produk: z
      .string()
      .trim()
      .min(2, { message: t('expirely:validation.nameMin') })
      .max(255, { message: t('expirely:validation.nameMax') }),
    expiry_date: z.string().min(1, { message: t('expirely:validation.dateRequired') }),
  });
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  mode: 'new' | 'edit';
  seed?: ExpirelyItem | null;
  onClose: () => void;
  onSaved: (item: ExpirelyItem) => void;
};

export function ItemFormDialog({ open, mode, seed, onClose, onSaved }: Props) {
  const { t } = useTranslate('expirely');
  const { t: tCommon } = useTranslate('common');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const schema = useMemo(() => makeSchema(t), [t]);

  const submitting = useBoolean();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const initialValue = seed ?? null;

  const defaultValues = useMemo<FormValues>(
    () => ({
      nama_produk: initialValue?.nama_produk ?? '',
      expiry_date: initialValue?.expiry_date ?? new Date().toISOString().split('T')[0],
    }),
    [initialValue]
  );

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const { handleSubmit } = methods;
  const isEditing = mode === 'edit';

  useEffect(() => {
    if (open) methods.reset(defaultValues);
    if (!open) setErrorMsg(null);
  }, [open, defaultValues, methods]);

  const onSave = handleSubmit(async (values) => {
    setErrorMsg(null);
    submitting.onTrue();
    try {
      let saved: ExpirelyItem;
      if (isEditing && initialValue) {
        saved = await updateItem(initialValue.id, {
          nama_produk: values.nama_produk,
          expiry_date: values.expiry_date,
        });
      } else {
        saved = await createItem({
          nama_produk: values.nama_produk,
          expiry_date: values.expiry_date,
        });
      }
      onSaved(saved);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('expirely:errors.saveFailed'));
    } finally {
      submitting.onFalse();
    }
  });

  const title = isEditing
    ? t('expirely:form.editTitle', { name: initialValue?.nama_produk ?? '' })
    : t('expirely:form.newTitle');

  return (
    <>
      <MotionDialog
        open={open}
        onClose={submitting.value ? undefined : onClose}
        fullScreen={isMobile}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, pr: 2.5 }}>
          <Box sx={{ flex: 1 }}>{title}</Box>
          <IconButton
            size="small"
            aria-label={tCommon('actions.close')}
            onClick={onClose}
            disabled={submitting.value}
          >
            <Iconify icon="mingcute:close-line" width={18} />
          </IconButton>
        </DialogTitle>
        <Form methods={methods} onSubmit={onSave} sx={{ display: 'contents' }}>
          <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2.5}>
              <Field.Text name="nama_produk" label={t('expirely:form.namaProduk')} />
              <Field.DatePicker name="expiry_date" label={t('expirely:form.expiryDate')} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Iconify icon="solar:check-circle-bold" />}
              loading={submitting.value}
            >
              {tCommon('actions.save')}
            </Button>
          </DialogActions>
        </Form>
      </MotionDialog>

      <ErrorDialog open={!!errorMsg} message={errorMsg ?? ''} onClose={() => setErrorMsg(null)} />
    </>
  );
}
