import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  Clock, 
  Search, 
  ChevronRight, 
  User, 
  Calendar, 
  FileText, 
  ArrowLeft,
  Users as UsersIcon,
  CheckCircle2,
  Filter,
  FileDown,
  Download,
  Building2,
  ListFilter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const ACCOUNT_TYPES: Record<string, string> = {
  "851101": "Lương V1 (Cơ bản)",
  "851102": "Thù lao hiệu quả CV",
  "462001": "Các khoản phải trả cho CB, NV",
  "484101": "Quỹ khen thưởng",
  "484201": "Quỹ phúc lợi",
  "891001": "Chi có tính chất phúc lợi",
  "361909": "Các khoản phải thu chi thưởng",
  "ALLOW_DOC_HAI": "Độc hại kho quỹ",
  "ALLOW_KHU_VUC": "Phụ cấp khu vực",
  "ALLOW_BH": "BH Bắt buộc",
  "ALLOW_TU_THIEN": "Từ thiện",
  "DEDUCT_PERSONAL": "Giảm trừ cá nhân",
  "DEDUCT_DEPENDENT": "Giảm trừ NPT",
  "OTHER": "Khác / Không tính thuế"
};

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<'batches' | 'employees' | 'reports'>('batches');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [batchDetails, setBatchDetails] = useState<any[]>([]);
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [year, setYear] = useState<number>(new Date().getFullYear());
  
  const [empSearch, setEmpSearch] = useState('');
  const [empHistory, setEmpHistory] = useState<any[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);

  // Stats / Reports state
  const [reportBranch, setReportBranch] = useState('all');
  const [reportCategory, setReportCategory] = useState('all');
  const [reportData, setReportData] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (activeTab === 'batches') {
      fetchLogs();
    } else if (activeTab === 'reports') {
      fetchReport();
    }
  }, [activeTab, month, year, reportBranch, reportCategory]);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = { year };
      if (month !== 'all') params.month = month;
      const res = await api.get('/history/uploads', { params });
      setLogs(res.data);
    } catch (err) {
      toast.error('Lỗi khi tải lịch sử');
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = { month, year, branchCode: reportBranch, categoryCode: reportCategory };
      const res = await api.get('/stats/income-details', { params });
      setReportData(res.data);
    } catch (err) {
      toast.error('Lỗi khi tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcelBase = (data: any[], filename: string, title: string) => {
    const wsData: any[] = data.map((item, index) => ({
      "STT": index + 1,
      "Họ và Tên": item.fullName,
      "Số tài khoản": item.accountNumber,
      "Loại thu nhập": ACCOUNT_TYPES[item.categoryCode] || item.categoryCode,
      "Số tiền (VNĐ)": item.amountTaxable,
      "Tháng": item.month,
      "Năm": item.year,
      "Chi nhánh": item.branchCode,
      "Nội dung": item.description
    }));

    const total = data.reduce((sum, item) => sum + parseFloat(item.amountTaxable), 0);
    wsData.push({
      "STT": "",
      "Họ và Tên": "TỔNG CỘNG",
      "Số tài khoản": "",
      "Loại thu nhập": "",
      "Số tiền (VNĐ)": total,
      "Tháng": "",
      "Năm": "",
      "Chi nhánh": "",
      "Nội dung": ""
    });

    const worksheet = XLSX.utils.json_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo");

    // Formatting column widths
    const wscols = [
      { wch: 5 },  // STT
      { wch: 30 }, // Họ tên
      { wch: 20 }, // STK
      { wch: 25 }, // Loại
      { wch: 15 }, // Số tiền
      { wch: 8 },  // Tháng
      { wch: 8 },  // Năm
      { wch: 12 }, // Chi nhánh
      { wch: 40 }  // Nội dung
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `${filename}.xlsx`);
    toast.success('Đã xuất file excel thành công');
  };

  const fetchBatchDetails = async (log: any) => {
    setLoading(true);
    try {
      const res = await api.get(`/history/uploads/${log.id}`);
      setSelectedBatch(log);
      setBatchDetails(res.data);
    } catch (err) {
      toast.error('Lỗi khi tải chi tiết');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmpHistory = async (id?: string) => {
    const searchId = id || empSearch;
    if (!searchId) return;
    setLoading(true);
    try {
      const res = await api.get(`/history/employee/${searchId}`);
      setEmpHistory(res.data);
      if (res.data.length > 0) {
          setSelectedEmp({ accountNumber: searchId, fullName: res.data[0].fullName || 'Cán bộ' });
          if (id) {
            setActiveTab('employees');
            setSelectedBatch(null);
            setEmpSearch(id);
          }
      } else {
          toast.error('Không tìm thấy lịch sử cho cán bộ này');
          setSelectedEmp(null);
      }
    } catch (err) {
      toast.error('Lỗi khi tải lịch sử cán bộ');
    } finally {
      setLoading(false);
    }
  };

  const renderBatches = () => (
    <div className="space-y-6">
      {/* Filter Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
          <button 
            className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${month === 'all' ? 'bg-agribank-maroon text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setMonth('all')}
          >
            Tất cả tháng
          </button>
          <select 
            className="bg-transparent font-black text-xs uppercase tracking-widest outline-none px-4 border-l border-gray-200"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="all">Chọn tháng</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i+1} value={String(i+1)}>Tháng {i+1}</option>
            ))}
          </select>
        </div>

        <select 
          className="p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-xs uppercase tracking-widest"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
        >
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <div className="flex items-center gap-3 ml-auto px-6 py-4 bg-agribank-maroon/5 text-agribank-maroon rounded-2xl border border-agribank-maroon/10">
          <Clock size={18} />
          <span className="font-black text-sm">{logs.length} Lần Upload</span>
        </div>
      </div>

      {!selectedBatch ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {logs.map((log) => (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={log.id}
              onClick={() => fetchBatchDetails(log)}
              className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-agribank-maroon/30 transition-all text-left group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-agribank-maroon/10 text-agribank-maroon rounded-2xl flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div className="text-right">
                   <span className="text-[10px] font-black bg-gray-50 text-gray-400 px-2 py-1 rounded uppercase tracking-tighter block mb-1">
                     {new Date(log.createdAt).toLocaleDateString('vi-VN')}
                   </span>
                   <span className="text-[8px] font-black text-gray-300 tracking-tighter uppercase">{log.branchCode === '4600' ? 'Hội sở' : `Chi nhánh ${log.branchCode}`}</span>
                </div>
              </div>
              
              <h4 className="font-black text-gray-800 tracking-tight text-lg leading-tight mb-2">Tháng {log.month}/{log.year}</h4>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Người upload: {log.uploadedBy}</p>
              
              <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                <div className="flex items-center gap-2">
                  <UsersIcon size={14} className="text-agribank-maroon" />
                  <span className="text-xs font-black text-gray-600">{log.recordCount} Bản ghi</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-agribank-maroon group-hover:translate-x-1 transition-all" />
              </div>
            </motion.button>
          ))}
          {logs.length === 0 && !loading && (
            <div className="col-span-full py-40 text-center opacity-30">
              <Clock size={80} className="mx-auto mb-6" />
              <h3 className="text-2xl font-black uppercase tracking-widest italic font-mono">Không có lịch sử upload</h3>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedBatch(null)}
              className="p-3 bg-white border border-gray-100 rounded-2xl text-agribank-maroon hover:bg-agribank-maroon hover:text-white transition-all shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h3 className="font-black text-xl text-gray-800">Chi tiết đợt Upload: Tháng {selectedBatch.month}/{selectedBatch.year}</h3>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Thời gian: {new Date(selectedBatch.createdAt).toLocaleString('vi-VN')}</p>
            </div>
            <button 
              onClick={() => exportToExcelBase(batchDetails, `Detail_Batch_${selectedBatch.id}`, `Báo cáo upload tháng ${selectedBatch.month}/${selectedBatch.year}`)}
              className="flex items-center gap-3 px-6 py-3 bg-green-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
            >
              <FileDown size={18} /> Xuất Excel
            </button>
          </div>

          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">
                  <tr>
                    <th className="px-8 py-6">Cán bộ</th>
                    <th className="px-8 py-6">Số tài khoản</th>
                    <th className="px-8 py-6">Loại khoản</th>
                    <th className="px-8 py-6 text-right">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {batchDetails.map((t, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-4">
                        <button 
                          onClick={() => fetchEmpHistory(t.accountNumber)}
                          className="flex items-center gap-4 text-left group/btn"
                        >
                          <div className="w-10 h-10 bg-agribank-maroon text-white rounded-xl flex items-center justify-center font-black text-sm shadow-sm group-hover/btn:scale-110 transition-transform">
                            {(t.fullName || '---').charAt(0)}
                          </div>
                          <div>
                            <span className="font-black text-gray-800 block leading-tight group-hover/btn:text-agribank-maroon">{t.fullName || '---'}</span>
                            <span className="text-[8px] font-black text-agribank-maroon/0 group-hover/btn:text-agribank-maroon/60 uppercase transition-all tracking-tighter">Xem lịch sử chi tiết →</span>
                          </div>
                        </button>
                      </td>
                      <td className="px-8 py-4 font-mono font-bold text-gray-500 text-xs">{t.accountNumber}</td>
                      <td className="px-8 py-4">
                        <span className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-full text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          {ACCOUNT_TYPES[t.categoryCode] || t.categoryCode}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right font-mono font-black text-gray-800">
                        {parseFloat(t.amountTaxable).toLocaleString()} ₫
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderEmployees = () => (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-6 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
          <input
            type="text"
            placeholder="Nhập số tài khoản (13 số) để tra cứu lịch sử..."
            className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-agribank-maroon focus:bg-white transition-all font-bold text-gray-700 shadow-inner"
            value={empSearch}
            onChange={(e) => setEmpSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchEmpHistory()}
          />
        </div>
        <button 
          onClick={() => fetchEmpHistory()}
          className="px-10 py-5 bg-agribank-maroon text-white rounded-2xl font-black hover:bg-agribank-maroon/90 transition-all shadow-xl shadow-agribank-maroon/20 uppercase text-xs tracking-widest whitespace-nowrap"
        >
          Tra cứu
        </button>
      </div>

      {selectedEmp && (
        <div className="space-y-8">
          <div className="flex items-center gap-6 p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-agribank-maroon text-white rounded-[24px] flex items-center justify-center text-4xl font-black shadow-xl border-4 border-white">
              {selectedEmp.fullName.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">{selectedEmp.fullName}</h2>
              <div className="flex gap-2 mt-2">
                <span className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">{selectedEmp.accountNumber}</span>
                <span className="px-3 py-1 bg-agribank-maroon/10 rounded-full text-[10px] font-black text-agribank-maroon uppercase tracking-widest">Lịch sử thu nhập</span>
              </div>
            </div>
            <button 
                onClick={() => exportToExcelBase(empHistory, `History_${selectedEmp.accountNumber}`, `Lịch sử thu nhập cán bộ ${selectedEmp.fullName}`)}
                className="ml-auto flex items-center gap-3 px-6 py-4 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg"
            >
                <Download size={20} /> Xuất Excel
            </button>
          </div>

          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center text-gray-400 text-[10px] font-black uppercase tracking-widest">
              <span>Thời gian / Nội dung</span>
              <span>Số tiền (₫)</span>
            </div>
            <div className="divide-y divide-gray-50">
              {empHistory.map((t, idx) => (
                <div key={idx} className="p-8 hover:bg-gray-50/20 transition-all group flex items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="text-center w-16 px-3 py-2 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase leading-none">TH {t.month}</p>
                      <p className="text-base font-black text-agribank-maroon mt-1 leading-none">{t.year}</p>
                    </div>
                    <div>
                      <p className="font-black text-gray-800 tracking-tight text-lg leading-snug group-hover:text-agribank-maroon transition-colors">
                        {ACCOUNT_TYPES[t.categoryCode] || t.categoryCode}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.source || 'Hệ thống'}</span>
                        <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                        <span className="text-[10px] font-bold text-gray-400 italic">"{t.description}"</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-mono font-black text-gray-800 tracking-tighter">
                      {parseFloat(t.amountTaxable).toLocaleString()}
                    </p>
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest translate-y-[-2px] block">Việt Nam Đồng</span>
                  </div>
                </div>
              ))}
              {empHistory.length === 0 && (
                <div className="py-40 text-center opacity-30">
                  <FileText size={80} className="mx-auto mb-6" />
                  <h3 className="text-2xl font-black uppercase tracking-widest italic font-mono">Không tìm thấy giao dịch nào</h3>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderReports = () => {
    const totalAmount = reportData.reduce((sum, item) => sum + parseFloat(item.amountTaxable), 0);

    return (
      <div className="space-y-8">
        {/* Advanced Filters */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
           <div className="flex items-center gap-3 mb-6 bg-agribank-maroon/5 px-6 py-3 rounded-2xl w-fit border border-agribank-maroon/10">
              <ListFilter size={20} className="text-agribank-maroon" />
              <h4 className="font-black text-agribank-maroon text-[10px] uppercase tracking-widest">Bộ lọc thông minh</h4>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                    <Calendar size={12} /> Thời gian
                 </label>
                 <div className="flex bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-agribank-maroon transition-all">
                    <select 
                      className="p-4 bg-transparent outline-none font-black text-sm text-gray-700 flex-1"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                    >
                      {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={String(i+1)}>T7 Tháng {i+1}</option>)}
                    </select>
                    <select 
                      className="p-4 bg-transparent outline-none font-black text-sm text-gray-700 border-l border-gray-200"
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value))}
                    >
                      {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                    <Building2 size={12} /> Chi nhánh
                 </label>
                 <select 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-sm text-gray-700 focus:ring-2 focus:ring-agribank-maroon"
                    value={reportBranch}
                    onChange={(e) => setReportBranch(e.target.value)}
                 >
                    <option value="all">Tất cả chi nhánh</option>
                    {branches.map(b => <option key={b.code} value={b.code}>{b.code} - {b.name}</option>)}
                 </select>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                    <Filter size={12} /> Loại khoản
                 </label>
                 <select 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-sm text-gray-700 focus:ring-2 focus:ring-agribank-maroon"
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                 >
                    <option value="all">Tất cả loại khoản</option>
                    {Object.entries(ACCOUNT_TYPES).map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                 </select>
              </div>

              <div className="flex items-end">
                <button 
                  onClick={() => exportToExcelBase(reportData, `Report_${month}_${year}_${reportBranch}`, `Báo cáo thu nhập tháng ${month}/${year}`)}
                  className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-green-600/20 hover:bg-green-700 transition-all flex items-center justify-center gap-3"
                >
                  <FileDown size={20} /> Xuất Excel đẹp
                </button>
              </div>
           </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
           <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
              <div className="flex items-center gap-6">
                 <div className="bg-agribank-maroon text-white p-3 rounded-2xl shadow-lg">
                    <FileText size={24} />
                 </div>
                 <div>
                    <h3 className="font-black text-gray-800 text-xl tracking-tight">Danh sách thống kê chi tiết</h3>
                    <p className="text-xs font-bold text-gray-400">Tháng {month}/{year} • {reportBranch === 'all' ? 'Toàn bộ CN' : `CN ${reportBranch}`}</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tổng số bản ghi</p>
                 <p className="font-black text-agribank-maroon text-2xl">{reportData.length}</p>
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-10 py-6">STT</th>
                    <th className="px-10 py-6">Cán bộ / Số tài khoản</th>
                    <th className="px-10 py-6">Loại thu nhập</th>
                    <th className="px-10 py-6 text-right">Số tiền bản ghi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reportData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/30 transition-all group">
                       <td className="px-10 py-6 font-black text-gray-300 text-xs">{(idx + 1).toString().padStart(2, '0')}</td>
                       <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-agribank-maroon/10 text-agribank-maroon rounded-xl flex items-center justify-center font-black text-sm">
                                {item.fullName.charAt(0)}
                             </div>
                             <div>
                                <p className="font-black text-gray-800 leading-none mb-1 group-hover:text-agribank-maroon transition-colors">{item.fullName}</p>
                                <p className="text-[10px] font-mono text-gray-400">{item.accountNumber}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-6">
                         <span className="px-3 py-1 bg-gray-100 rounded-lg text-[9px] font-black text-gray-500 uppercase tracking-widest">
                            {ACCOUNT_TYPES[item.categoryCode] || item.categoryCode}
                         </span>
                       </td>
                       <td className="px-10 py-6 text-right">
                          <span className="font-mono font-black text-gray-800 text-lg">
                            {parseFloat(item.amountTaxable).toLocaleString('vi-VN')}
                          </span>
                          <span className="text-[10px] font-bold text-gray-300 ml-2">₫</span>
                       </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-agribank-maroon/5 border-t-2 border-agribank-maroon/10">
                   <tr>
                     <td colSpan={3} className="px-10 py-8 text-right font-black uppercase text-gray-500 tracking-widest text-sm">
                        Tổng cộng tất cả bản ghi
                     </td>
                     <td className="px-10 py-8 text-right">
                        <span className="text-3xl font-mono font-black text-agribank-maroon">
                           {totalAmount.toLocaleString('vi-VN')}
                        </span>
                        <span className="text-sm font-black text-agribank-maroon/60 ml-2 uppercase">VNĐ</span>
                     </td>
                   </tr>
                </tfoot>
              </table>
           </div>

           {reportData.length === 0 && !loading && (
             <div className="py-40 text-center opacity-30">
               <ListFilter size={80} className="mx-auto mb-6" />
               <h3 className="text-2xl font-black uppercase tracking-widest italic font-mono">Không tìm thấy dữ liệu phù hợp</h3>
             </div>
           )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Tabs */}
      <div className="flex gap-4 mb-10 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={() => setActiveTab('batches')}
          className={`flex items-center gap-3 px-8 py-5 rounded-3xl font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'batches' ? 'bg-agribank-maroon text-white shadow-2xl shadow-agribank-maroon/30 scale-[1.02]' : 'bg-white text-gray-400 hover:text-agribank-maroon border border-gray-100 shadow-sm'}`}
        >
          <Clock size={20} /> Lịch sử Upload
        </button>
        <button 
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-3 px-8 py-5 rounded-3xl font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'employees' ? 'bg-agribank-maroon text-white shadow-2xl shadow-agribank-maroon/30 scale-[1.02]' : 'bg-white text-gray-400 hover:text-agribank-maroon border border-gray-100 shadow-sm'}`}
        >
          <User size={20} /> Lịch sử theo Cán bộ
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-3 px-8 py-5 rounded-3xl font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'reports' ? 'bg-agribank-maroon text-white shadow-2xl shadow-agribank-maroon/30 scale-[1.02]' : 'bg-white text-gray-400 hover:text-agribank-maroon border border-gray-100 shadow-sm'}`}
        >
          <FileText size={20} /> Thống kê chi tiết
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + (selectedBatch ? '-detail' : '-list')}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'batches' ? renderBatches() : 
           activeTab === 'employees' ? renderEmployees() : 
           renderReports()}
        </motion.div>
      </AnimatePresence>

      {loading && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50">
           <div className="w-16 h-16 border-4 border-agribank-maroon border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
