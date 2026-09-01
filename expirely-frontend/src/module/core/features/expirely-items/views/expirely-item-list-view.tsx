import type { ExpirelyItem } from '../types';

import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';
import { Scrollbar } from 'src/shared/ui/scrollbar';
import { PageHeader } from 'src/shared/ui/page-header';
import { ErrorDialog } from 'src/shared/ui/error-dialog';
import { DashboardContent } from 'src/layouts/dashboard';
import { ConfirmDialog } from 'src/shared/ui/confirm-dialog';
import { SearchNotFound } from 'src/shared/ui/search-not-found';
import {
  useTable,
  TableSkeleton,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/shared/ui/table';

import { updateStatus } from '../api';
import { AdBanner } from '../components/ad-banner';
import { useItemList } from '../hooks/use-item-list';
import { QuotaPanel } from '../components/quota-panel';
import { useItemDialog } from '../hooks/use-item-dialog';
import { ItemTableRow } from '../components/item-table-row';
import { ItemFormDialog } from '../components/item-form-dialog';
import { ItemEmptyState } from '../components/item-empty-state';
import { ItemMobileCard } from '../components/item-mobile-card';
import { ItemDetailDialog } from '../components/item-detail-dialog';
import { PhotoUploadDialog } from '../components/photo-upload-dialog';
import { RecommendationDialog } from '../components/recommendation-dialog';

function daysUntil(expiryDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(`${expiryDate}T00:00:00`).getTime() - today.getTime()) / 86400000);
}

export function ExpirelyItemListView() {
  const { t } = useTranslate('expirely');
  const { t: tCommon } = useTranslate('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const dialog = useItemDialog();
  const table = useTable({ defaultRowsPerPage: 25, defaultDense: true });
  const actionHandled = useRef(false);

  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [wasteTarget, setWasteTarget] = useState<ExpirelyItem | null>(null);
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [quotaRefreshKey, setQuotaRefreshKey] = useState(0);

  const { data, loading, error, refresh } = useItemList();

  useEffect(() => {
    const action = searchParams.get('action');
    if (!action || actionHandled.current) return;
    actionHandled.current = true;
    if (action === 'add') dialog.open('new');
    if (action === 'scan') setPhotoOpen(true);
    router.replace(paths.dashboard.expirely.items);
  }, [dialog, router, searchParams]);

  const tableHead = useMemo(
    () => [
      { id: 'nama_produk', label: t('table.namaProduk') },
      { id: 'expiry', label: t('table.expiry') },
      { id: 'expiry_date', label: t('table.expiryDate') },
      { id: 'source', label: t('table.source') },
      { id: 'estimation', label: t('table.estimation') },
      { id: 'actions', label: '', align: 'right' as const },
    ],
    [t]
  );

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data;
    return data.filter((item) => item.nama_produk.toLowerCase().includes(query));
  }, [data, search]);

  const paginatedData = useMemo(() => {
    const start = table.page * table.rowsPerPage;
    return filteredData.slice(start, start + table.rowsPerPage);
  }, [filteredData, table.page, table.rowsPerPage]);

  const urgentItems = useMemo(
    () => data.filter((item) => item.status === 'active' && daysUntil(item.expiry_date) <= 7),
    [data]
  );

  const selectedItem = useMemo(
    () => (dialog.id ? (data.find((item) => item.id === dialog.id) ?? null) : null),
    [data, dialog.id]
  );

  const handleSaved = useCallback(
    (saved: ExpirelyItem) => {
      refresh();
      dialog.close();
      toast.success(t('feedback.saved', { name: saved.nama_produk }));
    },
    [dialog, refresh, t]
  );

  const handleMarkConsumed = useCallback(
    async (id: string) => {
      if (actionLoading) return;
      setActionLoading(true);
      try {
        await updateStatus(id, 'consumed');
        await refresh();
        dialog.close();
        toast.success(t('feedback.markedConsumed'));
      } catch (err) {
        setActionError(err instanceof Error ? err.message : t('errors.saveFailed'));
      } finally {
        setActionLoading(false);
      }
    },
    [actionLoading, dialog, refresh, t]
  );

  const handleConfirmWasted = useCallback(async () => {
    if (!wasteTarget || actionLoading) return;
    setActionLoading(true);
    try {
      await updateStatus(wasteTarget.id, 'wasted');
      await refresh();
      setWasteTarget(null);
      dialog.close();
      toast.success(t('feedback.markedWasted'));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('errors.saveFailed'));
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading, dialog, refresh, t, wasteTarget]);

  const showSkeletons = loading && data.length === 0;
  const pristineEmpty = !loading && !error && data.length === 0 && !search;
  const noSearchResults = !loading && data.length > 0 && filteredData.length === 0;

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          !pristineEmpty ? (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ width: { xs: 1, sm: 'auto' } }}
            >
              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="solar:camera-add-bold" />}
                onClick={() => setPhotoOpen(true)}
              >
                {t('buttons.fromPhoto')}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                disabled={urgentItems.length === 0}
                startIcon={<Iconify icon="solar:tea-cup-bold" />}
                onClick={() => setRecommendOpen(true)}
              >
                {t('buttons.recommend', { count: urgentItems.length })}
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={() => dialog.open('new')}
              >
                {t('buttons.new')}
              </Button>
            </Stack>
          ) : null
        }
      />

      <Stack spacing={2.5}>
        <QuotaPanel refreshKey={quotaRefreshKey} />

        {error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={refresh}>
                {t('actions.retry')}
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {pristineEmpty ? (
          <Card>
            <ItemEmptyState
              onCreateManual={() => dialog.open('new')}
              onCreateFromPhoto={() => setPhotoOpen(true)}
            />
          </Card>
        ) : (
          <Card>
            <Stack sx={{ p: 2 }}>
              <TextField
                fullWidth
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  table.onResetPage();
                }}
                placeholder={t('toolbar.searchPlaceholder')}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Stack>
            <Divider />

            {noSearchResults ? (
              <SearchNotFound query={search} sx={{ py: 8 }} />
            ) : (
              <>
                <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Scrollbar>
                    <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
                      <TableHeadCustom headCells={tableHead} />
                      <TableBody>
                        {showSkeletons && (
                          <TableSkeleton
                            rowCount={table.rowsPerPage}
                            cellCount={tableHead.length}
                          />
                        )}
                        {paginatedData.map((row) => (
                          <ItemTableRow
                            key={row.id}
                            row={row}
                            disabled={actionLoading}
                            onView={(id) => dialog.open('view', id)}
                            onEdit={(id) => dialog.open('edit', id)}
                            onMarkConsumed={handleMarkConsumed}
                            onMarkWasted={(id) =>
                              setWasteTarget(data.find((item) => item.id === id) ?? null)
                            }
                          />
                        ))}
                        {!loading && filteredData.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={tableHead.length} />
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Scrollbar>
                </TableContainer>

                <Box
                  sx={{
                    p: 2,
                    gap: 1.5,
                    display: { xs: 'grid', md: 'none' },
                    gridTemplateColumns: 'minmax(0, 1fr)',
                  }}
                >
                  {paginatedData.map((item) => (
                    <ItemMobileCard
                      key={item.id}
                      item={item}
                      disabled={actionLoading}
                      onView={(id) => dialog.open('view', id)}
                      onMarkConsumed={handleMarkConsumed}
                      onMarkWasted={(id) =>
                        setWasteTarget(data.find((row) => row.id === id) ?? null)
                      }
                    />
                  ))}
                </Box>

                {filteredData.length > 0 && (
                  <TablePaginationCustom
                    component="div"
                    page={table.page}
                    count={filteredData.length}
                    rowsPerPage={table.rowsPerPage}
                    rowsPerPageOptions={[10, 25, 50]}
                    onPageChange={table.onChangePage}
                    onRowsPerPageChange={table.onChangeRowsPerPage}
                    labelRowsPerPage={tCommon('pagination.rowsPerPage')}
                  />
                )}
              </>
            )}
          </Card>
        )}

        <AdBanner />
      </Stack>

      <ItemDetailDialog
        open={dialog.mode === 'view'}
        item={dialog.mode === 'view' ? selectedItem : null}
        actionLoading={actionLoading}
        onClose={dialog.close}
        onEdit={(id) => dialog.open('edit', id)}
        onMarkConsumed={handleMarkConsumed}
        onMarkWasted={(id) => setWasteTarget(data.find((item) => item.id === id) ?? null)}
      />

      <ItemFormDialog
        open={dialog.mode === 'new' || dialog.mode === 'edit'}
        mode={dialog.mode === 'edit' ? 'edit' : 'new'}
        seed={dialog.mode === 'edit' ? selectedItem : null}
        onClose={dialog.close}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!wasteTarget}
        title={t('waste.title')}
        description={wasteTarget ? t('waste.message', { name: wasteTarget.nama_produk }) : ''}
        confirmLabel={t('actions.markWasted')}
        confirmColor="error"
        loading={actionLoading}
        onClose={() => setWasteTarget(null)}
        onConfirm={handleConfirmWasted}
      />

      <RecommendationDialog
        open={recommendOpen}
        items={urgentItems}
        onClose={() => setRecommendOpen(false)}
        onGenerated={() => setQuotaRefreshKey((current) => current + 1)}
      />

      <PhotoUploadDialog
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        onItemCreated={() => {
          refresh();
          setQuotaRefreshKey((current) => current + 1);
        }}
      />

      <ErrorDialog
        open={!!actionError}
        message={actionError ?? ''}
        onClose={() => setActionError(null)}
      />
    </DashboardContent>
  );
}
