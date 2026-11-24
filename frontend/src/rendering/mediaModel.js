import { readSlideImage } from './imageModel.js';

export const mediaDuration = slide => slide.media?.kind === 'video'
  ? slide.media.trim_end - slide.media.trim_start : Number(slide.slide_duration ?? 5);

export function mediaGeometry(media, width, height, sourceWidth, sourceHeight) {
  const factor = (media.fit === 'cover' ? Math.max : Math.min)(width / sourceWidth, height / sourceHeight);
  const w = sourceWidth * factor, h = sourceHeight * factor;
  return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
}

export async function readSlideMedia(file) {
  if (file.type.startsWith('image/')) {
    const image = await readSlideImage(file);
    return { image, media: { kind: 'image', src: image.image_src, name: file.name, duration: 5, trim_start: 0, trim_end: 5, fit: 'contain', volume: 1, muted: false, subtitles: [] } };
  }
  if (!/^video\/(mp4|webm)$/.test(file.type)) throw new Error('Choose a PNG, JPEG, WebP, GIF, MP4, or WebM file.');
  if (file.size > 50 * 1024 * 1024) throw new Error('Choose a video smaller than 50 MB.');
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement('video'); video.preload = 'auto'; video.muted = true;
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Video could not be loaded. Try an MP4 with H.264 encoding.')), 15000);
      video.onloadeddata = () => { clearTimeout(timer); resolve(); };
      video.onerror = () => { clearTimeout(timer); reject(new Error('This video cannot be decoded. Try an MP4 with H.264 encoding.')); };
      video.src = url;
    });
    if (!Number.isFinite(video.duration) || video.duration < .1 || video.duration > 3600) throw new Error('Choose a video between 0.1 seconds and 1 hour long.');
    const canvas = document.createElement('canvas');
    const factor = Math.min(1, 1920 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(1, Math.round(video.videoWidth * factor)); canvas.height = Math.max(1, Math.round(video.videoHeight * factor));
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const src = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('Could not read video.')); reader.readAsDataURL(file); });
    return { image: { type: 'image', image_src: canvas.toDataURL('image/jpeg', .85), image_name: file.name, image_width: canvas.width, image_height: canvas.height },
      media: { kind: 'video', src, name: file.name, duration: video.duration, trim_start: 0, trim_end: video.duration, fit: 'contain', volume: 1, muted: false, subtitles: [] } };
  } finally { URL.revokeObjectURL(url); }
}
