import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Mail, ArrowLeft, CalendarDays, Save } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import PageWrapper from '../../components/layout/PageWrapper';
import StatusBadge from '../../components/ui/StatusBadge';
import SignaturePad from '../../components/ui/SignaturePad';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { buildClaimResponseUrl, buildLostReporterMatchEmail, openGmailCompose } from '../../utils/gmail';

export default function HandoverForm() {
  const { id } = useParams();
  const { foundReports, lostReports, masterData, updateFoundReport, addToast, addAuditLog } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const report = foundReports.find(r => r.id === id);
  const matchedLost = report?.matchedLostId ? lostReports.find(r => r.id === report.matchedLostId) : undefined;

  const initialAppointment = report?.returnAppointment?.includes('T') ? report.returnAppointment : '';
  const [appointmentDate, setAppointmentDate] = useState(initialAppointment.split('T')[0] ?? '');
  const [appointmentTime, setAppointmentTime] = useState(initialAppointment.split('T')[1] ?? '');

  if (!report) return <PageWrapper><div className="text-center py-12 text-gray-400">ไม่พบรายการ</div></PageWrapper>;

  const cat = masterData.categories.find(c => c.id === report.categoryId);
  const area = masterData.areas.find(a => a.id === report.foundAreaId);
  const storage = masterData.storageLocations.find(s => s.id === report.storageLocationId);
  const appointment = appointmentDate && appointmentTime ? `${appointmentDate}T${appointmentTime}` : report.returnAppointment || '';
  const appointmentText = appointment
    ? appointment.replace('T', ' เวลา ')
    : 'ยังไม่ระบุ';

  const handlePrint = () => window.print();

  const saveAppointment = () => {
    if (!appointmentDate || !appointmentTime) {
      addToast({ type: 'warning', title: 'กรุณาระบุวันและเวลา' });
      return;
    }

    const nextAppointment = `${appointmentDate}T${appointmentTime}`;
    updateFoundReport(report.id, { returnAppointment: nextAppointment, status: 'pending_return' });
    addAuditLog({
      userId: user?.id ?? '',
      username: user?.username ?? '',
      action: 'APPOINTMENT',
      module: 'Handover',
      detail: `นัดคืนทรัพย์สิน ${report.foundCode} วันที่ ${nextAppointment}`,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.100',
    });
    addToast({ type: 'success', title: 'บันทึกนัดหมายสำเร็จ', message: appointmentText });
  };

  const sendLostReporterEmail = () => {
    if (!matchedLost) {
      addToast({ type: 'warning', title: 'ยังไม่มีรายการสูญหายที่จับคู่' });
      return;
    }
    const ok = openGmailCompose(buildLostReporterMatchEmail({
      found: report,
      lost: matchedLost,
      category: cat,
      area,
      appointment: appointmentText,
      claimUrl: buildClaimResponseUrl(report.id, matchedLost.id),
    }));
    addToast(ok
      ? { type: 'success', title: 'เปิด Gmail แล้ว', message: `ผู้รับ: ${matchedLost.reporter.email}` }
      : { type: 'warning', title: 'ไม่มีอีเมลผู้แจ้งสูญหาย' }
    );
  };

  const markReturned = () => {
    updateFoundReport(report.id, { status: 'returned' });
    addAuditLog({
      userId: user?.id ?? '',
      username: user?.username ?? '',
      action: 'RETURN',
      module: 'Handover',
      detail: `ยืนยันการคืนทรัพย์สิน ${report.foundCode}`,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.100',
    });
    addToast({ type: 'success', title: 'ยืนยันการคืนทรัพย์สินแล้ว' });
  };

  return (
    <PageWrapper
      title="เอกสารยืนยันการคืนทรัพย์สิน"
      subtitle="นัดหมาย แจ้งผู้แจ้งสูญหายผ่าน Gmail และลงลายเซ็นผู้รับคืน"
      actions={
        <div className="flex flex-wrap gap-2 no-print">
          <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2 text-sm"><ArrowLeft size={15} /> กลับ</button>
          <button onClick={sendLostReporterEmail} className="btn-secondary flex items-center gap-2 text-sm"><Mail size={15} /> Gmail ผู้แจ้งสูญหาย</button>
          <button onClick={handlePrint} className="btn-primary flex items-center gap-2 text-sm"><Printer size={15} /> พิมพ์เอกสาร</button>
        </div>
      }
    >
      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        <div className="space-y-4 no-print">
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-primary" />
              <h2 className="font-semibold text-gray-900">นัดวันคืนทรัพย์สิน</h2>
            </div>
            <div>
              <label className="form-label">วันที่คืน</label>
              <input type="date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} className="form-input" />
            </div>
            <div>
              <label className="form-label">เวลาคืน</label>
              <input type="time" value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)} className="form-input" />
            </div>
            <button onClick={saveAppointment} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
              <Save size={15} /> บันทึกนัดหมาย
            </button>
          </div>

          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-gray-900">สถานะเอกสาร</h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">ทรัพย์สิน</span>
              <StatusBadge status={report.status} />
            </div>
            <div className="text-sm">
              <p className="text-gray-400 text-xs">รายการสูญหายที่จับคู่</p>
              <p className="font-mono text-primary font-semibold">{matchedLost?.trackingNo ?? 'ยังไม่จับคู่'}</p>
            </div>
            <button onClick={markReturned} className="btn-secondary w-full text-sm">ยืนยันส่งคืนแล้ว</button>
          </div>
        </div>

        <div className="max-w-3xl">
          <div className="card p-8 space-y-6 print:shadow-none print:border-0">
            <div className="text-center border-b border-gray-100 pb-6">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">CNI</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">เอกสารยืนยันการคืนทรัพย์สิน</h1>
              <p className="text-sm text-gray-500">ClickNext Innovation Lost & Found</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400 text-xs block mb-1">รหัสทรัพย์สิน</span>
                <span className="font-mono font-bold text-primary">{report.foundCode}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block mb-1">หมายเลขแจ้งสูญหาย</span>
                <span className="font-mono text-gray-700">{matchedLost?.trackingNo ?? '-'}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block mb-1">RFID Tag</span>
                <span className="font-mono text-gray-700">{report.rfidTag}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block mb-1">วัน/เวลานัดคืน</span>
                <span className="text-gray-700">{appointmentText}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block mb-1">วันที่บันทึก</span>
                <span className="text-gray-700">{format(new Date(report.createdAt), 'd MMMM yyyy HH:mm น.', { locale: th })}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block mb-1">ผู้บันทึก</span>
                <span className="text-gray-700">{report.createdBy}</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm">รายละเอียดทรัพย์สิน</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-400 text-xs block">ประเภท</span><span>{cat?.icon} {cat?.name}</span></div>
                <div><span className="text-gray-400 text-xs block">ที่จัดเก็บ</span><span>{storage?.name ?? '-'}</span></div>
                <div><span className="text-gray-400 text-xs block">สี</span><span>{report.color}</span></div>
                <div><span className="text-gray-400 text-xs block">ขนาด / จำนวน</span><span>{report.size} · {report.qty} ชิ้น</span></div>
                <div className="col-span-2"><span className="text-gray-400 text-xs block">รายละเอียด</span><span>{report.description}</span></div>
                <div className="col-span-2"><span className="text-gray-400 text-xs block">บริเวณที่พบ</span><span>{area?.name} {report.foundAreaNote && `· ${report.foundAreaNote}`}</span></div>
                <div><span className="text-gray-400 text-xs block">วันที่พบ</span><span>{report.foundDate}</span></div>
                <div><span className="text-gray-400 text-xs block">เวลา</span><span>{report.foundTime} น.</span></div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">ผู้แจ้งพบ / ผู้นำส่ง</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-400 text-xs block">ชื่อ-นามสกุล</span><span>{report.finder.name}</span></div>
                  <div><span className="text-gray-400 text-xs block">โทรศัพท์</span><span>{report.finder.phone || '-'}</span></div>
                  <div><span className="text-gray-400 text-xs block">อีเมล</span><span>{report.finder.email || '-'}</span></div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">ผู้แจ้งทรัพย์สินสูญหาย / ผู้รับคืน</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-400 text-xs block">ชื่อ-นามสกุล</span><span>{matchedLost?.reporter.name ?? '-'}</span></div>
                  <div><span className="text-gray-400 text-xs block">สัญชาติ</span><span>{matchedLost?.reporter.nationality ?? '-'}</span></div>
                  <div><span className="text-gray-400 text-xs block">โทรศัพท์</span><span>{matchedLost?.reporter.phone ?? '-'}</span></div>
                  <div><span className="text-gray-400 text-xs block">อีเมล</span><span>{matchedLost?.reporter.email ?? '-'}</span></div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-600">
              ผู้นำส่งได้ลงลายเซ็นอิเล็กทรอนิกส์ไว้ตั้งแต่ขั้นตอนนำส่งทรัพย์สิน ส่วนผู้แจ้งสูญหายลงลายเซ็นเมื่อรับคืนเพื่อยืนยันการส่งมอบและรับคืนทรัพย์สินตามรายละเอียดในเอกสารนี้
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <SignaturePad
                label="ลายเซ็นผู้แจ้งพบ / ผู้นำส่ง"
                name={report.finder.name}
                value={report.finderSignature}
                readOnly
              />
              <SignaturePad label="ลายเซ็นผู้แจ้งสูญหาย / ผู้รับคืน" name={matchedLost?.reporter.name ?? ''} />
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
