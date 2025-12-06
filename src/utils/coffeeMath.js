// src/utils/coffeeMath.js

/**
 * Calcula el rendimiento físico del café (Muestra -> Oro Verde)
 * @param {number} muestraGr Peso total de la muestra (g)
 * @param {number} oroGr Peso del café oro obtenido (g)
 * @param {number} stockTotalKg Stock total del lote en bodega (Kg)
 */
export const calcularRendimientoFisico = (muestraGr, oroGr, stockTotalKg) => {
  if (!muestraGr || muestraGr <= 0) return { factor: 0, oroTotalKg: 0, mermaKg: 0 };

  const factor = (oroGr / muestraGr) * 100;
  const oroTotalKg = stockTotalKg * (factor / 100);
  
  return {
    factor: parseFloat(factor.toFixed(2)),
    oroTotalKg: parseFloat(oroTotalKg.toFixed(2)),
    mermaKg: parseFloat((stockTotalKg - oroTotalKg).toFixed(2))
  };
};

/**
 * Proyecta la transformación de Verde a Tostado y Financiera
 */
export const calcularProyeccionNegocio = (
  kilosVerdes, 
  porcentajeMermaTueste, // Ej: 18%
  pesoBolsaGramos,       // Ej: 250g
  precioPorBolsa         // Ej: 45 Bs
) => {
  if (kilosVerdes <= 0) return null;

  // 1. Tueste
  const mermaTuesteKg = kilosVerdes * (porcentajeMermaTueste / 100);
  const kilosTostados = kilosVerdes - mermaTuesteKg;

  // 2. Empaque
  const pesoBolsaKg = pesoBolsaGramos / 1000;
  // Usamos floor porque no puedes vender media bolsa
  const numeroBolsas = Math.floor(kilosTostados / pesoBolsaKg); 
  const remanenteKg = kilosTostados - (numeroBolsas * pesoBolsaKg);

  // 3. Dinero
  const ingresoTotal = numeroBolsas * precioPorBolsa;

  return {
    kilosTostados: parseFloat(kilosTostados.toFixed(2)),
    mermaTuesteKg: parseFloat(mermaTuesteKg.toFixed(2)),
    numeroBolsas,
    remanenteKg: parseFloat(remanenteKg.toFixed(2)),
    ingresoTotal: parseFloat(ingresoTotal.toFixed(2))
  };
};