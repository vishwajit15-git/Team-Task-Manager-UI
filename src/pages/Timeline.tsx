import { apiFetch } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, differenceInDays, addDays, 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, 
  isSameDay, subMonths, addMonths 
} from 'date-fns';
import { useState } from 'react';

import { useProject } from '../lib/projectContext';

export function Timeline() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { activeProject } = useProject();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', activeProject?.id],
    queryFn: async () => {
      const res = await apiFetch(`/api/tasks${activeProject ? `?projectId=${activeProject.id}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      return data.data?.tasks || [];
    },
    enabled: !!activeProject
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  const getTasksForWeek = (weekStart: Date, weekEnd: Date) => {
    const weekTasks = tasks.filter((task: any) => {
      const tStart = new Date(task.startDate || task.createdAt);
      tStart.setHours(0,0,0,0);
      const tEnd = task.dueDate ? new Date(task.dueDate) : new Date(tStart);
      tEnd.setHours(23,59,59,999);
      
      const wStart = new Date(weekStart);
      wStart.setHours(0,0,0,0);
      const wEnd = new Date(weekEnd);
      wEnd.setHours(23,59,59,999);

      return tStart <= wEnd && tEnd >= wStart;
    });

    weekTasks.sort((a: any, b: any) => {
      const aStart = new Date(a.startDate || a.createdAt).getTime();
      const bStart = new Date(b.startDate || b.createdAt).getTime();
      if (aStart === bStart) {
        const aDuration = (a.dueDate ? new Date(a.dueDate).getTime() : aStart) - aStart;
        const bDuration = (b.dueDate ? new Date(b.dueDate).getTime() : bStart) - bStart;
        return bDuration - aDuration;
      }
      return aStart - bStart;
    });

    const tracks: boolean[][] = [];
    
    return weekTasks.map((task: any) => {
      const tStart = new Date(task.startDate || task.createdAt);
      tStart.setHours(0,0,0,0);
      const tEnd = task.dueDate ? new Date(task.dueDate) : new Date(tStart);
      tEnd.setHours(23,59,59,999);
      
      const wStart = new Date(weekStart);
      wStart.setHours(0,0,0,0);

      let startOffset = differenceInDays(tStart, wStart);
      if (startOffset < 0) startOffset = 0;

      let endOffset = differenceInDays(tEnd, wStart);
      if (endOffset > 6) endOffset = 6;

      const duration = endOffset - startOffset + 1;

      let trackIndex = 0;
      while (true) {
        if (!tracks[trackIndex]) tracks[trackIndex] = [];
        let conflict = false;
        for (let i = startOffset; i <= endOffset; i++) {
          if (tracks[trackIndex][i]) {
            conflict = true;
            break;
          }
        }
        if (!conflict) break;
        trackIndex++;
      }

      for (let i = startOffset; i <= endOffset; i++) {
        tracks[trackIndex][i] = true;
      }

      return {
        task,
        startOffset,
        duration,
        trackIndex
      };
    });
  };

  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      days.push(day);
      day = addDays(day, 1);
    }
    rows.push(days);
    days = [];
  }

  const isOverdue = (task: any) => {
    if (task.status === 'COMPLETED') return false;
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date();
  };

  const getTaskColors = (task: any) => {
    if (isOverdue(task)) return 'bg-red-50 text-red-700 border-red-200 border-l-4 border-l-red-500';
    switch (task.status) {
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200 border-l-4 border-l-emerald-500';
      case 'IN_PROGRESS': return 'bg-blue-50 text-blue-700 border-blue-200 border-l-4 border-l-blue-500';
      case 'REVIEW': return 'bg-amber-50 text-amber-700 border-amber-200 border-l-4 border-l-amber-500';
      default: return 'bg-slate-50 text-slate-700 border-slate-200 border-l-4 border-l-slate-400';
    }
  };

  if (!activeProject) {
    return <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">Please set up a project to view the timeline.</div>;
  }
  
  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading timeline...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#D1CDC4] pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111111] flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-[#1F4D3A]" />
            Task Timeline
          </h1>
          <p className="text-slate-500 mt-1 mb-4">Monthly calendar view of your scheduled tasks.</p>
          
          <div className="flex flex-wrap items-center gap-4 text-[10px] uppercase font-bold tracking-widest text-slate-600">
             <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200 border border-slate-300"></span> Todo</div>
             <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></span> In Progress</div>
             <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300"></span> Review</div>
             <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></span> Completed</div>
             <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-300 flex items-center justify-center text-[8px] text-red-700 font-black">!</span> Overdue</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={today} className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest bg-slate-100 hover:bg-slate-200 text-[#111111] rounded transition-colors">
            Today
          </button>
          <div className="flex items-center border border-[#D1CDC4] bg-white rounded overflow-hidden shadow-sm">
            <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 transition-colors text-slate-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-4 py-1.5 min-w-[140px] text-center font-bold tracking-tight text-slate-700">
              {format(currentDate, 'MMMM yyyy')}
            </div>
            <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 transition-colors text-slate-600">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#D1CDC4] rounded-xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-7 border-b border-[#D1CDC4] bg-slate-50/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, i) => (
            <div key={dayName} className={`p-3 text-sm font-bold ${i === 0 ? 'text-red-600' : i === 6 ? 'text-green-600' : 'text-slate-500'}`}>
              {dayName}
            </div>
          ))}
        </div>

        <div className="flex flex-col">
          {rows.map((rowDays, i) => {
            const weekTasks = getTasksForWeek(rowDays[0], rowDays[6]);
            const maxTrack = weekTasks.length > 0 ? Math.max(...weekTasks.map(t => t.trackIndex)) : -1;
            const rowHeight = Math.max(120, (maxTrack + 1) * 36 + 40);

            return (
              <div key={i} className="relative flex border-b border-[#D1CDC4] last:border-0" style={{ height: `${rowHeight}px` }}>
                {/* Background grid lines and numbers */}
                {rowDays.map((d, colIndex) => {
                  const isCurrentMonth = isSameMonth(d, monthStart);
                  const isToday = isSameDay(d, new Date());
                  return (
                    <div key={d.toString()} className={`flex-1 border-r border-[#D1CDC4] last:border-0 p-2 ${!isCurrentMonth ? 'bg-[#f0ece1]/40' : ''}`}>
                      <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold
                        ${isToday ? 'bg-green-100 text-green-700 border border-green-200' : 
                          colIndex === 0 && isCurrentMonth ? 'text-red-500/80' : 
                          colIndex === 6 && isCurrentMonth ? 'text-green-600/80' : 
                          !isCurrentMonth ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                        {format(d, 'd')}
                      </div>
                    </div>
                  );
                })}

                {/* Events Layer */}
                <div className="absolute inset-x-0 bottom-0 top-10 pointer-events-none">
                  {weekTasks.map((t, index) => {
                    const taskOverdue = isOverdue(t.task);
                    const colorClasses = getTaskColors(t.task);
                    
                    return (
                      <div
                        key={index}
                        className={`absolute h-8 px-2 text-xs font-medium flex items-center justify-between border pointer-events-auto cursor-pointer shadow-sm hover:shadow transition-all ${colorClasses}`}
                        style={{
                          left: `calc(${(t.startOffset / 7) * 100}% + ${t.startOffset > 0 ? 4 : 0}px)`,
                          width: `calc(${(t.duration / 7) * 100}% - ${t.startOffset > 0 ? 4 : 0}px - ${t.startOffset + t.duration < 7 ? 4 : 0}px)`,
                          top: `${t.trackIndex * 36 + 4}px`,
                          borderRadius: '6px',
                        }}
                        title={`${t.task.title} - ${t.task.status}`}
                      >
                        <div className="flex items-center gap-2 truncate pointer-events-none select-none min-w-0">
                          {taskOverdue && <span className="font-bold text-red-600 shrink-0">!</span>}
                          <span className="truncate font-semibold">{t.task.title}</span>
                        </div>
                        {t.task.assignee && (
                          <div 
                            className="h-5 w-5 shrink-0 rounded-full bg-black/10 flex items-center justify-center font-bold text-[9px] uppercase border border-black/10"
                            title={t.task.assignee.name}
                          >
                            {t.task.assignee.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
