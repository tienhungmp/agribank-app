import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, Filter, User, CreditCard, Users as UsersIcon, ChevronRight, Building2 } from 'lucide-react';

export default function IncomePage() {
  const [search, setSearch] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tax/summary', { params: { month: new Date().getMonth() + 1, year: new Date().getFullYear() } });
      const filtered = res.data.filter((e: any) => 
        e.fullName.toLowerCase().includes(search.toLowerCase()) || 
        e.accountNumber.includes(search)
      );
      setData(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-agribank-maroon transition-colors" size={20} />
          <input
            type="text"
            placeholder="Tìm theo Họ tên hoặc Số tài khoản..."
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-agribank-maroon focus:bg-white transition-all font-bold text-gray-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button 
          onClick={handleSearch}
          className="px-10 py-4 bg-agribank-maroon text-white font-black rounded-2xl hover:bg-agribank-maroon/90 transition-all shadow-lg shadow-agribank-maroon/20 tracking-widest uppercase text-sm"
        >
          TÌM KIẾM
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List */}
        <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col max-h-[700px]">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-black text-gray-800 text-xs uppercase tracking-widest">Kết quả tìm kiếm ({data.length})</h3>
          </div>
          <div className="flex-1 overflow-auto divide-y divide-gray-50">
            {data.map((emp) => (
              <button
                key={emp.accountNumber}
                onClick={() => setSelectedEmp(emp)}
                className={`w-full p-6 text-left hover:bg-gray-50 transition-all flex items-center justify-between group ${
                  selectedEmp?.accountNumber === emp.accountNumber ? 'bg-agribank-maroon/5 border-l-4 border-agribank-maroon' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-colors ${
                    selectedEmp?.accountNumber === emp.accountNumber ? 'bg-agribank-maroon text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {emp.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-gray-800 text-sm tracking-tight">{emp.fullName}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{emp.accountNumber}</p>
                  </div>
                </div>
                <ChevronRight size={18} className={`transition-all ${selectedEmp?.accountNumber === emp.accountNumber ? 'text-agribank-maroon translate-x-1' : 'text-gray-300 group-hover:text-agribank-maroon group-hover:translate-x-1'}`} />
              </button>
            ))}
            {data.length === 0 && !loading && (
              <div className="p-16 text-center text-gray-400 font-bold italic text-sm">Nhập thông tin để tìm kiếm</div>
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
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Thu nhập & Giảm trừ</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-bold text-sm">Thu nhập chịu thuế (TNCT)</span>
                        <span className="font-mono font-black text-gray-800">{selectedEmp.taxableIncome.toLocaleString('vi-VN')} ₫</span>
                      </div>
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
                      <div className="flex justify-between items-center text-red-500">
                        <span className="text-xs font-bold">(-) Từ thiện, nhân đạo</span>
                        <span className="font-mono font-bold">({selectedEmp.deductCharity.toLocaleString('vi-VN')}) ₫</span>
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
                      Bậc {selectedEmp.netTaxableIncome > 100000000 ? 5 : selectedEmp.netTaxableIncome > 60000000 ? 4 : selectedEmp.netTaxableIncome > 30000000 ? 3 : selectedEmp.netTaxableIncome > 10000000 ? 2 : 1} - {selectedEmp.netTaxableIncome > 100000000 ? '35%' : selectedEmp.netTaxableIncome > 60000000 ? '30%' : selectedEmp.netTaxableIncome > 30000000 ? '20%' : selectedEmp.netTaxableIncome > 10000000 ? '10%' : '5%'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-black text-gray-800 text-xs uppercase tracking-widest">Lịch sử Giao dịch tháng hiện tại</h3>
                </div>
                <div className="p-16 text-center text-gray-400 font-bold italic text-sm">
                  Chức năng xem chi tiết từng giao dịch đang được cập nhật...
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
