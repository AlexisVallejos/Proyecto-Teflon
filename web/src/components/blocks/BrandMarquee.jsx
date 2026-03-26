import React, { useMemo } from 'react';
import {
    getDefaultBrandMarqueeProps,
    normalizeBrandMarqueeItems,
    normalizeBrandMarqueeSpeed,
} from '../../data/brandMarqueeDefaults';

const SPEED_SECONDS = {
    static: 0,
    slow: 36,
    medium: 30,
    fast: 22,
};

const safeExternalLink = (value) => {
    const link = String(value || '').trim();
    if (!link) return '';
    if (/^https?:\/\//i.test(link)) return link;
    return `https://${link.replace(/^\/+/, '')}`;
};

export default function BrandMarquee({
    eyebrow,
    title,
    subtitle,
    items,
    speed,
    styles = {},
}) {
    const defaults = useMemo(() => getDefaultBrandMarqueeProps(), []);
    const marqueeItems = useMemo(() => normalizeBrandMarqueeItems(items), [items]);
    const animationSpeed = normalizeBrandMarqueeSpeed(speed || defaults.speed);
    const animationSeconds = SPEED_SECONDS[animationSpeed] || SPEED_SECONDS.medium;
    const shouldAnimate = animationSpeed !== 'static';
    const railItems = shouldAnimate ? [...marqueeItems, ...marqueeItems] : marqueeItems;

    const backgroundColor = styles.backgroundColor || defaults.styles.backgroundColor;
    const borderColor = styles.cardBorderColor || defaults.styles.cardBorderColor;
    const eyebrowColor = styles.subtitleColor || defaults.styles.subtitleColor;
    const titleColor = styles.titleColor || defaults.styles.titleColor;
    const railTextColor = styles.badgeTextColor || 'rgba(156, 163, 175, 0.7)';

    const finalEyebrow = String(eyebrow ?? defaults.eyebrow ?? '').trim();
    const finalTitle = String(title ?? defaults.title ?? '').trim();
    const finalSubtitle = String(subtitle ?? defaults.subtitle ?? '').trim();

    return (
        <section
            className="mt-16 overflow-hidden border-y px-4 py-10 md:px-10"
            style={{ backgroundColor, borderColor }}
        >
            <style>{`
                @keyframes brand-marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>

            <div className="mx-auto max-w-[1408px]">
                <div className="mb-4 px-4">
                    {finalEyebrow ? (
                        <span
                            className="mb-6 block text-center text-[10px] font-bold uppercase tracking-[0.3em]"
                            style={{ color: eyebrowColor }}
                        >
                            {finalEyebrow}
                        </span>
                    ) : null}

                    {finalTitle ? (
                        <h2
                            className="text-center text-3xl font-black tracking-tight md:text-4xl"
                            style={{ color: titleColor }}
                        >
                            {finalTitle}
                        </h2>
                    ) : null}

                    {finalSubtitle ? (
                        <p
                            className="mx-auto mt-3 max-w-2xl text-center text-sm md:text-base"
                            style={{ color: eyebrowColor }}
                        >
                            {finalSubtitle}
                        </p>
                    ) : null}
                </div>

                <div className="group relative flex overflow-hidden">
                    <div
                        className="flex items-center gap-16 whitespace-nowrap py-4"
                        style={shouldAnimate ? { animation: `brand-marquee ${animationSeconds}s linear infinite` } : undefined}
                    >
                        {railItems.map((item, index) => {
                            const label = item.name || `Marca ${index + 1}`;
                            const link = safeExternalLink(item.link);
                            const content = item.image ? (
                                <img
                                    src={item.image}
                                    alt={label}
                                    className="h-10 max-w-[160px] object-contain opacity-60 grayscale transition duration-300 group-hover:opacity-80 md:h-12 md:max-w-[190px]"
                                />
                            ) : (
                                <span
                                    className="text-xl font-black uppercase tracking-tighter md:text-2xl"
                                    style={{ color: railTextColor }}
                                >
                                    {label}
                                </span>
                            );

                            if (!link) {
                                return <div key={`${item.id}-${index}`}>{content}</div>;
                            }

                            return (
                                <a
                                    key={`${item.id}-${index}`}
                                    href={link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="transition-opacity hover:opacity-100"
                                >
                                    {content}
                                </a>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
