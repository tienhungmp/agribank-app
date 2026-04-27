import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, 
  Calendar, 
  Building2, 
  Users, 
  DollarSign, 
  Filter,
  ArrowUpRight,
  PieChart,
  LayoutDashboard,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

const ACCOUNT_TYPES: Record<string, string> = {
  "all": "Tất cả thu nhập",
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

export default function StatisticsPage() {
  const { user, isAdmin } = useAuth();
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [branchCode, setBranchCode] = useState<string>('all');
  const [categoryCode, setCategoryCode] = useState<string>('all');
  const [branches, setBranches] = useState<any[]>([]);
  
  const [summary, setSummary] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBranches();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [month, year, branchCode, categoryCode]);

  const fetchBranches = async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = { month, year, branchCode, categoryCode };
      const [sumRes, breakRes] = await Promise.all([
        api.get('/stats/income-summary', { params }),
        isAdmin ? api.get('/stats/branches-breakdown', { params: { month, year, categoryCode } }) : Promise.resolve({ data: [] })
      ]);
      
      setSummary(sumRes.data);
      setBreakdown(breakRes.data);
    } catch (err) {
      toast.error('Lỗi khi tải thống kê');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Filters Header */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 flex-1 w-full lg:w-auto">
            <select 
              className="p-4 bg-transparent font-black text-sm outline-none border-r border-gray-200 flex-1"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
            >
              {[...Array(12)].map((_, i) => (
                <option key={i+1} value={i+1}>Tháng {i+1}</option>
              ))}
            </select>
            <select 
              className="p-4 bg-transparent font-black text-sm outline-none flex-1"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full lg:flex-2">
            <select 
              className="p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-agribank-maroon font-black text-sm"
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value)}
              disabled={!isAdmin}
            >
              <option value="all">Tất cả chi nhánh</option>
              {branches.map(b => <option key={b.code} value={b.code}>{b.code} - {b.name}</option>)}
            </select>

            <select 
              className="p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-agribank-maroon font-black text-sm"
              value={categoryCode}
              onChange={(e) => setCategoryCode(e.target.value)}
            >
              {Object.entries(ACCOUNT_TYPES).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && !summary ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-agribank-maroon"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Summary Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-agribank-maroon rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-agribank-maroon/30"
          >
            <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
              <BarChart3 size={240} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-black">
                  <DollarSign size={24} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.3em]">Kết quả thống kê</h3>
              </div>
              
              <div className="mb-12">
                <p className="text-white/60 text-sm font-black uppercase tracking-widest mb-2">Tổng số tiền {ACCOUNT_TYPES[categoryCode].toLowerCase()}</p>
                <h2 className="text-6xl font-black tracking-tighter">
                  {summary?.totalAmount?.toLocaleString('vi-VN')} <span className="text-2xl font-normal opacity-60 italic">VNĐ</span>
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 border-t border-white/10 pt-10">
                <div>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Số lượng cán bộ</p>
                  <p className="text-2xl font-black">{summary?.employeeCount} <span className="text-sm font-normal">Người</span></p>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Thời gian</p>
                  <p className="text-2xl font-black">Tháng {month}/{year}</p>
                </div>
                <div className="hidden md:block">
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Phạm vi</p>
                  <p className="text-base font-black truncate">{branchCode === 'all' ? 'Toàn Phú Yên' : `Nhánh ${branchCode}`}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats Column */}
          <div className="space-y-6">
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.1 }}
               className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm"
            >
              <div className="w-12 h-12 bg-agribank-maroon/10 text-agribank-maroon rounded-2xl flex items-center justify-center mb-6">
                <Users size={24} />
              </div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bình quân / Cán bộ</h4>
              <p className="text-2xl font-black text-gray-800">
                {summary?.employeeCount > 0 
                  ? Math.round(summary.totalAmount / summary.employeeCount).toLocaleString('vi-VN') 
                  : 0} ₫
              </p>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.2 }}
               className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm group hover:border-agribank-maroon/30 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                   <Target size={24} />
                 </div>
                 <ArrowUpRight className="text-gray-200 group-hover:text-agribank-maroon transition-colors" />
              </div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Giao dịch lớn nhất</h4>
              <p className="text-2xl font-black text-gray-800">Cập nhật...</p>
            </motion.div>
          </div>

          {/* Branch Breakdown (Admin Only) */}
          {isAdmin && breakdown.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-3 bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <Building2 className="text-agribank-maroon" />
                  <h3 className="font-black text-lg tracking-tight">Cơ cấu theo Chi nhánh</h3>
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-gray-100">
                  {breakdown.length} Chi nhánh
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/30 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    <tr>
                      <th className="px-10 py-6">Mã CN</th>
                      <th className="px-10 py-6 text-right">Số lượng CB</th>
                      <th className="px-10 py-6 text-right">Tổng cộng (₫)</th>
                      <th className="px-10 py-6">Tỷ trọng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {breakdown.sort((a,b) => b.totalAmount - a.totalAmount).map((b, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-10 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-agribank-maroon/5 text-agribank-maroon flex items-center justify-center font-black text-xs">
                              {b.branchCode}
                            </div>
                            <span className="font-black text-gray-700">Chi nhánh {b.branchCode}</span>
                          </div>
                        </td>
                        <td className="px-10 py-5 text-right font-mono font-bold text-gray-500">{b.employeeCount}</td>
                        <td className="px-10 py-5 text-right font-mono font-black text-gray-800">
                          {parseFloat(b.totalAmount).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-10 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(b.totalAmount / summary.totalAmount) * 100}%` }}
                                className="h-full bg-agribank-maroon rounded-full"
                              />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 w-10">
                              {Math.round((b.totalAmount / summary.totalAmount) * 100)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
