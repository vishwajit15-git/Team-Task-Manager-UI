import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { useProject } from '../lib/projectContext';
import { 
  Users, Mail, Trash2, UserPlus, CheckCircle2, Clock, 
  AlertCircle, Copy, MessageSquare, Briefcase, ChevronRight, 
  Award, ExternalLink, Edit3, Save, X, Building 
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { format } from 'date-fns';

export function Team() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeProject } = useProject();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    department: '',
    bio: '',
    skills: ''
  });

  const { data, isLoading } = useQuery({
    queryKey: ['team', activeProject?.id],
    queryFn: async () => {
      if (!activeProject) return null;
      const res = await apiFetch(`/api/projects/${activeProject.id}`);
      if (!res.ok) throw new Error('Failed to fetch team');
      const json = await res.json();
      return json.data.project;
    },
    refetchInterval: 5000,
    enabled: !!activeProject
  });

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!activeProject) throw new Error('No active project');
      const res = await apiFetch(`/api/projects/${activeProject.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to add member');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['team', activeProject?.id] });
      setInviteEmail('');
      toast.success(`${data.data.user.name} has been added to the project!`);
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!activeProject) throw new Error("No active project");
      const res = await apiFetch(`/api/projects/${activeProject.id}/members/${userId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete user');
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', activeProject?.id] });
      setSelectedMember(null);
      toast.success('Team member removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      if (!activeProject) throw new Error('No active project');
      const res = await apiFetch(`/api/projects/${activeProject.id}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update member profile');
      }
      return res.json();
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries({ queryKey: ['team', activeProject?.id] });
      if (selectedMember && resData.data?.user) {
        setSelectedMember((prev: any) => ({
          ...prev,
          ...resData.data.user
        }));
      }
      setIsEditingProfile(false);
      toast.success('Member profile updated successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update profile');
    }
  });

  const startEditing = () => {
    if (!selectedMember) return;
    setEditForm({
      title: selectedMember.title || '',
      department: selectedMember.department || '',
      bio: selectedMember.bio || '',
      skills: Array.isArray(selectedMember.skills) ? selectedMember.skills.join(', ') : ''
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    const skillsArray = editForm.skills
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    updateProfileMutation.mutate({
      userId: selectedMember.id,
      data: {
        title: editForm.title.trim(),
        department: editForm.department.trim(),
        bio: editForm.bio.trim(),
        skills: skillsArray
      }
    });
  };

  if (isLoading) {
    return <div className="text-center py-20 text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading team...</div>;
  }

  const teamMembers = data?.members || [];
  const activeTasks = data?.tasks || [];

  // Group team members by active (non-completed) tasks assigned to them
  const nonCompletedTasks = activeTasks.filter((t: any) => t.status !== 'COMPLETED');

  const usersWithTasks = teamMembers.map((member: any) => {
    const userTasks = nonCompletedTasks.filter((t: any) => 
      t.assigneeId === member.id || 
      t.assignee?.id === member.id ||
      (Array.isArray(t.assignees) && t.assignees.some((a: any) => a.id === member.id))
    );
    return { ...member, tasks: userTasks };
  });

  const availableUsers = usersWithTasks.filter((u: any) => u.tasks.length === 0);
  const occupiedUsers = usersWithTasks.filter((u: any) => u.tasks.length > 0);

  // Group occupied users by task title and project
  const groups: Record<string, { title: string, status: string, project: string, users: any[] }> = {};
  occupiedUsers.forEach((u: any) => {
    u.tasks.forEach((task: any) => {
      const key = `${task.id || task.title}`;
      if (!groups[key]) {
        groups[key] = { title: task.title, status: task.status, project: activeProject?.name || '', users: [] };
      }
      if (!groups[key].users.find((eu: any) => eu.id === u.id)) {
        groups[key].users.push(u);
      }
    });
  });

  // Calculate detailed task stats for the selected member
  const selectedMemberAllTasks = selectedMember ? (activeTasks.filter((t: any) => 
    t.assigneeId === selectedMember.id || 
    t.assignee?.id === selectedMember.id ||
    (Array.isArray(t.assignees) && t.assignees.some((a: any) => a.id === selectedMember.id))
  )) : [];

  const completedTasks = selectedMemberAllTasks.filter((t: any) => t.status === 'COMPLETED');
  const inProgressTasks = selectedMemberAllTasks.filter((t: any) => t.status === 'IN_PROGRESS');
  const reviewTasks = selectedMemberAllTasks.filter((t: any) => t.status === 'REVIEW');
  const overdueTasks = selectedMemberAllTasks.filter((t: any) => 
    t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < new Date()
  );

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#D1CDC4] pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#1F4D3A] text-white">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111111]">Team Members</h1>
            <p className="text-slate-500 mt-1">View team specializations, assigned tasks, and member profiles dynamically.</p>
          </div>
        </div>

        {/* Invite Panel — admin only */}
        {user?.role === 'ADMIN' && (
          <form
            onSubmit={(e) => { e.preventDefault(); if (inviteEmail.trim()) inviteMutation.mutate(inviteEmail.trim()); }}
            className="flex gap-2 w-full md:w-auto"
          >
            <div className="relative flex-1 md:w-72">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Invite by email address..."
                required
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-[#D1CDC4] bg-white outline-none focus:border-[#C6A15B] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={inviteMutation.isPending || !inviteEmail.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1F4D3A] text-white text-sm font-bold uppercase tracking-widest hover:bg-[#1F4D3A]/90 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              {inviteMutation.isPending ? 'Inviting...' : 'Invite'}
            </button>
          </form>
        )}
      </div>

      <div className="grid gap-8">
        {/* Task Groups */}
        {Object.values(groups).map((group: any, idx) => (
          <div key={idx} className="bg-white border border-[#D1CDC4] overflow-hidden">
            <div className="p-4 border-b border-[#D1CDC4] bg-slate-50 flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#1F4D3A]">{group.project}</h2>
                <h3 className="text-base sm:text-lg font-semibold mt-0.5">Working on: {group.title}</h3>
              </div>
              {group.status && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase border border-slate-300 text-slate-700 bg-white shrink-0">
                  {group.status.replace('_', ' ')}
                </span>
              )}
            </div>
            <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {group.users.map((member: any) => (
                <UserCard 
                  key={member.id} 
                  member={member} 
                  currentUser={user} 
                  onSelect={() => setSelectedMember(member)}
                  onDelete={() => deleteUserMutation.mutate(member.id)} 
                  isDeleting={deleteUserMutation.isPending} 
                />
              ))}
            </div>
          </div>
        ))}

        {Object.keys(groups).length === 0 && (
          <div className="p-6 border border-[#D1CDC4] bg-white text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
            No team members are currently assigned to active tasks.
          </div>
        )}

        {/* Available Team */}
        <div className="bg-white border border-[#D1CDC4] overflow-hidden mt-2">
          <div className="p-4 border-b border-[#D1CDC4] bg-slate-50 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-600">Available / Idle</h2>
            <span className="bg-green-100 text-green-700 font-bold px-2 py-1 text-xs">{availableUsers.length}</span>
          </div>
          <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableUsers.length > 0 ? (
              availableUsers.map((member: any) => (
                <UserCard 
                  key={member.id} 
                  member={member} 
                  currentUser={user} 
                  onSelect={() => setSelectedMember(member)}
                  onDelete={() => deleteUserMutation.mutate(member.id)} 
                  isDeleting={deleteUserMutation.isPending} 
                />
              ))
            ) : (
              <div className="col-span-full text-center text-slate-500 py-4 text-sm font-medium">
                No available team members right now.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Member Profile & Assigned Tasks Modal */}
      <Dialog 
        open={!!selectedMember} 
        onOpenChange={(open) => { 
          if (!open) {
            setSelectedMember(null);
            setIsEditingProfile(false);
          }
        }}
      >
        <DialogContent className="!max-w-2xl sm:!max-w-2xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col bg-white border border-[#D1CDC4] rounded-none shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedMember?.name || 'Member'} Profile</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header Banner */}
              <div className="p-6 bg-[#111111] text-white border-b border-[#2D2D2D] relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 shrink-0 bg-[#C6A15B] text-[#111111] flex items-center justify-center font-bold text-2xl overflow-hidden rounded-none shadow-md border-2 border-white/20">
                      {selectedMember.avatar ? (
                        <img src={selectedMember.avatar} alt={selectedMember.name} className="h-full w-full object-cover" />
                      ) : (
                        selectedMember.name?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold text-white tracking-tight">{selectedMember.name}</h2>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          selectedMember.role === 'ADMIN'
                            ? 'bg-[#C6A15B] text-[#111111]'
                            : 'bg-[#2D2D2D] text-slate-300 border border-slate-700'
                        }`}>
                          {selectedMember.role}
                        </span>
                        {selectedMember.department && (
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-white/10 text-slate-300 flex items-center gap-1">
                            <Building className="h-3 w-3 text-slate-400" />
                            {selectedMember.department}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#C6A15B] font-semibold mt-1 flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5" />
                        {selectedMember.title || (selectedMember.role === 'ADMIN' ? 'Engineering Lead' : 'Software Engineer')}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="h-3.5 w-3.5 text-slate-500" />
                          <span className="truncate">{selectedMember.email}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(selectedMember.email, 'Email address')}
                          className="p-1 hover:text-white transition-colors cursor-pointer text-slate-400"
                          title="Copy email"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {(user?.role === 'ADMIN' || selectedMember.id === user?.id) && (
                    <button
                      onClick={() => {
                        if (isEditingProfile) {
                          setIsEditingProfile(false);
                        } else {
                          startEditing();
                        }
                      }}
                      className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider border border-[#C6A15B] text-[#C6A15B] hover:bg-[#C6A15B] hover:text-[#111111] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {isEditingProfile ? (
                        <>
                          <X className="h-3 w-3" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Edit3 className="h-3 w-3" />
                          Edit Profile
                        </>
                      )}
                    </button>
                  )}
                </div>

                {!isEditingProfile && (
                  <p className="text-xs text-slate-300 mt-4 leading-relaxed bg-[#1A1A1A] p-3 border border-white/10">
                    {selectedMember.bio || 'Contributing to sprint milestones, platform features, and team deliverables.'}
                  </p>
                )}
              </div>

              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FBF9F5]">
                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfile} className="space-y-4 bg-white p-5 border border-[#D1CDC4]">
                    <div className="flex items-center justify-between border-b border-[#D1CDC4] pb-2">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#1F4D3A] flex items-center gap-1.5">
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit Member Specialization & Profile
                      </h3>
                      <span className="text-[10px] text-slate-400 font-medium">Saves directly to database</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Professional Title / Specialization
                      </label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. Principal Cloud Architect"
                        className="w-full px-3 py-2 text-xs border border-[#D1CDC4] bg-[#FBF9F5] focus:outline-none focus:border-[#C6A15B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Department / Team
                      </label>
                      <input
                        type="text"
                        value={editForm.department}
                        onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                        placeholder="e.g. Backend Platform"
                        className="w-full px-3 py-2 text-xs border border-[#D1CDC4] bg-[#FBF9F5] focus:outline-none focus:border-[#C6A15B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Professional Bio / Summary
                      </label>
                      <textarea
                        rows={3}
                        value={editForm.bio}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Describe member focus, architectures, and sprint responsibilities..."
                        className="w-full px-3 py-2 text-xs border border-[#D1CDC4] bg-[#FBF9F5] focus:outline-none focus:border-[#C6A15B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Skills & Domains (Comma Separated)
                      </label>
                      <input
                        type="text"
                        value={editForm.skills}
                        onChange={(e) => setEditForm(prev => ({ ...prev, skills: e.target.value }))}
                        placeholder="e.g. TypeScript, Redis, Distributed Systems, Docker"
                        className="w-full px-3 py-2 text-xs border border-[#D1CDC4] bg-[#FBF9F5] focus:outline-none focus:border-[#C6A15B]"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-3 py-2 text-xs font-bold uppercase tracking-wider border border-[#D1CDC4] text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[#1F4D3A] text-white hover:bg-[#1F4D3A]/90 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save to Database'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {/* Specialization Skills Badges */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2.5 flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-[#1F4D3A]" />
                        Core Specializations & Domains
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {((Array.isArray(selectedMember.skills) && selectedMember.skills.length > 0)
                          ? selectedMember.skills
                          : ['Full-Stack', 'API Integration', 'Team Collaboration']
                        ).map((skill: string, sIdx: number) => (
                          <span
                            key={sIdx}
                            className="px-2.5 py-1 bg-white border border-[#D1CDC4] text-xs font-medium text-slate-800 shadow-2xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Workload Metrics */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2.5">
                        Sprint Workload & Capacity
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white p-3 border border-[#D1CDC4] text-center">
                          <div className="text-xl font-bold text-[#111111]">{selectedMemberAllTasks.length}</div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">Total Tasks</div>
                        </div>
                        <div className="bg-white p-3 border border-blue-200 text-center">
                          <div className="text-xl font-bold text-blue-700">{inProgressTasks.length}</div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mt-0.5">In Progress</div>
                        </div>
                        <div className="bg-white p-3 border border-amber-200 text-center">
                          <div className="text-xl font-bold text-amber-700">{reviewTasks.length}</div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mt-0.5">In Review</div>
                        </div>
                        <div className="bg-white p-3 border border-emerald-200 text-center">
                          <div className="text-xl font-bold text-emerald-700">{completedTasks.length}</div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mt-0.5">Completed</div>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Tasks Breakdown */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-[#1F4D3A]" />
                          Assigned Tasks ({selectedMemberAllTasks.length})
                        </h3>
                        {overdueTasks.length > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-red-100 text-red-700 border border-red-300">
                            <AlertCircle className="h-3 w-3" />
                            {overdueTasks.length} Overdue
                          </span>
                        )}
                      </div>

                      {selectedMemberAllTasks.length === 0 ? (
                        <div className="bg-white border border-[#D1CDC4] p-8 text-center space-y-2">
                          <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-600" />
                          <p className="text-sm font-semibold text-slate-800">Currently Available</p>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            This member has no active tasks assigned in this project and is ready for sprint allocation.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedMemberAllTasks.map((t: any) => {
                            const isOverdue = t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < new Date();
                            return (
                              <div
                                key={t.id}
                                className="bg-white border border-[#D1CDC4] p-3.5 hover:border-[#C6A15B] transition-colors flex flex-col gap-2"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <h4 className="text-sm font-semibold text-stone-900 leading-snug">
                                    {t.title}
                                  </h4>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                                      t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                                      t.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                                      t.status === 'REVIEW' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                                      'bg-slate-50 text-slate-700 border-slate-300'
                                    }`}>
                                      {t.status.replace('_', ' ')}
                                    </span>
                                    {t.priority && (
                                      <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                        t.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                                        t.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                                        t.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-slate-100 text-slate-700'
                                      }`}>
                                        {t.priority}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {t.description && (
                                  <p className="text-xs text-slate-600 line-clamp-2">
                                    {t.description}
                                  </p>
                                )}

                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 mt-1">
                                  <div className="flex items-center gap-2">
                                    {t.dueDate && (
                                      <span className={isOverdue ? 'text-red-600 font-bold flex items-center gap-1' : ''}>
                                        {isOverdue && <AlertCircle className="h-3 w-3" />}
                                        Due: {format(new Date(t.dueDate), 'MMM d, yyyy')}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => navigate('/tasks')}
                                    className="text-[#1F4D3A] hover:text-[#C6A15B] font-bold flex items-center gap-0.5 text-[10px] uppercase tracking-wider cursor-pointer transition-colors"
                                  >
                                    View Board
                                    <ExternalLink className="h-3 w-3 ml-0.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-[#D1CDC4] bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedMember(null);
                      navigate('/messages');
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1F4D3A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1F4D3A]/90 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Open Team Chat
                  </button>
                  <button
                    onClick={() => copyToClipboard(selectedMember.email, 'Email address')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-[#D1CDC4] text-slate-700 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Email
                  </button>
                </div>

                {user?.role === 'ADMIN' && selectedMember.role !== 'ADMIN' && selectedMember.id !== user?.id && (
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to remove ${selectedMember.name} from the project?`)) {
                        deleteUserMutation.mutate(selectedMember.id);
                      }
                    }}
                    disabled={deleteUserMutation.isPending}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-[#A21F1F] text-[#A21F1F] hover:bg-[#A21F1F] hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deleteUserMutation.isPending ? 'Removing...' : 'Remove Member'}
                  </button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserCard({ 
  member, 
  currentUser, 
  onDelete, 
  isDeleting, 
  onSelect 
}: { 
  member: any; 
  currentUser: any; 
  onDelete: () => void; 
  isDeleting: boolean; 
  onSelect: () => void; 
}) {
  const canDelete = currentUser?.role === 'ADMIN' && member.role !== 'ADMIN' && member.id !== currentUser?.id;
  const memberTitle = member.title || (member.role === 'ADMIN' ? 'Engineering Lead' : 'Software Engineer');
  const memberDepartment = member.department || 'Engineering';

  return (
    <div 
      onClick={onSelect}
      className="flex flex-col justify-between p-4 border border-[#D1CDC4] bg-white hover:border-[#C6A15B] hover:shadow-md transition-all duration-200 relative group cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 shrink-0 bg-[#C6A15B] flex items-center justify-center font-bold text-[#111111] text-lg overflow-hidden border border-black/10">
          {member.avatar ? (
            <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
          ) : (
            member.name?.charAt(0).toUpperCase() || 'U'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h3 className="font-semibold text-[15px] truncate text-stone-900 group-hover:text-[#1F4D3A] transition-colors">{member.name}</h3>
            {canDelete && (
              <button 
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[#A21F1F] hover:bg-[#A21F1F]/10 p-1.5 border border-transparent hover:border-[#A21F1F] cursor-pointer" 
                title="Remove member"
                disabled={isDeleting}
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Are you sure you want to remove ${member.name} from the team?`)) {
                    onDelete();
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-[#C6A15B] font-bold truncate mt-0.5">{memberTitle}</p>
          <div className="flex items-center gap-1.5 mt-0.5 text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-widest">{member.role}</span>
            <span className="text-[10px]">•</span>
            <span className="text-[10px] text-slate-500 font-medium truncate">{memberDepartment}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 text-slate-500">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="text-[11px] truncate" title={member.email}>{member.email}</span>
          </div>
        </div>
      </div>

      <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <span className="text-slate-500 font-medium">
          {member.tasks?.length ? (
            <span className="text-blue-600 font-semibold">{member.tasks.length} active task{member.tasks.length > 1 ? 's' : ''}</span>
          ) : (
            <span className="text-emerald-600 font-semibold">Available</span>
          )}
        </span>
        <span className="text-slate-400 group-hover:text-[#1F4D3A] font-bold flex items-center gap-0.5 text-[10px] uppercase tracking-wider transition-colors">
          View Profile
          <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}
