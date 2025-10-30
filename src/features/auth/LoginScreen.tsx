import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, KeyRound, Users, Building2 } from 'lucide-react';
import { MockAPI } from '@/lib/mock-api';
import { getConfig } from '@/config/brand';
import ThemeVars from '@/components/theme/ThemeVars';

type LoginScreenProps = {
  onLogin: (user: { id: string; name: string; role: string }) => void;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const CONFIG = getConfig();
  const [username, setUsername] = useState('agent@example.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);

  const doLogin = async () => {
    setLoading(true);
    const res = await MockAPI.login({ username, password });
    setLoading(false);
    if (res.ok && res.user) {
      onLogin(res.user);
    } else {
      toast.error(res.error || 'Login failed');
    }
  };

  const doSSO = async () => {
    setSsoLoading(true);
    const res = await MockAPI.ssoAzureAD();
    setSsoLoading(false);
    if (res.ok && res.user) {
      onLogin(res.user);
    } else {
      toast.error('SSO failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-50">
      <ThemeVars />
      <Card className="w-full max-w-md shadow-xl border border-line">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5 text-brand" /> {CONFIG.orgName}
          </CardTitle>
          <p className="text-sm text-slate-500">{CONFIG.appName}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="agent@example.com" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button className="w-full btn-brand" onClick={doLogin} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
            Sign in
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-line" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 border-t border-line" />
          </div>
          <Button variant="outline" className="w-full" onClick={doSSO} disabled={ssoLoading}>
            {ssoLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Users className="h-4 w-4 mr-2" />}
            Continue with Azure AD
          </Button>
          <p className="text-xs text-slate-500 text-center">Mock-only for prototype. Wire to IdP later.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginScreen;
