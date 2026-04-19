import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  User, 
  Building2, 
  Users as UsersIcon, 
  ChevronRight, 
  Calculator,
  Save,
  ArrowLeft,
  Target,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

const ACCOUNT_TYPES = [
  { "code": "851101", "name": "Lương V1 (Cơ bản)" },
  { "code": "851102", "name": "Thù lao hiệu quả CV" },
  { "code": "462001", "name": "Các khoản phải trả cho CB, NV" },
  { "code": "484101", "name": "Quỹ khen thưởng" },
  { "code": "484201", "name": "Quỹ phúc lợi" },
  { "code": "891001", "name": "Chi có tính chất phúc lợi" },
  { "code": "361909", "name": "Các khoản phải thu chi thưởng" },
  { "code": "ALLOW_DOC_HAI", "name": "Độc hại kho quỹ" },
  { "code": "ALLOW_KHU_VUC", "name": "Phụ cấp khu vực" },
  { "code": "ALLOW_BH", "name": "BH Bắt buộc" },
  { "code": "ALLOW_TU_THIEN", "name": "Từ thiện" },
  { "code": "DEDUCT_PERSONAL", "name": "Giảm trừ cá nhân" },
  { "code": "DEDUCT_DEPENDENT", "name": "Giảm trừ NPT" },
  { "code": "OTHER", "name": "Khác / Không tính thuế" }
];

export default function EmployeePage() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branchCode, setBranchCode] = useState('');
  
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState<any>(null);
  const [incomeEditData, setIncomeEditData] = useState<any>({});
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    fetchBranches();
    fetchEmployees();
  }, [branchCode, month, year]);

  const fetchBranches = async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params: any = { month, year };
      if (isAdmin && branchCode) params.branchCode = branchCode;
      const res = await api.get('/tax/summary', { params });
      setEmployees(res.data);
      
      if (selectedEmpId) {
        const updated = res.data.find((e: any) => e.accountNumber === selectedEmpId);
        if (updated) setSelectedEmployeeData(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmployee = (emp: any) => {
    setSelectedEmpId(emp.accountNumber);
    setSelectedEmployeeData(emp);
    
    // Prepare income data for editing
    const editObj: any = {};
    ACCOUNT_TYPES.forEach(cat => {
      let val = 0;
      if (emp.income && emp.income[cat.code] !== undefined) val = emp.income[cat.code];
      else if (cat.code === "ALLOW_DOC_HAI") val = emp.deductFromIncome?.["DOC_HAI"] || 0;
      else if (cat.code === "ALLOW_KHU_VUC") val = emp.deductFromIncome?.["KHU_VUC"] || 0;
      else if (cat.code === "ALLOW_BH") val = emp.deductFromTaxable?.["BAO_HIEM"] || 0;
      else if (cat.code === "ALLOW_TU_THIEN") val = emp.deductFromTaxable?.["TU_THIEN"] || 0;
      else if (cat.code === "DEDUCT_PERSONAL") val = emp.deductFromTaxable?.["PERSONAL"] || 0;
      else if (cat.code === "DEDUCT_DEPENDENT") val = emp.deductFromTaxable?.["DEPENDENT"] || 0;
      
      editObj[cat.code] = val;
    });
    setIncomeEditData(editObj);
  };

  const handleUpdateAmount = (code: string, val: string) => {
    const amount = parseFloat(val) || 0;
    setIncomeEditData((prev: any) => ({ ...prev, [code]: amount }));
  };

  const handleRecalculate = async () => {
    if (!selectedEmpId) return;
    setIsCalculating(true);
    try {
      await api.put(`/employees/${selectedEmpId}/income`, {
        month,
        year,
        incomeItems: incomeEditData
      });
      toast.success('Đã tính toán lại dữ liệu');
      await fetchEmployees();
    } catch (err) {
      toast.error('Lỗi khi cập nhật dữ liệu');
    } finally {
      setIsCalculating(false);
    }
  };

  const filtered = employees.filter(e => 
    e.fullName.toLowerCase().includes(search.toLowerCase()) || 
    e.accountNumber.includes(search)
  );

  const renderListView = () => (
    <div className="space-y-8">
      {/* Header Search */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-6 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
          <input
            type="text"
            placeholder="Tìm theo Tên hoặc Số tài khoản cán bộ..."
            className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-agribank-maroon focus:bg-white transition-all font-bold text-gray-700 shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
            <select 
              className="p-4 bg-transparent font-black text-sm outline-none border-r border-gray-200"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i+1} value={i+1}>Tháng {i+1}</option>
              ))}
            </select>
            <select 
              className="p-4 bg-transparent font-black text-sm outline-none"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {isAdmin && (
            <select 
              className="p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-agribank-maroon font-black text-sm"
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value)}
            >
              <option value="">Tất cả CN</option>
              {branches.map(b => <option key={b.code} value={b.code}>{b.code} - {b.name}</option>)}
            </select>
          )}

          <div className="flex items-center gap-3 px-6 py-4 bg-agribank-maroon/5 text-agribank-maroon rounded-2xl border border-agribank-maroon/10">
            <UsersIcon size={20} />
            <span className="font-black">{filtered.length} Cán bộ</span>
          </div>
        </div>
      </div>

      {/* Grid of employees */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(emp => (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            key={emp.accountNumber}
            onClick={() => handleSelectEmployee(emp)}
            className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-agribank-maroon/30 transition-all text-left flex gap-5 group"
          >
            <div className="w-14 h-14 bg-agribank-maroon text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-agribank-maroon/20 group-hover:rotate-6 transition-transform">
              {emp.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-gray-800 tracking-tight truncate">{emp.fullName}</h4>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">TK: {emp.accountNumber}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-2 py-0.5 bg-gray-100 rounded-lg text-[9px] font-black text-gray-500 uppercase tracking-tighter">CN {emp.branchCode}</span>
                <span className="px-2 py-0.5 bg-agribank-maroon/10 rounded-lg text-[9px] font-black text-agribank-maroon uppercase tracking-tighter">PIT: {emp.taxAmount?.toLocaleString()} ₫</span>
              </div>
            </div>
            <div className="self-center text-gray-300 group-hover:text-agribank-maroon transition-colors">
              <ChevronRight size={24} />
            </div>
          </motion.button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-40 text-center opacity-30">
            <UsersIcon size={80} className="mx-auto mb-6" />
            <h3 className="text-2xl font-black uppercase tracking-widest italic font-mono">Không có dữ liệu cán bộ</h3>
          </div>
        )}
      </div>
    </div>
  );

  const renderDetailView = () => {
    if (!selectedEmployeeData) return null;

    return (
      <div className="space-y-8 pb-32">
        {/* Detail Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <button 
            onClick={() => setSelectedEmpId(null)}
            className="flex items-center gap-3 text-agribank-maroon font-black hover:gap-4 transition-all uppercase text-xs tracking-widest bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-100 w-fit"
          >
            <ArrowLeft size={18} /> Quay lại danh sách
          </button>

          <div className="flex items-center gap-4">
             <button 
                onClick={handleRecalculate}
                disabled={isCalculating}
                className="flex items-center gap-3 px-8 py-4 bg-agribank-maroon text-white rounded-2xl font-black hover:bg-agribank-maroon/90 transition-all shadow-xl shadow-agribank-maroon/20 disabled:opacity-50 uppercase text-sm tracking-widest"
             >
                <Calculator size={20} className={isCalculating ? 'animate-spin' : ''} />
                {isCalculating ? 'ĐANG TÍNH...' : 'TÍNH TOÁN LẠI'}
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile & Summary */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                <User size={180} className="text-agribank-maroon" />
              </div>

              <div className="flex flex-col items-center text-center mb-10 pt-4">
                <div className="w-28 h-28 bg-agribank-maroon text-white rounded-[32px] flex items-center justify-center text-5xl font-black shadow-2xl shadow-agribank-maroon/30 border-4 border-white mb-6">
                  {selectedEmployeeData.fullName.charAt(0)}
                </div>
                <h3 className="text-2xl font-black text-gray-800 tracking-tight">{selectedEmployeeData.fullName}</h3>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-2">{selectedEmployeeData.accountNumber}</p>
                <div className="flex gap-2 mt-4">
                  <span className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">CN {selectedEmployeeData.branchCode}</span>
                  <span className="px-3 py-1 bg-agribank-maroon/10 rounded-full text-[10px] font-black text-agribank-maroon uppercase tracking-widest">MST: {selectedEmployeeData.taxCode || 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-4 pt-10 border-t border-gray-50">
                <div className="p-5 bg-gray-50 rounded-2xl">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tổng thu nhập gộp</p>
                   <p className="text-2xl font-mono font-black text-gray-800">{selectedEmployeeData.totalGross?.toLocaleString()} <span className="text-sm">₫</span></p>
                </div>
                <div className="p-6 bg-agribank-maroon/5 rounded-3xl border border-agribank-maroon/10">
                   <p className="text-[10px] font-black text-agribank-maroon/60 uppercase tracking-widest mb-2">Kết quả tính toán {month}/{year}:</p>
                   
                   <div className="space-y-4 mt-6">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Thu nhập chịu thuế</p>
                        <p className="text-lg font-mono font-bold text-gray-700">{selectedEmployeeData.taxableIncome?.toLocaleString()} ₫</p>
                      </div>
                      <div className="pt-4 border-t border-agribank-maroon/10">
                        <p className="text-[9px] font-black text-agribank-maroon uppercase tracking-widest mb-0.5">Thuế TNCN đã khấu trừ</p>
                        <p className="text-3xl font-mono font-black text-agribank-maroon leading-none">
                          {selectedEmployeeData.taxAmount?.toLocaleString()} <span className="text-base">₫</span>
                        </p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Income Editor */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
               <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="font-black text-gray-800 text-sm uppercase tracking-widest">Chi tiết các khoản (Tháng {month}/{year})</h3>
                  <div className="text-[10px] font-black text-gray-400 uppercase">Loại tài khoản / Số tiền</div>
               </div>

               <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ACCOUNT_TYPES.map(cat => (
                    <div key={cat.code} className="space-y-2 p-5 bg-gray-50/50 rounded-2xl border border-gray-100 group focus-within:border-agribank-maroon transition-all">
                       <div className="flex justify-between items-center mb-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{cat.name}</label>
                          <span className="text-[9px] font-black bg-gray-100 px-2 py-0.5 rounded text-gray-400">{cat.code}</span>
                       </div>
                       <div className="relative">
                          <input 
                            type="number"
                            className="w-full pl-5 pr-12 py-3 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-agribank-maroon font-mono font-black text-lg text-gray-800"
                            value={incomeEditData[cat.code] || 0}
                            onChange={(e) => handleUpdateAmount(cat.code, e.target.value)}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold">₫</span>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-6">
                  <div className="flex items-center gap-3 text-orange-600">
                    <AlertTriangle size={20} />
                    <p className="text-[10px] font-black uppercase tracking-widest leading-tight">Thay đổi số tiền sẽ ảnh hưởng trực tiếp đến kết quả tính thuế.</p>
                  </div>
                  <button 
                    onClick={handleRecalculate}
                    disabled={isCalculating}
                    className="px-10 py-5 bg-agribank-maroon text-white rounded-2xl font-black hover:bg-agribank-maroon/90 transition-all shadow-xl shadow-agribank-maroon/20 uppercase text-xs tracking-widest flex items-center gap-3"
                  >
                    <Save size={18} /> {isCalculating ? 'ĐANG LƯU...' : 'XÁC NHẬN & TÍNH LẠI'}
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <AnimatePresence mode="wait">
        {!selectedEmpId ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {renderListView()}
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderDetailView()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
