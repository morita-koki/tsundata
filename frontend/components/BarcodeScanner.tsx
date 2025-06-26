'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { validateScannedCode, convertISBN10to13 } from '@/lib/isbn-validator';

interface BarcodeScannerProps {
  onScan: (isbn: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [cameras, setCameras] = useState<any[]>([]);

  const stopAllMediaStreams = useCallback(() => {
    console.log('🔴 Stopping all media streams...');
    
    // 1. 保持しているMediaStreamを停止
    if (mediaStreamRef.current) {
      console.log('📹 Found stored MediaStream with', mediaStreamRef.current.getTracks().length, 'tracks');
      mediaStreamRef.current.getTracks().forEach(track => {
        console.log(`⏹️ Stopping track: ${track.kind} - ${track.label} - readyState: ${track.readyState}`);
        track.stop();
        console.log(`✅ Track stopped: ${track.readyState}`);
      });
      mediaStreamRef.current = null;
      console.log('✅ Stored MediaStream stopped and cleared');
    }
    
    // 2. DOMビデオ要素からストリームを削除
    try {
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach((video, index) => {
        if (video.srcObject) {
          console.log(`🎥 Found video element ${index} with stream`);
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach(track => {
            console.log(`⏹️ Stopping video element track: ${track.kind}`);
            track.stop();
          });
          video.srcObject = null;
          console.log(`✅ Video element ${index} stream cleared`);
        }
      });
    } catch (error) {
      console.error('❌ Error stopping video element streams:', error);
    }
    
    console.log('✅ All media streams stopped');
  }, []);

  const stopCamera = useCallback(async () => {
    console.log('🛑 stopCamera called - isScanning:', isScanning);
    
    if (scannerRef.current) {
      try {
        // Html5Qrcodeの状態を確認
        const state = scannerRef.current.getState();
        console.log('📊 Scanner state:', state);
        
        if (state === 2) { // Html5QrcodeScannerState.SCANNING
          console.log('📹 Stopping Html5Qrcode scanner...');
          await scannerRef.current.stop();
          console.log('✅ Html5Qrcode scanner stopped');
        } else {
          console.log('📹 Scanner not in scanning state, skipping stop()');
        }
      } catch (error) {
        console.error('❌ Html5Qrcode stop error:', error);
      }
    }
    
    // MediaStreamを直接停止（Html5Qrcodeの状態に関係なく実行）
    stopAllMediaStreams();
    setIsScanning(false);
    
    console.log('🎯 stopCamera completed');
  }, [stopAllMediaStreams]); // isScanningを依存配列から削除

  const cleanup = useCallback(async () => {
    console.log('🧹 Cleanup started');
    
    // Html5Qrcodeを停止
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerRef.current.stop();
          console.log('✅ Scanner stopped in cleanup');
        }
        await scannerRef.current.clear();
        scannerRef.current = null;
        console.log('✅ Scanner cleared in cleanup');
      } catch (error) {
        console.error('❌ Cleanup scanner error:', error);
        scannerRef.current = null;
      }
    }
    
    // MediaStreamを停止
    stopAllMediaStreams();
    setIsScanning(false);
    
    console.log('✅ Cleanup completed');
  }, [stopAllMediaStreams]);

  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      try {
        // Get available cameras
        const devices = await Html5Qrcode.getCameras();
        if (!mounted) return;
        
        setCameras(devices);
        
        if (devices.length === 0) {
          setError('カメラが見つかりません');
          return;
        }

        // Initialize scanner
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        // Start scanning and capture MediaStream
        const cameraId = devices[0].id;
        
        // Html5Qrcodeの内部でgetUserMediaが呼ばれる前にMediaStreamをキャプチャ
        const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
        navigator.mediaDevices.getUserMedia = async function(constraints) {
          console.log('🎥 Capturing MediaStream...');
          const stream = await originalGetUserMedia.call(this, constraints);
          mediaStreamRef.current = stream;
          console.log('📹 MediaStream captured:', stream.getTracks().length, 'tracks');
          return stream;
        };

        await scanner.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            console.log('Scanned:', decodedText);
              
            // 同じコードを連続でスキャンしないようにする
            if (decodedText === lastScannedCode) {
              return;
            }
            setLastScannedCode(decodedText);
              
            // ISBNバリデーション
            const validation = validateScannedCode(decodedText);
              
            if (!validation.isValid) {
              setError(validation.errorMessage || 'スキャンされたコードは有効なISBNではありません');
              return;
            }
              
            // ISBN-10の場合はISBN-13に変換
            let finalISBN = validation.cleanISBN;
            if (validation.format === 'ISBN-10') {
              finalISBN = convertISBN10to13(validation.cleanISBN);
            }
              
            console.log(`Valid ${validation.format} detected:`, finalISBN);
              
            // カメラを即座に停止
            stopCamera().then(() => {
              console.log('🎯 Camera stopped, executing callback');
              onScan(finalISBN);
            }).catch((error) => {
              console.error('❌ Failed to stop camera before callback:', error);
              onScan(finalISBN);
            });
          },
          (error) => {
            // Only log scanning errors, don't set error state for normal scanning failures
            if (error.includes('NotAllowedError') || error.includes('NotFoundError')) {
              console.error('Scanner error:', error);
              setError(`カメラエラー: ${error}`);
            }
          }
        );

        // getUserMediaを元に戻す
        navigator.mediaDevices.getUserMedia = originalGetUserMedia;

        setIsScanning(true);
        console.log('📹 Camera started successfully');
      } catch (err: any) {
        console.error('Scanner initialization error:', err);
        setError('スキャナーの初期化に失敗しました: ' + err.message);
      }
    };

    initCamera();

    return () => {
      mounted = false;
      cleanup();
    };
  }, []); // 依存配列を空にして一度だけ実行

  const handleClose = async () => {
    await cleanup();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">バーコードをスキャン</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <strong>エラー:</strong>
                <br />
                {error}
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        <div className="mb-4 text-sm text-gray-600">
          カメラの使用を許可してください。本のバーコード（ISBN-10またはISBN-13）をカメラに向けてください。
          <br />
          <span className="text-xs text-gray-500">
            ※ ISBN-10は自動的にISBN-13に変換されます
          </span>
        </div>

        {/* Camera status indicator */}
        <div className="mb-4">
          <div className={`flex items-center space-x-2 text-sm ${isScanning ? 'text-green-600' : 'text-yellow-600'}`}>
            <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span>{isScanning ? 'カメラ起動中' : 'カメラ準備中'}</span>
          </div>
        </div>
        
        {/* Debug buttons for testing */}
        <div className="mb-4 space-x-2">
          <button
            onClick={async () => {
              const testISBN13 = '9784167158057';
              console.log('Testing ISBN-13:', testISBN13);
              const validation = validateScannedCode(testISBN13);
              if (validation.isValid) {
                await stopCamera();
                onScan(validation.cleanISBN);
              } else {
                setError(validation.errorMessage || 'テスト用ISBNが無効です');
              }
            }}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs"
          >
            テスト ISBN-13
          </button>
          <button
            onClick={async () => {
              const testISBN10 = '4167158051';
              console.log('Testing ISBN-10:', testISBN10);
              const validation = validateScannedCode(testISBN10);
              if (validation.isValid) {
                const finalISBN = validation.format === 'ISBN-10' ? convertISBN10to13(validation.cleanISBN) : validation.cleanISBN;
                await stopCamera();
                onScan(finalISBN);
              } else {
                setError(validation.errorMessage || 'テスト用ISBNが無効です');
              }
            }}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs"
          >
            テスト ISBN-10
          </button>
          <button
            onClick={() => {
              const invalidCode = '1234567890';
              console.log('Testing invalid code:', invalidCode);
              const validation = validateScannedCode(invalidCode);
              setError(validation.errorMessage || '無効なコードです');
            }}
            className="bg-red-200 hover:bg-red-300 text-red-700 px-3 py-1 rounded text-xs"
          >
            無効コードテスト
          </button>
        </div>
        
        <div id="qr-reader" className="w-full min-h-[300px]"></div>
      </div>
    </div>
  );
}