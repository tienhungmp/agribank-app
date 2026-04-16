import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { formatVND } from '../lib/utils';
import { 
  DollarSign, 
  Users, 
  Receipt, 
  FileUp,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const KPICard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        <Icon size={24} />
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
          <ArrowUpRight size={14} />
          {trend}
        </div>
      )}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
    </div>
  </div>
);

export default function DashboardPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tax/summary', { params: { month, year } });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = Array.isArray(data) ? data.reduce((acc, curr) => acc + curr.totalGross, 0) : 0;
  const totalTax = Array.isArray(data) ? data.reduce((acc, curr) => acc + curr.taxAmount, 0) : 0;
  const totalEmployees = Array.isArray(data) ? data.length : 0;
  const totalSources = Array.isArray(data) ? Array.from(new Set(data.flatMap(d => d.sources || []))).length : 0;

  // Dynamic Branch Data
  const branchMap: any = {};
  if (Array.isArray(data)) {
    data.forEach(d => {
      branchMap[d.branchCode] = (branchMap[d.branchCode] || 0) + (d.totalGross / 1000000); // In millions
    });
  }
  const branchData = Object.entries(branchMap).map(([name, value]) => ({ name, value: Math.round(value as number) }));

  // Dynamic Income Structure
  const incomeStructure = Array.isArray(data) ? [
    { name: 'Lương V1', value: data.reduce((acc, curr) => acc + (curr.income['851101'] || 0), 0) },
    { name: 'Lương V2', value: data.reduce((acc, curr) => acc + (curr.income['851102'] || 0), 0) },
    { name: 'Năng suất', value: data.reduce((acc, curr) => acc + (curr.income['462001'] || 0), 0) },
    { name: 'Khen thưởng', value: data.reduce((acc, curr) => acc + (curr.income['484101'] || 0), 0) },
    { name: 'Khác', value: data.reduce((acc, curr) => acc + (curr.income['OTHER'] || 0) + (curr.income['BAO_NO'] || 0) + (curr.income['BAO_CO'] || 0), 0) },
  ].filter(i => i.value > 0) : [];

  const totalStructureValue = incomeStructure.reduce((acc, curr) => acc + curr.value, 0);

  const COLORS = ['#A61D37', '#005030', '#FFD700', '#4A90E2', '#9013FE', '#50E3C2'];

  return (
    <div className="space-y-8">
      {/* Header Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Bảng điều khiển</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Tổng quan tình hình thu nhập & Thuế</p>
        </div>
        <div className="flex gap-3">
          <select 
            className="p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-agribank-maroon font-bold text-xs"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i+1} value={i+1}>Tháng {i+1}</option>
            ))}
          </select>
          <select 
            className="p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-agribank-maroon font-bold text-xs"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Tổng Thu nhập" 
          value={formatVND(totalIncome)} 
          icon={DollarSign} 
          color="bg-agribank-maroon" 
        />
        <KPICard 
          title="Tổng Thuế TNCN" 
          value={formatVND(totalTax)} 
          icon={Receipt} 
          color="bg-agribank-green" 
        />
        <KPICard 
          title="Số Cán bộ" 
          value={totalEmployees} 
          icon={Users} 
          color="bg-blue-500" 
        />
        <KPICard 
          title="Nguồn Dữ liệu" 
          value={totalSources} 
          icon={FileUp} 
          color="bg-agribank-gold" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-gray-800 tracking-tight text-lg">Thu nhập theo Chi nhánh (Triệu VND)</h3>
          </div>
          <div className="h-80">
            {branchData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8', fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8', fontWeight: 600 }} />
                  <Tooltip 
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  />
                  <Bar dataKey="value" fill="#A61D37" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 font-bold italic">Không có dữ liệu biểu đồ</div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-800 mb-8 tracking-tight text-lg">Cơ cấu Thu nhập</h3>
          <div className="h-64">
            {incomeStructure.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeStructure}
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {incomeStructure.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 font-bold italic">Không có dữ liệu</div>
            )}
          </div>
          <div className="space-y-3 mt-6">
            {incomeStructure.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-gray-500 font-bold">{item.name}</span>
                </div>
                <span className="font-black text-gray-800">{Math.round((item.value / totalStructureValue) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity / Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-gray-800 tracking-tight text-lg">Top Thu nhập cao nhất tháng</h3>
          <button className="text-agribank-maroon text-sm font-black hover:underline tracking-tight">Xem tất cả</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.15em]">
              <tr>
                <th className="px-8 py-5">Họ và tên</th>
                <th className="px-8 py-5">Chi nhánh</th>
                <th className="px-8 py-5">Thu nhập</th>
                <th className="px-8 py-5">Thuế TNCN</th>
                <th className="px-8 py-5 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Array.isArray(data) && data.slice(0, 5).map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-agribank-maroon/10 text-agribank-maroon rounded-full flex items-center justify-center font-black text-sm border-2 border-agribank-maroon/5 group-hover:border-agribank-maroon/20 transition-colors">
                        {row.fullName.charAt(0)}
                      </div>
                      <span className="font-black text-gray-800 tracking-tight">{row.fullName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-gray-500">{row.branchCode}</td>
                  <td className="px-8 py-5 font-mono text-sm font-bold text-gray-700">{formatVND(row.totalGross)}</td>
                  <td className="px-8 py-5 font-mono text-sm font-black text-agribank-maroon">{formatVND(row.taxAmount)}</td>
                  <td className="px-8 py-5 text-center">
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-green-100">Đã tính</span>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-gray-400 font-bold italic">Chưa có dữ liệu tháng này</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
