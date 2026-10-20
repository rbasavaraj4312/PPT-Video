import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Parses the current pathname into a structured route object.
 *
 * URL Scheme:
 * - / or /dashboard               -> Dashboard (Projects view, root)
 * - /dashboard/folder/:folderId   -> Dashboard (Projects view, inside folder)
 * - /templates                    -> Dashboard (Templates library)
 * - /dashboard/templates          -> Dashboard (Templates library alias)
 * - /editor/:presentationId       -> Presentation Editor (UUID in URL)
 * - /templates/:templateId/edit   -> Template Editor (UUID in URL)
 * - /editor/template/:templateId  -> Template Editor (alias)
 */
export function parseRoute(pathname = window.location.pathname) {
  const cleanPath = pathname ? pathname.replace(/\/+$/, '') || '/' : '/';

  // 1. Template Editor: /templates/:templateId/edit or /editor/template/:templateId
  const tplEditMatch =
    cleanPath.match(/^\/templates\/([^/]+)\/edit$/) ||
    cleanPath.match(/^\/editor\/template\/([^/]+)$/);
  if (tplEditMatch) {
    return {
      path: cleanPath,
      view: 'editor',
      editorMode: 'template',
      id: decodeURIComponent(tplEditMatch[1]),
      presentationId: null,
      templateId: decodeURIComponent(tplEditMatch[1]),
      section: 'templates',
      folderId: null,
    };
  }

  // 2. Presentation Editor: /editor/:presentationId
  const presEditMatch = cleanPath.match(/^\/editor\/([^/]+)$/);
  if (presEditMatch) {
    return {
      path: cleanPath,
      view: 'editor',
      editorMode: 'presentation',
      id: decodeURIComponent(presEditMatch[1]),
      presentationId: decodeURIComponent(presEditMatch[1]),
      templateId: null,
      section: 'projects',
      folderId: null,
    };
  }

  // 3. Dashboard Folder: /dashboard/folder/:folderId
  const folderMatch = cleanPath.match(/^\/dashboard\/folder\/([^/]+)$/);
  if (folderMatch) {
    return {
      path: cleanPath,
      view: 'dashboard',
      editorMode: null,
      id: null,
      presentationId: null,
      templateId: null,
      section: 'projects',
      folderId: decodeURIComponent(folderMatch[1]),
    };
  }

  // 4. Templates Library: /templates or /dashboard/templates
  if (cleanPath === '/templates' || cleanPath === '/dashboard/templates') {
    return {
      path: '/templates',
      view: 'dashboard',
      editorMode: null,
      id: null,
      presentationId: null,
      templateId: null,
      section: 'templates',
      folderId: null,
    };
  }

  // 4b. Motion Templates Library: /motion-templates or /dashboard/motion-templates
  if (cleanPath === '/motion-templates' || cleanPath === '/dashboard/motion-templates') {
    return {
      path: '/motion-templates',
      view: 'dashboard',
      editorMode: null,
      id: null,
      presentationId: null,
      templateId: null,
      section: 'motion-templates',
      folderId: null,
    };
  }


  // 5. Default Dashboard (Root /dashboard or /)
  return {
    path: cleanPath === '/' ? '/dashboard' : cleanPath,
    view: 'dashboard',
    editorMode: null,
    id: null,
    presentationId: null,
    templateId: null,
    section: 'projects',
    folderId: null,
  };
}

export function useRouter() {
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname));
  const [historyStep, setHistoryStep] = useState(() => window.history.state?.step || 0);
  const maxStepRef = useRef(window.history.state?.step || 0);

  // Normalize initial '/' to '/dashboard' in URL bar without page refresh
  useEffect(() => {
    if (window.location.pathname === '/' || window.location.pathname === '') {
      window.history.replaceState({ step: 0 }, '', '/dashboard');
    } else if (window.history.state?.step === undefined) {
      window.history.replaceState({ step: 0 }, '', window.location.pathname);
    }
  }, []);

  // Listen to popstate (Browser Back & Forward)
  useEffect(() => {
    const handlePopState = (event) => {
      const parsed = parseRoute(window.location.pathname);
      const step = event.state?.step || 0;
      setHistoryStep(step);
      if (step > maxStepRef.current) {
        maxStepRef.current = step;
      }
      setRoute(parsed);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to, { replace = false } = {}) => {
    const targetRoute = parseRoute(to);
    const targetPath = targetRoute.path;
    const currentPath = window.location.pathname;

    if (currentPath !== targetPath) {
      if (replace) {
        window.history.replaceState({ step: historyStep }, '', targetPath);
      } else {
        const nextStep = historyStep + 1;
        maxStepRef.current = nextStep;
        setHistoryStep(nextStep);
        window.history.pushState({ step: nextStep }, '', targetPath);
      }
    }
    setRoute(targetRoute);
  }, [historyStep]);

  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  const goForward = useCallback(() => {
    window.history.forward();
  }, []);

  return {
    ...route,
    navigate,
    goBack,
    goForward,
    canGoBack: historyStep > 0,
    canGoForward: historyStep < maxStepRef.current,
  };
}
