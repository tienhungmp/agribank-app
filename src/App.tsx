import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { 
  LayoutDashboard, 
  Upload, 
  Users, 
  Building2, 
  FileDown, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronRight,
  History,
  BarChart3
} from 'lucide-react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import IncomePage from './pages/IncomePage';
import ExportPage from './pages/ExportPage';
import EmployeePage from './pages/EmployeePage';
import HistoryPage from './pages/HistoryPage';
import StatisticsPage from './pages/StatisticsPage';
import logo from './assets/logo-agribank.jpg';

const Logo = ({ className = "w-10 h-10" }) => (
  <img src={logo} alt="Agribank Logo" className={`${className} object-contain`} />
);

const SidebarItem = ({ to, icon: Icon, label, active }: any) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
      active 
        ? 'bg-agribank-maroon text-white shadow-lg scale-[1.02]' 
        : 'text-gray-600 hover:bg-agribank-maroon/5 hover:text-agribank-maroon'
    }`}
  >
    <Icon size={20} className={`transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-gray-400 group-hover:text-agribank-maroon'}`} />
    <span className={`font-bold text-sm ${active ? 'text-white' : ''}`}>{label}</span>
  </Link>
);

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { to: '/', icon: LayoutDashboard, label: 'Tổng quan' },
    { to: '/upload', icon: Upload, label: 'Upload Dữ liệu' },
    { to: '/income', icon: Users, label: 'Tra cứu Thu nhập' },
    { to: '/employees', icon: Building2, label: 'Quản lý Cán bộ' },
    { to: '/history', icon: History, label: 'Lịch sử Upload' },
    { to: '/stats', icon: BarChart3, label: 'Thống kê Thu nhập' },
    { to: '/tax', icon: FileDown, label: 'Báo cáo Thuế' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-gray-100 p-6 sticky top-0 h-screen shadow-sm">
        <div className="flex items-center gap-4 mb-10 px-2">
          <Logo className="w-12 h-12" />
          <div>
            <h1 className="text-agribank-maroon font-black text-xl tracking-tighter leading-none">AGRIBANK</h1>
            <p className="text-[10px] font-bold text-agribank-green uppercase tracking-widest mt-1">Phú Yên - Thuế TNCN</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <SidebarItem 
              key={item.to} 
              {...item} 
              active={location.pathname === item.to} 
            />
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <div className="flex items-center gap-4 px-2 mb-6">
            <div className="w-10 h-10 bg-agribank-maroon/10 rounded-full flex items-center justify-center text-agribank-maroon font-black border-2 border-agribank-maroon/20">
              {user?.fullName?.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-black text-gray-800 truncate leading-none">{user?.fullName}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{user?.role === 'admin' ? 'Hội sở' : `CN ${user?.branchCode}`}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all group font-bold text-sm"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} className="text-agribank-maroon" />
            </button>
            <h2 className="text-xl font-black text-agribank-maroon tracking-tight">
              {menuItems.find(i => i.to === location.pathname)?.label || 'Hệ thống'}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Ngày hiện tại</p>
              <p className="text-sm font-black text-agribank-maroon">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </header>

        <div className="p-8 overflow-auto">
          {children}
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-72 h-full bg-white p-6 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <Logo className="w-10 h-10" />
                <h1 className="text-agribank-maroon font-black text-lg tracking-tighter">AGRIBANK</h1>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 space-y-2">
              {menuItems.map((item) => (
                <SidebarItem 
                  key={item.to} 
                  {...item} 
                  active={location.pathname === item.to} 
                />
              ))}
            </nav>
            <button 
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-sm mt-auto"
            >
              <LogOut size={18} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <MainLayout>{children}</MainLayout> : <Navigate to="/login" />;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/upload" element={<PrivateRoute><UploadPage /></PrivateRoute>} />
          <Route path="/income" element={<PrivateRoute><IncomePage /></PrivateRoute>} />
          <Route path="/employees" element={<PrivateRoute><EmployeePage /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
          <Route path="/stats" element={<PrivateRoute><StatisticsPage /></PrivateRoute>} />
          <Route path="/tax" element={<PrivateRoute><ExportPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}
