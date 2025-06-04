import React, { useEffect, useRef } from 'react';

export default function WebcamTest() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e) {
        alert('Camera error: ' + e);
        console.error(e);
      }
    }
    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <div style={{ maxWidth: 320, margin: '20px auto' }}>
      <video ref={videoRef} style={{ width: '100%' }} autoPlay playsInline muted />
      <p>Camera should show here.</p>
    </div>
  );
}
