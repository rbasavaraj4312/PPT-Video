// Base API URL configured via frontend/.env (VITE_API_URL or VITE_BACKEND_URL/api), fallback to '/api'
const RAW_URL = import.meta.env?.VITE_API_URL || (import.meta.env?.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : '/api');
export const BASE_URL = RAW_URL.replace(/\/+$/, '');

export async function fetchPresentations() {
  const res = await fetch(`${BASE_URL}/presentations`);
  if (!res.ok) throw new Error('Failed to fetch presentations');
  return res.json();
}

export async function fetchPresentation(id) {
  const res = await fetch(`${BASE_URL}/presentations/${id}`);
  if (!res.ok) throw new Error(`Failed to load presentation: ${id}`);
  return res.json();
}

export async function savePresentation(presentation) {
  const res = await fetch(`${BASE_URL}/presentations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(presentation),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to save presentation');
  }
  return res.json();
}

export async function deletePresentation(id) {
  const res = await fetch(`${BASE_URL}/presentations/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete presentation: ${id}`);
  return res.json();
}

export async function exportPresentation(presentation) {
  // First ensure presentation is saved or use export-direct
  const res = await fetch(`${BASE_URL}/export-direct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(presentation),
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to export PPTX');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const filename = `${presentation.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'presentation'}.pptx`;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function exportVideo(presentation, { resolution = '1080p', fps = 30, slide_duration = null } = {}) {
  const params = { resolution, fps: fps.toString() };
  if (slide_duration) {
    params.slide_duration = slide_duration.toString();
  }
  const queryParams = new URLSearchParams(params);
  const res = await fetch(`${BASE_URL}/export-video-direct?${queryParams.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(presentation),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to render MP4 video');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanTitle = presentation.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'presentation';
  const filename = `${cleanTitle}_${resolution}_${fps}fps.mp4`;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function compileOutline(outline, theme = null) {
  const res = await fetch(`${BASE_URL}/compile-outline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ outline, theme }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to compile outline');
  }

  return res.json();
}

export async function getOutlineThemes() {
  const res = await fetch(`${BASE_URL}/outline-themes`);
  if (!res.ok) throw new Error('Failed to fetch outline themes');
  return res.json();
}

// ================= Folders API =================
export async function fetchFolders() {
  const res = await fetch(`${BASE_URL}/folders`);
  if (!res.ok) throw new Error('Failed to fetch folders');
  return res.json();
}

export async function createFolder(folder) {
  const res = await fetch(`${BASE_URL}/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(folder),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create folder');
  }
  return res.json();
}

export async function updateFolder(id, data) {
  const res = await fetch(`${BASE_URL}/folders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update folder');
  }
  return res.json();
}

export async function deleteFolder(id) {
  const res = await fetch(`${BASE_URL}/folders/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete folder: ${id}`);
  return res.json();
}

export async function movePresentationToFolder(presentationId, folderId) {
  const res = await fetch(`${BASE_URL}/presentations/${presentationId}/folder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder_id: folderId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to move presentation to folder');
  }
  return res.json();
}

export async function moveFolder(folderId, parentId) {
  const res = await fetch(`${BASE_URL}/folders/${folderId}/move`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parent_id: parentId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to move folder');
  }
  return res.json();
}

// ================= Templates API =================
export async function fetchTemplates(category = null, aspectRatio = null) {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.append('category', category);
  if (aspectRatio && aspectRatio !== 'all') params.append('aspect_ratio', aspectRatio);
  const query = params.toString() ? `?${params.toString()}` : '';

  const res = await fetch(`${BASE_URL}/templates${query}`);
  if (!res.ok) throw new Error('Failed to fetch templates');
  return res.json();
}

export async function fetchTemplate(id) {
  const res = await fetch(`${BASE_URL}/templates/${id}`);
  if (!res.ok) throw new Error(`Failed to load template: ${id}`);
  return res.json();
}

export async function saveCustomTemplate(template) {
  const res = await fetch(`${BASE_URL}/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to save template');
  }
  return res.json();
}

export async function updateCustomTemplate(id, template) {
  const res = await fetch(`${BASE_URL}/templates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update template');
  }
  return res.json();
}

export async function deleteCustomTemplate(id) {
  const res = await fetch(`${BASE_URL}/templates/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete template: ${id}`);
  return res.json();
}

// ================= Motion Templates API =================
export async function fetchMotionTemplates(category = null) {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.append('category', category);
  const query = params.toString() ? `?${params.toString()}` : '';

  const res = await fetch(`${BASE_URL}/motion-templates${query}`);
  if (!res.ok) throw new Error('Failed to fetch motion templates');
  return res.json();
}

export async function fetchMotionTemplate(id) {
  const res = await fetch(`${BASE_URL}/motion-templates/${id}`);
  if (!res.ok) throw new Error(`Failed to load motion template: ${id}`);
  return res.json();
}

export async function saveMotionTemplate(template) {
  const res = await fetch(`${BASE_URL}/motion-templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to save motion template');
  }
  return res.json();
}

export async function updateMotionTemplate(id, template) {
  const res = await fetch(`${BASE_URL}/motion-templates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update motion template');
  }
  return res.json();
}

export async function deleteMotionTemplate(id) {
  const res = await fetch(`${BASE_URL}/motion-templates/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete motion template: ${id}`);
  return res.json();
}






