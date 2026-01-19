/**
 * Tipos auxiliares para el sistema de pagos mixtos
 */

export type PaymentMethod = 'Efectivo' | 'QR' | 'Tarjeta';

export interface Payment {
  method: PaymentMethod;
  amount: number;
}

export interface SalesOrderPayment {
  id: string;
  organization_id: string;
  sales_order_id: string;
  payment_method: PaymentMethod;
  amount: number;
  created_at: string;
}

export interface MixedPaymentValidation {
  isValid: boolean;
  totalPaid: number;
  totalRequired: number;
  difference: number;
  errorMessage?: string;
}

/**
 * Valida que la suma de pagos coincida con el total requerido
 */
export function validatePayments(
  payments: Payment[],
  totalRequired: number
): MixedPaymentValidation {
  if (payments.length === 0) {
    return {
      isValid: false,
      totalPaid: 0,
      totalRequired,
      difference: totalRequired,
      errorMessage: 'Debe especificar al menos un método de pago'
    };
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const difference = Math.abs(totalPaid - totalRequired);

  // Tolerancia de 0.01 Bs por redondeo
  const isValid = difference < 0.01;

  return {
    isValid,
    totalPaid,
    totalRequired,
    difference,
    errorMessage: isValid
      ? undefined
      : `Falta pagar Bs ${(totalRequired - totalPaid).toFixed(2)}`
  };
}

/**
 * Formatea los pagos para enviar a la función SQL
 */
export function formatPaymentsForDB(payments: Payment[]): object[] {
  return payments.map(p => ({
    method: p.method,
    amount: Number(p.amount.toFixed(2))
  }));
}
