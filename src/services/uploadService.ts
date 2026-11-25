import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';
import { AppConfig } from '@/types';

/**
 * Compress an image client-side to JPEG/WebP < 150KB
 * Keeps storage footprint near zero and optimizes mobile loading speed.
 */
export async function compressImageClientSide(
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        'image/webp',
        quality
      );
    };
    img.onerror = (err) => reject(err);
  });
}

/**
 * Upload image to Cloudinary if configured in appConfig,
 * otherwise uploads to Firebase Storage with compression.
 */
export async function uploadImageDirect(
  file: File,
  folder: 'categories' | 'products' | 'riders' | 'banners' = 'products'
): Promise<string> {
  // Check if Cloudinary is configured
  try {
    const configSnap = await getDoc(doc(db, 'settings', 'appConfig'));
    if (configSnap.exists()) {
      const config = configSnap.data() as AppConfig;
      if (
        config.cloudinaryConfig?.enabled &&
        config.cloudinaryConfig?.cloudName &&
        config.cloudinaryConfig?.uploadPreset
      ) {
        // Upload to Cloudinary unsigned preset
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', config.cloudinaryConfig.uploadPreset);
        formData.append('folder', `gozi/${folder}`);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${config.cloudinaryConfig.cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (res.ok) {
          const data = await res.json();
          return data.secure_url;
        }
      }
    }
  } catch (err) {
    console.warn('Cloudinary upload check failed, falling back to Firebase Storage:', err);
  }

  // Firebase Storage upload with client-side compression
  const compressedBlob = await compressImageClientSide(file);
  const cleanFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}.webp`;
  const storageRef = ref(storage, `${folder}/${cleanFileName}`);

  await uploadBytes(storageRef, compressedBlob, {
    contentType: 'image/webp',
  });

  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}
