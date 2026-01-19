import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { toast } from 'sonner';
import { Button, Input } from '../components/ui';

export function CambiarPassword() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Validaciones en tiempo real
    const validations = {
        minLength: newPassword.length >= 8,
        hasUppercase: /[A-Z]/.test(newPassword),
        hasNumber: /[0-9]/.test(newPassword),
        passwordsMatch: newPassword === confirmPassword && newPassword.length > 0,
    };

    const allValid = Object.values(validations).every(v => v);

    const handleChangePassword = async () => {
        if (!allValid) {
            toast.error('Por favor cumple todos los requisitos de contraseña');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            toast.success('Contraseña actualizada exitosamente');
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } catch (error: any) {
            toast.error('Error al cambiar contraseña', {
                description: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-stone-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Key className="text-emerald-600" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-stone-800">Cambiar Contraseña</h1>
                        <p className="text-sm text-stone-500">Actualiza tu contraseña de acceso</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <Input
                        label="Nueva Contraseña"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Ingresa tu nueva contraseña"
                        required
                    />

                    <Input
                        label="Confirmar Contraseña"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirma tu nueva contraseña"
                        required
                    />

                    {/* Requisitos de contraseña */}
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                        <p className="text-xs font-bold text-stone-500 uppercase mb-3">Requisitos de Contraseña</p>
                        <div className="space-y-2">
                            <ValidationItem
                                valid={validations.minLength}
                                text="Mínimo 8 caracteres"
                            />
                            <ValidationItem
                                valid={validations.hasUppercase}
                                text="Al menos una letra mayúscula"
                            />
                            <ValidationItem
                                valid={validations.hasNumber}
                                text="Al menos un número"
                            />
                            <ValidationItem
                                valid={validations.passwordsMatch}
                                text="Las contraseñas coinciden"
                            />
                        </div>
                    </div>

                    <div className="pt-4 space-y-3">
                        <Button
                            onClick={handleChangePassword}
                            isLoading={loading}
                            disabled={!allValid || loading}
                            variant="primary"
                            size="lg"
                            fullWidth
                        >
                            Actualizar Contraseña
                        </Button>

                        <button
                            onClick={() => navigate(-1)}
                            className="w-full text-stone-500 text-sm hover:underline"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface ValidationItemProps {
    valid: boolean;
    text: string;
}

function ValidationItem({ valid, text }: ValidationItemProps) {
    return (
        <div className="flex items-center gap-2">
            {valid ? (
                <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
            ) : (
                <AlertCircle size={16} className="text-stone-300 flex-shrink-0" />
            )}
            <span className={`text-sm ${valid ? 'text-emerald-700 font-medium' : 'text-stone-400'}`}>
                {text}
            </span>
        </div>
    );
}
