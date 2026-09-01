const ROOTS = {
  AUTH: '/auth',
};

export const paths = {
  faqs: '/faqs',
  auth: {
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
    },
  },
  dashboard: {
    root: '/',
    settings: {
      root: '/settings',
      branches: '/settings/branches',
      roles: '/settings/roles',
      users: '/settings/users',
      translationOverride: '/settings/translation-overrides',
    },
    expirely: {
      items: '/expirely/items',
    },
    dashboards: {
      finance: '/finance',
      monitoring: '/monitoring',
      sales: '/sales',
    },
  },
};
