import React, { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FileDown, Calendar, Building2, Download, Eye } from 'lucide-react';

export default function ExportPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await api.get('/export/monthly', {
        params: { month, year },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BKTN_Thang${month}_Nam${year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Đang tải file...');
    } catch (err) {
      toast.error('Lỗi khi tải file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-agribank-maroon/10 text-agribank-maroon rounded-2xl border border-agribank-maroon/10 shadow-inner">
            <FileDown size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-800 tracking-tight">Xuất Báo cáo Thuế</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Bảng kê thu nhập & Thuế TNCN</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Tháng báo cáo</label>
              <select 
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-agribank-maroon focus:bg-white transition-all font-black text-gray-700 shadow-inner appearance-none cursor-pointer"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i+1} value={i+1}>Tháng {i+1}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Năm báo cáo</label>
              <select 
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-agribank-maroon focus:bg-white transition-all font-black text-gray-700 shadow-inner appearance-none cursor-pointer"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
          </div>

          <div className="p-6 bg-agribank-gold/10 rounded-2xl border border-agribank-gold/20 text-[10px] text-agribank-maroon font-black uppercase tracking-widest flex gap-4 items-center">
            <div className="p-2 bg-agribank-gold/20 rounded-xl shrink-0">
              <Calendar size={20} />
            </div>
            <p className="leading-relaxed">File xuất ra sẽ bao gồm đầy đủ 28 cột theo mẫu chuẩn của Agribank, bao gồm chi tiết các khoản thu nhập, giảm trừ và thuế TNCN đã tính toán.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button 
              className="flex-1 flex items-center justify-center gap-3 py-5 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
            >
              <Eye size={22} /> XEM TRƯỚC
            </button>
            <button 
              onClick={handleDownload}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-3 py-5 bg-agribank-maroon text-white font-black rounded-2xl hover:bg-agribank-maroon/90 shadow-xl shadow-agribank-maroon/20 transition-all disabled:opacity-50 uppercase tracking-widest text-xs"
            >
              <Download size={22} /> {loading ? 'ĐANG XỬ LÝ...' : 'TẢI XUỐNG EXCEL'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
