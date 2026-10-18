import { LayoutDashboard, CheckSquare, FolderGit2, Users, Settings, LogOut, Bell, MessageSquare, Clock, FileText, Menu, Video, BarChart2, Layers, Search, X } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useProject } from "../lib/projectContext";
import { connectSocket, disconnectSocket, joinProjectRoom, socket } from "../lib/socket";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useState, useEffect, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

export function Layout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const { activeProject, setActiveProject, isLoading: isLoadingProject } = useProject();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  // Global search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K and Esc listener + click outside listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch tasks and files for search
  const { data: searchTasks = [] } = useQuery({
    queryKey: ['search_tasks', activeProject?.id],
    queryFn: async () => {
      if (!activeProject) return [];
      const res = await apiFetch(`/api/tasks?projectId=${activeProject.id}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data?.tasks || [];
    },
    enabled: !!activeProject && isSearchOpen
  });

  const { data: searchFiles = [] } = useQuery({
    queryKey: ['search_files', activeProject?.id],
    queryFn: async () => {
      if (!activeProject) return [];
      const res = await apiFetch(`/api/files?projectId=${activeProject.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!activeProject && isSearchOpen
  });

  const trimmedSearch = searchQuery.trim().toLowerCase();
  const matchedTasks = trimmedSearch
    ? searchTasks.filter((t: any) => t.title?.toLowerCase().includes(trimmedSearch) || t.description?.toLowerCase().includes(trimmedSearch)).slice(0, 5)
    : [];
  const matchedFiles = trimmedSearch
    ? searchFiles.filter((f: any) => !f.isFolder && f.name?.toLowerCase().includes(trimmedSearch)).slice(0, 5)
    : [];

  useEffect(() => {
    if (!showSettings) {
      setDeleteStep(0);
      setDeleteConfirmName("");
    }
  }, [showSettings]);

  useEffect(() => {
    if (activeProject) {
      setProjectTitle(activeProject.name || "");
    }
  }, [activeProject]);

  const updateProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!activeProject) throw new Error("No active project");
      const res = await apiFetch(`/api/projects/${activeProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update project");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowSettings(false);
      toast.success("Project updated successfully");
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      if (!activeProject) throw new Error("No active project");
      const res = await apiFetch(`/api/projects/${activeProject.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setActiveProject(null);
      setShowSettings(false);
      toast.success("Project deleted successfully");
    },
  });

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
      const json = await res.json();
      return json.data?.notifications || [];
    }
  });

  // Real-time notifications via personal socket room
  useEffect(() => {
    const handleNewNotification = (notif: any) => {
      queryClient.setQueryData(['notifications'], (old: any = []) => [notif, ...old]);
      toast(notif.title || 'New Notification', {
        description: notif.message,
      });
    };
    socket.on('new_notification', handleNewNotification);
    return () => { socket.off('new_notification', handleNewNotification); };
  }, [queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await apiFetch(`/api/notifications/${notificationId}/read`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to mark notification as read');
      return res.json();
    },
    onSuccess: (_, notificationId) => {
      queryClient.setQueryData(['notifications'], (old: any = []) =>
        old.map((n: any) => n.id === notificationId ? { ...n, read: true } : n)
      );
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/notifications/read-all', { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to mark all as read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(['notifications'], (old: any = []) =>
        old.map((n: any) => ({ ...n, read: true }))
      );
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
    { name: (currentProject || user?.role !== 'ADMIN') ? "Tasks" : "New Project", href: "/tasks", icon: (currentProject || user?.role !== 'ADMIN') ? CheckSquare : FolderGit2 },
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
             <span className={isLoadingProject && !currentProject ? 'text-slate-500 animate-pulse text-sm' : ''}>
               {currentProject ? currentProject.name : isLoadingProject ? 'Loading...' : 'Setup Required'}
             </span>
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
            <div className="hidden sm:flex items-center gap-2 text-sm font-bold relative">
              <span className="text-slate-400">Workspace</span>
              <span className="text-slate-400">/</span>
              
              <div className="flex items-center gap-1 text-[#C6A15B]">
                {activeProject ? activeProject.name : 'Setup Required'}
              </div>
              {activeProject && (
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger render={
                    <button type="button" className="ml-1 p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors">
                      <Settings className="h-4 w-4" />
                    </button>
                  } />
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Project Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                      <div className="space-y-2">
                        <Label>Project Name</Label>
                        <Input 
                          value={projectTitle} 
                          onChange={(e) => setProjectTitle(e.target.value)} 
                          placeholder="e.g. Website Redesign"
                        />
                        <Button 
                          onClick={() => updateProjectMutation.mutate({ name: projectTitle })}
                          disabled={updateProjectMutation.isPending || !projectTitle.trim() || projectTitle === activeProject.name}
                          className="w-full mt-2 bg-[#1F4D3A] text-white"
                        >
                          {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>

                      <div className="pt-4 border-t border-red-100">
                        <h4 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h4>
                        
                        {deleteStep === 0 && (
                          <>
                            <p className="text-xs text-slate-500 mb-4">
                              Once you delete a project, there is no going back. Please be certain.
                            </p>
                            <Button 
                              onClick={() => setDeleteStep(1)}
                              variant="destructive"
                              className="w-full"
                            >
                              Delete Project
                            </Button>
                          </>
                        )}

                        {deleteStep === 1 && (
                          <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                            <p className="text-xs text-slate-600">
                              To verify, type <span className="font-bold text-black">{activeProject.name}</span> below:
                            </p>
                            <Input 
                              value={deleteConfirmName} 
                              onChange={(e) => setDeleteConfirmName(e.target.value)} 
                              placeholder="Project name"
                              className="border-red-200 focus:border-red-500"
                            />
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => setDeleteStep(0)} 
                                variant="outline" 
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={() => setDeleteStep(2)}
                                disabled={deleteConfirmName !== activeProject.name}
                                variant="destructive"
                                className="flex-1"
                              >
                                Confirm
                              </Button>
                            </div>
                          </div>
                        )}

                        {deleteStep === 2 && (
                          <div className="space-y-3 p-3 bg-red-50 border border-red-200 rounded-md animate-in fade-in zoom-in-95 duration-200">
                            <p className="text-sm font-bold text-red-800 text-center">
                              Are you absolutely sure?
                            </p>
                            <p className="text-xs text-red-600 text-center">
                              This will permanently delete the project and all associated tasks, files, and messages.
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Button 
                                onClick={() => setDeleteStep(0)} 
                                variant="outline" 
                                className="flex-1 bg-white"
                                disabled={deleteProjectMutation.isPending}
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={() => deleteProjectMutation.mutate()}
                                disabled={deleteProjectMutation.isPending}
                                variant="destructive"
                                className="flex-1"
                              >
                                {deleteProjectMutation.isPending ? "Deleting..." : "Yes, Delete"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <span className="text-slate-400 ml-2">/</span>
              <span className="ml-2">
                {[...navItems, ...moreItems].find(n => location.pathname === n.href || (n.href !== "/" && location.pathname.startsWith(n.href)))?.name || "Workspace"}
              </span>
            </div>
            <div ref={searchContainerRef} className="relative hidden md:block">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Search tasks or files..."
                  className="bg-[#F5F1E8] border border-[#D1CDC4] pl-8 pr-16 py-[6px] w-[260px] lg:w-[300px] text-[13px] outline-none focus:border-[#C6A15B] focus:bg-white transition-colors"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearchOpen(false);
                    }}
                    className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <kbd className="absolute right-2 px-1.5 py-0.5 text-[9px] font-bold text-slate-400 bg-white border border-[#D1CDC4] rounded pointer-events-none uppercase">
                    Ctrl K
                  </kbd>
                )}
              </div>

              {/* Search Results Dropdown */}
              {isSearchOpen && trimmedSearch && (
                <div className="absolute top-full left-0 mt-1.5 w-[360px] lg:w-[380px] bg-white border border-[#D1CDC4] shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2.5 border-b border-[#D1CDC4] bg-slate-50 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <span className="truncate pr-2">Results for "{searchQuery}"</span>
                    <button 
                      type="button" 
                      onClick={() => setIsSearchOpen(false)} 
                      className="text-slate-400 hover:text-slate-700 cursor-pointer shrink-0 text-[10px]"
                    >
                      ESC
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[#D1CDC4]">
                    {matchedTasks.length === 0 && matchedFiles.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 font-semibold">
                        No matching tasks or files found.
                      </div>
                    ) : (
                      <>
                        {matchedTasks.length > 0 && (
                          <div className="p-2 space-y-1">
                            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1F4D3A] flex items-center gap-1.5">
                              <CheckSquare className="h-3 w-3" /> Tasks ({matchedTasks.length})
                            </div>
                            {matchedTasks.map((task: any) => (
                              <div
                                key={task.id}
                                onClick={() => {
                                  setIsSearchOpen(false);
                                  setSearchQuery("");
                                  navigate('/tasks');
                                }}
                                className="px-2.5 py-2 hover:bg-[#FAF9F6] cursor-pointer rounded flex items-center justify-between text-xs group"
                              >
                                <span className="font-medium text-stone-900 group-hover:text-[#1F4D3A] truncate pr-2">
                                  {task.title}
                                </span>
                                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase border border-slate-300 text-slate-600 bg-white shrink-0">
                                  {task.status.replace('_', ' ')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {matchedFiles.length > 0 && (
                          <div className="p-2 space-y-1">
                            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#C6A15B] flex items-center gap-1.5">
                              <FileText className="h-3 w-3" /> Files ({matchedFiles.length})
                            </div>
                            {matchedFiles.map((file: any) => (
                              <div
                                key={file.id}
                                onClick={() => {
                                  setIsSearchOpen(false);
                                  setSearchQuery("");
                                  navigate('/files');
                                }}
                                className="px-2.5 py-2 hover:bg-[#FAF9F6] cursor-pointer rounded flex items-center justify-between text-xs group"
                              >
                                <span className="font-medium text-stone-900 group-hover:text-[#1F4D3A] truncate pr-2">
                                  {file.name}
                                </span>
                                <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                                  {file.size ? `${Math.round(file.size / 1024)} KB` : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs font-bold uppercase tracking-tighter bg-[#1F4D3A] text-white px-2 py-1 hidden sm:block">
              Live Deployment
            </div>
            
            <Popover>
              <PopoverTrigger render={
                <button type="button" className="w-8 h-8 border border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors relative" title="Notifications">
                  <Bell className="h-4 w-4 text-slate-700" />
                  {notifications.filter((n: any) => !n.read && !n.isRead).length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 bg-[#A12B2B] text-white rounded-full text-[9px] font-bold flex items-center justify-center border border-white leading-none">
                      {notifications.filter((n: any) => !n.read && !n.isRead).length > 9 ? '9+' : notifications.filter((n: any) => !n.read && !n.isRead).length}
                    </span>
                  )}
                </button>
              } />
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-3 sm:p-4 border-b border-[#D1CDC4] bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm uppercase tracking-widest text-[#111111]">Notifications</h4>
                    {notifications.filter((n: any) => !n.read && !n.isRead).length > 0 && (
                      <span className="text-[10px] font-bold bg-[#1F4D3A] text-white px-1.5 py-0.5 rounded-full">
                        {notifications.filter((n: any) => !n.read && !n.isRead).length} new
                      </span>
                    )}
                  </div>
                  {notifications.filter((n: any) => !n.read && !n.isRead).length > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllAsReadMutation.mutate()}
                      disabled={markAllAsReadMutation.isPending}
                      className="text-[11px] font-bold uppercase tracking-wider text-[#1F4D3A] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark all read'}
                    </button>
                  )}
                </div>
                <div className="h-80 overflow-y-auto overflow-x-hidden p-2 space-y-1">
                  {notifications.length === 0 ? (
                    <div className="text-[11px] text-slate-500 font-bold uppercase tracking-widest text-center py-6">No notifications</div>
                  ) : (
                    notifications.map((notif: any) => {
                      const isUnread = !notif.read && !notif.isRead;
                      return (
                        <div
                          key={notif.id}
                          onClick={() => {
                            if (isUnread) markAsReadMutation.mutate(notif.id);
                          }}
                          className={`p-3 text-[13px] border-b border-[#DCD6CC]/50 last:border-0 cursor-pointer transition-colors ${
                            isUnread ? 'bg-[#FAF9F6] hover:bg-amber-50/50' : 'opacity-60 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className={`font-semibold ${isUnread ? 'text-[#111111]' : 'text-slate-600'}`}>
                              {notif.title || 'Notification'}
                            </div>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-[#1F4D3A] shrink-0 mt-1" title="Unread"></span>
                            )}
                          </div>
                          <div className="text-slate-700 text-xs mt-0.5">{notif.message}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                            {format(new Date(notif.createdAt), 'MMM d, h:mm a')}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
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
  const [previewUrl, setPreviewUrl] = useState<string>(user?.avatar || '');

  // Sync form state when the dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setName(user?.name || '');
      setAvatar(user?.avatar || '');
      setPreviewUrl(user?.avatar || '');
    }
    setIsOpen(open);
  };

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
    onSuccess: (data) => {
      // API returns { status: 'success', data: { user: {...} } }
      const updatedUser = data?.data?.user || data;
      setUser(updatedUser);
      setPreviewUrl(updatedUser.avatar || '');
      setIsOpen(false);
      toast.success('Profile updated successfully');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update profile');
    }
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setAvatar(dataUrl);
        setPreviewUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
          {/* Avatar preview */}
          <div className="flex justify-center mb-2">
            <div className="relative group">
              <div className="h-24 w-24 shrink-0 bg-[#C6A15B] flex items-center justify-center font-bold text-[#111111] text-3xl overflow-hidden rounded-md border-2 border-[#D1CDC4]">
                {previewUrl ? (
                  <img src={previewUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-md text-white text-[10px] font-bold uppercase tracking-widest"
              >
                Change
              </label>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="avatar-upload">Profile Picture</Label>
            <Input id="avatar-upload" type="file" accept="image/*" onChange={handleImageUpload} />
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Select an image from your device</p>
          </div>
          <Button
            disabled={updateMutation.isPending}
            onClick={() => updateMutation.mutate()}
            className="w-full bg-[#111111] hover:bg-[#222222] text-[#F5F1E8]"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
