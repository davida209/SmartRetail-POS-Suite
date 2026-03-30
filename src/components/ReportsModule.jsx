import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import * as XLSX from 'xlsx/xlsx.mjs';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  RefreshCw,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Store,
  Filter,
  Search,
  FileSpreadsheet,
  MoreHorizontal,
  Clock
} from 'lucide-react';

const ReportsModule = ({ session }) => {
  const isAdmin = session && session.role && session.role.toLowerCase() === 'admin';

  const [reporte, setReporte] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stockCritico, setStockCritico] = useState([]);
  const [dateRange, setDateRange] = useState('7d');
  const [metrics, setMetrics] = useState({ 
    total: 0, 
    tickets: 0, 
    promedio: 0, 
    totalDescuentos: 0,
    topProductos: [],
    ventasPorDia: []
  });

  const cargarDatos = async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const ventas = await db.ventas
        .where('storeId').equals(session.storeId)
        .toArray() || [];
      
      const productos = await db.productos.toArray();
      const criticos = productos.filter(p => p.stock <= 5);
      setStockCritico(criticos);

      setReporte(ventas);
      procesarAnalitica(ventas);
    } catch (err) {
      console.error("Error en analitica:", err);
    } finally {
      setLoading(false);
    }
  };

  const procesarAnalitica = (data) => {
    const ingresos = data.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
    const descuentos = data.reduce((acc, v) => acc + (Number(v.descuentoGral) || 0), 0);

    const conteoProd = {};
    data.forEach(v => {
      v.items?.forEach(item => {
        conteoProd[item.nombre] = (conteoProd[item.nombre] || 0) + item.cantidad;
      });
    });
    
    const top = Object.entries(conteoProd)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const ventasDias = {};
    data.forEach(v => {
      const fecha = new Date(v.timestamp).toLocaleDateString();
      ventasDias[fecha] = (ventasDias[fecha] || 0) + v.total;
    });
    
    const ultimosDias = Object.entries(ventasDias)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .slice(0, 7)
      .reverse();

    setMetrics({
      total: ingresos,
      tickets: data.length,
      promedio: data.length > 0 ? (ingresos / data.length) : 0,
      totalDescuentos: descuentos,
      topProductos: top,
      ventasPorDia: ultimosDias
    });
  };

  useEffect(() => {
    if (isAdmin) cargarDatos();
  }, [session, isAdmin]);

  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reporte.map(v => ({
      ID: v.id,
      Fecha: new Date(v.timestamp).toLocaleString(),
      Total: v.total,
      Descuento: v.descuentoGral,
      Vendedor: v.userId
    })));
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, `Reporte_${session.storeId}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const maxVentaDia = Math.max(...metrics.ventasPorDia.map(d => d[1]), 1);
  const maxCantProd = Math.max(...metrics.topProductos.map(p => p[1]), 1);

  // Componentes UI
  const StatCard = ({ icon: Icon, label, value, subtext, color, trend, trendUp }) => (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
      border: '1px solid #e2e8f0',
      transition: 'all 0.2s ease',
      position: 'relative',
      overflow: 'hidden',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)';
    }}
    >
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        right: 0, 
        width: '100px', 
        height: '100px', 
        background: `linear-gradient(135deg, ${color}08 0%, ${color}15 100%)`,
        borderRadius: '0 0 0 100%',
        opacity: 0.5,
      }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon size={24} color={color} />
        </div>
        {trend && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            background: trendUp ? '#dcfce7' : '#fee2e2',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: trendUp ? '#16a34a' : '#dc2626',
          }}>
            {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend}%
          </div>
        )}
      </div>
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>{label}</p>
        <h3 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1.75rem', fontWeight: '700' }}>{value}</h3>
        {subtext && <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.75rem' }}>{subtext}</p>}
      </div>
    </div>
  );

  const ActionButton = ({ onClick, icon: Icon, label, variant = 'primary', loading = false, fullWidth = false }) => {
    const variants = {
      primary: {
        background: '#0f172a',
        color: '#fff',
        hover: '#1e293b',
      },
      secondary: {
        background: '#fff',
        color: '#0f172a',
        border: '1px solid #e2e8f0',
        hover: '#f8fafc',
      },
      outline: {
        background: 'transparent',
        color: '#0f172a',
        border: '1px solid #e2e8f0',
        hover: '#f8fafc',
      }
    };

    const style = variants[variant];

    return (
      <button
        onClick={onClick}
        disabled={loading}
        style={{
          padding: '10px 20px',
          background: style.background,
          color: style.color,
          border: style.border || 'none',
          borderRadius: '10px',
          fontWeight: '600',
          fontSize: '0.875rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: fullWidth ? '100%' : 'auto',
          opacity: loading ? 0.6 : 1,
          transition: 'all 0.2s ease',
          boxShadow: variant === 'primary' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
        }}
        onMouseEnter={(e) => {
          if (!loading) e.currentTarget.style.background = style.hover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = style.background;
        }}
      >
        {loading ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Icon size={18} />}
        {label}
      </button>
    );
  };

  if (!isAdmin) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ 
          maxWidth: '480px', 
          width: '100%',
          background: '#fff', 
          padding: '48px', 
          borderRadius: '24px', 
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <AlertCircle size={40} color="#dc2626" />
          </div>
          <h2 style={{ 
            color: '#0f172a', 
            fontWeight: '700', 
            fontSize: '1.75rem',
            margin: '0 0 12px 0' 
          }}>
            Acceso Restringido
          </h2>
          <p style={{ 
            color: '#64748b', 
            fontSize: '1rem', 
            lineHeight: '1.6',
            margin: '0 0 8px 0'
          }}>
            Tu rol actual es: <strong>{session?.role || 'No definido'}</strong>
          </p>
          <p style={{ 
            color: '#94a3b8', 
            fontSize: '0.875rem', 
            margin: '0 0 32px 0'
          }}>
            Se requiere rol de administrador para acceder al dashboard de rendimiento.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 32px',
              background: '#f1f5f9',
              color: '#475569',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
          >
            Reintentar Acceso
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ color: '#64748b', fontWeight: '500' }}>Cargando métricas...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8fafc',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              background: '#10b981',
              borderRadius: '50%',
              boxShadow: '0 0 0 3px #d1fae5',
            }} />
            <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '600' }}>Datos Actualizados</span>
          </div>
          <h1 style={{ 
            margin: '0 0 8px 0', 
            color: '#0f172a', 
            fontSize: '2rem', 
            fontWeight: '800',
            letterSpacing: '-0.025em',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <BarChart3 size={32} color="#3b82f6" />
            Dashboard de Rendimiento
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>
            Análisis estratégico • {session?.user || 'Admin'} • {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            padding: '4px',
            background: '#fff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
          }}>
            {['24h', '7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: dateRange === range ? '#0f172a' : 'transparent',
                  color: dateRange === range ? '#fff' : '#64748b',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {range === '24h' ? '24 horas' : range === '7d' ? '7 días' : range === '30d' ? '30 días' : '3 meses'}
              </button>
            ))}
          </div>
          
          <ActionButton 
            onClick={cargarDatos} 
            icon={RefreshCw} 
            label="Actualizar" 
            loading={loading}
          />
          <ActionButton 
            onClick={exportarExcel} 
            icon={FileSpreadsheet} 
            label="Exportar Excel" 
            variant="secondary"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
        gap: '20px', 
        marginBottom: '32px' 
      }}>
        <StatCard 
          icon={DollarSign} 
          label="Ingresos Totales" 
          value={`$${metrics.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          subtext="Ventas acumuladas"
          color="#10b981"
          trend={12.5}
          trendUp={true}
        />
        <StatCard 
          icon={TrendingDown} 
          label="Descuentos Aplicados" 
          value={`-$${metrics.totalDescuentos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          subtext="Impacto en ingresos"
          color="#f59e0b"
          trend={5.2}
          trendUp={false}
        />
        <StatCard 
          icon={ShoppingCart} 
          label="Ticket Promedio" 
          value={`$${metrics.promedio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          subtext={`${metrics.tickets} transacciones totales`}
          color="#3b82f6"
        />
        <StatCard 
          icon={Package} 
          label="Productos Vendidos" 
          value={metrics.topProductos.reduce((acc, [, cant]) => acc + cant, 0)}
          subtext="Unidades totales"
          color="#8b5cf6"
        />
      </div>

      {/* Main Content Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Sales Chart */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          gridColumn: 'span 2',
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '28px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Activity size={24} color="#2563eb" />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1.25rem', fontWeight: '700' }}>
                  Flujo de Ventas
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
                  Últimos 7 días
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ 
                padding: '6px 12px', 
                background: '#f1f5f9', 
                borderRadius: '8px', 
                fontSize: '0.75rem',
                color: '#64748b',
                fontWeight: '500'
              }}>
                <Calendar size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                {new Date().toLocaleDateString('es-MX')}
              </span>
            </div>
          </div>

          {/* Chart */}
          <div style={{ height: '280px', position: 'relative' }}>
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 40,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '12px',
            }}>
              {metrics.ventasPorDia.map(([fecha, monto], i) => {
                const height = (monto / maxVentaDia) * 100;
                const isHighest = monto === maxVentaDia;
                
                return (
                  <div key={i} style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: '60px',
                    }}>
                      {/* Tooltip */}
                      <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: '8px',
                        padding: '8px 12px',
                        background: '#0f172a',
                        color: '#fff',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        pointerEvents: 'none',
                      }} className="chart-tooltip">
                        ${monto.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                      </div>
                      
                      {/* Bar */}
                      <div 
                        style={{
                          height: `${height}%`,
                          minHeight: '4px',
                          background: isHighest 
                            ? 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)'
                            : 'linear-gradient(180deg, #93c5fd 0%, #3b82f6 100%)',
                          borderRadius: '6px 6px 0 0',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.filter = 'brightness(1.1)';
                          e.currentTarget.parentElement.querySelector('.chart-tooltip').style.opacity = 1;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.filter = 'brightness(1)';
                          e.currentTarget.parentElement.querySelector('.chart-tooltip').style.opacity = 0;
                        }}
                      />
                    </div>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      color: '#94a3b8', 
                      fontWeight: '500',
                      textAlign: 'center'
                    }}>
                      {fecha.split('/')[0]}/{fecha.split('/')[1]}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Y-axis labels */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 40,
              width: '50px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              paddingRight: '12px',
              borderRight: '1px solid #e2e8f0',
            }}>
              {[100, 75, 50, 25, 0].map((pct) => (
                <span key={pct} style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  ${Math.round((maxVentaDia * pct) / 100).toLocaleString()}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '24px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <PieChart size={24} color="#16a34a" />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1.25rem', fontWeight: '700' }}>
                  Top Productos
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
                  Más vendidos
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {metrics.topProductos.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                color: '#94a3b8'
              }}>
                <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p style={{ margin: 0, fontWeight: '500' }}>Sin datos de ventas</p>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.875rem' }}>Realiza ventas para ver estadísticas</p>
              </div>
            ) : (
              metrics.topProductos.map(([nombre, cant], i) => {
                const percentage = (cant / maxCantProd) * 100;
                const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316'];
                const color = colors[i % colors.length];
                
                return (
                  <div key={i}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: '8px',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          width: '24px',
                          height: '24px',
                          background: `${color}15`,
                          color: color,
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                        }}>
                          {i + 1}
                        </span>
                        <span style={{ 
                          color: '#0f172a', 
                          fontSize: '0.875rem', 
                          fontWeight: '500',
                          maxWidth: '180px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {nombre}
                        </span>
                      </div>
                      <span style={{ 
                        color: '#64748b', 
                        fontSize: '0.875rem', 
                        fontWeight: '600',
                        fontFamily: 'monospace'
                      }}>
                        {cant} u.
                      </span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      background: '#f1f5f9', 
                      height: '8px', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${percentage}%`, 
                        background: `linear-gradient(90deg, ${color}80 0%, ${color} 100%)`,
                        height: '100%', 
                        borderRadius: '4px',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px'
      }}>
        {/* Critical Stock */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          borderTop: '4px solid #ef4444',
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '20px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <AlertTriangle size={24} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1.125rem', fontWeight: '700' }}>
                  Stock Crítico
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
                  {stockCritico.length} productos requieren atención
                </p>
              </div>
            </div>
            <span style={{
              padding: '6px 12px',
              background: '#fef2f2',
              color: '#dc2626',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '700',
            }}>
              ≤ 5 unidades
            </span>
          </div>

          <div style={{ 
            maxHeight: '300px', 
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            {stockCritico.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                background: '#f8fafc',
                borderRadius: '12px',
              }}>
                <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 12px' }} />
                <p style={{ margin: 0, color: '#10b981', fontWeight: '600' }}>Inventario saludable</p>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
                  No hay productos en stock crítico
                </p>
              </div>
            ) : (
              stockCritico.map((p, i) => (
                <div 
                  key={i} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '14px 16px',
                    background: i % 2 === 0 ? '#fafafa' : '#fff',
                    borderRadius: '10px',
                    border: '1px solid #f1f5f9',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fef2f2';
                    e.currentTarget.style.borderColor = '#fecaca';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = i % 2 === 0 ? '#fafafa' : '#fff';
                    e.currentTarget.style.borderColor = '#f1f5f9';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      background: '#fee2e2',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Package size={18} color="#dc2626" />
                    </div>
                    <div>
                      <p style={{ margin: '0 0 2px 0', color: '#0f172a', fontWeight: '600', fontSize: '0.875rem' }}>
                        {p.nombre}
                      </p>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.75rem' }}>
                        SKU: {p.id || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    background: p.stock === 0 ? '#fee2e2' : '#fef3c7',
                    color: p.stock === 0 ? '#dc2626' : '#d97706',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    minWidth: '50px',
                    textAlign: 'center',
                  }}>
                    {p.stock === 0 ? 'AGOTADO' : `${p.stock} pz`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Status */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '20px',
          padding: '28px',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '24px' 
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Store size={24} color="#fff" />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.125rem', fontWeight: '700' }}>
                  Estado del Sistema
                </h3>
                <p style={{ margin: 0, opacity: 0.7, fontSize: '0.875rem' }}>
                  {session?.storeId || 'Sucursal Principal'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '16px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: '#10b981',
                  borderRadius: '50%',
                  boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.3)',
                }} />
                <div>
                  <p style={{ margin: '0 0 2px 0', fontWeight: '600' }}>Base de datos local</p>
                  <p style={{ margin: 0, opacity: 0.6, fontSize: '0.75rem' }}>Sincronizada y operativa</p>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '16px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <Clock size={18} color="#94a3b8" />
                <div>
                  <p style={{ margin: '0 0 2px 0', fontWeight: '600' }}>Última actualización</p>
                  <p style={{ margin: 0, opacity: 0.6, fontSize: '0.75rem' }}>
                    {new Date().toLocaleTimeString('es-MX')}
                  </p>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '16px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <CheckCircle2 size={18} color="#3b82f6" />
                <div>
                  <p style={{ margin: '0 0 2px 0', fontWeight: '600' }}>{metrics.tickets} tickets</p>
                  <p style={{ margin: 0, opacity: 0.6, fontSize: '0.75rem' }}>Registrados en el período</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ 
            marginTop: '24px',
            padding: '16px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '0.875rem', opacity: 0.8 }}>
              Total histórico registrado
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: '1.5rem', 
              fontWeight: '700',
              fontFamily: 'monospace'
            }}>
              ${metrics.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '1.125rem', fontWeight: '700' }}>
            Acciones Rápidas
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={cargarDatos}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <RefreshCw size={20} color="#2563eb" />
              </div>
              <div>
                <p style={{ margin: '0 0 2px 0', color: '#0f172a', fontWeight: '600' }}>Actualizar datos</p>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>Recargar métricas en tiempo real</p>
              </div>
            </button>

            <button
              onClick={exportarExcel}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <FileSpreadsheet size={20} color="#16a34a" />
              </div>
              <div>
                <p style={{ margin: '0 0 2px 0', color: '#0f172a', fontWeight: '600' }}>Exportar Excel</p>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>Descargar reporte completo</p>
              </div>
            </button>

            <button
              onClick={() => window.print()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Download size={20} color="#7c3aed" />
              </div>
              <div>
                <p style={{ margin: '0 0 2px 0', color: '#0f172a', fontWeight: '600' }}>Imprimir reporte</p>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>Generar versión imprimible</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
};

export default ReportsModule;