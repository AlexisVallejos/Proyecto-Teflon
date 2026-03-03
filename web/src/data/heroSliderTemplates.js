export const HERO_VARIANT_OPTIONS = [
    { value: 'classic', label: 'Clasico (actual)' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'home_decor', label: 'Home Decor' },
];

export const HERO_COLOR_FIELDS = {
    fashion: [
        { key: 'backgroundColor', label: 'Fondo' },
        { key: 'titleColor', label: 'Titulos' },
        { key: 'textColor', label: 'Texto' },
        { key: 'labelColor', label: 'Etiqueta' },
        { key: 'accentColor', label: 'Acento' },
        { key: 'primaryButtonBgColor', label: 'Boton primario (fondo)' },
        { key: 'primaryButtonTextColor', label: 'Boton primario (texto)' },
        { key: 'secondaryButtonBgColor', label: 'Boton secundario (fondo)' },
        { key: 'secondaryButtonTextColor', label: 'Boton secundario (texto)' },
        { key: 'secondaryButtonBorderColor', label: 'Boton secundario (borde)' },
    ],
    home_decor: [
        { key: 'backgroundColor', label: 'Fondo' },
        { key: 'titleColor', label: 'Titulos' },
        { key: 'textColor', label: 'Texto' },
        { key: 'labelColor', label: 'Etiqueta' },
        { key: 'accentColor', label: 'Acento' },
        { key: 'primaryButtonBgColor', label: 'Boton primario (fondo)' },
        { key: 'primaryButtonTextColor', label: 'Boton primario (texto)' },
        { key: 'secondaryButtonBgColor', label: 'Boton secundario (fondo)' },
        { key: 'secondaryButtonTextColor', label: 'Boton secundario (texto)' },
        { key: 'secondaryButtonBorderColor', label: 'Boton secundario (borde)' },
    ],
};

const FASHION_DEFAULT_SLIDES = [
    {
        label: 'Disponible ahora',
        title: 'Coleccion Minimalista',
        subtitle: 'Nueva temporada',
        description: 'Diseno sobrio y materiales premium para destacar cada ambiente.',
        featured: 'Producto destacado',
        image:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuCEP3rkEsdrZYUu5E5Gm0UsbfEeygONnqMt5DbDwg_0YaOauB2Bhr5sYDe87Jlc28eFAMWSHp1_QR6mIDVmDGBkNOB-Z_i60M0RDGRig6r9cg8O-63_q4fKm_bt4Z7U7VnkdPBBscIkUnT8DwkPCH73Nxz-olpjyveC_vMAX2t2i0uwJ1jSdGw5qdIBlry0GSZ_v4Kyho_iC-c038tLVz7uw2zTn-zFuIgVqO8v-vJRB9yKqJQkuFZqLcsTfAKZFedY0LGqOMfmB9g',
        primaryButtonLabel: 'Comprar ahora',
        primaryButtonLink: '/catalog',
        secondaryButtonLabel: '',
        secondaryButtonLink: '',
    },
    {
        label: 'Lanzamiento',
        title: 'Look Urbano',
        subtitle: 'Edicion limitada',
        description: 'Piezas seleccionadas para una presentacion elegante y moderna.',
        featured: 'Coleccion premium',
        image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=900&q=80&auto=format&fit=crop',
        primaryButtonLabel: 'Ver catalogo',
        primaryButtonLink: '/catalog',
        secondaryButtonLabel: '',
        secondaryButtonLink: '',
    },
];

const HOME_DECOR_DEFAULT_SLIDES = [
    {
        label: 'Nueva temporada',
        title: 'Confort y estilo',
        subtitle: '',
        description: 'Descubri muebles y accesorios para transformar tus espacios.',
        featured: '',
        image:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuCVhvkYBdnOleG-Z-XnXwCSL6_l6oepFXgffpD5_uB8OujfUbm1XfEPH6pcjis5D6WDJfzQwQg6rUkq1Dj-_3fi51AMaY-luZCbHLPzWWzUsZZ1Nn8OurbMfYfUB2h5QytLEcXWMTWSXsPjXUYCOouHe9ok_RfWcVdDg-bIOypIq7Engm4Gi5ya_eZrIwi013yjjNHNGZPlsDZUzYwVkXtNJZcYuukpk4tQnQA7Rrvj4jEOIkRzjs7bsnpbDpRovQYmhDjr-TyaCik',
        primaryButtonLabel: 'Ver coleccion',
        primaryButtonLink: '/catalog',
        secondaryButtonLabel: 'Explorar mas',
        secondaryButtonLink: '/catalog',
    },
    {
        label: 'Seleccion especial',
        title: 'Inspiracion natural',
        subtitle: '',
        description: 'Texturas organicas y diseno moderno para cada rincon de tu hogar.',
        featured: '',
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80&auto=format&fit=crop',
        primaryButtonLabel: 'Comprar ahora',
        primaryButtonLink: '/catalog',
        secondaryButtonLabel: 'Ver destacados',
        secondaryButtonLink: '/catalog',
    },
];

const SLIDE_DEFAULTS_BY_VARIANT = {
    fashion: FASHION_DEFAULT_SLIDES,
    home_decor: HOME_DECOR_DEFAULT_SLIDES,
};

const STYLE_DEFAULTS_BY_VARIANT = {
    fashion: {
        backgroundColor: '#f5f3f0',
        titleColor: '#111111',
        textColor: '#52525b',
        labelColor: '#52525b',
        accentColor: '#111111',
        primaryButtonBgColor: '#111111',
        primaryButtonTextColor: '#ffffff',
        secondaryButtonBgColor: '#ffffff',
        secondaryButtonTextColor: '#111111',
        secondaryButtonBorderColor: '#111111',
    },
    home_decor: {
        backgroundColor: '#ffffff',
        titleColor: '#0f172a',
        textColor: '#475569',
        labelColor: '#135bec',
        accentColor: '#135bec',
        primaryButtonBgColor: '#135bec',
        primaryButtonTextColor: '#ffffff',
        secondaryButtonBgColor: '#ffffff',
        secondaryButtonTextColor: '#0f172a',
        secondaryButtonBorderColor: '#cbd5e1',
    },
};

const EMPTY_SLIDE = {
    label: '',
    title: '',
    subtitle: '',
    description: '',
    featured: '',
    image: '',
    primaryButtonLabel: '',
    primaryButtonLink: '',
    secondaryButtonLabel: '',
    secondaryButtonLink: '',
};

const cloneSlides = (slides = []) => slides.map((slide) => ({ ...slide }));

const sanitizeText = (value) => (typeof value === 'string' ? value : '');

export const normalizeHeroVariant = (variant) =>
    HERO_VARIANT_OPTIONS.some((option) => option.value === variant) ? variant : 'classic';

export const getDefaultHeroSlides = (variant) => {
    const normalizedVariant = normalizeHeroVariant(variant);
    const defaults = SLIDE_DEFAULTS_BY_VARIANT[normalizedVariant] || [];
    return cloneSlides(defaults);
};

export const getDefaultHeroStyles = (variant) => {
    const normalizedVariant = normalizeHeroVariant(variant);
    return { ...(STYLE_DEFAULTS_BY_VARIANT[normalizedVariant] || {}) };
};

export const createEmptyHeroSlide = (variant) => {
    const defaults = getDefaultHeroSlides(variant);
    if (defaults.length > 0) {
        return { ...defaults[0], label: '', title: '', subtitle: '', description: '', featured: '' };
    }
    return { ...EMPTY_SLIDE };
};

const normalizeSlide = (rawSlide = {}) => ({
    label: sanitizeText(rawSlide.label),
    title: sanitizeText(rawSlide.title),
    subtitle: sanitizeText(rawSlide.subtitle),
    description: sanitizeText(rawSlide.description),
    featured: sanitizeText(rawSlide.featured),
    image: sanitizeText(rawSlide.image),
    primaryButtonLabel: sanitizeText(rawSlide.primaryButtonLabel),
    primaryButtonLink: sanitizeText(rawSlide.primaryButtonLink),
    secondaryButtonLabel: sanitizeText(rawSlide.secondaryButtonLabel),
    secondaryButtonLink: sanitizeText(rawSlide.secondaryButtonLink),
});

export const normalizeHeroSlides = (variant, slides) => {
    const normalizedVariant = normalizeHeroVariant(variant);
    const sourceSlides = Array.isArray(slides) && slides.length > 0 ? slides : getDefaultHeroSlides(normalizedVariant);
    const normalized = sourceSlides.map((slide) => normalizeSlide(slide));
    return normalized.length > 0 ? normalized : [normalizeSlide(createEmptyHeroSlide(normalizedVariant))];
};

export const normalizeHeroStyles = (variant, styles) => {
    const defaults = getDefaultHeroStyles(variant);
    const source = styles && typeof styles === 'object' ? styles : {};
    const next = { ...defaults };
    Object.keys(defaults).forEach((key) => {
        if (typeof source[key] === 'string' && source[key].trim().length > 0) {
            next[key] = source[key];
        }
    });
    return next;
};
