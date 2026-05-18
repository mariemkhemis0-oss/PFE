
import React, { useState } from 'react';
import { 
  Users, UserPlus, Search, Edit2, Trash2, Mail, Building2, X, CheckCircle2
} from 'lucide-react';
import { User, UserRole } from '../types';

interface UsersViewProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  isDark: boolean;
}

const UsersView: React.FC<UsersViewProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser, isDark }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: UserRole.CLIENT,
    company: ''
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: UserRole.CLIENT, company: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({ 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      company: user.company || '' 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser({ ...editingUser, ...formData });
      showStatus('Utilisateur mis à jour');
    } else {
      onAddUser({
        id: Math.random().toString(36).substr(2, 9),
        ...formData
      });
      showStatus('Nouvel utilisateur créé');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      onDeleteUser(id);
      showStatus('Utilisateur supprimé');
    }
  };

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const getRoleBadge = (role: UserRole) => {
    const base = "text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider ";
    switch (role) {
      case UserRole.ADMIN: return base + "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400";
      case UserRole.CHEF: return base + "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
      case UserRole.AUDITOR: return base + "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400";
      case UserRole.CLIENT: return base + "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400";
      default: return base + "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {statusMessage && (
        <div className="fixed top-24 right-8 z-50 bg-indigo-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
          <CheckCircle2 size={24} />
          <span className="font-bold">{statusMessage}</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white">Utilisateurs</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Contrôle des accès plateforme.</p>
        </div>
        <button onClick={handleOpenAddModal} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg">
          <UserPlus size={20} /> Ajouter
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="text-slate-400 text-xs font-black uppercase tracking-widest bg-slate-50/50 dark:bg-slate-950">
            <tr>
              <th className="px-8 py-4">Utilisateur</th>
              <th className="px-8 py-4">Rôle</th>
              <th className="px-8 py-4">Organisation</th>
              <th className="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">{u.name.charAt(0)}</div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white leading-tight">{u.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5"><span className={getRoleBadge(u.role)}>{u.role}</span></td>
                <td className="px-8 py-5 text-sm font-medium italic text-slate-500">{u.company || '—'}</td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleOpenEditModal(u)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(u.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] border border-slate-200 dark:border-slate-800 p-8">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-8">{editingUser ? 'Modifier' : 'Nouveau'}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <input type="text" required placeholder="Nom" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              <input type="email" required placeholder="Email" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              <div className={`grid ${formData.role === UserRole.CLIENT ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                <select className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}>
                  <option value={UserRole.ADMIN}>Admin</option>
                  <option value={UserRole.AUDITOR}>Auditeur</option>
                  <option value={UserRole.CLIENT}>Client</option>
                </select>
                {formData.role === UserRole.CLIENT && (
                  <input type="text" placeholder="Organisation" className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} />
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-slate-500">Annuler</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersView;
