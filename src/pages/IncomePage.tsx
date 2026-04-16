import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, User, CreditCard, Users as UsersIcon, ChevronRight, Building2, Calendar, Database, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function IncomePage() {
  const { user, isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState<number | string>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [branchCode, setBranchCode] = useState('');
  const [source, setSource] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);

  useEffect(() => {
    fetchBranches();
    handleSearch();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params: any = { year };
      if (month !== 'all') params.month = month;
      if (isAdmin && branchCode) params.branchCode = branchCode;
      if (source) params.source = source;

      const res = await api.get('/tax/summary', { params });
      
      let filtered = res.data;
      if (search) {
        filtered = filtered.filter((e: any) => 
          e.fullName.toLowerCase().includes(search.toLowerCase()) || 
          e.accountNumber.includes(search)
        );
      }
      setData(filtered);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleBranchCodeInput = (val: string) => {
    setSearch(val);
    // Quick branch search: 4600 -> Phú Yên
    const branch = branches.find(b => b.code === val);
    if (branch && isAdmin) {
      setBranchCode(branch.code);
      toast.success(`Đã chọn chi nhánh: ${branch.name}`);
    }
  };

  const handleDeleteData = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu của ${month === 'all' ? `năm ${year}` : `tháng ${month}/${year}`} ${branchCode ? `chi nhánh ${branchCode}` : ''}?`)) return;
    
    try {
      const params: any = { year };
      if (month !== 'all') params.month = month;
      if (isAdmin && branchCode) params.branchCode = branchCode;

      await api.delete('/transactions', { params });
      toast.success('Đã xóa dữ liệu thành công');
      handleSearch();
    } catch (err) {
      toast.error('Lỗi khi xóa dữ liệu');
    }
  };

  const sources = Array.isArray(data) ? Array.from(new Set(data.flatMap(d => d.sources || []))) : [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Thời gian</label>
            <div className="flex gap-2">
              <select 
                className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-agribank-maroon font-bold text-sm"
                value={month}
                onChange={(e) => setMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              >
                <option value="all">Cả năm</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i+1} value={i+1}>Tháng {i+1}</option>
                ))}
              </select>
              <select 
                className="w-24 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-agribank-maroon font-bold text-sm"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {isAdmin && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Chi nhánh</label>
              <select 
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-agribank-maroon font-bold text-sm"
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
              >
                <option value="">Tất cả chi nhánh</option>
                {branches.map(b => <option key={b.code} value={b.code}>{b.code} - {b.name}</option>)}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nguồn dữ liệu</label>
            <select 
              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-agribank-maroon font-bold text-sm"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="">Tất cả nguồn</option>
              {sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button 
              onClick={handleSearch}
              className="flex-1 p-3 bg-agribank-maroon text-white font-black rounded-xl hover:bg-agribank-maroon/90 transition-all shadow-lg shadow-agribank-maroon/10 uppercase text-xs tracking-widest"
            >
              LỌC DỮ LIỆU
            </button>
            {isAdmin && (
              <button 
                onClick={handleDeleteData}
                className="p-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all border border-red-100"
                title="Xóa dữ liệu đang lọc"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-agribank-maroon transition-colors" size={20} />
          <input
            type="text"
            placeholder="Tìm theo Họ tên, Số tài khoản hoặc nhập Mã chi nhánh (46xx)..."
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-agribank-maroon focus:bg-white transition-all font-bold text-gray-700"
            value={search}
            onChange={(e) => handleBranchCodeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List */}
        <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col max-h-[700px]">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-black text-gray-800 text-xs uppercase tracking-widest">Danh sách ({data.length})</h3>
            <div className="text-[10px] font-black text-gray-400 uppercase">STK / Họ tên</div>
          </div>
          <div className="flex-1 overflow-auto divide-y divide-gray-50">
            {Array.isArray(data) && data.map((emp) => (
              <button
                key={emp.accountNumber}
                onClick={() => setSelectedEmp(emp)}
                className={`w-full p-5 text-left hover:bg-gray-50 transition-all flex items-center justify-between group ${
                  selectedEmp?.accountNumber === emp.accountNumber ? 'bg-agribank-maroon/5 border-l-4 border-agribank-maroon' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-colors ${
                    selectedEmp?.accountNumber === emp.accountNumber ? 'bg-agribank-maroon text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {emp.fullName.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-black text-gray-800 text-sm tracking-tight truncate">{emp.fullName}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{emp.accountNumber}</p>
                  </div>
                </div>
                <ChevronRight size={16} className={`transition-all shrink-0 ${selectedEmp?.accountNumber === emp.accountNumber ? 'text-agribank-maroon translate-x-1' : 'text-gray-300 group-hover:text-agribank-maroon group-hover:translate-x-1'}`} />
              </button>
            ))}
            {data.length === 0 && !loading && (
              <div className="p-16 text-center text-gray-400 font-bold italic text-sm">Không tìm thấy dữ liệu</div>
            )}
            {loading && (
              <div className="p-16 text-center text-gray-400 font-bold italic text-sm animate-pulse">Đang tải...</div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 space-y-8">
          {selectedEmp ? (
            <>
              <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                  <UsersIcon size={160} className="text-agribank-maroon" />
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center gap-8 mb-10">
                  <div className="w-24 h-24 bg-agribank-maroon text-white rounded-3xl flex items-center justify-center text-4xl font-black shadow-2xl shadow-agribank-maroon/30 border-4 border-white/20">
                    {selectedEmp.fullName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-800 tracking-tighter">{selectedEmp.fullName}</h2>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <span className="flex items-center gap-2 text-[10px] font-black text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 uppercase tracking-widest">
                        <CreditCard size={14} className="text-agribank-maroon" /> {selectedEmp.accountNumber}
                      </span>
                      <span className="flex items-center gap-2 text-[10px] font-black text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 uppercase tracking-widest">
                        <Building2 size={14} className="text-agribank-maroon" /> Chi nhánh {selectedEmp.branchCode}
                      </span>
                      <span className="flex items-center gap-2 text-[10px] font-black text-agribank-green bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 uppercase tracking-widest">
                        <UsersIcon size={14} /> {selectedEmp.npt} Người phụ thuộc
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Thu nhập & Giảm trừ ({month === 'all' ? `Năm ${year}` : `Tháng ${month}/${year}`})</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-bold text-sm">Tổng thu nhập (Gross)</span>
                        <span className="font-mono font-black text-gray-800">{selectedEmp.totalGross.toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="flex justify-between items-center text-blue-600">
                        <span className="text-xs font-bold">(-) Phụ cấp không tính thuế</span>
                        <span className="font-mono font-bold">({(selectedEmp.deductHazard + selectedEmp.deductRegional).toLocaleString('vi-VN')}) ₫</span>
                      </div>
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-sm">Thu nhập chịu thuế (TNCT)</span>
                        <span className="font-mono">{selectedEmp.taxableIncome.toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="pt-2 space-y-2">
                        <div className="flex justify-between items-center text-red-500">
                          <span className="text-xs font-bold">(-) Giảm trừ bản thân</span>
                          <span className="font-mono font-bold">({selectedEmp.deductPersonal.toLocaleString('vi-VN')}) ₫</span>
                        </div>
                        <div className="flex justify-between items-center text-red-500">
                          <span className="text-xs font-bold">(-) Giảm trừ {selectedEmp.npt} NPT</span>
                          <span className="font-mono font-bold">({selectedEmp.deductDependent.toLocaleString('vi-VN')}) ₫</span>
                        </div>
                        <div className="flex justify-between items-center text-red-500">
                          <span className="text-xs font-bold">(-) Bảo hiểm bắt buộc</span>
                          <span className="font-mono font-bold">({selectedEmp.deductInsurance.toLocaleString('vi-VN')}) ₫</span>
                        </div>
                      </div>
                      <div className="pt-5 border-t border-dashed border-gray-200 flex justify-between items-center">
                        <span className="font-black text-gray-800 text-sm">Thu nhập tính thuế (TNTT)</span>
                        <span className="font-mono font-black text-agribank-green text-lg">{selectedEmp.netTaxableIncome.toLocaleString('vi-VN')} ₫</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-agribank-maroon/5 p-8 rounded-3xl border border-agribank-maroon/10 flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-agribank-maroon/5 rounded-full blur-2xl"></div>
                    <p className="text-[10px] font-black text-agribank-maroon uppercase tracking-[0.2em] mb-3">Thuế TNCN phải nộp</p>
                    <h3 className="text-5xl font-black text-agribank-maroon font-mono tracking-tighter">
                      {selectedEmp.taxAmount.toLocaleString('vi-VN')}
                      <span className="text-xl ml-1 font-sans">₫</span>
                    </h3>
                    <div className="mt-6 px-6 py-2 bg-agribank-maroon text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-agribank-maroon/20">
                      Tính toán theo biểu thuế lũy tiến từng phần
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="font-black text-gray-800 text-xs uppercase tracking-widest">Nguồn thu nhập</h3>
                  <div className="flex gap-2">
                    {selectedEmp.sources.map((s: string) => (
                      <span key={s} className="text-[8px] font-black bg-agribank-maroon/10 text-agribank-maroon px-2 py-0.5 rounded uppercase">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="p-8">
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {Object.entries(selectedEmp.income).map(([key, val]: any) => val > 0 && (
                        <div key={key} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{key}</p>
                          <p className="font-mono font-black text-gray-700">{val.toLocaleString('vi-VN')} ₫</p>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-gray-100 p-24 text-center">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6 shadow-inner">
                <User size={48} />
              </div>
              <h3 className="text-xl font-black text-gray-300 tracking-tight">Chọn nhân viên để xem chi tiết</h3>
              <p className="text-sm font-bold text-gray-300 mt-2 uppercase tracking-widest">Thông tin thu nhập và thuế sẽ hiển thị tại đây</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
