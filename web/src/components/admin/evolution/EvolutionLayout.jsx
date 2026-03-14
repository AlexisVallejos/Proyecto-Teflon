import React from 'react';
import EvolutionSidebar from './EvolutionSidebar';
import EvolutionCanvas from './EvolutionCanvas';
import EvolutionInspector from './EvolutionInspector';
import CommandPalette from './CommandPalette';
import {
    buildAdminPanelCssVars,
    getAdminPanelBranding,
    getAdminPanelTheme,
} from '../../../utils/adminPanelTheme';

const EvolutionLayout = ({
    children,
    settings,
    onDataChange,
    onSave,
    onAddItem,
    isSaving,
    catalogContext,
    usersManager,
    categories,
    brands,
}) => {
    const adminTheme = getAdminPanelTheme(settings?.theme);
    const adminBranding = getAdminPanelBranding(settings?.branding);
    const shellStyle = buildAdminPanelCssVars(adminTheme);

    return (
        <div className={`admin-shell admin-${adminTheme.mode || 'dark'} flex h-screen overflow-hidden font-sans`} style={shellStyle}>
            {/* Column 1: Collapsible Sidebar */}
            <EvolutionSidebar branding={adminBranding} />

            {/* Column 2: Central Infinite Canvas */}
            <EvolutionCanvas branding={adminBranding}>
                {children}
            </EvolutionCanvas>

            {/* Column 3: Contextual Inspector */}
            <EvolutionInspector
                onDataChange={onDataChange}
                onSave={onSave}
                isSaving={isSaving}
                catalogContext={catalogContext}
                usersManager={usersManager}
                categories={categories}
                brands={brands}
            />

            {/* Global Overlay: Command Palette */}
            <CommandPalette branding={adminBranding} onAddItem={onAddItem} />
        </div>
    );
};

export default EvolutionLayout;
