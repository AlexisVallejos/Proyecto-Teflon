import React, { useEffect, useMemo, useState } from "react";
import { useTenant } from "../../context/TenantContext";
import { useStore } from "../../context/StoreContext";
import { useAuth } from "../../context/AuthContext";
import { isExternalPath, navigate, normalizeInternalPath } from "../../utils/navigation";
import { getApiBase, getTenantHeaders } from "../../utils/api";

const DEFAULT_PLACEHOLDER = "Busca tu producto";
const HIDDEN_TOPICS = new Set(["buscador de tapas", "donde comprar", "mis proyectos", "messi"]);

const normalizeLabel = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const BrandMark = ({ className = "size-8" }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect x="2" y="2" width="28" height="28" rx="6" stroke="currentColor" strokeWidth="2.5" />
    <path d="M11 9h10v5h-5v9h-5V9z" fill="currentColor" />
  </svg>
);

const SearchIcon = ({ className = "size-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CartIcon = ({ className = "size-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="20" r="1.2" />
    <circle cx="18" cy="20" r="1.2" />
    <path d="M2 3h3l2.2 11h10.7l2-8.5H6.2" />
  </svg>
);

const UserIcon = ({ className = "size-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-1a6 6 0 0 0-6-6H10a6 6 0 0 0-6 6v1" />
    <circle cx="12" cy="8" r="4" />
  </svg>
);

const ChevronDown = ({ className = "size-3" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const MenuIcon = ({ className = "size-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = ({ className = "size-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function MenuAnchor({ href, label, active = false, external = false, className = "" }) {
  const finalClass = `inline-flex items-center gap-1 border-b-2 text-[13px] font-semibold uppercase tracking-[0.06em] transition-colors ${
    active
      ? "border-[color:var(--color-primary,#0099e5)] text-[color:var(--color-primary,#0099e5)]"
      : "border-transparent text-[#1f2937] hover:text-[color:var(--color-primary,#0099e5)] dark:text-[#e7ddd3]"
  } ${className}`;

  if (external) {
    return (
      <a className={finalClass} href={href} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    );
  }

  return (
    <a
      className={finalClass}
      href={href}
      onClick={(event) => {
        event.preventDefault();
        navigate(href);
      }}
    >
      {label}
    </a>
  );
}

export default function Header({
  navLinks = [],
  searchPlaceholder = DEFAULT_PLACEHOLDER,
  brandName,
  brandUppercase = false,
  showSearch = true,
  showCart = true,
  showAccount = true,
  containerClassName = "max-w-[1408px]",
}) {
  const { tenant, settings } = useTenant();
  const { search, setSearch, cartCount } = useStore();
  const { user, isAdmin } = useAuth();
  const [activeRoute, setActiveRoute] = useState(() => `${window.location.pathname}${window.location.search || ""}${window.location.hash || ""}`);
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [catalogBrands, setCatalogBrands] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileCategories, setExpandedMobileCategories] = useState({});
  const [activeMobileTab, setActiveMobileTab] = useState("menu"); // menu, categories, brands

  const resolvedBrand = brandName || settings?.branding?.name || tenant?.name || "Mi Negocio";
  const logoUrl = settings?.branding?.logo_url;

  useEffect(() => {
    const handleLocationChange = () => {
      setActiveRoute(`${window.location.pathname}${window.location.search || ""}${window.location.hash || ""}`);
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("navigate", handleLocationChange);
    window.addEventListener("hashchange", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("navigate", handleLocationChange);
      window.removeEventListener("hashchange", handleLocationChange);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeRoute]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const loadCatalogMeta = async () => {
      try {
        const [categoriesRes, brandsRes] = await Promise.all([
          fetch(`${getApiBase()}/public/categories`, {
            headers: getTenantHeaders(),
            signal: controller.signal,
          }),
          fetch(`${getApiBase()}/public/brands`, {
            headers: getTenantHeaders(),
            signal: controller.signal,
          }),
        ]);

        if (active && categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          const normalizedCategories = Array.isArray(categoriesData)
            ? categoriesData
                .filter((item) => item && item.id && item.name)
                .filter((item) => !HIDDEN_TOPICS.has(normalizeLabel(item.name)))
                .map((item) => ({
                  id: item.id,
                  name: item.name,
                  slug: item.slug || null,
                  parent_id: item.parent_id || null,
                  parent_name: item.parent_name || null,
                }))
            : [];
          setCatalogCategories(normalizedCategories);
        }

        if (active && brandsRes.ok) {
          const brandsData = await brandsRes.json();
          const normalizedBrands = Array.isArray(brandsData)
            ? brandsData
                .filter((item) => typeof item === "string" && item.trim())
                .filter((item) => !HIDDEN_TOPICS.has(normalizeLabel(item)))
                .map((item) => item.trim())
            : [];
          setCatalogBrands(normalizedBrands);
        }
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.error("No se pudo cargar metadata del navbar", error);
        }
      }
    };

    loadCatalogMeta();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const links = navLinks
    .map((link) => {
      if (typeof link === "string") {
        return { label: link, href: normalizeInternalPath(link, "/catalog") };
      }
      const fallbackByLabel = normalizeInternalPath(link?.label || "", "/");
      const rawHref = link?.href || link?.path || fallbackByLabel;
      return {
        ...link,
        href: normalizeInternalPath(rawHref, fallbackByLabel),
      };
    })
    .filter((item) => !HIDDEN_TOPICS.has(normalizeLabel(item?.label)));

  const normalizeRoute = (value) => {
    if (!value) return "/";
    if (isExternalPath(value)) return value;
    const normalizedValue = normalizeInternalPath(value, "/");
    const [rawPath, rawHash] = normalizedValue.split("#");
    let normalizedPath = rawPath || "/";
    if (normalizedPath === "/sobre-nosotros") normalizedPath = "/about";
    const hash = rawHash ? `#${rawHash}` : "";
    return `${normalizedPath}${hash}`;
  };

  const handleSearchKey = (event) => {
    if (event.key === "Enter") {
      navigate("/catalog");
    }
  };

  const handleAccountClick = () => {
    if (user) {
      navigate(isAdmin ? "/admin" : "/profile");
    } else {
      navigate("/login");
    }
  };

  const handleMobileNavigate = (href) => {
    setMobileMenuOpen(false);
    navigate(href);
  };

  const whatsappRaw = settings?.branding?.footer?.socials?.whatsapp || settings?.commerce?.whatsapp_number || "";
  const whatsappCleaned = String(whatsappRaw).replace(/\D/g, "");
  const whatsappHref = whatsappCleaned ? `https://wa.me/${whatsappCleaned}` : null;

  const categoryTree = useMemo(() => {
    if (!Array.isArray(catalogCategories) || !catalogCategories.length) return [];

    const byId = new Map();
    catalogCategories.forEach((item) => {
      byId.set(item.id, {
        id: item.id,
        slug: item.slug || null,
        name: item.name,
        parent_id: item.parent_id || null,
        children: [],
      });
    });

    const roots = [];
    byId.forEach((node) => {
      if (node.parent_id && byId.has(node.parent_id)) {
        byId.get(node.parent_id).children.push(node);
      } else {
        roots.push(node);
      }
    });

    const sorter = (a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" });
    roots.sort(sorter);
    roots.forEach((item) => item.children.sort(sorter));
    return roots;
  }, [catalogCategories]);

  useEffect(() => {
    setExpandedMobileCategories((prev) => {
      const next = {};
      categoryTree.forEach((parent) => {
        next[parent.id] = typeof prev[parent.id] === "boolean" ? prev[parent.id] : false;
      });
      return next;
    });
  }, [categoryTree]);

  const categoryLinks = useMemo(() => {
    const next = [];
    categoryTree.forEach((parent) => {
      next.push({
        label: parent.name,
        href: `/catalog?category=${encodeURIComponent(parent.id)}`,
      });
      parent.children.forEach((child) => {
        next.push({
          label: `${parent.name} / ${child.name}`,
          href: `/catalog?category=${encodeURIComponent(child.id)}`,
        });
      });
    });
    return next;
  }, [categoryTree]);

  const brandLinks = catalogBrands.slice(0, 10).map((brand) => ({
    label: brand,
    href: `/catalog?brand=${encodeURIComponent(brand)}`,
  }));

  const staticLinks = [
    { label: "Sobre nosotros", href: "/about", external: false },
    { label: "Contactanos", href: "/#contacto", external: false },
    ...(whatsappHref ? [{ label: "WhatsApp", href: whatsappHref, external: true }] : []),
  ];

  const extraLinks = links.filter((item) => {
    const key = normalizeLabel(item?.label);
    return !["inicio", "home", "catalogo", "catalog", "productos", "sobre nosotros", "nosotros", "contactanos", "contacto", "whatsapp"].includes(key);
  });

  const productsActive = activeRoute.startsWith("/catalog");
  const accountLabel = user ? "Mi cuenta" : "Ingresar";

  const mobilePrimaryLinks = useMemo(() => {
    const seen = new Set();
    const entries = [
      { label: "Catalogo completo", href: "/catalog", external: false },
      ...staticLinks,
      ...extraLinks.map((item) => ({ label: item.label, href: item.href || "/", external: isExternalPath(item.href || "/") })),
    ];

    return entries.filter((item) => {
      const key = `${item.label}-${item.href}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [extraLinks, staticLinks]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/50 bg-white/70 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-[#120c08]/70">
      <div className={`mx-auto ${containerClassName}`}>
        <div className="flex items-center justify-between px-4 h-20 md:px-10">
          <div className="flex items-center gap-12">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-3 text-[color:var(--color-primary,#0099e5)]"
              aria-label="Ir a inicio"
            >
              {logoUrl ? (
                <img src={logoUrl} alt={resolvedBrand} className="h-10 w-auto max-w-[160px] object-contain" />
              ) : (
                <>
                  <BrandMark className="size-9" />
                  <h2 className={`text-2xl font-black leading-none tracking-tighter sm:text-3xl font-['Manrope'] ${brandUppercase ? "uppercase" : ""}`}>
                    {resolvedBrand}
                  </h2>
                </>
              )}
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a 
                href="/catalog" 
                onClick={(e) => { e.preventDefault(); navigate('/catalog'); }}
                className={`font-['Manrope'] text-sm font-medium tracking-wide uppercase transition-all duration-300 ${activeRoute.startsWith('/catalog') ? 'text-zinc-900 border-b-2 border-zinc-900 pb-1' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                Catalog
              </a>
              <a 
                href="/about" 
                onClick={(e) => { e.preventDefault(); navigate('/about'); }}
                className={`font-['Manrope'] text-sm font-medium tracking-wide uppercase transition-all duration-300 ${activeRoute.startsWith('/about') ? 'text-zinc-900 border-b-2 border-zinc-900 pb-1' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                About
              </a>
              <a 
                href="/#contacto" 
                onClick={(e) => { e.preventDefault(); navigate('/#contacto'); }}
                className="font-['Manrope'] text-sm font-medium tracking-wide uppercase text-zinc-500 hover:text-zinc-900 transition-all duration-300"
              >
                Contact
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-6">
            {showSearch && (
              <button
                type="button"
                onClick={() => navigate("/catalog")}
                className="p-2 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-all duration-300 active:scale-95 hidden lg:block"
                aria-label="Buscar"
              >
                <SearchIcon className="size-6" />
              </button>
            )}

            <div className="flex items-center gap-4">
              {showCart && (
                <button
                  type="button"
                  onClick={() => navigate("/cart")}
                  className="relative p-2 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-all duration-300 active:scale-95"
                  aria-label="Carrito"
                >
                  <CartIcon className="size-6" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-black text-white text-[10px] font-bold">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}

              {showAccount && (
                <button
                  type="button"
                  onClick={handleAccountClick}
                  className="hidden lg:block bg-primary text-on-primary px-6 py-2.5 rounded-lg font-['Manrope'] text-sm font-medium tracking-wide uppercase hover:opacity-90 transition-all active:scale-95"
                >
                  {user ? 'Profile' : 'Sign In'}
                </button>
              )}

              <button
                type="button"
                onClick={() => setMobileMenuOpen((current) => !current)}
                className="lg:hidden p-2 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-all duration-300 active:scale-95"
              >
                {mobileMenuOpen ? <CloseIcon className="size-6" /> : <MenuIcon className="size-6" />}
              </button>
            </div>
          </div>
        </div>


          <div className="lg:hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1f2937] dark:text-[#e7ddd3]">
              <button type="button" onClick={() => handleMobileNavigate("/catalog")} className="text-left">
                Catalogo
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((current) => !current)}
                className="inline-flex items-center gap-2 text-[color:var(--color-primary,#0099e5)]"
              >
                {mobileMenuOpen ? "Cerrar menu" : "Explorar menu"}
                <ChevronDown className={`size-3 transition-transform ${mobileMenuOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {mobileMenuOpen ? (
              <div className="flex flex-col h-full bg-white dark:bg-[#120c08]">
                {/* Tabs Selector */}
                <div className="flex border-b border-[#e4e9ef] dark:border-[#3d2f21]">
                  <button
                    onClick={() => setActiveMobileTab("menu")}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${
                      activeMobileTab === "menu"
                        ? "border-b-2 border-[color:var(--color-primary,#0099e5)] text-[color:var(--color-primary,#0099e5)]"
                        : "text-[#8a7560] hover:text-[#1f2937] dark:hover:text-[#f8f7f5]"
                    }`}
                  >
                    Explorar
                  </button>
                  <button
                    onClick={() => setActiveMobileTab("categories")}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${
                      activeMobileTab === "categories"
                        ? "border-b-2 border-[color:var(--color-primary,#0099e5)] text-[color:var(--color-primary,#0099e5)]"
                        : "text-[#8a7560] hover:text-[#1f2937] dark:hover:text-[#f8f7f5]"
                    }`}
                  >
                    Categorias
                  </button>
                  <button
                    onClick={() => setActiveMobileTab("brands")}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${
                      activeMobileTab === "brands"
                        ? "border-b-2 border-[color:var(--color-primary,#0099e5)] text-[color:var(--color-primary,#0099e5)]"
                        : "text-[#8a7560] hover:text-[#1f2937] dark:hover:text-[#f8f7f5]"
                    }`}
                  >
                    Marcas
                  </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto px-4 py-6 custom-scrollbar">
                  {activeMobileTab === "menu" && (
                    <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <p className="mb-4 text-[11px] font-black uppercase tracking-[0.14em] text-[#8a7560]">Accesos directos</p>
                      <div className="grid grid-cols-1 gap-2">
                        {mobilePrimaryLinks.map((item) => (
                          <button
                            key={`mobile-p-${item.label}`}
                            type="button"
                            onClick={() => (item.external ? window.open(item.href, '_blank') : handleMobileNavigate(item.href))}
                            className="flex items-center justify-between rounded-xl border border-[#dbe2ea] bg-slate-50/50 px-5 py-4 text-left text-sm font-bold text-[#1f2937] transition-all active:scale-95 dark:border-[#3d2f21] dark:bg-[#1a130c] dark:text-[#e7ddd3]"
                          >
                            {item.label}
                            <svg className="size-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {activeMobileTab === "categories" && (
                    <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8a7560]">Catalogo por rubro</p>
                        <button onClick={() => handleMobileNavigate("/catalog")} className="text-[10px] font-bold text-[color:var(--color-primary,#0099e5)] underline underline-offset-2">Ver todo</button>
                      </div>
                      
                      {categoryTree.length ? (
                        <div className="grid grid-cols-2 gap-3">
                          {categoryTree.map((parent) => (
                            <div key={`mobile-cat-grid-${parent.id}`} className="group flex flex-col">
                              <button
                                type="button"
                                onClick={() => handleMobileNavigate(`/catalog?category=${encodeURIComponent(parent.id)}`)}
                                className="flex flex-col items-start rounded-2xl border border-[#e6ecf2] bg-[#f8fafc] p-4 text-left transition-all active:bg-[#e4e9ef] dark:border-[#2c1f16] dark:bg-[#1a130c]"
                              >
                                <span className="text-[13px] font-black leading-tight text-[color:var(--color-primary,#0099e5)]">{parent.name}</span>
                                <span className="mt-1 text-[10px] font-semibold text-[#8a7560]">{parent.children.length} subrubros</span>
                              </button>
                              
                              {parent.children.length > 0 && (
                                <button
                                  onClick={() => setExpandedMobileCategories(prev => ({ ...prev, [parent.id]: !prev[parent.id] }))}
                                  className="mt-1 flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-[#64748b] hover:text-[#1f2937] dark:text-[#a59280]"
                                >
                                  {expandedMobileCategories[parent.id] ? "Ocultar detalles" : "Ver subrubros"}
                                  <ChevronDown className={`size-2.5 transition-transform ${expandedMobileCategories[parent.id] ? "rotate-180" : ""}`} />
                                </button>
                              )}

                              {expandedMobileCategories[parent.id] && parent.children.length > 0 && (
                                <div className="mt-2 flex flex-col gap-1 border-l-2 border-[#e6ecf2] pl-3 animate-in fade-in slide-in-from-top-2 dark:border-[#2c1f16]">
                                  {parent.children.map((child) => (
                                    <button
                                      key={`mob-sub-${child.id}`}
                                      onClick={() => handleMobileNavigate(`/catalog?category=${encodeURIComponent(child.id)}`)}
                                      className="py-1.5 text-left text-[12px] font-medium text-[#4b5563] active:text-[color:var(--color-primary,#0099e5)] dark:text-[#cdbca9]"
                                    >
                                      {child.name}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border-2 border-dashed border-[#e6ecf2] p-8 text-center text-[#8a7560] dark:border-[#2c1f16]">
                          Cargando categorias...
                        </div>
                      )}
                    </section>
                  )}

                  {activeMobileTab === "brands" && (
                    <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <p className="mb-4 text-[11px] font-black uppercase tracking-[0.14em] text-[#8a7560]">Nuestras marcas</p>
                      {brandLinks.length ? (
                        <div className="grid grid-cols-2 gap-2">
                          {brandLinks.map((item) => (
                            <button
                              key={`mobile-br-${item.label}`}
                              type="button"
                              onClick={() => handleMobileNavigate(item.href)}
                              className="rounded-xl border border-[#dbe2ea] bg-white px-4 py-3 text-left text-xs font-bold text-[#1f2937] shadow-sm transition-all active:scale-95 dark:border-[#3d2f21] dark:bg-[#1a130c] dark:text-[#e7ddd3]"
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="py-10 text-center text-sm text-[#8a7560]">No hay marcas disponibles.</p>
                      )}
                    </section>
                  )}
                </div>

                {/* Footer simple for mobile menu */}
                <div className="mt-auto border-t border-[#e4e9ef] bg-[#f8fafc] p-6 dark:border-[#3d2f21] dark:bg-[#1a130c]/50">
                   <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-[#8a7560]">¿Necesitas ayuda?</p>
                        <p className="text-xs font-bold text-[#1f2937] dark:text-[#e7ddd3]">Escribenos por WhatsApp</p>
                      </div>
                      {whatsappHref && (
                        <a 
                          href={whatsappHref} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex size-10 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg shadow-green-500/20 active:scale-90 transition-transform"
                        >
                          <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-2.335 0-4.241 1.906-4.241 4.241 0 .741.194 1.436.53 2.031l-.564 2.057 2.106-.552c.571.31 1.221.495 1.914.495 2.335 0 4.241-1.906 4.241-4.241 0-2.335-1.906-4.241-4.241-4.241zm3.11 5.617c-.126.126-.541.313-.746.331-.205.018-.466.014-.766-.082-.3-.096-.65-.213-1.071-.397-.421-.184-.791-.453-1.109-.771-.318-.318-.587-.688-.771-1.109-.184-.421-.301-.771-.397-1.071-.096-.3-.1-.561-.082-.766.018-.205.205-.62.331-.746.126-.126.21-.157.283-.157.073 0 .147.009.215.013.068.004.142.008.201.12.059.112.184.449.201.487.017.038.026.084.004.131-.022.047-.047.073-.094.131l-.141.164c-.047.054-.097.113-.041.21.056.097.248.409.533.662.285.253.525.333.622.378.097.045.153.037.21-.028.057-.065.244-.285.309-.383.065-.098.131-.082.22-.047.089.035.565.267.663.316.098.049.164.073.188.113.024.04.024.234-.102.36zM12 2C6.477 2 2 6.477 2 12c0 1.891.526 3.658 1.438 5.161l-1.438 5.243 5.362-1.407C8.749 21.65 10.309 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.558 0-3.007-.432-4.241-1.178l-3.041.798.814-2.964C4.782 15.656 4 14.075 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/></svg>
                        </a>
                      )}
                   </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>
  );
}
