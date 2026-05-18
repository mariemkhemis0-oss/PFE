import React, { useState, useEffect } from 'react';
import { Building2, Plus, AlertCircle, Loader2 } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  sector: string;
  type: string;
  assignedAt: string;
}

interface OrganizationSelectorProps {
  isDark: boolean;
  onSelect: (organizationId: string, organization: Organization) => void;
  isLoading?: boolean;
}

const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({ 
  isDark, 
  onSelect, 
  isLoading = false 
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyOrganizations();
  }, []);

  const fetchMyOrganizations = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/audits/my-organizations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des organisations');
      }

      const data = await response.json();
      setOrganizations(data.organizations || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les organisations');
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className={`flex items-center justify-center p-16 rounded-[56px] ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <Loader2 className="animate-spin" size={32} color={isDark ? '#57a9d9' : '#57a9d9'} />
      </div>
    );
  }

  if (error || organizations.length === 0) {
    return (
      <div className={`p-12 rounded-[56px] border-2 border-dashed ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
        <div className="flex items-center gap-4 text-center flex-col">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <AlertCircle size={32} className={isDark ? 'text-slate-400' : 'text-slate-400'} />
          </div>
          <div className="space-y-2">
            <h3 className={`font-black uppercase text-lg italic tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Aucune organisation disponible
            </h3>
            <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {error || 'Contactez votre administrateur pour être assigné à une organisation'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full border-2 border-[#57a9d9] flex items-center justify-center`}>
          <Building2 size={24} className="text-[#57a9d9]" />
        </div>
        <div>
          <h2 className={`text-2xl font-black uppercase italic tracking-tighter ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Sélectionner une organisation
          </h2>
          <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Choisissez l'entité à auditer pour continuer
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((org) => (
          <button
            key={org.id}
            onClick={() => onSelect(org.id, org)}
            className={`group p-8 rounded-[32px] border-2 transition-all hover:scale-[1.02] active:scale-95 text-left space-y-4 ${
              isDark
                ? 'border-slate-700 bg-slate-900 hover:border-[#57a9d9] hover:bg-slate-800'
                : 'border-slate-200 bg-white hover:border-[#57a9d9] hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-lg border-2 border-[#57a9d9] flex items-center justify-center group-hover:bg-[#57a9d9]/10 transition-all`}>
                <Building2 size={20} className="text-[#57a9d9]" />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                isDark 
                  ? 'bg-[#57a9d9]/20 text-[#57a9d9]' 
                  : 'bg-[#57a9d9]/10 text-[#57a9d9]'
              }`}>
                {org.type}
              </span>
            </div>

            <div className="space-y-3">
              <h3 className={`text-lg font-black uppercase italic tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {org.name}
              </h3>
              <div className="space-y-2">
                <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  📊 Secteur: <span className={isDark ? 'text-[#57a9d9]' : 'text-[#57a9d9]'}>{org.sector || 'N/A'}</span>
                </p>
                <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  📅 Assignée: <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{new Date(org.assignedAt).toLocaleDateString()}</span>
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Commencer l'audit
              </span>
              <Plus size={16} className={`transition-transform group-hover:translate-x-1 ${isDark ? 'text-slate-500 group-hover:text-[#57a9d9]' : 'text-slate-400 group-hover:text-[#57a9d9]'}`} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default OrganizationSelector;
