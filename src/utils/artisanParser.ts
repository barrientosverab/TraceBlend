export interface ArtisanData {
  points: { time: number; bean: number; air: number }[];
  events: any[];
  ticks: number[];
  duration: number;
  maxTemp: number;
  ambientTemp?: number;
}

export const processArtisanData = (data: any): ArtisanData => {
  const times = data.timex || data.time || data.x || [];
  const beans = data.temp2 || data.bean_temp || []; 
  const airs = data.temp1 || data.air_temp || [];

  if (!Array.isArray(times) || times.length === 0) {
    throw new Error("El archivo no contiene datos de tiempo válidos.");
  }

  const points = times.map((t: any, i: number) => ({
    time: Number(t),
    bean: beans[i] !== undefined ? parseFloat(Number(beans[i]).toFixed(1)) : 0,
    air: airs[i] !== undefined ? parseFloat(Number(airs[i]).toFixed(1)) : 0
  })).filter(p => p.time > 0);

  const events: any[] = [];
  const maxTime = Math.max(...times.map((t:any) => Number(t)));
  const maxTemp = Math.max(...beans.map((b:any) => Number(b)));
  
  const ticks = [];
  for (let i = 0; i <= maxTime; i += 60) ticks.push(i);

  return { 
      points, events, ticks, duration: maxTime, maxTemp,
      ambientTemp: Number(data.ambientTemp) || undefined
  };
};

export const parseArtisanFile = (file: File): Promise<ArtisanData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        let data = null;
        try {
          data = JSON.parse(text);
        } catch (jsonError) {
          // Intento de arreglo para JSON malformado de Artisan (comillas simples)
          const fixedText = text.replace(/'/g, '"').replace(/False/g, 'false').replace(/True/g, 'true').replace(/None/g, 'null'); 
          data = JSON.parse(fixedText);
        }
        resolve(processArtisanData(data));
      } catch (error) { reject(new Error("Archivo inválido.")); }
    };
    reader.readAsText(file);
  });
};