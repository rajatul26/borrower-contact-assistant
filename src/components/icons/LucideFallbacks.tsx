import type { ComponentProps } from 'react';
import { MoreVertical as LucideMoreVertical, Plus as LucidePlus } from 'lucide-react';

type IconProps = ComponentProps<typeof LucidePlus>;

export const PlusIcon = (props: IconProps) => {
  if (typeof LucidePlus === 'function') {
    return <LucidePlus {...props} />;
  }
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
};

export const MoreVerticalIcon = (props: IconProps) => {
  if (typeof LucideMoreVertical === 'function') {
    return <LucideMoreVertical {...props} />;
  }
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
};

export default {
  PlusIcon,
  MoreVerticalIcon,
};
