import React from 'react';
import HeroSlider from './blocks/HeroSlider';
import FeaturedProducts from './blocks/FeaturedProducts';
import Services from './blocks/Services';

const COMPONENT_MAP = {
    HeroSlider,
    FeaturedProducts,
    Services,
};

export default function PageBuilder({ sections = [] }) {
    if (!sections || sections.length === 0) {
        return (
            <div className="p-10 text-center border-2 border-dashed border-gray-300 rounded-xl m-10">
                <p className="text-gray-500">Página vacía. Agregá secciones desde el editor.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            {sections.map((section, index) => {
                const Component = COMPONENT_MAP[section.type];

                if (!Component) {
                    console.warn(`Tipo de componente desconocido: ${section.type}`);
                    return (
                        <div
                            key={section.id || index}
                            className="p-4 bg-red-100 text-red-800 text-center my-2 rounded"
                        >
                            No existe el bloque "{section.type.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}".
                        </div>
                    );
                }

                return <Component key={section.id || index} {...section.props} />;
            })}
        </div>
    );
}
