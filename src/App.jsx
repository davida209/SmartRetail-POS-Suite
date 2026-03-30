import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import SalesModule from './components/SalesModule';
import InventoryModule from './components/InventoryModule';
import ReportsModule from './components/ReportsModule';
import ModuleUsuarios from './components/ModuleUsuarios';
import AdminPanel from './components/AdminPanel';
import ModuleDashboard from './components/ModuleDashboard';
import { SecurityService } from './services/securityService';
import { SyncService } from './services/syncService'; 
import { db } from './db/database';

const _RK = "dXRCUXdqVmpsaWU1dGNsRw==";
const getMasterKey = () => atob(_RK);

console.log(
  "%cSmartRetail POS %cv1.0 %cBy Lester David U.G.",
  "color: #3b82f6; font-size: 20px; font-weight: bold;",
  "color: #94a3b8; font-size: 15px;",
  "color: #10b981; font-size: 12px; font-style: italic;"
);

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false); 
 
  useEffect(() => {
    if (!SecurityService.isSafeBrowser()) {
      document.body.innerHTML = "<h1 style='color:red; text-align:center; margin-top:100px;'>403 Forbidden: Security Filter Active</h1>";
      return;
    }

    const inicializarDatos = async () => {
      if (navigator.onLine) {
        setSyncing(true);
        try {
          console.log("SISTEMA: Descargando base de datos completa de la nube...");
 
          await SyncService.downloadTodoDeFirestore();
          console.log("SISTEMA: Datos actualizados al entrar.");
        } catch (error) {
          console.error("Error en descarga inicial:", error);
        } finally {
          setTimeout(() => setSyncing(false), 2000); 
        }
      }
    };
    
    inicializarDatos();
  }, []);

 
  const handleLogout = async () => {
    if (navigator.onLine) {
      setSyncing(true);
      try {
        console.log("SISTEMA: Realizando respaldo total antes de salir...");
     
        await SyncService.syncTodoAFirestore();
        alert("SISTEMA: Respaldo en la nube completado. Sesión cerrada de forma segura.");
      } catch (error) {
        console.error("Error al respaldar al salir:", error);
        alert("SISTEMA: Error al respaldar. La sesión se cerrará pero algunos cambios locales podrían no haberse guardado en la nube.");
      } finally {
        setSyncing(false);
        setSession(null);
      }
    } else {
       
      setSession(null);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const userTyped = e.target.user.value;
    const passTyped = e.target.pass.value;
    
    try {
      SecurityService.checkRateLimit('login_attempt');
// aqui en esta parte validamos al usuario pero tenemos el getmasterkey que es donde hay que buscar y ponerlo ofuscado por seguridad  const _RK = "aqui contraseña ofuscada primeras lineas";  
 
      if (userTyped === "Aqui pon tu usuario super admin" && passTyped === getMasterKey()) {
        setSession({ 
          userId: 'ROOT_ADMIN', 
          storeId: 'MASTER_CONTROL', 
          role: 'Admin',
          permisos: { ventas: true, almacen: true, reportes: true } 
        });
        setLoading(false);
        return;
      }

      const userFound = await db.usuarios.get(userTyped);
      const totalUsuarios = await db.usuarios.count();
      
      if (totalUsuarios === 0 && userTyped === "admin" && passTyped === "Lester2026!") {
        setSession({ 
          userId: 'LesterDavid', 
          storeId: 'CANCUN_01', 
          role: 'Admin',
          permisos: { ventas: true, almacen: true, reportes: true } 
        });
        setLoading(false);
        return;
      }

      if (userFound && userFound.password === passTyped) {
        if (!userFound.active) {
          alert("Esta cuenta se encuentra suspendida.");
          setLoading(false);
          return;
        }

        setSession({ 
          userId: userFound.username, 
          storeId: userFound.storeId || 'CANCUN_01', 
          role: userFound.role,
          permisos: userFound.permisos || { ventas: true, almacen: false, reportes: false }
        });

        await db.logs.add({
          storeId: userFound.storeId || 'SISTEMA',
          timestamp: new Date().toISOString(),
          message: `LOGIN: El usuario ${userFound.username} ha iniciado sesión.`,
          user: userFound.username
        });
      } else {
        alert("Credenciales incorrectas.");
      }
    } catch (err) { 
      alert(err.message); 
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f7f6' }}>
        <form onSubmit={handleLogin} style={{ background: '#fff', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '350px' }}>
          <h2 style={{ textAlign: 'center', color: '#1e293b', marginBottom: '30px' }}>Gestor POS</h2>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b' }}>USUARIO</label>
            <input name="user" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '5px', boxSizing: 'border-box' }} required />
          </div>
          <div style={{ marginBottom: '25px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b' }}>CONTRASEÑA</label>
            <input name="pass" type="password" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '5px', boxSizing: 'border-box' }} required />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    );
  }

  const ProtectedRoute = ({ children, permission }) => {
    if (session.role === 'Admin') return children;
    return session.permisos?.[permission] ? children : <Navigate to="/" />;
  };

  return (
    <Router>
      <div style={{ display: 'flex', background: '#f8fafc', minHeight: '100vh', position: 'relative' }}>
        
        {syncing && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#1e293b',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '50px',
            fontSize: '12px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 9999
          }}>
            <div className="spinner-sync"></div>
            ACTUALIZANDO SISTEMA...
          </div>
        )}

        <style>
          {`
            .spinner-sync {
              width: 14px;
              height: 14px;
              border: 2px solid #ffffff33;
              border-top: 2px solid #fff;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}
        </style>

        {}
        <Sidebar session={session} onLogout={handleLogout} />
        
        <main style={{ flex: 1, padding: '40px', boxSizing: 'border-box' }}>
          <Routes>
            <Route path="/" element={session.role === 'Admin' ? <ModuleDashboard session={session} /> : <Navigate to="/ventas" />} />
            <Route path="/ventas" element={<ProtectedRoute permission="ventas"><SalesModule session={session} /></ProtectedRoute>} />
            <Route path="/almacen" element={<ProtectedRoute permission="almacen"><InventoryModule session={session} /></ProtectedRoute>} />
            <Route path="/reportes" element={<ProtectedRoute permission="reportes"><ReportsModule session={session} /></ProtectedRoute>} />
            <Route path="/admin" element={session.role === 'Admin' ? <AdminPanel session={session} /> : <Navigate to="/" />} />
            <Route path="/usuarios" element={session.role === 'Admin' ? <ModuleUsuarios session={session} /> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
