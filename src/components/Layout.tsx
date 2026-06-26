import { LayoutDashboard, CheckSquare, FolderGit2, Users, Settings, LogOut, Bell, MessageSquare, Clock, FileText, Menu, X, Mail, Video, BarChart2, Layers, ChevronDown } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useProject } from "../lib/projectContext";
import { connectSocket, disconnectSocket, joinProjectRoom } from "../lib/socket";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";

export function Layout() {
  const { user, setUser, logout } = useAuth();
  const { projects, activeProject, setActiveProject } = useProject();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);

  // Connect Socket.io when layout mounts (user is logged in)
  useEffect(() => {
    if (user) {
      connectSocket(user.id, activeProject?.id);
    }
    return () => { disconnectSocket(); };
  }, [user]);

  // Join new project room when active project changes
  useEffect(() => {
    if (activeProject) {
      joinProjectRoom(activeProject.id);
    }
  }, [activeProject]);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiFetch('/api/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    }
  });

  const currentProject = activeProject;
  
  let totalTasks = 0;
  let completedTasks = 0;
  if (currentProject?.tasks) {
    totalTasks = currentProject.tasks.length;
    completedTasks = currentProject.tasks.filter((t: any) => t.status === 'COMPLETED').length;
  }
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: currentProject ? "Tasks" : "New Project", href: "/tasks", icon: currentProject ? CheckSquare : FolderGit2 },
    { name: "Timeline", href: "/timeline", icon: Clock },
    { name: "Messages", href: "/messages", icon: MessageSquare },
    { name: "Team", href: "/team", icon: Users },
    { name: "Files", href: "/files", icon: FileText },
  ];

  const moreItems = [
    { name: "Online Meeting", href: "/meeting", icon: Video },
    { name: "Voting on Poll", href: "/polls", icon: BarChart2 },
    { name: "Assets", href: "/assets", icon: Layers },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - GitHub/Linear Inspired */}
      <aside className={`fixed lg:static shrink-0 inset-y-0 left-0 z-50 w-[240px] bg-[#111111] text-white border-r border-[#2D2D2D] flex flex-col transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 mb-4">
          <div className="text-xs tracking-widest text-slate-400 uppercase font-bold mb-1">
            Workspace
          </div>
          <div className="text-lg font-bold flex items-center gap-2 mb-4">
             <span>{currentProject ? currentProject.title : 'Setup Required'}</span>
             {currentProject && <div className="w-2 h-2 rounded-full bg-[#C6A15B]"></div>}
          </div>
          
          {currentProject && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span>Progress</span>
                <span className="text-[#C6A15B]">{progressPercentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#2D2D2D] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#C6A15B] transition-all duration-500 ease-out" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <nav className="space-y-1 mb-8">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-[20px] py-[10px] text-[13px] font-medium transition-all border-l-[3px] border-transparent ${
                    isActive
                      ? "bg-[#2D2D2D] border-l-[#C6A15B] text-white"
                      : "text-slate-400 hover:bg-[#2D2D2D]/50 text-white hover:border-l-[#2D2D2D]"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="px-5 mb-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
            More
          </div>
          <nav className="space-y-1 mb-6">
            {moreItems.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-[20px] py-[10px] text-[13px] font-medium transition-all border-l-[3px] border-transparent ${
                    isActive
                      ? "bg-[#2D2D2D] border-l-[#C6A15B] text-white"
                      : "text-slate-400 hover:bg-[#2D2D2D]/50 text-white hover:border-l-[#2D2D2D]"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-[#2D2D2D] relative">
          <ProfileDialog user={user} setUser={setUser} />
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-full mt-4"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        <header className="h-[64px] border-b border-[#D1CDC4] bg-white flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4 lg:gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm font-bold relative">
              <span className="text-slate-400">Projects</span>
              <span className="text-slate-400">/</span>
              
              <div className="relative">
                <button 
                  onClick={() => setShowProjectSelector(!showProjectSelector)}
                  className="flex items-center gap-1 hover:text-[#C6A15B] transition-colors"
                >
                  {activeProject?.title || 'Select Project'}
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
                
                {showProjectSelector && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-[#D1CDC4] shadow-lg z-50">
                    {projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActiveProject(p);
                          setShowProjectSelector(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors ${activeProject?.id === p.id ? 'text-[#C6A15B]' : 'text-slate-600'}`}
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-slate-400 ml-2">/</span>
              <span className="ml-2">
                {[...navItems, ...moreItems].find(n => location.pathname === n.href || (n.href !== "/" && location.pathname.startsWith(n.href)))?.name || "Workspace"}
              </span>
            </div>
            <input type="text" placeholder="Search tasks or files..." className="bg-[#F5F1E8] border border-[#D1CDC4] px-[12px] py-[6px] w-[300px] text-[13px] outline-none hidden md:block focus:border-[#C6A15B] transition-colors" />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs font-bold uppercase tracking-tighter bg-[#1F4D3A] text-white px-2 py-1 hidden sm:block">
              Live Deployment
            </div>
            
            <Popover>
              <PopoverTrigger render={
                <button type="button" className="w-8 h-8 border border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors relative">
                  <Bell className="h-4 w-4 text-slate-700" />
                  {notifications.filter((n: any) => !n.isRead).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#A12B2B] rounded-full border border-white"></span>
                  )}
                </button>
              } />
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b border-[#D1CDC4] bg-slate-50">
                  <h4 className="font-bold text-sm uppercase tracking-widest text-[#111111]">Notifications</h4>
                </div>
                <div className="h-80 overflow-y-auto overflow-x-hidden p-2 space-y-1">
                  {notifications.length === 0 ? (
                    <div className="text-[11px] text-slate-500 font-bold uppercase tracking-widest text-center py-6">No notifications</div>
                  ) : (
                    notifications.map((notif: any) => (
                      <div key={notif.id} className={`p-3 text-[13px] border-b border-[#DCD6CC]/50 last:border-0 ${notif.isRead ? 'opacity-70' : 'bg-[#FAF9F6]'}`}>
                        <div className="text-slate-800 font-medium">{notif.message}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                          {format(new Date(notif.createdAt), 'MMM d, h:mm a')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function ProfileDialog({ user, setUser }: { user: any; setUser: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/users/${user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar })
      });
      if (!res.ok) throw new Error('Failed to update profile');
      return res.json();
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setIsOpen(false);
    }
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={
        <button className="flex items-center justify-between mb-2 w-full text-left hover:bg-[#2D2D2D] -mx-2 px-2 py-1 rounded transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#C6A15B] flex items-center justify-center font-bold text-xs text-[#111111] overflow-hidden rounded relative">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-[#C6A15B] transition-colors">{user?.name}</div>
              <div className="text-xs text-slate-400 uppercase">{user?.role}</div>
            </div>
          </div>
        </button>
      } />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex justify-center mb-4">
             <div className="h-24 w-24 shrink-0 bg-[#C6A15B] flex items-center justify-center font-bold text-[#111111] text-3xl overflow-hidden rounded-md">
              {avatar ? (
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                name.charAt(0).toUpperCase()
              )}
             </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="avatar">Profile Picture</Label>
            <Input id="avatar" type="file" accept="image/*" onChange={handleImageUpload} />
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Select an image from your device</p>
          </div>
          <Button disabled={updateMutation.isPending} onClick={() => updateMutation.mutate()} className="w-full bg-[#111111] hover:bg-[#222222] text-[#F5F1E8]">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
