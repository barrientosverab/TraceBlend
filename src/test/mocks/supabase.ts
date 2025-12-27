import { vi } from 'vitest';

// Mock Supabase client
export const mockSupabaseClient = {
    auth: {
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn(),
        getUser: vi.fn(),
        onAuthStateChange: vi.fn(() => ({
            data: { subscription: { unsubscribe: vi.fn() } },
        })),
    },
    from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        order: vi.fn().mockReturnThis(),
    })),
};

// Mock createClient function
export const createClient = vi.fn(() => mockSupabaseClient);

// Helper to reset all mocks
export const resetSupabaseMocks = () => {
    mockSupabaseClient.auth.signUp.mockReset();
    mockSupabaseClient.auth.signInWithPassword.mockReset();
    mockSupabaseClient.auth.signOut.mockReset();
    mockSupabaseClient.auth.getSession.mockReset();
    mockSupabaseClient.auth.getUser.mockReset();
    mockSupabaseClient.from.mockClear();
};

// Helper to mock successful login
export const mockSuccessfulLogin = () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
            user: { id: 'user-123', email: 'test@example.com' },
            session: { access_token: 'token-123' },
        },
        error: null,
    });
};

// Helper to mock failed login
export const mockFailedLogin = (message = 'Invalid credentials') => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: new Error(message),
    });
};

// Helper to mock successful signup
export const mockSuccessfulSignUp = () => {
    mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: {
            user: { id: 'user-123', email: 'test@example.com' },
            session: { access_token: 'token-123' },
        },
        error: null,
    });
};

// Helper to mock failed signup
export const mockFailedSignUp = (message = 'User already exists') => {
    mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: new Error(message),
    });
};

// Helper to mock no session (logged out state)
export const mockNoSession = () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
    });
    mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
    });
};

// Helper to mock active session
export const mockActiveSession = (userId = 'user-123', email = 'test@example.com') => {
    const mockUser = { id: userId, email };
    const mockSession = { access_token: 'token-123', user: mockUser };

    mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
    });

    mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
    });
};
