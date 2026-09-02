import 'driver.js/dist/driver.css';

import type { Driver } from 'driver.js';

import { driver } from 'driver.js';
import { useRef, useEffect, useCallback } from 'react';

import { useTranslate } from 'src/locales';

const storageKey = (companyId: string) => `expirely.onboarding.completed.${companyId}`;

export function useOnboardingTour(companyId: string | undefined) {
  const { t } = useTranslate('expirely');
  const tourRef = useRef<Driver | null>(null);

  const hasCompletedTour = useCallback(
    () => !!companyId && localStorage.getItem(storageKey(companyId)) === 'true',
    [companyId]
  );

  const startTour = useCallback(() => {
    if (!companyId || hasCompletedTour() || tourRef.current?.isActive()) return;

    const targets = [
      '#add-item-button',
      '#photo-capture-button',
      '#item-list',
      '#recommendation-button',
    ];

    if (targets.some((selector) => !document.querySelector(selector))) return;

    const completeTour = () => {
      localStorage.setItem(storageKey(companyId), 'true');
      tourRef.current?.destroy();
    };

    tourRef.current = driver({
      animate: true,
      allowClose: true,
      allowKeyboardControl: true,
      overlayColor: '#1C252E',
      overlayOpacity: 0.52,
      smoothScroll: true,
      showProgress: true,
      nextBtnText: t('onboardingTour.next'),
      prevBtnText: t('onboardingTour.previous'),
      doneBtnText: t('onboardingTour.done'),
      onDestroyStarted: (_element, _step, options) => {
        localStorage.setItem(storageKey(companyId), 'true');
        options.driver.destroy();
      },
      onDoneClick: completeTour,
      onCloseClick: completeTour,
      steps: [
        {
          element: '#add-item-button',
          popover: {
            title: t('onboardingTour.addTitle'),
            description: t('onboardingTour.addDescription'),
            side: 'bottom',
            align: 'end',
          },
        },
        {
          element: '#photo-capture-button',
          popover: {
            title: t('onboardingTour.photoTitle'),
            description: t('onboardingTour.photoDescription'),
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#item-list',
          popover: {
            title: t('onboardingTour.listTitle'),
            description: t('onboardingTour.listDescription'),
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#recommendation-button',
          popover: {
            title: t('onboardingTour.recommendTitle'),
            description: t('onboardingTour.recommendDescription'),
            side: 'bottom',
            align: 'center',
          },
        },
      ],
    });

    tourRef.current.drive();
  }, [companyId, hasCompletedTour, t]);

  useEffect(
    () => () => {
      tourRef.current?.destroy();
      tourRef.current = null;
    },
    []
  );

  return { hasCompletedTour, startTour };
}
