import React, { useState, useEffect } from 'react';
import { db, saveLog } from '../db/database';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Percent, 
  DollarSign, 
  ShoppingCart, 
  Calculator,
  Receipt,
  Package,
  AlertCircle,
  CheckCircle2,
  X,
  User,
  Store
} from 'lucide-react';

const SalesModule = ({ session }) => {
  const [busqueda, setBusqueda] = useState('');
  const [cantidadBase, setCantidadBase] = useState(1);
  const [resultados, setResultados] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [efectivo, setEfectivo] = useState('');
  const [porcentajeGral, setPorcentajeGral] = useState(0);
  const [config, setConfig] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

 useEffect(() => {
    const loadConfig = async () => {
      
      const storeConfig = await db.configuracion
        .filter(c => c.storeId?.toLowerCase() === session.storeId?.toLowerCase())
        .first();
      setConfig(storeConfig);
    };
    loadConfig();
  }, [session.storeId]);

  useEffect(() => {
    const buscar = async () => {
      if (busqueda.trim().length > 0) {
      const todos = await db.productos
  .filter(p => p.storeId?.toLowerCase() === session.storeId?.toLowerCase())
  .toArray();
        const filtrados = todos.filter(p => 
          p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
          p.codigo.includes(busqueda)
        );
        setResultados(filtrados);
      } else {
        setResultados([]);
      }
    };
    buscar();
  }, [busqueda, session.storeId]);

  const imprimirTicket = (venta) => {
    const ventana = window.open('', 'PRINT', 'height=600,width=450');
    ventana.document.write(`
      <html>
        <head>
          <title>Ticket de Venta</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 80mm; padding: 5px; color: #000; line-height: 1.2; }
            .text-center { text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; font-size: 11px; border-collapse: collapse; }
            .total-row { font-weight: bold; font-size: 13px; }
            .desc-info { font-size: 9px; color: #333; font-style: italic; }
            .footer { font-size: 10px; margin-top: 15px; }
            .price-line { font-size: 10px; margin-left: 10px; }
          </style>
        </head>
        <body>
          <h2 class="text-center">${session.storeId}</h2>
          <p class="text-center">
            FOLIO: #${venta.id}<br>
            TICKET: #${venta.nTicket}<br>
            ${new Date(venta.timestamp).toLocaleString()}
          </p>
          <div class="divider"></div>
          
          <table>
            <thead>
              <tr>
                <th align="left">DESCRIPCIÓN</th>
                <th align="right">IMPORTE</th>
              </tr>
            </thead>
            <tbody>
              ${venta.items.map(i => {
                const tieneDescuento = i.descPorc > 0;
                const precioUnitarioFinal = i.precio * (1 - i.descPorc / 100);
                const importeFinal = precioUnitarioFinal * i.cantidad;

                return `
                  <tr>
                    <td colspan="2" style="padding-top: 5px;"><strong>${i.nombre.toUpperCase()}</strong></td>
                  </tr>
                  <tr>
                    <td class="price-line">
                      ${i.cantidad} pza x $${i.precio.toFixed(2)}
                      ${tieneDescuento ? `<br><span class="desc-info">Dto. ${i.descPorc}% aplicado</span>` : ''}
                    </td>
                    <td align="right" valign="bottom">
                      $${importeFinal.toFixed(2)}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="divider"></div>
          <p align="right">SUBTOTAL: $${venta.subtotal.toFixed(2)}</p>
          ${venta.descuentoGral > 0 ? `<p align="right">DESC. GLOBAL: -$${venta.descuentoGral.toFixed(2)}</p>` : ''}
          <div class="divider"></div>
          <p align="right" class="total-row">TOTAL A PAGAR: $${venta.total.toFixed(2)}</p>
          <p align="right">EFECTIVO: $${venta.efectivo.toFixed(2)}</p>
          <p align="right">SU CAMBIO: $${venta.cambio.toFixed(2)}</p>
          
          <div class="divider"></div>
          <p class="text-center footer">
            ¡GRACIAS POR SU COMPRA!<br>
            LE ATENDIÓ: ${session.userId.toUpperCase()}<br>
            SUCURSAL: ${session.storeId.toUpperCase()}
          </p>
        </body>
      </html>
    `);
    ventana.document.close();
    ventana.focus();
    ventana.print();
    ventana.close();
  };

  const agregarAlCarrito = (p) => {
    if (!p) return;
    const cantidadASumar = parseInt(cantidadBase) || 1;
    const itemExistente = carrito.find(item => item.id === p.id);
    const cantidadEnCarrito = itemExistente ? itemExistente.cantidad : 0;
    const cantidadTotalResultante = cantidadEnCarrito + cantidadASumar;

    if (p.stock <= 0) return alert("Producto agotado en almacén.");
    if (cantidadTotalResultante > p.stock) return alert(`Stock insuficiente. Quedan ${p.stock} unidades.`);

    if (itemExistente) {
      setCarrito(carrito.map(item => item.id === p.id ? { ...item, cantidad: cantidadTotalResultante } : item));
    } else {
      setCarrito([...carrito, { ...p, cantidad: cantidadASumar, descPorc: 0 }]);
    }
    setBusqueda('');
    setCantidadBase(1);
    setResultados([]);
  };

  const solicitarAutorizacion = (tipoOperacion, detalle = "") => {
    const passInput = prompt(`Autorización para ${tipoOperacion}:`);
    const passwordCorrecta = config?.adminPassword || "Lester2026!"; 
    const esCorrecta = passInput === passwordCorrecta;
    saveLog(session.userId, `AUTORIZACIÓN ${esCorrecta ? 'EXITOSA' : 'FALLIDA'} | ${tipoOperacion} ${detalle}`, session.storeId);
    return esCorrecta;
  };

  const quitarDelCarrito = async (item) => {
    await saveLog(session.userId, `ELIMINACIÓN SILENCIOSA: ${item.nombre} | -$${(item.precio * item.cantidad).toFixed(2)}`, session.storeId);
    setCarrito(carrito.filter(i => i.id !== item.id));
  };

  const aplicarDescIndividual = (item) => {
    if (solicitarAutorizacion("Descuento Individual", `en ${item.nombre}`)) {
      const pje = parseFloat(prompt(`% Descuento para ${item.nombre}:`, "0"));
      if (!isNaN(pje) && pje >= 0 && pje <= 100) {
        setCarrito(carrito.map(i => i.id === item.id ? { ...i, descPorc: pje } : i));
      }
    }
  };

  const aplicarDescGeneral = () => {
    if (solicitarAutorizacion("Descuento General")) {
      const pje = parseFloat(prompt("Ingrese % de descuento para TODA la cuenta:", "0"));
      if (!isNaN(pje) && pje >= 0 && pje <= 100) setPorcentajeGral(pje);
    }
  };

  const subtotalCarrito = carrito.reduce((acc, i) => acc + (i.precio * (1 - (i.descPorc / 100)) * i.cantidad), 0);
  const montoDescGral = subtotalCarrito * (porcentajeGral / 100);
  const totalFinal = subtotalCarrito - montoDescGral;
  const cambio = parseFloat(efectivo) >= totalFinal ? parseFloat(efectivo) - totalFinal : 0;

  const finalizarVenta = async () => {
    if (carrito.length === 0 || totalFinal <= 0) return;
    if (parseFloat(efectivo) < totalFinal || !efectivo) return alert("Efectivo insuficiente");

    try {
      const configActual = await db.configuracion.where('storeId').equals(session.storeId).first();
      const nTicketActual = configActual?.contadorTickets || 1;

      for (const item of carrito) {
        const pActual = await db.productos.get(item.id);
        if (!pActual || pActual.stock < item.cantidad) throw new Error(`Stock agotado: ${item.nombre}`);
      }

      const ventaFinal = {
        storeId: session.storeId,
        userId: session.userId,
        items: carrito,
        subtotal: subtotalCarrito,
        descuentoGral: montoDescGral,
        total: totalFinal,
        efectivo: parseFloat(efectivo),
        cambio: cambio,
        timestamp: new Date().toISOString(),
        nTicket: nTicketActual
      };

      const idVenta = await db.ventas.add(ventaFinal);
      ventaFinal.id = idVenta;

      await db.configuracion.update(session.storeId, { contadorTickets: nTicketActual + 1 });

      for (const item of carrito) {
        const p = await db.productos.get(item.id);
        if (p) await db.productos.update(item.id, { stock: Math.max(0, p.stock - item.cantidad) });
      }

      imprimirTicket(ventaFinal);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
      setCarrito([]);
      setEfectivo('');
      setPorcentajeGral(0);
      setBusqueda('');

    } catch (error) {
      alert(error.message);
    }
  };

  const ajustarCantidad = (itemId, delta) => {
    setCarrito(carrito.map(item => {
      if (item.id === itemId) {
        const nuevaCantidad = Math.max(1, item.cantidad + delta);
        return { ...item, cantidad: nuevaCantidad };
      }
      return item;
    }));
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8fafc',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Success Notification */}
      {showSuccess && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: '#10b981',
          color: '#fff',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease',
        }}>
          <CheckCircle2 size={24} />
          <div>
            <p style={{ margin: 0, fontWeight: '600' }}>¡Venta completada!</p>
            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>Ticket impreso correctamente</p>
          </div>
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 380px',
        gap: '24px',
        height: 'calc(100vh - 48px)',
      }}>
        {/* Left Panel - Product Search & Cart */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '20px',
        }}>
          {/* Search Bar */}
          <div style={{ 
            background: '#fff',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
              {/* Quantity Input */}
              <div style={{ width: '80px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  color: '#64748b', 
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Cant.
                </label>
                <input 
                  type="number" 
                  min="1"
                  value={cantidadBase} 
                  onChange={(e) => setCantidadBase(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ 
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '2px solid #e2e8f0',
                    textAlign: 'center',
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    color: '#0f172a',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                  }}
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

              {/* Search Input */}
              <div style={{ flex: 1, position: 'relative' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  color: '#64748b', 
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Buscar Producto
                </label>
                <div style={{ position: 'relative' }}>
                  <Search 
                    size={20} 
                    color="#94a3b8" 
                    style={{ 
                      position: 'absolute', 
                      left: '16px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none'
                    }} 
                  />
                  <input 
                    style={{ 
                      width: '100%',
                      padding: '14px 16px 14px 48px',
                      borderRadius: '12px',
                      border: '2px solid #e2e8f0',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box',
                      background: '#fff',
                    }} 
                    placeholder="Escribe nombre o código de producto..."
                    value={busqueda} 
                    onChange={(e) => setBusqueda(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && resultados[0] && agregarAlCarrito(resultados[0])}
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

                {/* Search Results Dropdown */}
                {resultados.length > 0 && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff', 
                    zIndex: 100, 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)', 
                    borderRadius: '12px', 
                    marginTop: '8px',
                    maxHeight: '300px', 
                    overflowY: 'auto',
                    border: '1px solid #e2e8f0',
                  }}>
                    {resultados.map((r, idx) => (
                      <div 
                        key={r.id} 
                        onMouseDown={(e) => { e.preventDefault(); agregarAlCarrito(r); }}
                        style={{ 
                          padding: '16px', 
                          borderBottom: idx < resultados.length - 1 ? '1px solid #f1f5f9' : 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.15s',
                          background: idx === 0 ? '#eff6ff' : '#fff',
                        }}
                        onMouseEnter={(e) => {
                          if (idx !== 0) e.currentTarget.style.background = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          if (idx !== 0) e.currentTarget.style.background = '#fff';
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.95rem' }}>
                            {r.nombre}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Package size={14} color={r.stock < 5 ? '#ef4444' : '#10b981'} />
                            <span style={{ 
                              color: r.stock < 5 ? '#ef4444' : '#64748b', 
                              fontSize: '0.8rem',
                              fontWeight: r.stock < 5 ? '600' : '400'
                            }}>
                              {r.stock < 5 ? `¡Solo ${r.stock} disponibles!` : `${r.stock} en stock`}
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ color: '#059669', fontSize: '1.125rem' }}>
                            ${r.precio.toFixed(2)}
                          </strong>
                          {idx === 0 && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: '#3b82f6' }}>
                              Presiona Enter para agregar
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* General Discount Button */}
              <div style={{ width: '100px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  color: '#64748b', 
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Desc.
                </label>
                <button 
                  onClick={aplicarDescGeneral}
                  style={{ 
                    width: '100%',
                    height: '54px',
                    background: porcentajeGral > 0 ? '#f59e0b' : '#f1f5f9',
                    color: porcentajeGral > 0 ? '#fff' : '#64748b',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontWeight: '700',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                  }}
                >
                  <Percent size={18} />
                  {porcentajeGral > 0 ? `${porcentajeGral}%` : 'GRAL'}
                </button>
              </div>
            </div>
          </div>

          {/* Cart Items */}
          <div style={{ 
            flex: 1,
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ 
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <ShoppingCart size={20} color="#3b82f6" />
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1rem', fontWeight: '700' }}>
                Carrito de Compra
              </h3>
              <span style={{ 
                marginLeft: 'auto',
                padding: '4px 12px',
                background: '#eff6ff',
                color: '#3b82f6',
                borderRadius: '20px',
                fontSize: '0.875rem',
                fontWeight: '600',
              }}>
                {carrito.length} items
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {carrito.length === 0 ? (
                <div style={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  padding: '40px',
                }}>
                  <ShoppingCart size={64} style={{ opacity: 0.2, marginBottom: '16px' }} />
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>El carrito está vacío</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.875rem' }}>
                    Busca productos para comenzar
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {carrito.map((item, idx) => (
                    <div 
                      key={item.id}
                      style={{
                        padding: '16px',
                        background: '#fafafa',
                        borderRadius: '12px',
                        border: '1px solid #f1f5f9',
                        display: 'grid',
                        gridTemplateColumns: '1fr auto auto auto auto',
                        gap: '16px',
                        alignItems: 'center',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fafafa';
                        e.currentTarget.style.borderColor = '#f1f5f9';
                      }}
                    >
                      {/* Product Info */}
                      <div>
                        <p style={{ margin: '0 0 4px 0', color: '#0f172a', fontWeight: '600', fontSize: '0.95rem' }}>
                          {item.nombre}
                        </p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>
                          ${item.precio.toFixed(2)} c/u
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => ajustarCantidad(item.id, -1)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            background: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748b',
                          }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ 
                          minWidth: '32px',
                          textAlign: 'center',
                          fontWeight: '700',
                          color: '#0f172a'
                        }}>
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => ajustarCantidad(item.id, 1)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            background: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748b',
                          }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Individual Discount */}
                      <button
                        onClick={() => aplicarDescIndividual(item)}
                        style={{
                          padding: '6px 12px',
                          background: item.descPorc > 0 ? '#fef3c7' : '#f1f5f9',
                          color: item.descPorc > 0 ? '#d97706' : '#64748b',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Percent size={14} />
                        {item.descPorc}%
                      </button>

                      {/* Total */}
                      <div style={{ textAlign: 'right', minWidth: '100px' }}>
                        <p style={{ margin: 0, color: '#059669', fontWeight: '700', fontSize: '1rem' }}>
                          ${(item.precio * (1 - item.descPorc / 100) * item.cantidad).toFixed(2)}
                        </p>
                        {item.descPorc > 0 && (
                          <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '0.75rem', textDecoration: 'line-through' }}>
                            ${(item.precio * item.cantidad).toFixed(2)}
                          </p>
                        )}
                      </div>

                      {/* Remove Button */}
                      <button 
                        onClick={() => quitarDelCarrito(item)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#fef2f2',
                          color: '#dc2626',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#fee2e2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fef2f2';
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Payment */}
        <div style={{ 
          background: '#fff',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ 
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '24px',
            color: '#fff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Calculator size={20} />
              </div>
              <div>
                <p style={{ margin: 0, opacity: 0.7, fontSize: '0.875rem' }}>Resumen de Venta</p>
                <p style={{ margin: '2px 0 0 0', fontWeight: '600' }}>{session.storeId}</p>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ margin: '0 0 8px 0', opacity: 0.7, fontSize: '0.875rem' }}>TOTAL A PAGAR</p>
              <h2 style={{ 
                margin: 0, 
                fontSize: '3rem', 
                fontWeight: '800',
                fontFamily: 'monospace',
                letterSpacing: '-0.02em'
              }}>
                ${totalFinal.toFixed(2)}
              </h2>
            </div>
          </div>

          {/* Payment Details */}
          <div style={{ 
            flex: 1,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            {/* Breakdown */}
            <div style={{ 
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Subtotal</span>
                <span style={{ color: '#0f172a', fontWeight: '600' }}>${subtotalCarrito.toFixed(2)}</span>
              </div>
              {porcentajeGral > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#f59e0b', fontSize: '0.875rem' }}>
                    Descuento general ({porcentajeGral}%)
                  </span>
                  <span style={{ color: '#f59e0b', fontWeight: '600' }}>
                    -${montoDescGral.toFixed(2)}
                  </span>
                </div>
              )}
              <div style={{ 
                borderTop: '1px solid #e2e8f0',
                paddingTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ color: '#0f172a', fontWeight: '700' }}>Total</span>
                <span style={{ color: '#059669', fontWeight: '700', fontSize: '1.25rem' }}>
                  ${totalFinal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Cash Input */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#0f172a',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Efectivo Recibido
              </label>
              <div style={{ position: 'relative' }}>
                <DollarSign 
                  size={20} 
                  color="#94a3b8" 
                  style={{ 
                    position: 'absolute', 
                    left: '16px', 
                    top: '50%', 
                    transform: 'translateY(-50%)'
                  }} 
                />
                <input 
                  type="number"
                  value={efectivo}
                  onChange={(e) => setEfectivo(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 48px',
                    borderRadius: '12px',
                    border: '2px solid #e2e8f0',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#0f172a',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#10b981';
                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Change */}
            <div style={{ 
              background: cambio > 0 ? '#dcfce7' : '#f1f5f9',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              border: `2px solid ${cambio > 0 ? '#86efac' : '#e2e8f0'}`,
            }}>
              <p style={{ 
                margin: '0 0 4px 0', 
                color: cambio > 0 ? '#166534' : '#64748b',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Cambio
              </p>
              <p style={{ 
                margin: 0,
                fontSize: '2.5rem',
                fontWeight: '800',
                color: cambio > 0 ? '#16a34a' : '#94a3b8',
                fontFamily: 'monospace',
              }}>
                ${cambio.toFixed(2)}
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={finalizarVenta}
                disabled={carrito.length === 0 || parseFloat(efectivo) < totalFinal}
                style={{
                  width: '100%',
                  padding: '18px',
                  background: carrito.length === 0 || parseFloat(efectivo) < totalFinal ? '#e2e8f0' : '#10b981',
                  color: carrito.length === 0 || parseFloat(efectivo) < totalFinal ? '#94a3b8' : '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  cursor: carrito.length === 0 || parseFloat(efectivo) < totalFinal ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'all 0.2s',
                  boxShadow: carrito.length === 0 || parseFloat(efectivo) < totalFinal ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.4)',
                }}
                onMouseEnter={(e) => {
                  if (!(carrito.length === 0 || parseFloat(efectivo) < totalFinal)) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = carrito.length === 0 || parseFloat(efectivo) < totalFinal ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.4)';
                }}
              >
                <Receipt size={24} />
                Finalizar Venta
              </button>
              
              {carrito.length > 0 && (
                <button 
                  onClick={() => {
                    if (confirm('¿Cancelar la venta actual?')) {
                      setCarrito([]);
                      setEfectivo('');
                      setPorcentajeGral(0);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'transparent',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.color = '#dc2626';
                    e.currentTarget.style.borderColor = '#fecaca';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#64748b';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  Cancelar Venta
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default SalesModule;
