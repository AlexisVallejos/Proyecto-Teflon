import { useCallback, useMemo, useState } from 'react';
import { getApiBase, getAuthHeaders, getTenantHeaders } from '../../utils/api';

const currentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const DEFAULT_CONFIG = {
    monthly_fee: 1,
    max_active_clubs: 200,
    reminder_days: 5,
    quota_due_day: 10,
    bank_transfer: {
        cbu: '',
        alias: '',
        bank: '',
        holder: '',
    },
};

const buildHeaders = () => ({
    ...getTenantHeaders(),
    ...getAuthHeaders(),
});

const readJson = async (response) => {
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(payload?.error || `consorcio_${response.status}`);
    }
    return payload;
};

export default function useConsorcio() {
    const [activeTab, setActiveTab] = useState('clubs');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [clubs, setClubs] = useState([]);
    const [quotas, setQuotas] = useState([]);
    const [draws, setDraws] = useState([]);
    const [config, setConfig] = useState(DEFAULT_CONFIG);
    const [month, setMonth] = useState(currentMonth());
    const [quotaStatus, setQuotaStatus] = useState('');
    const [clubForm, setClubForm] = useState({
        nombre: '',
        responsable: '',
        email: '',
        telefono: '',
        cuit: '',
        direccion: '',
        estado: 'pending',
    });
    const [editingClubId, setEditingClubId] = useState(null);

    const activeClubsCount = useMemo(
        () => clubs.filter((club) => club.estado === 'active').length,
        [clubs],
    );

    const loadConfig = useCallback(async () => {
        const data = await readJson(await fetch(`${getApiBase()}/api/admin/consortium/config`, {
            headers: buildHeaders(),
        }));
        setConfig({ ...DEFAULT_CONFIG, ...(data.config || {}) });
        return data.config;
    }, []);

    const loadClubs = useCallback(async () => {
        const data = await readJson(await fetch(`${getApiBase()}/api/admin/consortium/clubs`, {
            headers: buildHeaders(),
        }));
        setClubs(Array.isArray(data.items) ? data.items : []);
        return data.items || [];
    }, []);

    const loadQuotas = useCallback(async (options = {}) => {
        const nextMonth = options.month || month;
        const params = new URLSearchParams();
        if (nextMonth) params.set('mes', nextMonth);
        if (quotaStatus) params.set('estado', quotaStatus);
        const data = await readJson(await fetch(`${getApiBase()}/api/admin/consortium/quotas?${params.toString()}`, {
            headers: buildHeaders(),
        }));
        setQuotas(Array.isArray(data.items) ? data.items : []);
        return data.items || [];
    }, [month, quotaStatus]);

    const loadDraws = useCallback(async () => {
        const data = await readJson(await fetch(`${getApiBase()}/api/admin/consortium/draws`, {
            headers: buildHeaders(),
        }));
        setDraws(Array.isArray(data.items) ? data.items : []);
        return data.items || [];
    }, []);

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            await Promise.all([loadConfig(), loadClubs(), loadQuotas(), loadDraws()]);
        } catch (err) {
            setError(err.message || 'No se pudo cargar Consorcio');
        } finally {
            setLoading(false);
        }
    }, [loadClubs, loadConfig, loadDraws, loadQuotas]);

    const resetClubForm = useCallback(() => {
        setEditingClubId(null);
        setClubForm({
            nombre: '',
            responsable: '',
            email: '',
            telefono: '',
            cuit: '',
            direccion: '',
            estado: 'pending',
        });
    }, []);

    const editClub = useCallback((club) => {
        setEditingClubId(club.id);
        setClubForm({
            nombre: club.nombre || '',
            responsable: club.responsable || '',
            email: club.email || '',
            telefono: club.telefono || '',
            cuit: club.cuit || '',
            direccion: club.direccion || '',
            estado: club.estado || 'pending',
        });
        setActiveTab('clubs');
    }, []);

    const saveClub = useCallback(async () => {
        setSaving(true);
        setError('');
        try {
            const url = editingClubId
                ? `${getApiBase()}/api/admin/consortium/clubs/${editingClubId}`
                : `${getApiBase()}/api/admin/consortium/clubs`;
            const method = editingClubId ? 'PUT' : 'POST';
            const data = await readJson(await fetch(url, {
                method,
                headers: {
                    ...buildHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(clubForm),
            }));
            if (editingClubId) {
                setClubs((prev) => prev.map((club) => (club.id === editingClubId ? data.item : club)));
            } else {
                setClubs((prev) => [data.item, ...prev]);
            }
            resetClubForm();
            return data.item;
        } catch (err) {
            setError(err.message || 'No se pudo guardar el club');
            throw err;
        } finally {
            setSaving(false);
        }
    }, [clubForm, editingClubId, resetClubForm]);

    const updateClubStatus = useCallback(async (clubId, estado) => {
        setSaving(true);
        setError('');
        try {
            const data = await readJson(await fetch(`${getApiBase()}/api/admin/consortium/clubs/${clubId}/status`, {
                method: 'PATCH',
                headers: {
                    ...buildHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ estado }),
            }));
            setClubs((prev) => prev.map((club) => (club.id === clubId ? data.item : club)));
            return data.item;
        } catch (err) {
            setError(err.message || 'No se pudo cambiar el estado');
            throw err;
        } finally {
            setSaving(false);
        }
    }, []);

    const saveConfig = useCallback(async () => {
        setSaving(true);
        setError('');
        try {
            const data = await readJson(await fetch(`${getApiBase()}/api/admin/consortium/config`, {
                method: 'PUT',
                headers: {
                    ...buildHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config),
            }));
            setConfig({ ...DEFAULT_CONFIG, ...(data.config || {}) });
            return data.config;
        } catch (err) {
            setError(err.message || 'No se pudo guardar la configuracion');
            throw err;
        } finally {
            setSaving(false);
        }
    }, [config]);

    const generateQuotas = useCallback(async () => {
        setSaving(true);
        setError('');
        try {
            await readJson(await fetch(`${getApiBase()}/api/admin/consortium/quotas/generate`, {
                method: 'POST',
                headers: {
                    ...buildHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ mes: month }),
            }));
            return loadQuotas({ month });
        } catch (err) {
            setError(err.message || 'No se pudieron generar cuotas');
            throw err;
        } finally {
            setSaving(false);
        }
    }, [loadQuotas, month]);

    const approveQuota = useCallback(async (quotaId) => {
        setSaving(true);
        setError('');
        try {
            const data = await readJson(await fetch(`${getApiBase()}/api/admin/consortium/quotas/${quotaId}/approve`, {
                method: 'PATCH',
                headers: buildHeaders(),
            }));
            setQuotas((prev) => prev.map((quota) => (quota.id === quotaId ? { ...quota, ...data.item } : quota)));
            return data.item;
        } catch (err) {
            setError(err.message || 'No se pudo aprobar la cuota');
            throw err;
        } finally {
            setSaving(false);
        }
    }, []);

    const runDraw = useCallback(async () => {
        setSaving(true);
        setError('');
        try {
            const data = await readJson(await fetch(`${getApiBase()}/api/admin/consortium/draws`, {
                method: 'POST',
                headers: {
                    ...buildHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ mes: month }),
            }));
            await loadDraws();
            return data;
        } catch (err) {
            setError(err.message || 'No se pudo ejecutar el sorteo');
            throw err;
        } finally {
            setSaving(false);
        }
    }, [loadDraws, month]);

    return {
        activeTab,
        setActiveTab,
        loading,
        saving,
        error,
        clubs,
        quotas,
        draws,
        config,
        setConfig,
        month,
        setMonth,
        quotaStatus,
        setQuotaStatus,
        clubForm,
        setClubForm,
        editingClubId,
        activeClubsCount,
        loadAll,
        loadQuotas,
        resetClubForm,
        editClub,
        saveClub,
        updateClubStatus,
        saveConfig,
        generateQuotas,
        approveQuota,
        runDraw,
    };
}
