
import React, { useState, useEffect } from 'react';
import { Building2, ArrowRight, ShieldCheck, Mail, Calendar, User as UserIcon, MessageSquare } from 'lucide-react';
import { User } from '../types';

interface AuditorClientsViewProps {
  auditor: User;
  allUsers: User[];
  onSelectClient: (clientId: string) => void;
  onNavigate?: (view: string, data?: any) => void;
  isDark: boolean;
}

const AuditorClientsView: React.FC<AuditorClientsViewProps> = ({ auditor, allUsers, onSelectClient, onNavigate, isDark }) => {
  const [myClients, setMyClients] = useState<User[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/users', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const users = await response.json();
        const myId = (auditor as any)?._id || auditor?.id;
        console.log('[MesClients] Auditor ID:', myId, '| Total users:', Array.isArray(users) ? users.length : 0);
        const clients = Array.isArray(users)
          ? users.filter((u: any) => {
              const match = u.auditorId?.toString() === myId?.toString();
              const isClient = u.role?.toUpperCase() === 'CLIENT';
              return match && isClient;
            })
          : [];
        console.log('[MesClients] Clients trouvés:', clients.length, clients.map((c: any) => c.name));
        setMyClients(clients);
      } catch (error) {
        console.error('Erreur chargement clients:', error);
        setMyClients([]);
      }
    };
    
    if (auditor?.id || (auditor as any)?._id) {
      fetchClients();
    }
  }, [auditor]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white">Mes Clients Assignés</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Liste des entreprises dont vous avez la charge pour l'audit.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {myClients.length === 0 ? (
          <div className="col-span-full p-20 text-center bg-white dark:bg-slate-900 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <Building2 className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 dark:text-slate-400 font-bold">Aucun client ne vous est actuellement assigné.</p>
          </div>
        ) : (
          myClients.map(client => (
            <div 
              key={client.id || (client as any)._id}
              className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center font-black">
                  <Building2 size={28} />
                </div>
                <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase rounded-full">
                  Audit en cours
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{client.company || client.name}</h3>
              <div className="space-y-3 mb-8">
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <UserIcon size={14} className="text-slate-400" /> {client.name}
                </p>
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <Mail size={14} className="text-slate-400" /> {client.email}
                </p>
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" /> Echéance: 12 Oct 2024
                </p>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => onSelectClient(client.id || (client as any)._id)}
                  className="flex-1 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 group"
                >
                  Workspace <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => onNavigate?.('messages', { targetUser: client })}
                  className="px-5 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
                  title="Contacter le client"
                >
                  <MessageSquare size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AuditorClientsView;
