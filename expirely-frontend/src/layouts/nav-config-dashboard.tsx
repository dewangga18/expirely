import type { NavSectionProps } from 'src/shared/ui/nav-section';

import { useMemo } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';
import { SvgColor } from 'src/shared/ui/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  home: icon('ic-dashboard'),
  items: icon('ic-menu-item'),
};

// ----------------------------------------------------------------------

export function useNavData(): NavSectionProps['data'] {
  const { t } = useTranslate('navigation');

  return useMemo(() => {
    const sections: NavSectionProps['data'] = [
      {
        subheader: t('expirely.root'),
        items: [
          {
            title: t('expirely.items'),
            path: paths.dashboard.expirely.items,
            icon: ICONS.items,
          },
        ],
      },
    ];

    return sections.filter((section) => section.items.length > 0);
  }, [t]);
}
