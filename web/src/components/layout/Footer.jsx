import React, { useId, useMemo, useState } from "react";
import { Instagram, Facebook, Youtube, Music2, MessageCircle, Linkedin, Globe } from "lucide-react";
import { useTenant } from "../../context/TenantContext";
import { navigate } from "../../utils/navigation";
import { PIQUIM_FOOTER_DEFAULTS } from "../../data/piquimBranding";
import { isPiquimTenantIdentity } from "../../utils/tenantBranding";

const toArray = (value, fallback = []) => (Array.isArray(value) ? value : fallback);
const SOCIAL_ICON_MAP = {
    instagram: Instagram,
    facebook: Facebook,
    youtube: Youtube,
    tiktok: Music2,
    whatsapp: MessageCircle,
    linkedin: Linkedin,
    website: Globe,
};

const detectSocialType = (value = "") => {
    const raw = String(value || "").toLowerCase();
    if (raw.includes("instagram")) return "instagram";
    if (raw.includes("facebook")) return "facebook";
    if (raw.includes("youtube") || raw.includes("youtu.be")) return "youtube";
    if (raw.includes("tiktok")) return "tiktok";
    if (raw.includes("wa.me") || raw.includes("whatsapp")) return "whatsapp";
    if (raw.includes("linkedin")) return "linkedin";
    return "website";
};

const normalizeSocials = (footer) => {
    const explicit = toArray(footer.socialLinks, []);
    if (explicit.length) {
        return explicit.map((item) => {
            const type = item?.type || detectSocialType(item?.href || "");
            return {
                label: item?.label || type,
                type,
                href: item?.href || "",
            };
        });
    }

    const socials = footer.socials || {};
    return [
        { label: "Instagram", type: "instagram", href: socials.instagram || "" },
        { label: "Facebook", type: "facebook", href: socials.facebook || "" },
        { label: "YouTube", type: "youtube", href: socials.youtube || "" },
        { label: "TikTok", type: "tiktok", href: socials.tiktok || "" },
    ];
};

const FooterLink = ({ href, children }) => (
    <a
        href={href || "/"}
        onClick={(event) => {
            if (!href || href.startsWith("http")) return;
            event.preventDefault();
            navigate(href);
        }}
        target={href?.startsWith("http") ? "_blank" : undefined}
        rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
        className="text-sm font-semibold text-[#b9aaa2] transition-colors hover:text-white"
    >
        {children}
    </a>
);

export default function Footer() {
    const { tenant, settings } = useTenant();
    const emailId = useId();
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const branding = settings?.branding || {};
    const footer = branding.footer || {};
    const commerce = settings?.commerce || {};
    const brandName = branding.name || tenant?.name || "Mi Negocio";
    const isPiquim = isPiquimTenantIdentity({ tenant, settings });
    const genericFooterDescription = "Soluciones sanitarias, griferia y accesorios con asesoramiento comercial.";
    const genericLinks = [
        { label: "Catalogo", href: "/catalog" },
        { label: "Nosotros", href: "/about" },
    ];

    const footerDescription = footer.description || (isPiquim ? PIQUIM_FOOTER_DEFAULTS.description : genericFooterDescription);
    const shopLinks = toArray(footer.shopLinks, toArray(footer.quickLinks, isPiquim ? PIQUIM_FOOTER_DEFAULTS.shopLinks : genericLinks));
    const helpLinks = toArray(footer.helpLinks, isPiquim ? PIQUIM_FOOTER_DEFAULTS.helpLinks : []);
    const legalLinks = toArray(footer.legalLinks, isPiquim ? PIQUIM_FOOTER_DEFAULTS.legalLinks : [{ label: "Terminos", href: "/terms" }]);
    const socialLinks = normalizeSocials(footer).filter((item) => item?.label);
    const newsletter = { ...(isPiquim ? PIQUIM_FOOTER_DEFAULTS.newsletter : { enabled: false }), ...(footer.newsletter || {}) };
    const legalText = footer.legalText || (isPiquim ? PIQUIM_FOOTER_DEFAULTS.legalText : `(c) 2026 ${brandName}. Todos los derechos reservados.`);

    const phone = footer.contact?.phone || footer.socials?.whatsapp || commerce.whatsapp_number || "";

    const handleNewsletterSubmit = (event) => {
        event.preventDefault();
        if (!email.trim()) return;
        setSubmitted(true);
        setEmail("");
    };

    if (!isPiquim) {
        return (
            <footer className="mt-20 w-full bg-black py-20 text-white">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <h2 className="mb-6 text-2xl font-black uppercase tracking-tight">{brandName}</h2>
                            <p className="leading-relaxed text-zinc-400">{footerDescription}</p>
                        </div>
                        <div>
                            <h3 className="mb-6 text-sm font-bold uppercase tracking-widest">Explorar</h3>
                            <ul className="space-y-4">
                                {shopLinks.map((link, index) => (
                                    <li key={`${link.label}-${index}`}><FooterLink href={link.href}>{link.label}</FooterLink></li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>
        );
    }

    return (
        <footer className="mt-0 w-full bg-[#1a1614] text-[#fffaf6]">
            <div className="mx-auto max-w-[1440px] px-5 py-14 md:px-10 md:py-20 xl:px-[120px]">
                <div className="grid gap-8 md:gap-10 lg:grid-cols-2 xl:grid-cols-[1.1fr_0.75fr_0.75fr_0.75fr_1fr] xl:gap-12">
                    <div className="space-y-7">
                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="text-left text-[42px] font-black lowercase leading-none tracking-[-0.08em] text-[#ff4d00]"
                        >
                            piquim
                        </button>
                        <p className="max-w-sm text-base font-semibold leading-7 text-[#d7c8bf]">
                            {footerDescription}
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {socialLinks.map((item, index) => (
                                (() => {
                                    const Icon = SOCIAL_ICON_MAP[item?.type] || Globe;
                                    return (
                                        <a
                                            key={`${item.label}-${index}`}
                                            href={item.href || "#"}
                                            onClick={(event) => {
                                                if (!item.href) event.preventDefault();
                                            }}
                                            target={item.href?.startsWith("http") ? "_blank" : undefined}
                                            rel={item.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                                            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#3a2d27] bg-[#241d1a] text-[#fffaf6] transition-colors hover:border-[#ff4d00] hover:text-[#ff4d00]"
                                            aria-label={item.label}
                                        >
                                            <Icon size={16} strokeWidth={2.4} />
                                        </a>
                                    );
                                })()
                            ))}
                        </div>
                    </div>

                    <div className="lg:pt-1">
                        <FooterColumn title="Tienda" links={shopLinks} />
                    </div>
                    <div className="lg:pt-1">
                        <FooterColumn title="Ayuda" links={helpLinks} />
                    </div>

                    <div className="lg:pt-1">
                        <FooterColumn title="Legal" links={legalLinks} compact />
                    </div>

                    <div className="space-y-4 lg:pt-1">
                        {newsletter.enabled !== false ? (
                            <form onSubmit={handleNewsletterSubmit} className="rounded-[24px] border border-[#332822] bg-[#211b18] p-4">
                                <label htmlFor={emailId} className="block text-xs font-black uppercase tracking-[0.16em] text-[#ffbe8b]">
                                    {newsletter.title}
                                </label>
                                <p className="mt-2 text-sm leading-5 text-[#b9aaa2]">{newsletter.description}</p>
                                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                    <input
                                        id={emailId}
                                        type="email"
                                        value={email}
                                        onChange={(event) => {
                                            setEmail(event.target.value);
                                            setSubmitted(false);
                                        }}
                                        placeholder={newsletter.placeholder}
                                        className="min-w-0 flex-1 rounded-full border border-[#3a2d27] bg-[#171310] px-4 py-3 text-sm text-white outline-none placeholder:text-[#7b665d] focus:border-[#ff4d00]"
                                    />
                                    <button type="submit" className="rounded-full bg-[#ff4d00] px-4 py-3 text-xs font-black uppercase tracking-[0.08em] text-white">
                                        {newsletter.buttonLabel}
                                    </button>
                                </div>
                                {submitted ? <p className="mt-3 text-xs font-bold text-[#ffbe8b]">Suscripcion recibida.</p> : null}
                            </form>
                        ) : null}
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-4 border-t border-[#332822] pt-8 text-xs font-semibold text-[#8f8077] md:flex-row md:items-center md:justify-between">
                    <p>{legalText}</p>
                    {phone ? (
                        <button
                            type="button"
                            onClick={() => {
                                const cleaned = phone.replace(/\D/g, "");
                                if (cleaned) window.open(`https://wa.me/${cleaned}`, "_blank");
                            }}
                            className="w-fit rounded-full border border-[#3a2d27] px-4 py-2 text-[#ffbe8b] transition-colors hover:border-[#ff4d00] hover:text-white"
                        >
                            WhatsApp comercial
                        </button>
                    ) : null}
                </div>
            </div>
        </footer>
    );
}

function FooterColumn({ title, links, compact = false }) {
    const items = useMemo(() => toArray(links, []), [links]);
    return (
        <div>
            <h3 className="mb-5 text-xs font-black uppercase tracking-[0.18em] text-[#ffbe8b]">{title}</h3>
            <ul className={compact ? "space-y-3" : "space-y-4"}>
                {items.map((link, index) => (
                    <li key={`${title}-${link.label}-${index}`}>
                        <FooterLink href={link.href}>{link.label}</FooterLink>
                    </li>
                ))}
            </ul>
        </div>
    );
}
