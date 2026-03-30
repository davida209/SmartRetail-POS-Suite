import { db } from '../db/database';
import { db as firestore } from '../firebaseConfig';
import { collection, doc, setDoc, writeBatch, getDocs, query, where, deleteDoc } from "firebase/firestore"; 

const _AK = "cDNmMXVaMGVLeG53RWZBanFTNVpGVVo2TjNzVVlSUXF6Y25DSVd5YWZIVXBJVjZYYkM="; 
const getAccessKey = () => atob(_AK);

const prepararParaFirebase = (dato, key) => {
  if (!dato) return null;
  const copia = JSON.parse(JSON.stringify(dato));
  const limpiar = (obj) => {
    if (obj !== null && typeof obj === 'object') {
      Object.keys(obj).forEach(k => {
        if (obj[k] === undefined || obj[k] === null) {
          delete obj[k];
        } else if (Array.isArray(obj[k])) {
          obj[k] = obj[k].filter(item => item !== undefined && item !== null);
          obj[k].forEach(item => {
            if (item && typeof item === 'object') limpiar(item);
          });
        } else if (typeof obj[k] === 'object') {
          limpiar(obj[k]);
        }
      });
    }
  };
  limpiar(copia);
  copia.access_key = key; 
  return copia;
};

export const SyncService = {
  syncTodoAFirestore: async () => {
    const masterKey = getAccessKey();
    const reporte = {
      ventas: { ok: 0, error: 0 },
      productos: { ok: 0, error: 0 },
      usuarios: { ok: 0, error: 0 },
      logs: { ok: 0, error: 0 }
    };

    try {
      console.log("Iniciando respaldo total blindado...");

      // 1. VENTAS
      const ventas = await db.ventas.toArray();
      for (const v of ventas) {
        try {
          await setDoc(doc(firestore, "ventas", `venta_${v.id}`), prepararParaFirebase(v, masterKey));
          reporte.ventas.ok++;
        } catch (e) { reporte.ventas.error++; }
      }

      // 2. PRODUCTOS
      const productos = await db.productos.toArray();
      if (productos.length > 0) {
        const batchP = writeBatch(firestore);
        productos.forEach(p => {
          const id = p.codigo ? String(p.codigo) : `prod_${p.id}`;
          batchP.set(doc(firestore, "productos", id), prepararParaFirebase(p, masterKey));
        });
        await batchP.commit();
        reporte.productos.ok = productos.length;
      }

      // 3. USUARIOS (Añadido para respaldo)
      const usuarios = await db.usuarios.toArray();
      if (usuarios.length > 0) {
        const batchU = writeBatch(firestore);
        usuarios.forEach(u => {
          batchU.set(doc(firestore, "usuarios", String(u.username)), prepararParaFirebase(u, masterKey));
        });
        await batchU.commit();
        reporte.usuarios.ok = usuarios.length;
      }

      // 4. LOGS
      const logs = await db.logs.toArray();
      const ultimos = logs.slice(-50);
      for (const l of ultimos) {
        try {
          const logId = l.id ? String(l.id) : `log_${Date.now()}_${Math.random()}`;
          await setDoc(doc(firestore, "auditLog", logId), prepararParaFirebase(l, masterKey));
          reporte.logs.ok++;
        } catch (e) { reporte.logs.error++; }
      }

      return reporte;
    } catch (e) {
      console.error("Error crítico en Sync:", e);
      return reporte;
    }
  },

  downloadTodoDeFirestore: async () => {
    try {
      const masterKey = getAccessKey();
      const tablasMap = { 
        "productos": "productos", 
        "usuarios": "usuarios", 
        "ventas": "ventas", 
        "auditLog": "logs" 
      };
      
      for (const [fsNombre, dxNombre] of Object.entries(tablasMap)) {
        const q = query(collection(firestore, fsNombre), where("access_key", "==", masterKey));
        const snap = await getDocs(q);
        const data = [];
        snap.forEach(d => {
          const obj = d.data();
          delete obj.access_key;
          data.push(obj);
        });
        if (data.length > 0) await db[dxNombre].bulkPut(data);
      }
      return true;
    } catch (e) { return false; }
  },

  // --- FUNCIÓN PARA ELIMINAR CUALQUIER DOCUMENTO ---
  eliminarDocumentoNube: async (coleccion, idDoc) => {
    try {
      // Importante: idDoc debe ser el string exacto (ej: "admin", "venta_10", etc)
      const docRef = doc(firestore, coleccion, String(idDoc));
      await deleteDoc(docRef);
      console.log(`Eliminado de ${coleccion}: ${idDoc}`);
      return true;
    } catch (e) {
      console.error("Error al borrar en nube:", e.message);
      return false;
    }
  }
};