import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProject } from '../lib/projectContext';
import { useAuth } from '../lib/auth';
import { apiFetch } from '../lib/api';
import { toast } from 'sonner';
import { Plus, BarChart2, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export function Polls() {
  const { activeProject } = useProject();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']);

  // Fetch Polls
  const { data: polls = [], isLoading } = useQuery({
    queryKey: ['polls', activeProject?.id],
    queryFn: async () => {
      if (!activeProject) return [];
      const res = await apiFetch(`/api/projects/${activeProject.id}/polls`);
      if (!res.ok) throw new Error('Failed to fetch polls');
      const json = await res.json();
      return json.data.polls;
    },
    enabled: !!activeProject
  });

  // Create Poll Mutation
  const createPollMutation = useMutation({
    mutationFn: async (pollData: { question: string, options: string[] }) => {
      if (!activeProject) throw new Error("No active project");
      const res = await apiFetch(`/api/projects/${activeProject.id}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pollData)
      });
      if (!res.ok) throw new Error('Failed to create poll');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls', activeProject?.id] });
      setIsDialogOpen(false);
      setNewQuestion('');
      setNewOptions(['', '']);
      toast.success('Poll created successfully!');
    }
  });

  // Vote Mutation
  const voteMutation = useMutation({
    mutationFn: async ({ pollId, optionId }: { pollId: string, optionId: string }) => {
      if (!activeProject) throw new Error("No active project");
      const res = await apiFetch(`/api/projects/${activeProject.id}/polls/${pollId}/options/${optionId}/vote`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to cast vote');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls', activeProject?.id] });
    }
  });

  if (!activeProject) {
    return <div className="p-8 text-center text-slate-500">Please select a project to view polls.</div>;
  }

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = newOptions.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      toast.error('You need at least 2 valid options.');
      return;
    }
    createPollMutation.mutate({ question: newQuestion, options: validOptions });
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50/50">
      <div className="flex justify-between items-center mb-8 max-w-4xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Team Decisions</h2>
          <p className="text-slate-500 text-sm mt-1">Vote on active polls for {activeProject.name}</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#C6A15B] hover:bg-[#b08e4e] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Poll
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Poll</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePoll} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Question</Label>
                <Input 
                  placeholder="e.g. Which UI framework should we use?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Options</Label>
                {newOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input 
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const updated = [...newOptions];
                        updated[idx] = e.target.value;
                        setNewOptions(updated);
                      }}
                      required={idx < 2} // First two are required
                    />
                    {idx === newOptions.length - 1 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={() => setNewOptions([...newOptions, ''])}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#1F4D3A] text-white"
                disabled={createPollMutation.isPending}
              >
                {createPollMutation.isPending ? 'Publishing...' : 'Publish Poll'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center text-slate-500 mt-12">Loading polls...</div>
      ) : polls.length === 0 ? (
        <div className="text-center text-slate-500 mt-12 border-2 border-dashed border-slate-200 rounded-lg p-12 max-w-4xl mx-auto">
          <BarChart2 className="h-8 w-8 mx-auto text-slate-300 mb-4" />
          <h3 className="font-bold text-slate-700">No active polls</h3>
          <p className="text-sm mt-1">Create a poll to get your team's feedback.</p>
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
          {polls.map((poll: any) => {
            const totalVotes = poll.options.reduce((acc: number, opt: any) => acc + opt.votes.length, 0);
            
            // Check if current user voted on any option in this poll
            const userVotedOptionId = poll.options.find((opt: any) => 
              opt.votes.some((v: any) => v.userId === user?.id)
            )?.id;

            return (
              <div key={poll.id} className="bg-white border border-[#D1CDC4] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-slate-800">{poll.question}</h3>
                  <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded">
                    {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {poll.options.map((opt: any) => {
                    const voteCount = opt.votes.length;
                    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                    const isSelected = userVotedOptionId === opt.id;

                    return (
                      <div 
                        key={opt.id}
                        onClick={() => {
                          if (isSelected) return; // Prevent spam clicking same option
                          voteMutation.mutate({ pollId: poll.id, optionId: opt.id });
                        }}
                        className={`relative overflow-hidden border p-3 cursor-pointer transition-all ${
                          isSelected ? 'border-[#C6A15B] bg-[#F5F1E8]' : 'border-slate-200 hover:border-[#1F4D3A] hover:bg-slate-50'
                        }`}
                      >
                        {/* Progress Bar Background */}
                        <div 
                          className={`absolute top-0 left-0 h-full opacity-10 transition-all duration-500 ${isSelected ? 'bg-[#C6A15B]' : 'bg-[#1F4D3A]'}`}
                          style={{ width: `${percentage}%` }}
                        />
                        
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <CheckCircle2 className="h-4 w-4 text-[#C6A15B]" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border border-slate-300" />
                            )}
                            <span className={`font-medium ${isSelected ? 'text-[#C6A15B]' : 'text-slate-700'}`}>
                              {opt.text}
                            </span>
                          </div>
                          
                          {totalVotes > 0 && (
                            <span className="text-xs font-bold text-slate-500">
                              {percentage}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                  <span>Created by {poll.creator.name}</span>
                  <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
