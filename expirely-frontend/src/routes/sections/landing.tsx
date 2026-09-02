import type { RouteObject } from 'react-router';

import { lazy } from 'react';

const LandingPage = lazy(() => import('src/module/core/features/landing/pages'));

export const landingRoutes: RouteObject[] = [{ path: 'landing', element: <LandingPage /> }];
