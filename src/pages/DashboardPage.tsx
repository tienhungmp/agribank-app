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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/tax/summary', { params: { month: new Date().getMonth() + 1, year: new Date().getFullYear() } });
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalIncome = data.reduce((acc, curr) => acc + curr.totalGross, 0);
  const totalTax = data.reduce((acc, curr) => acc + curr.taxAmount, 0);
  const totalEmployees = data.length;

  const branchData = [
    { name: '4600', value: 450 },
    { name: '4601', value: 320 },
    { name: '4602', value: 280 },
    { name: '4603', value: 310 },
    { name: '4604', value: 190 },
    { name: '4605', value: 240 },
  ];

  const COLORS = ['#A61D37', '#005030', '#FFD700', '#4A90E2', '#9013FE', '#50E3C2'];

  return (
    <div className="space-y-8">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Tổng Thu nhập (Tháng)" 
          value={formatVND(totalIncome)} 
          icon={DollarSign} 
          color="bg-agribank-maroon" 
          trend="+12.5%"
        />
        <KPICard 
          title="Tổng Thuế TNCN" 
          value={formatVND(totalTax)} 
          icon={Receipt} 
          color="bg-agribank-green" 
          trend="+8.2%"
        />
        <KPICard 
          title="Số Cán bộ" 
          value={totalEmployees} 
          icon={Users} 
          color="bg-blue-500" 
        />
        <KPICard 
          title="File đã Upload" 
          value="12" 
          icon={FileUp} 
          color="bg-agribank-gold" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-gray-800 tracking-tight text-lg">Thu nhập theo Chi nhánh (Triệu VND)</h3>
            <select className="text-xs font-bold border-none bg-gray-50 rounded-xl px-4 py-2 outline-none text-gray-500">
              <option>Tháng này</option>
              <option>Tháng trước</option>
            </select>
          </div>
          <div className="h-80">
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
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-800 mb-8 tracking-tight text-lg">Cơ cấu Thu nhập</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Lương V1', value: 400 },
                    { name: 'Lương V2', value: 300 },
                    { name: 'Năng suất', value: 200 },
                    { name: 'Khen thưởng', value: 100 },
                  ]}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {COLORS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-6">
            {['Lương V1', 'Lương V2', 'Năng suất', 'Khen thưởng'].map((label, i) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i] }}></div>
                  <span className="text-gray-500 font-bold">{label}</span>
                </div>
                <span className="font-black text-gray-800">{(25 - i * 5)}%</span>
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
              {data.slice(0, 5).map((row, i) => (
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
