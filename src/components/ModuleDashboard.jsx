import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import { 
  TrendingUp, 
  AlertTriangle, 
  Database, 
  ExternalLink, 
  Mail, 
  Phone, 
  User,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowRight,
  ShoppingCart  
} from 'lucide-react';

const ModuleDashboard = ({ session }) => {
  const [stats, setStats] = useState({
    ventasHoy: 0,
    montoHoy: 0,
    stockBajo: 0,
    totalProductos: 0
  });
  const [ultimasVentas, setUltimasVentas] = useState([]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const hoy = new Date().toISOString().split('T')[0];
        
        // Métricas de Ventas
        const todasVentas = await db.ventas.where('storeId').equals(session.storeId).toArray();
        const ventasHoy = todasVentas.filter(v => v.timestamp.startsWith(hoy));
        const monto = ventasHoy.reduce((acc, v) => acc + (v.total || 0), 0);

        // Métricas de Inventario
        const productos = await db.productos.where('storeId').equals(session.storeId).toArray();
        const bajos = productos.filter(p => p.stock <= 5).length;

        setStats({
          ventasHoy: ventasHoy.length,
          montoHoy: monto,
          stockBajo: bajos,
          totalProductos: productos.length
        });

        // Últimos movimientos
        const ultimas = todasVentas
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5);
        setUltimasVentas(ultimas);

      } catch (error) {
        console.error("Error en ModuleDashboard:", error);
      }
    };
    cargarDatos();
  }, [session.storeId]);

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div style={{ 
      background: '#fff', 
      padding: '24px', 
      borderRadius: '20px', 
      border: '1px solid #f1f5f9', 
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ backgroundColor: `${color}15`, padding: '10px', borderRadius: '12px', color: color }}>
          <Icon size={22} />
        </div>
        <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>{subtitle}</span>
      </div>
      <h4 style={{ margin: 0, color: '#64748b', fontSize: '0.8rem', fontWeight: '600' }}>{title}</h4>
      <p style={{ margin: '4px 0 0 0', fontSize: '1.6rem', fontWeight: '800', color: '#0f172a' }}>{value}</p>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontWeight: '900', fontSize: '1.8rem', letterSpacing: '-0.5px' }}>Consola de Mando</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', color: '#64748b', fontSize: '0.9rem' }}>
            <Clock size={14} /> 
            <span>Sucursal {session.storeId} — Sistema Operativo</span>
          </div>
        </div>
        <div style={{ background: '#fff', padding: '10px 18px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontWeight: '700', fontSize: '0.85rem' }}>
          <Calendar size={16} color="#3b82f6" />
          {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <StatCard title="Ingresos de Hoy" value={`$${stats.montoHoy.toFixed(2)}`} icon={TrendingUp} color="#10b981" subtitle="Finanzas" />
        <StatCard title="Artículos Críticos" value={stats.stockBajo} icon={AlertTriangle} color="#f59e0b" subtitle="Inventario" />
        <StatCard title="Ventas Realizadas" value={stats.ventasHoy} icon={ShoppingCart} color="#3b82f6" subtitle="Operaciones" />
        <StatCard title="Seguridad de Datos" value="Encriptado" icon={ShieldCheck} color="#6366f1" subtitle="Estado" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', border: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', fontWeight: '800', color: '#1e293b' }}>Actividad Reciente</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ultimasVentas.length > 0 ? ultimasVentas.map(v => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ background: '#fff', borderRadius: '10px', padding: '8px', border: '1px solid #e2e8f0' }}>
                    <TrendingUp size={16} color="#10b981" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700' }}>Ticket #{v.id}</p>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(v.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
                <span style={{ fontWeight: '800', color: '#0f172a' }}>${v.total.toFixed(2)}</span>
              </div>
            )) : <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>No hay ventas registradas el día de hoy.</p>}
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '24px', padding: '32px', color: '#fff' }}>
          <div style={{ marginBottom: '24px' }}>
            <span style={{ background: '#3b82f6', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase' }}>Desarrollador Senior</span>
            <h3 style={{ margin: '12px 0 4px 0', fontSize: '1.3rem', fontWeight: '800' }}>Lester David Uicab Gongora</h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>Ingeniero en Sistemas Computacionales</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Mail size={18} color="#3b82f6" />
              <span style={{ fontSize: '0.9rem' }}>davidlug209@gmail.com</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Phone size={18} color="#3b82f6" />
              <span style={{ fontSize: '0.9rem' }}>+52 9903684934</span>
            </div>
          </div>

          <a 
            href="mailto:davidlug209@gmail.com" 
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', 
              marginTop: '32px', padding: '14px', borderRadius: '14px', background: '#3b82f6', 
              color: '#fff', textDecoration: 'none', fontWeight: '800', fontSize: '0.85rem' 
            }}
          >
            Solicitar Soporte Técnico <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ModuleDashboard;
