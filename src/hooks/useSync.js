import { useEffect } from 'react';
import { db } from '../db/database';
import { SyncService } from '../services/syncService';

export const useSync = () => {
  useEffect(() => {
    const runFullSync = async () => {
      if (!navigator.onLine) return;

      console.log('Iniciando sincronización automática...');
     
      await SyncService.downloadProductos();
 
      const pendingVentas = await db.ventas
        .where('synced')
        .equals(0)
        .toArray();

      if (pendingVentas.length > 0) {
        await SyncService.syncVentas();
         
      }
    };

 
    runFullSync();

 
    window.addEventListener('online', runFullSync);
    
  
    const interval = setInterval(runFullSync, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('online', runFullSync);
      clearInterval(interval);
    };
  }, []);
};
