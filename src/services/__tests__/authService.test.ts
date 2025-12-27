import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserProfile, getCurrentOrgId, getCurrentUserId } from '../authService';
import { supabase } from '../supabaseClient';

// Mock the supabaseClient module
vi.mock('../supabaseClient', () => ({
    supabase: {
        auth: {
            getUser: vi.fn(),
        },
        from: vi.fn(),
    },
}));

describe('authService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getUserProfile', () => {
        it('should return null when user is not authenticated', async () => {
            vi.mocked(supabase.auth.getUser).mockResolvedValue({
                data: { user: null },
                error: null,
            } as any);

            const result = await getUserProfile();
            expect(result).toBeNull();
        });

        it('should return user profile when authenticated', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
            };

            const mockProfileData = {
                organization_id: 'org-456',
                role: 'admin',
                first_name: 'John',
            };

            vi.mocked(supabase.auth.getUser).mockResolvedValue({
                data: { user: mockUser },
                error: null,
            } as any);

            const mockSelect = vi.fn().mockReturnThis();
            const mockEq = vi.fn().mockReturnThis();
            const mockSingle = vi.fn().mockResolvedValue({
                data: mockProfileData,
                error: null,
            });

            vi.mocked(supabase.from).mockReturnValue({
                select: mockSelect,
                eq: mockEq,
                single: mockSingle,
            } as any);

            const result = await getUserProfile();

            expect(result).toEqual({
                id: 'user-123',
                email: 'test@example.com',
                organization_id: 'org-456',
                role: 'admin',
                first_name: 'John',
            });

            expect(supabase.from).toHaveBeenCalledWith('profiles');
            expect(mockSelect).toHaveBeenCalledWith('organization_id, role, first_name');
            expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
        });

        it('should return null when profile data fetch fails', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
            };

            vi.mocked(supabase.auth.getUser).mockResolvedValue({
                data: { user: mockUser },
                error: null,
            } as any);

            const mockSelect = vi.fn().mockReturnThis();
            const mockEq = vi.fn().mockReturnThis();
            const mockSingle = vi.fn().mockResolvedValue({
                data: null,
                error: new Error('Database error'),
            });

            vi.mocked(supabase.from).mockReturnValue({
                select: mockSelect,
                eq: mockEq,
                single: mockSingle,
            } as any);

            const result = await getUserProfile();
            expect(result).toBeNull();
        });
    });

    describe('getCurrentOrgId', () => {
        it('should return organization ID when user has one', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
            };

            const mockProfileData = {
                organization_id: 'org-456',
                role: 'admin',
                first_name: 'John',
            };

            vi.mocked(supabase.auth.getUser).mockResolvedValue({
                data: { user: mockUser },
                error: null,
            } as any);

            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: mockProfileData,
                    error: null,
                }),
            } as any);

            const result = await getCurrentOrgId();
            expect(result).toBe('org-456');
        });

        it('should throw error when user has no organization', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
            };

            const mockProfileData = {
                organization_id: null,
                role: 'admin',
                first_name: 'John',
            };

            vi.mocked(supabase.auth.getUser).mockResolvedValue({
                data: { user: mockUser },
                error: null,
            } as any);

            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: mockProfileData,
                    error: null,
                }),
            } as any);

            await expect(getCurrentOrgId()).rejects.toThrow('No tienes una organización asignada.');
        });
    });

    describe('getCurrentUserId', () => {
        it('should return user ID when authenticated', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
            };

            vi.mocked(supabase.auth.getUser).mockResolvedValue({
                data: { user: mockUser },
                error: null,
            } as any);

            const result = await getCurrentUserId();
            expect(result).toBe('user-123');
        });

        it('should return undefined when not authenticated', async () => {
            vi.mocked(supabase.auth.getUser).mockResolvedValue({
                data: { user: null },
                error: null,
            } as any);

            const result = await getCurrentUserId();
            expect(result).toBeUndefined();
        });
    });
});
