import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Shield, Activity, Lock, AlertOctagon } from 'lucide-react';

const data = [
  { time: '10:00', risk: 20 },
  { time: '10:10', risk: 35 },
  { time: '10:20', risk: 10 },
  { time: '10:30', risk: 80 },
  { time: '10:40', risk: 45 },
  { time: '10:50', risk: 30 },
  { time: '11:00', risk: 90 },
];

const categoryData = [
    { name: 'PHI', value: 45, color: '#ef4444' },
    { name: 'PII', value: 30, color: '#f59e0b' },
    { name: 'Financial', value: 25, color: '#3b82f6' },
];

const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
            <Icon size={64} />
        </div>
        <div className="relative z-10">
            <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-2">{title}</p>
            <h3 className="text-3xl font-bold text-slate-100 mb-1">{value}</h3>
            <p className={`text-xs ${color} font-medium`}>{sub}</p>
        </div>
    </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto bg-slate-950">
        <div className="flex justify-between items-end border-b border-slate-800 pb-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-100 tracking-tight">System Overview</h1>
                <p className="text-slate-400 mt-2">Real-time threat monitoring and compliance metrics.</p>
            </div>
            <div className="flex gap-2 text-xs font-mono text-success bg-success/10 px-3 py-1.5 rounded-full border border-success/20">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse my-auto" />
                SYSTEM OPERATIONAL
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Scanned" value="14,203" sub="+12% from last hour" icon={Activity} color="text-primary-500" />
            <StatCard title="Threats Blocked" value="342" sub="2.4% block rate" icon={Shield} color="text-success" />
            <StatCard title="Redacted Data" value="1,890" sub="PII/PHI masked" icon={Lock} color="text-warning" />
            <StatCard title="Critical Events" value="12" sub="Requires attention" icon={AlertOctagon} color="text-danger" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-slate-100 font-semibold mb-6 flex items-center gap-2">
                    <Activity size={18} className="text-primary-500" />
                    Threat Intensity (Last Hour)
                </h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="time" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                itemStyle={{ color: '#3b82f6' }}
                            />
                            <Area type="monotone" dataKey="risk" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-slate-100 font-semibold mb-6">Threat Distribution</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={60} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
