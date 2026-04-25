import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginForm {
  username: string;
  password: string;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError('');
    const ok = await login(data.username, data.password);
    if (ok) navigate('/');
    else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">CNI</span>
          </div>
          <span className="text-white font-semibold text-lg">ClickNext Innovation</span>
        </div>

        <div>
          <h1 className="text-5xl font-bold text-white leading-tight mb-4">
            Lost & Found<br />Management
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            ระบบบริหารจัดการทรัพย์สินที่ถูกพบและสูญหาย<br />
            เพิ่มประสิทธิภาพการให้บริการด้วย RFID Technology
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { n: '240', u: 'วันโครงการ' },
            { n: 'RFID', u: 'Technology' },
            { n: '24/7', u: 'Monitoring' },
          ].map(s => (
            <div key={s.n} className="bg-white/10 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{s.n}</div>
              <div className="text-white/60 text-xs mt-1">{s.u}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CNI</span>
            </div>
            <span className="font-bold text-gray-900">Lost & Found System</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">เข้าสู่ระบบ</h2>
                <p className="text-sm text-gray-400">กรุณากรอกข้อมูลเพื่อเข้าใช้งาน</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="form-label">ชื่อผู้ใช้งาน</label>
                <input
                  {...register('username', { required: 'กรุณากรอกชื่อผู้ใช้งาน' })}
                  className="form-input"
                  placeholder="username"
                  autoComplete="username"
                />
                {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
              </div>

              <div>
                <label className="form-label">รหัสผ่าน</label>
                <div className="relative">
                  <input
                    {...register('password', { required: 'กรุณากรอกรหัสผ่าน' })}
                    type={showPw ? 'text' : 'password'}
                    className="form-input pr-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <LogIn size={16} />
                )}
                เข้าสู่ระบบ
              </button>
            </form>

            {/* Demo accounts */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2 font-medium">บัญชีทดสอบ</p>
              <div className="space-y-1.5">
                {[
                  { u: 'admin', p: 'admin123', r: 'ผู้ดูแลระบบ' },
                  { u: 'staff01', p: 'staff123', r: 'เจ้าหน้าที่' },
                  { u: 'viewer01', p: 'view123', r: 'ผู้ดูระบบ' },
                ].map(a => (
                  <div key={a.u} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-mono">{a.u} / {a.p}</span>
                    <span className="text-gray-400">{a.r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
