import { useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
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

import { createFromPhoto } from '../api';

// ----------------------------------------------------------------------

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

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

  const reset = useCallback(() => {
    setPreview(null);
    setSelectedFile(null);
    setError(null);
    setProgress(0);
    setUploading(false);
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
      const item = await createFromPhoto({ photo_base64: base64Data, mime_type: mimeType });
      setProgress(100);

      toast.success(
        t('photoUpload.success', {
          name: item.nama_produk,
          days: Math.ceil((new Date(item.expiry_date).getTime() - Date.now()) / 86400000),
        })
      );

      reset();
      onClose();
      onItemCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('photoUpload.errors.recognitionFailed'));
    } finally {
      setUploading(false);
    }
  }, [selectedFile, preview, t, reset, onClose, onItemCreated]);

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
          {/* Upload area */}
          {!preview && (
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'grey.400',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s, bgcolor 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                },
              }}
              role="button"
              tabIndex={0}
              aria-label={t('photoUpload.chooseFile')}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') fileInputRef.current?.click();
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
            </Box>
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
            <Box sx={{ position: 'relative' }}>
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
            </Box>
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
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                bgcolor: 'error.lighter',
                color: 'error.dark',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
              }}
            >
              <Iconify icon="solar:danger-triangle-bold" width={20} sx={{ mt: 0.25 }} />
              <Typography variant="body2">{error}</Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        {preview && !uploading && (
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:gallery-add-bold" />}
            onClick={handleUpload}
            loading={uploading}
          >
            {t('photoUpload.recognize')}
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
