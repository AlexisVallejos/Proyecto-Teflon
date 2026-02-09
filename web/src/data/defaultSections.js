export const DEFAULT_HOME_SECTIONS = [
    {
        id: 'home-hero',
        type: 'HeroSlider',
        enabled: true,
        props: {
            title: 'Nuevo Hero',
            subtitle: 'Descripcion aqui',
            tag: 'Novedad',
            primaryButton: { label: 'Ver mas', link: '/catalog' },
            secondaryButton: { label: 'Ver catalogo', link: '/catalog' },
            styles: { alignment: 'center', overlayOpacity: '0.6' },
        },
    },
    {
        id: 'home-featured',
        type: 'FeaturedProducts',
        enabled: true,
        props: {
            title: 'Destacados',
            subtitle: 'Lo mejor de nuestra tienda',
            ctaLabel: 'Ver catalogo',
            styles: { alignment: 'items-end justify-between' },
        },
    },
    {
        id: 'home-services',
        type: 'Services',
        enabled: true,
        props: {
            title: 'Nuestros Servicios',
            subtitle: 'Descripcion de servicios',
            items: [
                { icon: 'package', title: 'Envio Gratis', text: 'En compras mayores a $50.000' },
                { icon: 'shield', title: 'Garantia', text: '6 meses de garantia oficial' },
            ],
        },
    },
];

export const DEFAULT_ABOUT_SECTIONS = [
    {
        id: 'about-hero',
        type: 'AboutHero',
        enabled: true,
        props: {
            tagline: 'Desde 2014',
            title: 'Nuestra historia',
            description:
                'Definimos excelencia en soluciones sanitarias premium. Descubri la trayectoria y el detalle que nos distingue.',
            primaryButton: { label: 'Ver colecciones', link: '/catalog' },
            secondaryButton: { label: 'Conocer al equipo', link: '#equipo' },
            backgroundImage:
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDXU4BgrC9W5u9X6qi9WU5vv7H941UAvD-VYPk3k9YMvJ6QF9d4dfPigHBmjoGRgXAabQfjZhvwj8bEniRv7PJlqKfUiVrTvgGKiB3jc3UPiRUTFfETrULuzjjwlUJF_ngD-svg2JWO6i--ELVyRiQw8BxwzxIFUoBtLZ96yurT2qPiR2EM74_bN9dMICD1YE0RFyk4MCqlrq5bvG-5OhCNCh4qV0M_0zANXTAfRmeLbBZQrrOeyPxAl9Zys3aCIsE4XLdEPuV-MZs',
            styles: {
                accentColor: '#f27f0d',
                overlayColor: '#221910',
                overlayOpacity: 0.85,
                textColor: '#ffffff',
                mutedColor: 'rgba(255,255,255,0.75)',
            },
        },
    },
    {
        id: 'about-mission',
        type: 'AboutMission',
        enabled: true,
        props: {
            eyebrow: 'Nuestro proposito',
            title: 'La mision',
            paragraphs: [
                'Creemos que la base de cada proyecto esta en los detalles que no se ven. Combinamos ingenieria avanzada y materiales premium para soluciones que duran.',
                'Desde reformas residenciales hasta desarrollos comerciales, ofrecemos sanitarios que equilibran diseno y resistencia.',
            ],
            highlights: [
                { icon: 'verified', title: 'Calidad certificada', text: 'Procesos con estandares ISO 9001.' },
                { icon: 'eco', title: 'Eco innovacion', text: 'Tecnologia para ahorro de agua.' },
            ],
            image:
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDaDIcmwXvGopChH4z2NtypzPKEOIJB5DIz-cix6aLVUAg6015AqowjMQbKKJ273hv-K-Mdeeq78GFd-8Wt2hah0kOFgDkEGW24otJ-Yqrdn019S_zxUM4qMhyJ0sXG12Fr-Nk9EA4ZnVoQXzs0ZTjGJtuHBj_cdqJ4Z-i7TOx-wRo3JuBOyDsruX5utjj00tVbmE0sUIiRoPxHOH4_ohJ25dVPm0jFLFwKMx0fn7DC6IGRbByTaUUBATc5XDKzCDFZBcDdlv3kpB4',
            imageAlt: 'Profesional revisando fittings de calidad',
            styles: {
                accentColor: '#f27f0d',
                backgroundColor: '#ffffff',
                textColor: '#181411',
                mutedColor: '#6b7280',
            },
        },
    },
    {
        id: 'about-stats',
        type: 'AboutStats',
        enabled: true,
        props: {
            items: [
                { value: '10+', label: 'Anos de experiencia', accent: true },
                { value: '5k+', label: 'Clientes satisfechos' },
                { value: '2', label: 'Sucursales' },
                { value: '24/7', label: 'Soporte al cliente' },
            ],
            styles: {
                backgroundColor: '#181411',
                accentColor: '#f27f0d',
                textColor: '#ffffff',
                mutedColor: '#9ca3af',
            },
        },
    },
    {
        id: 'about-values',
        type: 'AboutValues',
        enabled: true,
        props: {
            title: 'Nuestros valores',
            items: [
                {
                    icon: 'quality',
                    title: 'Calidad',
                    description: 'Procesos rigurosos y materiales premium para cada componente.',
                },
                {
                    icon: 'commitment',
                    title: 'Compromiso',
                    description: 'Acompaniamos cada proyecto con soporte real y cercano.',
                },
                {
                    icon: 'innovation',
                    title: 'Innovacion',
                    description: 'Buscamos nuevas soluciones para disenos modernos y eficientes.',
                },
            ],
            styles: {
                backgroundColor: '#f8f7f5',
                cardBackground: '#ffffff',
                accentColor: '#f27f0d',
                textColor: '#181411',
                mutedColor: '#6b7280',
            },
        },
    },
    {
        id: 'about-team',
        type: 'AboutTeam',
        enabled: true,
        props: {
            anchor: 'equipo',
            title: 'Precision e inspiracion en cada detalle.',
            quote:
                'Nuestro trabajo no es solo sobre sanitarios, es sobre la seguridad y el confort de cada hogar. Cada union cuenta.',
            author: 'Julian Sterling',
            role: 'Founder & Head Engineer',
            avatarImage:
                'https://lh3.googleusercontent.com/aida-public/AB6AXuAea9Hk8KW-uNz2oCLHAOeVLaF4OEuHrLoMYAQ5icf0UpW2MbWEoppeOoK7-_ef46vSPLm9bOZn19yxGPkKgbqwzNxdl8pCXwjX84M0rsOM-14FdHnwu8rzaIZR1UJSvo2LVbbFvgWP_nntPKbU-nmwnPjWuzy9XiXqlmi62Yw8p6R5XWHQoEjxiw4mfhRuljOaKyPWkvPFELxYq8TKyXzDzeOlvj5ntTgVpCWOshfxNK3WLIQvRk7FstFclk10_lOYekLKXyXKEYA',
            backgroundImage:
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDd5sRN9c3Iyg5tub-t6DownNaquR6DBO7x9kWyTXKAhtTfCcSMSUTP3XZGAiL1-Mj-9MbM-m0jm0ijRI13F0_dNFIyToqwNriV9r4akyx6ZAWADgUH407R7Tas-tfzDuwHbfz29pugtdtM3dlMJNOiv20x3Gv8czAs6T9Sq2RN7e0tDp-X78LAcNw4Fz02UVghwohyhXjshm1zUxjj620L3W_ET5Q_zILEvX-EgPT6IDycP7lycSMQhu25nTE1qZeNJUjPddDvAg0',
            styles: {
                backgroundColor: '#f27f0d',
                overlayColor: '#000000',
                overlayOpacity: 0.25,
                textColor: '#ffffff',
            },
        },
    },
    {
        id: 'about-cta',
        type: 'AboutCTA',
        enabled: true,
        props: {
            title: 'Listo para tu proximo proyecto?',
            primaryLink: { label: 'Ver productos', link: '/catalog' },
            secondaryLink: { label: 'Contactar ventas', link: '/#contacto' },
            styles: {
                backgroundColor: '#ffffff',
                accentColor: '#f27f0d',
                textColor: '#181411',
                mutedColor: '#6b7280',
            },
        },
    },
];
