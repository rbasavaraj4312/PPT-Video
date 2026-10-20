import * as LucideIcons from 'lucide-react';

export const ICON_CATEGORIES = [
  { id: 'all', label: 'All Icons' },
  { id: 'cloud', label: 'Cloud & Infra' },
  { id: 'database', label: 'Databases' },
  { id: 'dev', label: 'Dev & Code' },
  { id: 'security', label: 'Security' },
  { id: 'users', label: 'People & Teams' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'flow', label: 'Flow & Status' },
];

export const ICON_CATALOG = [
  // Cloud & Infra
  { id: 'cloud', name: 'Cloud', category: 'cloud', componentName: 'Cloud', tags: ['aws', 'gcp', 'azure', 'saas', 'internet', 'cluster'] },
  { id: 'server', name: 'Server', category: 'cloud', componentName: 'Server', tags: ['host', 'node', 'ec2', 'vps', 'compute', 'backend'] },
  { id: 'globe', name: 'Globe', category: 'cloud', componentName: 'Globe', tags: ['web', 'cdn', 'world', 'domain', 'dns', 'global'] },
  { id: 'network', name: 'Network', category: 'cloud', componentName: 'Network', tags: ['lan', 'wan', 'topology', 'mesh', 'vpc'] },
  { id: 'router', name: 'Router', category: 'cloud', componentName: 'Router', tags: ['gateway', 'switch', 'routing', 'nat'] },
  { id: 'wifi', name: 'WiFi', category: 'cloud', componentName: 'Wifi', tags: ['wireless', 'signal', 'iot', 'connect'] },
  { id: 'cpu', name: 'CPU', category: 'cloud', componentName: 'Cpu', tags: ['processor', 'chip', 'compute', 'worker', 'gpu'] },
  { id: 'layers', name: 'Layers', category: 'cloud', componentName: 'Layers', tags: ['stack', 'microservices', 'kubernetes', 'k8s'] },
  { id: 'boxes', name: 'Boxes', category: 'cloud', componentName: 'Boxes', tags: ['containers', 'docker', 'pods', 'modules'] },

  // Databases & Storage
  { id: 'database', name: 'Database', category: 'database', componentName: 'Database', tags: ['sql', 'postgres', 'mysql', 'db', 'storage', 'data', 'vector'] },
  { id: 'hard-drive', name: 'Hard Drive', category: 'database', componentName: 'HardDrive', tags: ['disk', 'volume', 'ebs', 's3', 'storage'] },
  { id: 'folder', name: 'Folder', category: 'database', componentName: 'Folder', tags: ['directory', 'bucket', 'files', 'assets'] },
  { id: 'archive', name: 'Archive', category: 'database', componentName: 'Archive', tags: ['backup', 'glacier', 'cold', 'history'] },
  { id: 'table', name: 'Table', category: 'database', componentName: 'Table', tags: ['relational', 'tabular', 'spreadsheet', 'grid'] },
  { id: 'binary', name: 'Binary', category: 'database', componentName: 'Binary', tags: ['blob', 'byte', 'raw', 'encoding'] },
  { id: 'file-text', name: 'File Text', category: 'database', componentName: 'FileText', tags: ['document', 'log', 'config', 'manifest'] },
  { id: 'save', name: 'Save', category: 'database', componentName: 'Save', tags: ['diskette', 'persist', 'cache', 'state'] },

  // Dev & Code
  { id: 'terminal', name: 'Terminal', category: 'dev', componentName: 'Terminal', tags: ['cli', 'bash', 'shell', 'console', 'command'] },
  { id: 'code', name: 'Code', category: 'dev', componentName: 'Code', tags: ['script', 'program', 'source', 'developer'] },
  { id: 'git-branch', name: 'Git Branch', category: 'dev', componentName: 'GitBranch', tags: ['vcs', 'repo', 'version', 'branch', 'github'] },
  { id: 'git-commit', name: 'Git Commit', category: 'dev', componentName: 'GitCommit', tags: ['checkpoint', 'sha', 'history'] },
  { id: 'git-pull-request', name: 'Pull Request', category: 'dev', componentName: 'GitPullRequest', tags: ['pr', 'merge', 'review'] },
  { id: 'workflow', name: 'Workflow', category: 'dev', componentName: 'Workflow', tags: ['pipeline', 'ci/cd', 'actions', 'automation'] },
  { id: 'braces', name: 'Braces', category: 'dev', componentName: 'Braces', tags: ['json', 'object', 'code', 'syntax'] },
  { id: 'bug', name: 'Bug', category: 'dev', componentName: 'Bug', tags: ['issue', 'error', 'debug', 'test'] },

  // Security & Identity
  { id: 'shield', name: 'Shield', category: 'security', componentName: 'Shield', tags: ['security', 'firewall', 'protection', 'waf'] },
  { id: 'shield-check', name: 'Shield Check', category: 'security', componentName: 'ShieldCheck', tags: ['verified', 'compliance', 'soc2', 'safe'] },
  { id: 'lock', name: 'Lock', category: 'security', componentName: 'Lock', tags: ['encryption', 'tls', 'ssl', 'secret', 'vault'] },
  { id: 'key', name: 'Key', category: 'security', componentName: 'Key', tags: ['api-key', 'jwt', 'token', 'auth', 'access'] },
  { id: 'fingerprint', name: 'Fingerprint', category: 'security', componentName: 'Fingerprint', tags: ['biometric', 'mfa', 'identity', '2fa'] },
  { id: 'user-check', name: 'User Check', category: 'security', componentName: 'UserCheck', tags: ['authorized', 'role', 'rbac', 'permission'] },
  { id: 'eye', name: 'Eye', category: 'security', componentName: 'Eye', tags: ['audit', 'monitoring', 'observability', 'inspect'] },

  // People & Teams
  { id: 'user', name: 'User', category: 'users', componentName: 'User', tags: ['client', 'person', 'account', 'customer'] },
  { id: 'users', name: 'Users', category: 'users', componentName: 'Users', tags: ['team', 'group', 'audience', 'community'] },
  { id: 'user-plus', name: 'User Plus', category: 'users', componentName: 'UserPlus', tags: ['invite', 'signup', 'onboard'] },
  { id: 'building', name: 'Building', category: 'users', componentName: 'Building', tags: ['enterprise', 'org', 'company', 'office'] },
  { id: 'briefcase', name: 'Briefcase', category: 'users', componentName: 'Briefcase', tags: ['business', 'work', 'job', 'b2b'] },
  { id: 'graduation-cap', name: 'Education', category: 'users', componentName: 'GraduationCap', tags: ['academy', 'school', 'learn', 'training'] },

  // Hardware & Devices
  { id: 'laptop', name: 'Laptop', category: 'hardware', componentName: 'Laptop', tags: ['computer', 'macbook', 'pc', 'client'] },
  { id: 'smartphone', name: 'Smartphone', category: 'hardware', componentName: 'Smartphone', tags: ['mobile', 'ios', 'android', 'phone'] },
  { id: 'tablet', name: 'Tablet', category: 'hardware', componentName: 'Tablet', tags: ['ipad', 'surface', 'touch'] },
  { id: 'monitor', name: 'Monitor', category: 'hardware', componentName: 'Monitor', tags: ['screen', 'display', 'desktop', 'ui'] },
  { id: 'tv', name: 'TV', category: 'hardware', componentName: 'Tv', tags: ['smarttv', 'bigscreen', 'streaming'] },
  { id: 'watch', name: 'Watch', category: 'hardware', componentName: 'Watch', tags: ['wearable', 'sensor', 'applewatch'] },

  // Flow & Status
  { id: 'zap', name: 'Zap', category: 'flow', componentName: 'Zap', tags: ['fast', 'speed', 'serverless', 'lambda', 'event'] },
  { id: 'activity', name: 'Activity', category: 'flow', componentName: 'Activity', tags: ['metrics', 'health', 'telemetry', 'heartbeat', 'datadog'] },
  { id: 'check-circle', name: 'Check Circle', category: 'flow', componentName: 'CheckCircle', tags: ['success', 'done', 'passed', 'healthy'] },
  { id: 'alert-triangle', name: 'Warning', category: 'flow', componentName: 'AlertTriangle', tags: ['alert', 'incident', 'danger', 'failure'] },
  { id: 'clock', name: 'Clock', category: 'flow', componentName: 'Clock', tags: ['latency', 'time', 'cron', 'schedule', 'timeout'] },
  { id: 'refresh-cw', name: 'Sync / Refresh', category: 'flow', componentName: 'RefreshCw', tags: ['sync', 'reload', 'replication', 'polling'] },
  { id: 'arrow-right-circle', name: 'Next / Action', category: 'flow', componentName: 'ArrowRightCircle', tags: ['forward', 'pipeline', 'flow', 'dispatch'] },
  { id: 'share-2', name: 'Share', category: 'flow', componentName: 'Share2', tags: ['publish', 'export', 'broadcast', 'distribute'] },
  { id: 'play', name: 'Play', category: 'flow', componentName: 'Play', tags: ['start', 'run', 'execute', 'live'] },
];

/**
 * Resolve an icon component from a string name (kebab-case, camelCase, or PascalCase).
 */
export function getIconComponent(iconName) {
  if (!iconName) return LucideIcons.Boxes;

  // 1. Direct match in Lucide
  if (LucideIcons[iconName]) {
    return LucideIcons[iconName];
  }

  // 2. Normalize kebab-case or snake_case to PascalCase (e.g. 'git-branch' -> 'GitBranch')
  const pascalName = iconName
    .replace(/(^|[_-])([a-z])/g, (_, __, c) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '');

  if (LucideIcons[pascalName]) {
    return LucideIcons[pascalName];
  }

  // 3. Match from catalog ID
  const item = ICON_CATALOG.find(
    (c) => c.id === iconName.toLowerCase() || c.componentName.toLowerCase() === iconName.toLowerCase()
  );
  if (item && LucideIcons[item.componentName]) {
    return LucideIcons[item.componentName];
  }

  // Fallback
  return LucideIcons.Boxes;
}

/**
 * Filter catalog by search query and category
 */
export function searchIcons(query = '', category = 'all') {
  const q = query.trim().toLowerCase();
  return ICON_CATALOG.filter((item) => {
    const matchesCategory = category === 'all' || item.category === category;
    if (!matchesCategory) return false;
    if (!q) return true;

    return (
      item.id.includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.componentName.toLowerCase().includes(q) ||
      item.tags.some((t) => t.includes(q))
    );
  });
}
