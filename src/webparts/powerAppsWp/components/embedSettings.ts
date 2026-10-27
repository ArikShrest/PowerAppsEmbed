const placeholderPattern = /\[([^\[\]]+)\]/g;
const parameterNamePattern = /^[A-Za-z0-9_.-]+$/;

function parseAppUrl(template: string): URL {
  const url = new URL(template.trim());
  if (url.protocol !== 'https:' || url.hostname !== 'apps.powerapps.com' ||
      url.username || url.password || (url.port && url.port !== '443')) {
    throw new Error('Use an HTTPS app URL on apps.powerapps.com.');
  }
  if (/[[\]]/.test(decodeURIComponent(url.pathname)) || /[[\]]/.test(decodeURIComponent(url.hash))) {
    throw new Error('Placeholders are supported only in query parameter values.');
  }
  url.searchParams.forEach((value, key) => {
    if (/[[\]]/.test(key)) throw new Error('Query parameter names cannot contain placeholders.');
    const remainder = value.replace(placeholderPattern, (_placeholder: string, name: string) => {
      if (!parameterNamePattern.test(name)) throw new Error('Placeholder names can contain letters, numbers, dots, underscores, and hyphens.');
      return '';
    });
    if (/[[\]]/.test(remainder)) throw new Error('Use matching brackets for each placeholder, such as [cmId].');
  });
  return url;
}

export function detectParameterNames(template: string): string[] {
  if (!template || !template.trim()) return [];
  const names: string[] = [];
  parseAppUrl(template).searchParams.forEach(value => {
    value.replace(placeholderPattern, (_placeholder: string, name: string) => {
      if (names.indexOf(name) === -1) names.push(name);
      return '';
    });
  });
  return names;
}

export function validateAppUrl(template: string): string {
  if (!template || !template.trim()) return '';
  try {
    parseAppUrl(template);
    return '';
  } catch (error) {
    return error instanceof Error ? error.message : 'Enter a valid app URL.';
  }
}

export function validateParameterNames(names: string): string {
  if (!names || !names.trim()) return '';
  return names.split(',').every(name => parameterNamePattern.test(name.trim())) ? '' :
    'Enter comma-separated names using letters, numbers, dots, underscores, or hyphens.';
}

export function resolveAppUrl(template: string, _names: string, pageUrl: string): string {
  if (!template || !template.trim()) return '';
  const url = parseAppUrl(template);
  // Saved parameter-name lists remain compatible; placeholders are now detected automatically.
  const pageParams = new URL(pageUrl).searchParams;
  const entries: Array<[string, string]> = [];
  url.searchParams.forEach((value, key) => {
    const resolved = value.replace(placeholderPattern, (_placeholder: string, name: string) => pageParams.get(name) || '');
    entries.push([key, resolved]);
  });
  url.search = '';
  entries.forEach(([key, value]) => url.searchParams.append(key, value));
  return url.toString();
}

export function validateDimension(value: string): string {
  const dimension = (value || '').trim();
  if (!dimension) return '';
  return /^(?:\d+(?:\.\d+)?|\.\d+)(?:px|%|vh|vw|rem|em)?$/.test(dimension) &&
    Number.isFinite(parseFloat(dimension)) && parseFloat(dimension) > 0 ? '' :
    'Enter a positive number of pixels or a value such as 100%, 600px, or 70vh.';
}

export function resolveDimension(value: string, fallback: string): string {
  const dimension = (value || '').trim();
  if (!dimension || validateDimension(dimension)) return fallback;
  return /[a-z%]$/.test(dimension) ? dimension : `${dimension}px`;
}
