import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MdCheckCircle, MdInfoOutline, MdWarning, MdNotifications, MdDescription } from 'react-icons/md';
import { useDataStore } from '@/lib/data-store';
import { useLocation } from 'wouter';

export default function Notifications() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useDataStore();
  const [, setLocation] = useLocation();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const iconMap: Record<string, React.FC<{ className?: string }>> = {
    workflow: MdCheckCircle,
    document: MdDescription,
    system: MdInfoOutline,
    deadline: MdWarning,
  };

  const colorMap: Record<string, string> = {
    workflow: 'text-emerald-500',
    document: 'text-blue-500',
    system: 'text-gray-500',
    deadline: 'text-amber-500',
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">{unreadCount} unread notifications</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllNotificationsRead}>Mark all as read</Button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map(n => {
          const Icon = iconMap[n.type] || MdNotifications;
          return (
            <Card
              key={n.id}
              className={`cursor-pointer transition-colors hover:border-primary/30 ${!n.isRead ? 'border-primary/20 bg-primary/[0.02]' : ''}`}
              onClick={() => { markNotificationRead(n.id); if (n.linkTo) setLocation(n.linkTo); }}
            >
              <CardContent className="py-4 px-5">
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 ${colorMap[n.type]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${!n.isRead ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                      <Badge variant="outline" className="text-xs capitalize">{n.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {new Date(n.timestamp).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    </span>
                    {!n.isRead && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
