import type { ExpirelyItem, StorageLocation } from '../types';

import { useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';
import { MotionDialog } from 'src/shared/ui/animate';

import { createBatchFromPhoto } from '../api';

// ----------------------------------------------------------------------

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const STORAGE_LOCATIONS: StorageLocation[] = [
  'room_temperature',
  'refrigerator',
  'freezer',
  'pantry',
  'unknown',
];

type Props = {
  open: boolean;
  onClose: () => void;
  onItemCreated?: () => void;
};

export function PhotoUploadDialog({ open, onClose, onItemCreated }: Props) {
  const { t } = useTranslate('expirely');
  const { t: tCommon } = useTranslate('common');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [storageLocation, setStorageLocation] = useState<StorageLocation>('unknown');
  const [recognizedItems, setRecognizedItems] = useState<ExpirelyItem[]>([]);

  const reset = useCallback(() => {
    setPreview(null);
    setSelectedFile(null);
    setError(null);
    setProgress(0);
    setUploading(false);
    setStorageLocation('unknown');
    setRecognizedItems([]);
  }, []);

  const handleClose = useCallback(() => {
    if (!uploading) {
      reset();
      onClose();
    }
  }, [uploading, reset, onClose]);

  const processFile = useCallback(
    (file: File) => {
      setError(null);

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(t('photoUpload.errors.invalidType'));
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(t('photoUpload.errors.tooLarge'));
        return;
      }

      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [t]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = '';
    },
    [processFile]
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !preview) return;

    setUploading(true);
    setError(null);
    setProgress(10);

    try {
      // Extract base64 data (remove data:image/xxx;base64, prefix)
      const base64Full = preview;
      const commaIndex = base64Full.indexOf(',');
      const base64Data = commaIndex >= 0 ? base64Full.substring(commaIndex + 1) : base64Full;
      const mimeType = selectedFile.type || 'image/jpeg';

      setProgress(30);

      setProgress(70);
      const result = await createBatchFromPhoto({
        photo_base64: base64Data,
        mime_type: mimeType,
        storage_location: storageLocation,
      });
      setProgress(100);

      toast.success(t('photoUpload.successBatch', { count: result.total }));

      setRecognizedItems(result.items);
      setSelectedFile(null);
      setPreview(null);
      onItemCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('photoUpload.errors.recognitionFailed'));
    } finally {
      setUploading(false);
    }
  }, [selectedFile, preview, storageLocation, t, onItemCreated]);

  return (
    <MotionDialog open={open} onClose={handleClose} fullScreen={isMobile} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, pr: 2.5 }}>
        <Iconify icon="solar:camera-add-bold" width={24} sx={{ color: 'primary.main' }} />
        <Box sx={{ flex: 1 }}>{t('photoUpload.title')}</Box>
        <IconButton
          size="small"
          aria-label={tCommon('actions.close')}
          disabled={uploading}
          onClick={handleClose}
        >
          <Iconify icon="mingcute:close-line" width={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={3}>
          {recognizedItems.length === 0 && (
            <TextField
              select
              fullWidth
              label={t('photoUpload.storage.label')}
              value={storageLocation}
              onChange={(event) => setStorageLocation(event.target.value as StorageLocation)}
              helperText={t('photoUpload.storage.helper')}
            >
              {STORAGE_LOCATIONS.map((location) => (
                <MenuItem key={location} value={location}>
                  {t(`photoUpload.storage.options.${location}`)}
                </MenuItem>
              ))}
            </TextField>
          )}
          {/* Upload area */}
          {!preview && (
            <Card
              variant="outlined"
              sx={{
                border: '2px dashed',
                borderColor: 'grey.400',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s, bgcolor 0.2s',
                outline: 'none',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                },
                '&:focus-visible': {
                  borderColor: 'primary.main',
                  boxShadow: (themeValue) => `0 0 0 3px ${themeValue.vars.palette.primary.main}`,
                },
              }}
              role="button"
              tabIndex={0}
              aria-label={t('photoUpload.chooseFile')}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <Iconify
                icon="solar:gallery-add-bold"
                width={48}
                sx={{ color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1 }}>
                {t('photoUpload.dropzone')}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {t('photoUpload.formats')}
              </Typography>
            </Card>
          )}

          {/* Camera / Gallery buttons */}
          {!preview && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Iconify icon="solar:camera-add-bold" />}
                onClick={() => cameraInputRef.current?.click()}
              >
                {t('photoUpload.takePhoto')}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Iconify icon="solar:gallery-add-bold" />}
                onClick={() => fileInputRef.current?.click()}
              >
                {t('photoUpload.chooseFile')}
              </Button>
            </Stack>
          )}

          {/* Preview */}
          {preview && (
            <Card variant="outlined" sx={{ position: 'relative', overflow: 'hidden', p: 1 }}>
              <Box
                component="img"
                src={preview}
                alt="Preview"
                sx={{
                  width: '100%',
                  maxHeight: 300,
                  objectFit: 'contain',
                  borderRadius: 2,
                  bgcolor: 'grey.100',
                }}
              />
              {!uploading && (
                <Button
                  size="small"
                  color="error"
                  aria-label={t('photoUpload.removePreview')}
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                  onClick={reset}
                >
                  <Iconify icon="mingcute:close-line" width={18} />
                </Button>
              )}
            </Card>
          )}

          {/* Progress */}
          {uploading && (
            <Stack spacing={1}>
              <LinearProgress variant="determinate" value={progress} />
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  {t('photoUpload.analyzing')}
                </Typography>
              </Stack>
            </Stack>
          )}

          {/* Error */}
          {error && (
            <Alert
              severity="error"
              action={
                preview && selectedFile ? (
                  <Button color="inherit" size="small" onClick={handleUpload}>
                    {t('actions.retry')}
                  </Button>
                ) : undefined
              }
            >
              {error}
            </Alert>
          )}

          {recognizedItems.length > 0 && (
            <Stack spacing={1.5}>
              <Alert severity="success">
                {t('photoUpload.batchSummary', { count: recognizedItems.length })}
              </Alert>
              {recognizedItems.map((item) => {
                const assessment = item.spoilage_assessment;

                return (
                  <Card key={item.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="subtitle2">{item.nama_produk}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.is_estimated
                        ? t('photoUpload.estimatedExpiry', { date: item.expiry_date })
                        : t('photoUpload.labelExpiry', { date: item.expiry_date })}
                    </Typography>
                    {assessment && (
                      <Alert
                        sx={{ mt: 1.25 }}
                        severity={
                          assessment.risk_level === 'high'
                            ? 'error'
                            : assessment.risk_level === 'moderate'
                              ? 'warning'
                              : 'success'
                        }
                      >
                        <Typography variant="body2">
                          {t(`spoilage.condition.${assessment.visual_condition}`)}{' '}
                          {assessment.recommendation}
                        </Typography>
                      </Alert>
                    )}
                  </Card>
                );
              })}
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        {preview && !uploading && recognizedItems.length === 0 && (
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:gallery-add-bold" />}
            onClick={handleUpload}
            loading={uploading}
          >
            {t('photoUpload.recognize')}
          </Button>
        )}
        {recognizedItems.length > 0 && (
          <Button variant="contained" onClick={handleClose}>
            {tCommon('actions.close')}
          </Button>
        )}
      </DialogActions>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        hidden
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleFileChange}
      />
    </MotionDialog>
  );
}
