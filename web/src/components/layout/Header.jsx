import React, { useEffect, useMemo, useState } from "react";
import { useTenant } from "../../context/TenantContext";
import { useStore } from "../../context/StoreContext";
import { useAuth } from "../../context/AuthContext";
import { isExternalPath, navigate, normalizeInternalPath } from "../../utils/navigation";
import { getApiBase, getTenantHeaders } from "../../utils/api";

const DEFAULT_PLACEHOLDER = "Buscá tu producto";
const HIDDEN_TOPICS = new Set(["buscador de tapas", "donde comprar", "mis proyectos"]);

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

function MenuAnchor({ href, label, active = false, external = false, className = "" }) {
  const finalClass = `inline-flex items-center gap-1 border-b-2 text-[13px] font-semibold uppercase tracking-[0.06em] transition-colors ${
    active
      ? "border-[color:var(--color-primary,#0099e5)] text-[color:var(--color-primary,#0099e5)]"
      : "border-transparent text-[#1f2937] hover:text-[color:var(--color-primary,#0099e5)]"
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

  const resolvedBrand = brandName || settings?.branding?.name || tenant?.name || "El Teflon";
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
                .map((item) => ({
                  id: item.id,
                  name: item.name,
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

  const whatsappRaw = settings?.branding?.footer?.socials?.whatsapp || settings?.commerce?.whatsapp_number || "";
  const whatsappCleaned = String(whatsappRaw).replace(/\D/g, "");
  const whatsappHref = whatsappCleaned ? `https://wa.me/${whatsappCleaned}` : null;

  const categoryTree = useMemo(() => {
    if (!Array.isArray(catalogCategories) || !catalogCategories.length) return [];

    const byId = new Map();
    catalogCategories.forEach((item) => {
      byId.set(item.id, {
        id: item.id,
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

  const categoryLinks = useMemo(() => {
    const links = [];
    categoryTree.forEach((parent) => {
      links.push({
        label: parent.name,
        href: `/catalog?category=${encodeURIComponent(parent.id)}`,
      });
      parent.children.forEach((child) => {
        links.push({
          label: `${parent.name} / ${child.name}`,
          href: `/catalog?category=${encodeURIComponent(child.id)}`,
        });
      });
    });
    return links;
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

  const mobileQuickLinks = useMemo(() => {
    const list = [
      { label: "Productos", href: "/catalog", external: false },
      ...categoryLinks.slice(0, 4),
      ...brandLinks.slice(0, 4),
      ...staticLinks,
    ];
    const seen = new Set();
    return list.filter((item) => {
      const key = `${item.label}-${item.href}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [categoryLinks, brandLinks, staticLinks]);

  return (
    <header className="sticky top-0 z-50 w-full border-y border-[#dbe2ea] bg-white">
      <div className={`mx-auto ${containerClassName}`}>
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:flex-nowrap md:gap-8 md:px-10 md:py-4">
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
                <h2 className={`text-2xl font-bold leading-none tracking-tight sm:text-3xl ${brandUppercase ? "uppercase" : ""}`}>
                  {resolvedBrand}
                </h2>
              </>
            )}
          </button>

          {showSearch ? (
            <label className="relative order-3 w-full md:order-none md:flex-1 md:max-w-[520px]">
              <input
                className="h-11 w-full rounded-none border border-[#e4e9ef] bg-[#f7f8fa] pl-4 pr-12 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[color:var(--color-primary,#0099e5)] focus:outline-none"
                placeholder={searchPlaceholder}
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={handleSearchKey}
              />
              <button
                type="button"
                onClick={() => navigate("/catalog")}
                className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-[color:var(--color-primary,#0099e5)]"
                aria-label="Buscar"
              >
                <SearchIcon />
              </button>
            </label>
          ) : (
            <div className="hidden md:block md:flex-1" />
          )}

          <div className="ml-auto hidden items-center gap-7 text-[10px] font-semibold uppercase text-[#4a4a4a] lg:flex">
            {showCart ? (
              <button
                type="button"
                onClick={() => navigate("/cart")}
                className="relative inline-flex flex-col items-center gap-0.5 hover:text-[color:var(--color-primary,#0099e5)]"
                title="Carrito"
              >
                <CartIcon className="size-5 text-[color:var(--color-primary,#0099e5)]" />
                <span>Carrito</span>
                {cartCount > 0 ? (
                  <span className="absolute -right-3 -top-2 min-w-[16px] rounded-full bg-[#ef4444] px-1.5 text-center text-[10px] font-bold leading-[16px] text-white">
                    {cartCount}
                  </span>
                ) : null}
              </button>
            ) : null}

            {showAccount ? (
              <button
                type="button"
                onClick={handleAccountClick}
                className="inline-flex flex-col items-center gap-0.5 hover:text-[color:var(--color-primary,#0099e5)]"
                title={accountLabel}
              >
                <UserIcon className="size-5 text-[color:var(--color-primary,#0099e5)]" />
                <span>Mi cuenta</span>
              </button>
            ) : null}
          </div>

          <div className="ml-auto flex items-center gap-2 lg:hidden">
            {showCart ? (
              <button
                type="button"
                onClick={() => navigate("/cart")}
                className="relative flex h-9 w-9 items-center justify-center rounded-md border border-[#e4e9ef] text-[color:var(--color-primary,#0099e5)]"
                aria-label="Carrito"
              >
                <CartIcon />
                {cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 min-w-[14px] rounded-full bg-[#ef4444] px-1 text-center text-[9px] font-bold leading-[14px] text-white">
                    {cartCount}
                  </span>
                ) : null}
              </button>
            ) : null}
            {showAccount ? (
              <button
                type="button"
                onClick={handleAccountClick}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[#e4e9ef] text-[color:var(--color-primary,#0099e5)]"
                aria-label="Cuenta"
              >
                <UserIcon />
              </button>
            ) : null}
          </div>
        </div>

        <div className="border-t border-[#e4e9ef]">
          <nav className="hidden h-12 items-center justify-center gap-9 px-4 md:flex">
            <div className="group relative h-full">
              <button
                type="button"
                className={`inline-flex h-full items-center gap-1 border-b-2 text-[13px] font-semibold uppercase tracking-[0.06em] transition-colors ${
                  productsActive
                    ? "border-[color:var(--color-primary,#0099e5)] text-[color:var(--color-primary,#0099e5)]"
                    : "border-transparent text-[#1f2937] hover:text-[color:var(--color-primary,#0099e5)]"
                }`}
              >
                Productos
                <ChevronDown className="size-3" />
              </button>

              <div className="invisible absolute left-1/2 top-full z-50 mt-2 w-[min(95vw,1080px)] -translate-x-1/2 rounded-md border border-[#e4e9ef] bg-white p-6 opacity-0 shadow-xl transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <div className="max-h-[68vh] overflow-y-auto pr-1">
                  {categoryTree.length ? (
                    <div className="grid gap-8 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
                      {categoryTree.map((parent) => (
                        <div key={`parent-${parent.id}`}>
                          <a
                            href={`/catalog?category=${encodeURIComponent(parent.id)}`}
                            onClick={(event) => {
                              event.preventDefault();
                              navigate(`/catalog?category=${encodeURIComponent(parent.id)}`);
                            }}
                            className="block text-[12px] font-black uppercase tracking-[0.08em] text-[color:var(--color-primary,#0099e5)] hover:opacity-80"
                          >
                            {parent.name}
                          </a>
                          <div className="mt-2 space-y-1.5">
                            {parent.children.length ? (
                              parent.children.map((child) => (
                                <a
                                  key={`child-${child.id}`}
                                  href={`/catalog?category=${encodeURIComponent(child.id)}`}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    navigate(`/catalog?category=${encodeURIComponent(child.id)}`);
                                  }}
                                  className="block text-[15px] leading-tight text-[#4b5563] hover:text-[color:var(--color-primary,#0099e5)]"
                                >
                                  {child.name}
                                </a>
                              ))
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#6b7280]">No hay categorias disponibles.</p>
                  )}

                  {brandLinks.length ? (
                    <div className="mt-6 border-t border-[#eef2f7] pt-4">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280]">Marcas</p>
                      <div className="flex flex-wrap gap-2">
                        {brandLinks.map((item) => (
                          <a
                            key={`brand-${item.href}`}
                            href={item.href}
                            onClick={(event) => {
                              event.preventDefault();
                              navigate(item.href);
                            }}
                            className="rounded-full border border-[#dbe2ea] px-2.5 py-1 text-[12px] text-[#1f2937] hover:border-[color:var(--color-primary,#0099e5)] hover:text-[color:var(--color-primary,#0099e5)]"
                          >
                            {item.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {staticLinks.map((item) => {
              const normalizedTarget = item.external ? item.href : normalizeRoute(item.href);
              const isActive = !item.external && normalizeRoute(activeRoute) === normalizedTarget;
              return (
                <MenuAnchor
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  label={item.label}
                  active={isActive}
                  external={item.external}
                  className="h-full"
                />
              );
            })}

            {extraLinks.map((item) => {
              const target = item.href || "/";
              const isExternalTarget = isExternalPath(target);
              const normalizedTarget = isExternalTarget ? target : normalizeRoute(target);
              const isActive = !isExternalTarget && normalizeRoute(activeRoute) === normalizedTarget;
              return (
                <MenuAnchor
                  key={`${item.label}-${target}`}
                  href={target}
                  label={item.label}
                  active={isActive}
                  external={isExternalTarget}
                  className="h-full"
                />
              );
            })}
          </nav>

          <div className="overflow-x-auto md:hidden">
            <nav className="flex min-w-max items-center gap-5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#1f2937]">
              {mobileQuickLinks.map((item) => {
                const external = isExternalPath(item.href);
                const normalizedTarget = external ? item.href : normalizeRoute(item.href);
                const isActive = !external && normalizeRoute(activeRoute) === normalizedTarget;
                return external ? (
                  <a
                    key={`mobile-${item.label}-${item.href}`}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={isActive ? "text-[color:var(--color-primary,#0099e5)]" : "text-[#1f2937]"}
                  >
                    {item.label}
                  </a>
                ) : (
                  <a
                    key={`mobile-${item.label}-${item.href}`}
                    href={item.href}
                    onClick={(event) => {
                      event.preventDefault();
                      navigate(item.href);
                    }}
                    className={isActive ? "text-[color:var(--color-primary,#0099e5)]" : "text-[#1f2937]"}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
