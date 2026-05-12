import { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { Payment, PaymentMethod, validatePayments } from '../types/payments';

interface PagoMixtoModalProps {
  totalAPagar: number;
  onConfirm: (payments: Payment[]) => void;
  onCancel: () => void;
}

export function PagoMixtoModal({ totalAPagar, onConfirm, onCancel }: PagoMixtoModalProps) {
  const [payments, setPayments] = useState<Payment[]>([
    { method: 'cash', amount: 0 }
  ]);

  const validation = validatePayments(payments, totalAPagar);
  const totalPagado = validation.totalPaid;
  const faltaPagar = totalAPagar - totalPagado;

  // Cerrar modal con tecla ESC
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter' && validation.isValid) handleConfirm();
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [validation.isValid]);

  const agregarMetodo = () => {
    setPayments([...payments, { method: 'cash', amount: 0 }]);
  };

  const eliminarPago = (index: number) => {
    if (payments.length > 1) {
      setPayments(payments.filter((_, i) => i !== index));
    }
  };

  const actualizarMetodo = (index: number, method: PaymentMethod) => {
    const updated = [...payments];
    updated[index].method = method;
    setPayments(updated);
  };

  const actualizarMonto = (index: number, amount: number) => {
    const updated = [...payments];
    updated[index].amount = Math.max(0, amount);
    setPayments(updated);
  };

  const handleConfirm = () => {
    if (validation.isValid) {
      onConfirm(payments.filter(p => p.amount > 0));
    }
  };

  // Auto-rellenar el monto faltante
  const autoCompletar = (index: number) => {
    if (faltaPagar > 0) {
      actualizarMonto(index, payments[index].amount + faltaPagar);
    }
  };



  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-stone-200 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-xl text-stone-800 flex items-center gap-2">
              💳 Pago Mixto
            </h3>
            <p className="text-sm text-stone-500 mt-1">
              Divide el pago en varios métodos
            </p>
          </div>
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-stone-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Total a pagar */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-emerald-700 font-medium">Total a pagar</p>
            <p className="text-3xl font-bold text-emerald-800 mt-1">
              Bs {totalAPagar.toFixed(2)}
            </p>
          </div>

          {/* Métodos de pago */}
          <div className="space-y-3 mb-4">
            {payments.map((pago, idx) => (
              <div 
                key={idx}
                className="bg-stone-50 border border-stone-200 rounded-xl p-4 hover:border-emerald-300 transition-colors"
              >
                <div className="flex gap-2 items-start">
                  {/* Selector de método */}
                  <div className="flex-1">
                    <label className="text-xs text-stone-500 font-medium mb-1 block">
                      Método {idx + 1}
                    </label>
                    <select 
                      value={pago.method}
                      onChange={(e) => actualizarMetodo(idx, e.target.value as PaymentMethod)}
                      className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white"
                    >
                      <option value='cash'>💵 Efectivo</option>
                      <option value="QR">📱 QR</option>
                      <option value="Tarjeta">💳 Tarjeta</option>
                    </select>
                  </div>

                  {/* Input de monto */}
                  <div className="flex-1">
                    <label className="text-xs text-stone-500 font-medium mb-1 block">
                      Monto (Bs)
                    </label>
                    <div className="relative">
                      <input 
                        type="number"
                        step="0.01"
                        min="0"
                        value={pago.amount || ''}
                        onChange={(e) => actualizarMonto(idx, parseFloat(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                        placeholder="0.00"
                        className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm font-mono font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                      {faltaPagar > 0 && (
                        <button
                          onClick={() => autoCompletar(idx)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-emerald-600 font-bold hover:underline"
                          title="Completar con el monto faltante"
                        >
                          +{faltaPagar.toFixed(2)}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Botón eliminar */}
                  {payments.length > 1 && (
                    <button
                      onClick={() => eliminarPago(idx)}
                      className="mt-6 p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar método"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Botón agregar método */}
          {payments.length < 3 && (
            <button
              onClick={agregarMetodo}
              className="w-full border-2 border-dashed border-stone-300 rounded-xl py-3 text-sm font-bold text-stone-500 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Agregar otro método
            </button>
          )}

          {/* Resumen de pago */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-stone-500">Total ingresado:</span>
              <span className={`font-bold font-mono ${totalPagado === totalAPagar ? 'text-emerald-600' : totalPagado > totalAPagar ? 'text-red-600' : 'text-stone-700'}`}>
                Bs {totalPagado.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-stone-500">Falta pagar:</span>
              <span className={`font-bold font-mono ${faltaPagar === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                Bs {Math.max(0, faltaPagar).toFixed(2)}
              </span>
            </div>
            {totalPagado > totalAPagar && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-500">Cambio a devolver:</span>
                <span className="font-bold font-mono text-blue-600">
                  Bs {(totalPagado - totalAPagar).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Mensaje de validación */}
          {!validation.isValid && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 font-medium">
                {validation.errorMessage}
              </p>
            </div>
          )}

          {validation.isValid && totalPagado > 0 && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
              <CheckCircle size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-emerald-700 font-medium">
                El monto es correcto. Presiona "Confirmar" para procesar el pago.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-stone-200 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-stone-300 rounded-xl font-bold text-stone-600 hover:bg-stone-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!validation.isValid || totalPagado === 0}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            Confirmar Pago
          </button>
        </div>

        {/* Hint de atajos */}
        <div className="px-6 pb-4">
          <p className="text-xs text-center text-stone-400">
            <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 rounded text-[10px] font-mono">ESC</kbd> para cancelar · 
            <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 rounded text-[10px] font-mono ml-1">ENTER</kbd> para confirmar
          </p>
        </div>
      </div>
    </div>
  );
}
