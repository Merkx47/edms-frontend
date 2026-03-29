import { MdDarkMode, MdLightMode, MdLogout, MdMenu, MdNotifications, MdPerson, MdSettings, MdSearch, MdCheckCircle, MdInfoOutline, MdWarning } from 'react-icons/md';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useDataStore } from '@/lib/data-store';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const [, setLocation] = useLocation();
  const { logout, notifications, markNotificationRead, markAllNotificationsRead, currentUser } = useDataStore();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) { html.classList.add('dark'); } else { html.classList.remove('dark'); }
  }, [isDark]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/documents?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const { setSidebarCollapsed, sidebarCollapsed } = useDataStore();

  return (
    <header className="h-14 lg:h-16 border-b border-border bg-sidebar/80 glass sticky top-0 z-50">
      <div className="h-full px-3 lg:px-6 flex items-center justify-between gap-2 lg:gap-4">
        <div className="flex items-center gap-2 lg:gap-5">
          {/* Mobile hamburger */}
          <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 rounded-full" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <MdMenu className="h-5 w-5" />
          </Button>

          {/* Logo */}
          <div className="flex items-center gap-2 lg:gap-3 cursor-pointer" onClick={() => setLocation('/')}>
            <img src="/nigeria-coat-of-arms.svg" alt="Federal Republic of Nigeria" className="h-8 lg:h-10 w-auto drop-shadow-sm" />
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-bold tracking-tight text-foreground leading-tight">Federal EDMS</span>
              <span className="text-[10px] text-muted-foreground leading-tight tracking-wide uppercase hidden lg:block">Document Management System</span>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden lg:block h-8 w-px bg-border" />

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents, reference numbers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`pl-9 w-[320px] bg-background/60 border-border/50 transition-all duration-300 ${searchFocused ? 'w-[400px] bg-background shadow-md' : ''}`}
              />
            </div>
          </form>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <Button variant="ghost" size="icon" onClick={() => setIsDark(!isDark)} className="rounded-full h-9 w-9">
            <motion.div key={isDark ? 'dark' : 'light'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.2 }}>
              {isDark ? <MdLightMode className="h-[18px] w-[18px]" /> : <MdDarkMode className="h-[18px] w-[18px]" />}
            </motion.div>
          </Button>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full h-9 w-9">
                <MdNotifications className="h-[18px] w-[18px]" />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center"
                    >
                      {unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[360px] p-0 shadow-xl">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
                <h4 className="font-semibold text-sm">Notifications</h4>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-auto p-1 text-primary hover:text-primary" onClick={markAllNotificationsRead}>
                    Mark all read
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[320px]">
                <div className="divide-y divide-border">
                  {notifications.map((n) => {
                    const Icon = n.type === 'deadline' ? MdWarning : n.type === 'workflow' ? MdCheckCircle : MdInfoOutline;
                    const iconColor = n.type === 'deadline' ? 'text-amber-500' : n.type === 'workflow' ? 'text-emerald-500' : 'text-blue-500';
                    return (
                      <motion.div
                        key={n.id}
                        whileHover={{ backgroundColor: 'hsl(var(--muted) / 0.5)' }}
                        className={`px-4 py-3 cursor-pointer transition-colors ${!n.isRead ? 'bg-primary/[0.04]' : ''}`}
                        onClick={() => { markNotificationRead(n.id); if (n.linkTo) setLocation(n.linkTo); }}
                      >
                        <div className="flex gap-3">
                          <div className={`mt-0.5 ${iconColor}`}><Icon className="h-4 w-4" /></div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                          </div>
                          {!n.isRead && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 animate-pulse-dot" />}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-full h-9 gap-2 pl-2 pr-3">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {currentUser?.fullName?.split(' ').map(n => n[0]).join('') || 'AU'}
                  </span>
                </div>
                <span className="hidden lg:inline text-sm font-medium">{currentUser?.fullName?.split(' ')[0] || 'Admin'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 shadow-xl">
              <div className="px-3 py-2.5 border-b border-border">
                <p className="text-sm font-semibold">{currentUser?.fullName || 'Admin User'}</p>
                <p className="text-xs text-muted-foreground">{currentUser?.email || 'admin@gov.ng'}</p>
                <Badge variant="outline" className="mt-1.5 text-[10px] capitalize">{currentUser?.role || 'admin'}</Badge>
              </div>
              <DropdownMenuItem onClick={() => setLocation('/settings')} className="gap-2 py-2">
                <MdPerson className="h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/settings')} className="gap-2 py-2">
                <MdSettings className="h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive gap-2 py-2" onClick={() => { logout(); setLocation('/login'); }}>
                <MdLogout className="h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
