import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';

type Props = {
  expiryDate: string;
};

function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.ceil((new Date(`${expiryDate}T00:00:00`).getTime() - today.getTime()) / 86400000);
}

export function UrgencyBadge({ expiryDate }: Props) {
  const { t } = useTranslate('expirely');
  const days = getDaysUntilExpiry(expiryDate);

  const color = days <= 3 ? 'error' : days <= 7 ? 'warning' : 'success';
  const label =
    days < 0
      ? t('status.expired')
      : days === 0
        ? t('status.today')
        : t('status.daysLeft', { count: days });

  return (
    <Label color={color} variant="soft">
      {label}
    </Label>
  );
}
