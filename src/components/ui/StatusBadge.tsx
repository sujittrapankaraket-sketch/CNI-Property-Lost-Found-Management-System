import type { PropertyStatus } from '../../types';
import clsx from 'clsx';

const CONFIG: Record<string, { label: string; cls: string }> = {
  stored: { label: 'จัดเก็บ', cls: 'bg-blue-50 text-blue-700' },
  matched: { label: 'จับคู่แล้ว', cls: 'bg-amber-50 text-amber-700' },
  returned: { label: 'ส่งคืนแล้ว', cls: 'bg-green-50 text-green-700' },
  expired: { label: 'หมดอายุ', cls: 'bg-red-50 text-red-700' },
  pending_return: { label: 'รอส่งคืน', cls: 'bg-purple-50 text-purple-700' },
  rejected_return: { label: 'ปฏิเสธรับคืน', cls: 'bg-rose-50 text-rose-700' },
  disposal_requested: { label: 'รอทิ้ง/ทำลาย', cls: 'bg-orange-50 text-orange-700' },
  open: { label: 'รอดำเนินการ', cls: 'bg-gray-100 text-gray-600' },
  closed: { label: 'ปิดแล้ว', cls: 'bg-green-50 text-green-700' },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={clsx('status-badge', cfg.cls)}>{cfg.label}</span>
  );
}
