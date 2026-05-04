import React from 'react';

export default function FeaturesBento({ 
    title = "Artisan Craftsmanship", 
    description = "Sourced from the world's finest sustainable mills.",
    mainImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuDnGd8JVdse1xXxynxTBBvF1KRTMd6s7gBMsfTlrYT2H1pwndJ25pjLbMS1PsBor0LVftmhxco9ugA5tc9eIM0mtuT8fOBA0-lwodyaYfflNff-bY9w3D7m7xxueq1Gds0HG1zaKKbvYjoXP7nNGz8k0n5lYoOWHi5ZeIvlRw32aBlC2QTYUkgdPodc4nsvvCFQ9b3F1YXV-Fmh6ulg7NdIbP82DcuBG47Olve9w648Wb0IaJ1yYBNTRkX6LOcNx-yIBKwHAfU60BUt",
    sideTitle = "Lifetime Guarantee",
    sideDescription = "We believe in pieces that last a lifetime, not just a season. Every Modernist item is backed by our heritage quality promise.",
    sideCtaLabel = "LEARN MORE",
    sideCtaLink = "#",
    styles = {}
}) {
    const { 
        backgroundColor = "#ffffff",
        titleColor = "#18181b",
        textColor = "#71717a",
        accentColor = "#000000"
    } = styles;

    return (
        <section className="py-20 max-w-7xl mx-auto px-8" style={{ backgroundColor }}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 h-96 relative overflow-hidden rounded-xl border border-zinc-200">
                    <img 
                        alt={title} 
                        className="w-full h-full object-cover" 
                        src={mainImage} 
                    />
                    <div className="absolute bottom-0 left-0 p-8 w-full bg-gradient-to-t from-black/70 to-transparent">
                        <h3 className="text-3xl font-bold text-white mb-2">{title}</h3>
                        <p className="text-zinc-200">{description}</p>
                    </div>
                </div>
                <div className="md:col-span-4 h-96 bg-zinc-50 dark:bg-zinc-900 flex flex-col justify-center p-8 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <span className="material-symbols-outlined text-4xl mb-6" style={{ color: accentColor }}>verified</span>
                    <h3 className="text-2xl font-bold mb-4" style={{ color: titleColor }}>{sideTitle}</h3>
                    <p className="mb-8 leading-relaxed" style={{ color: textColor }}>{sideDescription}</p>
                    <a 
                        className="text-xs font-bold tracking-widest border-b-2 w-fit pb-1 hover:opacity-70 transition-opacity uppercase" 
                        href={sideCtaLink}
                        style={{ color: accentColor, borderColor: accentColor }}
                    >
                        {sideCtaLabel}
                    </a>
                </div>
            </div>
        </section>
    );
}
