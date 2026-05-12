import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { registrarApertura } from '../services/cajaService';
import { toast } from 'sonner';
import { PlayCircle, DollarSign, Loader2 } from 'lucide-react';

interface Props {
  onAperturaCompletada: () => void; // <-- Esta es la señal de éxito
}

export function AperturaCaja({ onAperturaCompletada }: Props) {
  const { orgId, user } = useAuth();
  const [monto, setMonto] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApertura = async () => {
    if (!monto) return toast.warning("Ingresa el monto inicial");
    
    setLoading(true);
    try {
      // 1. Enviamos el dato a la base de datos
      await registrarApertura(Number(monto), orgId!, user!.id);
      toast.success("¡Caja abierta exitosamente!");
      
      // 2. Avisamos al componente padre (Ventas) que ya terminamos
      onAperturaCompletada();
    } catch (e) {
      toast.error("Error al abrir caja");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-stone-100">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <PlayCircle size={40} className="text-emerald-600"/>
        </div>
        
        <h1 className="text-2xl font-bold text-stone-800 mb-2">Iniciar Turno</h1>
        <p className="text-stone-500 mb-8">Ingresa el monto de efectivo inicial.</p>

        <div className="relative mb-6">
          <DollarSign className="absolute left-4 top-4 text-stone-400"/>
          <input 
            type="number" 
            autoFocus
            className="w-full pl-12 p-4 text-2xl font-bold border-2 border-stone-200 rounded-2xl outline-none focus:border-emerald-500 transition-all text-center"
            placeholder="0.00"
            value={monto}
            onChange={e => setMonto(e.target.value)}
          />
        </div>

        <button 
          onClick={handleApertura}
          disabled={loading}
          className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-all shadow-lg flex justify-center items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin"/> : 'Abrir Caja'}
        </button>
      </div>
    </div>
  );
}
