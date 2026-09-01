import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { ExpirelyItemListView } from '../views/expirely-item-list-view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslate('expirely');

  return (
    <>
      <title>{`${t('expirely:title')} - ${CONFIG.appName}`}</title>
      <ExpirelyItemListView />
    </>
  );
}
