# Sanitarios El Teflon - paquete Vase

Paquete preparado para subir o importar el diseno de Sanitarios El Teflon en Vase.

Incluye:

- `vase-template.json`: configuracion de tienda, tema, categorias, marcas y secciones.
- `import-home.sql`: SQL opcional para aplicar branding, tema y home en una base existente.
- El zip final incluye solo archivos de template/importacion para evitar arrastrar rutas o assets de otros clientes.

El home deja lista la estructura comercial clasica:

- Hero de catalogo sanitario.
- Nuestras marcas.
- Productos destacados.
- Servicios / beneficios.

Uso sugerido:

1. Subir `sanitarios-el-teflon-vase.zip` a Vase si el importador acepta paquetes.
2. Si se importa por base de datos, usar `import-home.sql` indicando el tenant real.
3. Revisar URLs, telefonos, email y logos desde el editor.

Ejemplo SQL:

```powershell
psql $env:DATABASE_URL -v tenant_id="'UUID_DEL_TENANT'" -f exports/sanitarios-el-teflon-vase/import-home.sql
```
