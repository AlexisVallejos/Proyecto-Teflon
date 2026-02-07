import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import PageBuilder from '../../components/PageBuilder';
import { getApiBase, getTenantHeaders } from '../../utils/api';

export default function EditorPage() {
    const [activeTab, setActiveTab] = useState('branding');
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [newProduct, setNewProduct] = useState({
        name: '',
        sku: '',
        price: '',
        description: '',
        images: [],
        is_featured: false,
        category_id: '',
        features: [],
        specifications: {},
        collection: '',
        delivery_time: '',
        warranty: ''
    });
    const [newImageUrl, setNewImageUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [settings, setSettings] = useState({
        branding: {
            name: '',
            logo_url: '',
            navbar: {
                links: [
                    { label: 'Inicio', href: '/' },
                    { label: 'Catálogo', href: '/catalog' }
                ]
            },
            footer: {
                socials: { facebook: '', instagram: '', whatsapp: '' },
                contact: { address: '', phone: '', email: '' },
                quickLinks: [
                    { label: 'Sobre nosotros', href: '#' },
                    { label: 'Contacto', href: '#' }
                ]
            }
        },
        theme: { primary: '#f97316', secondary: '#181411', font_family: 'Inter' },
        commerce: { whatsapp_number: '', email: '', address: '' }
    });
    const [sections, setSections] = useState([]);
    const [editingSection, setEditingSection] = useState(null);
    const [showAddSection, setShowAddSection] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '' });

    const showSuccess = (message) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const token = localStorage.getItem('teflon_token');
                const headers = { ...getTenantHeaders(), 'Authorization': `Bearer ${token}` };

                const [settingsRes, sectionsRes, productsRes] = await Promise.all([
                    fetch(`${getApiBase()}/tenant/settings`, { headers }),
                    fetch(`${getApiBase()}/tenant/pages/home`, { headers }),
                    fetch(`${getApiBase()}/tenant/products`, { headers })
                ]);

                if (settingsRes.ok) {
                    const data = await settingsRes.json();
                    const mergedSettings = {
                        ...settings,
                        ...data.settings,
                        branding: {
                            ...settings.branding,
                            ...(data.settings?.branding || {}),
                            navbar: {
                                ...settings.branding.navbar,
                                ...(data.settings?.branding?.navbar || {})
                            },
                            footer: {
                                ...settings.branding.footer,
                                ...(data.settings?.branding?.footer || {})
                            }
                        }
                    };
                    setSettings(mergedSettings);
                }
                if (sectionsRes.ok) {
                    const data = await sectionsRes.json();
                    setSections(data.sections || []);
                }
                if (productsRes.ok) {
                    const data = await productsRes.json();
                    setProducts(data.items || []);
                }
            } catch (err) {
                console.error("Failed to load editor data", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        // Load categories
        const loadCategories = async () => {
            try {
                const token = localStorage.getItem('teflon_token');
                const headers = { ...getTenantHeaders(), 'Authorization': `Bearer ${token}` };
                const res = await fetch(`${getApiBase()}/public/categories`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data || []);
                }
            } catch (err) {
                console.error('Failed to load categories', err);
            }
        };
        loadCategories();
    }, []);

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('teflon_token');
            const headers = {
                ...getTenantHeaders(),
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const settingsRes = await fetch(`${getApiBase()}/tenant/settings`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(settings)
            });

            const sectionsRes = await fetch(`${getApiBase()}/tenant/pages/home`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ sections })
            });

            if (settingsRes.ok && sectionsRes.ok) {
                const publishRes = await fetch(`${getApiBase()}/tenant/pages/home/publish`, {
                    method: 'POST',
                    headers
                });

                if (publishRes.ok) {
                    showSuccess('Cambios guardados y publicados con éxito');
                } else {
                    showSuccess('Guardado como borrador (error al publicar)');
                }
            } else {
                alert('Error al guardar algunos cambios');
            }
        } catch (err) {
            console.error('Save all failed', err);
            alert('Error crítico al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleAddSection = (type) => {
        const newSection = {
            id: crypto.randomUUID(),
            type,
            enabled: true,
            props: { styles: {} }
        };

        if (type === 'HeroSlider') {
            newSection.props = {
                title: 'Nuevo Hero',
                subtitle: 'Descripción aquí',
                tag: 'Novedad',
                primaryButton: { label: 'Ver más', link: '/catalog' },
                styles: { alignment: 'center', overlayOpacity: '0.6' }
            };
        } else if (type === 'Services') {
            newSection.props = {
                title: 'Nuestros Servicios',
                items: [
                    { icon: 'package', title: 'Envío Gratis', description: 'En compras mayores a $50.000' },
                    { icon: 'shield', title: 'Garantía', description: '6 meses de garantía oficial' }
                ]
            };
        } else if (type === 'FeaturedProducts') {
            newSection.props = {
                title: 'Destacados',
                subtitle: 'Lo mejor de nuestra tienda',
                styles: { alignment: 'items-end justify-between' }
            };
        }

        setSections([...sections, newSection]);
        setShowAddSection(false);
        showSuccess('Sección añadida');
    };

    const handleDeleteSection = (index) => {
        if (!window.confirm('¿Borrar esta sección?')) return;
        const newSections = [...sections];
        newSections.splice(index, 1);
        setSections(newSections);
        setEditingSection(null);
        showSuccess('Sección eliminada');
    };

    const handleMoveSection = (index, direction) => {
        const newSections = [...sections];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= sections.length) return;

        const temp = newSections[index];
        newSections[index] = newSections[targetIndex];
        newSections[targetIndex] = temp;
        setSections(newSections);
    };

    const handleCreateProduct = async () => {
        if (!newProduct.name) return;
        setSaving(true);
        try {
            const token = localStorage.getItem('teflon_token');
            const headers = {
                ...getTenantHeaders(),
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const res = await fetch(`${getApiBase()}/tenant/products`, {
                method: 'POST',
                headers,
                body: JSON.stringify(newProduct)
            });

            if (res.ok) {
                const created = await res.json();
                setProducts([...products, { ...newProduct, id: created.id, is_featured: newProduct.is_featured }]);
                setNewProduct({
                    name: '',
                    sku: '',
                    price: '',
                    description: '',
                    images: [],
                    is_featured: false,
                    category_id: '',
                    features: [],
                    specifications: {},
                    collection: '',
                    delivery_time: '',
                    warranty: ''
                });
                setNewImageUrl('');
                showSuccess('Producto creado con éxito');
            }
        } catch (err) {
            console.error('Failed to create product', err);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleFeatured = async (id, currentStatus) => {
        try {
            const token = localStorage.getItem('teflon_token');
            const headers = {
                ...getTenantHeaders(),
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const res = await fetch(`${getApiBase()}/tenant/products/${id}/featured`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ featured: !currentStatus })
            });

            if (res.ok) {
                setProducts(products.map(p => p.id === id ? { ...p, is_featured: !currentStatus } : p));
                showSuccess(`Producto ${!currentStatus ? 'destacado' : 'quitado de destacados'}`);
            }
        } catch (err) {
            console.error('Failed to toggle featured', err);
        }
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);

            const token = localStorage.getItem('teflon_token');
            const response = await fetch(`${getApiBase()}/tenant/products/upload-image`, {
                method: 'POST',
                headers: {
                    ...getTenantHeaders(),
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const { url } = await response.json();
                setNewProduct({
                    ...newProduct,
                    images: [...newProduct.images, {
                        url,
                        alt: newProduct.name || 'Producto',
                        primary: newProduct.images.length === 0
                    }]
                });
                showSuccess('Imagen subida con éxito');
            } else {
                alert('Error al subir la imagen');
            }
        } catch (err) {
            console.error('Upload failed', err);
            alert('Error al subir la imagen');
        } finally {
            setUploading(false);
            // Reset file input
            event.target.value = '';
        }
    };

    if (loading) return <div className="p-10 text-center">Cargando editor...</div>;

    return (
        <AdminLayout>
            {/* Animated Toast Notification */}
            <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-500 ease-out ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0 pointer-events-none'}`}>
                <div className="bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-green-400">
                    <div className="bg-white/20 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <div>
                        <p className="font-black text-lg tracking-tight leading-none">¡Excelente!</p>
                        <p className="text-sm font-bold text-green-50 text-nowrap">{toast.message}</p>
                    </div>
                </div>
            </div>

            <div className="flex h-[calc(100vh-64px)] overflow-hidden">
                {/* Sidebar */}
                <aside className="w-80 bg-white dark:bg-[#1a130c] border-r border-[#e5e1de] dark:border-[#3d2f21] flex flex-col">
                    <div className="p-4 border-b border-[#e5e1de] dark:border-[#3d2f21] flex gap-2">
                        <button
                            onClick={() => setActiveTab('branding')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'branding' ? 'bg-primary text-white' : 'bg-[#f5f2f0] dark:bg-[#2c2116] text-[#8a7560]'}`}
                        >
                            Marca
                        </button>
                        <button
                            onClick={() => { setActiveTab('sections'); setEditingSection(null); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'sections' ? 'bg-primary text-white' : 'bg-[#f5f2f0] dark:bg-[#2c2116] text-[#8a7560]'}`}
                        >
                            Secciones
                        </button>
                        <button
                            onClick={() => { setActiveTab('inventory'); setEditingSection(null); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'inventory' ? 'bg-primary text-white' : 'bg-[#f5f2f0] dark:bg-[#2c2116] text-[#8a7560]'}`}
                        >
                            Inventario
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {activeTab === 'branding' ? (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-[#8a7560] mb-2">General</label>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={settings.branding.name}
                                            placeholder="Nombre del sitio"
                                            onChange={e => setSettings({ ...settings, branding: { ...settings.branding, name: e.target.value } })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-sm"
                                        />
                                        <input
                                            type="text"
                                            value={settings.branding.logo_url}
                                            placeholder="Logo URL"
                                            onChange={e => setSettings({ ...settings, branding: { ...settings.branding, logo_url: e.target.value } })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-sm"
                                        />
                                        <div className="flex gap-3 items-center px-2">
                                            <input
                                                type="color"
                                                value={settings.theme.primary}
                                                onChange={e => setSettings({ ...settings, theme: { ...settings.theme, primary: e.target.value } })}
                                                className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                                            />
                                            <span className="text-[10px] font-black font-mono opacity-50 uppercase tracking-widest">{settings.theme.primary}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-[#e5e1de] dark:border-[#3d2f21]">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-[#8a7560] mb-4">Menú (Navbar)</label>
                                    <div className="space-y-2">
                                        {settings.branding.navbar?.links.map((link, idx) => (
                                            <div key={idx} className="p-3 bg-zinc-50 dark:bg-white/5 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] relative group">
                                                <input
                                                    type="text"
                                                    value={link.label}
                                                    placeholder="Etiqueta"
                                                    onChange={e => {
                                                        const newLinks = [...settings.branding.navbar.links];
                                                        newLinks[idx].label = e.target.value;
                                                        setSettings({ ...settings, branding: { ...settings.branding, navbar: { links: newLinks } } });
                                                    }}
                                                    className="w-full px-2 py-1 rounded-md border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-[10px] font-black mb-1"
                                                />
                                                <input
                                                    type="text"
                                                    value={link.href}
                                                    placeholder="Ruta"
                                                    onChange={e => {
                                                        const newLinks = [...settings.branding.navbar.links];
                                                        newLinks[idx].href = e.target.value;
                                                        setSettings({ ...settings, branding: { ...settings.branding, navbar: { links: newLinks } } });
                                                    }}
                                                    className="w-full px-2 py-1 rounded-md border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-[9px] font-mono opacity-60"
                                                />
                                                <button onClick={() => {
                                                    const newLinks = settings.branding.navbar.links.filter((_, i) => i !== idx);
                                                    setSettings({ ...settings, branding: { ...settings.branding, navbar: { links: newLinks } } });
                                                }} className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">×</button>
                                            </div>
                                        ))}
                                        <button onClick={() => {
                                            const newLinks = [...(settings.branding.navbar?.links || []), { label: 'Nuevo link', href: '#' }];
                                            setSettings({ ...settings, branding: { ...settings.branding, navbar: { links: newLinks } } });
                                        }} className="w-full py-2 border-2 border-dashed border-[#e5e1de] dark:border-[#3d2f21] rounded-xl text-[10px] font-bold text-[#8a7560] active:scale-95 transition-transform hover:bg-zinc-50">+ Añadir link</button>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-[#e5e1de] dark:border-[#3d2f21]">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-[#8a7560] mb-4">Pie de Página (Footer)</label>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black opacity-40 uppercase">Redes</p>
                                            <input
                                                type="text"
                                                value={settings.branding.footer?.socials.instagram}
                                                placeholder="Instagram URL"
                                                onChange={e => setSettings({ ...settings, branding: { ...settings.branding, footer: { ...settings.branding.footer, socials: { ...settings.branding.footer.socials, instagram: e.target.value } } } })}
                                                className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-[10px]"
                                            />
                                            <input
                                                type="text"
                                                value={settings.branding.footer?.socials.whatsapp}
                                                placeholder="WhatsApp (ej: 54223...)"
                                                onChange={e => setSettings({ ...settings, branding: { ...settings.branding, footer: { ...settings.branding.footer, socials: { ...settings.branding.footer.socials, whatsapp: e.target.value } } } })}
                                                className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-[10px]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black opacity-40 uppercase">Contacto</p>
                                            <input
                                                type="text"
                                                value={settings.branding.footer?.contact.address}
                                                placeholder="Dirección"
                                                onChange={e => setSettings({ ...settings, branding: { ...settings.branding, footer: { ...settings.branding.footer, contact: { ...settings.branding.footer.contact, address: e.target.value } } } })}
                                                className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-[10px]"
                                            />
                                            <input
                                                type="text"
                                                value={settings.branding.footer?.contact.phone}
                                                placeholder="Teléfono"
                                                onChange={e => setSettings({ ...settings, branding: { ...settings.branding, footer: { ...settings.branding.footer, contact: { ...settings.branding.footer.contact, phone: e.target.value } } } })}
                                                className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-[10px]"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[9px] font-black opacity-40 uppercase">Enlaces Rápidos</p>
                                            <div className="space-y-2">
                                                {settings.branding.footer?.quickLinks?.map((link, idx) => (
                                                    <div key={idx} className="flex gap-2 relative group">
                                                        <input
                                                            type="text"
                                                            value={link.label}
                                                            placeholder="Etiqueta"
                                                            onChange={e => {
                                                                const newLinks = [...settings.branding.footer.quickLinks];
                                                                newLinks[idx].label = e.target.value;
                                                                setSettings({ ...settings, branding: { ...settings.branding, footer: { ...settings.branding.footer, quickLinks: newLinks } } });
                                                            }}
                                                            className="flex-1 px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-800 border border-[#e5e1de] dark:border-[#3d2f21] text-[10px]"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={link.href}
                                                            placeholder="Link"
                                                            onChange={e => {
                                                                const newLinks = [...settings.branding.footer.quickLinks];
                                                                newLinks[idx].href = e.target.value;
                                                                setSettings({ ...settings, branding: { ...settings.branding, footer: { ...settings.branding.footer, quickLinks: newLinks } } });
                                                            }}
                                                            className="flex-1 px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-800 border border-[#e5e1de] dark:border-[#3d2f21] text-[10px] font-mono"
                                                        />
                                                        <button onClick={() => {
                                                            const newLinks = settings.branding.footer.quickLinks.filter((_, i) => i !== idx);
                                                            setSettings({ ...settings, branding: { ...settings.branding, footer: { ...settings.branding.footer, quickLinks: newLinks } } });
                                                        }} className="text-red-500 font-bold px-1 opacity-0 group-hover:opacity-100">×</button>
                                                    </div>
                                                ))}
                                                <button onClick={() => {
                                                    const newLinks = [...(settings.branding.footer?.quickLinks || []), { label: 'Nuevo link', href: '#' }];
                                                    setSettings({ ...settings, branding: { ...settings.branding, footer: { ...settings.branding.footer, quickLinks: newLinks } } });
                                                }} className="w-full py-1.5 border border-dashed border-[#e5e1de] dark:border-[#3d2f21] rounded-xl text-[9px] font-bold text-[#8a7560]">+ Añadir enlace</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'inventory' ? (
                            <div className="space-y-6 animate-in fade-in duration-300 pb-10">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-[#8a7560] tracking-widest mb-4">Crear Producto</p>
                                    <div className="space-y-3 bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                        <input
                                            type="text"
                                            value={newProduct.name}
                                            placeholder="Nombre del producto"
                                            onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs font-bold"
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newProduct.sku}
                                                placeholder="SKU"
                                                onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })}
                                                className="flex-1 px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                            />
                                            <input
                                                type="number"
                                                value={newProduct.price}
                                                placeholder="Precio"
                                                onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                                className="w-24 px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs font-mono"
                                            />
                                        </div>
                                        <select
                                            value={newProduct.category_id}
                                            onChange={e => setNewProduct({ ...newProduct, category_id: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                        >
                                            <option value="">Sin categoría</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newProduct.collection}
                                                placeholder="Colección (ej: PREMIUM)"
                                                onChange={e => setNewProduct({ ...newProduct, collection: e.target.value })}
                                                className="flex-1 px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                            />
                                            <input
                                                type="text"
                                                value={newProduct.warranty}
                                                placeholder="Garantía (ej: 2 años)"
                                                onChange={e => setNewProduct({ ...newProduct, warranty: e.target.value })}
                                                className="flex-1 px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={newProduct.delivery_time}
                                            placeholder="Tiempo de entrega (ej: 24/48 h)"
                                            onChange={e => setNewProduct({ ...newProduct, delivery_time: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                        />
                                        <textarea
                                            value={newProduct.description}
                                            placeholder="Descripción"
                                            rows={2}
                                            onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                        />
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-bold uppercase text-[#8a7560] tracking-wider">Imágenes del Producto</p>

                                            {/* Image List */}
                                            {newProduct.images.length > 0 && (
                                                <div className="space-y-1.5">
                                                    {newProduct.images.map((img, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-[#2c2116] rounded-lg border border-[#e5e1de] dark:border-[#3d2f21]">
                                                            <div className="w-8 h-8 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                                                                <img src={img.url} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[9px] text-[#8a7560] truncate">{img.url}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const newImages = newProduct.images.map((image, i) =>
                                                                        i === idx ? { ...image, primary: true } : { ...image, primary: false }
                                                                    );
                                                                    setNewProduct({ ...newProduct, images: newImages });
                                                                }}
                                                                className={`p-1 rounded ${img.primary ? 'bg-primary text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'}`}
                                                                title="Marcar como principal"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill={img.primary ? "currentColor" : "none"} stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const newImages = newProduct.images.filter((_, i) => i !== idx);
                                                                    setNewProduct({ ...newProduct, images: newImages });
                                                                }}
                                                                className="p-1 rounded bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Add Image Input */}
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newImageUrl}
                                                    placeholder="URL de imagen"
                                                    onChange={e => setNewImageUrl(e.target.value)}
                                                    onKeyPress={e => {
                                                        if (e.key === 'Enter' && newImageUrl.trim()) {
                                                            e.preventDefault();
                                                            setNewProduct({
                                                                ...newProduct,
                                                                images: [...newProduct.images, { url: newImageUrl.trim(), alt: newProduct.name || 'Producto', primary: newProduct.images.length === 0 }]
                                                            });
                                                            setNewImageUrl('');
                                                        }
                                                    }}
                                                    className="flex-1 px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (newImageUrl.trim()) {
                                                            setNewProduct({
                                                                ...newProduct,
                                                                images: [...newProduct.images, { url: newImageUrl.trim(), alt: newProduct.name || 'Producto', primary: newProduct.images.length === 0 }]
                                                            });
                                                            setNewImageUrl('');
                                                        }
                                                    }}
                                                    className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors"
                                                >
                                                    +
                                                </button>
                                                <label className="px-3 py-2 bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-bold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors cursor-pointer flex items-center gap-1">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        className="hidden"
                                                        disabled={uploading}
                                                    />
                                                    {uploading ? (
                                                        <>
                                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                            <span>...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            📁 Subir
                                                        </>
                                                    )}
                                                </label>
                                            </div>
                                        </div>

                                        {/* Features Editor */}
                                        <div className="space-y-2 pt-2 border-t border-[#e5e1de] dark:border-[#3d2f21]">
                                            <p className="text-[9px] font-bold uppercase text-[#8a7560] tracking-wider">Características del Producto</p>
                                            {newProduct.features.map((feature, idx) => (
                                                <div key={idx} className="flex gap-2 items-start p-2 bg-zinc-50 dark:bg-[#2c2116] rounded-lg border border-[#e5e1de] dark:border-[#3d2f21]">
                                                    <input
                                                        type="text"
                                                        value={feature.icon || ''}
                                                        placeholder="🔧"
                                                        onChange={e => {
                                                            const newFeatures = [...newProduct.features];
                                                            newFeatures[idx].icon = e.target.value;
                                                            setNewProduct({ ...newProduct, features: newFeatures });
                                                        }}
                                                        className="w-12 px-2 py-1 rounded border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs text-center"
                                                    />
                                                    <div className="flex-1 space-y-1">
                                                        <input
                                                            type="text"
                                                            value={feature.title || ''}
                                                            placeholder="Título"
                                                            onChange={e => {
                                                                const newFeatures = [...newProduct.features];
                                                                newFeatures[idx].title = e.target.value;
                                                                setNewProduct({ ...newProduct, features: newFeatures });
                                                            }}
                                                            className="w-full px-2 py-1 rounded border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs font-bold"
                                                        />
                                                        <textarea
                                                            value={feature.description || ''}
                                                            placeholder="Descripción"
                                                            rows={2}
                                                            onChange={e => {
                                                                const newFeatures = [...newProduct.features];
                                                                newFeatures[idx].description = e.target.value;
                                                                setNewProduct({ ...newProduct, features: newFeatures });
                                                            }}
                                                            className="w-full px-2 py-1 rounded border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const newFeatures = newProduct.features.filter((_, i) => i !== idx);
                                                            setNewProduct({ ...newProduct, features: newFeatures });
                                                        }}
                                                        className="p-1 rounded bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNewProduct({
                                                        ...newProduct,
                                                        features: [...newProduct.features, { icon: '✨', title: '', description: '' }]
                                                    });
                                                }}
                                                className="w-full py-2 border border-dashed border-[#e5e1de] dark:border-[#3d2f21] rounded-xl text-[9px] font-bold text-[#8a7560] hover:border-primary hover:text-primary transition-colors"
                                            >
                                                + Agregar Característica
                                            </button>
                                        </div>

                                        {/* Specifications Editor */}
                                        <div className="space-y-2 pt-2 border-t border-[#e5e1de] dark:border-[#3d2f21]">
                                            <p className="text-[9px] font-bold uppercase text-[#8a7560] tracking-wider">Especificaciones Técnicas</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="text"
                                                    value={newProduct.specifications.material || ''}
                                                    placeholder="Material"
                                                    onChange={e => setNewProduct({ ...newProduct, specifications: { ...newProduct.specifications, material: e.target.value } })}
                                                    className="px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                                />
                                                <input
                                                    type="text"
                                                    value={newProduct.specifications.medidas || ''}
                                                    placeholder="Medidas"
                                                    onChange={e => setNewProduct({ ...newProduct, specifications: { ...newProduct.specifications, medidas: e.target.value } })}
                                                    className="px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                                />
                                                <input
                                                    type="text"
                                                    value={newProduct.specifications.terminacion || ''}
                                                    placeholder="Terminación"
                                                    onChange={e => setNewProduct({ ...newProduct, specifications: { ...newProduct.specifications, terminacion: e.target.value } })}
                                                    className="px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                                />
                                                <input
                                                    type="text"
                                                    value={newProduct.specifications.descarga || ''}
                                                    placeholder="Descarga"
                                                    onChange={e => setNewProduct({ ...newProduct, specifications: { ...newProduct.specifications, descarga: e.target.value } })}
                                                    className="px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                                />
                                            </div>
                                        </div>

                                        <label className="flex items-center gap-2 px-2 py-1 cursor-pointer pt-2 border-t border-[#e5e1de] dark:border-[#3d2f21]">
                                            <input
                                                type="checkbox"
                                                checked={newProduct.is_featured}
                                                onChange={e => setNewProduct({ ...newProduct, is_featured: e.target.checked })}
                                                className="rounded border-[#e5e1de] text-primary focus:ring-primary"
                                            />
                                            <span className="text-[10px] font-bold text-[#8a7560]">Marcar como Destacado</span>
                                        </label>
                                        <button
                                            onClick={handleCreateProduct}
                                            className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                        >
                                            Crear Producto
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase text-[#8a7560] tracking-widest mt-4">Lista de Productos</p>
                                    {products.map(p => (
                                        <div key={p.id} className="p-3 bg-white dark:bg-[#2c2116] border border-[#e5e1de] dark:border-[#3d2f21] rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                                                    {p.data?.images?.[0] && <img src={p.data.images[0]} alt="" className="w-full h-full object-cover" />}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-[11px] font-black text-[#181411] dark:text-white truncate">{p.name}</p>
                                                    <p className="text-[9px] font-bold text-[#8a7560]">${p.price}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleToggleFeatured(p.id, p.is_featured)}
                                                className={`p-2 rounded-lg transition-all ${p.is_featured ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}
                                                title={p.is_featured ? 'Destacado' : 'No destacado'}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={p.is_featured ? "currentColor" : "none"} stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : activeTab === 'sections' && editingSection ? (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <button
                                    onClick={() => setEditingSection(null)}
                                    className="flex items-center gap-2 text-primary font-black text-[10px] uppercase mb-4"
                                >
                                    ← Volver a secciones
                                </button>

                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-black uppercase text-[#181411] dark:text-white">
                                        {editingSection.type.replace(/([A-Z])/g, ' $1').trim()}
                                    </h2>
                                    <button onClick={() => handleDeleteSection(editingSection.index)} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                    </button>
                                </div>

                                {/* HeroSlider Content Editor */}
                                {editingSection.type === 'HeroSlider' && (
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            value={sections[editingSection.index].props?.title || ''}
                                            placeholder="Título Principal"
                                            onChange={e => {
                                                const newSections = [...sections];
                                                newSections[editingSection.index].props = { ...newSections[editingSection.index].props, title: e.target.value };
                                                setSections(newSections);
                                            }}
                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-sm font-bold"
                                        />
                                        <textarea
                                            value={sections[editingSection.index].props?.subtitle || ''}
                                            placeholder="Subtítulo / Descripción"
                                            rows={3}
                                            onChange={e => {
                                                const newSections = [...sections];
                                                newSections[editingSection.index].props = { ...newSections[editingSection.index].props, subtitle: e.target.value };
                                                setSections(newSections);
                                            }}
                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-sm"
                                        />
                                        <input
                                            type="text"
                                            value={sections[editingSection.index].props?.image || ''}
                                            placeholder="URL Imagen Fondo"
                                            onChange={e => {
                                                const newSections = [...sections];
                                                newSections[editingSection.index].props = { ...newSections[editingSection.index].props, image: e.target.value };
                                                setSections(newSections);
                                            }}
                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-xs"
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[10px] font-black uppercase text-[#8a7560] tracking-widest">Bloques</p>
                                    <button
                                        onClick={() => setShowAddSection(!showAddSection)}
                                        className="p-1 px-3 rounded-xl bg-primary text-white text-[10px] font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-1 shadow-lg shadow-primary/20"
                                    >
                                        + AÑADIR
                                    </button>
                                </div>

                                {showAddSection && (
                                    <div className="p-4 bg-zinc-50 dark:bg-white/5 border border-primary/20 rounded-2xl grid grid-cols-1 gap-2 animate-in zoom-in-95 duration-300">
                                        <button onClick={() => handleAddSection('HeroSlider')} className="py-2.5 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-[#1a130c] border border-primary/10 rounded-xl hover:border-primary hover:bg-primary/5 transition-all shadow-sm">Hero Slider</button>
                                        <button onClick={() => handleAddSection('FeaturedProducts')} className="py-2.5 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-[#1a130c] border border-primary/10 rounded-xl hover:border-primary hover:bg-primary/5 transition-all shadow-sm">Productos Destacados</button>
                                        <button onClick={() => handleAddSection('Services')} className="py-2.5 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-[#1a130c] border border-primary/10 rounded-xl hover:border-primary hover:bg-primary/5 transition-all shadow-sm">Servicios / Beneficios</button>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {sections.map((section, idx) => (
                                        <div
                                            key={section.id}
                                            onClick={() => setEditingSection({ ...section, index: idx })}
                                            className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${editingSection?.index === idx ? 'border-primary bg-primary/5' : 'bg-[#f5f2f0] dark:bg-[#2c2116] border-[#e5e1de] dark:border-[#3d2f21] hover:border-primary/50'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col gap-0.5 pr-3 border-r border-[#e5e1de] dark:border-[#3d2f21]">
                                                    <button onClick={(e) => { e.stopPropagation(); handleMoveSection(idx, -1); }} className="p-1 text-[#8a7560] hover:text-primary transition-colors">↑</button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleMoveSection(idx, 1); }} className="p-1 text-[#8a7560] hover:text-primary transition-colors">↓</button>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black uppercase tracking-wider text-[#181411] dark:text-white leading-tight">{section.type.replace(/([A-Z])/g, ' $1').trim()}</p>
                                                    <p className="text-[9px] font-bold text-[#8a7560]">{section.enabled ? 'Visible' : 'Oculto'}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const newSections = [...sections];
                                                    newSections[idx].enabled = !newSections[idx].enabled;
                                                    setSections(newSections);
                                                }}
                                                className={`p-1.5 rounded-lg transition-colors ${section.enabled ? 'text-green-500 bg-green-500/10' : 'text-zinc-400 bg-zinc-400/10'}`}
                                            >
                                                {section.enabled ? '✔' : '✖'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}                    </div>

                    <div className="p-4 bg-zinc-50 dark:bg-[#2c2116] border-t border-[#e5e1de] dark:border-[#3d2f21]">
                        <button
                            onClick={handleSaveAll}
                            disabled={saving}
                            className="w-full bg-primary text-white py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {saving ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Guardando...</span>
                                </div>
                            ) : 'Guardar Cambios'}
                        </button>
                    </div>
                </aside>

                {/* Preview Canvas */}
                <main className="flex-1 bg-[#f5f2f0] dark:bg-[#120c08] p-8 overflow-y-auto">
                    <div className="max-w-[1024px] mx-auto bg-white dark:bg-[#1a130c] shadow-[0_40px_100px_-12px_rgba(0,0,0,0.4)] rounded-[40px] overflow-hidden border border-[#e5e1de] dark:border-[#3d2f21] pointer-events-none scale-90 origin-top">
                        <PageBuilder sections={sections.filter(s => s.enabled)} />
                    </div>
                </main>
            </div>
        </AdminLayout>
    );
}
