import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, GitMerge, CheckCircle2, AlertCircle, Package, Mail, FileSignature } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import PageWrapper from '../../components/layout/PageWrapper';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { buildClaimResponseUrl, buildLostReporterMatchEmail, openGmailCompose } from '../../utils/gmail';
import type { LostReport, FoundReport } from '../../types';

export default function SearchMatch() {
  const { lostReports, foundReports, masterData, matchReports, addToast, addAuditLog } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [selectedLost, setSelectedLost] = useState<LostReport | null>(null);
  const [selectedFound, setSelectedFound] = useState<FoundReport | null>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [matchedPair, setMatchedPair] = useState<{ lost: LostReport; found: FoundReport } | null>(null);

  const getCatName = (id: string) => masterData.categories.find(c => c.id === id)?.name ?? id;
  const getAreaName = (id: string) => masterData.areas.find(a => a.id === id)?.name ?? id;
  const getCategory = (id: string) => masterData.categories.find(c => c.id === id);
  const getArea = (id: string) => masterData.areas.find(a => a.id === id);

  const filterItems = <T extends { description: string; categoryId: string; rfidTag?: string }>(
    items: T[], areaKey: keyof T
  ) => items.filter(r => {
    const q = keyword.toLowerCase();
    const rfidTag = (r.rfidTag as string | undefined) || '';
    const matchQ = !q || 
      r.description.toLowerCase().includes(q) || 
      getCatName(r.categoryId).toLowerCase().includes(q) ||
      rfidTag.toLowerCase().includes(q);
    const matchC = !filterCat || r.categoryId === filterCat;
    const matchA = !filterArea || (r[areaKey] as string) === filterArea;
    return matchQ && matchC && matchA;
  });

  const filteredLost = filterItems(lostReports, 'lostAreaId');
  const filteredFound = filterItems(foundReports, 'foundAreaId').filter(r => r.status === 'stored');

  const getMatchScore = (l: LostReport, f: FoundReport) => {
    let score = 0;
    if (l.categoryId === f.categoryId) score += 3;
    if (l.color.toLowerCase() === f.color.toLowerCase() && l.color !== '-') score += 2;
    if (l.lostAreaId === f.foundAreaId) score += 2;
    if (l.size === f.size && l.size !== '-') score += 1;
    return score;
  };

  const handleMatch = () => {
    if (!selectedLost || !selectedFound) return;
    const pair = { lost: selectedLost, found: selectedFound };
    matchReports(selectedFound.id, selectedLost.id);
    addAuditLog({
      userId: user?.id ?? '',
      username: user?.username ?? '',
      action: 'MATCH',
      module: 'Search & Match',
      detail: `จับคู่ ${selectedFound.foundCode} กับ ${selectedLost.trackingNo}`,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.100',
    });
    addToast({ type: 'success', title: 'จับคู่สำเร็จ', message: `${selectedFound.foundCode} ↔ ${selectedLost.trackingNo}` });
    setMatchedPair(pair);
    setSelectedLost(null);
    setSelectedFound(null);
    setConfirmModal(false);
  };

  const sendLostReporterEmail = () => {
    if (!matchedPair) return;
    const ok = openGmailCompose(buildLostReporterMatchEmail({
      found: matchedPair.found,
      lost: matchedPair.lost,
      category: getCategory(matchedPair.found.categoryId),
      area: getArea(matchedPair.found.foundAreaId),
      claimUrl: buildClaimResponseUrl(matchedPair.found.id, matchedPair.lost.id),
    }));
    addToast(ok
      ? { type: 'success', title: 'เปิด Gmail แล้ว', message: `ผู้รับ: ${matchedPair.lost.reporter.email}` }
      : { type: 'warning', title: 'ไม่มีอีเมลผู้แจ้งสูญหาย' }
    );
  };

  return (
    <PageWrapper title="ค้นหา / จับคู่ทรัพย์สิน" subtitle="ค้นหาและจับคู่ทรัพย์สินสูญหายกับทรัพย์สินที่พบ">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={keyword} onChange={e => setKeyword(e.target.value)} className="form-input pl-9" placeholder="ค้นหาด้วยคำสำคัญ / RFID Tag..." />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="form-input sm:w-44">
          <option value="">ทุกประเภท</option>
          {masterData.categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <select value={filterArea} onChange={e => setFilterArea(e.target.value)} className="form-input sm:w-48">
          <option value="">ทุกบริเวณ</option>
          {masterData.areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      {/* Selection bar */}
      {(selectedLost || selectedFound) && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-4 text-sm">
            {selectedLost && (
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-red-500" />
                <span className="font-mono font-semibold text-red-600">{selectedLost.trackingNo}</span>
                <button onClick={() => setSelectedLost(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
              </div>
            )}
            {selectedLost && selectedFound && <GitMerge size={16} className="text-primary" />}
            {selectedFound && (
              <div className="flex items-center gap-2">
                <Package size={14} className="text-blue-500" />
                <span className="font-mono font-semibold text-blue-600">{selectedFound.foundCode}</span>
                <button onClick={() => setSelectedFound(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
              </div>
            )}
          </div>
          {selectedLost && selectedFound && (
            <button onClick={() => setConfirmModal(true)} className="btn-primary flex items-center gap-2 text-sm flex-shrink-0">
              <GitMerge size={14} /> จับคู่รายการนี้
            </button>
          )}
        </div>
      )}

      {/* Dual column */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Lost */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle size={15} className="text-red-500" /> รายการสูญหาย ({filteredLost.length})
          </h3>
          <div className="space-y-2">
            {filteredLost.map(r => {
              const score = selectedFound ? getMatchScore(r, selectedFound) : 0;
              const isSelected = selectedLost?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedLost(isSelected ? null : r)}
                  className={`card p-4 cursor-pointer transition-all border-2 ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:border-primary/30'
                  } ${r.status !== 'open' ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-primary">{r.trackingNo}</span>
                    <div className="flex items-center gap-2">
                      {selectedFound && score > 0 && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          score >= 5 ? 'bg-green-100 text-green-700' :
                          score >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {score >= 5 ? 'ตรงมาก' : score >= 3 ? 'ใกล้เคียง' : 'อาจตรง'}
                        </span>
                      )}
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 mt-1 truncate">{r.description}</div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{getCatName(r.categoryId)}</span>
                    <span>·</span>
                    <span>{getAreaName(r.lostAreaId)}</span>
                    <span>·</span>
                    <span>{r.lostDateFrom}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {r.reporter.name} · {r.reporter.nationality || '-'} · {r.reporter.phone}
                  </div>
                </div>
              );
            })}
            {filteredLost.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm card">ไม่พบรายการ</div>
            )}
          </div>
        </div>

        {/* Found */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Package size={15} className="text-blue-500" /> ทรัพย์สินที่พบ (รอจับคู่: {filteredFound.length})
          </h3>
          <div className="space-y-2">
            {filteredFound.map(r => {
              const score = selectedLost ? getMatchScore(selectedLost, r) : 0;
              const isSelected = selectedFound?.id === r.id;
              const isRfidMatch = keyword.toLowerCase() && r.rfidTag.toLowerCase().includes(keyword.toLowerCase());
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedFound(isSelected ? null : r)}
                  className={`card p-4 cursor-pointer transition-all border-2 ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-blue-300'
                  } ${isRfidMatch ? 'ring-2 ring-blue-400' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-blue-600">{r.foundCode}</span>
                    <div className="flex items-center gap-2">
                      {selectedLost && score > 0 && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          score >= 5 ? 'bg-green-100 text-green-700' :
                          score >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {score >= 5 ? 'ตรงมาก' : score >= 3 ? 'ใกล้เคียง' : 'อาจตรง'}
                        </span>
                      )}
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 mt-1 truncate">{r.description}</div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{getCatName(r.categoryId)}</span>
                    <span>·</span>
                    <span>{getAreaName(r.foundAreaId)}</span>
                    <span>·</span>
                    <span>{r.foundDate}</span>
                  </div>
                  <div className={`text-xs font-mono mt-1 ${isRfidMatch ? 'text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded' : 'text-gray-400'}`}>
                    {r.rfidTag}
                  </div>
                </div>
              );
            })}
            {filteredFound.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm card">ไม่มีรายการรอจับคู่</div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      <Modal open={confirmModal} onClose={() => setConfirmModal(false)} title="ยืนยันการจับคู่" size="sm">
        {selectedLost && selectedFound && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">ยืนยันจับคู่รายการต่อไปนี้?</p>
            <div className="space-y-3">
              <div className="bg-red-50 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-1">รายการสูญหาย</div>
                <div className="font-mono text-sm font-bold text-primary">{selectedLost.trackingNo}</div>
                <div className="text-xs text-gray-600 mt-0.5">{selectedLost.description}</div>
              </div>
              <div className="flex justify-center"><GitMerge size={18} className="text-primary" /></div>
              <div className="bg-blue-50 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-1">ทรัพย์สินที่พบ</div>
                <div className="font-mono text-sm font-bold text-blue-600">{selectedFound.foundCode}</div>
                <div className="text-xs text-gray-600 mt-0.5">{selectedFound.description}</div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmModal(false)} className="btn-secondary flex-1">ยกเลิก</button>
              <button onClick={handleMatch} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <CheckCircle2 size={14} /> ยืนยัน
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!matchedPair} onClose={() => setMatchedPair(null)} title="จับคู่สำเร็จ" size="md">
        {matchedPair && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                <CheckCircle2 size={16} /> พร้อมแจ้งผู้แจ้งสูญหายและนัดคืนทรัพย์สิน
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">รายการสูญหาย</div>
                  <div className="font-mono text-primary font-bold">{matchedPair.lost.trackingNo}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {matchedPair.lost.reporter.name} · {matchedPair.lost.reporter.nationality || '-'}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">ทรัพย์สินที่พบ</div>
                  <div className="font-mono text-blue-600 font-bold">{matchedPair.found.foundCode}</div>
                  <div className="text-xs text-gray-500 truncate">{matchedPair.found.finder.name}</div>
                </div>
              </div>
            </div>

            <button onClick={sendLostReporterEmail} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
              <Mail size={15} /> Gmail ผู้แจ้งสูญหาย
            </button>

            <button
              onClick={() => navigate(`/found/${matchedPair.found.id}/handover`)}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
            >
              <FileSignature size={16} /> สร้างฟอร์มนัดคืนและเอกสารลงลายเซ็น
            </button>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
