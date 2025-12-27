import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Registro } from '../Registro';
import * as supabaseClient from '@/services/supabaseClient';

// Mock the supabase client
vi.mock('@/services/supabaseClient', () => ({
    supabase: {
        auth: {
            signUp: vi.fn(),
        },
    },
}));

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock sonner toast
vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

describe('Registro', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderRegistro = () => {
        return render(
            <BrowserRouter>
                <Registro />
            </BrowserRouter>
        );
    };

    describe('Step 1 - Personal Data', () => {
        it('should render step 1 with all fields', () => {
            renderRegistro();

            expect(screen.getByText('Comienza tu Prueba Gratis')).toBeInTheDocument();
            expect(screen.getByText('1. Tus Datos')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Nombre')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Apellido')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Correo Electrónico')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Contraseña segura')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /siguiente/i })).toBeInTheDocument();
        });

        it('should render link to login', () => {
            renderRegistro();
            expect(screen.getByText(/iniciar sesión/i)).toBeInTheDocument();
        });

        it('should show progress bar at 50% on step 1', () => {
            renderRegistro();
            const progressBar = document.querySelector('.w-1\\/2');
            expect(progressBar).toBeInTheDocument();
        });

        it('should navigate to step 2 when clicking Siguiente with valid data', async () => {
            const user = userEvent.setup();
            renderRegistro();

            // Fill step 1 fields
            await user.type(screen.getByPlaceholderText('Nombre'), 'John');
            await user.type(screen.getByPlaceholderText('Apellido'), 'Doe');
            await user.type(screen.getByPlaceholderText('Correo Electrónico'), 'john@example.com');
            await user.type(screen.getByPlaceholderText('Contraseña segura'), 'password123');

            // Click next
            const nextButton = screen.getByRole('button', { name: /siguiente/i });
            await user.click(nextButton);

            // Should show step 2
            await waitFor(() => {
                expect(screen.getByText('2. Tu Tostaduría')).toBeInTheDocument();
            });
        });

        it('should not navigate to step 2 with invalid data', async () => {
            const user = userEvent.setup();
            renderRegistro();

            // Fill with invalid data (short name)
            await user.type(screen.getByPlaceholderText('Nombre'), 'J');
            await user.type(screen.getByPlaceholderText('Apellido'), 'Doe');
            await user.type(screen.getByPlaceholderText('Correo Electrónico'), 'invalid-email');
            await user.type(screen.getByPlaceholderText('Contraseña segura'), '123');

            // Click next
            const nextButton = screen.getByRole('button', { name: /siguiente/i });
            await user.click(nextButton);

            // Should stay on step 1 (error messages would appear)
            expect(screen.getByText('1. Tus Datos')).toBeInTheDocument();
            expect(screen.queryByText('2. Tu Tostaduría')).not.toBeInTheDocument();
        });
    });

    describe('Step 2 - Company Data', () => {
        const fillStep1AndAdvance = async (user: ReturnType<typeof userEvent.setup>) => {
            await user.type(screen.getByPlaceholderText('Nombre'), 'John');
            await user.type(screen.getByPlaceholderText('Apellido'), 'Doe');
            await user.type(screen.getByPlaceholderText('Correo Electrónico'), 'john@example.com');
            await user.type(screen.getByPlaceholderText('Contraseña segura'), 'password123');
            await user.click(screen.getByRole('button', { name: /siguiente/i }));
            await waitFor(() => {
                expect(screen.getByText('2. Tu Tostaduría')).toBeInTheDocument();
            });
        };

        it('should render step 2 fields after advancing from step 1', async () => {
            const user = userEvent.setup();
            renderRegistro();
            await fillStep1AndAdvance(user);

            expect(screen.getByPlaceholderText('Nombre de la Empresa')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('NIT / Tax ID (Opcional)')).toBeInTheDocument();
            expect(screen.getByText('Plan Prueba 14 Días')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /crear mi cuenta/i })).toBeInTheDocument();
        });

        it('should show progress bar at 100% on step 2', async () => {
            const user = userEvent.setup();
            renderRegistro();
            await fillStep1AndAdvance(user);

            const progressBar = document.querySelector('.w-full');
            expect(progressBar).toBeInTheDocument();
        });

        it('should go back to step 1 when clicking Volver', async () => {
            const user = userEvent.setup();
            renderRegistro();
            await fillStep1AndAdvance(user);

            // Click back button
            const backButton = screen.getByRole('button', { name: /volver/i });
            await user.click(backButton);

            // Should show step 1 again
            await waitFor(() => {
                expect(screen.getByText('1. Tus Datos')).toBeInTheDocument();
            });
        });

        it('should maintain step 1 data when going back', async () => {
            const user = userEvent.setup();
            renderRegistro();

            // Fill step 1
            const nombreInput = screen.getByPlaceholderText('Nombre');
            await user.type(nombreInput, 'John');
            await user.type(screen.getByPlaceholderText('Apellido'), 'Doe');
            await user.type(screen.getByPlaceholderText('Correo Electrónico'), 'john@example.com');
            await user.type(screen.getByPlaceholderText('Contraseña segura'), 'password123');
            await user.click(screen.getByRole('button', { name: /siguiente/i }));

            await waitFor(() => {
                expect(screen.getByText('2. Tu Tostaduría')).toBeInTheDocument();
            });

            // Go back
            await user.click(screen.getByRole('button', { name: /volver/i }));

            await waitFor(() => {
                expect(screen.getByText('1. Tus Datos')).toBeInTheDocument();
            });

            // Check if data is maintained
            expect(nombreInput).toHaveValue('John');
        });
    });

    describe('Form Submission', () => {
        const fillCompleteForm = async (user: ReturnType<typeof userEvent.setup>) => {
            // Step 1
            await user.type(screen.getByPlaceholderText('Nombre'), 'John');
            await user.type(screen.getByPlaceholderText('Apellido'), 'Doe');
            await user.type(screen.getByPlaceholderText('Correo Electrónico'), 'john@example.com');
            await user.type(screen.getByPlaceholderText('Contraseña segura'), 'password123');
            await user.click(screen.getByRole('button', { name: /siguiente/i }));

            await waitFor(() => {
                expect(screen.getByText('2. Tu Tostaduría')).toBeInTheDocument();
            });

            // Step 2
            await user.type(screen.getByPlaceholderText('Nombre de la Empresa'), 'My Coffee Company');
            await user.type(screen.getByPlaceholderText('NIT / Tax ID (Opcional)'), '12345678');
        };

        // TODO: Fix input contamination issue in this test
        // eslint-disable-next-line vitest/no-disabled-tests
        it.skip('should call signUp with correct data', async () => {
            const user = userEvent.setup();
            const mockSignUp = vi.mocked(supabaseClient.supabase.auth.signUp);
            mockSignUp.mockResolvedValue({
                data: { user: { id: 'user-123' }, session: {} },
                error: null,
            } as any);

            renderRegistro();
            await fillCompleteForm(user);

            const submitButton = screen.getByRole('button', { name: /crear mi cuenta/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(mockSignUp).toHaveBeenCalledWith({
                    email: 'john@example.com',
                    password: 'password123',
                    options: {
                        data: {
                            first_name: 'John',
                            last_name: 'Doe',
                            role: 'administrador',
                            org_name: 'My Coffee Company',
                            tax_id: '12345678',
                        },
                    },
                });
            });
        });

        it('should navigate to home on successful registration', async () => {
            const user = userEvent.setup();
            const mockSignUp = vi.mocked(supabaseClient.supabase.auth.signUp);
            mockSignUp.mockResolvedValue({
                data: { user: { id: 'user-123' }, session: {} },
                error: null,
            } as any);

            renderRegistro();
            await fillCompleteForm(user);

            const submitButton = screen.getByRole('button', { name: /crear mi cuenta/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/');
            });
        });

        it('should show success toast on successful registration', async () => {
            const user = userEvent.setup();
            const { toast } = await import('sonner');
            const mockSignUp = vi.mocked(supabaseClient.supabase.auth.signUp);
            mockSignUp.mockResolvedValue({
                data: { user: { id: 'user-123' }, session: {} },
                error: null,
            } as any);

            renderRegistro();
            await fillCompleteForm(user);

            const submitButton = screen.getByRole('button', { name: /crear mi cuenta/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(toast.success).toHaveBeenCalledWith('¡Cuenta creada con éxito!');
            });
        });

        it('should show error toast on failed registration', async () => {
            const user = userEvent.setup();
            const { toast } = await import('sonner');
            const mockSignUp = vi.mocked(supabaseClient.supabase.auth.signUp);
            mockSignUp.mockResolvedValue({
                data: { user: null, session: null },
                error: new Error('User already exists'),
            } as any);

            renderRegistro();
            await fillCompleteForm(user);

            const submitButton = screen.getByRole('button', { name: /crear mi cuenta/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Error en el registro', expect.any(Object));
            });

            // Should not navigate on error
            expect(mockNavigate).not.toHaveBeenCalled();
        });

        it('should disable submit button while submitting', async () => {
            const user = userEvent.setup();
            const mockSignUp = vi.mocked(supabaseClient.supabase.auth.signUp);
            mockSignUp.mockImplementation(() => new Promise(() => { }));

            renderRegistro();
            await fillCompleteForm(user);

            const submitButton = screen.getByRole('button', { name: /crear mi cuenta/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(submitButton).toBeDisabled();
            });
        });

        it('should handle optional NIT field', async () => {
            const user = userEvent.setup();
            const mockSignUp = vi.mocked(supabaseClient.supabase.auth.signUp);
            mockSignUp.mockResolvedValue({
                data: { user: { id: 'user-123' }, session: {} },
                error: null,
            } as any);

            renderRegistro();

            // Fill step 1
            await user.type(screen.getByPlaceholderText('Nombre'), 'John');
            await user.type(screen.getByPlaceholderText('Apellido'), 'Doe');
            await user.type(screen.getByPlaceholderText('Correo Electrónico'), 'john@example.com');
            await user.type(screen.getByPlaceholderText('Contraseña segura'), 'password123');
            await user.click(screen.getByRole('button', { name: /siguiente/i }));

            await waitFor(() => {
                expect(screen.getByText('2. Tu Tostaduría')).toBeInTheDocument();
            });

            // Fill only org name, leave NIT empty
            await user.type(screen.getByPlaceholderText('Nombre de la Empresa'), 'My Coffee Company');

            const submitButton = screen.getByRole('button', { name: /crear mi cuenta/i });
            await user.click(submitButton);

            // Should still work without NIT
            await waitFor(() => {
                expect(mockSignUp).toHaveBeenCalled();
            });
        });
    });
});
