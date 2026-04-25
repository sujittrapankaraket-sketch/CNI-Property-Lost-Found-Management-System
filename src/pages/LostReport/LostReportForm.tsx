import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CheckCircle2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import PhotoUpload from '../../components/ui/PhotoUpload';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formValidations } from '../../utils/validations';
import type { LostReport } from '../../types';

interface FormData {
  categoryId: string;
  color: string;
  size: string;
  qty: number;
  description: string;
  lostAreaId: string;
  lostAreaNote: string;
  lostDateFrom: string;
  lostDateTo: string;
  lostTimeFrom: string;
  lostTimeTo: string;
  reporterName: string;
  reporterNationality: string;
  reporterPhone: string;
  reporterEmail: string;
}

const STEPS = ['ข้อมูลทรัพย์สิน', 'บริเวณ/สถานที่', 'วันเวลา', 'ข้อมูลผู้แจ้ง'];

export default function LostReportForm() {
  const { masterData, addLostReport, addToast, addAuditLog } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [done, setDone] = useState<LostReport | null>(null);

  const { register, handleSubmit, formState: { errors }, trigger, getValues } = useForm<FormData>({
    defaultValues: { qty: 1 }
  });

  const STEP_FIELDS: (keyof FormData)[][] = [
    ['categoryId', 'description'],
    ['lostAreaId'],
    ['lostDateFrom', 'lostDateTo'],
    ['reporterName', 'reporterPhone', 'reporterEmail'],
  ];

  const nextStep = async () => {
    const ok = await trigger(STEP_FIELDS[step] as any);
    if (ok) setStep(s => s + 1);
  };

  const onSubmit = (data: FormData) => {
    const report = addLostReport({
      categoryId: data.categoryId,
      color: data.color || '-',
      size: data.size || '-',
      qty: data.qty,
      description: data.description,
      photos,
      lostAreaId: data.lostAreaId,
      lostAreaNote: data.lostAreaNote,
      lostDateFrom: data.lostDateFrom,
      lostDateTo: data.lostDateTo,
      lostTimeFrom: data.lostTimeFrom,
      lostTimeTo: data.lostTimeTo,
      reporter: {
        name: data.reporterName,
        nationality: data.reporterNationality,
        phone: data.reporterPhone,
        email: data.reporterEmail,
      },
      status: 'open',
      createdBy: user?.username ?? '',
    });
    addAuditLog({
      userId: user?.id ?? '',
      username: user?.username ?? '',
      action: 'CREATE',
      module: 'Lost Report',
      detail: `สร้างรายการแจ้งทรัพย์สินสูญหาย ${report.trackingNo}`,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.100',
    });
    addToast({ type: 'success', title: 'บันทึกสำเร็จ', message: `หมายเลขติดตาม: ${report.trackingNo}` });
    setDone(report);
  };

  // Done screen
  if (done) {
    return (
      <PageWrapper>
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">บันทึกสำเร็จ</h2>
          <p className="text-gray-500 mb-6">รายการแจ้งทรัพย์สินสูญหายถูกบันทึกแล้ว</p>
          <div className="bg-gray-50 rounded-2xl p-6 mb-6 text-left">
            <p className="text-xs text-gray-400 mb-1">หมายเลขติดตาม</p>
            <p className="text-2xl font-bold text-primary font-mono">{done.trackingNo}</p>
            <p className="text-sm text-gray-500 mt-3">กรุณาบันทึกหมายเลขนี้เพื่อใช้ติดตามสถานะทรัพย์สิน</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/lost')} className="btn-secondary flex-1">ดูรายการทั้งหมด</button>
            <button onClick={() => { setDone(null); setStep(0); setPhotos([]); }} className="btn-primary flex-1">แจ้งรายการใหม่</button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="แจ้งทรัพย์สินสูญหาย" subtitle="กรอกข้อมูลเพื่อแจ้งทรัพย์สินสูญหาย">
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
              <span className={`text-sm font-medium hidden sm:block ${i === step ? 'text-gray-900' : i < step ? 'text-primary' : 'text-gray-300'}`}>
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className={`h-px w-8 lg:w-16 ${i < step ? 'bg-primary' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Property details */}
          {step === 0 && (
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle size={16} className="text-primary" /> ข้อมูลทรัพย์สินสูญหาย
              </h3>
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
                  <input {...register('size')} className="form-input" placeholder="เช่น เล็ก กลาง ใหญ่" />
                </div>
              </div>

              <div>
                <label className="form-label">จำนวน</label>
                <input {...register('qty', { min: 1 })} type="number" className="form-input" min={1} />
              </div>

              <div>
                <label className="form-label">รายละเอียดเพิ่มเติม <span className="text-red-500">*</span></label>
                <textarea
                  {...register('description', { required: 'กรุณากรอกรายละเอียด' })}
                  className="form-input min-h-[80px]"
                  placeholder="เช่น iPhone 15 Pro สีดำ มีเคสใสและสติ๊กเกอร์สีฟ้า"
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
              </div>

              <div>
                <label className="form-label">รูปถ่ายทรัพย์สิน (ถ้ามี)</label>
                <PhotoUpload photos={photos} onChange={setPhotos} />
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 1 && (
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">บริเวณที่คาดว่าทรัพย์สินสูญหาย</h3>
              <div>
                <label className="form-label">บริเวณ <span className="text-red-500">*</span></label>
                <select {...register('lostAreaId', { required: 'กรุณาเลือกบริเวณ' })} className="form-input">
                  <option value="">-- เลือกบริเวณ --</option>
                  {masterData.areas.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                {errors.lostAreaId && <p className="text-xs text-red-500 mt-1">{errors.lostAreaId.message}</p>}
              </div>
              <div>
                <label className="form-label">รายละเอียดบริเวณเพิ่มเติม</label>
                <textarea
                  {...register('lostAreaNote')}
                  className="form-input min-h-[80px]"
                  placeholder="เช่น ใกล้ร้านกาแฟ ประตูทางซ้าย..."
                />
              </div>
            </div>
          )}

          {/* Step 3: Date/Time */}
          {step === 2 && (
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">ช่วงวันที่/เวลาที่คาดว่าสูญหาย</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">วันที่เริ่มต้น <span className="text-red-500">*</span></label>
                  <input {...register('lostDateFrom', { required: true })} type="date" className="form-input" />
                  {errors.lostDateFrom && <p className="text-xs text-red-500 mt-1">กรุณาเลือกวันที่</p>}
                </div>
                <div>
                  <label className="form-label">วันที่สิ้นสุด <span className="text-red-500">*</span></label>
                  <input {...register('lostDateTo', { required: true })} type="date" className="form-input" />
                  {errors.lostDateTo && <p className="text-xs text-red-500 mt-1">กรุณาเลือกวันที่</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">เวลาเริ่มต้น</label>
                  <input {...register('lostTimeFrom')} type="time" className="form-input" />
                </div>
                <div>
                  <label className="form-label">เวลาสิ้นสุด</label>
                  <input {...register('lostTimeTo')} type="time" className="form-input" />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Reporter info */}
          {step === 3 && (
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">ข้อมูลผู้แจ้ง</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="form-label">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                  <input {...register('reporterName', { required: 'กรุณากรอกชื่อ' })} className="form-input" placeholder="ชื่อ-นามสกุล" />
                  {errors.reporterName && <p className="text-xs text-red-500 mt-1">{errors.reporterName.message}</p>}
                </div>
                <div>
                  <label className="form-label">สัญชาติ</label>
                  <select {...register('reporterNationality')} className="form-input">
                    <option value="ไทย">ไทย</option>
                    <option value="จีน">จีน</option>
                    <option value="ญี่ปุ่น">ญี่ปุ่น</option>
                    <option value="เกาหลี">เกาหลี</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                  <input {...register('reporterPhone', formValidations.phoneThai)} className="form-input" placeholder="0XX-XXX-XXXX" />
                  {errors.reporterPhone && <p className="text-xs text-red-500 mt-1">{errors.reporterPhone.message}</p>}
                </div>
                <div className="col-span-2">
                  <label className="form-label">อีเมล <span className="text-red-500">*</span></label>
                  <input
                    {...register('reporterEmail', formValidations.email)}
                    type="email"
                    className="form-input"
                    placeholder="email@example.com"
                  />
                  {errors.reporterEmail && <p className="text-xs text-red-500 mt-1">{errors.reporterEmail.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
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
                <CheckCircle2 size={16} /> บันทึกรายการ
              </button>
            )}
          </div>
        </form>
      </div>
    </PageWrapper>
  );
}
