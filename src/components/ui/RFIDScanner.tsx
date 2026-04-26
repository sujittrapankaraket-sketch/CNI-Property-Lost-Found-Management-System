import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, GitMerge, Check, Clock, Package, MapPin, CalendarDays, Search, ImageIcon, FileSignature } from 'lucide-react';
import Modal from './Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from './StatusBadge';
import type { FoundReport, LostReport, PropertyStatus } from '../../types';

interface RFIDScannerProps {
  onOpen?: boolean;
  onClose?: () => void;
  compact?: boolean;
  activeReaderName?: string;
}

export default function RFIDScanner({ onOpen = false, onClose, compact = false, activeReaderName }: RFIDScannerProps) {
  const [isOpen, setIsOpen] = useState(onOpen);
  const [rfidInput, setRfidInput] = useState('');
  const [scannedItem, setScannedItem] = useState<FoundReport | null>(null);
  const { foundReports, lostReports, masterData, matchReports, updateFoundReport, addToast, addAuditLog } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const getCategory = (id: string) => masterData.categories.find(c => c.id === id);
  const getArea = (id: string) => masterData.areas.find(a => a.id === id);
  const getStorage = (id: string) => masterData.storageLocations.find(s => s.id === id);

  const getMatchScore = (lost: LostReport, found: FoundReport) => {
    let score = 0;
    if (lost.categoryId === found.categoryId) score += 3;
    if (lost.color.toLowerCase() === found.color.toLowerCase() && lost.color !== '-') score += 2;
    if (lost.lostAreaId === found.foundAreaId) score += 2;
    if (lost.size === found.size && lost.size !== '-') score += 1;
    return score;
  };

  const matchCandidates = scannedItem
    ? lostReports
        .filter(r => r.status === 'open')
        .map(report => ({ report, score: getMatchScore(report, scannedItem) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
    : [];

  const handleScan = () => {
    const query = rfidInput.toLowerCase().trim();
    if (!query) {
      addToast({ type: 'warning', title: 'ผิดพลาด', message: 'กรุณากรอก RFID Tag' });
      return;
    }

    const item = foundReports.find(r => 
      r.rfidTag.toLowerCase().includes(query) || 
      query.includes(r.rfidTag.toLowerCase())
    );

    if (item) {
      setScannedItem(item);
      addToast({ type: 'success', title: 'พบรายการ', message: `${item.foundCode} - ${item.description}` });
    } else {
      setScannedItem(null);
      addToast({ type: 'error', title: 'ไม่พบรายการ', message: `ไม่พบ RFID Tag: ${rfidInput}` });
    }
  };

  const handleStatusChange = (newStatus: PropertyStatus) => {
    if (scannedItem) {
      updateFoundReport(scannedItem.id, { status: newStatus });
      setScannedItem({ ...scannedItem, status: newStatus });
      addToast({ type: 'success', title: 'อัพเดตสำเร็จ', message: `สถานะเปลี่ยนเป็น ${newStatus}` });
      addAuditLog({
        userId: user?.id ?? '',
        username: user?.username ?? '',
        action: 'UPDATE',
        module: 'RFID Scanner',
        detail: `อัปเดตสถานะ ${scannedItem.foundCode} เป็น ${newStatus}`,
        timestamp: new Date().toISOString(),
        ipAddress: '192.168.1.100',
      });
    }
  };

  const handleMatch = (lost: LostReport) => {
    if (!scannedItem) return;
    matchReports(scannedItem.id, lost.id);
    setScannedItem({ ...scannedItem, status: 'matched', matchedLostId: lost.id });
    addAuditLog({
      userId: user?.id ?? '',
      username: user?.username ?? '',
      action: 'MATCH',
      module: 'RFID Scanner',
      detail: `จับคู่ ${scannedItem.foundCode} กับ ${lost.trackingNo}`,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.100',
    });
    addToast({ type: 'success', title: 'จับคู่สำเร็จ', message: `${scannedItem.foundCode} ↔ ${lost.trackingNo}` });
  };

  const goToSearch = () => {
    handleClose();
    navigate('/search');
  };

  const goToHandover = () => {
    if (!scannedItem) return;
    const id = scannedItem.id;
    handleClose();
    navigate(`/found/${id}/handover`);
  };

  const handleClose = () => {
    setIsOpen(false);
    setScannedItem(null);
    setRfidInput('');
    onClose?.();
  };

  const category = scannedItem ? getCategory(scannedItem.categoryId) : undefined;
  const area = scannedItem ? getArea(scannedItem.foundAreaId) : undefined;
  const storage = scannedItem ? getStorage(scannedItem.storageLocationId) : undefined;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={compact
          ? 'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-colors'
          : 'btn-primary flex items-center gap-2 text-sm'
        }
        title={activeReaderName ? `สแกน RFID — ${activeReaderName}` : 'สแกน RFID'}
      >
        <Wifi size={16} />
        <span className={compact ? 'hidden md:inline' : ''}>
          {activeReaderName ? activeReaderName : 'สแกน RFID'}
        </span>
      </button>

      <Modal open={isOpen} onClose={handleClose} title={activeReaderName ? `สแกน RFID — ${activeReaderName}` : 'สแกน RFID Tag'} size="lg">
        <div className="space-y-4">
          {/* Scan Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RFID Tag
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={rfidInput}
                onChange={e => setRfidInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScan()}
                placeholder="สแกน RFID หรือกรอก RFID Tag..."
                autoFocus
                className="form-input flex-1"
              />
              <button
                onClick={handleScan}
                className="btn-primary flex items-center gap-2"
              >
                <Wifi size={16} /> ค้นหา
              </button>
            </div>
          </div>

          {/* Scanned Item Details */}
          {scannedItem && (
            <div className="border border-blue-100 rounded-xl bg-white overflow-hidden">
              {/* Item Header */}
              <div className="bg-blue-50 border-b border-blue-100 p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold mb-1">
                    <Package size={14} /> รหัสทรัพย์สิน
                  </div>
                  <div className="font-mono font-bold text-blue-700 text-lg">{scannedItem.foundCode}</div>
                  <div className="text-xs text-gray-500 mt-1 font-mono">{scannedItem.rfidTag}</div>
                </div>
                <StatusBadge status={scannedItem.status} />
              </div>

              <div className="p-4 grid sm:grid-cols-[160px_1fr] gap-4">
                {/* Item Image */}
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
                  {scannedItem.photos.length > 0 ? (
                  <img
                    src={scannedItem.photos[0]}
                    alt={scannedItem.description}
                    className="w-full h-full object-cover"
                  />
                  ) : (
                    <div className="text-center text-gray-300">
                      <ImageIcon size={36} className="mx-auto mb-2" />
                      <div className="text-xs">ไม่มีรูปภาพ</div>
                    </div>
                  )}
                </div>

                {/* Item Details */}
                <div className="space-y-4 min-w-0">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase">ชื่อ / รายละเอียดทรัพย์สิน</div>
                    <div className="text-sm font-semibold text-gray-900 mt-1">{category?.icon} {category?.name ?? scannedItem.categoryId}</div>
                    <div className="text-sm text-gray-600 mt-1">{scannedItem.description}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="text-xs text-gray-400">สี</div>
                      <div className="text-sm font-medium text-gray-800">{scannedItem.color}</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="text-xs text-gray-400">ขนาด / จำนวน</div>
                      <div className="text-sm font-medium text-gray-800">{scannedItem.size} · {scannedItem.qty} ชิ้น</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex gap-2">
                      <CalendarDays size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-400">วันที่พบ</div>
                        <div className="text-gray-800">{scannedItem.foundDate} เวลา {scannedItem.foundTime}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <MapPin size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-400">บริเวณที่พบ</div>
                        <div className="text-gray-800">{area?.name ?? scannedItem.foundAreaId}</div>
                        {scannedItem.foundAreaNote && <div className="text-xs text-gray-500">{scannedItem.foundAreaNote}</div>}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-100 p-3 text-sm">
                    <div className="text-xs text-gray-400">ที่จัดเก็บ</div>
                    <div className="font-medium text-gray-800">{storage?.name ?? '-'}</div>
                  </div>
                </div>
              </div>

              {/* Quick Action Menu */}
              <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase">Quick Menu</div>
                  <button onClick={goToSearch} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                    <Search size={12} /> เปิดหน้าค้นหา/จับคู่
                  </button>
                </div>

                {scannedItem.status === 'stored' && matchCandidates.length > 0 && (
                  <div className="space-y-2">
                    {matchCandidates.map(({ report, score }) => (
                      <div key={report.id} className="bg-white border border-gray-100 rounded-lg p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-mono text-xs font-bold text-primary">{report.trackingNo}</div>
                          <div className="text-xs text-gray-600 truncate">{report.description}</div>
                          <div className="text-[11px] text-gray-400">คะแนนตรงกัน {score}/8 · {report.reporter.name}</div>
                        </div>
                        <button onClick={() => handleMatch(report)} className="btn-primary text-xs px-3 py-2 flex items-center gap-1 flex-shrink-0">
                          <GitMerge size={13} /> จับคู่
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {scannedItem.status === 'stored' && matchCandidates.length === 0 && (
                  <div className="bg-white border border-gray-100 rounded-lg p-3 text-xs text-gray-500">
                    ยังไม่พบรายการสูญหายที่ใกล้เคียง สามารถเปิดหน้าค้นหา/จับคู่เพื่อค้นหาเองได้
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {scannedItem.matchedLostId && (
                    <button onClick={goToHandover} className="col-span-2 btn-primary flex items-center justify-center gap-2 text-sm">
                      <FileSignature size={16} /> ฟอร์มนัดคืนและเอกสารลงลายเซ็น
                    </button>
                  )}
                  {scannedItem.status !== 'returned' && (
                    <button
                      onClick={() => handleStatusChange('returned')}
                      className="w-full bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg px-4 py-2.5 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Check size={16} /> ยืนยันการคืน
                    </button>
                  )}
                  {scannedItem.status !== 'stored' && scannedItem.status !== 'returned' && (
                    <button onClick={() => handleStatusChange('stored')} className="w-full btn-secondary flex items-center justify-center gap-2 text-sm">
                      <Clock size={16} /> กลับไปจัดเก็บ
                    </button>
                  )}
                  {scannedItem.status === 'stored' && (
                    <button onClick={() => handleStatusChange('expired')} className="w-full btn-secondary flex items-center justify-center gap-2 text-sm text-red-600">
                      <Clock size={16} /> หมดอายุ
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* No Item Message */}
          {rfidInput && !scannedItem && (
            <div className="text-center py-8 text-gray-400">
              <div className="text-sm">กรุณากดปุ่ม "ค้นหา" เพื่อค้นหา RFID Tag</div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
