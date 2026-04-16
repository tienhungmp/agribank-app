import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Trash2, History, Database, Building2 } from 'lucide-react';

export default function UploadPage() {
  const { isAdmin } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/upload/history');
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return toast.error('Vui lòng chọn file');
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('month', month.toString());
    formData.append('year', year.toString());

    try {
      const res = await api.post('/upload/excel', formData);
      setResult(res.data);
      toast.success('Upload thành công!');
      setFile(null);
      fetchHistory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi upload');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (item: any) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa dữ liệu tháng ${item.month}/${item.year} của chi nhánh ${item.branchCode}?`)) return;
    
    try {
      await api.delete('/transactions', { 
        params: { month: item.month, year: item.year, branchCode: item.branchCode } 
      });
      toast.success('Đã xóa dữ liệu thành công');
      fetchHistory();
    } catch (err) {
      toast.error('Lỗi khi xóa dữ liệu');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-agribank-maroon/10 text-agribank-maroon rounded-2xl border border-agribank-maroon/10 shadow-inner">
                <Upload size={24} />
              </div>
              <h3 className="text-xl font-black text-gray-800 tracking-tight">Tải lên Dữ liệu Thu nhập</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tháng</label>
                <select 
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-agribank-maroon focus:bg-white transition-all font-black text-gray-700 shadow-inner"
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i+1} value={i+1}>Tháng {i+1}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Năm</label>
                <select 
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-agribank-maroon focus:bg-white transition-all font-black text-gray-700 shadow-inner"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                >
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div 
              className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all group cursor-pointer ${
                file ? 'border-agribank-maroon bg-agribank-maroon/5' : 'border-gray-200 hover:border-agribank-maroon/50 hover:bg-gray-50'
              }`}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-6">
                <div className={`p-6 rounded-2xl shadow-lg transition-all group-hover:scale-110 ${file ? 'bg-agribank-maroon text-white' : 'bg-white text-gray-300 border border-gray-100'}`}>
                  <Upload size={40} />
                </div>
                {file ? (
                  <div className="space-y-2">
                    <p className="font-black text-gray-800 text-lg tracking-tight">{file.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-black text-gray-800 text-lg tracking-tight">Kéo thả hoặc Click để chọn file Excel</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hỗ trợ định dạng .xlsx, .xls (Tối đa 10MB)</p>
                  </div>
                )}
              </label>
              {file && (
                <button 
                  onClick={() => setFile(null)}
                  className="mt-6 text-red-500 text-[10px] font-black hover:underline flex items-center gap-2 mx-auto uppercase tracking-widest"
                >
                  <X size={16} /> Xóa file hiện tại
                </button>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full mt-10 py-5 bg-agribank-maroon hover:bg-agribank-maroon/90 text-white font-black rounded-2xl shadow-xl shadow-agribank-maroon/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 tracking-widest uppercase text-xs"
            >
              {loading ? 'Đang xử lý dữ liệu...' : (
                <>
                  <Upload size={20} />
                  BẮT ĐẦU TẢI LÊN HỆ THỐNG
                </>
              )}
            </button>
          </div>

          {result && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-green-50 text-green-600 rounded-2xl border border-green-100">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-xl font-black text-gray-800 tracking-tight">Kết quả Xử lý Dữ liệu</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 group hover:border-green-200 transition-colors">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2">Thành công</p>
                  <p className="text-3xl font-black text-green-600 tracking-tight">{result.successCount} <span className="text-sm font-bold text-gray-400">dòng</span></p>
                </div>
                <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 group hover:border-red-200 transition-colors">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2">Lỗi / Cảnh báo</p>
                  <p className="text-3xl font-black text-red-500 tracking-tight">{result.errorLogs.length} <span className="text-sm font-bold text-gray-400">dòng</span></p>
                </div>
              </div>

              {result.errorLogs.length > 0 && (
                <div className="mt-8 space-y-3">
                  <p className="text-[10px] font-black text-gray-700 flex items-center gap-2 uppercase tracking-widest">
                    <AlertCircle size={18} className="text-red-500" />
                    Danh sách lỗi chi tiết:
                  </p>
                  <div className="max-h-60 overflow-auto bg-red-50/50 p-6 rounded-2xl border border-red-100 text-[10px] text-red-700 font-mono space-y-2 leading-relaxed">
                    {result.errorLogs.map((log: string, i: number) => (
                      <p key={i} className="flex gap-2">
                        <span className="opacity-50">[{i+1}]</span>
                        <span>{log}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full max-h-[800px]">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
              <History size={20} className="text-agribank-maroon" />
              <h3 className="font-black text-gray-800 text-xs uppercase tracking-widest">Lịch sử Dữ liệu</h3>
            </div>
            <div className="flex-1 overflow-auto divide-y divide-gray-50">
              {Array.isArray(history) && history.map((item, idx) => (
                <div key={idx} className="p-6 hover:bg-gray-50 transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-black text-gray-800 text-sm tracking-tight">Tháng {item.month} / {item.year}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1 flex items-center gap-1">
                        <Building2 size={12} /> Chi nhánh {item.branchCode}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDeleteHistory(item)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Xóa dữ liệu này"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-agribank-green w-full opacity-50"></div>
                    </div>
                    <span className="text-[10px] font-black text-agribank-green uppercase tracking-widest">{item.count} bản ghi</span>
                  </div>
                  <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-tighter truncate italic">Nguồn: {item.source}</p>
                </div>
              ))}
              {history.length === 0 && (
                <div className="p-16 text-center text-gray-400 font-bold italic text-sm">Chưa có dữ liệu tải lên</div>
              )}
            </div>
          </div>

          <div className="bg-agribank-maroon/5 p-8 rounded-3xl border border-agribank-maroon/10">
            <h4 className="font-black text-agribank-maroon flex items-center gap-3 mb-4 tracking-tight text-sm">
              <FileText size={18} />
              Lưu ý định dạng file:
            </h4>
            <ul className="text-[11px] text-gray-600 space-y-3 font-bold leading-relaxed">
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 bg-agribank-maroon rounded-full mt-1.5 shrink-0"></span>
                <span>Cột B: Họ và tên</span>
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 bg-agribank-maroon rounded-full mt-1.5 shrink-0"></span>
                <span>Cột C: Số tài khoản (13 số)</span>
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 bg-agribank-maroon rounded-full mt-1.5 shrink-0"></span>
                <span>Cột D: Số người phụ thuộc</span>
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 bg-agribank-maroon rounded-full mt-1.5 shrink-0"></span>
                <span>Cột F: Số tiền chịu thuế</span>
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 bg-agribank-maroon rounded-full mt-1.5 shrink-0"></span>
                <span>Cột H: Diễn giải (để phân loại nguồn)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
