import React, { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Upload, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

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
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi upload');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Tải lên Dữ liệu Thu nhập</h3>
        
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Tháng</label>
            <select 
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-agribank-maroon focus:bg-white transition-all font-bold text-gray-700"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i+1} value={i+1}>Tháng {i+1}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Năm</label>
            <select 
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-agribank-maroon focus:bg-white transition-all font-bold text-gray-700"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
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
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-black text-gray-800 text-lg tracking-tight">Kéo thả hoặc Click để chọn file Excel</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hỗ trợ định dạng .xlsx, .xls (Tối đa 10MB)</p>
              </div>
            )}
          </label>
          {file && (
            <button 
              onClick={() => setFile(null)}
              className="mt-6 text-red-500 text-xs font-black hover:underline flex items-center gap-2 mx-auto uppercase tracking-widest"
            >
              <X size={16} /> Xóa file hiện tại
            </button>
          )}
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full mt-10 py-5 bg-agribank-maroon hover:bg-agribank-maroon/90 text-white font-black rounded-2xl shadow-xl shadow-agribank-maroon/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 tracking-widest uppercase text-sm"
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
              <p className="text-xs font-black text-gray-700 flex items-center gap-2 uppercase tracking-widest">
                <AlertCircle size={18} className="text-red-500" />
                Danh sách lỗi chi tiết:
              </p>
              <div className="max-h-60 overflow-auto bg-red-50/50 p-6 rounded-2xl border border-red-100 text-xs text-red-700 font-mono space-y-2 leading-relaxed">
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

      <div className="bg-agribank-maroon/5 p-8 rounded-3xl border border-agribank-maroon/10">
        <h4 className="font-black text-agribank-maroon flex items-center gap-3 mb-4 tracking-tight">
          <FileText size={20} />
          Lưu ý định dạng file Excel:
        </h4>
        <ul className="text-sm text-gray-600 space-y-3 font-medium">
          <li className="flex gap-3">
            <span className="w-1.5 h-1.5 bg-agribank-maroon rounded-full mt-1.5 shrink-0"></span>
            <span>File phải có 8 cột theo đúng thứ tự mẫu quy định của Agribank.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-1.5 h-1.5 bg-agribank-maroon rounded-full mt-1.5 shrink-0"></span>
            <span>Cột C (Số tài khoản) phải có 13 chữ số (định dạng text hoặc số).</span>
          </li>
          <li className="flex gap-3">
            <span className="w-1.5 h-1.5 bg-agribank-maroon rounded-full mt-1.5 shrink-0"></span>
            <span>Cột D (Số người phụ thuộc) phải là số nguyên dương (0, 1, 2...).</span>
          </li>
          <li className="flex gap-3">
            <span className="w-1.5 h-1.5 bg-agribank-maroon rounded-full mt-1.5 shrink-0"></span>
            <span>Cột F (Số tiền chịu thuế) là căn cứ chính để tính toán thuế TNCN.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
