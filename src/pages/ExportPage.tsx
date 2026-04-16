import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FileDown, Calendar, Building2, Download, Eye, CheckCircle2 } from 'lucide-react';

export default function ExportPage() {
  const { isAdmin } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [branchCode, setBranchCode] = useState('');
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchBranches();
    }
  }, [isAdmin]);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const params: any = { year };
      if (!isYearly) params.month = month;
      if (isAdmin && branchCode) params.branchCode = branchCode;

      const response = await api.get('/export/monthly', {
        params,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `${branchCode || 'BKTN'}_${isYearly ? `Nam${year}` : `Thang${month}_Nam${year}`}.xlsx`;
      link.setAttribute('download', fileName);
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
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-agribank-maroon/10 text-agribank-maroon rounded-2xl border border-agribank-maroon/10 shadow-inner">
              <FileDown size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">Xuất Báo cáo Thuế</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Bảng kê thu nhập & Thuế TNCN</p>
            </div>
          </div>
          
          <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
            <button 
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isYearly ? 'bg-white text-agribank-maroon shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Theo Tháng
            </button>
            <button 
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isYearly ? 'bg-white text-agribank-maroon shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Theo Năm
            </button>
          </div>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {!isYearly && (
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
            )}
            <div className={`space-y-3 ${isYearly ? 'sm:col-span-2' : ''}`}>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Năm báo cáo</label>
              <select 
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-agribank-maroon focus:bg-white transition-all font-black text-gray-700 shadow-inner appearance-none cursor-pointer"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {isAdmin && (
              <div className="sm:col-span-2 space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Chi nhánh xuất báo cáo</label>
                <select 
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-agribank-maroon focus:bg-white transition-all font-black text-gray-700 shadow-inner appearance-none cursor-pointer"
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                >
                  <option value="">Tất cả chi nhánh (Tổng hợp)</option>
                  {branches.map(b => (
                    <option key={b.code} value={b.code}>{b.code} - {b.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="p-8 bg-agribank-maroon/5 rounded-3xl border border-agribank-maroon/10 space-y-4">
            <h4 className="text-xs font-black text-agribank-maroon uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 size={18} /> Thông tin báo cáo:
            </h4>
            <ul className="text-xs text-gray-600 space-y-3 font-bold leading-relaxed">
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 bg-agribank-maroon rounded-full mt-1.5 shrink-0"></span>
                <span>Báo cáo bao gồm đầy đủ 28 cột theo mẫu chuẩn của Agribank.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 bg-agribank-maroon rounded-full mt-1.5 shrink-0"></span>
                <span>Dữ liệu được tổng hợp {isYearly ? `cả năm ${year}` : `tháng ${month}/${year}`}.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 bg-agribank-maroon rounded-full mt-1.5 shrink-0"></span>
                <span>Phân tách dữ liệu theo từng chi nhánh riêng biệt nếu được chọn.</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
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
