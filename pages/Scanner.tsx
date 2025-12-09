import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { useNavigate } from 'react-router-dom';
import { scanQRCode } from '../services/storage';
import { ScanResult } from '../types';
import GlassPanel from '../components/GlassPanel';
import { Scan, XCircle, CheckCircle, AlertTriangle, RefreshCcw, X } from 'lucide-react';
import Button from '../components/Button';

const Scanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(true);
  const [cameraError, setCameraError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let animationFrameId: number;
    
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Required for iOS
          videoRef.current.setAttribute("playsinline", "true"); 
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error("Error accessing camera", err);
        setCameraError(true);
      }
    };

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && scanning) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });

            if (code && code.data) {
               handleScan(code.data);
               return; // Stop loop temporarily
            }
          }
        }
      }
      if (scanning) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    if (scanning && !scanResult) {
      startCamera();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [scanning, scanResult]);

  const handleScan = async (data: string) => {
    setScanning(false);
    const result = await scanQRCode(data);
    setScanResult(result);
  };

  const resetScan = () => {
    setScanResult(null);
    setScanning(true);
  };

  const closeScanner = () => {
      navigate('/');
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Top Exit Button */}
      <div className="absolute top-4 right-4 z-50">
          <button onClick={closeScanner} className="p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-red-900/50 transition-colors">
              <X size={24} />
          </button>
      </div>

      {/* Scanner Viewport */}
      {!scanResult && !cameraError && (
        <div className="absolute inset-0 z-0">
          <video ref={videoRef} className="w-full h-full object-cover opacity-80" />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Overlay UI */}
          <div className="absolute inset-0 border-[40px] border-black/60 pointer-events-none z-10">
            <div className="w-full h-full relative">
                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-red-500"></div>
                <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-red-500"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-red-500"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-red-500"></div>
                
                {/* Scanning Line Animation */}
                <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1)] animate-[scan_2s_infinite]"></div>
            </div>
          </div>
          
          <div className="absolute bottom-24 w-full text-center z-20">
             <p className="text-white bg-black/50 backdrop-blur-md inline-block px-4 py-2 rounded-full border border-white/10">
               Inquadra il QR Code dell'invito
             </p>
          </div>
        </div>
      )}

      {/* Result UI */}
      {scanResult && (
        <div className="relative z-30 p-4 w-full max-w-md">
           <GlassPanel 
             intensity="high" 
             className={`p-8 text-center border-2 ${
               scanResult.type === 'success' ? 'border-green-500/50' : 
               scanResult.type === 'warning' ? 'border-yellow-500/50' : 'border-red-500/50'
             }`}
           >
              <div className="flex flex-col items-center gap-4">
                {scanResult.type === 'success' && <CheckCircle className="w-20 h-20 text-green-500" />}
                {scanResult.type === 'error' && <XCircle className="w-20 h-20 text-red-500" />}
                {scanResult.type === 'warning' && <AlertTriangle className="w-20 h-20 text-yellow-500" />}

                <h2 className="text-2xl font-bold text-white uppercase tracking-wider mt-2">
                  {scanResult.message}
                </h2>
                
                {scanResult.guest && (
                  <div className="bg-white/5 rounded-xl p-4 w-full mt-4 border border-white/10">
                    <p className="text-xl font-bold">{scanResult.guest.firstName} {scanResult.guest.lastName}</p>
                    <p className="text-gray-400 text-sm">@{scanResult.guest.instagram}</p>
                  </div>
                )}

                <Button onClick={resetScan} className="w-full mt-6" variant="secondary">
                  <RefreshCcw className="w-4 h-4 mr-2" /> Scansiona Prossimo
                </Button>
              </div>
           </GlassPanel>
        </div>
      )}

      {cameraError && (
        <div className="text-center p-8 max-w-md z-30">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Errore Fotocamera</h2>
          <p className="text-gray-400 mb-6">Impossibile accedere alla fotocamera. Verifica i permessi o usa un dispositivo mobile.</p>
          <Button onClick={() => window.location.reload()}>Riprova</Button>
        </div>
      )}
    </div>
  );
};

export default Scanner;