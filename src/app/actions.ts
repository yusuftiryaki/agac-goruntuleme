'use server';

import { analyzeVideoForTags } from '@/ai/flows/video-analysis-tag-generation';
import { db, storage } from '@/lib/firebase/client';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function handleVideoUpload(formData: FormData, userId: string) {
  const videoFile = formData.get('video') as File;

  if (!videoFile) {
    return { error: 'Geçersiz video dosyası.' };
  }
  
  if (!userId) {
    return { error: 'Kullanıcı kimliği bulunamadı. Lütfen giriş yapın.' };
  }

  const videoBuffer = Buffer.from(await videoFile.arrayBuffer());

  try {
    const videoId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const storageRef = ref(storage, `videos/${videoId}.mp4`);
    
    const uploadResult = await uploadBytes(storageRef, videoBuffer, {
      contentType: 'video/mp4',
    });
    const video_url = await getDownloadURL(uploadResult.ref);

    let tags: string[] = [];
    try {
      const videoDataUri = `data:video/mp4;base64,${videoBuffer.toString('base64')}`;
      const analysis = await analyzeVideoForTags({ videoDataUri });
      tags = analysis.tags;
    } catch (aiError) {
      console.error('AI analysis failed:', aiError);
    }

    await addDoc(collection(db, 'users', userId, 'trees'), {
      video_url,
      status: 'Bekliyor',
      timestamp: serverTimestamp(),
      tags,
    });
  } catch (error) {
    console.error('Upload failed:', error);
    return { error: 'Video yüklenirken bir hata oluştu. Lütfen tekrar deneyin.' };
  }

  revalidatePath('/');
  redirect('/');
}
