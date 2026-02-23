import React, { useCallback, useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import PageBuilder from '../../components/PageBuilder';
import { getApiBase, getTenantHeaders } from '../../utils/api';
import { DEFAULT_ABOUT_SECTIONS, DEFAULT_HOME_SECTIONS } from '../../data/defaultSections';
import { useAuth } from '../../context/AuthContext';

export default function EditorPage() {
    const [activeTab, setActiveTab] = useState('home');
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categorySaving, setCategorySaving] = useState(false);
    const [stockEdits, setStockEdits] = useState({});
    const [stockSavingId, setStockSavingId] = useState(null);
    const [deleteLoadingId, setDeleteLoadingId] = useState(null);
    const [serviceIconUploading, setServiceIconUploading] = useState(false);
    const [logoUploading, setLogoUploading] = useState(false);
    const [clearingFeatured, setClearingFeatured] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        sku: '',
        price: '',
        stock: 0,
        description: '',
        images: [],
        is_featured: false,
        category_id: '',
        features: [],
        specifications: {},
        collection: '',
        delivery_time: '',
        warranty: ''
    });
    const [uploading, setUploading] = useState(false);
    const [heroUploading, setHeroUploading] = useState(false);
    const [settings, setSettings] = useState({
        branding: {
            name: '',
            logo_url: '',
            navbar: {
                links: [
                    { label: 'Inicio', href: '/' },
                    { label: 'Catálogo', href: '/catalog' }
                ]
            },
            footer: {
                socials: { facebook: '', instagram: '', whatsapp: '' },
                contact: { address: '', phone: '', email: '' },
                quickLinks: [
                    { label: 'Sobre nosotros', href: '#' },
                    { label: 'Contacto', href: '#' }
                ]
            }
        },
        theme: { primary: '#f97316', secondary: '#181411', font_family: 'Inter', mode: 'light' },
        commerce: {
            whatsapp_number: '',
            email: '',
            address: '',
            price_adjustments: {
                retail_percent: 0,
                wholesale_percent: 0,
                promo_enabled: false,
                promo_percent: 0,
                promo_scope: 'both',
                promo_label: 'Oferta',
            },
        }
    });
    const [pageSections, setPageSections] = useState({
        home: DEFAULT_HOME_SECTIONS,
        about: DEFAULT_ABOUT_SECTIONS,
    });
    const [editingSection, setEditingSection] = useState(null);
    const [showAddSection, setShowAddSection] = useState(false);
    const [moveAnimations, setMoveAnimations] = useState({});
    const moveAnimationTimeout = useRef(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '' });
    const [tenants, setTenants] = useState([]);
    const [tenantsLoading, setTenantsLoading] = useState(false);
    const [tenantsError, setTenantsError] = useState('');
    const [usersList, setUsersList] = useState([]);
    const [usersPage, setUsersPage] = useState(1);
    const [usersTotal, setUsersTotal] = useState(0);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState('');
<<<<<<< Updated upstream
    const [usersAdjustmentDrafts, setUsersAdjustmentDrafts] = useState({});
    const [usersSavingAdjustmentId, setUsersSavingAdjustmentId] = useState(null);
    const [offers, setOffers] = useState([]);
    const [offersLoading, setOffersLoading] = useState(false);
    const [offersError, setOffersError] = useState('');
    const [offerUsers, setOfferUsers] = useState([]);
    const [offerFormSaving, setOfferFormSaving] = useState(false);
    const [offerDeleteId, setOfferDeleteId] = useState(null);
    const [editingOfferId, setEditingOfferId] = useState(null);
    const [offerForm, setOfferForm] = useState({
        name: '',
        label: 'Oferta',
        percent: 0,
        enabled: true,
        user_ids: [],
        category_ids: [],
    });
=======
    const [priceLists, setPriceLists] = useState([]);
    const [priceListsLoading, setPriceListsLoading] = useState(false);
    const [priceListsError, setPriceListsError] = useState('');
    const [userDrafts, setUserDrafts] = useState({});
    const [userSavingId, setUserSavingId] = useState(null);
>>>>>>> Stashed changes
    const USERS_LIMIT = 10;
    const [selectedUser, setSelectedUser] = useState(null);
    const [userOrders, setUserOrders] = useState([]);
    const [userOrdersLoading, setUserOrdersLoading] = useState(false);
    const [userOrdersError, setUserOrdersError] = useState('');
    const [orderUpdatingId, setOrderUpdatingId] = useState(null);
    const [expandedOrders, setExpandedOrders] = useState({});
    const [userOrdersFilter, setUserOrdersFilter] = useState('all');
    const { user } = useAuth();
    const sectionPageKey = activeTab === 'about' ? 'about' : 'home';
    const sections = pageSections[sectionPageKey] || [];
    const priceAdjustments = settings.commerce?.price_adjustments || {
        retail_percent: 0,
        wholesale_percent: 0,
        promo_enabled: false,
        promo_percent: 0,
        promo_scope: 'both',
        promo_label: 'Oferta',
    };
    const usersTotalPages = Math.max(1, Math.ceil(usersTotal / USERS_LIMIT));
    const canPrevUsers = usersPage > 1;
    const canNextUsers = usersPage < usersTotalPages;
    const ORDER_STATUS_OPTIONS = [
        { value: 'draft', label: 'Borrador' },
        { value: 'pending_payment', label: 'Pendiente' },
        { value: 'processing', label: 'En proceso' },
        { value: 'paid', label: 'Pagado' },
        { value: 'unpaid', label: 'Impaga' },
        { value: 'submitted', label: 'Recibido' },
        { value: 'cancelled', label: 'Cancelado' },
    ];
    const USER_ROLE_OPTIONS = [
        { value: 'retail', label: 'Minorista' },
        { value: 'wholesale', label: 'Mayorista' },
        { value: 'tenant_admin', label: 'Admin' },
    ];
    const USER_STATUS_OPTIONS = [
        { value: 'pending', label: 'Pendiente' },
        { value: 'active', label: 'Activo' },
        { value: 'inactive', label: 'Inactivo' },
    ];
    const formatOrderTotal = (value, currency = 'ARS') => {
        const amount = Number(value || 0);
        try {
            return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount);
        } catch (err) {
            return `$${amount.toFixed(2)}`;
        }
    };
    const formatCustomerName = (customer = {}) => {
        return (
            customer.full_name ||
            customer.fullName ||
            customer.name ||
            customer.customer_name ||
            ''
        );
    };
    const formatCustomerPhone = (customer = {}) => {
        return customer.phone || customer.phone_number || customer.whatsapp || '';
    };
    const formatCustomerEmail = (customer = {}) => {
        return customer.email || '';
    };
    const formatCustomerAddress = (customer = {}) => {
        if (customer.fullAddress) return customer.fullAddress;
        if (customer.address) return customer.address;
        const shipping = customer.shipping || customer.shipping_address || {};
        const parts = [
            customer.line1 || shipping.line1 || customer.address_line1,
            customer.line2 || shipping.line2 || customer.address_line2,
            customer.city || shipping.city,
            customer.state || shipping.state,
            customer.zip || shipping.zip || customer.postal_code,
            customer.country || shipping.country,
        ].filter(Boolean);
        return parts.join(', ');
    };
    const formatDeliveryMethod = (customer = {}) => {
        const method = customer.delivery_method || customer.deliveryMethod || '';
        if (method === 'home') return 'Entrega a domicilio';
        if (method === 'mdp') return 'Retiro: Mar del Plata';
        if (method === 'necochea') return 'Retiro: Necochea';
        return method || '-';
    };
    const formatPaymentDetail = (order) => {
        const customer = order?.customer || {};
        const method = (customer.payment_method || customer.payment || '').toString().toLowerCase();
        if (method === 'mp' || method === 'mercadopago') {
            return 'Mercado Pago (online)';
        }
        if (order.checkout_mode === 'online') {
            return 'Mercado Pago (online)';
        }
        if (order.checkout_mode === 'transfer') {
            return method.includes('efectivo') ? 'Transferencia / Efectivo' : 'Transferencia';
        }
        if (order.checkout_mode === 'whatsapp') {
            return method || 'WhatsApp (efectivo o transferencia)';
        }
        return method || order.checkout_mode || '-';
    };
    const getPaymentProof = (customer = {}) => {
        return (
            customer.payment_proof_url ||
            customer.paymentProofUrl ||
            customer.receipt_url ||
            customer.receiptUrl ||
            customer.proof_url ||
            customer.proofUrl ||
            customer.payment_proof ||
            ''
        );
    };
    const isImageUrl = (value) => {
        if (!value) return false;
        const clean = value.split('?')[0];
        return /\.(png|jpe?g|gif|webp)$/i.test(clean);
    };
    const isPdfUrl = (value) => {
        if (!value) return false;
        const clean = value.split('?')[0];
        return /\.pdf$/i.test(clean);
    };
    const setSections = (nextValue) => {
        setPageSections((prev) => {
            const current = prev[sectionPageKey] || [];
            const resolved = typeof nextValue === 'function' ? nextValue(current) : nextValue;
            return { ...prev, [sectionPageKey]: resolved };
        });
    };
    const updatePriceAdjustments = (patch) => {
        setSettings((prev) => ({
            ...prev,
            commerce: {
                ...prev.commerce,
                price_adjustments: {
                    ...(prev.commerce?.price_adjustments || {}),
                    ...patch,
                },
            },
        }));
    };

    const showSuccess = (message) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const getUserDraft = useCallback((item) => {
        if (!item?.id) return null;
        return userDrafts[item.id] || {
            role: item.role || 'retail',
            status: item.status || 'active',
            price_list_id: item.price_list_id || 'auto',
        };
    }, [userDrafts]);

    const hasUserDraftChanges = useCallback((item) => {
        const draft = getUserDraft(item);
        if (!draft || !item) return false;
        const roleChanged = (draft.role || 'retail') !== (item.role || 'retail');
        const statusChanged = (draft.status || 'active') !== (item.status || 'active');
        const currentPriceList = item.price_list_id || 'auto';
        const draftPriceList = draft.price_list_id || 'auto';
        const priceListChanged = draftPriceList !== currentPriceList;
        return roleChanged || statusChanged || priceListChanged;
    }, [getUserDraft]);

    const loadTenants = useCallback(async () => {
        if (user?.role !== 'master_admin') {
            setTenants([]);
            setTenantsError('Solo el usuario master admin puede ver empresas.');
            return;
        }
        setTenantsLoading(true);
        setTenantsError('');
        try {
            const token = localStorage.getItem('teflon_token');
            const headers = {
                'Authorization': `Bearer ${token}`,
            };
            const res = await fetch(`${getApiBase()}/admin/tenants`, { headers });
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || 'No se pudo cargar empresas');
            }
            const data = await res.json();
            setTenants(Array.isArray(data.items) ? data.items : []);
        } catch (err) {
            console.error('Failed to load tenants', err);
            setTenantsError('No se pudieron cargar las empresas.');
        } finally {
            setTenantsLoading(false);
        }
    }, [user]);

    const loadUsers = useCallback(async (pageOverride) => {
        setUsersLoading(true);
        setUsersError('');
        try {
            const token = localStorage.getItem('teflon_token');
            const headers = {
                ...getTenantHeaders(),
                'Authorization': `Bearer ${token}`,
            };
            const pageToLoad = pageOverride ?? usersPage;
            const url = new URL(`${getApiBase()}/tenant/users`);
            url.searchParams.set('page', String(pageToLoad));
            url.searchParams.set('limit', String(USERS_LIMIT));
            const res = await fetch(url.toString(), { headers });
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || 'No se pudo cargar usuarios');
            }
            const data = await res.json();
            const items = Array.isArray(data.items) ? data.items : [];
            setUsersList(items);
            setUsersTotal(data.total || 0);
            setUsersAdjustmentDrafts((prev) => {
                const next = { ...prev };
                for (const item of items) {
                    if (next[item.id] === undefined) {
                        next[item.id] = Number(item.price_adjustment_percent || 0);
                    }
                }
                return next;
            });
        } catch (err) {
            console.error('Failed to load users', err);
            setUsersError('No se pudieron cargar los usuarios.');
            setUsersList([]);
            setUsersTotal(0);
        } finally {
            setUsersLoading(false);
        }
    }, [USERS_LIMIT, usersPage]);

<<<<<<< Updated upstream
    const resetOfferForm = useCallback(() => {
        setEditingOfferId(null);
        setOfferForm({
            name: '',
            label: 'Oferta',
            percent: 0,
            enabled: true,
            user_ids: [],
            category_ids: [],
        });
    }, []);

    const loadOffers = useCallback(async () => {
        setOffersLoading(true);
        setOffersError('');
=======
    const loadPriceLists = useCallback(async () => {
        setPriceListsLoading(true);
        setPriceListsError('');
>>>>>>> Stashed changes
        try {
            const token = localStorage.getItem('teflon_token');
            const headers = {
                ...getTenantHeaders(),
                'Authorization': `Bearer ${token}`,
            };
<<<<<<< Updated upstream
            const res = await fetch(`${getApiBase()}/tenant/offers`, { headers });
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || 'No se pudieron cargar ofertas');
            }
            const data = await res.json();
            setOffers(Array.isArray(data.items) ? data.items : []);
        } catch (err) {
            console.error('Failed to load offers', err);
            setOffersError('No se pudieron cargar las ofertas.');
            setOffers([]);
        } finally {
            setOffersLoading(false);
        }
    }, []);

    const loadOfferUsers = useCallback(async () => {
        try {
            const token = localStorage.getItem('teflon_token');
            const headers = {
                ...getTenantHeaders(),
                'Authorization': `Bearer ${token}`,
            };
            const url = new URL(`${getApiBase()}/tenant/users`);
            url.searchParams.set('page', '1');
            url.searchParams.set('limit', '200');
            const res = await fetch(url.toString(), { headers });
            if (!res.ok) return;
            const data = await res.json();
            setOfferUsers(Array.isArray(data.items) ? data.items : []);
        } catch (err) {
            console.error('Failed to load users for offers', err);
        }
    }, []);

    const submitOffer = useCallback(async () => {
        const payload = {
            name: String(offerForm.name || '').trim(),
            label: String(offerForm.label || 'Oferta').trim() || 'Oferta',
            percent: Number(offerForm.percent || 0),
            enabled: !!offerForm.enabled,
            user_ids: Array.isArray(offerForm.user_ids) ? offerForm.user_ids : [],
            category_ids: Array.isArray(offerForm.category_ids) ? offerForm.category_ids : [],
        };

        if (!payload.name) {
            alert('Completa el nombre de la oferta');
            return;
        }

        if (!Number.isFinite(payload.percent) || payload.percent < 0 || payload.percent > 100) {
            alert('El porcentaje debe estar entre 0 y 100');
            return;
        }

        setOfferFormSaving(true);
        try {
            const token = localStorage.getItem('teflon_token');
            const headers = {
                ...getTenantHeaders(),
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            };
            const endpoint = editingOfferId
                ? `${getApiBase()}/tenant/offers/${editingOfferId}`
                : `${getApiBase()}/tenant/offers`;
            const method = editingOfferId ? 'PUT' : 'POST';

            const res = await fetch(endpoint, {
                method,
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || 'No se pudo guardar la oferta');
            }

            await loadOffers();
            resetOfferForm();
            showSuccess(editingOfferId ? 'Oferta actualizada' : 'Oferta creada');
        } catch (err) {
            console.error('Failed to save offer', err);
            alert('No se pudo guardar la oferta');
        } finally {
            setOfferFormSaving(false);
        }
    }, [editingOfferId, loadOffers, offerForm, resetOfferForm]);

    const removeOffer = useCallback(async (offerId) => {
        if (!offerId) return;
        if (!window.confirm('¿Eliminar esta oferta?')) return;

        setOfferDeleteId(offerId);
        try {
            const token = localStorage.getItem('teflon_token');
            const headers = {
                ...getTenantHeaders(),
                'Authorization': `Bearer ${token}`,
            };
            const res = await fetch(`${getApiBase()}/tenant/offers/${offerId}`, {
                method: 'DELETE',
                headers,
            });
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || 'No se pudo eliminar la oferta');
            }
            await loadOffers();
            if (editingOfferId === offerId) {
                resetOfferForm();
            }
            showSuccess('Oferta eliminada');
        } catch (err) {
            console.error('Failed to delete offer', err);
            alert('No se pudo eliminar la oferta');
        } finally {
            setOfferDeleteId(null);
        }
    }, [editingOfferId, loadOffers, resetOfferForm]);

    const editOffer = useCallback((offer) => {
        setEditingOfferId(offer.id);
        setOfferForm({
            name: offer.name || '',
            label: offer.label || 'Oferta',
            percent: Number(offer.percent || 0),
            enabled: offer.enabled !== false,
            user_ids: Array.isArray(offer.user_ids) ? offer.user_ids : [],
            category_ids: Array.isArray(offer.category_ids) ? offer.category_ids : [],
        });
    }, []);

    const toggleOfferUser = (userId) => {
        setOfferForm((prev) => {
            const current = Array.isArray(prev.user_ids) ? prev.user_ids : [];
            const exists = current.includes(userId);
            return {
                ...prev,
                user_ids: exists ? current.filter((id) => id !== userId) : [...current, userId],
            };
        });
    };

    const toggleOfferCategory = (categoryId) => {
        setOfferForm((prev) => {
            const current = Array.isArray(prev.category_ids) ? prev.category_ids : [];
            const exists = current.includes(categoryId);
            return {
                ...prev,
                category_ids: exists ? current.filter((id) => id !== categoryId) : [...current, categoryId],
            };
        });
    };

    const updateUserPriceAdjustment = useCallback(async (userId) => {
        const draftValue = Number(usersAdjustmentDrafts[userId] ?? 0);
        if (!Number.isFinite(draftValue)) {
            alert('El porcentaje no es valido');
            return;
        }

        setUsersSavingAdjustmentId(userId);
        try {
            const token = localStorage.getItem('teflon_token');
            const headers = {
                ...getTenantHeaders(),
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            };
            const res = await fetch(`${getApiBase()}/tenant/users/${userId}/price-adjustment`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ price_adjustment_percent: draftValue }),
            });
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || 'No se pudo guardar el ajuste');
            }

            const data = await res.json();
            const savedValue = Number(data?.item?.price_adjustment_percent ?? draftValue);

            setUsersList((prev) => prev.map((item) => (
                item.id === userId ? { ...item, price_adjustment_percent: savedValue } : item
            )));
            setUsersAdjustmentDrafts((prev) => ({ ...prev, [userId]: savedValue }));

            if (selectedUser?.id === userId) {
                setSelectedUser((prev) => prev ? { ...prev, price_adjustment_percent: savedValue } : prev);
            }

            showSuccess('Ajuste por usuario guardado');
        } catch (err) {
            console.error('Failed to update user price adjustment', err);
            alert('No se pudo guardar el ajuste por usuario');
        } finally {
            setUsersSavingAdjustmentId(null);
        }
    }, [selectedUser, usersAdjustmentDrafts]);
=======
            const res = await fetch(`${getApiBase()}/tenant/price-lists`, { headers });
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || 'No se pudo cargar listas de precios');
            }
            const data = await res.json();
            setPriceLists(Array.isArray(data.items) ? data.items : []);
        } catch (err) {
            console.error('Failed to load price lists', err);
            setPriceLists([]);
            setPriceListsError('No se pudieron cargar las listas de precios.');
        } finally {
            setPriceListsLoading(false);
        }
    }, []);

    const patchUserMembership = useCallback(async (userId, payload) => {
        const token = localStorage.getItem('teflon_token');
        const headers = {
            ...getTenantHeaders(),
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
        const res = await fetch(`${getApiBase()}/tenant/users/${userId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || 'No se pudo actualizar el usuario');
        }
        const data = await res.json();
        return data?.user || null;
    }, []);

    const assignUserPriceList = useCallback(async (userId, priceListId) => {
        const token = localStorage.getItem('teflon_token');
        const headers = {
            ...getTenantHeaders(),
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
        const res = await fetch(`${getApiBase()}/tenant/users/${userId}/price-list`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                price_list_id: !priceListId || priceListId === 'auto' ? null : priceListId,
            }),
        });
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || 'No se pudo asignar la lista de precios');
        }
        const data = await res.json();
        return data?.price_list || null;
    }, []);

    const saveUserSetup = useCallback(async (item) => {
        if (!item?.id) return;
        const draft = getUserDraft(item);
        if (!draft) return;
        const role = draft.role || 'retail';
        const status = draft.status || 'active';
        const selectedPriceList = draft.price_list_id || 'auto';
        const hasRoleOrStatusChanges =
            role !== (item.role || 'retail') ||
            status !== (item.status || 'active');
        const hasPriceListChanges =
            selectedPriceList !== (item.price_list_id || 'auto');
        if (!hasRoleOrStatusChanges && !hasPriceListChanges) {
            return;
        }

        setUserSavingId(item.id);
        try {
            let nextUser = item;
            if (hasRoleOrStatusChanges) {
                const patched = await patchUserMembership(item.id, { role, status });
                if (patched) {
                    nextUser = {
                        ...nextUser,
                        ...patched,
                    };
                } else {
                    nextUser = {
                        ...nextUser,
                        role,
                        status,
                    };
                }
            }

            if (hasPriceListChanges) {
                const assigned = await assignUserPriceList(item.id, selectedPriceList);
                nextUser = {
                    ...nextUser,
                    price_list_id: assigned?.id || null,
                    price_list_name: assigned?.name || null,
                    price_list_type: assigned?.type || null,
                };
            }

            setUsersList((prev) =>
                prev.map((current) => (current.id === item.id ? nextUser : current))
            );
            setSelectedUser((prev) => (prev?.id === item.id ? nextUser : prev));
            setUserDrafts((prev) => ({
                ...prev,
                [item.id]: {
                    role: nextUser.role || role,
                    status: nextUser.status || status,
                    price_list_id: nextUser.price_list_id || 'auto',
                },
            }));
            showSuccess('Usuario actualizado');
        } catch (err) {
            console.error('Failed to update user setup', err);
            alert('No se pudo guardar la configuracion del usuario');
        } finally {
            setUserSavingId(null);
        }
    }, [assignUserPriceList, getUserDraft, patchUserMembership]);

    const approveWholesaleUser = useCallback(async (item) => {
        if (!item?.id) return;
        setUserSavingId(item.id);
        try {
            const patched = await patchUserMembership(item.id, {
                role: 'wholesale',
                status: 'active',
            });
            const nextUser = patched
                ? { ...item, ...patched }
                : { ...item, role: 'wholesale', status: 'active' };
            setUsersList((prev) =>
                prev.map((current) => (current.id === item.id ? nextUser : current))
            );
            setSelectedUser((prev) => (prev?.id === item.id ? nextUser : prev));
            setUserDrafts((prev) => ({
                ...prev,
                [item.id]: {
                    role: nextUser.role || 'wholesale',
                    status: nextUser.status || 'active',
                    price_list_id: nextUser.price_list_id || 'auto',
                },
            }));
            showSuccess('Mayorista aprobado');
        } catch (err) {
            console.error('Failed to approve wholesale user', err);
            alert('No se pudo aprobar el mayorista');
        } finally {
            setUserSavingId(null);
        }
    }, [patchUserMembership]);
>>>>>>> Stashed changes

    const loadUserOrders = useCallback(async (userId) => {
        if (!userId) return;
        setUserOrdersLoading(true);
        setUserOrdersError('');
        try {
            const token = localStorage.getItem('teflon_token');
            const headers = {
                ...getTenantHeaders(),
                'Authorization': `Bearer ${token}`,
            };
            const url = new URL(`${getApiBase()}/api/admin/orders`);
            url.searchParams.set('user_id', userId);
            const res = await fetch(url.toString(), { headers });
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || 'No se pudo cargar pedidos');
            }
            const data = await res.json();
            setUserOrders(Array.isArray(data.items) ? data.items : []);
        } catch (err) {
            console.error('Failed to load user orders', err);
            setUserOrdersError('No se pudieron cargar las compras del usuario.');
            setUserOrders([]);
        } finally {
            setUserOrdersLoading(false);
        }
    }, []);

    const updateOrderStatus = useCallback(async (orderId, nextStatus) => {
        if (!orderId || !nextStatus) return;
        setOrderUpdatingId(orderId);
        try {
            const token = localStorage.getItem('teflon_token');
            const headers = {
                ...getTenantHeaders(),
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            };
            const res = await fetch(`${getApiBase()}/api/admin/orders/${orderId}/status`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ status: nextStatus }),
            });
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || 'No se pudo actualizar el estado');
            }
            const data = await res.json();
            if (data?.order?.status) {
                setUserOrders((prev) => prev.map((order) =>
                    order.id === orderId ? { ...order, status: data.order.status } : order
                ));
                showSuccess('Estado actualizado');
            }
        } catch (err) {
            console.error('Failed to update order status', err);
            alert('No se pudo actualizar el estado');
        } finally {
            setOrderUpdatingId(null);
        }
    }, []);

    useEffect(() => () => {
        if (moveAnimationTimeout.current) {
            clearTimeout(moveAnimationTimeout.current);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'tenants') {
            loadTenants();
        }
    }, [activeTab, loadTenants]);

    useEffect(() => {
        if (activeTab === 'users') {
            loadUsers();
            loadPriceLists();
        }
    }, [activeTab, usersPage, loadUsers, loadPriceLists]);

    useEffect(() => {
        if (activeTab === 'pricing') {
            loadOffers();
            loadOfferUsers();
        }
    }, [activeTab, loadOffers, loadOfferUsers]);

    useEffect(() => {
        if (activeTab === 'users' && selectedUser?.id) {
            loadUserOrders(selectedUser.id);
        }
    }, [activeTab, selectedUser, loadUserOrders]);

    useEffect(() => {
        if (activeTab === 'users') {
            setUserOrdersFilter('all');
        }
    }, [activeTab, selectedUser]);

    useEffect(() => {
        if (!usersList.length) {
            setUserDrafts({});
            return;
        }
        setUserDrafts((prev) => {
            const next = {};
            usersList.forEach((item) => {
                const current = prev[item.id];
                next[item.id] = {
                    role: current?.role || item.role || 'retail',
                    status: current?.status || item.status || 'active',
                    price_list_id: current?.price_list_id || item.price_list_id || 'auto',
                };
            });
            return next;
        });
        setSelectedUser((prev) => {
            if (!prev?.id) return prev;
            const updated = usersList.find((item) => item.id === prev.id);
            return updated || prev;
        });
    }, [usersList]);

    const isImageIcon = (value) =>
        typeof value === 'string' &&
        (value.startsWith('http://') ||
            value.startsWith('https://') ||
            value.startsWith('/uploads/') ||
            value.startsWith('data:'));

    const loadCategories = useCallback(async () => {
        try {
            const token = localStorage.getItem('teflon_token');
            const headers = { ...getTenantHeaders(), 'Authorization': `Bearer ${token}` };
            const res = await fetch(`${getApiBase()}/tenant/categories`, { headers });
            if (res.ok) {
                const data = await res.json();
                setCategories(data || []);
            }
        } catch (err) {
            console.error('Failed to load categories', err);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                const token = localStorage.getItem('teflon_token');
                const headers = { ...getTenantHeaders(), 'Authorization': `Bearer ${token}` };

                const [settingsRes, homeRes, aboutRes, productsRes] = await Promise.all([
                    fetch(`${getApiBase()}/tenant/settings`, { headers }),
                    fetch(`${getApiBase()}/tenant/pages/home`, { headers }),
                    fetch(`${getApiBase()}/tenant/pages/about`, { headers }),
                    fetch(`${getApiBase()}/tenant/products`, { headers })
                ]);

                if (settingsRes.ok) {
                    const data = await settingsRes.json();
                    const mergedSettings = {
                        ...settings,
                        ...data.settings,
                        branding: {
                            ...settings.branding,
                            ...(data.settings?.branding || {}),
                            navbar: {
                                ...settings.branding.navbar,
                                ...(data.settings?.branding?.navbar || {})
                            },
                            footer: {
                                ...settings.branding.footer,
                                ...(data.settings?.branding?.footer || {})
                            }
                        },
                        commerce: {
                            ...settings.commerce,
                            ...(data.settings?.commerce || {})
                        },
                    };
                    setSettings(mergedSettings);
                }
                let nextHomeSections = DEFAULT_HOME_SECTIONS;
                let nextAboutSections = DEFAULT_ABOUT_SECTIONS;

                if (homeRes.ok) {
                    const data = await homeRes.json();
                    if (Array.isArray(data.sections)) {
                        nextHomeSections = data.sections;
                    }
                }
                if (aboutRes.ok) {
                    const data = await aboutRes.json();
                    if (Array.isArray(data.sections)) {
                        nextAboutSections = data.sections;
                    }
                }

                setPageSections({
                    home: nextHomeSections,
                    about: nextAboutSections,
                });
                if (productsRes.ok) {
                    const data = await productsRes.json();
                    setProducts(data.items || []);
                }
            } catch (err) {
                console.error("Failed to load editor data", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('teflon_token');
            const headers = {
                ...getTenantHeaders(),
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const settingsRes = await fetch(`${getApiBase()}/tenant/settings`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(settings)
            });

            const savePage = async (slug, sectionsData) => {
                const saveRes = await fetch(`${getApiBase()}/tenant/pages/${slug}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ sections: sectionsData || [] })
                });
                if (!saveRes.ok) {
                    return { ok: false, published: false };
                }

                const publishRes = await fetch(`${getApiBase()}/tenant/pages/${slug}/publish`, {
                    method: 'POST',
                    headers
                });

                return { ok: true, published: publishRes.ok };
            };

            const [homeRes, aboutRes] = await Promise.all([
                savePage('home', pageSections.home),
                savePage('about', pageSections.about),
            ]);

            if (settingsRes.ok && homeRes.ok && aboutRes.ok) {
                if (homeRes.published && aboutRes.published) {
                    showSuccess('Cambios guardados y publicados con exito');
                } else {
                    showSuccess('Guardado como borrador (error al publicar)');
                }
            } else {
                alert('Error al guardar algunos cambios');
            }
        } catch (err) {
            console.error('Save all failed', err);
            alert('Error crítico al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleAddSection = (type) => {
        const newSection = {
            id: crypto.randomUUID(),
            type,
            enabled: true,
            props: { styles: {} }
        };

        if (activeTab === 'about') {
            if (type === 'AboutHero') {
                newSection.props = DEFAULT_ABOUT_SECTIONS.find((section) => section.type === 'AboutHero')?.props || {};
            } else if (type === 'AboutMission') {
                newSection.props = DEFAULT_ABOUT_SECTIONS.find((section) => section.type === 'AboutMission')?.props || {};
            } else if (type === 'AboutStats') {
                newSection.props = DEFAULT_ABOUT_SECTIONS.find((section) => section.type === 'AboutStats')?.props || {};
            } else if (type === 'AboutValues') {
                newSection.props = DEFAULT_ABOUT_SECTIONS.find((section) => section.type === 'AboutValues')?.props || {};
            } else if (type === 'AboutTeam') {
                newSection.props = DEFAULT_ABOUT_SECTIONS.find((section) => section.type === 'AboutTeam')?.props || {};
            } else if (type === 'AboutCTA') {
                newSection.props = DEFAULT_ABOUT_SECTIONS.find((section) => section.type === 'AboutCTA')?.props || {};
            }
        } else {
            if (type === 'HeroSlider') {
                newSection.props = {
                    title: 'Nuevo Hero',
                    subtitle: 'Descripcion aqui',
                    tag: 'Novedad',
                    primaryButton: { label: 'Ver mas', link: '/catalog' },
                    secondaryButton: { label: 'Ver catalogo', link: '/catalog' },
                    styles: { alignment: 'center', overlayOpacity: '0.6' }
                };
            } else if (type === 'Services') {
                newSection.props = {
                    title: 'Nuestros Servicios',
                    subtitle: 'Descripcion de servicios',
                    items: [
                        { icon: 'package', title: 'Envio Gratis', text: 'En compras mayores a $50.000' },
                        { icon: 'shield', title: 'Garantia', text: '6 meses de garantia oficial' }
                    ]
                };
            } else if (type === 'FeaturedProducts') {
                newSection.props = {
                    title: 'Destacados',
                    subtitle: 'Lo mejor de nuestra tienda',
                    ctaLabel: 'Ver catalogo',
                    styles: { alignment: 'items-end justify-between' }
                };
            }
        }

        setSections([...sections, newSection]);
        setShowAddSection(false);
        showSuccess('Sección añadida');
    };

    const handleDeleteSection = (index) => {
        if (!window.confirm('¿Borrar esta sección?')) return;
        const newSections = [...sections];
        newSections.splice(index, 1);
        setSections(newSections);
        setEditingSection(null);
        showSuccess('Sección eliminada');
    };

    const handleMoveSection = (index, direction) => {
        const newSections = [...sections];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= sections.length) return;

        const movingId = newSections[index].id;
        const swapId = newSections[targetIndex].id;
        const temp = newSections[index];
        newSections[index] = newSections[targetIndex];
        newSections[targetIndex] = temp;
        setSections(newSections);
        setMoveAnimations({ [movingId]: direction, [swapId]: -direction });
        if (moveAnimationTimeout.current) {
            clearTimeout(moveAnimationTimeout.current);
        }
        moveAnimationTimeout.current = setTimeout(() => {
            setMoveAnimations({});
        }, 320);
    };

    const handleCreateCategory = async () => {
        const name = newCategoryName.trim();
        if (!name) return;
        setCategorySaving(true);
        try {
            const token = localStorage.getItem('teflon_token');
            const headers = {
                ...getTenantHeaders(),
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const res = await fetch(`${getApiBase()}/tenant/categories`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ name })
            });

            if (res.ok) {
                setNewCategoryName('');
                await loadCategories();
                showSuccess('Categoria creada con exito');
            } else {
                alert('Error al crear categoria');
            }
        } catch (err) {
            console.error('Failed to create category', err);
            alert('Error al crear categoria');
        } finally {
            setCategorySaving(false);
        }
    };

    const handleCreateProduct = async () => {
        if (!newProduct.name) return;
        setSaving(true);
        try {
            const token = localStorage.getItem('teflon_token');
            const headers = {
                ...getTenantHeaders(),
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const res = await fetch(`${getApiBase()}/tenant/products`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    ...newProduct,
                    stock: Number(newProduct.stock || 0),
                })
            });

            if (res.ok) {
                const created = await res.json();
                setProducts([
                    ...products,
                    { ...newProduct, id: created.id, stock: Number(newProduct.stock || 0), is_featured: newProduct.is_featured },
                ]);
                setNewProduct({
                    name: '',
                    sku: '',
                    price: '',
                    stock: 0,
                    description: '',
                    images: [],
                    is_featured: false,
                    category_id: '',
                    features: [],
                    specifications: {},
                    collection: '',
                    delivery_time: '',
                    warranty: ''
                });
                showSuccess('Producto creado con éxito');
            }
        } catch (err) {
            console.error('Failed to create product', err);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleFeatured = async (id, currentStatus) => {
        try {
            const token = localStorage.getItem('teflon_token');
            const headers = {
                ...getTenantHeaders(),
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const res = await fetch(`${getApiBase()}/tenant/products/${id}/featured`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ featured: !currentStatus })
            });

            if (res.ok) {
                setProducts(products.map(p => p.id === id ? { ...p, is_featured: !currentStatus } : p));
                showSuccess(`Producto ${!currentStatus ? 'destacado' : 'quitado de destacados'}`);
            }
        } catch (err) {
            console.error('Failed to toggle featured', err);
        }
    };

    const handleAddStock = async (id) => {
        const raw = stockEdits[id];
        if (raw === undefined || raw === null || String(raw).trim() === '') return;
        const delta = Number(raw);
        if (Number.isNaN(delta) || delta === 0) return;

        setStockSavingId(id);
        try {
            const token = localStorage.getItem('teflon_token');
            const headers = {
                ...getTenantHeaders(),
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            const res = await fetch(`${getApiBase()}/tenant/products/${id}/stock`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ delta })
            });

            if (res.ok) {
                const data = await res.json();
                setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: data.stock } : p));
                setStockEdits(prev => ({ ...prev, [id]: '' }));
                showSuccess('Stock actualizado');
            } else {
                alert('Error al actualizar stock');
            }
        } catch (err) {
            console.error('Failed to update stock', err);
            alert('Error al actualizar stock');
        } finally {
            setStockSavingId(null);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Eliminar este producto?')) return;
        setDeleteLoadingId(id);
        try {
            const token = localStorage.getItem('teflon_token');
            const headers = {
                ...getTenantHeaders(),
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            const res = await fetch(`${getApiBase()}/tenant/products/${id}`, {
                method: 'DELETE',
                headers
            });

            if (res.ok) {
                setProducts(prev => prev.filter(p => p.id !== id));
                showSuccess('Producto eliminado');
            } else {
                alert('Error al eliminar producto');
            }
        } catch (err) {
            console.error('Failed to delete product', err);
            alert('Error al eliminar producto');
        } finally {
            setDeleteLoadingId(null);
        }
    };

    const handleClearFeatured = async () => {
        if (!window.confirm('Quitar todos los destacados?')) return;
        setClearingFeatured(true);
        try {
            const token = localStorage.getItem('teflon_token');
            const headers = {
                ...getTenantHeaders(),
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            const res = await fetch(`${getApiBase()}/tenant/products/featured/clear`, {
                method: 'PUT',
                headers
            });

            if (res.ok) {
                setProducts(prev => prev.map(p => ({ ...p, is_featured: false })));
                showSuccess('Destacados limpiados');
            } else {
                alert('Error al limpiar destacados');
            }
        } catch (err) {
            console.error('Failed to clear featured', err);
            alert('Error al limpiar destacados');
        } finally {
            setClearingFeatured(false);
        }
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const dataUrl = await readImageAsDataUrl(file);
            if (!dataUrl) {
                alert('No se pudo leer la imagen');
                return;
            }
            setNewProduct((prev) => {
                const currentImages = Array.isArray(prev.images) ? prev.images : [];
                return {
                    ...prev,
                    images: [
                        ...currentImages,
                        {
                            url: dataUrl,
                            alt: prev.name || 'Producto',
                            primary: currentImages.length === 0
                        }
                    ]
                };
            });
            showSuccess('Imagen cargada');
        } catch (err) {
            console.error('Image read failed', err);
            alert('Error al leer la imagen');
        } finally {
            setUploading(false);
            // Reset file input
            event.target.value = '';
        }
    };


    const handleHeroImageUpload = async (event, index) => {
        const file = event.target.files[0];
        if (!file) return;
        if (typeof index !== 'number') return;

        setHeroUploading(true);
        try {
            const dataUrl = await readImageAsDataUrl(file);
            if (!dataUrl) {
                alert('No se pudo leer la imagen');
                return;
            }
            const newSections = [...sections];
            const currentProps = newSections[index].props || {};
            newSections[index].props = { ...currentProps, image: dataUrl };
            setSections(newSections);
            showSuccess('Imagen cargada');
        } catch (err) {
            console.error('Image read failed', err);
            alert('Error al leer la imagen');
        } finally {
            setHeroUploading(false);
            event.target.value = '';
        }
    };

    function readImageAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    }

    const handleSectionImageUpload = async (event, index, field) => {
        const file = event.target.files[0];
        if (!file) return;
        if (typeof index !== 'number') return;
        if (!field) return;

        setHeroUploading(true);
        try {
            const dataUrl = await readImageAsDataUrl(file);
            if (!dataUrl) {
                alert('No se pudo leer la imagen');
                return;
            }
            const newSections = [...sections];
            const currentProps = newSections[index].props || {};
            newSections[index].props = { ...currentProps, [field]: dataUrl };
            setSections(newSections);
            showSuccess('Imagen cargada');
        } catch (err) {
            console.error('Image read failed', err);
            alert('Error al leer la imagen');
        } finally {
            setHeroUploading(false);
            event.target.value = '';
        }
    };

    const handleServiceIconUpload = async (event, sectionIndex, itemIndex) => {
        const file = event.target.files[0];
        if (!file) return;
        if (typeof sectionIndex !== 'number') return;
        if (typeof itemIndex !== 'number') return;

        setServiceIconUploading(true);
        try {
            const dataUrl = await readImageAsDataUrl(file);
            if (!dataUrl) {
                alert('No se pudo leer el icono');
                return;
            }
            const newSections = [...sections];
            const currentProps = newSections[sectionIndex].props || {};
            const currentItems = Array.isArray(currentProps.items) ? [...currentProps.items] : [];
            const currentItem = currentItems[itemIndex] || {};
            currentItems[itemIndex] = { ...currentItem, icon: dataUrl };
            newSections[sectionIndex].props = { ...currentProps, items: currentItems };
            setSections(newSections);
            showSuccess('Icono cargado');
        } catch (err) {
            console.error('Image read failed', err);
            alert('Error al leer el icono');
        } finally {
            setServiceIconUploading(false);
            event.target.value = '';
        }
    };

    const handleLogoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setLogoUploading(true);
        try {
            const dataUrl = await readImageAsDataUrl(file);
            if (!dataUrl) {
                alert('No se pudo leer el logo');
                return;
            }
            setSettings((prev) => ({
                ...prev,
                branding: {
                    ...prev.branding,
                    logo_url: dataUrl
                }
            }));
            showSuccess('Logo cargado');
        } catch (err) {
            console.error('Image read failed', err);
            alert('Error al leer el logo');
        } finally {
            setLogoUploading(false);
            event.target.value = '';
        }
    };

    const updateSectionProps = (index, nextProps) => {
        const newSections = [...sections];
        const currentProps = newSections[index].props || {};
        const resolved = typeof nextProps === 'function' ? nextProps(currentProps) : nextProps;
        newSections[index].props = { ...currentProps, ...resolved };
        setSections(newSections);
    };

    const updateSectionStyles = (index, nextStyles) => {
        updateSectionProps(index, (currentProps) => {
            const currentStyles = currentProps.styles || {};
            const resolved = typeof nextStyles === 'function' ? nextStyles(currentStyles) : nextStyles;
            return { styles: { ...currentStyles, ...resolved } };
        });
    };

    const handleSectionChange = (section) => {
        if (section === activeTab) return;
        setActiveTab(section);
        setEditingSection(null);
        setShowAddSection(false);
    };
    const sidebarWidthClass = activeTab === 'catalog' ? 'w-100' : 'w-100';

    if (loading) return <div className="p-10 text-center">Cargando editor...</div>;

    return (
        <AdminLayout activeSection={activeTab} onSectionChange={handleSectionChange}>
            {/* Animated Toast Notification */}
            <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-500 ease-out ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0 pointer-events-none'}`}>
                <div className="bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-green-400">
                    <div className="bg-white/20 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <div>
                        <p className="font-black text-lg tracking-tight leading-none">¡Excelente!</p>
                        <p className="text-sm font-bold text-green-50 text-nowrap">{toast.message}</p>
                    </div>
                </div>
            </div>

            <div className="flex h-[calc(100vh-64px)] overflow-hidden">
                {/* Sidebar */}
                <aside className={`${sidebarWidthClass} bg-white dark:bg-[#1a130c] border-r border-[#e5e1de] dark:border-[#3d2f21] flex flex-col`}>
                    <div className="p-4 border-b border-[#e5e1de] dark:border-[#3d2f21]">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a7560]">
                            {activeTab === 'appearance'
                                ? 'Apariencia'
                                : activeTab === 'tenants'
                                    ? 'Empresas'
                                    : activeTab === 'users'
                                        ? 'Usuarios'
                                    : activeTab === 'pricing'
                                        ? 'Precios'
                                        : activeTab === 'catalog'
                                            ? 'Catalogo'
                                            : activeTab === 'about'
                                                ? 'Sobre nosotros'
                                                : 'Inicio'}
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div key={activeTab} className="animate-in fade-in slide-in-from-right-2 duration-300">
                        {activeTab === 'appearance' ? (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-[#8a7560] mb-2">Apariencia</label>
                                    <div className="space-y-3">
                                        <div className="flex gap-3 items-center px-2">
                                            <input
                                                type="color"
                                                value={settings.theme.primary}
                                                onChange={e => setSettings({ ...settings, theme: { ...settings.theme, primary: e.target.value } })}
                                                className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8a7560]">Primario</span>
                                                <span className="text-[10px] font-black font-mono opacity-50 uppercase tracking-widest">{settings.theme.primary}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 items-center px-2">
                                            <input
                                                type="color"
                                                value={settings.theme.text || settings.theme.secondary || '#181411'}
                                                onChange={e => setSettings({ ...settings, theme: { ...settings.theme, text: e.target.value, secondary: e.target.value } })}
                                                className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8a7560]">Texto</span>
                                                <span className="text-[10px] font-black font-mono opacity-50 uppercase tracking-widest">{settings.theme.text || settings.theme.secondary || '#181411'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white/70 dark:bg-[#1a130c]">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8a7560]">Modo oscuro</p>
                                                <p className="text-[10px] font-bold text-[#181411] dark:text-white">
                                                    {settings.theme.mode === 'dark' ? 'Activado' : 'Desactivado'}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    theme: { ...settings.theme, mode: settings.theme.mode === 'dark' ? 'light' : 'dark' }
                                                })}
                                                className="text-primary"
                                            >
                                                {settings.theme.mode === 'dark' ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="5" width="22" height="14" rx="7"></rect><circle cx="16" cy="12" r="3" fill="currentColor"></circle></svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="5" width="22" height="14" rx="7"></rect><circle cx="8" cy="12" r="3"></circle></svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-[#e5e1de] dark:border-[#3d2f21]">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-[#8a7560] mb-2">Marca</label>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={settings.branding.name}
                                            placeholder="Nombre del sitio"
                                            onChange={e => setSettings({ ...settings, branding: { ...settings.branding, name: e.target.value } })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-sm"
                                        />
                                        <div className="flex items-center gap-3">
                                            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors cursor-pointer w-fit">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                    className="hidden"
                                                    disabled={logoUploading}
                                                />
                                                {logoUploading ? (
                                                    <>
                                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        <span>Subiendo...</span>
                                                    </>
                                                ) : (
                                                    <span>Subir logo</span>
                                                )}
                                            </label>
                                            {settings.branding.logo_url ? (
                                                <div className="w-10 h-10 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] overflow-hidden flex items-center justify-center">
                                                    <img src={settings.branding.logo_url} alt="Logo" className="w-8 h-8 object-contain" />
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-[#e5e1de] dark:border-[#3d2f21]">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-[#8a7560] mb-4">Pie de Página (Footer)</label>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black opacity-40 uppercase">Redes</p>
                                            <input
                                                type="text"
                                                value={settings.branding.footer?.socials.instagram}
                                                placeholder="Instagram URL"
                                                onChange={e => setSettings({ ...settings, branding: { ...settings.branding, footer: { ...settings.branding.footer, socials: { ...settings.branding.footer.socials, instagram: e.target.value } } } })}
                                                className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-[10px]"
                                            />
                                            <input
                                                type="text"
                                                value={settings.branding.footer?.socials.whatsapp}
                                                placeholder="WhatsApp (ej: 54223...)"
                                                onChange={e => setSettings({ ...settings, branding: { ...settings.branding, footer: { ...settings.branding.footer, socials: { ...settings.branding.footer.socials, whatsapp: e.target.value } } } })}
                                                className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-[10px]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black opacity-40 uppercase">Contacto</p>
                                            <input
                                                type="text"
                                                value={settings.branding.footer?.contact.address}
                                                placeholder="Dirección"
                                                onChange={e => setSettings({ ...settings, branding: { ...settings.branding, footer: { ...settings.branding.footer, contact: { ...settings.branding.footer.contact, address: e.target.value } } } })}
                                                className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-[10px]"
                                            />
                                            <input
                                                type="text"
                                                value={settings.branding.footer?.contact.phone}
                                                placeholder="Teléfono"
                                                onChange={e => setSettings({ ...settings, branding: { ...settings.branding, footer: { ...settings.branding.footer, contact: { ...settings.branding.footer.contact, phone: e.target.value } } } })}
                                                className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-[10px]"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[9px] font-black opacity-40 uppercase">Enlaces Rápidos</p>
                                            <div className="space-y-2">
                                                {settings.branding.footer?.quickLinks?.map((link, idx) => (
                                                    <div key={idx} className="flex gap-2 relative group">
                                                        <input
                                                            type="text"
                                                            value={link.label}
                                                            placeholder="Etiqueta"
                                                            onChange={e => {
                                                                const newLinks = [...settings.branding.footer.quickLinks];
                                                                newLinks[idx].label = e.target.value;
                                                                setSettings({ ...settings, branding: { ...settings.branding, footer: { ...settings.branding.footer, quickLinks: newLinks } } });
                                                            }}
                                                            className="flex-1 px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-800 border border-[#e5e1de] dark:border-[#3d2f21] text-[10px]"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={link.href}
                                                            placeholder="Link"
                                                            onChange={e => {
                                                                const newLinks = [...settings.branding.footer.quickLinks];
                                                                newLinks[idx].href = e.target.value;
                                                                setSettings({ ...settings, branding: { ...settings.branding, footer: { ...settings.branding.footer, quickLinks: newLinks } } });
                                                            }}
                                                            className="flex-1 px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-800 border border-[#e5e1de] dark:border-[#3d2f21] text-[10px] font-mono"
                                                        />
                                                        <button onClick={() => {
                                                            const newLinks = settings.branding.footer.quickLinks.filter((_, i) => i !== idx);
                                                            setSettings({ ...settings, branding: { ...settings.branding, footer: { ...settings.branding.footer, quickLinks: newLinks } } });
                                                        }} className="text-red-500 font-bold px-1 opacity-0 group-hover:opacity-100">×</button>
                                                    </div>
                                                ))}
                                                <button onClick={() => {
                                                    const newLinks = [...(settings.branding.footer?.quickLinks || []), { label: 'Nuevo link', href: '#' }];
                                                    setSettings({ ...settings, branding: { ...settings.branding, footer: { ...settings.branding.footer, quickLinks: newLinks } } });
                                                }} className="w-full py-1.5 border border-dashed border-[#e5e1de] dark:border-[#3d2f21] rounded-xl text-[9px] font-bold text-[#8a7560]">+ Añadir enlace</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'pricing' ? (
                            <div className="space-y-6 animate-in fade-in duration-300 pb-10">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-[#8a7560] tracking-widest mb-4">Ajustes por porcentaje</p>
                                    <div className="space-y-4 bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8a7560]">Minorista</p>
                                                <p className="text-[10px] text-[#8a7560]">Ajuste sobre el precio base</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={priceAdjustments.retail_percent}
                                                    onChange={(e) => updatePriceAdjustments({ retail_percent: Number(e.target.value || 0) })}
                                                    className="w-20 px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs font-mono text-right"
                                                />
                                                <span className="text-xs font-bold text-[#8a7560]">%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8a7560]">Mayorista</p>
                                                <p className="text-[10px] text-[#8a7560]">Ajuste sobre el precio base</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={priceAdjustments.wholesale_percent}
                                                    onChange={(e) => updatePriceAdjustments({ wholesale_percent: Number(e.target.value || 0) })}
                                                    className="w-20 px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs font-mono text-right"
                                                />
                                                <span className="text-xs font-bold text-[#8a7560]">%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-black uppercase text-[#8a7560] tracking-widest mb-4">Ofertas</p>
                                    <div className="space-y-4 bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8a7560]">Activar oferta</p>
                                                <p className="text-[10px] text-[#8a7560]">Descuento global por porcentaje</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => updatePriceAdjustments({ promo_enabled: !priceAdjustments.promo_enabled })}
                                                className="text-primary"
                                            >
                                                {priceAdjustments.promo_enabled ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="5" width="22" height="14" rx="7"></rect><circle cx="16" cy="12" r="3" fill="currentColor"></circle></svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="5" width="22" height="14" rx="7"></rect><circle cx="8" cy="12" r="3"></circle></svg>
                                                )}
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8a7560]">Descuento</p>
                                                <p className="text-[10px] text-[#8a7560]">Porcentaje de oferta</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={priceAdjustments.promo_percent}
                                                    onChange={(e) => updatePriceAdjustments({ promo_percent: Number(e.target.value || 0) })}
                                                    className="w-20 px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs font-mono text-right"
                                                />
                                                <span className="text-xs font-bold text-[#8a7560]">%</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-[#8a7560]">Aplica a</label>
                                            <select
                                                value={priceAdjustments.promo_scope}
                                                onChange={(e) => updatePriceAdjustments({ promo_scope: e.target.value })}
                                                className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-[10px] font-bold"
                                            >
                                                <option value="both">Minorista y mayorista</option>
                                                <option value="retail">Solo minorista</option>
                                                <option value="wholesale">Solo mayorista</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-[#8a7560]">Etiqueta</label>
                                            <input
                                                type="text"
                                                value={priceAdjustments.promo_label}
                                                onChange={(e) => updatePriceAdjustments({ promo_label: e.target.value })}
                                                placeholder="Oferta"
                                                className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-[10px]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-black uppercase text-[#8a7560] tracking-widest mb-4">Ofertas por clientes y categorias</p>
                                    <div className="space-y-4 bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-[#8a7560]">Nombre</label>
                                                <input
                                                    type="text"
                                                    value={offerForm.name}
                                                    onChange={(e) => setOfferForm((prev) => ({ ...prev, name: e.target.value }))}
                                                    placeholder="Ej: Oferta Clientes VIP"
                                                    className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-[10px]"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-[#8a7560]">Etiqueta</label>
                                                <input
                                                    type="text"
                                                    value={offerForm.label}
                                                    onChange={(e) => setOfferForm((prev) => ({ ...prev, label: e.target.value }))}
                                                    placeholder="Oferta"
                                                    className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-[10px]"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8a7560]">Descuento (%)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.1"
                                                    value={offerForm.percent}
                                                    onChange={(e) => setOfferForm((prev) => ({ ...prev, percent: Number(e.target.value || 0) }))}
                                                    className="w-24 px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs font-mono text-right"
                                                />
                                            </div>
                                            <label className="inline-flex items-center gap-2 text-[10px] font-bold text-[#8a7560]">
                                                <input
                                                    type="checkbox"
                                                    checked={offerForm.enabled}
                                                    onChange={(e) => setOfferForm((prev) => ({ ...prev, enabled: e.target.checked }))}
                                                />
                                                Activa
                                            </label>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8a7560]">Usuarios objetivo (vacio = todos)</p>
                                                <div className="max-h-36 overflow-auto rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] p-2 space-y-1">
                                                    {offerUsers.length === 0 ? (
                                                        <p className="text-[10px] text-[#8a7560]">Sin usuarios para seleccionar.</p>
                                                    ) : offerUsers.map((userItem) => (
                                                        <label key={userItem.id} className="flex items-center gap-2 text-[10px] text-[#181411] dark:text-white">
                                                            <input
                                                                type="checkbox"
                                                                checked={(offerForm.user_ids || []).includes(userItem.id)}
                                                                onChange={() => toggleOfferUser(userItem.id)}
                                                            />
                                                            <span className="truncate">{userItem.email}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8a7560]">Categorias objetivo (vacio = todas)</p>
                                                <div className="max-h-36 overflow-auto rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] p-2 space-y-1">
                                                    {categories.length === 0 ? (
                                                        <p className="text-[10px] text-[#8a7560]">Sin categorias para seleccionar.</p>
                                                    ) : categories.map((categoryItem) => (
                                                        <label key={categoryItem.id} className="flex items-center gap-2 text-[10px] text-[#181411] dark:text-white">
                                                            <input
                                                                type="checkbox"
                                                                checked={(offerForm.category_ids || []).includes(categoryItem.id)}
                                                                onChange={() => toggleOfferCategory(categoryItem.id)}
                                                            />
                                                            <span className="truncate">{categoryItem.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={submitOffer}
                                                disabled={offerFormSaving}
                                                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${offerFormSaving ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed' : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:scale-105'}`}
                                            >
                                                {editingOfferId ? 'Actualizar oferta' : 'Crear oferta'}
                                            </button>
                                            {editingOfferId ? (
                                                <button
                                                    type="button"
                                                    onClick={resetOfferForm}
                                                    className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#e5e1de] dark:border-[#3d2f21]"
                                                >
                                                    Cancelar edicion
                                                </button>
                                            ) : null}
                                        </div>

                                        <div className="pt-3 border-t border-[#e5e1de] dark:border-[#3d2f21]">
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8a7560] mb-2">Ofertas creadas</p>
                                            {offersLoading ? (
                                                <p className="text-[10px] text-[#8a7560]">Cargando ofertas...</p>
                                            ) : offersError ? (
                                                <p className="text-[10px] text-red-600">{offersError}</p>
                                            ) : offers.length === 0 ? (
                                                <p className="text-[10px] text-[#8a7560]">Todavia no hay ofertas avanzadas.</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {offers.map((offerItem) => (
                                                        <div key={offerItem.id} className="rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] p-3">
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                <div>
                                                                    <p className="text-[11px] font-black text-[#181411] dark:text-white">{offerItem.name}</p>
                                                                    <p className="text-[10px] text-[#8a7560]">
                                                                        {offerItem.percent}% · {offerItem.enabled ? 'Activa' : 'Inactiva'} · etiqueta: {offerItem.label || 'Oferta'}
                                                                    </p>
                                                                    <p className="text-[10px] text-[#8a7560]">
                                                                        Usuarios: {(offerItem.user_ids || []).length || 'Todos'} · Categorias: {(offerItem.category_ids || []).length || 'Todas'}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => editOffer(offerItem)}
                                                                        className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-[#e5e1de] dark:border-[#3d2f21]"
                                                                    >
                                                                        Editar
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeOffer(offerItem.id)}
                                                                        disabled={offerDeleteId === offerItem.id}
                                                                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${offerDeleteId === offerItem.id ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed' : 'bg-red-600 text-white'}`}
                                                                    >
                                                                        Eliminar
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'users' ? (
                            <div className="space-y-6 animate-in fade-in duration-300 pb-10">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-[#8a7560] tracking-widest mb-4">Usuarios registrados</p>
                                    <div className="space-y-3 bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                        {usersLoading ? (
                                            <div className="text-[11px] text-[#8a7560]">Cargando usuarios...</div>
                                        ) : usersError ? (
                                            <div className="text-[11px] text-red-600">{usersError}</div>
                                        ) : usersList.length === 0 ? (
                                            <div className="text-[11px] text-[#8a7560]">No hay usuarios registrados.</div>
                                        ) : (
                                            <div className="space-y-3">
                                                {usersList.map((item) => {
                                                    const roleLabel = item.role === 'wholesale'
                                                        ? 'Mayorista'
                                                        : item.role === 'retail'
                                                            ? 'Minorista'
                                                            : item.role === 'tenant_admin'
                                                                ? 'Admin'
                                                                : item.role || 'Usuario';
                                                    const statusLabel = item.status === 'pending'
                                                        ? 'Pendiente'
                                                        : item.status === 'active'
                                                            ? 'Activo'
                                                            : item.status || 'Estado';
                                                    return (
                                                        <div key={item.id} className={`flex flex-col gap-2 rounded-xl border p-3 transition-all ${selectedUser?.id === item.id ? 'border-primary bg-primary/5' : 'border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c]'}`}>
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-bold text-[#181411] dark:text-white truncate">{item.email}</p>
                                                                    <p className="text-[10px] text-[#8a7560]">ID: {item.id}</p>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-1">
                                                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                                                                        {roleLabel}
                                                                    </span>
                                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                        {statusLabel}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="space-y-1">
                                                                    <p className="text-[10px] text-[#8a7560]">
                                                                        Alta: {item.created_at ? new Date(item.created_at).toLocaleDateString('es-AR') : '-'}
                                                                    </p>
                                                                    <p className="text-[10px] text-[#8a7560]">
                                                                        Lista: {item.price_list_name || 'Automatica'}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedUser(item);
                                                                        setExpandedOrders({});
                                                                    }}
                                                                    className="text-[10px] font-black uppercase tracking-widest text-primary"
                                                                >
                                                                    Ver compras
                                                                </button>
                                                            </div>
<<<<<<< Updated upstream
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#8a7560]">
                                                                    Ajuste cliente (%)
                                                                </label>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="-90"
                                                                        max="500"
                                                                        value={usersAdjustmentDrafts[item.id] ?? Number(item.price_adjustment_percent || 0)}
                                                                        onChange={(e) => setUsersAdjustmentDrafts((prev) => ({
                                                                            ...prev,
                                                                            [item.id]: e.target.value,
                                                                        }))}
                                                                        className="w-24 px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-[10px] font-bold"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateUserPriceAdjustment(item.id)}
                                                                        disabled={usersSavingAdjustmentId === item.id}
                                                                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${usersSavingAdjustmentId === item.id ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed' : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:scale-105'}`}
                                                                    >
                                                                        Guardar
                                                                    </button>
                                                                </div>
                                                            </div>
=======
                                                            {(() => {
                                                                const draft = getUserDraft(item);
                                                                const isPendingWholesale = item.role === 'wholesale' && item.status === 'pending';
                                                                const hasChanges = hasUserDraftChanges(item);
                                                                const isSaving = userSavingId === item.id;
                                                                return (
                                                                    <div className="mt-1 space-y-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] p-3 bg-zinc-50/80 dark:bg-[#120c08]">
                                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                                            <div className="space-y-1">
                                                                                <p className="text-[9px] font-black uppercase tracking-widest text-[#8a7560]">Rol</p>
                                                                                <select
                                                                                    value={draft?.role || 'retail'}
                                                                                    onChange={(e) => setUserDrafts((prev) => ({
                                                                                        ...prev,
                                                                                        [item.id]: {
                                                                                            ...(prev[item.id] || {}),
                                                                                            role: e.target.value,
                                                                                            status: prev[item.id]?.status || item.status || 'active',
                                                                                            price_list_id: prev[item.id]?.price_list_id || item.price_list_id || 'auto',
                                                                                        },
                                                                                    }))}
                                                                                    className="w-full px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-[10px] font-bold"
                                                                                >
                                                                                    {USER_ROLE_OPTIONS.map((option) => (
                                                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <p className="text-[9px] font-black uppercase tracking-widest text-[#8a7560]">Estado</p>
                                                                                <select
                                                                                    value={draft?.status || 'active'}
                                                                                    onChange={(e) => setUserDrafts((prev) => ({
                                                                                        ...prev,
                                                                                        [item.id]: {
                                                                                            ...(prev[item.id] || {}),
                                                                                            role: prev[item.id]?.role || item.role || 'retail',
                                                                                            status: e.target.value,
                                                                                            price_list_id: prev[item.id]?.price_list_id || item.price_list_id || 'auto',
                                                                                        },
                                                                                    }))}
                                                                                    className="w-full px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-[10px] font-bold"
                                                                                >
                                                                                    {USER_STATUS_OPTIONS.map((option) => (
                                                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <p className="text-[9px] font-black uppercase tracking-widest text-[#8a7560]">Lista de precios</p>
                                                                                <select
                                                                                    value={draft?.price_list_id || 'auto'}
                                                                                    onChange={(e) => setUserDrafts((prev) => ({
                                                                                        ...prev,
                                                                                        [item.id]: {
                                                                                            ...(prev[item.id] || {}),
                                                                                            role: prev[item.id]?.role || item.role || 'retail',
                                                                                            status: prev[item.id]?.status || item.status || 'active',
                                                                                            price_list_id: e.target.value,
                                                                                        },
                                                                                    }))}
                                                                                    className="w-full px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-[10px] font-bold"
                                                                                    disabled={priceListsLoading}
                                                                                >
                                                                                    <option value="auto">Automatica</option>
                                                                                    {priceLists.map((list) => (
                                                                                        <option key={list.id} value={list.id}>
                                                                                            {list.name} ({list.type || 'special'})
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                                            <div className="text-[10px] text-[#8a7560]">
                                                                                {priceListsLoading ? 'Cargando listas de precios...' : priceListsError || ''}
                                                                            </div>
                                                                            <div className="flex flex-wrap items-center gap-2">
                                                                                {isPendingWholesale ? (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => approveWholesaleUser(item)}
                                                                                        disabled={isSaving}
                                                                                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isSaving ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed' : 'bg-amber-500 text-white hover:scale-105'}`}
                                                                                    >
                                                                                        Aprobar mayorista
                                                                                    </button>
                                                                                ) : null}
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => saveUserSetup(item)}
                                                                                    disabled={isSaving || !hasChanges}
                                                                                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isSaving || !hasChanges ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed' : 'bg-primary text-white hover:scale-105'}`}
                                                                                >
                                                                                    {isSaving ? 'Guardando...' : 'Guardar cambios'}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}
>>>>>>> Stashed changes
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setUsersPage((prev) => Math.max(1, prev - 1))}
                                                disabled={!canPrevUsers}
                                                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${canPrevUsers ? 'bg-white dark:bg-[#1a130c] border border-[#e5e1de] dark:border-[#3d2f21] hover:scale-105' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}
                                            >
                                                Anterior
                                            </button>
                                            <span className="text-[10px] font-bold text-[#8a7560]">
                                                Pagina {usersPage} de {usersTotalPages}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setUsersPage((prev) => Math.min(usersTotalPages, prev + 1))}
                                                disabled={!canNextUsers}
                                                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${canNextUsers ? 'bg-white dark:bg-[#1a130c] border border-[#e5e1de] dark:border-[#3d2f21] hover:scale-105' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}
                                            >
                                                Siguiente
                                            </button>
                                        </div>
                                        {selectedUser ? (
                                            <div className="mt-4 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] p-4">
                                                <div className="flex items-center justify-between gap-3 mb-3">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a7560]">Compras del usuario</p>
                                                        <p className="text-sm font-bold text-[#181411] dark:text-white">{selectedUser.email}</p>
                                                        <p className="text-[10px] text-[#8a7560]">
                                                            Rol: {selectedUser.role || '-'} · Estado: {selectedUser.status || '-'} · Lista: {selectedUser.price_list_name || 'Automatica'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={userOrdersFilter}
                                                            onChange={(e) => setUserOrdersFilter(e.target.value)}
                                                            className="px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-[10px] font-bold"
                                                        >
                                                            <option value="all">Todos</option>
                                                            {ORDER_STATUS_OPTIONS.map((option) => (
                                                                <option key={option.value} value={option.value}>{option.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedUser(null);
                                                            setUserOrders([]);
                                                            setUserOrdersError('');
                                                            setExpandedOrders({});
                                                        }}
                                                        className="text-[10px] font-black uppercase tracking-widest text-[#8a7560]"
                                                    >
                                                        Cerrar
                                                    </button>
                                                </div>

                                                {userOrdersLoading ? (
                                                    <div className="text-[11px] text-[#8a7560]">Cargando compras...</div>
                                                ) : userOrdersError ? (
                                                    <div className="text-[11px] text-red-600">{userOrdersError}</div>
                                                ) : userOrders.length === 0 ? (
                                                    <div className="text-[11px] text-[#8a7560]">Este usuario no tiene compras.</div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {userOrders
                                                            .filter((order) => userOrdersFilter === 'all' ? true : order.status === userOrdersFilter)
                                                            .map((order) => {
                                                            const statusLabel = ORDER_STATUS_OPTIONS.find((opt) => opt.value === order.status)?.label || order.status;
                                                            return (
                                                                <div key={order.id} className="rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] p-3">
                                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                                        <div>
                                                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8a7560]">Pedido</p>
                                                                            <p className="text-xs font-bold text-[#181411] dark:text-white">{order.id}</p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-[10px] text-[#8a7560]">Total</p>
                                                                            <p className="text-sm font-bold text-[#181411] dark:text-white">{formatOrderTotal(order.total, order.currency || 'ARS')}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                                                                        <div className="text-[10px] text-[#8a7560]">
                                                                            {order.checkout_mode === 'whatsapp' ? 'WhatsApp' : 'Transferencia'} · {order.created_at ? new Date(order.created_at).toLocaleDateString('es-AR') : '-'}
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <select
                                                                                value={order.status}
                                                                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                                                disabled={orderUpdatingId === order.id}
                                                                                className="px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-[10px] font-bold"
                                                                            >
                                                                                {ORDER_STATUS_OPTIONS.map((option) => (
                                                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                                                ))}
                                                                            </select>
                                                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                                                                                {statusLabel}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateOrderStatus(order.id, 'paid')}
                                                                            disabled={orderUpdatingId === order.id || order.status === 'paid'}
                                                                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-green-600 text-white hover:scale-105'}`}
                                                                        >
                                                                            Marcar pagado
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setExpandedOrders((prev) => ({ ...prev, [order.id]: !prev[order.id] }))}
                                                                            className="text-[10px] font-black uppercase tracking-widest text-primary"
                                                                        >
                                                                            {expandedOrders[order.id] ? 'Ocultar detalles' : 'Ver detalles'}
                                                                        </button>
                                                                    </div>
                                                                    {order.items?.length ? (
                                                                        <div className="mt-2 text-[10px] text-[#8a7560]">
                                                                            {order.items.map((item) => `${item.name} x${item.qty}`).join(' · ')}
                                                                        </div>
                                                                    ) : null}
                                                                    {expandedOrders[order.id] ? (
                                                                        <div className="mt-3 space-y-2 text-[10px] text-[#8a7560]">
                                                                            <div>
                                                                                <span className="font-black uppercase text-[#8a7560]">Cliente:</span>{' '}
                                                                                {formatCustomerName(order.customer) || '-'}
                                                                            </div>
                                                                            <div>
                                                                                <span className="font-black uppercase text-[#8a7560]">TelÃ©fono:</span>{' '}
                                                                                {formatCustomerPhone(order.customer) || '-'}
                                                                            </div>
                                                                            <div>
                                                                                <span className="font-black uppercase text-[#8a7560]">Email:</span>{' '}
                                                                                {formatCustomerEmail(order.customer) || '-'}
                                                                            </div>
                                                                            <div>
                                                                                <span className="font-black uppercase text-[#8a7560]">DirecciÃ³n:</span>{' '}
                                                                                {formatCustomerAddress(order.customer) || '-'}
                                                                            </div>
                                                                            <div>
                                                                                <span className="font-black uppercase text-[#8a7560]">Entrega:</span>{' '}
                                                                                {formatDeliveryMethod(order.customer) || '-'}
                                                                            </div>
                                                                            <div>
                                                                                <span className="font-black uppercase text-[#8a7560]">Pago:</span>{' '}
                                                                                {formatPaymentDetail(order)}
                                                                            </div>
                                                                            {getPaymentProof(order.customer) ? (
                                                                                <div>
                                                                                    <span className="font-black uppercase text-[#8a7560]">Comprobante:</span>{' '}
                                                                                    <a
                                                                                        href={getPaymentProof(order.customer)}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        className="text-primary font-bold"
                                                                                    >
                                                                                        Ver comprobante
                                                                                    </a>
                                                                                </div>
                                                                            ) : null}
                                                                            {getPaymentProof(order.customer) && isImageUrl(getPaymentProof(order.customer)) ? (
                                                                                <div className="mt-2">
                                                                                    <img
                                                                                        src={getPaymentProof(order.customer)}
                                                                                        alt="Comprobante"
                                                                                        className="max-w-full h-auto rounded-lg border border-[#e5e1de] dark:border-[#3d2f21]"
                                                                                    />
                                                                                </div>
                                                                            ) : null}
                                                                            {getPaymentProof(order.customer) && isPdfUrl(getPaymentProof(order.customer)) ? (
                                                                                <div className="mt-2">
                                                                                    <a
                                                                                        href={getPaymentProof(order.customer)}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        className="inline-flex items-center gap-2 text-primary font-bold"
                                                                                    >
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                                                                                        Ver PDF
                                                                                    </a>
                                                                                </div>
                                                                            ) : null}
                                                                            {order.customer?.notes ? (
                                                                                <div>
                                                                                    <span className="font-black uppercase text-[#8a7560]">Notas:</span>{' '}
                                                                                    {order.customer.notes}
                                                                                </div>
                                                                            ) : null}
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'tenants' ? (
                            <div className="space-y-6 animate-in fade-in duration-300 pb-10">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-[#8a7560] tracking-widest mb-4">Empresas registradas</p>
                                    <div className="space-y-3 bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                        {tenantsLoading ? (
                                            <div className="text-[11px] text-[#8a7560]">Cargando empresas...</div>
                                        ) : tenantsError ? (
                                            <div className="text-[11px] text-red-600">{tenantsError}</div>
                                        ) : tenants.length === 0 ? (
                                            <div className="text-[11px] text-[#8a7560]">No hay empresas registradas.</div>
                                        ) : (
                                            <div className="space-y-3">
                                                {tenants.map((tenant) => (
                                                    <div key={tenant.id} className="flex flex-col gap-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] p-3">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-sm font-bold text-[#181411] dark:text-white">{tenant.name}</p>
                                                                <p className="text-[10px] text-[#8a7560]">ID: {tenant.id}</p>
                                                            </div>
                                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${tenant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-zinc-200 text-zinc-600'}`}>
                                                                {tenant.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-[#8a7560]">
                                                            Creado: {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString('es-AR') : '-'}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {user?.role === 'master_admin' ? (
                                            <button
                                                type="button"
                                                onClick={loadTenants}
                                                className="mt-2 px-3 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                            >
                                                Recargar
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'catalog' ? (
                            <div className="space-y-6 animate-in fade-in duration-300 pb-10">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-[#8a7560] tracking-widest mb-4">Categorias</p>
                                    <div className="space-y-3 bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newCategoryName}
                                                placeholder="Nueva categoria"
                                                onChange={e => setNewCategoryName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleCreateCategory();
                                                    }
                                                }}
                                                className="flex-1 px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                            />
                                            <button
                                                onClick={handleCreateCategory}
                                                disabled={categorySaving || !newCategoryName.trim()}
                                                className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
                                            >
                                                {categorySaving ? 'Guardando...' : 'Agregar'}
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {categories.length === 0 ? (
                                                <span className="text-[10px] text-[#8a7560]">Sin categorias</span>
                                            ) : categories.map(cat => (
                                                <span key={cat.id} className="px-2 py-1 rounded-lg bg-white dark:bg-[#1a130c] border border-[#e5e1de] dark:border-[#3d2f21] text-[10px] font-bold text-[#181411] dark:text-white">
                                                    {cat.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-[#8a7560] tracking-widest mb-4">Crear Producto</p>
                                    <div className="space-y-3 bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                        <input
                                            type="text"
                                            value={newProduct.name}
                                            placeholder="Nombre del producto"
                                            onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs font-bold"
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newProduct.sku}
                                                placeholder="SKU"
                                                onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })}
                                                className="flex-1 px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                            />
                                            <input
                                                type="number"
                                                value={newProduct.price}
                                                placeholder="Precio"
                                                onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                                className="w-24 px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs font-mono"
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={newProduct.stock}
                                                placeholder="Stock inicial"
                                                onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
                                                className="w-24 px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs font-mono"
                                            />
                                        </div>
                                        <select
                                            value={newProduct.category_id}
                                            onChange={e => setNewProduct({ ...newProduct, category_id: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                        >
                                            <option value="">Sin categoria</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newProduct.collection}
                                                placeholder="Colección (ej: PREMIUM)"
                                                onChange={e => setNewProduct({ ...newProduct, collection: e.target.value })}
                                                className="flex-1 px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                            />
                                            <input
                                                type="text"
                                                value={newProduct.warranty}
                                                placeholder="Garantía (ej: 2 años)"
                                                onChange={e => setNewProduct({ ...newProduct, warranty: e.target.value })}
                                                className="flex-1 px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={newProduct.delivery_time}
                                            placeholder="Tiempo de entrega (ej: 24/48 h)"
                                            onChange={e => setNewProduct({ ...newProduct, delivery_time: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                        />
                                        <textarea
                                            value={newProduct.description}
                                            placeholder="Descripción"
                                            rows={2}
                                            onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                        />
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-bold uppercase text-[#8a7560] tracking-wider">Imágenes del Producto</p>

                                            {/* Image List */}
                                            {newProduct.images.length > 0 && (
                                                <div className="space-y-1.5">
                                                    {newProduct.images.map((img, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-[#2c2116] rounded-lg border border-[#e5e1de] dark:border-[#3d2f21]">
                                                            <div className="w-8 h-8 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                                                                <img src={img.url} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[9px] text-[#8a7560] truncate">{img.url?.startsWith('data:') ? 'Imagen cargada' : img.url}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const newImages = newProduct.images.map((image, i) =>
                                                                        i === idx ? { ...image, primary: true } : { ...image, primary: false }
                                                                    );
                                                                    setNewProduct({ ...newProduct, images: newImages });
                                                                }}
                                                                className={`p-1 rounded ${img.primary ? 'bg-primary text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'}`}
                                                                title="Marcar como principal"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill={img.primary ? "currentColor" : "none"} stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const newImages = newProduct.images.filter((_, i) => i !== idx);
                                                                    setNewProduct({ ...newProduct, images: newImages });
                                                                }}
                                                                className="p-1 rounded bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Add Image Input */}
                                            <div className="flex gap-2">
                                                <label className="px-3 py-2 bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-bold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors cursor-pointer flex items-center gap-1">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        className="hidden"
                                                        disabled={uploading}
                                                    />
                                                    {uploading ? (
                                                        <>
                                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                            <span>Subiendo...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            Subir imagen
                                                        </>
                                                    )}
                                                </label>
                                            </div>
                                        </div>

                                        {/* Features Editor */}
                                        <div className="space-y-2 pt-2 border-t border-[#e5e1de] dark:border-[#3d2f21]">
                                            <p className="text-[9px] font-bold uppercase text-[#8a7560] tracking-wider">Características del Producto</p>
                                            {newProduct.features.map((feature, idx) => (
                                                <div key={idx} className="flex gap-2 items-start p-2 bg-zinc-50 dark:bg-[#2c2116] rounded-lg border border-[#e5e1de] dark:border-[#3d2f21]">
                                                    <input
                                                        type="text"
                                                        value={feature.icon || ''}
                                                        placeholder="🔧"
                                                        onChange={e => {
                                                            const newFeatures = [...newProduct.features];
                                                            newFeatures[idx].icon = e.target.value;
                                                            setNewProduct({ ...newProduct, features: newFeatures });
                                                        }}
                                                        className="w-12 px-2 py-1 rounded border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs text-center"
                                                    />
                                                    <div className="flex-1 space-y-1">
                                                        <input
                                                            type="text"
                                                            value={feature.title || ''}
                                                            placeholder="Título"
                                                            onChange={e => {
                                                                const newFeatures = [...newProduct.features];
                                                                newFeatures[idx].title = e.target.value;
                                                                setNewProduct({ ...newProduct, features: newFeatures });
                                                            }}
                                                            className="w-full px-2 py-1 rounded border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs font-bold"
                                                        />
                                                        <textarea
                                                            value={feature.description || ''}
                                                            placeholder="Descripción"
                                                            rows={2}
                                                            onChange={e => {
                                                                const newFeatures = [...newProduct.features];
                                                                newFeatures[idx].description = e.target.value;
                                                                setNewProduct({ ...newProduct, features: newFeatures });
                                                            }}
                                                            className="w-full px-2 py-1 rounded border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const newFeatures = newProduct.features.filter((_, i) => i !== idx);
                                                            setNewProduct({ ...newProduct, features: newFeatures });
                                                        }}
                                                        className="p-1 rounded bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNewProduct({
                                                        ...newProduct,
                                                        features: [...newProduct.features, { icon: '✨', title: '', description: '' }]
                                                    });
                                                }}
                                                className="w-full py-2 border border-dashed border-[#e5e1de] dark:border-[#3d2f21] rounded-xl text-[9px] font-bold text-[#8a7560] hover:border-primary hover:text-primary transition-colors"
                                            >
                                                + Agregar Característica
                                            </button>
                                        </div>

                                        {/* Specifications Editor */}
                                        <div className="space-y-2 pt-2 border-t border-[#e5e1de] dark:border-[#3d2f21]">
                                            <p className="text-[9px] font-bold uppercase text-[#8a7560] tracking-wider">Especificaciones Técnicas</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="text"
                                                    value={newProduct.specifications.material || ''}
                                                    placeholder="Material"
                                                    onChange={e => setNewProduct({ ...newProduct, specifications: { ...newProduct.specifications, material: e.target.value } })}
                                                    className="px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                                />
                                                <input
                                                    type="text"
                                                    value={newProduct.specifications.medidas || ''}
                                                    placeholder="Medidas"
                                                    onChange={e => setNewProduct({ ...newProduct, specifications: { ...newProduct.specifications, medidas: e.target.value } })}
                                                    className="px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                                />
                                                <input
                                                    type="text"
                                                    value={newProduct.specifications.terminacion || ''}
                                                    placeholder="Terminación"
                                                    onChange={e => setNewProduct({ ...newProduct, specifications: { ...newProduct.specifications, terminacion: e.target.value } })}
                                                    className="px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                                />
                                                <input
                                                    type="text"
                                                    value={newProduct.specifications.descarga || ''}
                                                    placeholder="Descarga"
                                                    onChange={e => setNewProduct({ ...newProduct, specifications: { ...newProduct.specifications, descarga: e.target.value } })}
                                                    className="px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-xs"
                                                />
                                            </div>
                                        </div>

                                        <label className="flex items-center gap-2 px-2 py-1 cursor-pointer pt-2 border-t border-[#e5e1de] dark:border-[#3d2f21]">
                                            <input
                                                type="checkbox"
                                                checked={newProduct.is_featured}
                                                onChange={e => setNewProduct({ ...newProduct, is_featured: e.target.checked })}
                                                className="rounded border-[#e5e1de] text-primary focus:ring-primary"
                                            />
                                            <span className="text-[10px] font-bold text-[#8a7560]">Marcar como Destacado</span>
                                        </label>
                                        <button
                                            onClick={handleCreateProduct}
                                            className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                        >
                                            Crear Producto
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-[10px] font-black uppercase text-[#8a7560] tracking-widest">Lista de Productos</p>
                                        <button
                                            type="button"
                                            onClick={handleClearFeatured}
                                            disabled={clearingFeatured}
                                            className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 disabled:opacity-50"
                                        >
                                            {clearingFeatured ? 'Limpiando...' : 'Quitar destacados'}
                                        </button>
                                    </div>
                                    {products.map(p => (
                                        <div key={p.id} className="p-3 bg-white dark:bg-[#2c2116] border border-[#e5e1de] dark:border-[#3d2f21] rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                                                    {p.data?.images?.[0] && <img src={p.data.images[0]} alt="" className="w-full h-full object-cover" />}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-[11px] font-black text-[#181411] dark:text-white truncate">{p.name}</p>
                                                    <p className="text-[9px] font-bold text-[#8a7560]">${p.price}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="text-[9px] font-bold text-[#8a7560]">Stock: {p.stock ?? 0}</span>
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="number"
                                                            value={stockEdits[p.id] ?? ''}
                                                            placeholder="+/-"
                                                            onChange={e => setStockEdits(prev => ({ ...prev, [p.id]: e.target.value }))}
                                                            className="w-16 px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-[10px] font-mono text-right"
                                                        />
                                                        <button
                                                            onClick={() => handleAddStock(p.id)}
                                                            disabled={stockSavingId === p.id || !String(stockEdits[p.id] ?? '').trim()}
                                                            className="px-2 py-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[9px] font-black uppercase tracking-widest disabled:opacity-50"
                                                        >
                                                            {stockSavingId === p.id ? '...' : 'Sumar'}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleToggleFeatured(p.id, p.is_featured)}
                                                        className={`p-2 rounded-lg transition-all ${p.is_featured ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}
                                                        title={p.is_featured ? 'Destacado' : 'No destacado'}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={p.is_featured ? "currentColor" : "none"} stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(p.id)}
                                                        disabled={deleteLoadingId === p.id}
                                                        className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                                                        title="Eliminar"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (activeTab === 'home' || activeTab === 'about') && editingSection ? (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <button
                                    onClick={() => setEditingSection(null)}
                                    className="flex items-center gap-2 text-primary font-black text-[10px] uppercase mb-4"
                                >
                                    ← Volver a secciones
                                </button>

                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-black uppercase text-[#181411] dark:text-white">
                                        {editingSection.type.replace(/([A-Z])/g, ' $1').trim()}
                                    </h2>
                                    <button onClick={() => handleDeleteSection(editingSection.index)} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                    </button>
                                </div>

                                {/* HeroSlider Content Editor */}
                                {editingSection.type === 'HeroSlider' && (
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            value={sections[editingSection.index].props?.title || ''}
                                            placeholder="Título Principal"
                                            onChange={e => {
                                                const newSections = [...sections];
                                                newSections[editingSection.index].props = { ...newSections[editingSection.index].props, title: e.target.value };
                                                setSections(newSections);
                                            }}
                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-sm font-bold"
                                        />
                                        <textarea
                                            value={sections[editingSection.index].props?.subtitle || ''}
                                            placeholder="Subtítulo / Descripción"
                                            rows={3}
                                            onChange={e => {
                                                const newSections = [...sections];
                                                newSections[editingSection.index].props = { ...newSections[editingSection.index].props, subtitle: e.target.value };
                                                setSections(newSections);
                                            }}
                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-sm"
                                        />
                                        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors cursor-pointer w-fit">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(event) => handleHeroImageUpload(event, editingSection.index)}
                                                className="hidden"
                                                disabled={heroUploading}
                                            />
                                            {heroUploading ? (
                                                <>
                                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    <span>Subiendo...</span>
                                                </>
                                            ) : (
                                                <span>Subir imagen</span>
                                            )}
                                        </label>
</div>
                                )}

                                {editingSection.type === 'HeroSlider' && (
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            value={sections[editingSection.index].props?.tag || ''}
                                            placeholder="Etiqueta"
                                            onChange={e => {
                                                const newSections = [...sections];
                                                const currentProps = newSections[editingSection.index].props || {};
                                                newSections[editingSection.index].props = { ...currentProps, tag: e.target.value };
                                                setSections(newSections);
                                            }}
                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-sm"
                                        />
                                        <div className="grid grid-cols-1 gap-3">
                                            <input
                                                type="text"
                                                value={sections[editingSection.index].props?.primaryButton?.label || ''}
                                                placeholder="Texto boton primario"
                                                onChange={e => {
                                                    const newSections = [...sections];
                                                    const currentProps = newSections[editingSection.index].props || {};
                                                    const primaryButton = currentProps.primaryButton || {};
                                                    newSections[editingSection.index].props = {
                                                        ...currentProps,
                                                        primaryButton: { ...primaryButton, label: e.target.value }
                                                    };
                                                    setSections(newSections);
                                                }}
                                                className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-sm"
                                            />
                                            <input
                                                type="text"
                                                value={sections[editingSection.index].props?.secondaryButton?.label || ''}
                                                placeholder="Texto boton secundario"
                                                onChange={e => {
                                                    const newSections = [...sections];
                                                    const currentProps = newSections[editingSection.index].props || {};
                                                    const secondaryButton = currentProps.secondaryButton || {};
                                                    newSections[editingSection.index].props = {
                                                        ...currentProps,
                                                        secondaryButton: { ...secondaryButton, label: e.target.value }
                                                    };
                                                    setSections(newSections);
                                                }}
                                                className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-sm"
                                            />
                                        </div>
                                    </div>
                                )}
                                {editingSection.type === 'FeaturedProducts' && (
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            value={sections[editingSection.index].props?.title || ''}
                                            placeholder="Titulo de seccion"
                                            onChange={e => {
                                                const newSections = [...sections];
                                                const currentProps = newSections[editingSection.index].props || {};
                                                newSections[editingSection.index].props = { ...currentProps, title: e.target.value };
                                                setSections(newSections);
                                            }}
                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-sm font-bold"
                                        />
                                        <textarea
                                            value={sections[editingSection.index].props?.subtitle || ''}
                                            placeholder="Subtitulo"
                                            rows={3}
                                            onChange={e => {
                                                const newSections = [...sections];
                                                const currentProps = newSections[editingSection.index].props || {};
                                                newSections[editingSection.index].props = { ...currentProps, subtitle: e.target.value };
                                                setSections(newSections);
                                            }}
                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-sm"
                                        />
                                        <input
                                            type="text"
                                            value={sections[editingSection.index].props?.ctaLabel || ''}
                                            placeholder="Texto del enlace"
                                            onChange={e => {
                                                const newSections = [...sections];
                                                const currentProps = newSections[editingSection.index].props || {};
                                                newSections[editingSection.index].props = { ...currentProps, ctaLabel: e.target.value };
                                                setSections(newSections);
                                            }}
                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-sm"
                                        />
                                    </div>
                                )}
                                {editingSection.type === 'Services' && (
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            value={sections[editingSection.index].props?.title || ''}
                                            placeholder="Titulo de seccion"
                                            onChange={e => {
                                                const newSections = [...sections];
                                                const currentProps = newSections[editingSection.index].props || {};
                                                newSections[editingSection.index].props = { ...currentProps, title: e.target.value };
                                                setSections(newSections);
                                            }}
                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-sm font-bold"
                                        />
                                        <textarea
                                            value={sections[editingSection.index].props?.subtitle || ''}
                                            placeholder="Subtitulo"
                                            rows={3}
                                            onChange={e => {
                                                const newSections = [...sections];
                                                const currentProps = newSections[editingSection.index].props || {};
                                                newSections[editingSection.index].props = { ...currentProps, subtitle: e.target.value };
                                                setSections(newSections);
                                            }}
                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-sm"
                                        />
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-[#8a7560] tracking-widest mb-2">Parrafos</p>
                                            <div className="space-y-2 bg-zinc-50 dark:bg-white/5 p-2.5 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                            {(Array.isArray(sections[editingSection.index].props?.items)
                                                ? sections[editingSection.index].props.items
                                                : []
                                            ).map((item, itemIndex) => (
                                                <div key={itemIndex} className="p-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[9px] font-bold uppercase text-[#8a7560] tracking-widest">Item {itemIndex + 1}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newSections = [...sections];
                                                                const currentProps = newSections[editingSection.index].props || {};
                                                                const currentItems = Array.isArray(currentProps.items) ? [...currentProps.items] : [];
                                                                currentItems.splice(itemIndex, 1);
                                                                newSections[editingSection.index].props = { ...currentProps, items: currentItems };
                                                                setSections(newSections);
                                                            }}
                                                            className="text-[10px] font-bold text-red-500 hover:text-red-600"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={item.title || ''}
                                                        placeholder="Titulo del item"
                                                        onChange={e => {
                                                            const newSections = [...sections];
                                                            const currentProps = newSections[editingSection.index].props || {};
                                                            const currentItems = Array.isArray(currentProps.items) ? [...currentProps.items] : [];
                                                            const currentItem = currentItems[itemIndex] || {};
                                                            currentItems[itemIndex] = { ...currentItem, title: e.target.value };
                                                            newSections[editingSection.index].props = { ...currentProps, items: currentItems };
                                                            setSections(newSections);
                                                        }}
                                                        className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-sm"
                                                    />
                                                    <textarea
                                                        value={item.text ?? item.description ?? ''}
                                                        placeholder="Texto del item"
                                                        rows={3}
                                                        onChange={e => {
                                                            const newSections = [...sections];
                                                            const currentProps = newSections[editingSection.index].props || {};
                                                            const currentItems = Array.isArray(currentProps.items) ? [...currentProps.items] : [];
                                                            const currentItem = currentItems[itemIndex] || {};
                                                            currentItems[itemIndex] = { ...currentItem, text: e.target.value };
                                                            newSections[editingSection.index].props = { ...currentProps, items: currentItems };
                                                            setSections(newSections);
                                                        }}
                                                        className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-sm"
                                                    />
                                                    <div className="space-y-2">
                                                        <input
                                                            type="text"
                                                            value={item.icon || ''}
                                                            placeholder="Icono (support_agent, local_shipping)"
                                                            onChange={e => {
                                                                const newSections = [...sections];
                                                                const currentProps = newSections[editingSection.index].props || {};
                                                                const currentItems = Array.isArray(currentProps.items) ? [...currentProps.items] : [];
                                                                const currentItem = currentItems[itemIndex] || {};
                                                                currentItems[itemIndex] = { ...currentItem, icon: e.target.value };
                                                                newSections[editingSection.index].props = { ...currentProps, items: currentItems };
                                                                setSections(newSections);
                                                            }}
                                                            className="w-full px-3 py-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent text-xs"
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors cursor-pointer w-fit">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(event) => handleServiceIconUpload(event, editingSection.index, itemIndex)}
                                                                    className="hidden"
                                                                    disabled={serviceIconUploading}
                                                                />
                                                                {serviceIconUploading ? (
                                                                    <>
                                                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                                        <span>Subiendo...</span>
                                                                    </>
                                                                ) : (
                                                                    <span>Subir icono</span>
                                                                )}
                                                            </label>
                                                            {isImageIcon(item.icon) ? (
                                                                <div className="w-10 h-10 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] overflow-hidden flex items-center justify-center">
                                                                    <img src={item.icon} alt="" className="w-8 h-8 object-contain" />
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newSections = [...sections];
                                                    const currentProps = newSections[editingSection.index].props || {};
                                                    const currentItems = Array.isArray(currentProps.items) ? [...currentProps.items] : [];
                                                    currentItems.push({ icon: 'support_agent', title: 'Nuevo servicio', text: 'Descripcion del servicio' });
                                                    newSections[editingSection.index].props = { ...currentProps, items: currentItems };
                                                    setSections(newSections);
                                                }}
                                                className="w-full py-2 border border-dashed border-[#e5e1de] dark:border-[#3d2f21] rounded-xl text-[10px] font-bold text-[#8a7560] hover:border-primary hover:text-primary transition-colors"
                                            >
                                                + Agregar item
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                )}
                                {editingSection.type === 'AboutHero' && (
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-[#8a7560] tracking-widest mb-2">Contenido</p>
                                            <div className="space-y-2 bg-zinc-50 dark:bg-white/5 p-2.5 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                                <input
                                                    type="text"
                                                    value={sections[editingSection.index].props?.tagline || ''}
                                                    placeholder="Tagline"
                                                    onChange={(e) => updateSectionProps(editingSection.index, { tagline: e.target.value })}
                                                    className="w-full px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                />
                                                <input
                                                    type="text"
                                                    value={sections[editingSection.index].props?.title || ''}
                                                    placeholder="Titulo"
                                                    onChange={(e) => updateSectionProps(editingSection.index, { title: e.target.value })}
                                                    className="w-full px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[11px] font-bold"
                                                />
                                                <textarea
                                                    value={sections[editingSection.index].props?.description || ''}
                                                    placeholder="Descripcion"
                                                    rows={2}
                                                    onChange={(e) => updateSectionProps(editingSection.index, { description: e.target.value })}
                                                    className="w-full px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-[#8a7560] tracking-widest mb-2">Imagen</p>
                                            <div className="flex flex-wrap gap-2 bg-zinc-50 dark:bg-white/5 p-2.5 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                                <label className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[9px] font-bold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors cursor-pointer w-fit">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(event) => handleSectionImageUpload(event, editingSection.index, 'backgroundImage')}
                                                        className="hidden"
                                                        disabled={heroUploading}
                                                    />
                                                    {heroUploading ? (
                                                        <>
                                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                            <span>Subiendo...</span>
                                                        </>
                                                    ) : (
                                                        <span>Subir imagen</span>
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-[#8a7560] tracking-widest mb-2">Botones</p>
                                            <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-white/5 p-2.5 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                                <input
                                                    type="text"
                                                    value={sections[editingSection.index].props?.primaryButton?.label || ''}
                                                    placeholder="Texto primario"
                                                    onChange={(e) => {
                                                        const currentProps = sections[editingSection.index].props || {};
                                                        const primaryButton = currentProps.primaryButton || {};
                                                        updateSectionProps(editingSection.index, {
                                                            primaryButton: { ...primaryButton, label: e.target.value }
                                                        });
                                                    }}
                                                    className="px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                />
                                                <input
                                                    type="text"
                                                    value={sections[editingSection.index].props?.primaryButton?.link || ''}
                                                    placeholder="Link primario"
                                                    onChange={(e) => {
                                                        const currentProps = sections[editingSection.index].props || {};
                                                        const primaryButton = currentProps.primaryButton || {};
                                                        updateSectionProps(editingSection.index, {
                                                            primaryButton: { ...primaryButton, link: e.target.value }
                                                        });
                                                    }}
                                                    className="px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                />
                                                <input
                                                    type="text"
                                                    value={sections[editingSection.index].props?.secondaryButton?.label || ''}
                                                    placeholder="Texto secundario"
                                                    onChange={(e) => {
                                                        const currentProps = sections[editingSection.index].props || {};
                                                        const secondaryButton = currentProps.secondaryButton || {};
                                                        updateSectionProps(editingSection.index, {
                                                            secondaryButton: { ...secondaryButton, label: e.target.value }
                                                        });
                                                    }}
                                                    className="px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                />
                                                <input
                                                    type="text"
                                                    value={sections[editingSection.index].props?.secondaryButton?.link || ''}
                                                    placeholder="Link secundario"
                                                    onChange={(e) => {
                                                        const currentProps = sections[editingSection.index].props || {};
                                                        const secondaryButton = currentProps.secondaryButton || {};
                                                        updateSectionProps(editingSection.index, {
                                                            secondaryButton: { ...secondaryButton, link: e.target.value }
                                                        });
                                                    }}
                                                    className="px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-[#8a7560] tracking-widest mb-2">Colores</p>
                                            <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-white/5 p-2.5 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                                <div className="flex items-center justify-between gap-1">
                                                    <label className="text-[8px] font-bold uppercase text-[#8a7560] tracking-wider">Acento</label>
                                                    <input
                                                        type="color"
                                                        value={sections[editingSection.index].props?.styles?.accentColor || '#f27f0d'}
                                                        onChange={(e) => updateSectionStyles(editingSection.index, { accentColor: e.target.value })}
                                                        className="w-8 h-6 rounded-md cursor-pointer border-none bg-transparent"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between gap-1">
                                                    <label className="text-[8px] font-bold uppercase text-[#8a7560] tracking-wider">Overlay</label>
                                                    <input
                                                        type="color"
                                                        value={sections[editingSection.index].props?.styles?.overlayColor || '#221910'}
                                                        onChange={(e) => updateSectionStyles(editingSection.index, { overlayColor: e.target.value })}
                                                        className="w-8 h-6 rounded-md cursor-pointer border-none bg-transparent"
                                                    />
                                                </div>
                                                <div className="col-span-2 flex items-center justify-between gap-1">
                                                    <label className="text-[8px] font-bold uppercase text-[#8a7560] tracking-wider">Opac.</label>
                                                    <input
                                                        type="number"
                                                        step="0.05"
                                                        min="0"
                                                        max="1"
                                                        value={sections[editingSection.index].props?.styles?.overlayOpacity ?? 0.85}
                                                        onChange={(e) => updateSectionStyles(editingSection.index, { overlayOpacity: Number(e.target.value) })}
                                                        className="w-20 px-2 py-0.5 rounded border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-[11px]"
                                                        placeholder="Opacidad"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {editingSection.type === 'AboutMission' && (
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-[#8a7560] tracking-widest mb-2">Contenido</p>
                                            <div className="space-y-2 bg-zinc-50 dark:bg-white/5 p-2.5 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                                <input
                                                    type="text"
                                                    value={sections[editingSection.index].props?.eyebrow || ''}
                                                    placeholder="Eyebrow"
                                                    onChange={(e) => updateSectionProps(editingSection.index, { eyebrow: e.target.value })}
                                                    className="w-full px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                />
                                                <input
                                                    type="text"
                                                    value={sections[editingSection.index].props?.title || ''}
                                                    placeholder="Titulo"
                                                    onChange={(e) => updateSectionProps(editingSection.index, { title: e.target.value })}
                                                    className="w-full px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[11px] font-bold"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-[#8a7560] tracking-widest mb-2">Parrafos</p>
                                            <div className="space-y-2 bg-zinc-50 dark:bg-white/5 p-2.5 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                            {(Array.isArray(sections[editingSection.index].props?.paragraphs)
                                                ? sections[editingSection.index].props.paragraphs
                                                : []
                                            ).map((paragraph, idx) => (
                                                <div key={idx} className="space-y-2">
                                                    <textarea
                                                        value={paragraph}
                                                        placeholder={`Parrafo ${idx + 1}`}
                                                        rows={2}
                                                        onChange={(e) => {
                                                            const currentParagraphs = Array.isArray(sections[editingSection.index].props?.paragraphs)
                                                                ? [...sections[editingSection.index].props.paragraphs]
                                                                : [];
                                                            currentParagraphs[idx] = e.target.value;
                                                            updateSectionProps(editingSection.index, { paragraphs: currentParagraphs });
                                                        }}
                                                        className="w-full px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const currentParagraphs = Array.isArray(sections[editingSection.index].props?.paragraphs)
                                                                ? [...sections[editingSection.index].props.paragraphs]
                                                                : [];
                                                            currentParagraphs.splice(idx, 1);
                                                            updateSectionProps(editingSection.index, { paragraphs: currentParagraphs });
                                                        }}
                                                        className="text-[9px] font-bold text-red-500 hover:text-red-600"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const currentParagraphs = Array.isArray(sections[editingSection.index].props?.paragraphs)
                                                        ? [...sections[editingSection.index].props.paragraphs]
                                                        : [];
                                                    currentParagraphs.push('Nuevo parrafo');
                                                    updateSectionProps(editingSection.index, { paragraphs: currentParagraphs });
                                                }}
                                                className="w-full py-1.5 border border-dashed border-[#e5e1de] dark:border-[#3d2f21] rounded-xl text-[9px] font-bold text-[#8a7560] hover:border-primary hover:text-primary transition-colors"
                                            >
                                                + Agregar parrafo
                                            </button>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-[#8a7560] tracking-widest mb-2">Highlights</p>
                                            <div className="space-y-2 bg-zinc-50 dark:bg-white/5 p-2.5 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                            {(Array.isArray(sections[editingSection.index].props?.highlights)
                                                ? sections[editingSection.index].props.highlights
                                                : []
                                            ).map((item, itemIndex) => (
                                                <div key={itemIndex} className="p-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[9px] font-bold uppercase text-[#8a7560] tracking-widest">Item {itemIndex + 1}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const currentItems = Array.isArray(sections[editingSection.index].props?.highlights)
                                                                    ? [...sections[editingSection.index].props.highlights]
                                                                    : [];
                                                                currentItems.splice(itemIndex, 1);
                                                                updateSectionProps(editingSection.index, { highlights: currentItems });
                                                            }}
                                                            className="text-[9px] font-bold text-red-500 hover:text-red-600"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                    <select
                                                        value={item.icon || 'verified'}
                                                        onChange={(e) => {
                                                            const currentItems = Array.isArray(sections[editingSection.index].props?.highlights)
                                                                ? [...sections[editingSection.index].props.highlights]
                                                                : [];
                                                            const currentItem = currentItems[itemIndex] || {};
                                                            currentItems[itemIndex] = { ...currentItem, icon: e.target.value };
                                                            updateSectionProps(editingSection.index, { highlights: currentItems });
                                                        }}
                                                        className="w-full px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                    >
                                                        <option value="verified">Verificado</option>
                                                        <option value="eco">Eco</option>
                                                    </select>
                                                    <input
                                                        type="text"
                                                        value={item.title || ''}
                                                        placeholder="Titulo"
                                                        onChange={(e) => {
                                                            const currentItems = Array.isArray(sections[editingSection.index].props?.highlights)
                                                                ? [...sections[editingSection.index].props.highlights]
                                                                : [];
                                                            const currentItem = currentItems[itemIndex] || {};
                                                            currentItems[itemIndex] = { ...currentItem, title: e.target.value };
                                                            updateSectionProps(editingSection.index, { highlights: currentItems });
                                                        }}
                                                        className="w-full px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                    />
                                                    <textarea
                                                        value={item.text || ''}
                                                        placeholder="Texto"
                                                        rows={2}
                                                        onChange={(e) => {
                                                            const currentItems = Array.isArray(sections[editingSection.index].props?.highlights)
                                                                ? [...sections[editingSection.index].props.highlights]
                                                                : [];
                                                            const currentItem = currentItems[itemIndex] || {};
                                                            currentItems[itemIndex] = { ...currentItem, text: e.target.value };
                                                            updateSectionProps(editingSection.index, { highlights: currentItems });
                                                        }}
                                                        className="w-full px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                    />
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const currentItems = Array.isArray(sections[editingSection.index].props?.highlights)
                                                        ? [...sections[editingSection.index].props.highlights]
                                                        : [];
                                                    currentItems.push({ icon: 'verified', title: 'Nuevo item', text: 'Descripcion' });
                                                    updateSectionProps(editingSection.index, { highlights: currentItems });
                                                }}
                                                className="w-full py-1.5 border border-dashed border-[#e5e1de] dark:border-[#3d2f21] rounded-xl text-[9px] font-bold text-[#8a7560] hover:border-primary hover:text-primary transition-colors"
                                            >
                                                + Agregar item
                                            </button>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-[#8a7560] tracking-widest mb-2">Imagen</p>
                                            <div className="flex flex-wrap gap-2 bg-zinc-50 dark:bg-white/5 p-2.5 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                                <label className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[9px] font-bold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors cursor-pointer w-fit">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(event) => handleSectionImageUpload(event, editingSection.index, 'image')}
                                                        className="hidden"
                                                        disabled={heroUploading}
                                                    />
                                                    {heroUploading ? (
                                                        <>
                                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                            <span>Subiendo...</span>
                                                        </>
                                                    ) : (
                                                        <span>Subir imagen</span>
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-[#8a7560] tracking-widest mb-2">Colores</p>
                                            <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-white/5 p-2.5 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                                <div className="flex items-center justify-between gap-1">
                                                    <label className="text-[8px] font-bold uppercase text-[#8a7560] tracking-wider">Fondo</label>
                                                    <input
                                                        type="color"
                                                        value={sections[editingSection.index].props?.styles?.backgroundColor || '#ffffff'}
                                                        onChange={(e) => updateSectionStyles(editingSection.index, { backgroundColor: e.target.value })}
                                                        className="w-8 h-6 rounded-md cursor-pointer border-none bg-transparent"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between gap-1">
                                                    <label className="text-[8px] font-bold uppercase text-[#8a7560] tracking-wider">Acento</label>
                                                    <input
                                                        type="color"
                                                        value={sections[editingSection.index].props?.styles?.accentColor || '#f27f0d'}
                                                        onChange={(e) => updateSectionStyles(editingSection.index, { accentColor: e.target.value })}
                                                        className="w-8 h-6 rounded-md cursor-pointer border-none bg-transparent"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {editingSection.type === 'AboutStats' && (
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-[#8a7560] tracking-widest mb-2">Items</p>
                                            <div className="space-y-2 bg-zinc-50 dark:bg-white/5 p-2.5 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                            {(Array.isArray(sections[editingSection.index].props?.items)
                                                ? sections[editingSection.index].props.items
                                                : []
                                            ).map((item, itemIndex) => (
                                                <div key={itemIndex} className="p-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[9px] font-bold uppercase text-[#8a7560] tracking-widest">Item {itemIndex + 1}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const currentItems = Array.isArray(sections[editingSection.index].props?.items)
                                                                    ? [...sections[editingSection.index].props.items]
                                                                    : [];
                                                                currentItems.splice(itemIndex, 1);
                                                                updateSectionProps(editingSection.index, { items: currentItems });
                                                            }}
                                                            className="text-[9px] font-bold text-red-500 hover:text-red-600"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={item.value || ''}
                                                        placeholder="Valor"
                                                        onChange={(e) => {
                                                            const currentItems = Array.isArray(sections[editingSection.index].props?.items)
                                                                ? [...sections[editingSection.index].props.items]
                                                                : [];
                                                            const currentItem = currentItems[itemIndex] || {};
                                                            currentItems[itemIndex] = { ...currentItem, value: e.target.value };
                                                            updateSectionProps(editingSection.index, { items: currentItems });
                                                        }}
                                                        className="w-full px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px] font-bold"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={item.label || ''}
                                                        placeholder="Etiqueta"
                                                        onChange={(e) => {
                                                            const currentItems = Array.isArray(sections[editingSection.index].props?.items)
                                                                ? [...sections[editingSection.index].props.items]
                                                                : [];
                                                            const currentItem = currentItems[itemIndex] || {};
                                                            currentItems[itemIndex] = { ...currentItem, label: e.target.value };
                                                            updateSectionProps(editingSection.index, { items: currentItems });
                                                        }}
                                                        className="w-full px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                    />
                                                    <label className="flex items-center gap-2 text-[9px] text-[#8a7560]">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!item.accent}
                                                            onChange={(e) => {
                                                                const currentItems = Array.isArray(sections[editingSection.index].props?.items)
                                                                    ? [...sections[editingSection.index].props.items]
                                                                    : [];
                                                                const currentItem = currentItems[itemIndex] || {};
                                                                currentItems[itemIndex] = { ...currentItem, accent: e.target.checked };
                                                                updateSectionProps(editingSection.index, { items: currentItems });
                                                            }}
                                                            className="rounded border-[#e5e1de] text-primary focus:ring-primary"
                                                        />
                                                        Destacar color
                                                    </label>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const currentItems = Array.isArray(sections[editingSection.index].props?.items)
                                                        ? [...sections[editingSection.index].props.items]
                                                        : [];
                                                    currentItems.push({ value: '0', label: 'Nuevo dato' });
                                                    updateSectionProps(editingSection.index, { items: currentItems });
                                                }}
                                                className="w-full py-1.5 border border-dashed border-[#e5e1de] dark:border-[#3d2f21] rounded-xl text-[9px] font-bold text-[#8a7560] hover:border-primary hover:text-primary transition-colors"
                                            >
                                                + Agregar item
                                            </button>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-[#8a7560] tracking-widest mb-2">Colores</p>
                                            <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-white/5 p-2.5 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                                <div className="flex items-center justify-between gap-1">
                                                    <label className="text-[8px] font-bold uppercase text-[#8a7560] tracking-wider">Fondo</label>
                                                    <input
                                                        type="color"
                                                        value={sections[editingSection.index].props?.styles?.backgroundColor || '#181411'}
                                                        onChange={(e) => updateSectionStyles(editingSection.index, { backgroundColor: e.target.value })}
                                                        className="w-8 h-6 rounded-md cursor-pointer border-none bg-transparent"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between gap-1">
                                                    <label className="text-[8px] font-bold uppercase text-[#8a7560] tracking-wider">Acento</label>
                                                    <input
                                                        type="color"
                                                        value={sections[editingSection.index].props?.styles?.accentColor || '#f27f0d'}
                                                        onChange={(e) => updateSectionStyles(editingSection.index, { accentColor: e.target.value })}
                                                        className="w-8 h-6 rounded-md cursor-pointer border-none bg-transparent"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {editingSection.type === 'AboutValues' && (
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-[#8a7560] tracking-widest mb-2">Contenido</p>
                                            <div className="space-y-2 bg-zinc-50 dark:bg-white/5 p-2.5 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                                <input
                                                    type="text"
                                                    value={sections[editingSection.index].props?.title || ''}
                                                    placeholder="Titulo"
                                                    onChange={(e) => updateSectionProps(editingSection.index, { title: e.target.value })}
                                                    className="w-full px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[11px] font-bold"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-[#8a7560] tracking-widest mb-2">Items</p>
                                            <div className="space-y-2 bg-zinc-50 dark:bg-white/5 p-2.5 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                            {(Array.isArray(sections[editingSection.index].props?.items)
                                                ? sections[editingSection.index].props.items
                                                : []
                                            ).map((item, itemIndex) => (
                                                <div key={itemIndex} className="p-2 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[9px] font-bold uppercase text-[#8a7560] tracking-widest">Item {itemIndex + 1}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const currentItems = Array.isArray(sections[editingSection.index].props?.items)
                                                                    ? [...sections[editingSection.index].props.items]
                                                                    : [];
                                                                currentItems.splice(itemIndex, 1);
                                                                updateSectionProps(editingSection.index, { items: currentItems });
                                                            }}
                                                            className="text-[9px] font-bold text-red-500 hover:text-red-600"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                    <select
                                                        value={item.icon || 'quality'}
                                                        onChange={(e) => {
                                                            const currentItems = Array.isArray(sections[editingSection.index].props?.items)
                                                                ? [...sections[editingSection.index].props.items]
                                                                : [];
                                                            const currentItem = currentItems[itemIndex] || {};
                                                            currentItems[itemIndex] = { ...currentItem, icon: e.target.value };
                                                            updateSectionProps(editingSection.index, { items: currentItems });
                                                        }}
                                                        className="w-full px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                    >
                                                        <option value="quality">Calidad</option>
                                                        <option value="commitment">Compromiso</option>
                                                        <option value="innovation">Innovacion</option>
                                                    </select>
                                                    <input
                                                        type="text"
                                                        value={item.title || ''}
                                                        placeholder="Titulo"
                                                        onChange={(e) => {
                                                            const currentItems = Array.isArray(sections[editingSection.index].props?.items)
                                                                ? [...sections[editingSection.index].props.items]
                                                                : [];
                                                            const currentItem = currentItems[itemIndex] || {};
                                                            currentItems[itemIndex] = { ...currentItem, title: e.target.value };
                                                            updateSectionProps(editingSection.index, { items: currentItems });
                                                        }}
                                                        className="w-full px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                    />
                                                    <textarea
                                                        value={item.description || ''}
                                                        placeholder="Descripcion"
                                                        rows={2}
                                                        onChange={(e) => {
                                                            const currentItems = Array.isArray(sections[editingSection.index].props?.items)
                                                                ? [...sections[editingSection.index].props.items]
                                                                : [];
                                                            const currentItem = currentItems[itemIndex] || {};
                                                            currentItems[itemIndex] = { ...currentItem, description: e.target.value };
                                                            updateSectionProps(editingSection.index, { items: currentItems });
                                                        }}
                                                        className="w-full px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                    />
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const currentItems = Array.isArray(sections[editingSection.index].props?.items)
                                                        ? [...sections[editingSection.index].props.items]
                                                        : [];
                                                    currentItems.push({ icon: 'quality', title: 'Nuevo valor', description: 'Descripcion' });
                                                    updateSectionProps(editingSection.index, { items: currentItems });
                                                }}
                                                className="w-full py-1.5 border border-dashed border-[#e5e1de] dark:border-[#3d2f21] rounded-xl text-[9px] font-bold text-[#8a7560] hover:border-primary hover:text-primary transition-colors"
                                            >
                                                + Agregar item
                                            </button>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-[#8a7560] tracking-widest mb-2">Colores</p>
                                            <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-white/5 p-2.5 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                                <div className="flex items-center justify-between gap-1">
                                                    <label className="text-[8px] font-bold uppercase text-[#8a7560] tracking-wider">Fondo</label>
                                                    <input
                                                        type="color"
                                                        value={sections[editingSection.index].props?.styles?.backgroundColor || '#f8f7f5'}
                                                        onChange={(e) => updateSectionStyles(editingSection.index, { backgroundColor: e.target.value })}
                                                        className="w-8 h-6 rounded-md cursor-pointer border-none bg-transparent"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between gap-1">
                                                    <label className="text-[8px] font-bold uppercase text-[#8a7560] tracking-wider">Acento</label>
                                                    <input
                                                        type="color"
                                                        value={sections[editingSection.index].props?.styles?.accentColor || '#f27f0d'}
                                                        onChange={(e) => updateSectionStyles(editingSection.index, { accentColor: e.target.value })}
                                                        className="w-8 h-6 rounded-md cursor-pointer border-none bg-transparent"
                                                    />
                                                </div>
                                                <div className="col-span-2 flex items-center justify-between gap-1">
                                                    <label className="text-[8px] font-bold uppercase text-[#8a7560] tracking-wider">Tarjeta</label>
                                                    <input
                                                        type="color"
                                                        value={sections[editingSection.index].props?.styles?.cardBackground || '#ffffff'}
                                                        onChange={(e) => updateSectionStyles(editingSection.index, { cardBackground: e.target.value })}
                                                        className="w-8 h-6 rounded-md cursor-pointer border-none bg-transparent"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {editingSection.type === 'AboutTeam' && (
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-[#8a7560] tracking-widest mb-2">Contenido</p>
                                            <div className="space-y-2 bg-zinc-50 dark:bg-white/5 p-2.5 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                                <div className="grid grid-cols-3 gap-2">
                                                    <input
                                                        type="text"
                                                        value={sections[editingSection.index].props?.anchor || ''}
                                                        placeholder="Anchor"
                                                        onChange={(e) => updateSectionProps(editingSection.index, { anchor: e.target.value })}
                                                        className="col-span-1 px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={sections[editingSection.index].props?.title || ''}
                                                        placeholder="Titulo"
                                                        onChange={(e) => updateSectionProps(editingSection.index, { title: e.target.value })}
                                                        className="col-span-2 px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[11px] font-bold"
                                                    />
                                                </div>
                                                <textarea
                                                    value={sections[editingSection.index].props?.quote || ''}
                                                    placeholder="Cita"
                                                    rows={1}
                                                    onChange={(e) => updateSectionProps(editingSection.index, { quote: e.target.value })}
                                                    className="w-full px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        type="text"
                                                        value={sections[editingSection.index].props?.author || ''}
                                                        placeholder="Autor"
                                                        onChange={(e) => updateSectionProps(editingSection.index, { author: e.target.value })}
                                                        className="px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={sections[editingSection.index].props?.role || ''}
                                                        placeholder="Rol"
                                                        onChange={(e) => updateSectionProps(editingSection.index, { role: e.target.value })}
                                                        className="px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-[#8a7560] tracking-widest mb-2">Imagenes</p>
                                            <div className="flex flex-wrap gap-2 bg-zinc-50 dark:bg-white/5 p-2.5 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                                <label className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[9px] font-bold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors cursor-pointer w-fit">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(event) => handleSectionImageUpload(event, editingSection.index, 'avatarImage')}
                                                        className="hidden"
                                                        disabled={heroUploading}
                                                    />
                                                    {heroUploading ? (
                                                        <>
                                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                            <span>Subiendo...</span>
                                                        </>
                                                    ) : (
                                                        <span>Avatar</span>
                                                    )}
                                                </label>
                                                <label className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[9px] font-bold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors cursor-pointer w-fit">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(event) => handleSectionImageUpload(event, editingSection.index, 'backgroundImage')}
                                                        className="hidden"
                                                        disabled={heroUploading}
                                                    />
                                                    {heroUploading ? (
                                                        <>
                                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                            <span>Subiendo...</span>
                                                        </>
                                                    ) : (
                                                        <span>Fondo</span>
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-[#8a7560] tracking-widest mb-2">Colores</p>
                                            <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-white/5 p-2.5 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                                <div className="flex items-center justify-between gap-1">
                                                    <label className="text-[8px] font-bold uppercase text-[#8a7560] tracking-wider">Fondo</label>
                                                    <input
                                                        type="color"
                                                        value={sections[editingSection.index].props?.styles?.backgroundColor || '#f27f0d'}
                                                        onChange={(e) => updateSectionStyles(editingSection.index, { backgroundColor: e.target.value })}
                                                        className="w-8 h-6 rounded-md cursor-pointer border-none bg-transparent"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between gap-1">
                                                    <label className="text-[8px] font-bold uppercase text-[#8a7560] tracking-wider">Overlay</label>
                                                    <input
                                                        type="color"
                                                        value={sections[editingSection.index].props?.styles?.overlayColor || '#000000'}
                                                        onChange={(e) => updateSectionStyles(editingSection.index, { overlayColor: e.target.value })}
                                                        className="w-8 h-6 rounded-md cursor-pointer border-none bg-transparent"
                                                    />
                                                </div>
                                                <div className="col-span-2 flex items-center justify-between gap-1">
                                                    <label className="text-[8px] font-bold uppercase text-[#8a7560] tracking-wider">Opac.</label>
                                                    <input
                                                        type="number"
                                                        step="0.05"
                                                        min="0"
                                                        max="1"
                                                        value={sections[editingSection.index].props?.styles?.overlayOpacity ?? 0.25}
                                                        onChange={(e) => updateSectionStyles(editingSection.index, { overlayOpacity: Number(e.target.value) })}
                                                        className="w-20 px-2 py-0.5 rounded border border-[#e5e1de] dark:border-[#3d2f21] bg-white dark:bg-[#1a130c] text-[11px]"
                                                        placeholder="Opacidad"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {editingSection.type === 'AboutCTA' && (
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-[#8a7560] tracking-widest mb-2">Contenido</p>
                                            <div className="space-y-2 bg-zinc-50 dark:bg-white/5 p-2.5 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                                <input
                                                    type="text"
                                                    value={sections[editingSection.index].props?.title || ''}
                                                    placeholder="Titulo"
                                                    onChange={(e) => updateSectionProps(editingSection.index, { title: e.target.value })}
                                                    className="w-full px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[11px] font-bold"
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        type="text"
                                                        value={sections[editingSection.index].props?.primaryLink?.label || ''}
                                                        placeholder="Texto primario"
                                                        onChange={(e) => {
                                                            const currentProps = sections[editingSection.index].props || {};
                                                            const primaryLink = currentProps.primaryLink || {};
                                                            updateSectionProps(editingSection.index, { primaryLink: { ...primaryLink, label: e.target.value } });
                                                        }}
                                                        className="px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={sections[editingSection.index].props?.primaryLink?.link || ''}
                                                        placeholder="Link primario"
                                                        onChange={(e) => {
                                                            const currentProps = sections[editingSection.index].props || {};
                                                            const primaryLink = currentProps.primaryLink || {};
                                                            updateSectionProps(editingSection.index, { primaryLink: { ...primaryLink, link: e.target.value } });
                                                        }}
                                                        className="px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={sections[editingSection.index].props?.secondaryLink?.label || ''}
                                                        placeholder="Texto secundario"
                                                        onChange={(e) => {
                                                            const currentProps = sections[editingSection.index].props || {};
                                                            const secondaryLink = currentProps.secondaryLink || {};
                                                            updateSectionProps(editingSection.index, { secondaryLink: { ...secondaryLink, label: e.target.value } });
                                                        }}
                                                        className="px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={sections[editingSection.index].props?.secondaryLink?.link || ''}
                                                        placeholder="Link secundario"
                                                        onChange={(e) => {
                                                            const currentProps = sections[editingSection.index].props || {};
                                                            const secondaryLink = currentProps.secondaryLink || {};
                                                            updateSectionProps(editingSection.index, { secondaryLink: { ...secondaryLink, link: e.target.value } });
                                                        }}
                                                        className="px-2 py-1 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c] text-[10px]"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-[#8a7560] tracking-widest mb-2">Colores</p>
                                            <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-white/5 p-2.5 rounded-2xl border border-[#e5e1de] dark:border-[#3d2f21]">
                                                <div className="flex items-center justify-between gap-1">
                                                    <label className="text-[8px] font-bold uppercase text-[#8a7560] tracking-wider">Fondo</label>
                                                    <input
                                                        type="color"
                                                        value={sections[editingSection.index].props?.styles?.backgroundColor || '#ffffff'}
                                                        onChange={(e) => updateSectionStyles(editingSection.index, { backgroundColor: e.target.value })}
                                                        className="w-8 h-6 rounded-md cursor-pointer border-none bg-transparent"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between gap-1">
                                                    <label className="text-[8px] font-bold uppercase text-[#8a7560] tracking-wider">Acento</label>
                                                    <input
                                                        type="color"
                                                        value={sections[editingSection.index].props?.styles?.accentColor || '#f27f0d'}
                                                        onChange={(e) => updateSectionStyles(editingSection.index, { accentColor: e.target.value })}
                                                        className="w-8 h-6 rounded-md cursor-pointer border-none bg-transparent"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : activeTab === 'home' || activeTab === 'about' ? (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[10px] font-black uppercase text-[#8a7560] tracking-widest">Bloques</p>
                                    <button
                                        onClick={() => setShowAddSection(!showAddSection)}
                                        className="p-1 px-3 rounded-xl bg-primary text-white text-[10px] font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-1 shadow-lg shadow-primary/20"
                                    >
                                        + AÑADIR
                                    </button>
                                </div>

                                {showAddSection && (
                                    <div className="p-4 bg-zinc-50 dark:bg-white/5 border border-primary/20 rounded-2xl grid grid-cols-1 gap-2 animate-in zoom-in-95 duration-300">
                                        {activeTab === 'home' ? (
                                            <>
                                                <button onClick={() => handleAddSection('HeroSlider')} className="py-2.5 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-[#1a130c] border border-primary/10 rounded-xl hover:border-primary hover:bg-primary/5 transition-all shadow-sm">Hero Slider</button>
                                                <button onClick={() => handleAddSection('FeaturedProducts')} className="py-2.5 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-[#1a130c] border border-primary/10 rounded-xl hover:border-primary hover:bg-primary/5 transition-all shadow-sm">Productos Destacados</button>
                                                <button onClick={() => handleAddSection('Services')} className="py-2.5 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-[#1a130c] border border-primary/10 rounded-xl hover:border-primary hover:bg-primary/5 transition-all shadow-sm">Servicios / Beneficios</button>
                                            </>
                                        ) : null}
                                        {activeTab === 'about' ? (
                                            <>
                                                <button onClick={() => handleAddSection('AboutHero')} className="py-2.5 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-[#1a130c] border border-primary/10 rounded-xl hover:border-primary hover:bg-primary/5 transition-all shadow-sm">Hero Sobre Nosotros</button>
                                                <button onClick={() => handleAddSection('AboutMission')} className="py-2.5 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-[#1a130c] border border-primary/10 rounded-xl hover:border-primary hover:bg-primary/5 transition-all shadow-sm">Mision</button>
                                                <button onClick={() => handleAddSection('AboutStats')} className="py-2.5 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-[#1a130c] border border-primary/10 rounded-xl hover:border-primary hover:bg-primary/5 transition-all shadow-sm">Numeros</button>
                                                <button onClick={() => handleAddSection('AboutValues')} className="py-2.5 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-[#1a130c] border border-primary/10 rounded-xl hover:border-primary hover:bg-primary/5 transition-all shadow-sm">Valores</button>
                                                <button onClick={() => handleAddSection('AboutTeam')} className="py-2.5 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-[#1a130c] border border-primary/10 rounded-xl hover:border-primary hover:bg-primary/5 transition-all shadow-sm">Equipo</button>
                                                <button onClick={() => handleAddSection('AboutCTA')} className="py-2.5 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-[#1a130c] border border-primary/10 rounded-xl hover:border-primary hover:bg-primary/5 transition-all shadow-sm">CTA</button>
                                            </>
                                        ) : null}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    {sections.map((section, idx) => {
                                        const moveDirection = moveAnimations[section.id];
                                        const moveClass = moveDirection
                                            ? `animate-in ${moveDirection < 0 ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'} fade-in duration-300`
                                            : '';
                                        return (
                                            <div
                                                key={section.id}
                                                onClick={() => setEditingSection({ ...section, index: idx })}
                                                className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group hover:-translate-y-0.5 ${moveClass} ${editingSection?.index === idx ? 'border-primary bg-primary/5 shadow-sm' : 'bg-[#f5f2f0] dark:bg-[#2c2116] border-[#e5e1de] dark:border-[#3d2f21] hover:border-primary/50 hover:shadow-md'}`}
                                            >
                                                <div className="flex items-center gap-2 flex-1">
                                                    <div className="flex flex-col items-center gap-1 px-1.5 py-1 rounded-xl border border-[#e5e1de] dark:border-[#3d2f21] bg-white/80 dark:bg-[#1a130c]">
                                                        <button onClick={(e) => { e.stopPropagation(); handleMoveSection(idx, -1); }} className="text-[10px] text-[#8a7560] hover:text-primary transition-colors">↑</button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleMoveSection(idx, 1); }} className="text-[10px] text-[#8a7560] hover:text-primary transition-colors">↓</button>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-black uppercase tracking-wider text-[#181411] dark:text-white leading-tight truncate">{section.type.replace(/([A-Z])/g, ' $1').trim()}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[9px] font-bold ${section.enabled ? 'text-emerald-600' : 'text-[#8a7560]'}`}>{section.enabled ? 'Visible' : 'Oculto'}</span>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${section.enabled ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newSections = [...sections];
                                                        newSections[idx].enabled = !newSections[idx].enabled;
                                                        setSections(newSections);
                                                    }}
                                                    className={`p-1.5 rounded-lg transition-colors ${section.enabled ? 'text-green-500 bg-green-500/10' : 'text-zinc-400 bg-zinc-400/10'}`}
                                                >
                                                    {section.enabled ? '✔' : '✖'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}
                        </div>
                    </div>

                    <div className="p-4 bg-zinc-50 dark:bg-[#2c2116] border-t border-[#e5e1de] dark:border-[#3d2f21]">
                        <button
                            onClick={handleSaveAll}
                            disabled={saving}
                            className="w-full bg-primary text-white py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {saving ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Guardando...</span>
                                </div>
                            ) : 'Guardar Cambios'}
                        </button>
                    </div>
                </aside>

                {/* Preview Canvas */}
                <main className="flex-1 bg-[#f5f2f0] dark:bg-[#120c08] p-8 overflow-y-auto">
                    <div className="max-w-[1024px] mx-auto bg-white dark:bg-[#1a130c] shadow-[0_40px_100px_-12px_rgba(0,0,0,0.4)] rounded-[40px] overflow-hidden border border-[#e5e1de] dark:border-[#3d2f21] pointer-events-none scale-90 origin-top">
                        <PageBuilder sections={sections.filter(s => s.enabled)} />
                    </div>
                </main>
            </div>
        </AdminLayout>
    );
}

