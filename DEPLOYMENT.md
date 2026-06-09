# Deployment a Producción

## Estado actual

✅ Frontend (Angular) está listo para producción  
⚠️ Backend (API) necesita configuración CORS  

## Paso 1: Configurar CORS en el Backend

Ver [CORS_SETUP.md](./CORS_SETUP.md) para instrucciones según tu framework.

**Resumen rápido:**
- Agrega origen de tu frontend (ej: `https://tudominio.com`)
- Permite métodos: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- Permite headers: `Content-Type`, `Authorization`

## Paso 2: Deployar Frontend

### Opción A: Usando `npm start` (recomendado con Railway)

```bash
npm run build
npm start
```

Esto sirve los archivos estáticos desde `dist/api-mongo-app` en puerto 3000 o según tu config.

### Opción B: Deployar a servicio estático (Vercel, Netlify, etc.)

```bash
npm run build
# Sube contenido de carpeta dist/api-mongo-app
```

## Paso 3: Verificar que funciona

1. Abre tu app en producción
2. Completa el formulario
3. Envía

Si funciona:
- ✅ Mensaje de éxito: "Registro enviado correctamente"
- ✅ Datos aparecen en tu API cuando consultas GET /api/users

Si falla:
- ❌ Mensaje: "No se pudo enviar el formulario"
- Verifica:
  1. CORS en backend está configurado
  2. URL de API en `src/environments/environment.prod.ts` es correcta
  3. Backend está activo y accesible

## URLs en tu proyecto

- **Desarrollo:** http://localhost:4200 → proxy → https://invitation-api-production-565d.up.railway.app
- **Producción:** https://tudominio.com → directamente → https://invitation-api-production-565d.up.railway.app

## Cambiar URL de API en producción

Si necesitas cambiar el endpoint de API:

1. Edita `src/environments/environment.prod.ts`
2. Cambia `apiUrl` a tu nueva URL
3. Vuelve a hacer `npm run build`
4. Re-deploy

Ejemplo:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://nueva-api.com/api'
};
```
