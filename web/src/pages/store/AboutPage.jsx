import React, { useEffect, useState } from 'react';
import StoreLayout from '../../components/layout/StoreLayout';
import PageBuilder from '../../components/PageBuilder';
import { getApiBase, getTenantHeaders } from '../../utils/api';
import { getDefaultSectionsForPage, mergeSectionsWithDefaults } from '../../data/defaultSections';
import { useTenant } from '../../context/TenantContext';

const PIQUIM_ABOUT_SECTION_TYPES = new Set([
    'PiquimHero',
    'PiquimAnnounceBar',
    'PiquimTresMundos',
    'PiquimCatalog3Panel',
    'PiquimCTABanner',
]);

const shouldUseFetchedSections = (pageKey, sections = []) => {
    if (!Array.isArray(sections) || !sections.length) return false;
    if (pageKey !== 'piquim-about') return true;
    return sections.some((section) => PIQUIM_ABOUT_SECTION_TYPES.has(section?.type));
};

export default function AboutPage() {
    const { settings } = useTenant();
    const isPiquim = settings?.branding?.design_preset === 'piquim';
    const pageKey = isPiquim ? 'piquim-about' : 'about';
    const [sections, setSections] = useState(() => getDefaultSectionsForPage(pageKey));

    useEffect(() => {
        setSections(getDefaultSectionsForPage(pageKey));
    }, [pageKey]);

    useEffect(() => {
        const loadAbout = async () => {
            try {
                const response = await fetch(`${getApiBase()}/public/pages/about`, {
                    headers: getTenantHeaders(),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (shouldUseFetchedSections(pageKey, data.sections)) {
                        setSections(mergeSectionsWithDefaults(pageKey, data.sections));
                    }
                }
            } catch (err) {
                console.error('No se pudo cargar la página Sobre Nosotros', err);
            }
        };

        loadAbout();
    }, [pageKey]);

    const visibleSections = Array.isArray(sections)
        ? sections.filter((section) => section.enabled !== false)
        : [];

    return (
        <StoreLayout>
            <PageBuilder sections={visibleSections} />
        </StoreLayout>
    );
}
