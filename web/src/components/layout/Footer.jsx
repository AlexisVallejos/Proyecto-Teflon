import React from "react";
import { useTenant } from "../../context/TenantContext";
import { navigate } from "../../utils/navigation";

export default function Footer() {
    const { tenant, settings } = useTenant();
    
    const branding = settings?.branding || {};
    const footer = branding.footer || {};
    const commerce = settings?.commerce || {};
    
    const brandName = (branding.name || tenant?.name || "VASE").toUpperCase();
    const footerDescription = footer.description || `Tu socio estratégico en soluciones de comercio electrónico para ${brandName}.`;
    const instagramUrl = footer.socials?.instagram || "";
    
    const quickLinks = Array.isArray(footer.quickLinks) ? footer.quickLinks : [
        { label: "Inicio", href: "/" },
        { label: "Catalogo", href: "/catalog" },
        { label: "Sobre Nosotros", href: "/about" }
    ];

    const address = commerce.address || "Ventas Online";
    const phone = commerce.whatsapp_number || commerce.phone || "";
    const email = commerce.email || "";

    const openWhatsapp = () => {
        const cleaned = phone.replace(/\D/g, "");
        if (cleaned) {
            window.open(`https://wa.me/${cleaned}`, "_blank");
        }
    };

    return (
        <footer className="bg-black text-white w-full py-20 mt-20">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Info */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                            </svg>
                            <h2 className="text-2xl font-black uppercase tracking-tight">{brandName}</h2>
                        </div>
                        <p className="text-zinc-400 mb-6 leading-relaxed">
                            {footerDescription}
                        </p>
                        {instagramUrl && (
                            <div className="flex gap-4">
                                <a 
                                    href={instagramUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="h-10 w-10 flex items-center justify-center rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors"
                                >
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                    </svg>
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Explorar</h3>
                        <ul className="space-y-4">
                            {quickLinks.map((link, i) => (
                                <li key={i}>
                                    <a 
                                        href={link.href} 
                                        onClick={(e) => { e.preventDefault(); navigate(link.href); }}
                                        className="text-zinc-400 hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Contacto</h3>
                        <ul className="space-y-4 text-zinc-400">
                            <li className="flex gap-3">
                                <svg className="w-5 h-5 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                <span>{address}</span>
                            </li>
                            <li className="flex gap-3">
                                <svg className="w-5 h-5 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                </svg>
                                <span>{phone}</span>
                            </li>
                        </ul>
                    </div>

                    {/* WhatsApp Action */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Soporte Directo</h3>
                        <p className="text-zinc-400 text-sm mb-6">Escribenos por WhatsApp para una atencion personalizada.</p>
                        <button 
                            onClick={openWhatsapp}
                            className="w-full py-3 bg-[#25D366] text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"></path>
                            </svg>
                            Enviar Mensaje
                        </button>
                    </div>
                </div>

                <div className="pt-12 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-zinc-500 text-xs tracking-widest uppercase">
                        © {new Date().getFullYear()} {brandName}. TODOS LOS DERECHOS RESERVADOS.
                    </p>
                    <div className="flex gap-6 text-zinc-500 text-xs tracking-widest uppercase">
                        <a href="/terms" className="hover:text-white transition-colors">Terminos</a>
                        <a href="/privacy" className="hover:text-white transition-colors">Privacidad</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
