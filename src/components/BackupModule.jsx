import React from 'react';
import { db, saveLog } from '../db/database';
import { SecurityService } from '../services/securityService';
import { CryptoService } from '../services/cryptoService';

const BackupModule = ({ session }) => {
  
  const exportData = async () => {
    try {
      SecurityService.checkRateLimit('backup_export');
      
      const rawData = {
        productos: await db.productos.where('storeId').equals(session.storeId).toArray(),
        ventas: await db.ventas.where('storeId').equals(session.storeId).toArray(),
        storeId: session.storeId
      };

   
      const encryptedData = CryptoService.encrypt(rawData);

      const blob = new Blob([encryptedData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SECURE_BACKUP_${session.storeId}.crypt`;
      link.click();
      
      await saveLog(session.userId, "Encrypted Backup Exported", session.storeId);
    } catch (err) {
      alert("Error de seguridad en la exportación");
    }
  };

  const importData = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        SecurityService.checkRateLimit('backup_import');
        
       
        const decrypted = CryptoService.decrypt(event.target.result);
        
        if (decrypted.storeId !== session.storeId) {
          throw new Error("Data Tenant Mismatch");
        }

        await db.transaction('rw', [db.productos, db.ventas], async () => {
 
          await db.productos.bulkAdd(decrypted.productos);
          await db.ventas.bulkAdd(decrypted.ventas);
        });

        await saveLog(session.userId, "Encrypted Backup Restored", session.storeId);
        alert("Restauración exitosa");
        window.location.reload();
      } catch (err) {
        alert("Fallo de integridad: El archivo está corrupto o no pertenece a esta tienda");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd', marginTop: '20px' }}>
      <h3>Módulo de Backup Cifrado (AES-256)</h3>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <button 
          onClick={exportData}
          style={{ padding: '10px 20px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Generar Backup Seguro
        </button>
        
        <div style={{ borderLeft: '2px solid #eee', paddingLeft: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Restaurar Backup:</label>
          <input 
            type="file" 
            accept=".crypt" 
            onChange={importData} 
            style={{ fontSize: '0.9rem' }}
          />
        </div>
      </div>
      <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px' }}>
        * Los archivos están protegidos por cifrado de grado militar y solo pueden ser restaurados en esta tienda.
      </p>
    </div>
  );
};

export default BackupModule;
