export const fullCrop = () => ({ x: 0, y: 0, width: 1, height: 1 });
export function normalizedCrop(value) {
  const c = { ...fullCrop(), ...value };
  const width = Math.max(.02, Math.min(1, Number(c.width) || 1));
  const height = Math.max(.02, Math.min(1, Number(c.height) || 1));
  return { x: Math.max(0, Math.min(1 - width, Number(c.x) || 0)),
    y: Math.max(0, Math.min(1 - height, Number(c.y) || 0)), width, height };
}

export function cropImagePatch(element, crop) {
  const c = normalizedCrop(crop);
  const height = element.width * ((element.image_height || 1) * c.height) / ((element.image_width || 1) * c.width);
  return { image_crop: c, height, y: element.y + (element.height - height) / 2 };
}

export async function readSlideImage(file) {
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) throw new Error('Choose a PNG, JPEG, WebP, or GIF image.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Choose an image smaller than 10 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const factor = Math.min(1, 4096 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * factor));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * factor));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    const src = canvas.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', .92);
    if (src.length > 14_000_000) throw new Error('This image is too large to embed. Choose a smaller image.');
    return { type: 'image', image_src: src, image_name: file.name || 'Pasted image', image_width: canvas.width,
      image_height: canvas.height, image_crop: fullCrop(), aspect_locked: true, opacity: 1, rotation: 0 };
  } finally { URL.revokeObjectURL(url); }
}
