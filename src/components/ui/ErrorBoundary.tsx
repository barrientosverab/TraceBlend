import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen w-full flex items-center justify-center bg-stone-50 p-4">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-stone-200 p-8 text-center">
                        <div className="mb-6 flex justify-center">
                            <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center">
                                <AlertTriangle className="h-10 w-10 text-red-500" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-stone-800 mb-2">
                            Algo salió mal
                        </h1>

                        <p className="text-stone-500 mb-6">
                            Lo sentimos, ha ocurrido un error inesperado en la aplicación.
                        </p>

                        {this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 rounded-lg text-left overflow-auto max-h-32">
                                <p className="text-xs font-mono text-red-700 break-words">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-emerald-200 shadow-lg"
                        >
                            <RefreshCcw size={18} />
                            Recargar Aplicación
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
