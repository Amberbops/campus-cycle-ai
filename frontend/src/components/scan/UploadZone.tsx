import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  X,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Crosshair,
  SwitchCamera,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function UploadZone({ onFileSelect, disabled }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Live Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isCapturing, setIsCapturing] = useState(false);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  }, []);

  // Cleanup camera stream when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Start live webcam / phone camera feed
  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    clearPreview();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API not supported in this browser. Please use Gallery upload.');
      return;
    }

    try {
      // Stop previous tracks if switching facing mode
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      setIsCameraActive(true);

      // Wait a tick for video element to mount
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => {
            console.warn('Video play error:', err);
          });
        }
      }, 50);
    } catch (err: any) {
      console.warn('getUserMedia error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please allow camera access in browser settings, or select an image file.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. Please use Gallery file upload.');
      } else {
        setCameraError(`Camera error (${err.message || 'unavailable'}). Falling back to file upload.`);
      }
      setIsCameraActive(false);
    }
  };

  // Toggle between front and rear cameras
  const toggleCameraFacing = async () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    await startCamera(nextFacing);
  };

  // Capture snapshot from the live video stream onto canvas
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setIsCapturing(true);

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    // Mirror image if front facing camera
    if (cameraFacing === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        setIsCapturing(false);
        if (!blob) return;

        const capturedFile = new File([blob], `campus_scan_${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });

        stopCamera();
        handleFile(capturedFile);
      },
      'image/jpeg',
      0.92
    );
  };

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const clearPreview = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleAnalyze = () => {
    if (selectedFile) onFileSelect(selectedFile);
  };

  return (
    <div className="space-y-4">
      {/* Hidden offscreen canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Main Viewfinder / Drop Zone */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-900/90 shadow-2xl">
        {/* Case 1: Live Camera Mode */}
        {isCameraActive ? (
          <div className="relative h-[360px] sm:h-[420px] w-full overflow-hidden bg-black">
            {/* Live Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />

            {/* Sci-Fi Camera HUD Reticle Overlay */}
            <div className="pointer-events-none absolute inset-0">
              {/* Scan Reticle Box */}
              <div className="absolute inset-8 sm:inset-12 border border-dashed border-teal-400/40 rounded-2xl">
                {/* Corner reticles */}
                <span className="absolute -left-1 -top-1 h-6 w-6 border-l-2 border-t-2 border-teal-400" />
                <span className="absolute -right-1 -top-1 h-6 w-6 border-r-2 border-t-2 border-teal-400" />
                <span className="absolute -bottom-1 -left-1 h-6 w-6 border-b-2 border-l-2 border-teal-400" />
                <span className="absolute -bottom-1 -right-1 h-6 w-6 border-b-2 border-r-2 border-teal-400" />

                {/* Laser scan line animation */}
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-300 to-transparent shadow-[0_0_15px_rgba(45,212,191,0.9)]"
                  animate={{ top: ['10%', '90%', '10%'] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Center crosshair */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Crosshair className="h-10 w-10 text-teal-300/40" />
                </div>
              </div>

              {/* Status Pills */}
              <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-teal-500/30 bg-slate-950/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-300 backdrop-blur-md">
                <span className="h-2 w-2 animate-ping rounded-full bg-teal-400" />
                Live Camera
              </div>

              <div className="absolute bottom-4 left-4 right-4 text-center text-xs text-slate-300 bg-slate-950/60 py-1 rounded-lg backdrop-blur-sm">
                Center the item inside the reticle and tap Snap
              </div>
            </div>

            {/* Live Camera Controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
              <button
                type="button"
                onClick={toggleCameraFacing}
                title="Switch front/back camera"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950/80 text-slate-300 hover:text-white border border-slate-700 backdrop-blur-md transition-colors"
                aria-label="Switch camera"
              >
                <SwitchCamera className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={stopCamera}
                title="Close camera"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950/80 text-slate-300 hover:text-red-400 border border-slate-700 backdrop-blur-md transition-colors"
                aria-label="Close camera"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Capture Shutter Button */}
            <div className="absolute bottom-12 left-0 right-0 flex justify-center z-20">
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={capturePhoto}
                disabled={isCapturing}
                className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-teal-400 bg-teal-500/30 shadow-[0_0_25px_rgba(45,212,191,0.6)] backdrop-blur-md transition-all hover:bg-teal-500/50 hover:shadow-[0_0_35px_rgba(45,212,191,0.9)]"
                aria-label="Snap photo"
              >
                <div className="h-10 w-10 rounded-full bg-white shadow-inner flex items-center justify-center">
                  <Camera className="h-5 w-5 text-slate-900" />
                </div>
              </motion.button>
            </div>
          </div>
        ) : preview ? (
          /* Case 2: Image Preview Mode */
          <div className="relative w-full h-[320px] sm:h-[360px] flex items-center justify-center bg-slate-950 p-4">
            <img
              src={preview}
              alt="Scanned item preview"
              className="max-h-full max-w-full rounded-xl object-contain shadow-lg"
            />
            {!disabled && (
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => startCamera()}
                  title="Retake with Camera"
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900/90 border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-teal-300 transition-colors backdrop-blur-md"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retake
                </button>
                <button
                  type="button"
                  onClick={clearPreview}
                  title="Remove image"
                  className="rounded-lg bg-slate-900/90 border border-slate-700 p-1.5 text-slate-400 hover:text-red-400 transition-colors backdrop-blur-md"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="absolute bottom-3 left-4 flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-slate-950/80 px-3 py-1 text-[11px] font-medium text-teal-300 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              Ready for AI triage
            </div>
          </div>
        ) : (
          /* Case 3: Idle Drop Zone */
          <motion.div
            className={cn(
              'flex min-h-[260px] cursor-pointer flex-col items-center justify-center p-8 text-center transition-all duration-300',
              isDragging
                ? 'border-teal-400 bg-teal-500/10'
                : 'hover:border-teal-500/60 hover:bg-slate-800/40',
              disabled && 'cursor-not-allowed opacity-60'
            )}
            onClick={() => !disabled && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              if (!disabled) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label="Upload or take an item photo"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
            }}
            animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
          >
            <div
              className={cn(
                'flex h-16 w-16 items-center justify-center rounded-2xl transition-all shadow-inner',
                isDragging ? 'bg-teal-500/30 scale-110' : 'bg-slate-800 border border-slate-700'
              )}
            >
              <Camera
                className={cn('h-8 w-8', isDragging ? 'text-teal-300' : 'text-teal-400')}
                aria-hidden="true"
              />
            </div>

            <div className="mt-4">
              <p className="font-bold text-white text-base">
                Take a Photo or Drop Image
              </p>
              <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
                Tap <strong className="text-teal-300">Camera</strong> below for live viewfinder, or drag & drop a photo from your gallery
              </p>
            </div>
          </motion.div>
        )}

        {/* Hidden native input for gallery/fallback */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {/* Camera error / warning message if permission denied */}
      {cameraError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{cameraError}</p>
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            className="underline font-semibold hover:text-white"
          >
            Browse Files
          </button>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {/* Real Live Camera Button */}
        <Button
          variant={isCameraActive ? 'primary' : 'secondary'}
          className={cn(
            'flex-1 gap-2 shadow-sm',
            !isCameraActive && 'border-teal-500/30 text-teal-300 hover:border-teal-400'
          )}
          onClick={() => {
            if (isCameraActive) {
              capturePhoto();
            } else {
              startCamera();
            }
          }}
          disabled={disabled}
          aria-label="Open live camera"
        >
          <Camera className="h-4 w-4" aria-hidden="true" />
          {isCameraActive ? 'Snap Photo' : 'Live Camera'}
        </Button>

        {/* Gallery / Local File Picker */}
        <Button
          variant="secondary"
          className="flex-1 gap-2 text-slate-300 hover:text-white"
          onClick={() => {
            stopCamera();
            inputRef.current?.click();
          }}
          disabled={disabled}
          aria-label="Choose image from gallery"
        >
          <ImageIcon className="h-4 w-4" aria-hidden="true" />
          Upload File
        </Button>

        {/* Analyze Button */}
        <Button
          variant="primary"
          className="flex-1 gap-2 shadow-lg shadow-teal-500/20"
          onClick={handleAnalyze}
          disabled={disabled || !selectedFile}
          aria-label="Analyze the selected item"
        >
          <Sparkles className="h-4 w-4" />
          Analyze
        </Button>
      </div>
    </div>
  );
}
