import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import StoreLayout from '../../components/layout/StoreLayout';
import { navigate } from '../../utils/navigation';

export default function SignupPage() {
    const { signup } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('retail');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signup(email, password, role);
            navigate('/profile');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <StoreLayout>
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
                <div className="max-w-md w-full bg-white dark:bg-[#1a130c] p-10 rounded-2xl shadow-xl border border-[#e5e1de] dark:border-[#3d2f21]">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-black text-[#181411] dark:text-white">Crear cuenta</h2>
                        <p className="text-[#8a7560] mt-2">Unite a Sanitarios El Teflon</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-[#181411] dark:text-white mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white"
                                placeholder="tu@email.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#181411] dark:text-white mb-2">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-[#e5e1de] dark:border-[#3d2f21] bg-transparent focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#181411] dark:text-white mb-2">Tipo de cuenta</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setRole('retail')}
                                    className={`py-3 rounded-lg border font-bold text-sm transition-all ${role === 'retail'
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-transparent border-[#e5e1de] dark:border-[#3d2f21] text-[#8a7560]'
                                        }`}
                                >
                                    Minorista
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('wholesale')}
                                    className={`py-3 rounded-lg border font-bold text-sm transition-all ${role === 'wholesale'
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-transparent border-[#e5e1de] dark:border-[#3d2f21] text-[#8a7560]'
                                        }`}
                                >
                                    Mayorista
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-4 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70"
                        >
                            {loading ? 'Creando cuenta...' : 'Registrarse'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-[#8a7560] text-sm">
                            ¿Ya tenés cuenta?{' '}
                            <button
                                onClick={() => navigate('/login')}
                                className="text-primary font-bold hover:underline"
                            >
                                Iniciar sesión
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </StoreLayout>
    );
}
