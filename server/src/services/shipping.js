const DISTANCE_ZONE_TYPE = 'distance';

export function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readText(value) {
  const normalized = String(value || '').trim();
  return normalized || null;
}

function normalizeLatitude(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < -90 || parsed > 90) return null;
  return parsed;
}

function normalizeLongitude(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < -180 || parsed > 180) return null;
  return parsed;
}

function normalizeDistanceValue(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function normalizeBranch(entry = {}, index = 0) {
  const id = String(entry.id || '').trim() || `branch-${index + 1}`;
  return {
    id,
    name: String(entry.name || '').trim(),
    address: String(entry.address || '').trim(),
    hours: String(entry.hours || '').trim(),
    phone: String(entry.phone || '').trim(),
    pickup_fee: toNumber(entry.pickup_fee, 0),
    enabled: entry.enabled !== false,
    latitude: normalizeLatitude(entry.latitude ?? entry.lat),
    longitude: normalizeLongitude(entry.longitude ?? entry.lng ?? entry.lon),
  };
}

export function normalizeBranches(settings = {}) {
  const branches = Array.isArray(settings?.branches) ? settings.branches : Array.isArray(settings) ? settings : [];
  return branches
    .map((branch, index) => normalizeBranch(branch, index))
    .filter((branch) => branch.enabled !== false && branch.id);
}

export function normalizeShippingZone(entry = {}, index = 0) {
  const id = String(entry.id || '').trim() || `zone-${index + 1}`;
  const type = String(entry.type || entry.pricing_mode || 'flat').trim().toLowerCase() === DISTANCE_ZONE_TYPE
    ? DISTANCE_ZONE_TYPE
    : 'flat';
  const minDistanceKm = type === DISTANCE_ZONE_TYPE
    ? normalizeDistanceValue(entry.min_distance_km ?? entry.minDistanceKm) ?? 0
    : 0;
  const maxDistanceRaw = type === DISTANCE_ZONE_TYPE
    ? normalizeDistanceValue(entry.max_distance_km ?? entry.maxDistanceKm ?? entry.radius_km ?? entry.radiusKm)
    : null;

  return {
    id,
    name: String(entry.name || '').trim() || `Zona ${index + 1}`,
    description: String(entry.description || '').trim(),
    price: toNumber(entry.price, 0),
    enabled: entry.enabled !== false,
    type,
    branch_id: readText(entry.branch_id ?? entry.branchId ?? entry.origin_branch_id ?? entry.originBranchId),
    min_distance_km: minDistanceKm,
    max_distance_km:
      type === DISTANCE_ZONE_TYPE && maxDistanceRaw != null
        ? Math.max(maxDistanceRaw, minDistanceKm)
        : null,
  };
}

export function normalizeShippingZones(settings = {}) {
  const zones = Array.isArray(settings?.shipping_zones)
    ? settings.shipping_zones
    : Array.isArray(settings)
      ? settings
      : [];

  const parsed = zones
    .map((zone, index) => normalizeShippingZone(zone, index))
    .filter((zone) => zone.enabled !== false && zone.id);

  if (parsed.length) return parsed;

  return [
    {
      id: 'arg-general',
      name: 'Argentina',
      description: 'Cobertura nacional',
      price: toNumber(settings?.shipping_flat, 0),
      enabled: true,
      type: 'flat',
      branch_id: null,
      min_distance_km: 0,
      max_distance_km: null,
    },
  ];
}

function readCustomerLocation(customer = {}) {
  const source = customer?.shipping_location || customer?.shippingLocation || customer?.location || {};
  const latitude = normalizeLatitude(
    source.latitude ??
      source.lat ??
      customer.shipping_latitude ??
      customer.shippingLatitude ??
      customer.latitude ??
      customer.lat
  );
  const longitude = normalizeLongitude(
    source.longitude ??
      source.lng ??
      source.lon ??
      customer.shipping_longitude ??
      customer.shippingLongitude ??
      customer.longitude ??
      customer.lng ??
      customer.lon
  );

  if (latitude == null || longitude == null) {
    return null;
  }

  return { latitude, longitude };
}

function haversineKm(from, to) {
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
}

function findBranchForZone(zone, branches) {
  if (!zone) return null;
  if (zone.branch_id) {
    return branches.find((branch) => branch.id === zone.branch_id) || null;
  }
  return branches.find((branch) => branch.latitude != null && branch.longitude != null) || null;
}

export function resolveDistanceShippingQuote(settings = {}, customer = {}, options = {}) {
  const shippingZones = normalizeShippingZones(settings).filter((zone) => zone.type === DISTANCE_ZONE_TYPE);
  if (!shippingZones.length) {
    return { error: 'distance_shipping_not_configured' };
  }

  const location = readCustomerLocation(customer);
  if (!location) {
    return { error: 'shipping_location_required' };
  }

  const branches = normalizeBranches(settings);
  const preferredBranchId = readText(options.preferredBranchId ?? options.branchId);
  const candidateZones = preferredBranchId
    ? shippingZones.filter((zone) => !zone.branch_id || zone.branch_id === preferredBranchId)
    : shippingZones;

  const matches = candidateZones
    .map((zone) => {
      const branch = findBranchForZone(zone, branches);
      if (!branch || branch.latitude == null || branch.longitude == null) {
        return null;
      }

      const distanceKm = haversineKm(location, {
        latitude: branch.latitude,
        longitude: branch.longitude,
      });

      const withinMin = distanceKm >= Number(zone.min_distance_km || 0);
      const withinMax = zone.max_distance_km == null || distanceKm <= Number(zone.max_distance_km);
      if (!withinMin || !withinMax) {
        return null;
      }

      return {
        zone,
        branch,
        distance_km: Number(distanceKm.toFixed(2)),
        amount: toNumber(zone.price, 0),
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
    const hasConfiguredOrigins = candidateZones.some((zone) => {
      const branch = findBranchForZone(zone, branches);
      return branch && branch.latitude != null && branch.longitude != null;
    });

    if (!hasConfiguredOrigins) {
      return { error: 'shipping_origin_not_configured' };
    }

    return { error: 'delivery_out_of_range' };
  }

  const best = matches[0];
  return {
    ok: true,
    amount: best.amount,
    shipping_zone_id: best.zone.id,
    shipping_zone_type: best.zone.type,
    branch_id: best.branch.id,
    distance_km: best.distance_km,
    zone: best.zone,
    branch: best.branch,
    location,
  };
}

export function resolveShippingAmount(settings = {}, customer = {}) {
  const deliveryRaw = String(customer?.delivery_method || customer?.deliveryMethod || '').trim();
  const shippingZones = normalizeShippingZones(settings);
  const branches = normalizeBranches(settings);

  if (deliveryRaw === 'distance:auto') {
    return resolveDistanceShippingQuote(settings, customer, {
      preferredBranchId: customer?.branch_id || customer?.branchId || customer?.shipping_location?.branch_id,
    });
  }

  if (deliveryRaw.startsWith('zone:')) {
    const zoneId = deliveryRaw.slice(5);
    const zone = shippingZones.find((entry) => entry.id === zoneId);
    if (zone) {
      if (zone.type === DISTANCE_ZONE_TYPE) {
        return resolveDistanceShippingQuote(settings, customer, {
          preferredBranchId: zone.branch_id,
        });
      }
      return {
        ok: true,
        amount: zone.price,
        shipping_zone_id: zone.id,
        shipping_zone_type: zone.type,
        branch_id: null,
        distance_km: null,
      };
    }
  }

  if (deliveryRaw.startsWith('branch:')) {
    const branchId = deliveryRaw.slice(7);
    const branch = branches.find((entry) => entry.id === branchId);
    if (branch) {
      return {
        ok: true,
        amount: branch.pickup_fee,
        shipping_zone_id: null,
        shipping_zone_type: 'pickup',
        branch_id: branch.id,
        distance_km: null,
      };
    }
  }

  if (deliveryRaw === 'mdp' || deliveryRaw === 'necochea') {
    return {
      ok: true,
      amount: 0,
      shipping_zone_id: null,
      shipping_zone_type: 'pickup',
      branch_id: deliveryRaw,
      distance_km: null,
    };
  }

  const fallbackZone = shippingZones.find((zone) => zone.type !== DISTANCE_ZONE_TYPE) || shippingZones[0];
  if (fallbackZone?.type === DISTANCE_ZONE_TYPE) {
    return resolveDistanceShippingQuote(settings, customer, {
      preferredBranchId: fallbackZone.branch_id,
    });
  }

  return {
    ok: true,
    amount: toNumber(fallbackZone?.price, toNumber(settings?.shipping_flat, 0)),
    shipping_zone_id: fallbackZone?.id || null,
    shipping_zone_type: fallbackZone?.type || 'flat',
    branch_id: null,
    distance_km: null,
  };
}
