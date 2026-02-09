import React from 'react';
import { navigate } from '../../utils/navigation';

export default function AboutHero({
    tagline = 'Desde 2014',
    title = 'Nuestra historia',
    description = 'Excelencia en soluciones sanitarias premium para hogares y proyectos profesionales.',
    primaryButton = { label: 'Ver colecciones', link: '/catalog' },
    secondaryButton = { label: 'Conocer al equipo', link: '#equipo' },
    backgroundImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXU4BgrC9W5u9X6qi9WU5vv7H941UAvD-VYPk3k9YMvJ6QF9d4dfPigHBmjoGRgXAabQfjZhvwj8bEniRv7PJlqKfUiVrTvgGKiB3jc3UPiRUTFfETrULuzjjwlUJF_ngD-svg2JWO6i--ELVyRiQw8BxwzxIFUoBtLZ96yurT2qPiR2EM74_bN9dMICD1YE0RFyk4MCqlrq5bvG-5OhCNCh4qV0M_0zANXTAfRmeLbBZQrrOeyPxAl9Zys3aCIsE4XLdEPuV-MZs',
    styles = {},
}) {
    const accentColor = styles.accentColor || 'var(--color-primary, #f97316)';
    const textColor = styles.textColor || '#ffffff';
    const mutedColor = styles.mutedColor || 'rgba(255,255,255,0.75)';
    const overlayColor = styles.overlayColor || '#221910';
    const overlayOpacity = typeof styles.overlayOpacity === 'number' ? styles.overlayOpacity : 0.85;
    const minHeight = styles.minHeight || '70vh';

    const handleNavigate = (event, link) => {
        if (!link) return;
        event.preventDefault();
        navigate(link);
    };

    return (
        <section className="relative w-full flex items-center justify-center overflow-hidden" style={{ minHeight }}>
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${backgroundImage}')` }}
                aria-hidden="true"
            />
            <div
                className="absolute inset-0"
                style={{ backgroundColor: overlayColor, opacity: overlayOpacity }}
                aria-hidden="true"
            />
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto" style={{ color: textColor }}>
                <span
                    className="font-bold tracking-[0.3em] uppercase text-sm mb-4 block"
                    style={{ color: accentColor }}
                >
                    {tagline}
                </span>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6">
                    {title}
                </h1>
                <p className="text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto" style={{ color: mutedColor }}>
                    {description}
                </p>
                <div className="mt-10 flex flex-wrap justify-center gap-4">
                    {primaryButton?.label ? (
                        <a
                            href={primaryButton.link || '#'}
                            onClick={(event) => handleNavigate(event, primaryButton.link)}
                            className="px-8 py-4 rounded-lg font-bold transition-all"
                            style={{ backgroundColor: accentColor, color: '#ffffff' }}
                        >
                            {primaryButton.label}
                        </a>
                    ) : null}
                    {secondaryButton?.label ? (
                        <a
                            href={secondaryButton.link || '#'}
                            onClick={(event) => handleNavigate(event, secondaryButton.link)}
                            className="px-8 py-4 rounded-lg font-bold transition-all border"
                            style={{ borderColor: 'rgba(255,255,255,0.3)', color: textColor, backgroundColor: 'rgba(255,255,255,0.08)' }}
                        >
                            {secondaryButton.label}
                        </a>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
