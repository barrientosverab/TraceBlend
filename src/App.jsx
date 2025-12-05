import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/layout/Layout';

// Páginas
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Usuarios } from './pages/Usuarios';
import { Recepcion } from './pages/Recepcion';
import { Proveedores } from './pages/Proveedores';
import { Laboratorio } from './pages/Laboratorio';
import { Trilla } from './pages/Trilla';
import { Tueste } from './pages/Tueste';
import { Empaque } from './pages/Empaque';
import { Ventas } from './pages/Ventas';
import { Productos } from './pages/Productos';
import { RecuperarPassword } from './pages/RecuperarPassword';
import { RestablecerPassword } from './pages/RestablecerPassword';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
        <p className="ml-3 text-emerald-800 font-medium">Iniciando sistema...</p>
      </div>
    );
  }

  // Rutas Públicas
  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/recuperar" element={<RecuperarPassword />} />
          <Route path="/restablecer-password" element={<RestablecerPassword />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Rutas Privadas
  return (
    <BrowserRouter>
      <Routes>
        {/* CORRECCIÓN: El Layout envuelve a las demás rutas (No se cierra aquí con />) */}
        <Route path="/" element={<Layout />}>
          
          <Route index element={<Dashboard />} />
          <Route path="usuarios" element={<Usuarios/>}/>
          <Route path="proveedores" element={<Proveedores />} />
          <Route path="recepcion" element={<Recepcion />} />
          <Route path="laboratorio" element={<Laboratorio />} />
          <Route path="trilla" element={<Trilla />} />
          <Route path="tueste" element={<Tueste/>} />
          <Route path="empaque" element={<Empaque />} />
          <Route path="ventas" element={<Ventas />} />
          <Route path="productos" element={<Productos />} />          
          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
          
        </Route> {/* <--- AQUÍ se cierra el Layout */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;