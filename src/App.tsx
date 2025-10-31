import { useState } from 'react';

import ThemeVars from '@/components/theme/ThemeVars';
import HeaderBar from '@/features/workspace/components/HeaderBar';
import { Workspace } from '@/features/workspace/Workspace';
import LoginScreen from '@/features/auth/LoginScreen';
import DevDiagnostics from '@/features/dev/DevDiagnostics';
import type { MockUser } from '@/lib/mock-api';

const readStoredUser = (): MockUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem('sessionUser');
    return stored ? (JSON.parse(stored) as MockUser) : null;
  } catch {
    return null;
  }
};

export default function App() {
  const [user, setUser] = useState<MockUser | null>(() => readStoredUser());
  const [devOpen, setDevOpen] = useState(false);

  const handleLogin = (nextUser: MockUser) => {
    setUser(nextUser);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('sessionUser', JSON.stringify(nextUser));
    }
  };

  const handleLogout = () => {
    setUser(null);
    setDevOpen(false);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('sessionUser');
      const url = new URL(window.location.href);
      window.history.replaceState({}, '', `${url.pathname}${url.hash}`);
    }
  };

  return (
    <div className="h-screen bg-slate-100 text-slate-900 flex flex-col">
      <ThemeVars />
      {user ? (
        <>
          <HeaderBar user={user} onLogout={handleLogout} caseMeta={null} onOpenDev={() => setDevOpen(true)} />
          <Workspace onOpenDev={() => setDevOpen(true)} />
          <DevDiagnostics open={devOpen} setOpen={setDevOpen} />
        </>
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </div>
  );
}
