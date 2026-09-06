export const isPretextModule = (module) =>
  String(module?.contentType || 'richtext')
    .trim()
    .toLowerCase() === 'pretext';

export const getModuleViewPath = (moduleId) => `/modules/${moduleId}/view`;

export const getModuleEditPath = (moduleId) => `/modules/${moduleId}`;

export const buildModuleViewTarget = (module) => {
  const pathname = getModuleViewPath(module?._id || 'preview');

  if (!module?.fixture) {
    return pathname;
  }

  const params = new URLSearchParams();
  params.set('fixture', '1');
  params.set('title', String(module?.title || 'Module preview'));
  params.set('description', String(module?.description || ''));
  params.set('contentType', isPretextModule(module) ? 'pretext' : 'richtext');

  if (isPretextModule(module)) {
    params.set('src', String(module?.contentUrl || '').trim());
  } else {
    params.set('html', String(module?.content || '').trim());
  }

  return {
    pathname,
    search: `?${params.toString()}`,
  };
};

export const getModuleFixtureFromSearchParams = (searchParams) => {
  if (searchParams?.get('fixture') !== '1') {
    return null;
  }

  const contentType = String(searchParams.get('contentType') || 'richtext')
    .trim()
    .toLowerCase();

  return {
    _id: 'fixture-preview',
    fixture: true,
    title: String(searchParams.get('title') || 'Module preview').trim(),
    description: String(searchParams.get('description') || '').trim(),
    contentType,
    contentUrl: contentType === 'pretext' ? String(searchParams.get('src') || '').trim() : '',
    content: contentType === 'pretext' ? '' : String(searchParams.get('html') || '').trim(),
  };
};

export const resolveModuleViewerState = (module) => {
  if (isPretextModule(module)) {
    return {
      mode: 'iframe',
      src: String(module?.contentUrl || '').trim(),
    };
  }

  return {
    mode: 'html',
    html: String(module?.content || '').trim() || '<p>Nothing to show yet.</p>',
  };
};
