# Agropecuaria Jireh

Sistema web administrativo para uso interno.

**Eslogan:** Más que alimento, es cuidado para tus mascotas.

## Acceso

Las credenciales no se muestran en la pantalla de inicio. Deben ser entregadas únicamente al personal autorizado.

## Módulos incluidos

- Dashboard con ventas, ganancias, compras, existencias, bajo stock y gráficas.
- Productos con búsqueda, filtros, precios dinámicos por quintal o unidad.
- Compras con actualización opcional de precios cuando cambia el costo.
- Inventario por quintal y por unidad, con traslado manual a exhibición.
- Facturación como origen único de ventas.
- Ventas automáticas solo de consulta.
- Usuarios con roles, permisos, activación y desactivación.
- Reportes, estadísticas, historial y exportación `Historial_Agropecuaria_Jireh.xlsx`.

## Notas

La información se guarda en el navegador mediante almacenamiento local. Esta versión funciona como prototipo completo de interfaz y lógica administrativa; para producción se puede conectar el mismo flujo a Node.js, Express y MySQL.
