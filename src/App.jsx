import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Recepcion } from './pages/Recepcion';

// Componentes "Placeholder" (temporales) para probar la navegación
const Dashboard = () => <h1 className="text-3xl font-bold text-emerald-900">Panel Principal</h1>;
const Laboratorio = () => <h1 className="text-3xl font-bold text-emerald-900">Laboratorio de Calidad</h1>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          
          <Route index element={<Dashboard />} />
          
          {/* 2. CAMBIO: Aquí usamos el componente importado */}
          <Route path="recepcion" element={<Recepcion />} />
          
          <Route path="laboratorio" element={<Laboratorio />} />
          <Route path="*" element={<div className="text-red-500">Página no encontrada</div>} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;