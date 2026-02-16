import React from "react";
import { navigate } from "../../utils/navigation";

export default function HeroSlider({
  title = "Soluciones profesionales en sanitarios y grifería",
  subtitle = "Equipamiento de calidad para tu hogar y proyectos arquitectónicos. Experiencia en Mar del Plata con entrega en el día.",
  tag = "Calidad premium",
  image = "https://lh3.googleusercontent.com/aida-public/AB6AXuAsE3UyUs8hwy2ulbda_AkoJgM8Dt4ADPYbA-N4JuZyG7V0vY4q6cc-Tt89t4P27xMxKmcjbMRSj4N02izzDB8sxKnPwkQT6oyUKxlUSIDxrIG34D9wU86tDWjBT-0y3V2Z_OLjdxCgq5XnSZfNN_gaFHdyDgF3Yqu1LH2AdPc8uRelPjbm_EzN2gggEAeP5ZoaAymWqHgYvaOW7zs6nmpnzlMDbxoDHw2MGpOOxIcYt6nSxjDnngClgvhP9eojjcdPz_JpCIAFFZA",
  primaryButton = { label: "Comprar ahora", link: "/catalog" },
  secondaryButton = { label: "Nosotros", link: "/about" },
  styles = {}
}) {
  const {
    titleSize = "text-5xl lg:text-6xl",
    titleColor = "text-white",
    titleFont = "font-black",
    subtitleSize = "text-lg",
    subtitleColor = "text-white/80",
    alignment = "text-left",
    overlayOpacity = "0.85",
    tagColor = "text-primary",
    tagBg = "bg-primary/20",
  } = styles;

  const getAlignmentClass = (align) => {
    if (align === 'center') return 'items-center text-center';
    if (align === 'right') return 'items-end text-right';
    return 'items-start text-left';
  };

  return (
    <section className="px-10 py-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="relative overflow-hidden rounded-xl bg-background-dark">
          <div
            className={`flex min-h-[520px] flex-col justify-center gap-6 bg-cover bg-center bg-no-repeat px-16 py-12 ${getAlignmentClass(alignment)}`}
            style={{
              backgroundImage:
                `linear-gradient(90deg, rgba(0, 0, 0, ${overlayOpacity}) 0%, rgba(0, 0, 0, 0.2) 100%), url("${image}")`,
            }}
            role="img"
            aria-label={title}
          >
            <div className={`max-w-2xl space-y-4 flex flex-col ${getAlignmentClass(alignment)}`}>
              <span className={`inline-block rounded-full ${tagBg} px-4 py-1 text-sm font-bold uppercase tracking-wider ${tagColor} border border-primary/30`}>
                {tag}
              </span>
              <h1 className={`${titleSize} ${titleFont} leading-tight tracking-tight ${titleColor}`}>
                {title}
              </h1>
              <p className={`${subtitleSize} font-normal leading-relaxed ${subtitleColor}`}>
                {subtitle}
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              {primaryButton?.label && (
                <button
                  type="button"
                  onClick={() => navigate(primaryButton.link || "/catalog")}
                  className="flex items-center justify-center rounded-lg h-12 px-8 bg-primary text-white text-base font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  {primaryButton.label}
                </button>
              )}
              {secondaryButton?.label && (
                <button
                  type="button"
                  onClick={() => navigate(secondaryButton.link || "/about")}
                  className="flex items-center justify-center rounded-lg h-12 px-8 bg-white/10 text-white text-base font-bold backdrop-blur-md hover:bg-white/20 transition-all border border-white/20"
                >
                  {secondaryButton.label}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
