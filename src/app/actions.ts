'use server';

import { db, storage } from '@/lib/firebase/client';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function handleVideoUpload(formData: FormData) {
  console.log("handleVideoUpload Server Action started.");
  
  if (!storage || !db) {
    const serviceName = !storage ? 'Storage' : 'Firestore';
    console.error(`Firebase ${serviceName} is not initialized! Check your firebase/client.ts and .env files.`);
    return { error: `Sunucu hatası: Firebase ${serviceName} başlatılamadı.` };
  }

  const videoFile = formData.get('video') as File;

  if (!videoFile || videoFile.size === 0) {
    console.error("No video file received or file is empty.");
    return { error: 'Geçersiz video dosyası veya dosya boş.' };
  }
  
  console.log(`Received video file: ${videoFile.name}, size: ${videoFile.size}, type: ${videoFile.type}`);

  try {
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
    console.log("Video file converted to buffer.");

    const videoId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const storagePath = `videos/${videoId}_${videoFile.name}`;
    const storageRef = ref(storage, storagePath);
    console.log(`Uploading to Firebase Storage at path: ${storagePath}`);
    
    const uploadResult = await uploadBytes(storageRef, videoBuffer, {
      contentType: videoFile.type,
    });
    console.log("Successfully uploaded to Storage.");

    const video_url = await getDownloadURL(uploadResult.ref);
    console.log(`Got download URL: ${video_url}`);

    console.log("Adding document to Firestore 'trees' collection.");
    await addDoc(collection(db, 'trees'), {
      video_url,
      status: 'pending',
      timestamp: serverTimestamp(),
    });
    console.log("Successfully added document to Firestore.");

  } catch (error: any) {
    console.error('--- UPLOAD FAILED ---');
    console.error('Error object:', error);
    if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
    }
    console.error('--- END OF ERROR ---');
    
    let errorMessage = 'Bilinmeyen bir hata oluştu.';
    if (typeof error === 'object' && error !== null && 'code' in error) {
      if (error.code === 'storage/unauthorized') {
          errorMessage = 'Dosya yükleme izniniz yok. Lütfen Firebase Storage kurallarınızın herkese yazma izni verdiğinden emin olun.';
      } else if (error.code === 'storage/unknown') {
          errorMessage = 'Bilinmeyen depolama hatası (storage/unknown). Lütfen Firebase konsolunda Storage hizmetinin tamamen etkinleştirildiğinden emin olun (örneğin "Get Started" ekranında olmadığından). Bazen bu, proje yapılandırmasındaki bir sorundan kaynaklanır.';
      } else {
        errorMessage = `Firebase Hatası: ${error.code}. Lütfen konsol loglarını kontrol edin.`;
      }
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }

    return { error: `Video yüklenirken sunucu hatası oluştu: ${errorMessage}` };
  }

  console.log("Upload complete. Revalidating path and redirecting.");
  revalidatePath('/');
  redirect('/');
}
