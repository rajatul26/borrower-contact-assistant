import React from 'react';
import { getConfig } from '@/config/brand';

export const ThemeVars = () => {
  const CONFIG = getConfig();
  return (
    <style>{`
      :root{
        --brand-primary:${CONFIG.theme.primary};
        --brand-accent:${CONFIG.theme.accent};
        --brand-text:${CONFIG.theme.text};
        --brand-text-2:${CONFIG.theme.secondaryText};
        --brand-card:${CONFIG.theme.card};
        --brand-line:${CONFIG.theme.line};
        --bg-far-left:${CONFIG.theme.bgFarLeft};
        --bg-dark-navy:${CONFIG.theme.bgDarkNavy};
        --bg-medium-blue:${CONFIG.theme.bgMediumBlue};
        --bg-light-blue:${CONFIG.theme.bgLightBlue};
      }
      .brand-primary{ background:var(--brand-primary);} 
      .text-brand{ color:var(--brand-primary);} 
      .ring-brand{ --tw-ring-color: var(--brand-primary);} 
      .border-line{ border-color: var(--brand-line);} 
      .app-gradient-bg{
        background: linear-gradient(90deg, var(--bg-far-left) 0%, var(--bg-dark-navy) 25%, var(--bg-medium-blue) 60%, var(--bg-light-blue) 100%);
      }
      .btn-brand{
        background: linear-gradient(135deg, var(--brand-primary), var(--brand-accent));
        color: white;
        border: none;
      }
      .btn-brand:hover{ filter: brightness(1.05);} 
      .btn-brand:disabled{ opacity: .75; }
      .btn-brand:focus{ outline: none; box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand-accent) 40%, transparent);} 
    `}</style>
  );
};

export default ThemeVars;
