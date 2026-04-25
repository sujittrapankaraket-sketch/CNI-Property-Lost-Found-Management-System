import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, XCircle, Package, AlertCircle } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import ToastContainer from '../components/shared/ToastContainer';
import { useData } from '../context/DataContext';

export default function ClaimResponse() {
  const { foundId, lostId } = useParams();
  const { foundReports, lostReports, masterData, updateFoundReport, updateLostReport, addAuditLog, addToast } = useData();
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [disposalReason, setDisposalReason] = useState('');
  const [submitted, setSubmitted] = useState<'accepted' | 'not_mine' | 'disposal' | null>(null);

  const found = foundReports.find(r => r.id === foundId);
  const lost = lostReports.find(r => r.id === lostId);
  const category = found ? masterData.categories.find(c => c.id === found.categoryId) : undefined;
  const area = found ? masterData.areas.find(a => a.id === found.foundAreaId) : undefined;

  const handleAccept = () => {
    if (!found || !lost) return;
    if (!appointmentDate || !appointmentTime) {
      addToast({ type: 'warning', title: 'กรุณาเลือกวันและเวลานัดคืน' });
      return;
    }

    const appointment = `${appointmentDate}T${appointmentTime}`;
    updateFoundReport(found.id, {
      status: 'pending_return',
      matchedLostId: lost.id,
      returnAppointment: appointment,
    });
    updateLostReport(lost.id, {
      status: 'matched',
      matchedFoundId: found.id,
    });
    addAuditLog({
      userId: 'public',
      username: lost.reporter.email || lost.reporter.name,
      action: 'CLAIM_ACCEPT',
      module: 'Claim Response',
      detail: `ผู้แจ้งสูญหายเลือกนัดคืน ${found.foundCode} วันที่ ${appointment}`,
      timestamp: new Date().toISOString(),
      ipAddress: 'public-link',
    });
    addToast({ type: 'success', title: 'บันทึกวันนัดคืนสำเร็จ' });
    setSubmitted('accepted');
  };

  const handleNotMine = () => {
    if (!found || !lost) return;
    updateFoundReport(found.id, {
      status: 'stored',
      matchedLostId: undefined,
      returnAppointment: undefined,
      disposalReason: undefined,
    });
    updateLostReport(lost.id, {
      status: 'open',
      matchedFoundId: undefined,
    });
    addAuditLog({
      userId: 'public',
      username: lost.reporter.email || lost.reporter.name,
      action: 'CLAIM_NOT_MINE',
      module: 'Claim Response',
      detail: `ผู้แจ้งสูญหายระบุว่า ${found.foundCode} ไม่ใช่ทรัพย์สินของตน ระบบปล่อยกลับไปรอจับคู่ใหม่`,
      timestamp: new Date().toISOString(),
      ipAddress: 'public-link',
    });
    addToast({ type: 'info', title: 'บันทึกแล้ว', message: 'ทรัพย์สินถูกส่งกลับไปรอจับคู่ใหม่' });
    setSubmitted('not_mine');
  };

  const handleDisposalRequest = () => {
    if (!found || !lost) return;
    const reason = disposalReason.trim();
    if (!reason) {
      addToast({ type: 'warning', title: 'กรุณากรอกเหตุผล' });
      return;
    }

    updateFoundReport(found.id, {
      status: 'disposal_requested',
      matchedLostId: lost.id,
      returnAppointment: undefined,
      disposalReason: reason,
    });
    updateLostReport(lost.id, {
      status: 'closed',
      matchedFoundId: found.id,
    });
    addAuditLog({
      userId: 'public',
      username: lost.reporter.email || lost.reporter.name,
      action: 'CLAIM_DISPOSAL',
      module: 'Claim Response',
      detail: `ผู้แจ้งสูญหายยืนยันว่าเป็นของตนแต่ไม่ต้องการรับคืน ${found.foundCode} เหตุผล: ${reason}`,
      timestamp: new Date().toISOString(),
      ipAddress: 'public-link',
    });
    addToast({ type: 'info', title: 'บันทึกความประสงค์แล้ว', message: 'เจ้าหน้าที่จะดำเนินการทิ้งหรือทำลายต่อไป' });
    setSubmitted('disposal');
  };

  if (!found || !lost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <AlertCircle size={36} className="text-primary mx-auto mb-3" />
          <h1 className="text-lg font-bold text-gray-900">ไม่พบข้อมูล</h1>
          <p className="text-sm text-gray-500 mt-2">ลิงก์นี้อาจไม่ถูกต้อง หรือข้อมูลถูกเปลี่ยนแปลงแล้ว</p>
        </div>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mb-3">
                <span className="text-white font-bold text-sm">CNI</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">ยืนยันข้อมูลทรัพย์สินที่พบ</h1>
              <p className="text-sm text-gray-500 mt-1">เลือกวันนัดรับคืน ระบุว่าไม่ใช่ของคุณ หรือยืนยันว่าไม่ต้องการรับคืนแล้ว</p>
            </div>
            <StatusBadge status={found.status} />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-5">
            <div className="rounded-xl bg-red-50 p-4">
              <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-3">
                <AlertCircle size={15} /> รายการแจ้งสูญหาย
              </div>
              <div className="font-mono font-bold text-primary">{lost.trackingNo}</div>
              <p className="text-sm text-gray-700 mt-2">{lost.description}</p>
              <p className="text-xs text-gray-500 mt-2">
                {lost.reporter.name} · {lost.reporter.nationality || '-'} · {lost.reporter.phone}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-4">
              <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm mb-3">
                <Package size={15} /> ทรัพย์สินที่พบ
              </div>
              <div className="font-mono font-bold text-blue-700">{found.foundCode}</div>
              <p className="text-sm text-gray-700 mt-2">{found.description}</p>
              <p className="text-xs text-gray-500 mt-2">{category?.icon} {category?.name} · {area?.name}</p>
            </div>
          </div>

          {submitted ? (
            <div className={`mt-5 rounded-xl p-4 ${submitted === 'accepted' ? 'bg-green-50 text-green-700' : submitted === 'not_mine' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
              <div className="flex items-center gap-2 font-semibold">
                {submitted === 'accepted' ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
                {submitted === 'accepted' && 'บันทึกวันนัดคืนแล้ว'}
                {submitted === 'not_mine' && 'บันทึกว่าไม่ใช่ทรัพย์สินของคุณแล้ว'}
                {submitted === 'disposal' && 'บันทึกว่าไม่ต้องการรับคืนแล้ว'}
              </div>
              <p className="text-sm mt-1">
                {submitted === 'accepted' && 'เจ้าหน้าที่จะเห็นสถานะรอส่งคืนในระบบทันที'}
                {submitted === 'not_mine' && 'ทรัพย์สินจะกลับไปอยู่ในสถานะรอจับคู่ เพื่อให้เจ้าหน้าที่จับคู่กับรายการอื่นต่อได้'}
                {submitted === 'disposal' && 'เจ้าหน้าที่จะเห็นสถานะรอทิ้ง/ทำลาย พร้อมเหตุผลที่คุณระบุ'}
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-green-100 bg-green-50/60 p-4">
                <h2 className="text-sm font-semibold text-green-800 mb-3">กรณีที่เป็นทรัพย์สินของคุณ และต้องการรับคืน</h2>
                <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-end">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label flex items-center gap-1"><CalendarDays size={13} /> วันที่รับคืน</label>
                      <input type="date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} className="form-input" />
                    </div>
                    <div>
                      <label className="form-label">เวลารับคืน</label>
                      <input type="time" value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)} className="form-input" />
                    </div>
                  </div>
                  <button onClick={handleAccept} className="btn-primary text-sm flex items-center justify-center gap-2">
                    <CheckCircle2 size={15} /> ยืนยันนัดคืน
                  </button>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                  <h2 className="text-sm font-semibold text-blue-800 mb-2">ไม่ใช่ทรัพย์สินของฉัน</h2>
                  <p className="text-xs text-blue-700 mb-3">ระบบจะปล่อยทรัพย์สินนี้กลับไปรอจับคู่ เพื่อให้เจ้าหน้าที่จับคู่กับรายการอื่นต่อ</p>
                  <button onClick={handleNotMine} className="btn-secondary w-full text-sm flex items-center justify-center gap-2">
                    <XCircle size={15} /> ไม่ใช่ของฉัน
                  </button>
                </div>

                <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4">
                  <h2 className="text-sm font-semibold text-orange-800 mb-2">เป็นของฉัน แต่ไม่ต้องการรับคืนแล้ว</h2>
                  <textarea
                    value={disposalReason}
                    onChange={e => setDisposalReason(e.target.value)}
                    className="form-input min-h-[80px] mb-3"
                    placeholder="กรอกเหตุผล เช่น ไม่ต้องการแล้ว / ของเสียหาย / ยินยอมให้ทิ้งหรือทำลาย"
                  />
                  <button onClick={handleDisposalRequest} className="btn-secondary w-full text-sm flex items-center justify-center gap-2 text-orange-700">
                    <XCircle size={15} /> ไม่ต้องการแล้ว ให้ทิ้ง/ทำลาย
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
