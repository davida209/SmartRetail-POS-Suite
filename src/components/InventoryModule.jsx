import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import { SyncService } from '../services/syncService';
import * as XLSX from 'xlsx';
import { 
  Package,
  Search,
  Plus,
  Edit3,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  X,
  Save,
  Filter,
  Grid,
  List,
  BarChart3,
  MoreVertical,
  FileSpreadsheet,
  Archive,
  RefreshCw
} from 'lucide-react';

const InventoryModule = ({ session }) => {
  const [productos, setProductos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [verSoloBajoStock, setVerSoloBajoStock] = useState(false);
  const [form, setForm] = useState({ codigo: '', nombre: '', precio: 0, stock: 0 });
  const [editId, setEditId] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [showForm, setShowForm] = useState(false);
  const [notification, setNotification] = useState(null);
  const [stats, setStats] = useState({ total: 0, agotados: 0, bajos: 0, valor: 0 });
  const esAdmin = session?.role?.toLowerCase() === 'admin';
  useEffect(() => {
    loadProducts();
  }, [session.storeId]);

  useEffect(() => {
    const total = productos.length;
    const agotados = productos.filter(p => p.stock === 0).length;
    const bajos = productos.filter(p => p.stock > 0 && p.stock <= 5).length;
    const valor = productos.reduce((acc, p) => acc + (p.precio * p.stock), 0);
    setStats({ total, agotados, bajos, valor });
  }, [productos]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadProducts = async () => {
    const data = await db.productos.where('storeId').equals(session.storeId).toArray();
    setProductos(data);
  };

  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(filtro.toLowerCase()) || p.codigo.includes(filtro);
    const coincideBajoStock = verSoloBajoStock ? p.stock <= 5 : true;
    return coincideBusqueda && coincideBajoStock;
  });

  const exportarAExcel = () => {
    if (productos.length === 0) return showNotification("No hay productos para exportar", 'error');

    const datosPlanos = productos.map(p => ({
      CODIGO: p.codigo,
      NOMBRE: p.nombre,
      PRECIO: p.precio,
      STOCK: p.stock,
      ESTADO: p.stock === 0 ? 'AGOTADO' : (p.stock <= 5 ? 'BAJO' : 'OK'),
      SUCURSAL: p.storeId
    }));

    const worksheet = XLSX.utils.json_to_sheet(datosPlanos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");
    
    XLSX.writeFile(workbook, `Inventario_${session.storeId}_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotification("Inventario exportado correctamente");
  };

  const vaciarInventario = async () => {
    const confirmar1 = confirm("¿ESTÁS SEGURO? Esta acción eliminará TODOS los productos de esta sucursal.");
    if (confirmar1) {
      const confirmar2 = confirm("¿TOTALMENTE SEGURO? No podrás deshacer este cambio.");
      if (confirmar2) {
        await db.productos.where('storeId').equals(session.storeId).delete();
        showNotification("Inventario local vaciado", 'warning');
        loadProducts();
      }
    }
  };

  const importarExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });

        let count = 0;
        for (const item of data) {
          const normalizedItem = {};
          Object.keys(item).forEach(key => {
            const normalizedKey = key.toString().toLowerCase()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
              .trim().replace(/\s+/g, '_'); 
            normalizedItem[normalizedKey] = item[key];
          });

          const codigoStr = String(normalizedItem.codigo || "").trim();
          const nombreStr = String(normalizedItem.nombre || "").toUpperCase().trim();
          const precioVenta = parseFloat(normalizedItem.p_venta || normalizedItem.precio || 0);
          const existencia = parseInt(normalizedItem.stock || 0);

          if (!codigoStr || nombreStr === "") continue;

          const existe = await db.productos.where('codigo').equals(codigoStr)
            .and(p => p.storeId === session.storeId).first();
          
          if (!existe) {
            await db.productos.add({
              codigo: codigoStr,
              nombre: nombreStr,
              precio: precioVenta,
              stock: existencia,
              storeId: session.storeId,
              id: Date.now() + Math.random()
            });
            count++;
          }
        }
        showNotification(`Se agregaron ${count} productos correctamente`);
        loadProducts();
      } catch (err) {
        showNotification("Error al procesar el archivo", 'error');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null; 
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Validar si el código ya existe en OTRO producto diferente al actual
    const existe = await db.productos
      .where('codigo').equals(form.codigo)
      .and(p => p.storeId === session.storeId && p.id !== editId)
      .first();

    if (existe) {
      showNotification(`El código "${form.codigo}" ya lo tiene el producto: ${existe.nombre}`, 'error');
      return;
    }

    if (editId) {
      // 2. Lógica de Actualización
      const productoAnterior = productos.find(p => p.id === editId);
      
      // Validar si el usuario no es admin e intenta cambiar el precio
      if (!esAdmin && productoAnterior.precio !== form.precio) {
        showNotification("Solo el administrador puede cambiar precios", 'error');
        return;
      }

      await db.productos.update(editId, { ...form });
      setEditId(null);
      showNotification("Producto actualizado correctamente");
    } else {
      // 3. Lógica de Registro Nuevo
      await db.productos.add({ ...form, storeId: session.storeId, id: Date.now() });
      showNotification("Producto registrado correctamente");
    }

    // Limpiar formulario y recargar lista
    setForm({ codigo: '', nombre: '', precio: 0, stock: 0 });
    setShowForm(false);
    loadProducts();
  };

  const eliminarProductoTotal = async (p) => {
    if (!confirm(`¿Eliminar permanentemente "${p.nombre}" de forma LOCAL y en la NUBE?`)) return;
    
    try {
      await db.productos.delete(p.id);
      const idDocNube = p.codigo ? String(p.codigo) : `prod_${p.id}`;
      await SyncService.eliminarDocumentoNube("productos", idDocNube);

      await db.logs.add({
        storeId: session.storeId,
        timestamp: new Date().toISOString(),
        message: `AUDITORÍA: Producto ${p.nombre} eliminado del sistema total.`,
        user: session.userId
      });

      showNotification("Producto eliminado correctamente", 'warning');
      loadProducts();
    } catch (error) {
      showNotification("Error al procesar la baja", 'error');
    }
  };

  const getStockStyle = (stock) => {
    if (stock === 0) return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'AGOTADO', icon: AlertTriangle };
    if (stock <= 5) return { bg: '#fffbeb', text: '#d97706', border: '#fcd34d', label: 'BAJO STOCK', icon: AlertTriangle };
    return { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', label: 'DISPONIBLE', icon: CheckCircle2 };
  };

  const StatCard = ({ icon: Icon, label, value, subtext, color }) => (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      border: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      transition: 'all 0.2s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
    }}
    >
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
      <div>
        <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>{label}</p>
        <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.5rem', fontWeight: '700' }}>{value}</h3>
        {subtext && <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.75rem' }}>{subtext}</p>}
      </div>
    </div>
  );

  const ActionButton = ({ onClick, icon: Icon, label, variant = 'primary', danger = false, fileInput = false, accept, fullWidth = false }) => {
    const variants = {
      primary: { bg: danger ? '#dc2626' : '#0f172a', color: '#fff', hover: danger ? '#b91c1c' : '#1e293b' },
      secondary: { bg: '#fff', color: '#0f172a', border: '1px solid #e2e8f0', hover: '#f8fafc' },
      outline: { bg: 'transparent', color: danger ? '#dc2626' : '#0f172a', border: `1px solid ${danger ? '#fecaca' : '#e2e8f0'}`, hover: danger ? '#fef2f2' : '#f8fafc' }
    };
    const style = variants[variant];

    const buttonContent = (
      <button
        onClick={fileInput ? undefined : onClick}
        style={{
          padding: '10px 16px',
          background: style.bg,
          color: style.color,
          border: style.border || 'none',
          borderRadius: '10px',
          fontWeight: '600',
          fontSize: '0.875rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: fullWidth ? '100%' : 'auto',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = style.hover}
        onMouseLeave={(e) => e.currentTarget.style.background = style.bg}
      >
        <Icon size={18} />
        {label}
      </button>
    );

    if (fileInput) {
      return (
        <label style={{ display: 'inline-block' }}>
          {buttonContent}
          <input type="file" accept={accept} onChange={onClick} style={{ display: 'none' }} />
        </label>
      );
    }

    return buttonContent;
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8fafc',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: notification.type === 'error' ? '#dc2626' : notification.type === 'warning' ? '#f59e0b' : '#10b981',
          color: '#fff',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease',
        }}>
          {notification.type === 'error' ? <AlertTriangle size={24} /> : notification.type === 'warning' ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
          <p style={{ margin: 0, fontWeight: '600' }}>{notification.message}</p>
        </div>
      )}

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
            <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '600' }}>Sistema Activo</span>
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
            <Package size={32} color="#3b82f6" />
            Gestión de Inventario
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>
            {session.storeId} • {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <ActionButton 
            onClick={exportarAExcel} 
            icon={Download} 
            label="Exportar Excel" 
            variant="secondary"
          />
          <ActionButton 
            onClick={importarExcel} 
            icon={Upload} 
            label="Importar Excel" 
            variant="secondary"
            fileInput
            accept=".xlsx,.xls"
          />
          <ActionButton 
            onClick={() => setShowForm(!showForm)} 
            icon={Plus} 
            label={showForm ? 'Cerrar Formulario' : 'Nuevo Producto'} 
            variant="primary"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '32px' 
      }}>
        <StatCard 
          icon={Package} 
          label="Total Productos" 
          value={stats.total}
          subtext="En inventario"
          color="#3b82f6"
        />
        <StatCard 
          icon={AlertTriangle} 
          label="Agotados" 
          value={stats.agotados}
          subtext="Sin stock disponible"
          color="#dc2626"
        />
        <StatCard 
          icon={AlertTriangle} 
          label="Bajo Stock" 
          value={stats.bajos}
          subtext="≤ 5 unidades"
          color="#f59e0b"
        />
        <StatCard 
          icon={BarChart3} 
          label="Valor Inventario" 
          value={`$${stats.valor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          subtext="Precio × stock"
          color="#10b981"
        />
      </div>

      {/* Form Section */}
      {showForm && (
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          marginBottom: '32px',
          animation: 'slideDown 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: editId ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {editId ? <Edit3 size={24} color="#d97706" /> : <Plus size={24} color="#2563eb" />}
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1.25rem', fontWeight: '700' }}>
                {editId ? 'Editar Producto' : 'Registrar Nuevo Producto'}
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
                {editId ? 'Modifica los datos del producto seleccionado' : 'Completa todos los campos para registrar'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#374151', 
                  fontSize: '0.875rem', 
                  fontWeight: '600' 
                }}>
                  Código
                </label>
                <input 
                  style={{ 
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    background: editId ? '#f1f5f9' : '#fff',
                  }} 
                  value={form.codigo} 
                  onChange={e => setForm({...form, codigo: e.target.value})} 
                  required 
                 
                  placeholder="Ej: PROD-001"
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#374151', 
                  fontSize: '0.875rem', 
                  fontWeight: '600' 
                }}>
                  Nombre del Producto
                </label>
                <input 
                  style={{ 
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                  }} 
                  value={form.nombre} 
                  onChange={e => setForm({...form, nombre: e.target.value.toUpperCase()})} 
                  required 
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#374151', 
                  fontSize: '0.875rem', 
                  fontWeight: '600' 
                }}>
                  Precio de Venta
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ 
                    position: 'absolute', 
                    left: '16px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    fontWeight: '600'
                  }}>
                    $
                  </span>
                  <input 
                    type="number"
                    step="0.01"
                    style={{ 
                      width: '100%',
                      padding: '12px 16px 12px 32px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box',
                      background: session.role !== 'admin' && editId ? '#f1f5f9' : '#fff',
                    }} 
                    value={form.precio} 
                    onChange={e => setForm({...form, precio: parseFloat(e.target.value)})} 
                    required 
                    readOnly={!esAdmin && editId}
                    placeholder="0.00"
                  />
                </div>
                {session.role !== 'admin' && editId && (
                  <p style={{ margin: '6px 0 0 0', color: '#f59e0b', fontSize: '0.75rem' }}>
                    Solo administradores pueden modificar precios
                  </p>
                )}
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#374151', 
                  fontSize: '0.875rem', 
                  fontWeight: '600' 
                }}>
                  Stock Inicial
                </label>
                <input 
                  type="number"
                  style={{ 
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                  }} 
                  value={form.stock} 
                  onChange={e => setForm({...form, stock: parseInt(e.target.value)})} 
                  required 
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                type="submit" 
                style={{ 
                  padding: '12px 24px',
                  background: editId ? '#f59e0b' : '#0f172a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                <Save size={18} />
                {editId ? 'Actualizar Producto' : 'Guardar Producto'}
              </button>
              {editId && (
                <button 
                  type="button" 
                  onClick={() => { 
                    setEditId(null); 
                    setForm({ codigo: '', nombre: '', precio: 0, stock: 0 });
                  }}
                  style={{ 
                    padding: '12px 24px',
                    background: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                >
                  <X size={18} />
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Filters & Search */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
          <Search size={20} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o código de barras..." 
            style={{ 
              width: '100%',
              padding: '14px 16px 14px 48px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontSize: '1rem',
              outline: 'none',
              transition: 'all 0.2s',
              boxSizing: 'border-box',
              background: '#fff',
            }}
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <button
          onClick={() => setVerSoloBajoStock(!verSoloBajoStock)}
          style={{
            padding: '14px 20px',
            background: verSoloBajoStock ? '#fef3c7' : '#fff',
            color: verSoloBajoStock ? '#d97706' : '#64748b',
            border: `1px solid ${verSoloBajoStock ? '#fcd34d' : '#e2e8f0'}`,
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
        >
          <Filter size={18} />
          {verSoloBajoStock ? 'Ver Todos' : 'Solo Bajo Stock'}
        </button>

        <button
          onClick={vaciarInventario}
          style={{
            padding: '14px 20px',
            background: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
        >
          <Archive size={18} />
          Vaciar Inventario
        </button>
      </div>

      {/* Products Table */}
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Código
                </th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Producto
                </th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Precio
                </th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Stock
                </th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Estado
                </th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((p, index) => {
                const style = getStockStyle(p.stock);
                const StatusIcon = style.icon;
                
                return (
                  <tr 
                    key={p.id} 
                    style={{ 
                      borderBottom: '1px solid #f1f5f9',
                      background: index % 2 === 0 ? '#fff' : '#fafafa',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = index % 2 === 0 ? '#fff' : '#fafafa';
                    }}
                  >
                    <td style={{ padding: '20px 24px' }}>
                      <span style={{ 
                        fontFamily: 'monospace',
                        fontWeight: '600',
                        color: '#64748b',
                        fontSize: '0.875rem',
                        padding: '4px 8px',
                        background: '#f1f5f9',
                        borderRadius: '6px',
                      }}>
                        {p.codigo}
                      </span>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <p style={{ margin: 0, color: '#0f172a', fontWeight: '600', fontSize: '0.95rem' }}>
                        {p.nombre}
                      </p>
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                      <span style={{ 
                        color: '#059669', 
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        fontSize: '1rem'
                      }}>
                        ${p.precio.toFixed(2)}
                      </span>
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                      <span style={{ 
                        fontWeight: '700',
                        fontSize: '1.125rem',
                        color: style.text
                      }}>
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                      <div style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: style.bg,
                        border: `1px solid ${style.border}`,
                        borderRadius: '20px',
                      }}>
                        <StatusIcon size={14} color={style.text} />
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '700',
                          color: style.text,
                          textTransform: 'uppercase'
                        }}>
                          {style.label}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => { 
                            setForm(p); 
                            setEditId(p.id); 
                            setShowForm(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          style={{
                            padding: '8px',
                            background: '#fef3c7',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#d97706',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#fde68a'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#fef3c7'}
                          title="Editar"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => eliminarProductoTotal(p)}
                          style={{
                            padding: '8px',
                            background: '#fef2f2',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#dc2626',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {productosFiltrados.length === 0 && (
            <div style={{ 
              padding: '80px 20px', 
              textAlign: 'center',
              color: '#94a3b8',
            }}>
              <Package size={64} style={{ margin: '0 auto 24px', opacity: 0.2 }} />
              <p style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: '600', color: '#64748b' }}>
                No se encontraron productos
              </p>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                Intenta con otros términos de búsqueda o ajusta los filtros
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default InventoryModule;
