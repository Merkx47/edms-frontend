import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MdPerson, MdSecurity, MdNotifications, MdStorage } from 'react-icons/md';
import { useDataStore } from '@/lib/data-store';
import { toast } from '@/hooks/use-toast';

export default function Settings() {
  const { currentUser, settings, saveSettings, documents, workflows, auditLog } = useDataStore();

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and system preferences</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><MdPerson className="h-5 w-5" /> Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>First Name</Label><Input value={settings.firstName} onChange={e => saveSettings({ firstName: e.target.value })} /></div>
            <div><Label>Last Name</Label><Input value={settings.lastName} onChange={e => saveSettings({ lastName: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={settings.email} onChange={e => saveSettings({ email: e.target.value })} /></div>
            <div>
              <Label>Role</Label>
              <div className="mt-2"><Badge className="capitalize">{currentUser?.role || 'admin'}</Badge></div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Changes are saved automatically.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><MdSecurity className="h-5 w-5" /> Security</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Switch checked={settings.twoFactorEnabled} onCheckedChange={(v) => saveSettings({ twoFactorEnabled: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Session Timeout (minutes)</p>
              <p className="text-xs text-muted-foreground">Auto-logout after inactivity</p>
            </div>
            <Input className="w-24 text-center" type="number" value={settings.sessionTimeout} onChange={e => saveSettings({ sessionTimeout: parseInt(e.target.value) || 30 })} />
          </div>
          <Button variant="outline" onClick={() => toast({ title: 'Password Reset', description: 'A password reset link has been sent to your email.' })}>Change Password</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><MdNotifications className="h-5 w-5" /> Notification Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'notifyWorkflows' as const, label: 'Workflow approvals' },
            { key: 'notifyUploads' as const, label: 'Document uploads' },
            { key: 'notifySLA' as const, label: 'SLA deadline alerts' },
            { key: 'notifySystem' as const, label: 'System announcements' },
          ].map(pref => (
            <div key={pref.key} className="flex items-center justify-between">
              <p className="text-sm">{pref.label}</p>
              <Switch checked={settings[pref.key]} onCheckedChange={(v) => saveSettings({ [pref.key]: v })} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><MdStorage className="h-5 w-5" /> System Information</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            ['Platform', 'EDMS v1.0 — Qucoon Limited'],
            ['Database', 'Huawei Cloud GaussDB'],
            ['Storage', 'Huawei OBS'],
            ['Documents', String(documents.length)],
            ['Active Workflows', String(workflows.filter(w => w.status === 'in_progress').length)],
            ['Audit Entries', String(auditLog.length)],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-sm font-medium">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
