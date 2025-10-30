export const DEFAULT_CONFIG = {
  appName: 'Borrower Contact Assistant',
  orgName: 'RevEL Lending',
  theme: {
    primary: '#2B539A',
    accent: '#3296C8',
    text: '#111827',
    secondaryText: '#6B7280',
    card: '#F9FAFB',
    line: '#E5E7EB',
    bgFarLeft: '#2F294F',
    bgDarkNavy: '#1A324A',
    bgMediumBlue: '#2B539A',
    bgLightBlue: '#3296C8',
  },
  privacy: {
    dataAtRest: 'AES-256',
    dataInTransit: 'TLS 1.3',
    certifications: ['SOC 2 (WIP for proto)', 'ISO 27001 (future)'],
  },
};

export type AppConfig = typeof DEFAULT_CONFIG;

let currentConfig: AppConfig = DEFAULT_CONFIG;

(async () => {
  try {
    const res = await fetch('/config.json', { cache: 'no-store' });
    if (res.ok) {
      const external = await res.json();
      currentConfig = {
        ...DEFAULT_CONFIG,
        ...external,
        theme: { ...DEFAULT_CONFIG.theme, ...(external.theme || {}) },
      };
    }
  } catch {
    // ignore fetch errors, keep defaults
  }
})();

export const getConfig = () => currentConfig;
