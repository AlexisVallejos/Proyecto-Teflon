export const DISTANCE_DELIVERY_KEY = 'distance:auto';

export const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeLatitude = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < -90 || parsed > 90) return null;
    return parsed;
};

const normalizeLongitude = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < -180 || parsed > 180) return null;
    return parsed;
};

export const normalizeBranches = (source = []) =>
    (Array.isArray(source) ? source : [])
        .map((branch, index) => ({
            id: branch?.id || `branch-${index + 1}`,
            name: branch?.name || `Sucursal ${index + 1}`,
            address: branch?.address || '',
            hours: branch?.hours || '',
            phone: branch?.phone || '',
            pickup_fee: toNumber(branch?.pickup_fee, 0),
            enabled: branch?.enabled !== false,
            latitude: normalizeLatitude(branch?.latitude ?? branch?.lat),
            longitude: normalizeLongitude(branch?.longitude ?? branch?.lng ?? branch?.lon),
        }))
        .filter((branch) => branch.enabled !== false);

export const normalizeShippingZones = (source = [], shippingFlat = 0) => {
    const parsed = (Array.isArray(source) ? source : [])
        .map((zone, index) => {
            const type = String(zone?.type || zone?.pricing_mode || 'flat').trim().toLowerCase() === 'distance'
                ? 'distance'
                : 'flat';

            return {
                id: zone?.id || `zone-${index + 1}`,
                name: zone?.name || `Zona ${index + 1}`,
                description: zone?.description || '',
                price: toNumber(zone?.price, 0),
                enabled: zone?.enabled !== false,
                type,
                branch_id: String(zone?.branch_id || zone?.branchId || '').trim() || null,
                min_distance_km: type === 'distance' ? Math.max(0, toNumber(zone?.min_distance_km ?? zone?.minDistanceKm, 0)) : 0,
                max_distance_km: type === 'distance'
                    ? (() => {
                        const raw = zone?.max_distance_km ?? zone?.maxDistanceKm ?? zone?.radius_km ?? zone?.radiusKm;
                        const parsedValue = Number(raw);
                        return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : null;
                    })()
                    : null,
            };
        })
        .filter((zone) => zone.enabled !== false);

    if (parsed.length) return parsed;

    return [
        {
            id: 'arg-general',
            name: 'Argentina',
            description: 'Cobertura nacional',
            price: toNumber(shippingFlat, 0),
            enabled: true,
            type: 'flat',
            branch_id: null,
            min_distance_km: 0,
            max_distance_km: null,
        },
    ];
};

export const haversineKm = (from, to) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const deltaLat = toRad(to.latitude - from.latitude);
    const deltaLng = toRad(to.longitude - from.longitude);
    const lat1 = toRad(from.latitude);
    const lat2 = toRad(to.latitude);

    const a =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const findBranchForZone = (zone, branches) => {
    if (zone?.branch_id) {
        return branches.find((branch) => branch.id === zone.branch_id) || null;
    }
    return branches.find((branch) => branch.latitude != null && branch.longitude != null) || null;
};

export const resolveDistanceQuote = ({ shippingZones = [], branches = [], location = null, preferredBranchId = null }) => {
    if (location?.latitude == null || location?.longitude == null) {
        return { error: 'shipping_location_required' };
    }

    const distanceZones = shippingZones.filter((zone) => zone.type === 'distance');
    if (!distanceZones.length) {
        return { error: 'distance_shipping_not_configured' };
    }

    const candidateZones = preferredBranchId
        ? distanceZones.filter((zone) => !zone.branch_id || zone.branch_id === preferredBranchId)
        : distanceZones;

    const matches = candidateZones
        .map((zone) => {
            const branch = findBranchForZone(zone, branches);
            if (!branch || branch.latitude == null || branch.longitude == null) return null;

            const distanceKm = haversineKm(location, {
                latitude: branch.latitude,
                longitude: branch.longitude,
            });

            const withinMin = distanceKm >= Number(zone.min_distance_km || 0);
            const withinMax = zone.max_distance_km == null || distanceKm <= Number(zone.max_distance_km);
            if (!withinMin || !withinMax) return null;

            return {
                zone,
                branch,
                distance_km: Number(distanceKm.toFixed(2)),
                price: toNumber(zone.price, 0),
            };
        })
        .filter(Boolean)
        .sort((a, b) => {
            if (a.distance_km !== b.distance_km) return a.distance_km - b.distance_km;
            const aMax = a.zone.max_distance_km == null ? Number.POSITIVE_INFINITY : a.zone.max_distance_km;
            const bMax = b.zone.max_distance_km == null ? Number.POSITIVE_INFINITY : b.zone.max_distance_km;
            return aMax - bMax;
        });

    if (!matches.length) {
        const hasOrigin = candidateZones.some((zone) => {
            const branch = findBranchForZone(zone, branches);
            return branch && branch.latitude != null && branch.longitude != null;
        });
        return { error: hasOrigin ? 'delivery_out_of_range' : 'shipping_origin_not_configured' };
    }

    const best = matches[0];
    return {
        ok: true,
        zone: best.zone,
        branch: best.branch,
        distance_km: best.distance_km,
        price: best.price,
    };
};
