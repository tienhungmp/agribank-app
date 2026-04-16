import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Settings, Save, Info, AlertTriangle } from 'lucide-react';

export default function ConfigPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get('/config/tax');
        setConfigs(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/config/tax', { configs });
      toast.success('Cập nhật cấu hình thành công!');
    } catch (err) {
      toast.error('Lỗi khi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  const updateValue = (key: string, value: string) => {
    setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: parseFloat(value) || 0 } : c));
  };

  if (loading) return <div className="p-10 text-center">Đang tải...</div>;

  const personal = configs.find(c => c.key === 'deduct_personal')?.value || 0;
  const dependent = configs.find(c => c.key === 'deduct_dependent')?.value || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-agribank-maroon/10 text-agribank-maroon rounded-2xl border border-agribank-maroon/10 shadow-inner">
              <Settings size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">Giảm trừ Gia cảnh</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Cấu hình mức giảm trừ hàng tháng</p>
            </div>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-agribank-maroon text-white rounded-2xl font-black hover:bg-agribank-maroon/90 transition-all disabled:opacity-50 shadow-xl shadow-agribank-maroon/20 tracking-widest uppercase text-sm"
          >
            <Save size={20} /> {saving ? 'Đang lưu...' : 'LƯU THAY ĐỔI'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Giảm trừ bản thân (VND/tháng)</label>
            <input 
              type="number"
              className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-mono text-xl font-black text-agribank-maroon focus:ring-2 focus:ring-agribank-maroon focus:bg-white outline-none transition-all shadow-inner"
              value={personal}
              onChange={(e) => updateValue('deduct_personal', e.target.value)}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Giảm trừ người phụ thuộc (VND/tháng)</label>
            <input 
              type="number"
              className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-mono text-xl font-black text-agribank-maroon focus:ring-2 focus:ring-agribank-maroon focus:bg-white outline-none transition-all shadow-inner"
              value={dependent}
              onChange={(e) => updateValue('deduct_dependent', e.target.value)}
            />
          </div>
        </div>

        <div className="mt-10 p-8 bg-blue-50/50 rounded-3xl border border-blue-100 flex gap-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
          <div className="text-blue-500 shrink-0 mt-1"><Info size={28} /></div>
          <div className="flex-1">
            <h4 className="font-black text-blue-800 text-xs uppercase tracking-widest mb-4">Bảng tính toán nhanh (VND):</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[0, 1, 2, 3].map(n => (
                <div key={n} className="bg-white/80 p-4 rounded-2xl border border-blue-100 shadow-sm">
                  <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">{n} NPT</p>
                  <p className="text-sm font-mono font-black text-blue-900">{(personal + n * dependent).toLocaleString('vi-VN')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-4 mb-8">
          <h3 className="text-2xl font-black text-gray-800 tracking-tight">Biểu thuế lũy tiến</h3>
          <span className="px-3 py-1 bg-agribank-maroon/10 text-agribank-maroon text-[10px] font-black rounded-full uppercase tracking-widest border border-agribank-maroon/10">Quy định hiện hành</span>
        </div>
        <div className="overflow-hidden border border-gray-50 rounded-2xl shadow-inner">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">Bậc</th>
                <th className="px-8 py-5">TNTT / Tháng</th>
                <th className="px-8 py-5">TNTT / Năm</th>
                <th className="px-8 py-5 text-right">Thuế suất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {[
                { bậc: 1, tháng: 'Đến 5 triệu', năm: 'Đến 60 triệu', suất: '5%' },
                { bậc: 2, tháng: 'Trên 5 - 10 triệu', năm: 'Trên 60 - 120 triệu', suất: '10%' },
                { bậc: 3, tháng: 'Trên 10 - 18 triệu', năm: 'Trên 120 - 216 triệu', suất: '15%' },
                { bậc: 4, tháng: 'Trên 18 - 32 triệu', năm: 'Trên 216 - 384 triệu', suất: '20%' },
                { bậc: 5, tháng: 'Trên 32 - 52 triệu', năm: 'Trên 384 - 624 triệu', suất: '25%' },
                { bậc: 6, tháng: 'Trên 52 - 80 triệu', năm: 'Trên 624 - 960 triệu', suất: '30%' },
                { bậc: 7, tháng: 'Trên 80 triệu', năm: 'Trên 960 triệu', suất: '35%' },
              ].map((row) => (
                <tr key={row.bậc} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5 font-black text-gray-800">{row.bậc}</td>
                  <td className="px-8 py-5 font-bold text-gray-600">{row.tháng}</td>
                  <td className="px-8 py-5 font-bold text-gray-400">{row.năm}</td>
                  <td className="px-8 py-5 text-right text-agribank-maroon font-black text-lg">{row.suất}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex items-center gap-3 text-[10px] text-orange-600 font-black uppercase tracking-widest bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
          <AlertTriangle size={18} />
          <span>Biểu thuế này được cấu hình mặc định theo quy định hiện hành của Agribank & Bộ Tài Chính.</span>
        </div>
      </div>
    </div>
  );
}
