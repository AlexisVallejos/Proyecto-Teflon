import React from "react";
import { useTenant } from "../../context/TenantContext";
import { useStore } from "../../context/StoreContext";
import { useTheme } from "../../context/ThemeContext";
import { navigate } from "../../utils/navigation";

const DEFAULT_PLACEHOLDER = "Search products...";

const BrandMark = ({ className = "size-8" }) => (
  <svg
    fill="none"
    viewBox="0 0 48 48"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M13.8261 17.4264C16.7203 18.1174 20.2244 18.5217 24 18.5217C27.7756 18.5217 31.2797 18.1174 34.1739 17.4264C36.9144 16.7722 39.9967 15.2331 41.3563 14.1648L24.8486 40.6391C24.4571 41.267 23.5429 41.267 23.1514 40.6391L6.64374 14.1648C8.00331 15.2331 11.0856 16.7722 13.8261 17.4264Z"
      fill="currentColor"
    />
    <path
      clipRule="evenodd"
      fillRule="evenodd"
      d="M39.998 12.236C39.9944 12.2537 39.9875 12.2845 39.9748 12.3294C39.9436 12.4399 39.8949 12.5741 39.8346 12.7175C39.8168 12.7597 39.7989 12.8007 39.7813 12.8398C38.5103 13.7113 35.9788 14.9393 33.7095 15.4811C30.9875 16.131 27.6413 16.5217 24 16.5217C20.3587 16.5217 17.0125 16.131 14.2905 15.4811C12.0012 14.9346 9.44505 13.6897 8.18538 12.8168C8.17384 12.7925 8.16216 12.767 8.15052 12.7408C8.09919 12.6249 8.05721 12.5114 8.02977 12.411C8.00356 12.3152 8.00039 12.2667 8.00004 12.2612C8.00004 12.261 8 12.2607 8.00004 12.2612C8.00004 12.2359 8.0104 11.9233 8.68485 11.3686C9.34546 10.8254 10.4222 10.2469 11.9291 9.72276C14.9242 8.68098 19.1919 8 24 8C28.8081 8 33.0758 8.68098 36.0709 9.72276C37.5778 10.2469 38.6545 10.8254 39.3151 11.3686C39.9006 11.8501 39.9857 12.1489 39.998 12.236ZM4.95178 15.2312L21.4543 41.6973C22.6288 43.5809 25.3712 43.5809 26.5457 41.6973L43.0534 15.223C43.0709 15.1948 43.0878 15.1662 43.104 15.1371L41.3563 14.1648C43.104 15.1371 43.1038 15.1374 43.104 15.1371L43.1051 15.135L43.1065 15.1325L43.1101 15.1261L43.1199 15.1082C43.1276 15.094 43.1377 15.0754 43.1497 15.0527C43.1738 15.0075 43.2062 14.9455 43.244 14.8701C43.319 14.7208 43.4196 14.511 43.5217 14.2683C43.6901 13.8679 44 13.0689 44 12.2609C44 10.5573 43.003 9.22254 41.8558 8.2791C40.6947 7.32427 39.1354 6.55361 37.385 5.94477C33.8654 4.72057 29.133 4 24 4C18.867 4 14.1346 4.72057 10.615 5.94478C8.86463 6.55361 7.30529 7.32428 6.14419 8.27911C4.99695 9.22255 3.99999 10.5573 3.99999 12.2609C3.99999 13.1275 4.29264 13.9078 4.49321 14.3607C4.60375 14.6102 4.71348 14.8196 4.79687 14.9689C4.83898 15.0444 4.87547 15.1065 4.9035 15.1529C4.91754 15.1762 4.92954 15.1957 4.93916 15.2111L4.94662 15.223L4.95178 15.2312ZM35.9868 18.996L24 38.22L12.0131 18.996C12.4661 19.1391 12.9179 19.2658 13.3617 19.3718C16.4281 20.1039 20.0901 20.5217 24 20.5217C27.9099 20.5217 31.5719 20.1039 34.6383 19.3718C35.082 19.2658 35.5339 19.1391 35.9868 18.996Z"
      fill="currentColor"
    />
  </svg>
);

export default function Header({
  navLinks = [],
  searchPlaceholder = DEFAULT_PLACEHOLDER,
  brandName,
  brandUppercase = true,
  showSearch = true,
  showCart = true,
  showAccount = true,
  containerClassName = "max-w-[1280px]",
}) {
  const { tenant, settings } = useTenant();
  const { search, setSearch, cartCount } = useStore();
  const { isDarkMode, toggleTheme } = useTheme();

  const resolvedBrand =
    brandName || settings?.branding?.name || tenant?.name || "El Teflon";
  const logoUrl = settings?.branding?.logo_url;

  const links = navLinks.map((link) =>
    typeof link === "string" ? { label: link, href: "/catalog" } : link
  );

  const handleSearchKey = (event) => {
    if (event.key === "Enter") {
      navigate("/catalog");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-solid border-[#f5f2f0] dark:border-[#3d2e21] bg-white/90 dark:bg-[#181411]/90 backdrop-blur-md">
      <div
        className={`mx-auto flex items-center justify-between px-4 md:px-10 py-3 ${containerClassName}`}
      >
        <div className="flex items-center gap-6 md:gap-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3 md:gap-4 text-primary"
          >
            {logoUrl ? (
              <img src={logoUrl} alt={resolvedBrand} className="size-8 object-contain" />
            ) : (
              <BrandMark className="size-8" />
            )}
            <h2 className={`text-xl font-black ${brandUppercase ? "uppercase" : ""} tracking-tight`}>
              {resolvedBrand}
            </h2>
          </button>

          {links.length ? (
            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href || "/"}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(link.href || "/");
                  }}
                  className="hover:text-primary transition-colors dark:text-white"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          ) : null}
        </div>

        <div className="flex flex-1 items-center justify-end gap-3 md:gap-6">
          {showSearch ? (
            <label className="relative hidden sm:flex w-full max-w-xs h-10">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7560]">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <input
                className="w-full rounded-lg border-none bg-[#f5f2f0] dark:bg-[#3d2e21] pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary dark:text-white"
                placeholder={searchPlaceholder}
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={handleSearchKey}
              />
            </label>
          ) : null}

          <div className="flex gap-2 md:gap-3">
            {showCart ? (
              <button
                type="button"
                onClick={() => navigate("/cart")}
                className="relative flex items-center justify-center rounded-lg h-10 w-10 bg-[#f5f2f0] dark:bg-[#3d2e21] hover:bg-primary/20 transition-colors"
                aria-label="Carrito"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dark:text-white"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                {cartCount > 0 ? (
                  <span className="absolute -top-1 -right-1 rounded-full bg-primary text-white text-[10px] font-bold px-1.5 min-w-[18px] text-center">
                    {cartCount}
                  </span>
                ) : null}
              </button>
            ) : null}

            {showAccount ? (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="flex items-center justify-center rounded-lg h-10 w-10 bg-[#f5f2f0] dark:bg-[#3d2e21] hover:bg-primary/20 transition-colors"
                aria-label="Account"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dark:text-white"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </button>
            ) : null}

            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-center rounded-lg h-10 px-3 bg-[#f5f2f0] dark:bg-[#3d2e21] hover:bg-primary/20 transition-colors"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

