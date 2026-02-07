# Proyecto Teflon - MVP Full-Stack E-commerce

Este proyecto es una plataforma de e-commerce multi-tenant con un gestor de contenidos controlado y sistema de precios mayoristas.

## Estructura
- `/server`: API desarrollada en Node.js + Express + PostgreSQL.
- `/web`: Frontend desarrollado en React + Vite + Tailwind CSS.
- `/db`: Esquema y semillas de base de datos.

## Requisitos
- Docker y Docker Compose
- Node.js 18+ (para ejecución local)

## Instalación con Docker
1. Clonar el repositorio.
2. Ejecutar `docker-compose up --build`.
3. El frontend estará disponible en `http://localhost:5173`.
4. La API estará disponible en `http://localhost:4000`.

## Configuración Local
### Servidor
1. `cd server`
2. `npm install`
3. Copiar `.env.example` a `.env` y configurar.
4. `npm start`

### Web
1. `cd web`
2. `npm install`
3. Copiar `.env.example` a `.env` y configurar.
4. `npm run dev`

## Roles
- `retail`: Usuario final, ve precios minoristas.
- `wholesale`: Usuario mayorista, ve precios especiales tras loguearse.
- `admin`: Acceso al `/admin` para usar el editor controlado.

## Editor Controlado
Accede a `http://localhost:5173/#admin` para editar la marca, colores y secciones del home. Soporta sistema de **Draft vs Published**.
