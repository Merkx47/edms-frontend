import { MdDashboard, MdDescription, MdApproval, MdHistory, MdBarChart, MdSettings, MdChevronLeft, MdChevronRight, MdNotifications, MdClose, MdGroup } from 'react-icons/md';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useDataStore } from '@/lib/data-store';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  icon: React.FC<{ className?: string }>;
  label: string;
  href: string;
  badge?: number;
}

function NavLink({ item, isCollapsed, isActive, onNavigate }: { item: NavItem; isCollapsed: boolean; isActive: boolean; onNavigate?: () => void }) {
  const content = (
    <Link href={item.href}>
      <div
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer",
          isActive
            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
          isCollapsed && "justify-center px-2"
        )}
      >
        <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary-foreground")} />
        {!isCollapsed && (
          <>
            <span className="text-sm font-medium flex-1">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className={cn(
                "h-5 min-w-5 px-1.5 rounded-full text-xs font-semibold flex items-center justify-center",
                isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
              )}>
                {item.badge}
              </span>
            )}
          </>
        )}
      </div>
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={10} className="font-medium">
          <p>{item.label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export function Sidebar() {
  const [location] = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed, notifications } = useDataStore();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const mainNavItems: NavItem[] = [
    { icon: MdDashboard, label: 'Dashboard', href: '/' },
    { icon: MdDescription, label: 'Documents', href: '/documents' },
    { icon: MdApproval, label: 'Workflows', href: '/workflows' },
    { icon: MdHistory, label: 'Audit Trail', href: '/audit' },
    { icon: MdBarChart, label: 'Reports', href: '/reports' },
    { icon: MdNotifications, label: 'Notifications', href: '/notifications', badge: unreadCount },
    { icon: MdGroup, label: 'Members', href: '/members' },
  ];

  const bottomNavItems: NavItem[] = [
    { icon: MdSettings, label: 'Settings', href: '/settings' },
  ];

  // Close mobile sidebar on navigate
  const closeMobile = () => {
    if (window.innerWidth < 1024) setSidebarCollapsed(true);
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          // Desktop: static sidebar
          "hidden lg:flex h-[calc(100vh-4rem)] border-r border-border bg-sidebar/50 glass flex-col transition-all duration-300",
          sidebarCollapsed ? "lg:w-[68px]" : "lg:w-[260px]",
        )}
      >
        <SidebarContent
          mainNavItems={mainNavItems}
          bottomNavItems={bottomNavItems}
          location={location}
          isCollapsed={sidebarCollapsed}
          onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onNavigate={closeMobile}
        />
      </aside>

      {/* Mobile sidebar — slides in from left */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] z-50 lg:hidden bg-sidebar border-r border-border flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <img src="/nigeria-coat-of-arms.svg" alt="EDMS" className="h-8 w-auto" />
                <span className="text-sm font-bold">Federal EDMS</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setSidebarCollapsed(true)}>
                <MdClose className="h-4 w-4" />
              </Button>
            </div>
            <SidebarContent
              mainNavItems={mainNavItems}
              bottomNavItems={bottomNavItems}
              location={location}
              isCollapsed={false}
              onCollapse={() => setSidebarCollapsed(true)}
              onNavigate={closeMobile}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarContent({ mainNavItems, bottomNavItems, location, isCollapsed, onCollapse, onNavigate }: {
  mainNavItems: NavItem[];
  bottomNavItems: NavItem[];
  location: string;
  isCollapsed: boolean;
  onCollapse: () => void;
  onNavigate: () => void;
}) {
  return (
    <>
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {!isCollapsed && (
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-3">Navigation</p>
        )}
        <nav className="space-y-1">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isCollapsed={isCollapsed}
              isActive={location === item.href || (item.href !== '/' && location.startsWith(item.href))}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </div>
      <div className="border-t border-border p-3 space-y-1">
        {bottomNavItems.map((item) => (
          <NavLink key={item.href} item={item} isCollapsed={isCollapsed} isActive={location === item.href} onNavigate={onNavigate} />
        ))}
        <Button
          variant="ghost"
          size="sm"
          className={cn("w-full justify-center mt-2 rounded-lg hidden lg:flex", !isCollapsed && "justify-end")}
          onClick={onCollapse}
        >
          {isCollapsed ? <MdChevronRight className="h-4 w-4" /> : (
            <>
              <span className="text-xs text-muted-foreground mr-2">Collapse</span>
              <MdChevronLeft className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </>
  );
}
