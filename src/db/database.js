import Dexie from 'dexie';

export const db = new Dexie('GestorVentasDB');

 
db.version(6).stores({
  productos: '++id, nombre, codigo, storeId',
  ventas: '++id, storeId, userId, timestamp',
  logs: '++id, storeId, timestamp',
  configuracion: 'storeId',
  usuarios: 'username, role, storeId, active' 
});

 
db.open().catch("UpgradeError", async (err) => {
  console.error("Conflicto de esquema detectado. Limpiando base de datos local...");
  await Dexie.delete("GestorVentasDB");
  window.location.reload();
});

 
db.on("versionchange", () => {
  db.close();
  window.location.reload();
});

export const saveLog = async (userId, message, storeId) => {
  try {
    await db.logs.add({
      userId,
      message,
      storeId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error al guardar log:", error);
  }
};
