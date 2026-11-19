# AGENTS.md — Muvia Frontend

## Contexto y tecnologías

Este repositorio contiene el frontend de Muvia, un marketplace de muebles
y decoración, con experiencias para compradores y vendedores.

- Angular 22.
- TypeScript con tipado estricto.
- Angular Signals y RxJS.
- NgRx SignalStore para la gestión de estado.
- Tailwind CSS 4 y CSS propio.
- Vitest y Angular TestBed para pruebas unitarias.
- Three.js y `@google/model-viewer` para funcionalidades 3D y AR.
- Prerenderizado, renderizado en cliente e hidratación según la ruta.
- Firebase Hosting para publicar el sitio estático.
- Node.js 22 y npm como entorno y gestor de paquetes.

El nombre interno del proyecto Angular es `itera-front`.
Consultar `package.json` y `angular.json` para conocer su configuración real.

## Estructura del proyecto

- `src/app/features/` contiene las páginas y funcionalidades por dominio,
  como autenticación, tienda, vendedores, cotizaciones y virtual staging.
- `src/app/core/services/` contiene servicios HTTP, servicios compartidos y stores.
- `src/app/core/models/` contiene modelos, DTO y funciones de dominio.
- `src/app/core/constants/` contiene constantes compartidas y endpoints.
- `src/app/core/store/` contiene la configuración y las funciones reutilizables de SignalStore.
- `src/app/core/auth/` contiene autenticación, almacenamiento, guards e interceptores.
- `src/app/core/interceptors/` contiene los interceptores HTTP compartidos.
- `src/app/core/observability/` contiene el manejo y registro de errores.
- `src/app/shared/components/` contiene los componentes reutilizables.
- `src/app/layout/` contiene layouts, navegación, encabezados y pie de página.
- `src/app/core/services/i18n/dictionaries/` contiene las traducciones de la interfaz.
- `src/styles.css` define las variables, el tema, la tipografía y los estilos globales.
- `src/environments/` contiene la configuración por entorno.
- `public/` contiene los recursos estáticos.
- `docs/` contiene la documentación técnica y funcional.
- `.github/workflows/` contiene los workflows de CI/CD.

Colocar cada implementación en la ubicación que corresponda a su responsabilidad.
Reutilizar las carpetas y convenciones existentes.

## Comandos existentes

- Iniciar el entorno de desarrollo con `npm start`.
- Ejecutar las pruebas unitarias con `npm test -- --watch=false`.
- Compilar para producción con `npm run build`.
- Auditar las dependencias de producción con `npm audit --omit=dev --audit-level=high`.

La instalación con `npm ci` requiere autorización explícita del usuario.
Actualmente no existe un script de lint en `package.json`.

El backend debe estar disponible para comprobar los flujos que consumen la API.
La configuración local está en `src/environments/environment.development.ts`.

## Forma de trabajar

- Revisar la implementación y la documentación del área antes de modificarla.
- Mantener los cambios centrados en la tarea solicitada.
- Respetar los cambios existentes del usuario.
- Reutilizar componentes, servicios, modelos, stores y utilidades existentes.
- Resolver los detalles rutinarios con criterio y consultar las decisiones
  de producto que no puedan deducirse del contexto.
- No realizar commits, pushes ni despliegues sin autorización del usuario.

## Arquitectura y calidad del código

- Aplicar los principios SOLID y de código limpio.
- Utilizar patrones de diseño adecuados al problema.
- Mantener responsabilidades claras, cohesión y bajo acoplamiento.
- Evitar la duplicación, las abstracciones innecesarias y las dependencias circulares.
- Ninguna función o método puede superar las 200 líneas de código.
- Dividir las funciones extensas según sus responsabilidades.
- No comprimir instrucciones ni sacrificar la legibilidad para cumplir el límite.
- Mantener el tipado estricto y evitar `any` o conversiones que oculten errores.
- Usar los alias definidos en `tsconfig.json`.
- Respetar `.editorconfig` y la configuración de formato existente.

## Convenciones de Angular

- Seguir los patrones del módulo para inyección de dependencias, signals,
  valores derivados e inputs y outputs.
- Mantener los componentes centrados en la presentación y la interacción.
- Centralizar las llamadas HTTP en los servicios correspondientes.
- Reutilizar los SignalStores existentes para el estado compartido y las
  funciones de `src/app/core/store/features/` cuando correspondan.
- Derivar valores con `computed` cuando puedan calcularse a partir del
  estado existente.
- Mantener los modelos y DTO alineados con los contratos del backend.

## Idioma del código

- Escribir todo el código en inglés.
- Usar inglés en nombres de variables, funciones, métodos, clases,
  interfaces, tipos, propiedades y archivos nuevos.
- Escribir comentarios, docstrings y descripciones de pruebas en inglés.
- Gestionar los textos traducibles de la interfaz mediante los diccionarios
  de internacionalización existentes.

## Estilos y UI/UX

Toda modificación visual debe respetar el sistema de diseño existente
en `src/styles.css`.

- Utilizar exclusivamente los colores, las familias tipográficas y la escala
  de tamaños de letra definidos en el proyecto. Está prohibido crear otros.
- Utilizar las variables, los tokens y las utilidades semánticas existentes.
  Todos los valores de diseño deben proceder de ellos, incluidos colores,
  tipografía, tamaños, espaciados, radios, sombras y dimensiones.
- Está prohibido introducir valores de diseño hardcodeados en CSS, estilos
  en línea, plantillas o TypeScript.
- No utilizar clases arbitrarias de Tailwind para introducir valores fuera
  del sistema de diseño.
- No crear variables para eludir las restricciones de colores, fuentes o tamaños.
- Reutilizar los componentes y estilos compartidos para mantener la consistencia.
- Mantener una experiencia usable en móvil y escritorio.
- Conservar el HTML semántico, las etiquetas accesibles, el foco visible
  y la navegación mediante teclado.
- Contemplar los estados de carga, vacío, error y éxito del flujo modificado.

## Internacionalización, mercados y precios

- Mantener las traducciones de interfaz en español e inglés.
- Añadir las claves nuevas en los diccionarios de ambos idiomas y mantener
  la correspondencia de claves y parámetros.
- Reutilizar `I18nService` y los pipes existentes.
- Conservar el contenido escrito por vendedores sin traducirlo automáticamente.
- Mantener independientes el país seleccionado y el idioma de la interfaz.
- Mantener cada importe asociado a la moneda proporcionada por la API.
- Reutilizar `ProductPrice` y las funciones existentes para mostrar precios.

Consultar `docs/i18n.md` cuando se modifique este comportamiento.

## API, errores y renderizado

- Utilizar `API_ENDPOINTS` y la configuración del entorno para las URLs.
- Reutilizar los interceptores y el manejo de errores existentes.
- Evitar avisos duplicados por el mismo error.
- Mantener la compatibilidad con el prerenderizado y la hidratación.
- Proteger el acceso a APIs exclusivas del navegador.
- Respetar los modos de renderizado definidos en `src/app/app.routes.server.ts`.
- Evitar que el catálogo muestre datos obsoletos capturados durante el prerenderizado.

## Eliminación de código obsoleto

- Toda incorporación o sustitución de código debe incluir la eliminación del
  código que quede obsoleto como consecuencia del cambio, en la misma entrega.
- Eliminar las implementaciones sustituidas, los imports sin uso y los métodos,
  propiedades, estilos, componentes y archivos que dejen de ser necesarios.
- Comprobar que el código retirado ya no tenga usos vigentes y actualizar
  o eliminar las pruebas y referencias correspondientes.
- No conservar versiones anteriores como código comentado.
- Respetar las restricciones sobre scripts, dependencias y configuración durante la limpieza.

## Restricciones que requieren permiso explícito

Las siguientes acciones están prohibidas sin autorización previa y explícita del usuario.

- Crear scripts, incluidos los temporales o auxiliares.
- Añadir, instalar, actualizar, eliminar o sustituir dependencias.
- Modificar `package.json`, `package-lock.json` u otros manifiestos y archivos de bloqueo.
- Modificar `angular.json`, `tsconfig*.json` u otros archivos de configuración.
- Modificar workflows de CI/CD o la configuración de despliegue.

Si la solución requiere alguna de estas acciones, explicar el cambio concreto
y solicitar permiso antes de realizarlo. Una solicitud general de implementación
o corrección no autoriza implícitamente estas modificaciones.

## Validación obligatoria antes de la entrega

- Ejecutar la suite completa de pruebas unitarias y el CI del proyecto
  antes de entregar los cambios.
- Ejecutar ambas verificaciones sobre la versión final de los cambios,
  esperar a que terminen y revisar sus resultados.
- No considerar terminado el trabajo con verificaciones fallidas o pendientes.
- No omitir ni desactivar pruebas, ni debilitar comprobaciones para que pasen.
- No modificar dependencias ni configuración para resolver fallos sin el
  permiso explícito correspondiente.
- Añadir o actualizar pruebas cuando cambie el comportamiento.
- Para cambios visuales, comprobar el resultado en móvil y escritorio.
- Informar los errores o bloqueos que impidan completar la validación.
- Diferenciar las comprobaciones locales del resultado real del CI remoto.

## Comunicación de la entrega

Responder al usuario en español. Indicar de forma concisa qué cambió,
qué código obsoleto se eliminó, qué pruebas se ejecutaron y sus resultados,
el resultado del CI y cualquier bloqueo o limitación pendiente.
