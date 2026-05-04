import React from "react";
import { useTenant } from "../../context/TenantContext";
import { navigate } from "../../utils/navigation";

export default function Footer() {
  const { tenant, settings } = useTenant();
  const brandName = (settings?.branding?.name || tenant?.name || "MODERNIST").toUpperCase();

  return (
    <footer className="bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 w-full py-16 mt-20">
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
        <div 
          className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tighter cursor-pointer font-['Manrope']"
          onClick={() => navigate('/')}
        >
          {brandName}
        </div>

        <div className="flex items-center gap-10">
          <a className="font-['Manrope'] text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-900 dark:text-zinc-50 underline underline-offset-8 opacity-100 hover:opacity-80 transition-opacity" href="/catalog">Catalog</a>
          <a className="font-['Manrope'] text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors" href="/about">About</a>
          <a className="font-['Manrope'] text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors" href="/#contacto">Contact</a>
        </div>

        <p className="font-['Manrope'] text-[10px] font-medium tracking-[0.15em] uppercase text-zinc-400 dark:text-zinc-600 text-center md:text-right">
          © {new Date().getFullYear()} {brandName}. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
}
