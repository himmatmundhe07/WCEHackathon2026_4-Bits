import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Heart } from 'lucide-react';

const NGOSidebar = ({ mobileOpen, onMobileClose }: { mobileOpen: boolean, onMobileClose: () => void }) => {
  const location = useLocation();
  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: "Impact Dashboard", path: "/ngo/dashboard" },
    { icon: <Users size={20} />, label: "Our Patients (EHR)", path: "/ngo/dashboard/patients" },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 z-40 lg:hidden transition-opacity ${mobileOpen ? 'block' : 'hidden'}`} 
        onClick={onMobileClose} 
      />
      
      {/* Sidebar Content */}
      <aside className={`fixed top-0 left-0 h-full w-[260px] bg-white border-r border-slate-200 z-50 transition-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-600/20">
              <Heart size={20} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-rose-400 tracking-tight">
              Sanjeevani NGO
            </span>
          </div>
        </div>
        
        <nav className="px-4 space-y-2 mt-4">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                onClick={onMobileClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-rose-50 text-rose-600 shadow-sm shadow-rose-100/50' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-rose-600'
                }`}
              >
                {item.icon} 
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default NGOSidebar;
