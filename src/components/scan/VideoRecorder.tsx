'use client';

import { Camera, Circle, Loader2, Square, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef, useState, useEffect, useCallback } from 'react';
import { handleVideoUpload } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

type RecordingStatus = 'idle' | 'getting-permission' | 'ready' | 'recording' | 'processing';

export function VideoRecorder() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { toast } = useToast();

  const getCameraPermission = useCallback(async () => {
    setStatus('getting-permission');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          frameRate: { ideal: 1 }
        },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStream(stream);
      setStatus('ready');
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast({
        variant: 'destructive',
        title: 'Kamera Erişimi Başarısız',
        description: 'Lütfen kamera izinlerini kontrol edin ve tekrar deneyin.',
      });
      setStatus('idle');
    }
  }, [toast]);

  const startRecording = () => {
    if (stream && status === 'ready') {
      setStatus('recording');
      const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9') 
        ? 'video/webm; codecs=vp9' 
        : MediaRecorder.isTypeSupported('video/webm') 
        ? 'video/webm' 
        : 'video/mp4';

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };
      mediaRecorderRef.current.start();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
      setStatus('processing');
      stream?.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (status === 'processing' && recordedChunks.length > 0) {
      const mimeType = recordedChunks[0].type;
      const blob = new Blob(recordedChunks, { type: mimeType });
      const fileExtension = mimeType.split('/')[1]?.split(';')[0] || 'mp4';
      const fileName = `pistachio-scan.${fileExtension}`;
      
      const formData = new FormData();
      formData.append('video', blob, fileName);
      
      toast({
        title: 'Yükleniyor...',
        description: 'Video işleniyor ve yükleniyor. Lütfen bekleyin.',
      });

      handleVideoUpload(formData).then((result) => {
        if (result?.error) {
          toast({
            variant: 'destructive',
            title: 'Yükleme Başarısız',
            description: result.error,
          });
          setStatus('idle');
        }
      });

      setRecordedChunks([]);
    }
  }, [status, recordedChunks, toast]);

  return (
    <Card className="w-full max-w-lg aspect-square overflow-hidden">
      <CardContent className="p-0 h-full w-full flex items-center justify-center relative bg-muted">
        {/* Video element is always rendered to ensure ref is available */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
        />

        {/* Overlays for different states */}
        {(status === 'idle' || status === 'getting-permission' || status === 'processing') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted p-4 text-center">
            {status === 'idle' && (
              <>
                <VideoOff className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Kamera başlatılmadı.</p>
                <Button onClick={getCameraPermission} className="mt-4">
                  <Camera className="mr-2 h-4 w-4" /> Kamerayı Başlat
                </Button>
              </>
            )}
            {status === 'getting-permission' && (
              <>
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="mt-2 text-muted-foreground">Kamera izni isteniyor...</p>
              </>
            )}
            {status === 'processing' && (
              <>
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="mt-2 text-muted-foreground">Video işleniyor...</p>
              </>
            )}
          </div>
        )}

        {/* Recording controls, visible when camera is active */}
        {(status === 'ready' || status === 'recording') && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            {status === 'ready' ? (
              <Button onClick={startRecording} size="lg" className="rounded-full w-20 h-20 bg-red-600 hover:bg-red-700">
                <Circle className="h-8 w-8 fill-white" />
              </Button>
            ) : (
              <Button onClick={stopRecording} size="lg" className="rounded-full w-20 h-20 bg-red-600 hover:bg-red-700 animate-pulse">
                <Square className="h-8 w-8 fill-white" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
