import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { CONFIG } from 'src/shared/config';
import { DashboardLayout } from 'src/layouts/dashboard';
import { LoadingScreen } from 'src/shared/ui/loading-screen';
import { AuthGuard } from 'src/module/core/features/auth/guard';

import { usePathname } from '../hooks';

// ----------------------------------------------------------------------

const HomePage = lazy(() => import('src/module/core/features/home/pages'));
const ExpirelyItemsPage = lazy(() => import('src/module/core/features/expirely-items/pages/list'));

// ----------------------------------------------------------------------

function SuspenseOutlet() {
  const pathname = usePathname();
  return (
    <Suspense key={pathname} fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}

const dashboardLayout = () => (
  <DashboardLayout>
    <SuspenseOutlet />
  </DashboardLayout>
);

export const dashboardRoutes: RouteObject[] = [
  {
    path: '/',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      { element: <HomePage />, index: true },
      { path: 'expirely/items', element: <ExpirelyItemsPage /> },
    ],
  },
];
