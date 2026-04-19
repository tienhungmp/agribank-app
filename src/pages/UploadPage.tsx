import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Trash2, 
  History, 
  Database, 
  Building2, 
  ArrowRight, 
  Check, 
  Calculator,
  Search,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const ACCOUNT_TYPES = [
  { "code": "361909", "name": "Các khoản phải thu chi thưởng", "category": "account" },
  { "code": "484101", "name": "Quỹ khen thưởng", "category": "account" },
  { "code": "484201", "name": "Quỹ phúc lợi", "category": "account" },
  { "code": "851101", "name": "Lương và phụ cấp lương cơ bản", "category": "account" },
  { "code": "851102", "name": "Thù lao theo hiệu quả công việc", "category": "account" },
  { "code": "462001", "name": "Các khoản phải trả cho cán bộ, NV", "category": "account" },
  { "code": "891001", "name": "Các khoản chi có tính chất phúc lợi", "category": "account" },
  { "code": "ALLOW_DOC_HAI", "name": "Độc hại kho quỹ", "category": "allowance" },
  { "code": "ALLOW_KHU_VUC", "name": "Phụ cấp khu vực", "category": "allowance" },
  { "code": "ALLOW_BH", "name": "BH bắt buộc", "category": "allowance" },
  { "code": "ALLOW_TU_THIEN", "name": "Từ thiện", "category": "allowance" },
  { "code": "DEDUCT_PERSONAL", "name": "Giảm trừ cá nhân", "category": "deduction" },
  { "code": "DEDUCT_DEPENDENT", "name": "Giảm trừ NPT", "category": "deduction" },
  { "code": "OTHER", "name": "Khác / Không tính thuế", "category": "other" }
];

type Stage = 'upload' | 'map' | 'success';

export default function UploadPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('upload');
  
  // Selection State
  const [file, setFile] = useState<File | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  // Mapping State
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [mappedRows, setMappedRows] = useState<any[]>([]);
  
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

  const handlePreview = async () => {
    if (!file) return toast.error('Vui lòng chọn file');
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('month', month.toString());
    formData.append('year', year.toString());

    try {
      const res = await api.post('/upload/excel', formData);
      const rows = res.data.rows.map((r: any) => ({
        ...r,
        categoryCode: r.suggestedCategory || 'OTHER'
      }));
      setPreviewRows(rows);
      setMappedRows(rows);
      setStage('map');
      toast.success('File đã tải lên, vui lòng kiểm tra phân loại!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi xử lý file');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = (index: number, code: string) => {
    const updated = [...mappedRows];
    updated[index].categoryCode = code;
    setMappedRows(updated);
  };

  const handleBulkChange = (code: string) => {
    const updated = mappedRows.map(r => ({ ...r, categoryCode: code }));
    setMappedRows(updated);
    toast.success(`Đã áp dụng ${code} cho tất cả các dòng`);
  };

  const handleProcess = async () => {
    setLoading(true);
    try {
      const res = await api.post('/transactions/bulk', {
        rows: mappedRows,
        month,
        year
      });
      setResult(res.data);
      setStage('success');
      toast.success('Đã lưu dữ liệu và tính toán xong!');
      fetchHistory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi lưu dữ liệu');
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

  const reset = () => {
    setStage('upload');
    setFile(null);
    setPreviewRows([]);
    setMappedRows([]);
    setResult(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Progress Stepper */}
      <div className="flex items-center justify-center gap-4 mb-12">
        {[
          { id: 'upload', icon: Upload, label: 'Chọn File' },
          { id: 'map', icon: Calculator, label: 'Kiểm tra & Phân loại' },
          { id: 'success', icon: CheckCircle2, label: 'Hoàn tất' }
        ].map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={`flex flex-col items-center gap-2 ${stage === s.id ? 'text-agribank-maroon' : 'text-gray-300'}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                stage === s.id ? 'bg-agribank-maroon text-white shadow-xl shadow-agribank-maroon/20 scale-110' : 'bg-white border-2 border-gray-100'
              }`}>
                <s.icon size={22} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
            </div>
            {i < 2 && <div className={`w-12 h-0.5 rounded-full ${stage === s.id || (stage === 'map' && i === 0) || stage === 'success' ? 'bg-agribank-maroon/30' : 'bg-gray-100'}`} />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {stage === 'upload' && (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-8"
          >
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-4 bg-agribank-maroon/10 text-agribank-maroon rounded-[24px]">
                    <FileText size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-800 tracking-tighter">Bắt đầu Phân tích</h3>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Chọn thời kỳ và file dữ liệu nguồn</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-8 mb-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Tháng kết chuyển</label>
                    <select 
                      className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[20px] outline-none focus:ring-4 focus:ring-agribank-maroon/10 focus:bg-white transition-all font-black text-gray-700 shadow-inner appearance-none"
                      value={month}
                      onChange={(e) => setMonth(parseInt(e.target.value))}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i+1} value={i+1}>Tháng {i+1}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Năm tài chính</label>
                    <select 
                      className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[20px] outline-none focus:ring-4 focus:ring-agribank-maroon/10 focus:bg-white transition-all font-black text-gray-700 shadow-inner appearance-none"
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value))}
                    >
                      {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                <div 
                  className={`border-[3px] border-dashed rounded-[40px] p-20 text-center transition-all group cursor-pointer relative ${
                    file ? 'border-agribank-maroon bg-agribank-maroon/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-8">
                    <div className={`p-8 rounded-[30px] shadow-2xl transition-all group-hover:scale-110 ${file ? 'bg-agribank-maroon text-white animate-bounce' : 'bg-white text-gray-300 border border-gray-100'}`}>
                      <Upload size={48} strokeWidth={2.5} />
                    </div>
                    {file ? (
                      <div className="space-y-3">
                        <p className="font-black text-gray-800 text-2xl tracking-tighter">{file.name}</p>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                          <Check size={14} className="text-green-500" /> {(file.size / 1024).toFixed(2)} KB • Sẵn sàng để phân tích
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="font-black text-gray-800 text-2xl tracking-tighter">Kéo thả File Excel vào đây</p>
                        <p className="max-w-[300px] text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] mx-auto leading-relaxed">Định dạng hỗ trợ: .xlsx, .xls • Tối đa 10MB • Cấu trúc chuẩn B-F</p>
                      </div>
                    )}
                  </label>
                  {file && (
                    <button 
                      onClick={() => setFile(null)}
                      className="absolute top-6 right-6 p-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                    >
                      <Trash2 size={24} />
                    </button>
                  )}
                </div>

                <button
                  onClick={handlePreview}
                  disabled={!file || loading}
                  className="w-full mt-10 py-6 bg-agribank-maroon hover:bg-agribank-maroon/90 text-white font-black rounded-[24px] shadow-2xl shadow-agribank-maroon/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 tracking-[0.2em] uppercase text-sm group"
                >
                  {loading ? 'ĐANG PHÂN TÍCH FILE...' : (
                    <>
                      TIẾP TỤC KIỂM TRA DỮ LIỆU
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full max-h-[800px]">
                <div className="p-8 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <History size={20} className="text-agribank-maroon" />
                    <h3 className="font-black text-gray-800 text-xs uppercase tracking-[0.2em]">Lịch sử Hoạt động</h3>
                  </div>
                  <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{history.length} THÁNG</span>
                </div>
                <div className="flex-1 overflow-auto divide-y divide-gray-50">
                  {Array.isArray(history) && history.map((item, idx) => (
                    <div key={idx} className="p-8 hover:bg-gray-50/50 transition-all group relative">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-black text-gray-800 text-lg tracking-tighter">Tháng {item.month} / {item.year}</p>
                          <div className="flex items-center gap-4 mt-2">
                             <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-lg">
                              <Building2 size={10} className="text-agribank-maroon" /> Chi nhánh {item.branchCode}
                            </span>
                            <span className="text-[9px] text-agribank-green font-black uppercase tracking-widest flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-lg">
                              {item.count} BẢN GHI
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteHistory(item)}
                          className="p-3 text-gray-200 hover:text-red-500 hover:bg-white rounded-xl transition-all shadow-none hover:shadow-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <p className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter truncate italic">Nguồn: {item.source}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-10 rounded-[32px] border border-gray-100 space-y-6">
                <h4 className="font-black text-gray-800 flex items-center gap-3 tracking-tighter text-lg">
                  <Calculator size={22} className="text-agribank-maroon" />
                  Cấu trúc File chuẩn
                </h4>
                <div className="space-y-4">
                  {[
                    { col: 'Cột B', label: 'Họ và tên' },
                    { col: 'Cột C', label: 'Số tài khoản (13 số)' },
                    { col: 'Cột D', label: 'Số tiền thống kê (khớp đúng)' },
                    { col: 'Cột E', label: 'Số tiền chịu thuế' },
                    { col: 'Cột F', label: 'Thời gian phát sinh' },
                    { col: 'Cột G', label: 'Nội dung chi tiết' }
                  ].map(spec => (
                    <div key={spec.col} className="flex items-center gap-4 p-4 bg-gray-50 rounded-[18px] border border-gray-100/50">
                      <span className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-xs text-agribank-maroon border border-gray-100 shadow-sm">{spec.col}</span>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">{spec.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {stage === 'map' && (
          <motion.div 
            key="map"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-8"
          >
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tighter">Kiểm soát & Phân loại ({mappedRows.length} dòng)</h3>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Vui lòng xác nhận loại tài khoản cho từng giao dịch</p>
                </div>
                <div className="flex gap-4">
                   <div className="relative group">
                    <select 
                      className="appearance-none p-4 pr-12 bg-agribank-maroon/5 border border-agribank-maroon/20 rounded-2xl outline-none focus:ring-4 focus:ring-agribank-maroon/10 font-black text-[10px] text-agribank-maroon uppercase tracking-widest cursor-pointer"
                      onChange={(e) => handleBulkChange(e.target.value)}
                    >
                      <option value="">ÁP DỤNG NHANH CHO TẤT CẢ...</option>
                      {ACCOUNT_TYPES.map(t => (
                        <option key={t.code} value={t.code}>{t.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-agribank-maroon pointer-events-none" />
                  </div>
                  <button 
                    onClick={() => setStage('upload')}
                    className="p-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    HỦY BỎ
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-[24px] border border-gray-100">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-5">Họ và tên / Tài khoản</th>
                      <th className="px-6 py-5">Số tiền Thống kê / Thuế</th>
                      <th className="px-6 py-5">Nội dung / Thời gian</th>
                      <th className="px-6 py-5 w-[300px]">Loại tài khoản (DROPLIST)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {mappedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-5">
                          <p className="font-black text-gray-800 tracking-tight text-sm">{row.fullName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{row.accountNumber}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-[9px] text-gray-400 font-black uppercase mb-1">Thống kê:</p>
                          <p className="font-mono font-bold text-gray-500 text-xs mb-2">{(row.amountStat || 0).toLocaleString('vi-VN')} ₫</p>
                          <p className="text-[9px] text-agribank-maroon font-black uppercase mb-1">Chịu thuế:</p>
                          <p className="font-mono font-black text-agribank-maroon text-sm">{row.amountTaxable.toLocaleString('vi-VN')} ₫</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-xs font-bold text-gray-600 leading-tight line-clamp-2">{row.content}</p>
                          <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter mt-1">{row.dateOccurred}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="relative">
                            <select 
                              className={`w-full p-4 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-agribank-maroon font-bold text-xs appearance-none transition-all ${
                                row.categoryCode === 'OTHER' ? 'bg-gray-100 text-gray-400 border-transparent' : 'bg-agribank-maroon/5 text-agribank-maroon border-agribank-maroon/20'
                              }`}
                              value={row.categoryCode}
                              onChange={(e) => handleUpdateCategory(idx, e.target.value)}
                            >
                              {ACCOUNT_TYPES.map(t => (
                                <option key={t.code} value={t.code}>{t.name}</option>
                              ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-current opacity-50 pointer-events-none" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-12 flex justify-center">
                <button
                  onClick={handleProcess}
                  disabled={loading}
                  className="px-20 py-6 bg-agribank-green hover:bg-agribank-green/90 text-white font-black rounded-[24px] shadow-2xl shadow-agribank-green/30 transition-all disabled:opacity-50 flex items-center justify-center gap-4 tracking-[0.2em] uppercase text-sm group"
                >
                  {loading ? 'ĐANG LƯU DỮ LIỆU...' : (
                    <>
                      <CheckCircle2 size={24} />
                      BẮT ĐẦU TÍNH TOÁN & XUẤT BÁO CÁO
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {stage === 'success' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white p-20 rounded-[50px] shadow-2xl border border-gray-100 text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-agribank-green"></div>
               <div className="w-32 h-32 bg-green-50 text-agribank-green rounded-[40px] flex items-center justify-center mx-auto mb-10 border-4 border-green-100/50 shadow-inner">
                <Check size={64} strokeWidth={3} />
               </div>
               <h3 className="text-4xl font-black text-gray-800 tracking-tighter mb-4">Hoàn tất Tính toán!</h3>
               <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs mb-12">Dữ liệu đã được phân tích và lưu vào hệ thống</p>
               
               <div className="grid grid-cols-2 gap-8 mb-16">
                 <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Số giao dịch xử lý</p>
                    <p className="text-4xl font-black text-gray-800 tracking-tight">{result?.successCount}</p>
                 </div>
                 <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Trạng thái báo cáo</p>
                    <p className="text-4xl font-black text-agribank-green tracking-tight">SẴN SÀNG</p>
                 </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-6 justify-center">
                 <button 
                  onClick={() => navigate('/income')}
                  className="px-10 py-5 bg-agribank-maroon text-white font-black rounded-2xl shadow-xl shadow-agribank-maroon/20 tracking-widest uppercase text-[10px] group flex items-center justify-center gap-3"
                 >
                   XEM BÁO CÁO CHI TIẾT
                   <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                 </button>
                 <button 
                  onClick={reset}
                  className="px-10 py-5 bg-white border-2 border-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-50 tracking-widest uppercase text-[10px]"
                 >
                   TIẾP TỤC TẢI FILE KHÁC
                 </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
