/**
 * Categorization & Filtering Taxonomy for Motion Templates and Components
 */

export const FUNCTIONAL_CATEGORIES = [
  {
    id: 'all',
    label: 'All Components',
    icon: 'Sparkles',
    description: 'Browse the entire catalog of motion elements and shot recipes',
  },
  {
    id: 'hooks',
    label: 'Hooks & Intros',
    icon: 'Target',
    description: 'High-retention opening hooks, countdowns, and punchy statement reveals (Video-Shotcraft)',
  },
  {
    id: 'typography',
    label: 'Kinetic Typography',
    icon: 'Type',
    description: 'Animated headlines, blur reveals, cyber scramble text, and glowing words (React Bits)',
  },
  {
    id: 'cards',
    label: 'Feature & Bento Cards',
    icon: 'Layers',
    description: 'Glowing glassmorphism cards, HUD brackets, and modular bento grids (Aceternity UI / Remocn)',
  },
  {
    id: 'metrics',
    label: 'Metrics & Counters',
    icon: 'TrendingUp',
    description: 'Live ticking numbers, percentage rings, latency gauges, and stat clashes (Shotcraft / Remocn)',
  },
  {
    id: 'clash',
    label: 'Versus & Comparison',
    icon: 'Swords',
    description: 'Split-screen duels, legacy vs modern comparisons, and side-by-side metric battles',
  },
  {
    id: 'process',
    label: 'Process & Timelines',
    icon: 'GitBranch',
    description: 'Step-by-step guides (01, 02, 03), animated roadmaps, and tracing beam flows',
  },
  {
    id: 'architecture',
    label: 'Architecture & Flows',
    icon: 'Network',
    description: 'Connected microservices, glowing data conduits, and distributed cluster spotlights',
  },
  {
    id: 'ambient',
    label: 'Ambient Backgrounds',
    icon: 'Sun',
    description: 'Dynamic spotlights, auroras, cyber laser grids, and floating particle meshes (Aceternity UI)',
  },
  {
    id: 'outro',
    label: 'CTAs & Outros',
    icon: 'Bookmark',
    description: 'High-conversion conclusion cards, bookmark reminders, and social callouts (Video-Shotcraft)',
  },
];

export const FORMAT_OPTIONS = [
  { id: 'all', label: 'All Formats' },
  { id: '9:16', label: '9:16 Reels / Shorts' },
  { id: '16:9', label: '16:9 Landscape' },
];

export const STYLE_PRESETS = [
  { id: 'all', label: 'All Styles' },
  { id: 'cyber', label: 'Cyberpunk Neon', color: '#00f2fe' },
  { id: 'minimal', label: 'Clean Modern', color: '#f8fafc' },
  { id: 'emerald', label: 'Emerald Tech', color: '#10b981' },
  { id: 'sunset', label: 'Sunset Warmth', color: '#f97316' },
];

export const SOURCE_LIBRARIES = [
  { id: 'all', label: 'All Sources' },
  { id: 'shotcraft', label: 'Video-Shotcraft', badge: 'Shotcraft' },
  { id: 'aceternity', label: 'Aceternity UI', badge: 'Aceternity' },
  { id: 'react-bits', label: 'React Bits', badge: 'React Bits' },
  { id: 'remocn', label: 'Remocn', badge: 'Remocn' },
  { id: 'builtin', label: 'Studio Native', badge: 'Built-in' },
];

/**
 * Filter helper for motion items
 */
export function filterMotionItems(items, { category = 'all', format = 'all', style = 'all', source = 'all', searchQuery = '' } = {}) {
  const query = (searchQuery || '').trim().toLowerCase();

  return items.filter((item) => {
    // 1. Category filter
    if (category !== 'all' && item.category !== category) {
      return false;
    }

    // 2. Format filter
    if (format !== 'all') {
      const itemFormat = item.aspectRatio || 'flexible';
      if (itemFormat !== 'flexible' && itemFormat !== format) {
        return false;
      }
    }

    // 3. Style preset filter
    if (style !== 'all' && item.stylePreset && item.stylePreset !== style) {
      return false;
    }

    // 4. Source library filter
    if (source !== 'all' && item.sourceLibrary !== source) {
      return false;
    }

    // 5. Search query (matches name, description, category, tags, or source)
    if (query) {
      const matchName = (item.name || '').toLowerCase().includes(query);
      const matchDesc = (item.description || '').toLowerCase().includes(query);
      const matchCategory = (item.category || '').toLowerCase().includes(query);
      const matchSource = (item.sourceLibrary || '').toLowerCase().includes(query);
      const matchTags = Array.isArray(item.tags) && item.tags.some((t) => t.toLowerCase().includes(query));

      if (!matchName && !matchDesc && !matchCategory && !matchSource && !matchTags) {
        return false;
      }
    }

    return true;
  });
}
