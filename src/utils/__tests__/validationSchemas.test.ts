import { describe, it, expect } from 'vitest';
import { LoginSchema, RegisterSchema } from '../validationSchemas';

describe('LoginSchema', () => {
    describe('email validation', () => {
        it('should accept valid email', () => {
            const result = LoginSchema.safeParse({
                email: 'test@example.com',
                password: '123456',
            });
            expect(result.success).toBe(true);
        });

        it('should reject invalid email format', () => {
            const result = LoginSchema.safeParse({
                email: 'invalid-email',
                password: '123456',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Por favor ingresa un correo válido');
            }
        });

        it('should reject empty email', () => {
            const result = LoginSchema.safeParse({
                email: '',
                password: '123456',
            });
            expect(result.success).toBe(false);
        });
    });

    describe('password validation', () => {
        it('should accept password with 6+ characters', () => {
            const result = LoginSchema.safeParse({
                email: 'test@example.com',
                password: '123456',
            });
            expect(result.success).toBe(true);
        });

        it('should reject password with less than 6 characters', () => {
            const result = LoginSchema.safeParse({
                email: 'test@example.com',
                password: '12345',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('La contraseña debe tener al menos 6 caracteres');
            }
        });

        it('should reject empty password', () => {
            const result = LoginSchema.safeParse({
                email: 'test@example.com',
                password: '',
            });
            expect(result.success).toBe(false);
        });
    });
});

describe('RegisterSchema', () => {
    const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        orgName: 'My Company',
        nit: '12345678',
    };

    describe('firstName validation', () => {
        it('should accept valid first name', () => {
            const result = RegisterSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject first name with less than 2 characters', () => {
            const result = RegisterSchema.safeParse({
                ...validData,
                firstName: 'A',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('El nombre debe tener al menos 2 caracteres');
            }
        });
    });

    describe('lastName validation', () => {
        it('should accept valid last name', () => {
            const result = RegisterSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject last name with less than 2 characters', () => {
            const result = RegisterSchema.safeParse({
                ...validData,
                lastName: 'D',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('El apellido debe tener al menos 2 caracteres');
            }
        });
    });

    describe('email validation', () => {
        it('should accept valid email', () => {
            const result = RegisterSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid email', () => {
            const result = RegisterSchema.safeParse({
                ...validData,
                email: 'invalid-email',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Correo inválido');
            }
        });
    });

    describe('password validation', () => {
        it('should accept password with 6+ characters', () => {
            const result = RegisterSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject password with less than 6 characters', () => {
            const result = RegisterSchema.safeParse({
                ...validData,
                password: '12345',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('La contraseña debe tener al menos 6 caracteres');
            }
        });
    });

    describe('orgName validation', () => {
        it('should accept valid organization name', () => {
            const result = RegisterSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject orgName with less than 3 characters', () => {
            const result = RegisterSchema.safeParse({
                ...validData,
                orgName: 'AB',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('El nombre de la empresa es obligatorio (min 3 caracteres)');
            }
        });
    });

    describe('nit validation', () => {
        it('should accept valid nit', () => {
            const result = RegisterSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should accept missing nit (optional field)', () => {
            const { nit, ...dataWithoutNit } = validData;
            const result = RegisterSchema.safeParse(dataWithoutNit);
            expect(result.success).toBe(true);
        });

        it('should accept empty string for nit', () => {
            const result = RegisterSchema.safeParse({
                ...validData,
                nit: '',
            });
            expect(result.success).toBe(true);
        });
    });

    describe('complete validation', () => {
        it('should validate complete valid data', () => {
            const result = RegisterSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should reject when multiple fields are invalid', () => {
            const result = RegisterSchema.safeParse({
                firstName: 'A',
                lastName: 'B',
                email: 'invalid',
                password: '123',
                orgName: 'AB',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues.length).toBeGreaterThan(1);
            }
        });
    });
});
