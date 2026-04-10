const MODULE_CONTENT_TYPES = ['richtext', 'pretext'];
const MODULE_VISIBILITIES = ['public', 'private', 'link'];

class ModuleInputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ModuleInputError';
  }
}

const sanitizeText = (value, fallback = '') => {
  const text = String(value || '').trim();
  return text || fallback;
};

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) {
    return [];
  }

  return Array.from(
    new Set(
      tags
        .map((tag) => sanitizeText(tag))
        .filter(Boolean)
    )
  );
};

const normalizeContentType = (value) => {
  const candidate = sanitizeText(value, 'richtext').toLowerCase();
  return MODULE_CONTENT_TYPES.includes(candidate) ? candidate : 'richtext';
};

const normalizeVisibility = (value) => {
  const candidate = sanitizeText(value, 'private').toLowerCase();
  return MODULE_VISIBILITIES.includes(candidate) ? candidate : 'private';
};

const isSupportedContentUrl = (value) =>
  /^https?:\/\//i.test(value) || value.startsWith('/');

const normalizeModuleInput = (body = {}) => {
  const contentType = normalizeContentType(body.contentType);
  const contentUrl = contentType === 'pretext' ? sanitizeText(body.contentUrl) : '';

  if (contentType === 'pretext' && !contentUrl) {
    throw new ModuleInputError('PreTeXt modules require a content URL');
  }

  if (contentType === 'pretext' && !isSupportedContentUrl(contentUrl)) {
    throw new ModuleInputError('PreTeXt content URL must be absolute or root-relative');
  }

  return {
    title: sanitizeText(body.title),
    description: sanitizeText(body.description),
    contentType,
    contentUrl,
    content: contentType === 'pretext' ? '' : String(body.content || '').trim(),
    tags: normalizeTags(body.tags),
    visibility: normalizeVisibility(body.visibility),
  };
};

module.exports = {
  MODULE_CONTENT_TYPES,
  ModuleInputError,
  normalizeModuleInput,
};
