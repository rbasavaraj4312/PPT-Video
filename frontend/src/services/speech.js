import { BASE_URL } from './api.js';
import { narrationReady, buildTimeline } from '../narration/timeline.js';
import { revealIssues } from '../narration/reveals.js';

export const speechUrl = (path) => `${BASE_URL}/speech${path}`;
export async function speechRequest(path, options = {}) {
  const response = await fetch(speechUrl(path), options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
    throw new Error(detail || `Speech request failed (${response.status})`);
  }
  return response.json();
}
export const speechPost = (path, body) => speechRequest(path, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

export async function exportNarratedVideo(presentation, { onProgress, pollInterval = 1000 } = {}) {
  const issue = revealIssues(buildTimeline(presentation).items)[0];
  if (issue) throw new Error(`Reveal on "${issue.title || 'Untitled slide'}": ${issue.issue}`);
  for (const slide of presentation.slides) {
    if (slide.narration?.script?.trim() && !narrationReady(slide.narration)) {
      throw new Error(`Generate current narration for "${slide.title || 'Untitled slide'}" in Voice & narration before exporting.`);
    }
  }
  let job = await speechPost('/render', presentation);
  while (true) {
    onProgress?.(job);
    if (job.status === 'complete') break;
    if (job.status === 'failed' || job.status === 'cancelled') {
      throw new Error(job.error || (job.status === 'cancelled' ? 'Video export cancelled.' : 'Video export failed.'));
    }
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    job = await speechRequest(`/jobs/${job.id}`);
  }
  const response = await fetch(speechUrl(`/jobs/${job.id}/video`));
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || 'Video download failed.');
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = `${presentation.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'presentation'}_1080p_30fps.mp4`;
  document.body.appendChild(link);
  try { link.click(); }
  finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
export async function downloadSrt(presentation) {
  const response = await fetch(speechUrl('/captions.srt'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(presentation),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || 'Caption download failed');
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url; link.download = 'captions.srt'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
