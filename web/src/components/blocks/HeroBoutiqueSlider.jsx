import React, { useEffect, useState } from "react";
import { navigate } from "../../utils/navigation";

export default function HeroBoutiqueSlider({ slides = [], styles = {}, editor = null }) {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (!slides.length || slides.length < 2 || editor?.enabled) return;
        const interval = window.setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => window.clearInterval(interval);
    }, [slides.length, editor?.enabled]);

    const slide = slides[activeIndex] || slides[0] || {};
    const { 
        label, 
        title = "", 
        subtitle, 
        description, 
        image, 
        primaryButtonLabel, 
        primaryButtonLink, 
        secondaryButtonLabel, 
        secondaryButtonLink 
    } = slide;

    const {
        titleColor = "#ffffff",
        textColor = "#f4f4f5",
        labelBgColor = "#000000",
        labelTextColor = "#ffffff",
        primaryButtonBgColor = "#000000",
        primaryButtonTextColor = "#ffffff",
        secondaryButtonBgColor = "transparent",
        secondaryButtonTextColor = "#ffffff",
        secondaryButtonBorderColor = "rgba(255, 255, 255, 0.3)",
        accentBgColor = "#ffffff",
        accentTextColor = "#000000",
        overlayColor = "#000000",
    } = styles;

    const goToSlide = (index) => {
        if (!slides.length) return;
        const safeIndex = ((index % slides.length) + slides.length) % slides.length;
        setActiveIndex(safeIndex);
    };

    const toRgba = (color, alpha) => {
        if (typeof color !== "string") return `rgba(0, 0, 0, ${alpha})`;
        const value = color.trim();
        const hexMatch = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
        if (hexMatch) {
            const raw = hexMatch[1];
            const hex = raw.length === 3 ? raw.split("").map((ch) => `${ch}${ch}`).join("") : raw;
            const r = Number.parseInt(hex.slice(0, 2), 16);
            const g = Number.parseInt(hex.slice(2, 4), 16);
            const b = Number.parseInt(hex.slice(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return color;
    };

    const titleLines = String(title || "").split('\n');

    return (
        <section className="relative h-[80vh] min-h-[600px] md:h-[870px] w-full overflow-hidden flex items-center bg-black">
            {/* Background Layers */}
            {slides.map((s, index) => (
                <div 
                    key={`bg-${index}`} 
                    className={`absolute inset-0 transition-opacity duration-1000 ${index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
                >
                    <img 
                        src={s.image} 
                        alt={s.title || "Slider Image"} 
                        className="w-full h-full object-cover"
                    />
                    <div 
                        className="absolute inset-0"
                        style={{ background: `linear-gradient(to right, ${toRgba(overlayColor, 0.5)}, transparent, transparent)` }}
                    ></div>
                </div>
            ))}

            {/* Content Container */}
            <div className="relative z-20 max-w-7xl mx-auto px-8 w-full">
                <div className="max-w-2xl space-y-6 md:space-y-8 animate-in fade-in slide-in-from-left-8 duration-700" key={`content-${activeIndex}`}>
                    {/* Badge */}
                    {label ? (
                        <div className="inline-flex items-center px-4 py-2 rounded-lg" style={{ backgroundColor: labelBgColor }}>
                            <span className="text-[12px] font-bold tracking-[0.1em] uppercase" style={{ color: labelTextColor }}>
                                {label}
                            </span>
                        </div>
                    ) : null}

                    {/* Headline */}
                    {title ? (
                        <h1 
                            className="text-5xl md:text-[72px] font-extrabold leading-[1.1] tracking-tighter drop-shadow-sm"
                            style={{ color: titleColor }}
                        >
                            {titleLines.map((line, i) => (
                                <React.Fragment key={`line-${i}`}>
                                    {line}
                                    {i === titleLines.length - 1 && subtitle ? (
                                        <span className="flex items-baseline gap-4 mt-2">
                                            <span 
                                                className="text-2xl md:text-[32px] font-semibold px-4 py-1 rounded-full align-middle inline-block whitespace-nowrap"
                                                style={{ backgroundColor: accentBgColor, color: accentTextColor }}
                                            >
                                                {subtitle}
                                            </span>
                                        </span>
                                    ) : (i < titleLines.length - 1 ? <br/> : null)}
                                </React.Fragment>
                            ))}
                        </h1>
                    ) : null}

                    {/* Subheadline */}
                    {description ? (
                        <p className="text-lg md:text-[18px] max-w-md leading-relaxed opacity-90" style={{ color: textColor }}>
                            {description}
                        </p>
                    ) : null}

                    {/* CTAs */}
                    <div className="flex flex-wrap gap-4 pt-4">
                        {primaryButtonLabel ? (
                            <button 
                                onClick={() => navigate(primaryButtonLink || '/catalog')}
                                className="px-8 py-4 rounded font-bold tracking-widest uppercase transition-all duration-200 active:scale-95 hover:brightness-110"
                                style={{ backgroundColor: primaryButtonBgColor, color: primaryButtonTextColor }}
                            >
                                {primaryButtonLabel}
                            </button>
                        ) : null}
                        {secondaryButtonLabel ? (
                            <button 
                                onClick={() => navigate(secondaryButtonLink || '/catalog')}
                                className="backdrop-blur-xl border px-8 py-4 rounded font-bold tracking-widest uppercase transition-all duration-200 active:scale-95 hover:bg-white hover:text-black"
                                style={{ 
                                    backgroundColor: secondaryButtonBgColor, 
                                    color: secondaryButtonTextColor, 
                                    borderColor: secondaryButtonBorderColor 
                                }}
                            >
                                {secondaryButtonLabel}
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Navigation Controls */}
            {slides.length > 1 ? (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-12 z-30">
                    <button 
                        onClick={() => goToSlide(activeIndex - 1)}
                        className="w-12 h-12 rounded-full border border-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>

                    {/* Progress Indicators */}
                    <div className="flex gap-3">
                        {slides.map((_, idx) => (
                            <div 
                                key={`ind-${idx}`} 
                                className="w-16 h-0.5 bg-white/30 relative overflow-hidden cursor-pointer"
                                onClick={() => goToSlide(idx)}
                            >
                                <div 
                                    className="absolute inset-y-0 left-0 transition-all ease-linear"
                                    style={{ 
                                        width: idx === activeIndex ? "100%" : (idx < activeIndex ? "100%" : "0%"),
                                        transitionDuration: idx === activeIndex ? "5000ms" : "300ms",
                                        backgroundColor: idx === activeIndex ? accentBgColor : "rgba(255,255,255,0.3)"
                                    }}
                                ></div>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={() => goToSlide(activeIndex + 1)}
                        className="w-12 h-12 rounded-full border border-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                </div>
            ) : null}
        </section>
    );
}
