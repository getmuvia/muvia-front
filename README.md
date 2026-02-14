# Itera Front

Guía rápida y clara para levantar el frontend en local.

## 1) Prerrequisito obligatorio: backend corriendo

Antes de iniciar este proyecto, **el backend debe estar activo**.

Este frontend consume endpoints como:
- `auth`
- `products`
- `categories`
- `users`
- `ai/hybrid`
- `ai/virtual-staging`
- `files/upload-url`

Si el backend no está arriba, verás errores de red (`401/404/500` o `ERR_CONNECTION_REFUSED`) en el frontend.

---

## 2) Requisitos locales

- Node.js LTS (recomendado 20+)
- npm (el proyecto usa npm)

Verifica versiones:

```bash
node -v
npm -v
```

---

## 3) Instalar dependencias

En la raíz del proyecto (`itera-front`):

```bash
npm install
```

---

## 4) Configurar URLs en `environment`

Este paso es clave. El proyecto usa dos URLs:

- `apiUrl`: URL base del backend
- `storageUrl`: URL base pública para archivos en storage (Google Cloud Storage)

### Archivo principal

Edita:

`src/environments/environment.ts`

Ejemplo:

```ts
export const environment = {
	production: false,
	apiUrl: 'http://localhost:3000',
	storageUrl: 'https://storage.googleapis.com/TU_BUCKET_O_BASE_URL'
};
```

### Sobre `environment-back.ts`

En este proyecto también existe `src/environments/environment-back.ts` (normalmente ignorado por git). Si se usa en el flujo local, conviene mantenerlo con los mismos valores para evitar inconsistencias.

---

## 5) Ejecutar frontend

```bash
npm start
```

Luego abre:

`http://localhost:4200/`

Angular recarga automáticamente al guardar cambios.

---

## 6) Comandos útiles

- Ejecutar tests:

```bash
npm test
```

- Build de producción:

```bash
npm run build
```

---

## 7) ¿`storageUrl` se usa de verdad?

Sí. No es opcional para flujos con carga de archivos:

- Se usa para construir la URL final pública del archivo subido.
- Impacta funcionalidades como subida de imágenes/modelos y Virtual Staging.

Si `storageUrl` no está bien configurado, se puede completar la subida de archivos, pero fallará la visualización de imágenes/recursos en frontend.

---

## 8) Checklist rápida (orden recomendado)

1. Levantar backend.
2. Configurar `apiUrl` y `storageUrl` en `environment`.
3. Ejecutar `npm install`.
4. Ejecutar `npm start`.
5. Probar login/listado de productos/subida de archivos.
