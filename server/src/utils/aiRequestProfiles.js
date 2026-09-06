const getAiRequestProfile = (
  profileName = 'default',
  {
    defaultTimeoutMs = 9000,
    providerDefaultTemperature = 0.7,
    providerDefaultMaxOutputTokens = 2048,
  } = {}
) => {
  switch (profileName) {
    case 'roadmap':
      return {
        timeoutMs: Math.min(defaultTimeoutMs + 3000, 14000),
        temperature: 0.35,
        maxOutputTokens: 1400,
        responseMimeType: 'application/json',
      };
    case 'chat':
      return {
        timeoutMs: Math.max(6000, defaultTimeoutMs - 1000),
        temperature: 0.5,
        maxOutputTokens: 700,
      };
    case 'study-session':
      return {
        timeoutMs: defaultTimeoutMs,
        temperature: 0.4,
        maxOutputTokens: 1100,
        responseMimeType: 'application/json',
      };
    case 'studio-tool':
      return {
        timeoutMs: Math.min(defaultTimeoutMs + 1000, 12000),
        temperature: 0.3,
        maxOutputTokens: 1200,
        responseMimeType: 'application/json',
      };
    case 'health-check':
      return {
        timeoutMs: Math.min(defaultTimeoutMs, 4000),
        temperature: 0,
        maxOutputTokens: 96,
      };
    default:
      return {
        timeoutMs: defaultTimeoutMs,
        temperature: providerDefaultTemperature,
        maxOutputTokens: providerDefaultMaxOutputTokens,
      };
  }
};

module.exports = {
  getAiRequestProfile,
};
