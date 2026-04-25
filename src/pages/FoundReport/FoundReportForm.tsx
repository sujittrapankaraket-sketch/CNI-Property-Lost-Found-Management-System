import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CheckCircle2, ChevronLeft, ChevronRight, Package, Wifi, AlertTriangle, Mail } from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import PhotoUpload from '../../components/ui/PhotoUpload';
import Modal from '../../components/ui/Modal';
import SignaturePad from '../../components/ui/SignaturePad';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formValidations } from '../../utils/validations';
import { buildClaimResponseUrl, buildLostReporterMatchEmail, openGmailCompose } from '../../utils/gmail';
import type { FoundReport, LostReport } from '../../types';

interface FormData {
  rfidTag: string;
  categoryId: string;
  color: string;
  size: string;
  qty: number;
  description: string;
  foundAreaId: string;
  foundAreaNote: string;
  foundDate: string;
  foundTime: string;
  storageLocationId: string;
  finderName: string;
  finderNationality: string;
  finderPhone: string;
  finderEmail: string;
}

const STEPS = ['RFID & ประเภท', 'บริเวณ/สถานที่', 'วันเวลา', 'ผู้นำส่ง'];

export default function FoundReportForm() {
  const { masterData, addFoundReport, addToast, addAuditLog } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [done, setDone] = useState<FoundReport | null>(null);
  const [matches, setMatches] = useState<LostReport[]>([]);
  const [showMatch, setShowMatch] = useState(false);
  const [rfidScanned, setRfidScanned] = useState(false);
  const [finderSignature, setFinderSignature] = useState('');

  const { register, handleSubmit, formState: { errors }, trigger, setValue } = useForm<FormData>({
    defaultValues: { qty: 1, finderNationality: 'ไทย' }
  });

  const STEP_FIELDS: (keyof FormData)[][] = [
    ['categoryId', 'description'],
    ['foundAreaId'],
    ['foundDate', 'foundTime'],
    ['finderName', 'finderPhone', 'finderEmail'],
  ];

  const getCategory = (id: string) => masterData.categories.find(c => c.id === id);
  const getArea = (id: string) => masterData.areas.find(a => a.id === id);

  const simulateRFID = () => {
    const tag = `RFID-${Date.now().toString().slice(-6)}`;
    setValue('rfidTag', tag);
    setRfidScanned(true);
    addToast({ type: 'success', title: 'สแกน RFID สำเร็จ', message: `แท็ก: ${tag}` });
  };

  const nextStep = async () => {
    const ok = await trigger(STEP_FIELDS[step] as any);
    if (ok) setStep(s => s + 1);
  };

  const onSubmit = (data: FormData) => {
    if (!finderSignature) {
      addToast({ type: 'warning', title: 'กรุณาเซ็นลายเซ็นผู้นำส่ง' });
      return;
    }

    const result = addFoundReport({
      rfidTag: data.rfidTag || `RFID-MANUAL-${Date.now()}`,
      categoryId: data.categoryId,
      color: data.color || '-',
      size: data.size || '-',
      qty: data.qty,
      description: data.description,
      photos,
      foundAreaId: data.foundAreaId,
      foundAreaNote: data.foundAreaNote,
      foundDate: data.foundDate,
      foundTime: data.foundTime,
      finder: {
        name: data.finderName,
        nationality: data.finderNationality,
        phone: data.finderPhone,
        email: data.finderEmail,
      },
      finderSignature,
      storageLocationId: data.storageLocationId,
      status: 'stored',
      matchedLostId: undefined,
      expiresAt: '',
      createdBy: user?.username ?? '',
    });

    addAuditLog({
      userId: user?.id ?? '',
      username: user?.username ?? '',
      action: 'CREATE',
      module: 'Found Report',
      detail: `บันทึกทรัพย์สินหลงลืม ${result.report.foundCode}`,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.100',
    });

    addToast({ type: 'success', title: 'บันทึกสำเร็จ', message: `รหัส: ${result.report.foundCode}` });
    setDone(result.report);

    if (result.matches.length > 0) {
      setMatches(result.matches);
      setShowMatch(true);
      addToast({
        type: 'warning',
        title: 'พบรายการสูญหายที่ใกล้เคียง',
        message: `ตรวจพบ ${result.matches.length} รายการ กรุณาตรวจสอบและแจ้งผู้แจ้งสูญหาย`,
      });
    }
  };

  const sendLostReporterEmail = (match: LostReport) => {
    if (!done) return;
    const ok = openGmailCompose(buildLostReporterMatchEmail({
      found: done,
      lost: match,
      category: getCategory(done.categoryId),
      area: getArea(done.foundAreaId),
      claimUrl: buildClaimResponseUrl(done.id, match.id),
    }));

    if (ok) {
      addAuditLog({
        userId: user?.id ?? '',
        username: user?.username ?? '',
        action: 'EMAIL_NOTIFY',
        module: 'Found Report',
        detail: `แจ้งผู้แจ้งสูญหาย ${match.trackingNo} หลังบันทึกทรัพย์สิน ${done.foundCode}`,
        timestamp: new Date().toISOString(),
        ipAddress: '192.168.1.100',
      });
    }

    addToast(ok
      ? { type: 'success', title: 'เปิด Gmail แล้ว', message: `ผู้รับ: ${match.reporter.email}` }
      : { type: 'warning', title: 'ไม่มีอีเมลผู้แจ้งสูญหาย', message: match.trackingNo }
    );
  };

  if (done) {
    return (
      <>
        <PageWrapper>
          <div className="max-w-md mx-auto text-center py-12">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">บันทึกทรัพย์สินหลงลืมสำเร็จ</h2>
            <p className="text-gray-500 mb-6">ทรัพย์สินถูกบันทึกและนำเข้าระบบแล้ว</p>
            <div className="bg-gray-50 rounded-2xl p-6 mb-6 text-left space-y-2">
              <div>
                <p className="text-xs text-gray-400">รหัสทรัพย์สิน</p>
                <p className="text-xl font-bold text-primary font-mono">{done.foundCode}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">RFID</p>
                <p className="text-sm font-mono text-gray-700">{done.rfidTag}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">วันหมดอายุ</p>
                <p className="text-sm text-gray-700">{done.expiresAt}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate('/found')} className="btn-secondary flex-1">ดูรายการ</button>
              <button onClick={() => navigate(`/found/${done.id}/intake`)} className="btn-primary flex-1">แบบฟอร์มนำส่ง</button>
            </div>
          </div>
        </PageWrapper>

        {/* Auto-match modal */}
        <Modal open={showMatch} onClose={() => setShowMatch(false)} title="พบข้อมูลทรัพย์สินสูญหายที่ตรงกัน" size="lg">
          <div className="flex items-start gap-3 mb-4 p-3 bg-amber-50 rounded-xl">
            <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">ระบบตรวจพบรายการแจ้งสูญหายที่ตรงหรือใกล้เคียง</p>
              <p className="text-sm text-amber-700 mt-0.5">สามารถแจ้งผู้แจ้งสูญหายผ่าน Gmail ได้ทันที หรือไปหน้าจับคู่เพื่อตรวจสอบรายละเอียด</p>
            </div>
          </div>
          <div className="space-y-3">
            {matches.map(m => (
              <div key={m.id} className="border border-amber-200 rounded-xl p-4 bg-amber-50/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-semibold text-primary mb-1">{m.trackingNo}</div>
                    <div className="text-sm text-gray-700">{m.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {m.reporter.name} · {m.reporter.nationality || '-'} · {m.reporter.phone} · {m.reporter.email || 'ไม่มีอีเมล'}
                    </div>
                  </div>
                  <button
                    onClick={() => sendLostReporterEmail(m)}
                    className="btn-secondary text-xs px-3 py-2 flex items-center gap-1 flex-shrink-0"
                  >
                    <Mail size={13} /> Gmail
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowMatch(false)} className="btn-secondary flex-1">ปิด</button>
            <button onClick={() => { setShowMatch(false); navigate('/search'); }} className="btn-primary flex-1">ไปหน้าจับคู่</button>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <PageWrapper title="บันทึกทรัพย์สินหลงลืม" subtitle="กรอกข้อมูลทรัพย์สินที่พบ">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-shrink-0">
            <div className={`flex items-center gap-2 ${i <= step ? 'text-primary' : 'text-gray-300'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                i < step ? 'bg-primary border-primary text-white' :
                i === step ? 'border-primary text-primary bg-primary/5' :
                'border-gray-200 text-gray-300'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${i === step ? 'text-gray-900' : i < step ? 'text-primary' : 'text-gray-300'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`h-px w-8 lg:w-16 ${i < step ? 'bg-primary' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: RFID + type */}
          {step === 0 && (
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package size={16} className="text-primary" /> ข้อมูลทรัพย์สิน
              </h3>

              {/* RFID */}
              <div>
                <label className="form-label">RFID Tag</label>
                <div className="flex gap-2">
                  <input {...register('rfidTag')} className="form-input flex-1 font-mono" placeholder="สแกนหรือกรอก RFID" readOnly={rfidScanned} />
                  <button
                    type="button"
                    onClick={simulateRFID}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                      rfidScanned ? 'bg-green-50 text-green-600 border-green-200' : 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10'
                    }`}
                  >
                    <Wifi size={15} />
                    {rfidScanned ? 'สแกนแล้ว' : 'สแกน'}
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">ประเภทของทรัพย์สิน <span className="text-red-500">*</span></label>
                <select {...register('categoryId', { required: 'กรุณาเลือกประเภท' })} className="form-input">
                  <option value="">-- เลือกประเภท --</option>
                  {masterData.categories.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">สี</label>
                  <input {...register('color')} className="form-input" placeholder="เช่น สีดำ" />
                </div>
                <div>
                  <label className="form-label">ขนาด</label>
                  <input {...register('size')} className="form-input" placeholder="เล็ก/กลาง/ใหญ่" />
                </div>
              </div>

              <div>
                <label className="form-label">จำนวน</label>
                <input {...register('qty', { min: 1 })} type="number" className="form-input" min={1} />
              </div>

              <div>
                <label className="form-label">รายละเอียด <span className="text-red-500">*</span></label>
                <textarea
                  {...register('description', { required: 'กรุณากรอกรายละเอียด' })}
                  className="form-input min-h-[80px]"
                  placeholder="อธิบายลักษณะทรัพย์สิน..."
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
              </div>

              <div>
                <label className="form-label">รูปถ่าย (สูงสุด 8 รูป)</label>
                <PhotoUpload photos={photos} onChange={setPhotos} maxPhotos={8} />
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 1 && (
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">บริเวณที่พบทรัพย์สิน</h3>
              <div>
                <label className="form-label">บริเวณ <span className="text-red-500">*</span></label>
                <select {...register('foundAreaId', { required: 'กรุณาเลือกบริเวณ' })} className="form-input">
                  <option value="">-- เลือกบริเวณ --</option>
                  {masterData.areas.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                {errors.foundAreaId && <p className="text-xs text-red-500 mt-1">{errors.foundAreaId.message}</p>}
              </div>
              <div>
                <label className="form-label">รายละเอียดเพิ่มเติม</label>
                <textarea {...register('foundAreaNote')} className="form-input min-h-[80px]" placeholder="ระบุตำแหน่งที่แน่นอน..." />
              </div>
              <div>
                <label className="form-label">สถานที่จัดเก็บ</label>
                <select {...register('storageLocationId')} className="form-input">
                  <option value="">-- เลือกสถานที่จัดเก็บ --</option>
                  {masterData.storageLocations.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Date/Time */}
          {step === 2 && (
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">วันที่/เวลาที่พบ</h3>
              <div>
                <label className="form-label">วันที่พบ <span className="text-red-500">*</span></label>
                <input {...register('foundDate', { required: true })} type="date" className="form-input" />
                {errors.foundDate && <p className="text-xs text-red-500 mt-1">กรุณาเลือกวันที่</p>}
              </div>
              <div>
                <label className="form-label">เวลาที่พบ <span className="text-red-500">*</span></label>
                <input {...register('foundTime', { required: true })} type="time" className="form-input" />
                {errors.foundTime && <p className="text-xs text-red-500 mt-1">กรุณาเลือกเวลา</p>}
              </div>
            </div>
          )}

          {/* Step 4: Finder */}
          {step === 3 && (
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">ข้อมูลผู้นำส่ง</h3>
              <div>
                <label className="form-label">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                <input {...register('finderName', { required: 'กรุณากรอกชื่อ' })} className="form-input" />
                {errors.finderName && <p className="text-xs text-red-500 mt-1">{errors.finderName.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">สัญชาติ</label>
                  <select {...register('finderNationality')} className="form-input">
                    <option value="ไทย">ไทย</option>
                    <option value="จีน">จีน</option>
                    <option value="ญี่ปุ่น">ญี่ปุ่น</option>
                    <option value="เกาหลี">เกาหลี</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">เบอร์โทร <span className="text-red-500">*</span></label>
                  <input {...register('finderPhone', formValidations.phoneThai)} className="form-input" placeholder="0XX-XXX-XXXX" />
                  {errors.finderPhone && <p className="text-xs text-red-500 mt-1">{errors.finderPhone.message}</p>}
                </div>
              </div>
              <div>
                <label className="form-label">อีเมล <span className="text-red-500">*</span></label>
                <input {...register('finderEmail', formValidations.email)} type="email" className="form-input" placeholder="email@example.com" />
                {errors.finderEmail && <p className="text-xs text-red-500 mt-1">{errors.finderEmail.message}</p>}
              </div>
              <div>
                <label className="form-label">ลายเซ็นผู้นำส่ง <span className="text-red-500">*</span></label>
                <SignaturePad
                  label="ลายเซ็นผู้นำส่ง ณ วันที่นำส่งทรัพย์สิน"
                  onChange={setFinderSignature}
                  value={finderSignature}
                />
                {!finderSignature && <p className="text-xs text-gray-400 mt-2">ให้ผู้นำส่งเซ็นเพื่อใช้ยืนยันในเอกสารคืนทรัพย์สินภายหลัง</p>}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            {step > 0 && (
              <button type="button" onClick={() => setStep(s => s - 1)} className="btn-secondary flex items-center gap-2">
                <ChevronLeft size={16} /> ก่อนหน้า
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={nextStep} className="btn-primary flex items-center gap-2 ml-auto">
                ถัดไป <ChevronRight size={16} />
              </button>
            ) : (
              <button type="submit" className="btn-primary flex items-center gap-2 ml-auto">
                <CheckCircle2 size={16} /> บันทึกทรัพย์สิน
              </button>
            )}
          </div>
        </form>
      </div>
    </PageWrapper>
  );
}
