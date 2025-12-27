import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Login } from '../Login';
import * as supabaseClient from '@/services/supabaseClient';

// Mock the supabase client
vi.mock('@/services/supabaseClient', () => ({
    supabase: {
        auth: {
            signInWithPassword: vi.fn(),
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

describe('Login', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderLogin = () => {
        return render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );
    };

    describe('rendering', () => {
        it('should render login form with all elements', () => {
            renderLogin();

            expect(screen.getByText('Trace Blend')).toBeInTheDocument();
            expect(screen.getByText('Sistema de Gestión de Tostaduría')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
        });

        it('should render link to password recovery', () => {
            renderLogin();
            expect(screen.getByText('¿Olvidaste tu contraseña?')).toBeInTheDocument();
        });

        it('should render link to registration', () => {
            renderLogin();
            expect(screen.getByText(/regístrate gratis/i)).toBeInTheDocument();
        });
    });

    describe('form submission', () => {
        it('should call signInWithPassword with correct credentials', async () => {
            const user = userEvent.setup();
            const mockSignIn = vi.mocked(supabaseClient.supabase.auth.signInWithPassword);
            mockSignIn.mockResolvedValue({ data: { user: {}, session: {} }, error: null } as any);

            renderLogin();

            const emailInput = screen.getByPlaceholderText('Correo electrónico');
            const passwordInput = screen.getByPlaceholderText('Contraseña');
            const submitButton = screen.getByRole('button', { name: /ingresar/i });

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(submitButton);

            await waitFor(() => {
                expect(mockSignIn).toHaveBeenCalledWith({
                    email: 'test@example.com',
                    password: 'password123',
                });
            });
        });

        it('should navigate to home on successful login', async () => {
            const user = userEvent.setup();
            const mockSignIn = vi.mocked(supabaseClient.supabase.auth.signInWithPassword);
            mockSignIn.mockResolvedValue({
                data: { user: { id: 'user-123' }, session: { access_token: 'token' } },
                error: null,
            } as any);

            renderLogin();

            const emailInput = screen.getByPlaceholderText('Correo electrónico');
            const passwordInput = screen.getByPlaceholderText('Contraseña');
            const submitButton = screen.getByRole('button', { name: /ingresar/i });

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/');
            });
        });

        it('should show error toast on failed login', async () => {
            const user = userEvent.setup();
            const { toast } = await import('sonner');
            const mockSignIn = vi.mocked(supabaseClient.supabase.auth.signInWithPassword);
            mockSignIn.mockResolvedValue({
                data: { user: null, session: null },
                error: new Error('Invalid credentials'),
            } as any);

            renderLogin();

            const emailInput = screen.getByPlaceholderText('Correo electrónico');
            const passwordInput = screen.getByPlaceholderText('Contraseña');
            const submitButton = screen.getByRole('button', { name: /ingresar/i });

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'wrongpassword');
            await user.click(submitButton);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Error de acceso', expect.any(Object));
            });

            // Should not navigate on error
            expect(mockNavigate).not.toHaveBeenCalled();
        });

        it('should disable submit button while submitting', async () => {
            const user = userEvent.setup();
            const mockSignIn = vi.mocked(supabaseClient.supabase.auth.signInWithPassword);

            // Make the promise never resolve to test loading state
            mockSignIn.mockImplementation(() => new Promise(() => { }));

            renderLogin();

            const emailInput = screen.getByPlaceholderText('Correo electrónico');
            const passwordInput = screen.getByPlaceholderText('Contraseña');
            const submitButton = screen.getByRole('button', { name: /ingresar/i });

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(submitButton);

            await waitFor(() => {
                expect(submitButton).toBeDisabled();
            });
        });

        it('should not submit with empty fields', async () => {
            const user = userEvent.setup();
            const mockSignIn = vi.mocked(supabaseClient.supabase.auth.signInWithPassword);
            mockSignIn.mockResolvedValue({ data: { user: {}, session: {} }, error: null } as any);

            renderLogin();

            const submitButton = screen.getByRole('button', { name: /ingresar/i });
            await user.click(submitButton);

            // Should not call signIn with empty fields
            expect(mockSignIn).not.toHaveBeenCalled();
        });
    });
});
