import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Shield, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Store,
  Bell,
  Search
} from 'lucide-react';

const Sidebar = ({ session, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notifications, setNotifications] = useState(3);

  const isAdmin = session?.role === 'Admin';
  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', badge: null },
    { path: '/ventas', icon: ShoppingCart, label: 'Caja / Ventas', badge: null },
    { path: '/almacen', icon: Package, label: 'Almacén', badge: null},
  ];

  const adminItems = [
    { path: '/admin', icon: Shield, label: 'Panel Admin', badge: null },
    { path: '/reportes', icon: BarChart3, label: 'Reportes', badge: null },
    { path: '/usuarios', icon: Users, label: 'Usuarios', badge: null },
  ];

  const SidebarLink = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    
    return (
      <Link
        to={item.path}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: isCollapsed ? '12px' : '12px 16px',
          marginBottom: '4px',
          borderRadius: '10px',
          textDecoration: 'none',
          color: active ? '#3b82f6' : '#64748b',
          backgroundColor: active ? '#eff6ff' : 'transparent',
          transition: 'all 0.2s ease',
          position: 'relative',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          border: active ? '1px solid #dbeafe' : '1px solid transparent',
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = '#f1f5f9';
            e.currentTarget.style.color = '#1e293b';
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#64748b';
          }
        }}
      >
        <Icon size={20} style={{ minWidth: '20px' }} />
        
        {!isCollapsed && (
          <>
            <span style={{ 
              marginLeft: '12px', 
              fontSize: '0.9rem', 
              fontWeight: active ? '600' : '500',
              flex: 1
            }}>
              {item.label}
            </span>
            
            {item.badge && (
              <span style={{
                backgroundColor: '#ef4444',
                color: '#fff',
                fontSize: '0.7rem',
                padding: '2px 6px',
                borderRadius: '10px',
                fontWeight: '600',
              }}>
                {item.badge}
              </span>
            )}
          </>
        )}
        
        {isCollapsed && item.badge && (
          <span style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            backgroundColor: '#ef4444',
            borderRadius: '50%',
            border: '2px solid #fff'
          }} />
        )}
      </Link>
    );
  };

  return (
    <div style={{ display: 'flex' }}>
      <aside
        style={{
          width: isCollapsed ? '80px' : '280px',
          height: '100vh',
          backgroundColor: '#ffffff',
          color: '#1e293b',
          position: 'fixed',
          left: 0,
          top: 0,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s ease',
          boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
          borderRight: '1px solid #e2e8f0',
          zIndex: 1000,
        }}
      >
        {/* Header */}
        <div style={{ 
          padding: '24px 20px', 
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            opacity: isCollapsed ? 0 : 1,
            transition: 'opacity 0.2s',
            overflow: 'hidden',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Store size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ 
                fontSize: '1.1rem', 
                fontWeight: '700', 
                margin: 0,
                color: '#1e293b',
              }}>
                GestorVentas
              </h1>
            </div>
          </div>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* User Info Card */}
        {!isCollapsed && (
          <div style={{ 
            padding: '16px', 
            margin: '16px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#3b82f6',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: '600',
              }}>
                {session?.userId?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ 
                  margin: 0, 
                  fontWeight: '600', 
                  fontSize: '0.85rem',
                  color: '#1e293b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {session?.userId || 'Usuario'}
                </p>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.75rem', 
                  color: '#3b82f6',
                  fontWeight: '500'
                }}>
                  {session?.role || 'Personal'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ 
          flex: 1, 
          padding: '0 12px',
          overflowY: 'auto',
        }}>
          <div style={{ 
            fontSize: '0.65rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            color: '#94a3b8',
            marginBottom: '8px',
            marginLeft: '12px',
            marginTop: '8px',
            display: isCollapsed ? 'none' : 'block',
            fontWeight: '700'
          }}>
            Menú Principal
          </div>
          
          {menuItems.map((item) => (
            <SidebarLink key={item.path} item={item} />
          ))}

          {isAdmin && (
            <>
              <div style={{ 
                fontSize: '0.65rem', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em',
                color: '#94a3b8',
                marginTop: '24px',
                marginBottom: '8px',
                marginLeft: '12px',
                display: isCollapsed ? 'none' : 'block',
                fontWeight: '700'
              }}>
                Administración
              </div>
              {adminItems.map((item) => (
                <SidebarLink key={item.path} item={item} />
              ))}
            </>
          )}
        </nav>

        {/* Footer Actions */}
        <div style={{ 
          padding: '16px', 
          borderTop: '1px solid #f1f5f9',
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '12px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
          }}>

            


          </div>

          <button
            onClick={onLogout}
            style={{
              width: '100%',
              background: '#fff1f2',
              border: '1px solid #ffe4e6',
              borderRadius: '10px',
              padding: isCollapsed ? '12px' : '10px 16px',
              color: '#e11d48',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: '10px',
              transition: 'all 0.2s',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#ffe4e6'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#fff1f2'}
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      <div style={{ 
        marginLeft: isCollapsed ? '80px' : '280px',
        transition: 'margin-left 0.3s ease',
      }} />
    </div>
  );
};

export default Sidebar;