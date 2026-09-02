const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

export const paths = {
  landing: '/',
  faqs: '/faqs',
  auth: {
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
    },
  },
  dashboard: {
    root: ROOTS.DASHBOARD,
    settings: {
      root: `${ROOTS.DASHBOARD}/settings`,
      branches: `${ROOTS.DASHBOARD}/settings/branches`,
      roles: `${ROOTS.DASHBOARD}/settings/roles`,
      users: `${ROOTS.DASHBOARD}/settings/users`,
      translationOverride: `${ROOTS.DASHBOARD}/settings/translation-overrides`,
    },
    expirely: {
      items: '/expirely/items',
    },
    dashboards: {
      finance: `${ROOTS.DASHBOARD}/finance`,
      monitoring: `${ROOTS.DASHBOARD}/monitoring`,
      sales: `${ROOTS.DASHBOARD}/sales`,
    },
  },
};
