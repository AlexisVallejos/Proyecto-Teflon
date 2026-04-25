import React, { useState } from 'react';
import EvolutionInput from './EvolutionInput';
import { FloppyDisk, MoonStars, Storefront, Sun, UploadSimple } from '@phosphor-icons/react';
import {
    DEFAULT_ADMIN_PANEL_THEME,
    LIGHT_ADMIN_PANEL_THEME,
} from '../../../utils/adminPanelTheme';
import {
    getStorefrontThemePreset,
} from '../../../utils/storefrontTheme';

const fieldClass =
    'admin-input-field w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all duration-200';

const readImageAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });

const paletteLabelMap = {
    primary: 'Acento',
    background: 'Fondo',
    text: 'Texto',
    secondary: 'Texto secundario',
    shell_bg: 'Shell',
    sidebar_bg: 'Sidebar',
    panel_bg: 'Paneles',
    canvas_bg: 'Canvas',
    muted_text: 'Texto secundario',
};

const PaletteChip = ({ label, value }) => (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
        <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
            <p className="mt-0.5 font-mono text-xs text-zinc-300">{value}</p>
        </div>
        <span className="h-8 w-8 shrink-0 rounded-lg border border-white/15" style={{ backgroundColor: value }} />
    </div>
);

const ColorField = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 pl-3 pr-2 py-1.5 focus-within:border-white/20 transition-colors">
        <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
            <p className="mt-0.5 font-mono text-xs text-zinc-300">{value}</p>
        </div>
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-white/15">
            <input 
                type="color" 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                className="absolute -left-2 -top-2 h-12 w-12 cursor-pointer bg-transparent"
                title="Editar color"
            />
        </div>
    </div>
);

const ThemeModeButton = ({ active, icon, title, description, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="group relative overflow-hidden rounded-2xl border p-4 text-left transition-all"
        style={{
            backgroundColor: active ? 'var(--admin-accent-soft)' : 'var(--admin-hover)',
            borderColor: active ? 'var(--admin-accent-border)' : 'var(--admin-border-soft)',
            boxShadow: active ? '0 18px 40px rgba(0,0,0,0.18)' : 'none',
        }}
    >
        <div className="flex items-start gap-3">
            <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                style={{
                    backgroundColor: active ? 'var(--admin-accent)' : 'var(--admin-panel-bg)',
                    borderColor: active ? 'var(--admin-accent-border)' : 'var(--admin-border-soft)',
                    color: active ? 'var(--admin-accent-contrast)' : 'var(--admin-text)',
                }}
            >
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-[0.14em] admin-text-primary">{title}</p>
                <p className="mt-1 text-xs leading-relaxed admin-text-muted">{description}</p>
            </div>
        </div>
        {active ? (
            <span className="absolute right-3 top-3 rounded-full bg-[var(--admin-accent)] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-[var(--admin-accent-contrast)]">
                Activo
            </span>
        ) : null}
    </button>
);

const PalettePreview = ({ title, subtitle, colors }) => (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="mb-4 space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">{title}</p>
            {subtitle ? <p className="text-xs text-zinc-500">{subtitle}</p> : null}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(colors).map(([key, value]) => (
                <PaletteChip key={key} label={paletteLabelMap[key] || key} value={value} />
            ))}
        </div>
    </div>
);

const AppearanceEditor = ({ settings, setSettings, onSave, isSaving }) => {
    const [logoUploading, setLogoUploading] = useState(false);
    const [adminLogoUploading, setAdminLogoUploading] = useState(false);

    const branding = settings?.branding || {};
    const theme = settings?.theme || {};
    const adminBranding = branding?.admin_panel || {};
    const adminTheme = theme?.admin_panel || {};
    const footer = branding?.footer || {};
    const socials = footer?.socials || {};
    const contact = footer?.contact || {};
    const quickLinks = Array.isArray(footer?.quickLinks) ? footer.quickLinks : [];
    const storefrontMode = theme?.mode === 'dark' ? 'dark' : 'light';
    const adminMode = adminTheme?.mode === 'light' ? 'light' : 'dark';
    const storefrontPreview = getStorefrontThemePreset(storefrontMode);
    const adminPreview = adminMode === 'light' ? LIGHT_ADMIN_PANEL_THEME : DEFAULT_ADMIN_PANEL_THEME;

    const updateTheme = (patch) => {
        setSettings((prev) => ({
            ...prev,
            theme: {
                ...(prev.theme || {}),
                ...patch,
            },
        }));
    };

    const updateBranding = (patch) => {
        setSettings((prev) => ({
            ...prev,
            branding: {
                ...(prev.branding || {}),
                ...patch,
            },
        }));
    };

    const updateAdminBranding = (patch) => {
        setSettings((prev) => ({
            ...prev,
            branding: {
                ...(prev.branding || {}),
                admin_panel: {
                    ...((prev.branding || {}).admin_panel || {}),
                    ...patch,
                },
            },
        }));
    };

    const updateAdminTheme = (patch) => {
        setSettings((prev) => ({
            ...prev,
            theme: {
                ...(prev.theme || {}),
                admin_panel: {
                    ...((prev.theme || {}).admin_panel || {}),
                    ...patch,
                },
            },
        }));
    };

    const applyStorefrontThemePreset = (mode) => {
        updateTheme(getStorefrontThemePreset(mode));
    };

    const applyAdminThemePreset = (mode) => {
        updateAdminTheme(mode === 'light' ? LIGHT_ADMIN_PANEL_THEME : DEFAULT_ADMIN_PANEL_THEME);
    };

    const updateFooter = (patch) => {
        setSettings((prev) => ({
            ...prev,
            branding: {
                ...(prev.branding || {}),
                footer: {
                    ...((prev.branding || {}).footer || {}),
                    ...patch,
                },
            },
        }));
    };

    const updateFooterSocial = (field, value) => {
        setSettings((prev) => ({
            ...prev,
            branding: {
                ...(prev.branding || {}),
                footer: {
                    ...((prev.branding || {}).footer || {}),
                    socials: {
                        ...(((prev.branding || {}).footer || {}).socials || {}),
                        [field]: value,
                    },
                },
            },
        }));
    };

    const updateFooterContact = (field, value) => {
        setSettings((prev) => ({
            ...prev,
            branding: {
                ...(prev.branding || {}),
                footer: {
                    ...((prev.branding || {}).footer || {}),
                    contact: {
                        ...(((prev.branding || {}).footer || {}).contact || {}),
                        [field]: value,
                    },
                },
            },
        }));
    };

    const updateQuickLink = (index, field, value) => {
        const next = [...quickLinks];
        if (!next[index]) return;
        next[index] = { ...next[index], [field]: value };
        updateFooter({ quickLinks: next });
    };

    const removeQuickLink = (index) => {
        updateFooter({ quickLinks: quickLinks.filter((_, idx) => idx !== index) });
    };

    const addQuickLink = () => {
        updateFooter({ quickLinks: [...quickLinks, { label: 'Nuevo link', href: '/catalog' }] });
    };

    const handleLogoUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setLogoUploading(true);
        try {
            const dataUrl = await readImageAsDataUrl(file);
            if (dataUrl) updateBranding({ logo_url: dataUrl });
        } catch (err) {
            console.error('Logo upload failed', err);
        } finally {
            setLogoUploading(false);
            event.target.value = '';
        }
    };

    const handleAdminLogoUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setAdminLogoUploading(true);
        try {
            const dataUrl = await readImageAsDataUrl(file);
            if (dataUrl) updateAdminBranding({ logo_url: dataUrl });
        } catch (err) {
            console.error('Admin logo upload failed', err);
        } finally {
            setAdminLogoUploading(false);
            event.target.value = '';
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight admin-text-primary">Apariencia</h2>
                    <p className="text-sm admin-text-muted">
                        Paletas cerradas para que la tienda y el panel mantengan una identidad consistente.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onSave}
                    disabled={isSaving}
                    className="admin-accent-button inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                >
                    <FloppyDisk size={14} weight="bold" />
                    {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <section className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="space-y-1">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Tienda publica</h3>
                        <p className="text-xs text-zinc-500">
                            Este tema se aplica a home, catalogo, producto, carrito, checkout, login y registro del cliente.
                        </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-1">
                        <ThemeModeButton
                            active={true}
                            icon={<Sun size={16} weight="bold" />}
                            title="Claro"
                            description="Modo principal de la tienda. Puedes modificar los colores libremente."
                            onClick={() => {}}
                        />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="mb-4 space-y-1">
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Paleta base interactiva</p>
                            <p className="text-xs text-zinc-500">Haz clic en los colores para personalizarlos.</p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <ColorField
                                label="Acento"
                                value={theme.primary || DEFAULT_STOREFRONT_LIGHT_THEME.primary}
                                onChange={(val) => updateTheme({ mode: 'light', primary: val, accent: val })}
                            />
                            <ColorField
                                label="Fondo"
                                value={theme.background || DEFAULT_STOREFRONT_LIGHT_THEME.background}
                                onChange={(val) => updateTheme({ mode: 'light', background: val })}
                            />
                            <ColorField
                                label="Texto"
                                value={theme.text || DEFAULT_STOREFRONT_LIGHT_THEME.text}
                                onChange={(val) => updateTheme({ mode: 'light', text: val })}
                            />
                            <ColorField
                                label="Texto sec."
                                value={theme.secondary || DEFAULT_STOREFRONT_LIGHT_THEME.secondary}
                                onChange={(val) => updateTheme({ mode: 'light', secondary: val })}
                            />
                            <ColorField
                                label="Paneles"
                                value={theme.catalog?.panel_bg || DEFAULT_STOREFRONT_LIGHT_THEME.catalog.panel_bg}
                                onChange={(val) => updateTheme({ mode: 'light', catalog: { ...(theme.catalog || DEFAULT_STOREFRONT_LIGHT_THEME.catalog), panel_bg: val } })}
                            />
                            <ColorField
                                label="Cartas"
                                value={theme.catalog?.card_bg || DEFAULT_STOREFRONT_LIGHT_THEME.catalog.card_bg}
                                onChange={(val) => updateTheme({ mode: 'light', catalog: { ...(theme.catalog || DEFAULT_STOREFRONT_LIGHT_THEME.catalog), card_bg: val } })}
                            />
                        </div>
                    </div>

                    <EvolutionInput
                        label="Nombre de la empresa"
                        value={branding.name || ''}
                        onChange={(e) => updateBranding({ name: e.target.value })}
                        placeholder="Ej: Tu empresa"
                        helperText="Se usa como marca principal en la tienda y como fallback en el admin."
                    />

                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Logo de la tienda</p>
                        <div className="flex items-center gap-3">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                    disabled={logoUploading}
                                />
                                <UploadSimple size={14} weight="bold" />
                                {logoUploading ? 'Subiendo...' : 'Subir logo'}
                            </label>
                            {branding.logo_url ? (
                                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white">
                                    <img src={branding.logo_url} alt="Logo" className="h-10 w-10 object-contain" />
                                </div>
                            ) : null}
                        </div>
                    </div>
                </section>

                <section className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="space-y-1">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Admin panel</h3>
                        <p className="text-xs text-zinc-500">
                            El editor tambien usa presets completos: sidebar, paneles, canvas, texto y estados.
                        </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <ThemeModeButton
                            active={adminMode === 'light'}
                            icon={<Sun size={16} weight="bold" />}
                            title="Claro"
                            description="Panel luminoso para gestion diaria con mucho contenido."
                            onClick={() => applyAdminThemePreset('light')}
                        />
                        <ThemeModeButton
                            active={adminMode === 'dark'}
                            icon={<MoonStars size={16} weight="bold" />}
                            title="Oscuro"
                            description="Panel oscuro con acento neutro y foco en el canvas."
                            onClick={() => applyAdminThemePreset('dark')}
                        />
                    </div>

                    <PalettePreview
                        title="Paleta del admin"
                        subtitle="Preset bloqueado para que todo el panel mantenga contraste correcto."
                        colors={{
                            accent: adminPreview.accent,
                            sidebar_bg: adminPreview.sidebar_bg,
                            panel_bg: adminPreview.panel_bg,
                            canvas_bg: adminPreview.canvas_bg,
                            text: adminPreview.text,
                            muted_text: adminPreview.muted_text,
                        }}
                    />

                    <EvolutionInput
                        label="Nombre visible del admin"
                        value={adminBranding.title || ''}
                        onChange={(e) => updateAdminBranding({ title: e.target.value })}
                        placeholder="Ej: Panel principal"
                        helperText="Si lo dejas vacio, el panel muestra automaticamente el nombre de la empresa."
                    />

                    <EvolutionInput
                        label="Logo URL del panel"
                        value={adminBranding.logo_url || ''}
                        onChange={(e) => updateAdminBranding({ logo_url: e.target.value })}
                        placeholder="https://tu-dominio.com/logo-admin.png"
                        helperText="Si lo dejas vacio, usa el logo general."
                    />

                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Logo del panel</p>
                        <div className="flex items-center gap-3">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAdminLogoUpload}
                                    className="hidden"
                                    disabled={adminLogoUploading}
                                />
                                <UploadSimple size={14} weight="bold" />
                                {adminLogoUploading ? 'Subiendo...' : 'Subir logo admin'}
                            </label>
                            {(adminBranding.logo_url || branding.logo_url) ? (
                                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white">
                                    <img
                                        src={adminBranding.logo_url || branding.logo_url}
                                        alt="Logo admin"
                                        className="h-10 w-10 object-contain"
                                    />
                                </div>
                            ) : null}
                        </div>
                    </div>
                </section>

                <section className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-4 xl:col-span-2">
                    <div className="flex items-center gap-3">
                        <div className="admin-accent-surface flex h-10 w-10 items-center justify-center rounded-2xl border">
                            <Storefront size={18} weight="bold" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Footer y contacto</h3>
                            <p className="text-xs text-zinc-500">Contenido del pie de pagina publico.</p>
                        </div>
                    </div>

                    <EvolutionInput
                        label="Descripcion"
                        value={footer.description || ''}
                        onChange={(e) => updateFooter({ description: e.target.value })}
                        multiline
                        placeholder="Texto breve para el pie de pagina"
                        helperText="Se muestra en el footer de la tienda."
                    />

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <EvolutionInput
                            label="Instagram URL"
                            value={socials.instagram || ''}
                            onChange={(e) => updateFooterSocial('instagram', e.target.value)}
                            placeholder="https://instagram.com/tu-cuenta"
                        />
                        <EvolutionInput
                            label="WhatsApp"
                            value={socials.whatsapp || ''}
                            onChange={(e) => updateFooterSocial('whatsapp', e.target.value)}
                            disabled={footer.whatsapp_enabled === false}
                            placeholder="5492230000000"
                            helperText="Formato recomendado: codigo pais + numero, sin espacios."
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                        <p className="text-xs font-bold text-zinc-200">Mostrar WhatsApp en footer</p>
                        <button
                            type="button"
                            onClick={() => updateFooter({ whatsapp_enabled: footer.whatsapp_enabled === false })}
                            className={`h-6 w-11 rounded-full border transition ${
                                footer.whatsapp_enabled === false
                                    ? 'border-white/20 bg-zinc-700'
                                    : 'border-evolution-indigo/70 bg-evolution-indigo'
                            }`}
                            aria-label="toggle whatsapp footer"
                        >
                            <span
                                className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                                    footer.whatsapp_enabled === false ? 'translate-x-1' : 'translate-x-6'
                                }`}
                            />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <EvolutionInput
                            label="Direccion"
                            value={contact.address || ''}
                            onChange={(e) => updateFooterContact('address', e.target.value)}
                            placeholder="Av. Ejemplo 123"
                        />
                        <EvolutionInput
                            label="Telefono"
                            value={contact.phone || ''}
                            onChange={(e) => updateFooterContact('phone', e.target.value)}
                            placeholder="+54 223 000 0000"
                        />
                        <EvolutionInput
                            label="Email"
                            value={contact.email || ''}
                            onChange={(e) => updateFooterContact('email', e.target.value)}
                            placeholder="ventas@tuempresa.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Enlaces rapidos</p>
                            <button
                                type="button"
                                onClick={addQuickLink}
                                className="rounded-lg border border-white/15 px-2 py-1 text-[11px] font-bold text-zinc-300"
                            >
                                + Anadir
                            </button>
                        </div>

                        <div className="space-y-2">
                            {quickLinks.map((link, idx) => (
                                <div key={`quick-link-${idx}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                                    <input
                                        type="text"
                                        value={link.label || ''}
                                        placeholder="Etiqueta"
                                        onChange={(e) => updateQuickLink(idx, 'label', e.target.value)}
                                        className={fieldClass}
                                    />
                                    <input
                                        type="text"
                                        value={link.href || ''}
                                        placeholder="Link"
                                        onChange={(e) => updateQuickLink(idx, 'href', e.target.value)}
                                        className={fieldClass}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeQuickLink(idx)}
                                        className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-xs font-bold text-rose-300"
                                    >
                                        X
                                    </button>
                                </div>
                            ))}

                            {!quickLinks.length ? (
                                <p className="text-xs text-zinc-500">Sin enlaces configurados.</p>
                            ) : null}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AppearanceEditor;
