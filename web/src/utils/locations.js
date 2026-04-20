const REST_COUNTRIES_URL = 'https://restcountries.com/v3.1/all?fields=name,cca2,translations';
const ARGENTINA_PROVINCES_URL = 'https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre';
const ARGENTINA_LOCALITIES_URL = 'https://apis.datos.gob.ar/georef/api/localidades?campos=id,nombre&max=5000&provincia=';

export const FALLBACK_COUNTRY_OPTIONS = [
    { value: 'AR', label: 'Argentina' },
    { value: 'UY', label: 'Uruguay' },
    { value: 'CL', label: 'Chile' },
    { value: 'BR', label: 'Brasil' },
    { value: 'PY', label: 'Paraguay' },
    { value: 'BO', label: 'Bolivia' },
    { value: 'PE', label: 'Peru' },
    { value: 'CO', label: 'Colombia' },
    { value: 'MX', label: 'Mexico' },
    { value: 'ES', label: 'Espana' },
];

const countriesState = {
    data: null,
    promise: null,
};

const argentinaProvincesState = {
    data: null,
    promise: null,
};

const argentinaCitiesCache = new Map();

const normalizeText = (value = '') =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

const uniqueSortedOptions = (items = []) => {
    const byKey = new Map();
    items.forEach((item) => {
        const label = String(item?.label || '').trim();
        const value = String(item?.value || '').trim();
        if (!label || !value) return;
        const key = `${value}:${normalizeText(label)}`;
        if (!byKey.has(key)) {
            byKey.set(key, { value, label });
        }
    });
    return Array.from(byKey.values()).sort((left, right) => left.label.localeCompare(right.label, 'es'));
};

const fetchJson = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`location_fetch_failed:${response.status}`);
    }
    return response.json();
};

export const findOptionByText = (options = [], value = '') => {
    const normalized = normalizeText(value);
    if (!normalized) return null;
    return (
        options.find((option) => normalizeText(option.label) === normalized)
        || options.find((option) => normalizeText(option.value) === normalized)
        || null
    );
};

export const getCountryLabelByCode = (countryCode, options = FALLBACK_COUNTRY_OPTIONS) =>
    options.find((option) => option.value === countryCode)?.label || countryCode;

export const loadCountries = async () => {
    if (Array.isArray(countriesState.data) && countriesState.data.length) {
        return countriesState.data;
    }
    if (countriesState.promise) {
        return countriesState.promise;
    }

    countriesState.promise = fetchJson(REST_COUNTRIES_URL)
        .then((payload) => {
            const options = uniqueSortedOptions(
                (Array.isArray(payload) ? payload : []).map((country) => ({
                    value: String(country?.cca2 || '').trim().toUpperCase(),
                    label:
                        String(country?.translations?.spa?.common || '').trim()
                        || String(country?.name?.common || '').trim(),
                })),
            );
            countriesState.data = options.length ? options : FALLBACK_COUNTRY_OPTIONS;
            return countriesState.data;
        })
        .catch(() => {
            countriesState.data = FALLBACK_COUNTRY_OPTIONS;
            return countriesState.data;
        })
        .finally(() => {
            countriesState.promise = null;
        });

    return countriesState.promise;
};

export const loadArgentinaProvinces = async () => {
    if (Array.isArray(argentinaProvincesState.data) && argentinaProvincesState.data.length) {
        return argentinaProvincesState.data;
    }
    if (argentinaProvincesState.promise) {
        return argentinaProvincesState.promise;
    }

    argentinaProvincesState.promise = fetchJson(ARGENTINA_PROVINCES_URL)
        .then((payload) => {
            const options = uniqueSortedOptions(
                (Array.isArray(payload?.provincias) ? payload.provincias : []).map((province) => ({
                    value: String(province?.id || '').trim(),
                    label: String(province?.nombre || '').trim(),
                })),
            );
            argentinaProvincesState.data = options;
            return options;
        })
        .finally(() => {
            argentinaProvincesState.promise = null;
        });

    return argentinaProvincesState.promise;
};

export const loadArgentinaCities = async (provinceId) => {
    const normalizedProvinceId = String(provinceId || '').trim();
    if (!normalizedProvinceId) return [];

    const cached = argentinaCitiesCache.get(normalizedProvinceId);
    if (Array.isArray(cached?.data) && cached.data.length) {
        return cached.data;
    }
    if (cached?.promise) {
        return cached.promise;
    }

    const promise = fetchJson(`${ARGENTINA_LOCALITIES_URL}${encodeURIComponent(normalizedProvinceId)}`)
        .then((payload) => {
            const byLabel = new Map();
            (Array.isArray(payload?.localidades) ? payload.localidades : []).forEach((city) => {
                const label = String(city?.nombre || '').trim();
                const value = String(city?.id || '').trim();
                const key = normalizeText(label);
                if (!label || !value || byLabel.has(key)) return;
                byLabel.set(key, { value, label });
            });
            const options = Array.from(byLabel.values()).sort((left, right) => left.label.localeCompare(right.label, 'es'));
            argentinaCitiesCache.set(normalizedProvinceId, { data: options, promise: null });
            return options;
        })
        .catch(() => {
            argentinaCitiesCache.set(normalizedProvinceId, { data: [], promise: null });
            return [];
        });

    argentinaCitiesCache.set(normalizedProvinceId, { data: null, promise });
    return promise;
};
