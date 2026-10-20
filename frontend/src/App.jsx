import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePresentation, DEFAULT_PRESENTATION, generateId } from './hooks/usePresentation';
import { useRouter } from './hooks/useRouter';
import { TopBar } from './components/TopBar';
import { Toolbar } from './components/Toolbar';
import { EditorWorkspace } from './components/editor/EditorWorkspace';
import { Canvas } from './components/Canvas';
import { PropertyPanel } from './components/PropertyPanel';
import { PresentationListModal } from './components/PresentationListModal';
import { JsonViewerModal } from './components/JsonViewerModal';
import { SlideShowModal } from './components/SlideShowModal';
import { ExportVideoModal } from './components/ExportVideoModal';
import { IconPickerPopover } from './components/IconPickerPopover';
import { AiOutlineModal } from './components/AiOutlineModal';
import { Dashboard } from './components/Dashboard';
import { TemplateImportModal } from './components/TemplateImportModal';
import { SaveAsTemplateModal } from './components/SaveAsTemplateModal';
import { MotionComponentModal } from './components/MotionComponentModal';
import { CategorizedMotionPickerModal } from './components/CategorizedMotionPickerModal';
import { RemotionPlayerModal } from './motion/core/RemotionPlayerModal';
import { MotionTemplateEditorModal } from './components/MotionTemplateEditorModal';
import { exportNarratedVideo } from './services/speech';
import { needsAnimatedExport } from './narration/timeline';
import { useSlideImages } from './hooks/useSlideImages';
import { 
  fetchPresentations, 
  fetchPresentation, 
  savePresentation, 
  deletePresentation,
  exportPresentation,
  exportVideo,
  compileOutline,
  fetchFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  movePresentationToFolder,
  moveFolder,
  fetchTemplates,
  fetchTemplate,
  saveCustomTemplate,
  updateCustomTemplate,
  deleteCustomTemplate,
  fetchMotionTemplates,
  fetchMotionTemplate,
  saveMotionTemplate,
  updateMotionTemplate,
  deleteMotionTemplate
} from './services/api';


export default function App() {
  const workspaceRef = useRef(null);
  const {
    presentation,
    setPresentation,
    updatePresentation,
    importSlides,
    updatePresentationMeta,
    activeSlide,
    activeSlideIndex,
    setActiveSlideIndex,
    selectedElement,
    selectedElements,
    selectedElementId,
    selectedElementIds,
    setSelectedElementId,
    setSelectedElementIds,
    selectElement,
    selectAllElements,
    activeTool,
    setActiveTool,
    addSlide,
    duplicateSlide,
    deleteSlide,
    reorderSlides,
    updateSlideProperties,
    addElement,
    updateElement,
    updateSelectedElements,
    deleteElement,
    duplicateElement,
    bringToFront,
    sendToBack,
    groupSelected,
    ungroupSelected,
    canGroup,
    canUngroup,
    isGroupSelected,
    clipboard,
    copySelected,
    cutSelected,
    paste,
    styleClipboard,
    copyStyle,
    pasteStyle,
    alignSelected,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePresentation();

  const router = useRouter();
  const images = useSlideImages({ enabled: router.view === 'editor', presentation, activeSlideIndex,
    updatePresentation, setSelectedElementIds, setActiveTool, workspaceRef, paste });
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [presentationsList, setPresentationsList] = useState([]);
  const [folders, setFolders] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [motionTemplates, setMotionTemplates] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [videoExportProgress, setVideoExportProgress] = useState('');
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isSlideShowOpen, setIsSlideShowOpen] = useState(false);
  const [isExportVideoModalOpen, setIsExportVideoModalOpen] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [iconPickerMode, setIconPickerMode] = useState('insert'); // 'insert' | 'change'
  const [isAiOutlineModalOpen, setIsAiOutlineModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSaveAsTemplateModalOpen, setIsSaveAsTemplateModalOpen] = useState(false);
  const [isMotionPickerOpen, setIsMotionPickerOpen] = useState(false);
  const [isRemotionPlayerOpen, setIsRemotionPlayerOpen] = useState(false);
  const [isCustomCodeModalOpen, setIsCustomCodeModalOpen] = useState(false);
  const [codeEditingElement, setCodeEditingElement] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Theme state: 'light' | 'dark'
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('ppt_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  // Apply theme to document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('ppt_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Fetch presentations, folders, templates, and motion templates
  const loadPresentationsAndFolders = useCallback(async () => {
    try {
      setLoadingDashboard(true);
      const [presList, folderList, tplList, motionTplList] = await Promise.all([
        fetchPresentations().catch(() => []),
        fetchFolders().catch(() => []),
        fetchTemplates().catch(() => []),
        fetchMotionTemplates().catch(() => [])
      ]);
      setPresentationsList(presList || []);
      setFolders(folderList || []);
      setTemplates(tplList || []);
      setMotionTemplates(motionTplList || []);
    } catch (err) {
      console.warn('Failed loading dashboard data:', err);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadPresentationsAndFolders();
  }, [loadPresentationsAndFolders]);

  // Route synchronization effect for deep-linking, direct page loads, and browser back/forward
  useEffect(() => {
    let isCancelled = false;

    async function syncRoute() {
      // 1. Template Editor Mode: /templates/:templateId/edit
      if (router.view === 'editor' && router.editorMode === 'template' && router.id) {
        if (editingTemplate?.id === router.id && presentation?.id === router.id) {
          return;
        }
        try {
          setIsLoadingRoute(true);
          const tpl = await fetchTemplate(router.id);
          if (isCancelled) return;
          const clonedSlides = JSON.parse(JSON.stringify(tpl.slides || []));
          setPresentation({
            id: tpl.id,
            title: tpl.name,
            aspect_ratio: tpl.aspect_ratio || '16:9',
            folder_id: null,
            slides: clonedSlides,
          });
          setEditingTemplate(tpl);
          setActiveSlideIndex(0);
          setSelectedElementId(null);
          setSelectedElementIds([]);
        } catch (err) {
          if (isCancelled) return;
          alert(`Template "${router.id}" not found: ${err.message}`);
          router.navigate('/templates', { replace: true });
        } finally {
          if (!isCancelled) setIsLoadingRoute(false);
        }
        return;
      }

      // 2. Presentation Editor Mode: /editor/:presentationId
      if (router.view === 'editor' && router.editorMode === 'presentation' && router.id) {
        if (router.id === 'new') {
          const blank = DEFAULT_PRESENTATION();
          setEditingTemplate(null);
          setPresentation(blank);
          router.navigate(`/editor/${blank.id}`, { replace: true });
          return;
        }

        if (presentation?.id === router.id && !editingTemplate) {
          return;
        }

        try {
          setIsLoadingRoute(true);
          const pres = await fetchPresentation(router.id);
          if (isCancelled) return;
          setEditingTemplate(null);
          setPresentation(pres);
          setActiveSlideIndex(0);
          setSelectedElementId(null);
          setSelectedElementIds([]);
        } catch (err) {
          if (isCancelled) return;
          alert(`Presentation "${router.id}" not found: ${err.message}`);
          router.navigate('/dashboard', { replace: true });
        } finally {
          if (!isCancelled) setIsLoadingRoute(false);
        }
        return;
      }

      // 3. Dashboard Mode
      if (router.view === 'dashboard') {
        if (editingTemplate) {
          setEditingTemplate(null);
        }
      }
    }

    syncRoute();

    return () => {
      isCancelled = true;
    };
  }, [router.view, router.editorMode, router.id]);

  // Save handler (saves presentation or template if in template edit mode)
  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      setSaveSuccess(false);

      if (editingTemplate) {
        const updatedTpl = {
          ...editingTemplate,
          name: presentation.title || editingTemplate.name,
          aspect_ratio: presentation.aspect_ratio || editingTemplate.aspect_ratio,
          slide_count: presentation.slides.length,
          slides: presentation.slides,
        };
        await saveCustomTemplate(updatedTpl);
        setEditingTemplate(updatedTpl);
      } else {
        await savePresentation(presentation);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      loadPresentationsAndFolders();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [presentation, editingTemplate, loadPresentationsAndFolders]);

  // Export handler
  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      await exportPresentation(presentation);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  }, [presentation]);

  // Video export handler
  const handleExportVideo = useCallback(async ({ resolution = '1080p', fps = 60, slide_duration = null } = {}) => {
    try {
      setIsExportingVideo(true);
      setVideoExportProgress('');
      if (needsAnimatedExport(presentation)) {
        await exportNarratedVideo(presentation, { onProgress: job => {
          setVideoExportProgress(`${job.phase || 'Queued'}${job.progress !== undefined ? ` ${job.progress}%` : ''}`);
        } });
      } else {
        await exportVideo(presentation, { resolution, fps, slide_duration });
      }
    } catch (err) {
      console.error('Video export error:', err);
      throw err;
    } finally {
      setIsExportingVideo(false);
    }
  }, [presentation]);

  // New presentation handler from editor
  const handleNewPresentation = () => {
    if (window.confirm('Create a new blank presentation? Unsaved changes in the current one will be lost unless saved.')) {
      setEditingTemplate(null);
      const blank = DEFAULT_PRESENTATION();
      blank.id = generateId('pres');
      setPresentation(blank);
      setActiveSlideIndex(0);
      setSelectedElementId(null);
      setSelectedElementIds([]);
      router.navigate(`/editor/${blank.id}`);
    }
  };

  // Open specific presentation from list or card
  const handleSelectPresentation = async (presOrId) => {
    const id = typeof presOrId === 'object' ? presOrId.id : presOrId;
    try {
      const pres = await fetchPresentation(id);
      setEditingTemplate(null);
      setPresentation(pres);
      setActiveSlideIndex(0);
      setSelectedElementId(null);
      setSelectedElementIds([]);
      router.navigate(`/editor/${id}`);
    } catch (err) {
      alert(`Failed to load presentation: ${err.message}`);
    }
  };

  // Create presentation from dashboard (supports 16:9 Landscape and 9:16 Vertical Reel)
  const handleNewPresentationFromDashboard = (aspectRatio = '16:9', folderId = null) => {
    setEditingTemplate(null);
    const blank = DEFAULT_PRESENTATION();
    blank.id = generateId('pres');
    blank.aspect_ratio = aspectRatio;
    blank.folder_id = folderId;
    blank.title = aspectRatio === '9:16' ? 'Untitled Reel' : 'Untitled Presentation';
    if (aspectRatio === '9:16' && blank.slides) {
      blank.slides.forEach((s) => {
        s.aspect_ratio = '9:16';
      });
    }
    setPresentation(blank);
    setActiveSlideIndex(0);
    setSelectedElementId(null);
    setSelectedElementIds([]);
    router.navigate(`/editor/${blank.id}`);
  };

  const handleDeletePresentation = async (id) => {
    if (window.confirm('Are you sure you want to delete this presentation?')) {
      try {
        await deletePresentation(id);
        await loadPresentationsAndFolders();
      } catch (err) {
        alert(`Failed to delete presentation: ${err.message}`);
      }
    }
  };

  const handleCreateFolder = async (folderData) => {
    try {
      const newFolder = await createFolder(folderData);
      setFolders((prev) => [...prev, newFolder]);
      return newFolder;
    } catch (err) {
      alert(`Failed to create folder: ${err.message}`);
      throw err;
    }
  };

  const handleUpdateFolder = async (id, data) => {
    try {
      const updated = await updateFolder(id, data);
      setFolders((prev) => prev.map((f) => (f.id === id ? updated : f)));
      return updated;
    } catch (err) {
      alert(`Failed to update folder: ${err.message}`);
      throw err;
    }
  };

  const handleDeleteFolder = async (id) => {
    try {
      await deleteFolder(id);
      await loadPresentationsAndFolders();
    } catch (err) {
      alert(`Failed to delete folder: ${err.message}`);
      throw err;
    }
  };

  const handleMoveToFolder = async (presentationId, folderId) => {
    try {
      await movePresentationToFolder(presentationId, folderId);
      await loadPresentationsAndFolders();
    } catch (err) {
      alert(`Failed to move presentation to folder: ${err.message}`);
      throw err;
    }
  };

  const handleMoveFolder = async (folderId, parentId) => {
    try {
      await moveFolder(folderId, parentId);
      await loadPresentationsAndFolders();
    } catch (err) {
      alert(`Failed to move folder: ${err.message}`);
      throw err;
    }
  };

  // Global Ctrl+S shortcut for Save
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
          e.preventDefault();
          if (router.view === 'editor') {
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
          e.preventDefault();
          if (router.view === 'editor') {
            redo();
          }
        }
      } else if (e.key === 'F5') {
        e.preventDefault();
        if (presentation.slides.some(s => s.narration?.script?.trim())) setIsRemotionPlayerOpen(true);
        else setIsSlideShowOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) && !document.activeElement?.isContentEditable) {
          e.preventDefault();
          copyStyle();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
        if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) && !document.activeElement?.isContentEditable) {
          e.preventDefault();
          pasteStyle();
        }
      } else if (e.key.toLowerCase() === 'i' && !e.ctrlKey && !e.metaKey) {
        if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
          e.preventDefault();
          setIsIconPickerOpen((prev) => !prev);
        }
      } else if (e.key.toLowerCase() === 'm' && !e.ctrlKey && !e.metaKey) {
        if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
          e.preventDefault();
          setIsMotionPickerOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [handleSave, undo, redo, router.view, copyStyle, pasteStyle]);

  const handleOpenIconPicker = (mode = 'insert') => {
    setIconPickerMode(mode);
    setIsIconPickerOpen(true);
  };

  const handleSelectIcon = (iconItem) => {
    if (iconPickerMode === 'change' && selectedElement) {
      if (selectedElement.type === 'icon') {
        updateElement(selectedElement.id, { icon_name: iconItem.id });
      } else if (selectedElement.type === 'motion_component') {
        updateElement(selectedElement.id, {
          motion_data: {
            ...(selectedElement.motion_data || {}),
            icon: iconItem.id,
          },
        });
      }
    } else {
      const newId = `el-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const newIconElement = {
        id: newId,
        type: 'icon',
        x: 580,
        y: 280,
        width: 100,
        height: 100,
        icon_name: iconItem.id,
        icon_badge: 'rounded',
        badge_color: '#1e293b',
        icon_color: '#38bdf8',
        fill_color: '#1e293b',
        stroke_color: '#334155',
        stroke_width: 2,
        content: iconItem.name,
        font_size: 14,
        font_color: '#ffffff',
        opacity: 1.0,
        z_index: (activeSlide?.elements?.length || 0) + 1,
      };
      addElement(newIconElement);
      setSelectedElementId(newId);
      setSelectedElementIds([newId]);
    }
  };

  const handleInsertMotionComponent = (compDef) => {
    const newId = `el-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const isVertical = presentation?.aspect_ratio === '9:16';
    const canvasW = isVertical ? 720 : 1280;
    const canvasH = isVertical ? 1280 : 720;
    const width = compDef.width || compDef.defaultWidth || 420;
    const height = compDef.height || compDef.defaultHeight || 220;

    // Center component on current slide canvas
    const x = Math.max(20, Math.round((canvasW - width) / 2));
    const y = Math.max(20, Math.round((canvasH - height) / 2));

    const componentId = compDef.component_id || compDef.id;
    const customVars = {
      ...(compDef.custom_vars || {}),
      ...(compDef.motion_data?.custom_vars || {}),
    };

    const newElement = {
      id: newId,
      type: 'motion_component',
      x,
      y,
      width,
      height,
      z_index: (activeSlide?.elements?.length || 0) + 1,
      opacity: 1.0,
      fill_color: 'transparent',
      stroke_color: 'transparent',
      content: compDef.name || 'Motion Component',
      motion_data: {
        component_id: componentId,
        name: compDef.name,
        category: compDef.category || 'cards',
        code: compDef.code,
        custom_vars: customVars,
      },
    };

    addElement(newElement);
    setSelectedElementId(newId);
    setSelectedElementIds([newId]);
    setIsMotionPickerOpen(false);
  };

  const handleOpenCodeEditor = (targetElement) => {
    if (targetElement) {
      setCodeEditingElement(targetElement);
      setIsCustomCodeModalOpen(true);
    } else {
      // Create a new motion template on canvas and open editor for it
      const newId = `el-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const isVertical = presentation?.aspect_ratio === '9:16';
      const canvasW = isVertical ? 720 : 1280;
      const canvasH = isVertical ? 1280 : 720;
      const width = 420;
      const height = 220;
      const x = Math.max(20, Math.round((canvasW - width) / 2));
      const y = Math.max(20, Math.round((canvasH - height) / 2));

      const newElement = {
        id: newId,
        type: 'motion_component',
        x,
        y,
        width,
        height,
        z_index: (activeSlide?.elements?.length || 0) + 1,
        opacity: 1.0,
        fill_color: 'transparent',
        stroke_color: 'transparent',
        content: 'New Motion Template',
        motion_data: {
          component_id: `mot-${Date.now()}`,
          name: 'New Motion Template',
          category: 'cards',
          custom_vars: {},
        },
      };

      addElement(newElement);
      setSelectedElementId(newId);
      setSelectedElementIds([newId]);
      setCodeEditingElement(newElement);
      setIsCustomCodeModalOpen(true);
    }
  };

  const handleSaveMotionTemplateFromEditor = async (templateData) => {
    try {
      await saveMotionTemplate(templateData);
      const updatedTpls = await fetchMotionTemplates().catch(() => []);
      setMotionTemplates(updatedTpls);

      if (codeEditingElement) {
        updateElement(codeEditingElement.id, {
          motion_data: {
            ...(codeEditingElement.motion_data || {}),
            component_id: templateData.id,
            name: templateData.name,
            category: templateData.category,
            code: templateData.code,
            custom_vars: { ...(templateData.custom_vars || {}) },
          },
          content: templateData.name,
        });
      }
    } catch (err) {
      alert(`Failed to save motion template: ${err.message}`);
      throw err;
    }
  };

  const handleDeleteMotionTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this motion template?')) return;
    try {
      setMotionTemplates((prev) => prev.filter((t) => t.id !== templateId));
      await deleteMotionTemplate(templateId);
      const updatedTpls = await fetchMotionTemplates().catch(() => []);
      setMotionTemplates(updatedTpls);
    } catch (err) {
      alert(`Failed to delete motion template: ${err.message}`);
      await loadPresentationsAndFolders();
    }
  };

  const handleDuplicateMotionTemplate = async (template) => {
    try {
      const duplicated = {
        ...template,
        id: `mot-${Date.now()}`,
        name: `${template.name} (Copy)`,
        is_builtin: false,
      };
      await saveMotionTemplate(duplicated);
      const updatedTpls = await fetchMotionTemplates().catch(() => []);
      setMotionTemplates(updatedTpls);
    } catch (err) {
      alert(`Failed to duplicate motion template: ${err.message}`);
    }
  };


  const handleCompileOutline = async (outlineText, themeName, insertMode = false) => {
    const compiled = await compileOutline(outlineText, themeName);
    if (!compiled || !compiled.slides || compiled.slides.length === 0) {
      throw new Error('Outline did not generate any slides. Please verify outline format.');
    }

    if (insertMode && router.view === 'editor' && presentation) {
      // Remap IDs to ensure uniqueness when inserting into existing presentation
      const timestamp = Date.now();
      const remappedSlides = compiled.slides.map((slide, sIdx) => {
        const newSlideId = `slide-${timestamp}-${sIdx}-${Math.random().toString(36).substring(2, 6)}`;
        const idMap = {};
        const remappedElements = (slide.elements || []).map((el, eIdx) => {
          const newElId = `el-${timestamp}-${sIdx}-${eIdx}-${Math.random().toString(36).substring(2, 6)}`;
          idMap[el.id] = newElId;
          return {
            ...el,
            id: newElId,
          };
        });
        const finalElements = remappedElements.map((el) => {
          if (el.type === 'arrow') {
            return {
              ...el,
              connected_from: el.connected_from ? (idMap[el.connected_from] || el.connected_from) : null,
              connected_to: el.connected_to ? (idMap[el.connected_to] || el.connected_to) : null,
            };
          }
          return el;
        });
        return {
          ...slide,
          id: newSlideId,
          elements: finalElements,
        };
      });

      const insertAt = activeSlideIndex >= 0 ? activeSlideIndex + 1 : presentation.slides.length;
      const newSlides = [
        ...presentation.slides.slice(0, insertAt),
        ...remappedSlides,
        ...presentation.slides.slice(insertAt),
      ];

      setPresentation((prev) => ({
        ...prev,
        slides: newSlides,
      }));
      setActiveSlideIndex(insertAt);
      setSelectedElementId(null);
      setSelectedElementIds([]);
    } else {
      setEditingTemplate(null);
      if (!compiled.id) {
        compiled.id = generateId('pres');
      }
      setPresentation(compiled);
      setActiveSlideIndex(0);
      setSelectedElementId(null);
      setSelectedElementIds([]);
      router.navigate(`/editor/${compiled.id}`);
    }
  };

  const handleUseTemplate = (template) => {
    if (!template || !template.slides || template.slides.length === 0) return;
    setEditingTemplate(null);
    const clonedSlides = JSON.parse(JSON.stringify(template.slides));
    const newPres = {
      id: generateId('pres'),
      title: template.name || 'New Presentation',
      aspect_ratio: template.aspect_ratio || '16:9',
      folder_id: null,
      slides: clonedSlides,
    };
    setPresentation(newPres);
    setActiveSlideIndex(0);
    setSelectedElementId(null);
    setSelectedElementIds([]);
    router.navigate(`/editor/${newPres.id}`);
  };

  const handleEditTemplateSlides = (template) => {
    if (!template || !template.slides) return;
    const clonedSlides = JSON.parse(JSON.stringify(template.slides));
    const templatePres = {
      id: template.id,
      title: template.name,
      aspect_ratio: template.aspect_ratio || '16:9',
      folder_id: null,
      slides: clonedSlides,
    };
    setPresentation(templatePres);
    setEditingTemplate(template);
    setActiveSlideIndex(0);
    setSelectedElementId(null);
    setSelectedElementIds([]);
    router.navigate(`/templates/${template.id}/edit`);
  };

  const handleSaveTemplate = async (templateData) => {
    try {
      await saveCustomTemplate(templateData);
      await loadPresentationsAndFolders();
      if (editingTemplate && editingTemplate.id === templateData.id) {
        setEditingTemplate(templateData);
      }
    } catch (err) {
      alert(`Failed to save template: ${err.message}`);
      throw err;
    }
  };

  const handleDuplicateTemplate = async (template) => {
    try {
      const clonedSlides = JSON.parse(JSON.stringify(template.slides || []));
      const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36);
      const newTpl = {
        ...template,
        id: `tpl-custom-${uuid}`,
        name: `Copy of ${template.name}`,
        is_builtin: false,
        slides: clonedSlides,
        slide_count: clonedSlides.length,
      };
      await saveCustomTemplate(newTpl);
      await loadPresentationsAndFolders();
    } catch (err) {
      alert(`Failed to duplicate template: ${err.message}`);
    }
  };

  const handleSaveAsTemplate = async (templateData) => {
    try {
      await saveCustomTemplate(templateData);
      await loadPresentationsAndFolders();
      alert(`Template "${templateData.name}" has been saved to your library!`);
    } catch (err) {
      alert(`Failed to save template: ${err.message}`);
      throw err;
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
        await deleteCustomTemplate(templateId);
        await loadPresentationsAndFolders();
      } catch (err) {
        alert(`Failed to delete template: ${err.message}`);
        await loadPresentationsAndFolders();
      }
    }
  };

  const handleImportSlides = (importedSlides, mode, template) => {
    if (!importedSlides || importedSlides.length === 0) return;
    importSlides(importedSlides, mode, template);
  };

  // Loading state during direct URL transitions & reloads
  if (isLoadingRoute) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 font-sans">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-300">
          {router.editorMode === 'template' ? 'Loading Template Studio...' : 'Loading Presentation...'}
        </p>
      </div>
    );
  }

  // Render Dashboard View
  if (router.view === 'dashboard') {
    return (
      <div className="h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans transition-colors duration-200">
        <Dashboard
          presentations={presentationsList}
          folders={folders}
          templates={templates}
          motionTemplates={motionTemplates}
          currentSection={router.section}
          onSectionChange={(sec) => {
            if (sec === 'templates') {
              router.navigate('/templates');
            } else if (sec === 'motion-templates') {
              router.navigate('/motion-templates');
            } else {
              router.navigate(router.folderId ? `/dashboard/folder/${router.folderId}` : '/dashboard');
            }
          }}
          selectedFolderId={router.folderId}
          onFolderChange={(folderId) => {
            router.navigate(folderId ? `/dashboard/folder/${folderId}` : '/dashboard');
          }}
          canGoBack={router.canGoBack}
          canGoForward={router.canGoForward}
          onGoBack={router.goBack}
          onGoForward={router.goForward}
          onSelectPresentation={handleSelectPresentation}
          onNewPresentation={handleNewPresentationFromDashboard}
          onDeletePresentation={handleDeletePresentation}
          onCreateFolder={handleCreateFolder}
          onUpdateFolder={handleUpdateFolder}
          onDeleteFolder={handleDeleteFolder}
          onMoveToFolder={handleMoveToFolder}
          onMoveFolder={handleMoveFolder}
          onUseTemplate={handleUseTemplate}
          onEditTemplateSlides={handleEditTemplateSlides}
          onSaveTemplate={handleSaveTemplate}
          onDuplicateTemplate={handleDuplicateTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          onSaveMotionTemplate={handleSaveMotionTemplateFromEditor}
          onDeleteMotionTemplate={handleDeleteMotionTemplate}
          onDuplicateMotionTemplate={handleDuplicateMotionTemplate}

          onOpenAiOutline={() => setIsAiOutlineModalOpen(true)}
          onExportVideo={async (pres) => {
            try {
              const fullPres = await fetchPresentation(pres.id);
              setPresentation(fullPres);
              setIsExportVideoModalOpen(true);
            } catch (err) {
              alert(`Failed to load presentation for export: ${err.message}`);
            }
          }}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        {/* AI Outline Engine Modal */}
        <AiOutlineModal
          isOpen={isAiOutlineModalOpen}
          onClose={() => setIsAiOutlineModalOpen(false)}
          onCompileOutline={handleCompileOutline}
          isEditorMode={false}
          currentSlideCount={0}
        />

        {/* Export Video Modal */}
        <ExportVideoModal
          isOpen={isExportVideoModalOpen}
          onClose={() => setIsExportVideoModalOpen(false)}
          presentation={presentation}
          onExport={handleExportVideo}
          isExporting={isExportingVideo}
          exportProgress={videoExportProgress}
        />
      </div>
    );
  }

  // Render Presentation Editor View
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Top Application Bar */}
      {images.error && <div role="alert" className="image-import-alert">{images.error}<button aria-label="Dismiss image error" onClick={() => images.setError('')}>×</button></div>}
      {images.loading && <div className="image-import-alert" role="status">Adding image…</div>}
      <TopBar
        presentation={presentation}
        updatePresentationMeta={updatePresentationMeta}
        onSave={handleSave}
        onExport={handleExport}
        onExportVideo={() => setIsExportVideoModalOpen(true)}
        onStartSlideShow={() => presentation.slides.some(s => s.narration?.script?.trim())
          ? setIsRemotionPlayerOpen(true) : setIsSlideShowOpen(true)}
        onStartRemotionVideo={() => workspaceRef.current?.preview()}
        onOpenNarration={() => workspaceRef.current?.showVoice()}
        onOpenAiOutlineModal={() => setIsAiOutlineModalOpen(true)}
        onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
        onSaveAsTemplate={() => setIsSaveAsTemplateModalOpen(true)}
        isTemplateMode={!!editingTemplate}
        editingTemplate={editingTemplate}
        onBackToDashboard={() => {
          loadPresentationsAndFolders();
          if (editingTemplate) {
            setEditingTemplate(null);
            router.navigate('/templates');
          } else if (presentation?.folder_id) {
            router.navigate(`/dashboard/folder/${presentation.folder_id}`);
          } else {
            router.navigate('/dashboard');
          }
        }}
        isSaving={isSaving}
        isExporting={isExporting}
        isExportingVideo={isExportingVideo}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onNewPresentation={handleNewPresentation}
        onOpenList={() => setIsListModalOpen(true)}
        onOpenJsonModal={() => setIsJsonModalOpen(true)}
        saveSuccess={saveSuccess}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <EditorWorkspace
        ref={workspaceRef}
        presentation={presentation}
        activeSlideIndex={activeSlideIndex}
        onSelectSlide={setActiveSlideIndex}
        updatePresentation={updatePresentation}
        onUpdateSlide={updateSlideProperties}
        selectedElementId={selectedElementId}
        selectedElements={selectedElements}
        onUpdateSelectedElements={updateSelectedElements}
        onSelectRevealElement={(id, slideIndex) => selectElement(id, { slideIndex })}
        sidebarProps={{ onAddSlide: addSlide, onDuplicateSlide: duplicateSlide, onDeleteSlide: deleteSlide,
          onReorderSlides: reorderSlides, onOpenTemplateModal: () => setIsTemplateModalOpen(true),
          onOpenAiOutline: () => setIsAiOutlineModalOpen(true) }}
        toolbar={<Toolbar
            onInsertImages={images.insert}
            activeTool={activeTool}
            setActiveTool={tool => { workspaceRef.current?.edit(); setActiveTool(tool); }}
            onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo}
            onOpenIconPicker={() => handleOpenIconPicker('insert')}
            isIconPickerOpen={isIconPickerOpen}
            onOpenMotionPicker={() => setIsMotionPickerOpen(true)}
            isMotionPickerOpen={isMotionPickerOpen}
            onCut={cutSelected}
            onCopy={copySelected}
            onPaste={images.pasteFromClipboard}
            canPaste={Boolean(navigator.clipboard?.read) || Boolean(clipboard?.elements?.length)}
            hasSelection={selectedElementIds.length > 0}
            onGroup={groupSelected}
            canGroup={canGroup}
            onUngroup={ungroupSelected}
            canUngroup={canUngroup}
          />}
        canvas={<Canvas
            onInsertImages={images.insert}
            activeSlide={activeSlide}
            aspectRatio={presentation.aspect_ratio || '16:9'}
            selectedElementId={selectedElementId}
            setSelectedElementId={setSelectedElementId}
            selectedElementIds={selectedElementIds}
            setSelectedElementIds={setSelectedElementIds}
            selectedElements={selectedElements}
            selectElement={selectElement}
            selectAllElements={selectAllElements}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            addElement={addElement}
            updateElement={updateElement}
            deleteElement={deleteElement}
            duplicateElement={duplicateElement}
            groupSelected={groupSelected}
            ungroupSelected={ungroupSelected}
            copySelected={copySelected}
            cutSelected={cutSelected}
            paste={paste}
            copyStyle={copyStyle}
            pasteStyle={pasteStyle}
          />}
        designPanel={<PropertyPanel
          selectedElement={selectedElement}
          selectedElements={selectedElements}
          selectedElementIds={selectedElementIds}
          activeSlide={activeSlide}
          onUpdateElement={updateElement}
          onUpdateSelectedElements={updateSelectedElements}
          onDeleteElement={deleteElement}
          onDuplicateElement={duplicateElement}
          onBringToFront={bringToFront}
          onSendToBack={sendToBack}
          onUpdateSlide={updateSlideProperties}
          onGroup={groupSelected}
          canGroup={canGroup}
          onUngroup={ungroupSelected}
          canUngroup={canUngroup}
          isGroupSelected={isGroupSelected}
          onAlign={alignSelected}
          onCopy={copySelected}
          onCut={cutSelected}
          onCopyStyle={copyStyle}
          onPasteStyle={pasteStyle}
          hasStyleClipboard={!!styleClipboard}
          onOpenIconPicker={() => handleOpenIconPicker('change')}
          onOpenCodeEditor={handleOpenCodeEditor}
        />}
      />

      {/* Modals */}
      <PresentationListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        onSelectPresentation={handleSelectPresentation}
      />

      <JsonViewerModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        presentation={presentation}
      />

      {/* Slide Show Modal (Present Preview Mode) */}
      <SlideShowModal
        isOpen={isSlideShowOpen}
        onClose={() => setIsSlideShowOpen(false)}
        presentation={presentation}
        initialSlideIndex={activeSlideIndex}
      />

      {/* Export Video Modal */}
      <ExportVideoModal
        isOpen={isExportVideoModalOpen}
        onClose={() => setIsExportVideoModalOpen(false)}
        presentation={presentation}
        onExport={handleExportVideo}
        isExporting={isExportingVideo}
        exportProgress={videoExportProgress}
      />

      {/* Icon Picker Popover */}
      <IconPickerPopover
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        onSelectIcon={handleSelectIcon}
      />

      {/* AI Outline Engine Modal */}
      <AiOutlineModal
        isOpen={isAiOutlineModalOpen}
        onClose={() => setIsAiOutlineModalOpen(false)}
        onCompileOutline={handleCompileOutline}
        isEditorMode={!editingTemplate}
        currentSlideCount={presentation?.slides?.length || 0}
      />

      {/* Template Import Modal */}
      <TemplateImportModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        templates={templates}
        currentSlideCount={presentation?.slides?.length || 0}
        activeSlideIndex={activeSlideIndex}
        onImportSlides={handleImportSlides}
      />

      {/* Save Deck as Reusable Template Modal */}
      <SaveAsTemplateModal
        isOpen={isSaveAsTemplateModalOpen}
        onClose={() => setIsSaveAsTemplateModalOpen(false)}
        presentation={presentation}
        onSaveAsTemplate={handleSaveAsTemplate}
      />

      {/* Categorized Motion Components & Recipes Modal */}
      <CategorizedMotionPickerModal
        isOpen={isMotionPickerOpen}
        onClose={() => setIsMotionPickerOpen(false)}
        onInsertComponent={handleInsertMotionComponent}
      />

      {/* Remotion Live Video Player Modal */}
      <RemotionPlayerModal
        isOpen={isRemotionPlayerOpen}
        onClose={() => setIsRemotionPlayerOpen(false)}
        presentation={presentation}
      />

      {/* Motion Template Code Editor Modal (Unified HTML + CSS & Custom Variables) */}
      <MotionTemplateEditorModal
        isOpen={isCustomCodeModalOpen}
        onClose={() => {
          setIsCustomCodeModalOpen(false);
          setCodeEditingElement(null);
        }}
        template={
          codeEditingElement
            ? {
                id: codeEditingElement.motion_data?.component_id || codeEditingElement.id,
                name: codeEditingElement.motion_data?.name || codeEditingElement.content || 'Motion Template',
                category: codeEditingElement.motion_data?.category || 'cards',
                width: codeEditingElement.width || 420,
                height: codeEditingElement.height || 220,
                code: codeEditingElement.motion_data?.code || '',
                custom_vars: codeEditingElement.motion_data?.custom_vars || {},
              }
            : null
        }
        onSave={handleSaveMotionTemplateFromEditor}
        onInsertIntoSlide={(newTpl) => {
          handleInsertMotionComponent(newTpl);
          setIsCustomCodeModalOpen(false);
        }}
      />
    </div>
  );
}

