import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, User, Building2, Users as UsersIcon, Edit2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployeePage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tax/summary', { params: { month: new Date().getMonth() + 1, year: new Date().getFullYear() } });
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleEdit = (emp: any) => {
    setEditingId(emp.accountNumber);
    setEditValue(emp.npt);
  };

  const handleSave = async (id: string) => {
    try {
      // In a real app, we'd have a specific endpoint for this
      // await api.put(`/employees/${id}/dependents`, { npt: editValue });
      toast.success('Cập nhật thành công (Demo)');
      setEmployees(prev => prev.map(e => e.accountNumber === id ? { ...e, npt: editValue } : e));
      setEditingId(null);
    } catch (err) {
      toast.error('Lỗi khi cập nhật');
    }
  };

  const filtered = employees.filter(e => 
    e.fullName.toLowerCase().includes(search.toLowerCase()) || 
    e.accountNumber.includes(search)
  );

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
          <input
            type="text"
            placeholder="Tìm nhân viên theo tên hoặc số tài khoản..."
            className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-agribank-maroon focus:bg-white transition-all font-bold text-gray-700 shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 px-6 py-4 bg-agribank-maroon/5 text-agribank-maroon rounded-2xl border border-agribank-maroon/10">
          <UsersIcon size={24} />
          <span className="font-black text-lg">{filtered.length}</span>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Nhân viên</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-6">Nhân viên</th>
                <th className="px-8 py-6">Số tài khoản</th>
                <th className="px-8 py-6">Chi nhánh</th>
                <th className="px-8 py-6 text-center">Số NPT</th>
                <th className="px-8 py-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((emp) => (
                <tr key={emp.accountNumber} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-agribank-maroon/10 text-agribank-maroon rounded-2xl flex items-center justify-center font-black text-lg border border-agribank-maroon/10 shadow-sm">
                        {emp.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-gray-800 tracking-tight">{emp.fullName}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mã NV: {emp.accountNumber.slice(-4)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm text-gray-500 font-mono font-bold">{emp.accountNumber}</td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-agribank-green/10 text-agribank-green rounded-full text-[10px] font-black uppercase tracking-widest border border-agribank-green/10">
                      CN {emp.branchCode}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    {editingId === emp.accountNumber ? (
                      <input 
                        type="number"
                        className="w-20 p-2 border-2 border-agribank-maroon rounded-xl text-center outline-none font-black text-agribank-maroon bg-white shadow-lg"
                        value={editValue}
                        onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                        autoFocus
                      />
                    ) : (
                      <span className="font-black text-xl text-gray-700">{emp.npt}</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    {editingId === emp.accountNumber ? (
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => handleSave(emp.accountNumber)}
                          className="p-3 text-white bg-agribank-green hover:bg-agribank-green/90 rounded-xl shadow-lg shadow-agribank-green/20 transition-all"
                        >
                          <Check size={20} />
                        </button>
                        <button 
                          onClick={() => setEditingId(null)}
                          className="p-3 text-white bg-gray-400 hover:bg-gray-500 rounded-xl shadow-lg shadow-gray-400/20 transition-all"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleEdit(emp)}
                        className="p-3 text-gray-400 hover:text-agribank-maroon hover:bg-agribank-maroon/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Edit2 size={20} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <UsersIcon size={64} />
                      <p className="text-xl font-black uppercase tracking-widest italic">Không tìm thấy nhân viên nào</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
