# SmartRetail POS Suite

Sistema de Punto de Venta (POS) profesional con arquitectura Offline-First. Diseñado para garantizar la operatividad de negocios minoristas incluso sin conexión a internet, utilizando sincronización asíncrona con la nube.

---

## Imagenes del proyecto.

<img width="1847" height="920" alt="dashboard" src="https://github.com/user-attachments/assets/9a310082-9f56-4c98-80cc-a090958ea061" />

<img width="1827" height="906" alt="caja_ventas" src="https://github.com/user-attachments/assets/6c4052aa-a560-488f-91ed-f9055e321b3d" />

<img width="1842" height="895" alt="panel admin" src="https://github.com/user-attachments/assets/9497acb6-6b39-4648-99ae-89ed06ff2d66" />

<img width="1820" height="897" alt="users" src="https://github.com/user-attachments/assets/51a74972-25f6-4479-ade8-acfb278b637c" />

<img width="1763" height="885" alt="Captura de pantalla 2026-03-30 162513" src="https://github.com/user-attachments/assets/e29aee11-bc3c-4335-813f-b51486e9e7c4" />

---

## Especificaciones Técnicas

### Módulo de Ventas
* **Búsqueda Indexada:** Filtrado de productos por nombre o código de barras mediante IndexedDB para una respuesta instantánea.
* **Validación de Stock:** Control automático de existencias en el cliente antes de procesar cualquier transacción.
* **Descuentos Autorizados:** Lógica de descuentos por ítem o globales que requiere validación de credenciales administrativas.
* **Ticket Dinámico:** Impresión de recibos que incluyen tanto el Folio técnico de la base de datos como el Número de Ticket visual reiniciable.

### Gestión de Inventario
* **Carga Masiva:** Importación y exportación de catálogos completos mediante el procesamiento de archivos Excel (XLSX).
* **Control de Permisos:** Restricción de edición de precios y campos críticos basada en roles de usuario (Admin/Vendedor).
* **Monitor de Existencias:** Indicadores visuales y alertas para productos agotados o con stock por debajo del nivel mínimo.

### Auditoría y Seguridad
* **Folio Dual:** Separación lógica entre la llave primaria técnica inmutable y el número correlativo visual, evitando errores de autoincremento en colisiones de datos.
* **Logs de Auditoría:** Registro persistente de acciones críticas incluyendo eliminación de productos del carrito, intentos de acceso fallidos y cancelaciones.
* **Protocolo de Pánico:** Función de seguridad para la suspensión inmediata de todos los accesos al sistema mediante una llave de ingeniería.

### Sincronización
* **Persistencia Local:** Gestión de datos mediante Dexie.js para asegurar el funcionamiento sin conexión.
* **Firebase Sync:** Sincronización bidireccional y persistencia de ventas e inventario en Firestore.
* **Respaldo JSON:** Capacidad de exportación manual del estado completo de la base de datos local para migraciones rápidas.

---

## Stack Tecnológico

| Tecnología | Propósito |
| :--- | :--- |
| **React.js** | Biblioteca principal para la interfaz de usuario |
| **Dexie.js** | Gestión de base de datos IndexedDB |
| **Firebase** | Hosting, base de datos en la nube y sincronización |
| **SheetJS** | Procesamiento y generación de archivos Excel |
| **Lucide React** | Librería de iconos vectoriales |

---

## Instalación y Configuración

1. Clonar el repositorio:
   ```bash
   git clone [https://github.com/tu-usuario/SmartRetail-POS-Suite.git](https://github.com/tu-usuario/SmartRetail-POS-Suite.git)
2. Instalar las dependencias del proyecto:

```bash
npm install
```

3. Configurar Firebase:
Sustituir las credenciales en el archivo src/firebaseConfig.js con los datos de su proyecto de Firebase.

4. Ejecutar el sistema en entorno local:
```bash
npm start
```

no olvides cambiar el App.jsx la parte donde pide el masterkey y el usuario principal de otra forma no podras acceder.

## Contacto


Si estás interesado en este proyecto o requieres soporte técnico, puedes contactarme directamente:

* **Gmail:** [davidlug209@gmail.com](mailto:davidlug209@gmail.com)
* **Discord:** `lesug209`

---
Desarrollado con enfoque en la eficiencia operativa e integridad de datos profesionales.
