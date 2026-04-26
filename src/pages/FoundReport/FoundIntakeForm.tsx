import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import PageWrapper from '../../components/layout/PageWrapper';
import SignaturePad from '../../components/ui/SignaturePad';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { buildFoundIntakeReceiptEmail, openGmailCompose, openMailtoCompose } from '../../utils/gmail';

export default function FoundIntakeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { foundReports, masterData, addToast, addAuditLog } = useData();

  const report = foundReports.find(r => r.id === id);
  if (!report) return <PageWrapper><div className="text-center py-12 text-gray-400">ไม่พบรายการ</div></PageWrapper>;

  const cat = masterData.categories.find(c => c.id === report.categoryId);
  const area = masterData.areas.find(a => a.id === report.foundAreaId);
  const storage = masterData.storageLocations.find(s => s.id === report.storageLocationId);

  const handlePrint = () => window.print();

  const handleEmail = () => {
    const ok = openGmailCompose(buildFoundIntakeReceiptEmail({
      found: report,
      category: cat,
      area,
      storageName: storage?.name,
    }));

    if (ok) {
      addAuditLog({
        userId: user?.id ?? '',
        username: user?.username ?? '',
        action: 'EMAIL_RECEIPT',
        module: 'Found Report',
        detail: `ส่งแบบฟอร์มนำส่งทรัพย์สินหลงลืม ${report.foundCode} ให้ผู้นำส่ง`,
        timestamp: new Date().toISOString(),
        ipAddress: '192.168.1.100',
      });
    }

    addToast(ok
      ? { type: 'success', title: 'เปิด Gmail แล้ว', message: `ผู้รับ: ${report.finder.email}` }
      : { type: 'warning', title: 'ไม่มีอีเมลผู้นำส่ง' }
    );
  };

  return (
    <PageWrapper
      title="แบบฟอร์มนำส่งทรัพย์สินหลงลืม"
      subtitle="เอกสารยืนยันข้อมูลระหว่างผู้นำส่งและผู้รับทรัพย์สินหลงลืม"
      actions={
        <div className="flex flex-wrap gap-2 no-print">
          <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2 text-sm"><ArrowLeft size={15} /> กลับ</button>
          <button onClick={handleEmail} className="btn-secondary flex items-center gap-2 text-sm"><Mail size={15} /> ส่ง Gmail</button>
          <button onClick={handlePrint} className="btn-primary flex items-center gap-2 text-sm"><Printer size={15} /> พิมพ์</button>
        </div>
      }
    >
      <div className="max-w-3xl mx-auto">
        {(() => {
          const draft = buildFoundIntakeReceiptEmail({ found: report, category: cat, area, storageName: storage?.name });
          return (
            <div className="card p-4 mb-4 space-y-3 border border-blue-100 bg-blue-50/30 no-print">
              <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
                <Mail size={14} /> ส่งใบยืนยันให้ผู้นำส่ง
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div><span className="text-gray-400">ถึง:</span> <span className="font-medium break-all">{draft.to || 'ไม่มีอีเมลผู้นำส่ง'}</span></div>
                <div className="truncate"><span className="text-gray-400">เรื่อง:</span> {draft.subject}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const ok = openMailtoCompose(draft);
                    if (!ok) { addToast({ type: 'warning', title: 'ไม่มีอีเมลผู้นำส่ง' }); return; }
                    addAuditLog({ userId: user?.id ?? '', username: user?.username ?? '', action: 'EMAIL_RECEIPT', module: 'Found Report', detail: `ส่งใบยืนยันนำส่งทรัพย์สิน ${report.foundCode}`, timestamp: new Date().toISOString(), ipAddress: '192.168.1.100' });
                    addToast({ type: 'success', title: 'เปิดแอปอีเมลแล้ว', message: `ผู้รับ: ${draft.to}` });
                  }}
                  className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5"
                >
                  <Mail size={11} /> ส่งจากเครื่อง
                </button>
                <button
                  onClick={handleEmail}
                  className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5"
                >
                  Gmail Web
                </button>
              </div>
            </div>
          );
        })()}

        <div className="card p-8 space-y-6 print:shadow-none print:border-0">
          <div className="text-center border-b border-gray-100 pb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">CNI</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">แบบฟอร์มนำส่งทรัพย์สินหลงลืม</h1>
            <p className="text-sm text-gray-500">ClickNext Innovation Lost & Found</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400 text-xs block mb-1">รหัสทรัพย์สิน</span>
              <span className="font-mono font-bold text-primary">{report.foundCode}</span>
            </div>
            <div>
              <span className="text-gray-400 text-xs block mb-1">RFID Tag</span>
              <span className="font-mono text-gray-700">{report.rfidTag}</span>
            </div>
            <div>
              <span className="text-gray-400 text-xs block mb-1">วันที่บันทึก</span>
              <span className="text-gray-700">{format(new Date(report.createdAt), 'd MMMM yyyy HH:mm น.', { locale: th })}</span>
            </div>
            <div>
              <span className="text-gray-400 text-xs block mb-1">ผู้รับทรัพย์สิน</span>
              <span className="text-gray-700">{user?.fullName ?? report.createdBy}</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">ข้อมูลผู้นำส่งทรัพย์สินหลงลืม</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-400 text-xs block">ชื่อ-นามสกุล</span><span>{report.finder.name}</span></div>
              <div><span className="text-gray-400 text-xs block">สัญชาติ</span><span>{report.finder.nationality}</span></div>
              <div><span className="text-gray-400 text-xs block">โทรศัพท์</span><span>{report.finder.phone || '-'}</span></div>
              <div><span className="text-gray-400 text-xs block">อีเมล</span><span>{report.finder.email || '-'}</span></div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">รายละเอียดทรัพย์สินหลงลืม</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-400 text-xs block">ประเภท</span><span>{cat?.icon} {cat?.name}</span></div>
              <div><span className="text-gray-400 text-xs block">ที่จัดเก็บ</span><span>{storage?.name ?? '-'}</span></div>
              <div><span className="text-gray-400 text-xs block">สี</span><span>{report.color}</span></div>
              <div><span className="text-gray-400 text-xs block">ขนาด / จำนวน</span><span>{report.size} · {report.qty} ชิ้น</span></div>
              <div className="col-span-2"><span className="text-gray-400 text-xs block">รายละเอียด</span><span>{report.description}</span></div>
              <div className="col-span-2"><span className="text-gray-400 text-xs block">บริเวณที่พบ</span><span>{area?.name} {report.foundAreaNote && `· ${report.foundAreaNote}`}</span></div>
              <div><span className="text-gray-400 text-xs block">วันที่พบ</span><span>{report.foundDate}</span></div>
              <div><span className="text-gray-400 text-xs block">เวลา</span><span>{report.foundTime} น.</span></div>
              <div><span className="text-gray-400 text-xs block">วันหมดอายุ</span><span>{report.expiresAt}</span></div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-600">
            ผู้นำส่งและผู้รับทรัพย์สินหลงลืมยืนยันว่าข้อมูลข้างต้นถูกต้อง และได้ส่งมอบทรัพย์สินหลงลืมเข้าสู่ระบบ Lost & Found เรียบร้อยแล้ว
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-2">
            <SignaturePad
              label="ลายเซ็นผู้นำส่ง"
              name={report.finder.name}
              value={report.finderSignature}
              readOnly
            />
            <SignaturePad
              label="ลายเซ็นผู้รับทรัพย์สินหลงลืม"
              name={user?.fullName ?? report.createdBy}
            />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
