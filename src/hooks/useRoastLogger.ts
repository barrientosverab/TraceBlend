import { useState, useRef } from 'react';
import { toast } from 'sonner';

export interface RoastDataPoint {
  time: number;
  bean: number;
  air: number;
}

export const useRoastLogger = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRoasting, setIsRoasting] = useState(false);
  const [liveData, setLiveData] = useState<RoastDataPoint>({ time: 0, bean: 0, air: 0 });
  const [roastLog, setRoastLog] = useState<RoastDataPoint[]>([]);
  
  const portRef = useRef<any>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const keepReadingRef = useRef(false);
  const startTimeRef = useRef<Date | null>(null);

  const connectToRoaster = async (baudRate = 115200) => {
    if (!("serial" in navigator)) {
      toast.error("Tu navegador no soporta Web Serial (Usa Chrome/Edge).");
      return;
    }

    try {
      // @ts-ignore: Web Serial types workaround
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate });
      
      portRef.current = port;
      setIsConnected(true);
      toast.success("✅ Tostadora conectada");
      
      readLoop();
    } catch (err: any) {
      console.error(err);
      toast.error("Error al conectar: " + err.message);
    }
  };

  const readLoop = async () => {
    keepReadingRef.current = true;
    const textDecoder = new TextDecoderStream();
    // @ts-ignore
    const readableStreamClosed = portRef.current.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    readerRef.current = reader;

    let buffer = "";

    try {
      while (keepReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop() || ""; 

        for (const line of lines) {
          parseDataLine(line.trim());
        }
      }
    } catch (error) {
      console.error("Error de lectura:", error);
    } finally {
      reader.releaseLock();
    }
  };

  const parseDataLine = (line: string) => {
    if (!line) return;
    try {
      const parts = line.split(',');
      const beanTemp = parseFloat(parts[0]);
      const airTemp = parseFloat(parts[1]) || 0;

      if (!isNaN(beanTemp)) {
        const now = new Date();
        const timeSeconds = isRoasting && startTimeRef.current 
          ? (now.getTime() - startTimeRef.current.getTime()) / 1000 
          : 0;

        const dataPoint: RoastDataPoint = {
          time: parseFloat(timeSeconds.toFixed(1)),
          bean: beanTemp,
          air: airTemp
        };

        setLiveData(dataPoint);
        if (isRoasting) {
          setRoastLog(prev => [...prev, dataPoint]);
        }
      }
    } catch (e) { }
  };

  const startRoast = () => {
    setRoastLog([]);
    startTimeRef.current = new Date();
    setIsRoasting(true);
    toast.info("🔥 Tueste iniciado");
  };

  const stopRoast = () => {
    setIsRoasting(false);
    startTimeRef.current = null;
    toast.success("🏁 Tueste finalizado");
    return roastLog;
  };

  const disconnect = async () => {
    keepReadingRef.current = false;
    if (readerRef.current) await readerRef.current.cancel();
    if (portRef.current) await portRef.current.close();
    setIsConnected(false);
    setIsRoasting(false);
  };

  return {
    connectToRoaster, disconnect, startRoast, stopRoast,
    isConnected, isRoasting, liveData, roastLog
  };
};