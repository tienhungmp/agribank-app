import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Lock, User, Eye, EyeOff } from 'lucide-react';

const Logo = ({ className = "w-10 h-10" }) => (
  <div className={`relative ${className} bg-agribank-maroon rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white/20 shadow-xl`}>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-full h-full grid grid-cols-2 grid-rows-2">
        <div className="bg-agribank-green"></div>
        <div className="bg-agribank-maroon"></div>
        <div className="bg-agribank-maroon"></div>
        <div className="bg-agribank-green"></div>
      </div>
    </div>
    <div className="relative z-10 w-2/3 h-2/3 flex items-center justify-center">
      <div className="w-1.5 h-full bg-agribank-gold rotate-45 rounded-full shadow-sm"></div>
      <div className="absolute w-full h-1.5 bg-agribank-gold -rotate-45 rounded-full shadow-sm"></div>
    </div>
  </div>
);

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      login(res.data.token, res.data.user);
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-agribank-maroon/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-agribank-green/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col relative z-10 border border-gray-100">
        <div className="bg-agribank-maroon p-10 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          </div>
          
          <Logo className="w-20 h-20 mx-auto mb-6" />
          <h1 className="text-3xl font-black tracking-tighter">AGRIBANK</h1>
          <p className="text-agribank-gold font-bold text-xs uppercase tracking-[0.2em] mt-2 opacity-90">Phú Yên - Quản lý Thuế TNCN</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tên đăng nhập</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-agribank-maroon transition-colors" size={20} />
              <input
                type="text"
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-agribank-maroon focus:bg-white focus:border-transparent outline-none transition-all font-medium"
                placeholder="Nhập username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Mật khẩu</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-agribank-maroon transition-colors" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-agribank-maroon focus:bg-white focus:border-transparent outline-none transition-all font-medium"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-agribank-maroon transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-agribank-maroon hover:bg-agribank-maroon/90 text-white font-black rounded-2xl shadow-xl shadow-agribank-maroon/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] tracking-widest uppercase text-sm"
          >
            {loading ? 'Đang xử lý...' : 'ĐĂNG NHẬP HỆ THỐNG'}
          </button>
          
          <div className="text-center pt-4">
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">© 2024 Agribank Phú Yên. All rights reserved.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
