import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getProductos, getBatchesDisponibles, registrarEmpaque } from '../services/empaqueService';
import { toast } from 'sonner';
import { Package, ArrowRight } from 'lucide-react';

export function Empaque() {
  const { orgId, user } = useAuth();
  const [productos, setProductos] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  
  // Selección
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedProd, setSelectedProd] = useState('');
  const [cantidad, setCantidad] = useState('');

  useEffect(() => {
    if (orgId) {
      getProductos().then(setProductos); // Estos vienen del nuevo módulo Productos
      getBatchesDisponibles().then(setBatches);
    }
  }, [orgId]);

  const handleEmpaque = async () => {
    if (!selectedBatch || !selectedProd || !cantidad) return toast.warning("Datos incompletos");
    try {
      await registrarEmpaque({ 
        batch_id: selectedBatch, 
        product_id: selectedProd, 
        cantidad: cantidad 
      }, orgId!, user!.id);
      toast.success("Stock de producto actualizado");
      setCantidad('');
    } catch (e: any) { toast.error(e.message); }
  };

  // Solo mostramos productos tostados (Categoría Café o Grano) para empacar
  const productosCafé = productos.filter(p => p.is_roasted);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-2"><Package className="text-amber-700"/> Sala de Empaque</h1>
      
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-stone-200 space-y-6">
        
        <div>
           <label className="font-bold text-stone-500 text-sm">1. Origen (Lote Tostado)</label>
           <select className="w-full p-3 border rounded-xl mt-1 bg-stone-50" value={selectedBatch} onChange={e=>setSelectedBatch(e.target.value)}>
             <option value="">-- Seleccionar Tueste --</option>
             {batches.map(b => (
               <option key={b.id} value={b.id}>
                 {new Date(b.fecha).toLocaleDateString()} - {b.origen_nombre} ({b.peso_inicial}kg)
               </option>
             ))}
           </select>
        </div>

        <div>
           <label className="font-bold text-stone-500 text-sm">2. Producto Final (SKU)</label>
           <select className="w-full p-3 border rounded-xl mt-1 bg-stone-50" value={selectedProd} onChange={e=>setSelectedProd(e.target.value)}>
             <option value="">-- Seleccionar Bolsa --</option>
             {productosCafé.map(p => (
               <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
             ))}
           </select>
        </div>

        <div>
           <label className="font-bold text-stone-500 text-sm">3. Cantidad Bolsas</label>
           <input type="number" className="w-full p-3 border rounded-xl mt-1 font-bold text-xl" value={cantidad} onChange={e=>setCantidad(e.target.value)} placeholder="0"/>
        </div>

        <button onClick={handleEmpaque} className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-all flex justify-center items-center gap-2">
           <Package/> Registrar Empaque
        </button>

      </div>
    </div>
  );
}