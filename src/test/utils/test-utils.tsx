import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    route?: string;
    withAuth?: boolean;
}

/**
 * Custom render function that wraps components with necessary providers
 * @param ui - React component to render
 * @param options - Additional render options
 */
export function renderWithRouter(
    ui: ReactElement,
    { route = '/', withAuth = false, ...renderOptions }: CustomRenderOptions = {}
) {
    window.history.pushState({}, 'Test page', route);

    function Wrapper({ children }: { children: React.ReactNode }) {
        if (withAuth) {
            return (
                <BrowserRouter>
                    <AuthProvider>{children}</AuthProvider>
                </BrowserRouter>
            );
        }
        return <BrowserRouter>{children}</BrowserRouter>;
    }

    return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Render with Auth Provider for testing authenticated components
 */
export function renderWithAuth(ui: ReactElement, options?: CustomRenderOptions) {
    return renderWithRouter(ui, { ...options, withAuth: true });
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { renderWithRouter as render };
