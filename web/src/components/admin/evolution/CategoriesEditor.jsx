import React from 'react';
import { Tag, BookmarkSimple } from '@phosphor-icons/react';
import { PIQUIM_SUBCATALOGS } from '../../../data/piquimSubcatalogs';

const fieldClass =
    "w-full rounded-xl border border-white/25 bg-zinc-900/70 px-3 py-2.5 text-sm text-white placeholder:text-zinc-400 outline-none transition-all duration-200 focus:border-evolution-indigo focus:ring-2 focus:ring-evolution-indigo/30";

const compactFieldClass =
    "w-full rounded-lg border border-white/25 bg-zinc-900/70 px-2.5 py-1.5 text-sm text-white placeholder:text-zinc-400 outline-none transition-all duration-200 focus:border-evolution-indigo focus:ring-2 focus:ring-evolution-indigo/30";

const sectionTitleClass = "text-[11px] font-bold uppercase tracking-widest text-evolution-indigo";
const sectionLabelClass = "text-[10px] uppercase font-bold tracking-widest text-zinc-500";

const PIQUIM_CATEGORY_ROOT_LABELS = {
    heladeria: 'Heladeria',
    panaderia: 'Panaderia/Confiteria',
};

const PIQUIM_CATEGORY_PREVIEW = Object.entries(PIQUIM_SUBCATALOGS)
    .map(([slug, subcatalog]) => {
        const groups = Array.isArray(subcatalog?.productGroups) ? subcatalog.productGroups : [];
        if (!groups.length) return null;
        return {
            name: PIQUIM_CATEGORY_ROOT_LABELS[slug] || subcatalog.headingAccent || slug,
            groups,
        };
    })
    .filter(Boolean);

const buildCategoryTree = (items = []) => {
    const byId = new Map();
    (Array.isArray(items) ? items : []).forEach((item) => {
        if (!item?.id || !item?.name) return;
        byId.set(item.id, { ...item, children: [] });
    });

    const roots = [];
    byId.forEach((node) => {
        if (node.parent_id && byId.has(node.parent_id)) {
            byId.get(node.parent_id).children.push(node);
            return;
        }
        roots.push(node);
    });
    return roots;
};

const flattenCategoryTree = (nodes = [], depth = 0, parents = []) =>
    nodes.flatMap((node) => {
        const path = [...parents, node.name];
        return [
            { ...node, depth, path: path.join(' > ') },
            ...flattenCategoryTree(node.children || [], depth + 1, path),
        ];
    });

function CategoryTreeNode({ node, categoryDeletingId, onDelete, depth = 0 }) {
    return (
        <div className="space-y-2">
            <div
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200"
                style={{ marginLeft: depth ? Math.min(depth * 18, 54) : 0 }}
            >
                <span className="font-bold">{node.name}</span>
                <button
                    type="button"
                    onClick={() => onDelete(node.id, node.name)}
                    disabled={categoryDeletingId === node.id}
                    className="text-[11px] font-bold text-rose-300 transition-colors hover:text-rose-200 disabled:opacity-60"
                >
                    {categoryDeletingId === node.id ? '...' : 'Eliminar'}
                </button>
            </div>

            {node.children?.length ? (
                <div className="space-y-2">
                    {node.children.map((child) => (
                        <CategoryTreeNode
                            key={child.id}
                            node={child}
                            categoryDeletingId={categoryDeletingId}
                            onDelete={onDelete}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

const CategoriesEditor = ({ manager, categories = [], brands = [] }) => {
    if (!manager) return null;

    const {
        newCategoryName,
        newCategoryParentId,
        categorySaving,
        categorySeeding,
        categoryDeletingId,
        newBrandName,
        brandSaving,
        brandDeletingName,
        setNewCategoryName,
        setNewCategoryParentId,
        handleCreateCategory,
        handleSeedPiquimCategories,
        handleDeleteCategory,
        setNewBrandName,
        handleCreateBrand,
        handleDeleteBrand,
    } = manager;

    const categoryGroups = React.useMemo(() => buildCategoryTree(categories), [categories]);
    const parentCategoryOptions = React.useMemo(() => flattenCategoryTree(categoryGroups), [categoryGroups]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-white">Categorias Piquim y marcas</h2>
                <p className="text-sm text-zinc-400">
                    Organiza las dos lineas principales de Piquim: Heladeria y Panaderia/Confiteria, con subcategorias para cada familia de materia prima.
                </p>
            </div>

            <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-2">
                    <Tag size={16} weight="bold" className="text-evolution-indigo" />
                    <p className={sectionTitleClass}>Categorias</p>
                </div>

                <div className="space-y-1">
                    <p className={sectionLabelClass}>Lineas y familias</p>
                    <p className="text-[11px] text-zinc-400">Usa raiz para Heladeria o Panaderia/Confiteria. Usa una categoria padre para crear familias internas.</p>
                </div>

                <div className="rounded-2xl border border-evolution-indigo/25 bg-evolution-indigo/10 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-evolution-indigo">Taxonomia Piquim lista</p>
                            <p className="max-w-2xl text-xs leading-5 text-zinc-300">
                                Carga en categorias el mismo arbol que usan los productos: Heladeria y Panaderia/Confiteria con sus grupos y subcategorias.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {PIQUIM_CATEGORY_PREVIEW.map((catalog) => (
                                    <span key={catalog.name} className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-bold text-zinc-200">
                                        {catalog.name}: {catalog.groups.map((group) => group.title).join(', ')}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleSeedPiquimCategories}
                            disabled={categorySeeding}
                            className="rounded-xl bg-evolution-indigo px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-evolution-indigo/90 disabled:opacity-60"
                        >
                            {categorySeeding ? 'Cargando...' : 'Cargar categorias Piquim'}
                        </button>
                    </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_auto]">
                    <input
                        type="text"
                        value={newCategoryName}
                        placeholder="Ej: Variegattos"
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className={fieldClass}
                    />
                    <select
                        value={newCategoryParentId || ''}
                        onChange={(e) => setNewCategoryParentId(e.target.value)}
                        className={fieldClass}
                    >
                        <option value="">Raiz Piquim</option>
                        {parentCategoryOptions.map((parent) => (
                            <option key={parent.id} value={parent.id} className="bg-zinc-900">
                                {'--'.repeat(parent.depth)} {parent.path}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={categorySaving || !String(newCategoryName || '').trim()}
                        className="rounded-xl bg-evolution-indigo px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-evolution-indigo/90 disabled:opacity-60"
                    >
                        {categorySaving ? 'Guardando...' : 'Agregar'}
                    </button>
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                    {categoryGroups.length > 0 ? (
                        categoryGroups.map((group) => (
                            <CategoryTreeNode
                                key={group.id}
                                node={group}
                                categoryDeletingId={categoryDeletingId}
                                onDelete={handleDeleteCategory}
                            />
                        ))
                    ) : (
                        <p className="text-sm italic text-zinc-500">Todavia no hay categorias creadas.</p>
                    )}
                </div>
            </section>

            <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-2">
                    <BookmarkSimple size={16} weight="bold" className="text-evolution-indigo" />
                    <p className={sectionTitleClass}>Marcas</p>
                </div>

                <div className="space-y-1">
                    <p className={sectionLabelClass}>Marcas</p>
                    <p className="text-[11px] text-zinc-400">Ejemplo: PIQUIM, Linea Profesional, Ingredientes MDQ.</p>
                </div>

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <input
                        type="text"
                        value={newBrandName}
                        placeholder="Ej: PIQUIM"
                        onChange={(e) => setNewBrandName(e.target.value)}
                        className={fieldClass}
                    />
                    <button
                        type="button"
                        onClick={handleCreateBrand}
                        disabled={brandSaving || !String(newBrandName || '').trim()}
                        className="rounded-xl bg-evolution-indigo px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-evolution-indigo/90 disabled:opacity-60"
                    >
                        {brandSaving ? 'Guardando...' : 'Agregar'}
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/20 p-4">
                    {brands.length > 0 ? (
                        brands.map((brandName) => (
                            <button
                                key={brandName}
                                type="button"
                                onClick={() => handleDeleteBrand(brandName)}
                                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-zinc-300 transition-colors hover:text-white"
                            >
                                {brandName} - {brandDeletingName === brandName ? '...' : 'Eliminar'}
                            </button>
                        ))
                    ) : (
                        <p className="text-sm italic text-zinc-500">Todavia no hay marcas cargadas.</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default CategoriesEditor;
