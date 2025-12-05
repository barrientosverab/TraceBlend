// src/utils/artisanParser.js

/**
 * Procesa los datos crudos de Artisan (JSON) y los normaliza para Recharts.
 * Útil tanto para archivos nuevos como para historiales antiguos.
 */
export const processArtisanData = (data) => {
  // 1. Normalización de variables (Soporte para versiones 2.x y 3.x de Artisan)
  const times = data.timex || data.time || data.x || [];
  
  // En Artisan: temp2 suele ser Grano (BT) y temp1 Aire (ET)
  const beans = data.temp2 || data.bean_temp || []; 
  const airs = data.temp1 || data.air_temp || [];

  if (!Array.isArray(times) || times.length === 0) {
    throw new Error("El archivo no contiene datos de tiempo válidos.");
  }

  // 2. Generar Puntos para la Gráfica
  const points = times.map((t, i) => ({
    time: t,
    bean: beans[i] !== undefined ? parseFloat(beans[i].toFixed(1)) : null,
    air: airs[i] !== undefined ? parseFloat(airs[i].toFixed(1)) : null
  })).filter(p => p.time > 0);

  // 3. Extraer Eventos (Fases y Controles)
  const events = [];
  
  // A. Fases Automáticas (computed)
  if (data.computed) {
    const c = data.computed;
    const addPhase = (type, time, temp, label, color) => {
      if (time && time > 0) events.push({ type, time, temp, label, color });
    };
    addPhase('CHARGE', c.CHARGE_time, 0, 'Carga', '#6b7280');
    addPhase('TP', c.TP_time, c.TP_BT, 'TP', '#6b7280');
    addPhase('DRY', c.DRY_time, c.DRY_BT, 'Secado', '#d97706');
    addPhase('FCs', c.FCs_time, c.FCs_BT, '1er Crack', '#dc2626');
    addPhase('DROP', c.DROP_time, c.DROP_BT, 'Salida', '#000000');
  }

  // B. Eventos Manuales / Controles
  if (Array.isArray(data.specialevents) && Array.isArray(data.specialeventsStrings)) {
    data.specialevents.forEach((timeIndex, i) => {
      const label = data.specialeventsStrings[i];
      // Artisan a veces guarda el índice y a veces el tiempo
      let time = timeIndex;
      if (timeIndex < times.length && Number.isInteger(timeIndex)) {
           time = times[timeIndex]; 
      }
      
      if (label && time > 0) {
        events.push({
          type: 'CTRL',
          time: time,
          temp: beans[Number.isInteger(timeIndex) ? timeIndex : 0] || 0, 
          label: label, 
          isControl: true, 
          color: '#3b82f6'
        });
      }
    });
  }
  events.sort((a, b) => a.time - b.time);

  // 4. Calcular Estadísticas
  const maxTime = Math.max(...times);
  const maxTemp = Math.max(...beans);
  
  // Generar ticks para el eje X (cada minuto)
  const ticks = [];
  for (let i = 0; i <= maxTime; i += 60) ticks.push(i);

  return { 
      points, 
      events, 
      ticks, 
      duration: maxTime, 
      maxTemp,
      // Retornamos también datos ambientales si existen en el raw
      ambientTemp: data.ambientTemp 
  };
};

/**
 * Lee un archivo .json o .alog y devuelve los datos procesados.
 * Maneja la asincronía del FileReader.
 */
export const parseArtisanFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        let data = null;
        
        try {
          data = JSON.parse(text);
        } catch (jsonError) {
          // Fix para archivos de Artisan que usan sintaxis de Python (True/False, comillas simples)
          const fixedText = text
            .replace(/'/g, '"')
            .replace(/False/g, 'false')
            .replace(/True/g, 'true')
            .replace(/None/g, 'null')
            .replace(/,\s*([\]}])/g, '$1'); 
          data = JSON.parse(fixedText);
        }

        const processedData = processArtisanData(data);
        resolve(processedData);

      } catch (error) {
        reject(new Error("El archivo está dañado o no es un perfil de Artisan válido."));
      }
    };

    reader.onerror = () => reject(new Error("Error de lectura del archivo."));
    reader.readAsText(file);
  });
};