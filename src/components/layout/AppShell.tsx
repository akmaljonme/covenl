import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Bot,
  Briefcase,
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Monitor,
  Search,
  Settings,
  UserRound,
  Users,
  Menu,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { LogoWordmark } from "@/components/brand/Logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchNotifications, qk } from "@/lib/api";
import { formatDate, getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };

const directorNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/company", label: "Company", icon: Building2 },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/applications", label: "Applications", icon: ClipboardList },
  { to: "/team", label: "Team", icon: Users },
  { to: "/developers", label: "Developers", icon: UserRound },
  { to: "/ai-employees", label: "AI Employees", icon: Bot },
  { to: "/office", label: "Virtual Office", icon: Monitor },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/settings", label: "Settings", icon: Settings },
];

const developerNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/developer", label: "My Profile", icon: UserRound },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/applications", label: "Applications", icon: ClipboardList },
  { to: "/team", label: "Team", icon: Users },
  { to: "/ai-employees", label: "AI Employees", icon: Bot },
  { to: "/office", label: "Virtual Office", icon: Monitor },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ to, label, icon: Icon }) => {
        const active = pathname === to || pathname.startsWith(`${to}/`);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className={cn("size-4", active && "text-primary")} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function NotificationsMenu() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: qk.notifications(user?.id ?? "anon"),
    queryFn: () => fetchNotifications(user!.id),
    enabled: Boolean(user?.id),
  });
  const unread = (data ?? []).filter((item) => !item.read).length;

  const markRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user!.id)
        .eq("read", false);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.notifications(user!.id) }),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4" />
          {unread > 0 ? (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unread > 0 ? (
            <button
              className="text-xs text-primary hover:underline"
              onClick={() => markRead.mutate()}
            >
              Mark all read
            </button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(data ?? []).length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">Nothing new yet.</p>
        ) : (
          (data ?? []).map((item) => (
            <div key={item.id} className="px-2 py-2">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.body}</p>
              <p className="mt-1 text-[0.65rem] text-muted-foreground">
                {formatDate(item.created_at)}
              </p>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, user, isDirector, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const items = isDirector ? directorNav : developerNav;
  const displayName = profile?.full_name || user?.email || "Member";

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    navigate({ to: "/jobs", search: query ? { q: query } : {} });
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar lg:flex lg:h-screen lg:flex-col lg:sticky lg:top-0">
        <div className="px-5 py-5">
          <Link to="/dashboard">
            <LogoWordmark subtitle="Build your company" />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-6">
          <NavLinks items={items} />
        </div>
        <div className="border-t border-sidebar-border px-5 py-4">
          <Badge variant="outline" className="text-[0.65rem] tracking-wider uppercase">
            {profile?.role ?? "member"}
          </Badge>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0">
              <SheetTitle className="px-5 py-5">
                <LogoWordmark subtitle="Build your company" />
              </SheetTitle>
              <div className="px-3">
                <NavLinks items={items} onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/dashboard" className="lg:hidden">
            <LogoWordmark size={28} />
          </Link>

          <form onSubmit={submitSearch} className="ml-auto hidden max-w-sm flex-1 sm:block">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search jobs and skills…"
                className="pl-9"
                aria-label="Search jobs"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 sm:ml-0">
            <NotificationsMenu />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-32 truncate text-sm sm:inline">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <span className="block truncate text-sm">{displayName}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 size-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/login", replace: true });
                  }}
                >
                  <LogOut className="mr-2 size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
