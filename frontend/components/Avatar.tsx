import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Palette, X, Check } from 'lucide-react';

interface AvatarProps {
  user: any;
  size?: number;
  editable?: boolean;
  onUpdate?: (data: { avatar?: string; avatarColor?: string }) => void;
}

const PRESET_COLORS = [
  '#5c56e3', '#6366f1', '#8b5cf6', '#ec4899',
  '#10b981', '#14b8a6', '#f59e0b', '#ef4444',
  '#3b82f6', '#0ea5e9', '#f97316', '#84cc16',
];

const Avatar: React.FC<AvatarProps> = ({ user, size = 56, editable = false, onUpdate }) => {
  const [showEditor, setShowEditor] = useState(false);
  const [selectedColor, setSelectedColor] = useState(
    user?.avatarColor || '#5c56e3'
  );
  const [previewImage, setPreviewImage] = useState<string | null>(user?.avatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = (user?.name || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onUpdate?.({ avatar: previewImage || undefined, avatarColor: selectedColor });
    setShowEditor(false);
  };

  const handleRemovePhoto = () => {
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="relative inline-block">
      {/* Avatar principal */}
      <div
        className={`rounded-[${Math.round(size * 0.35)}px] overflow-hidden flex items-center justify-center font-black text-white shadow-xl relative`}
        style={{
          width: size,
          height: size,
          backgroundColor: previewImage ? 'transparent' : selectedColor,
          borderRadius: Math.round(size * 0.3),
          fontSize: Math.round(size * 0.35),
          boxShadow: `0 10px 30px ${selectedColor}40`,
        }}
      >
        {previewImage ? (
          <img src={previewImage} alt={user?.name} className="w-full h-full object-cover" />
        ) : (
          <span style={{ fontSize: Math.round(size * 0.35) }}>{initials}</span>
        )}

        {/* Bouton édition au survol */}
        {editable && (
          <button
            onClick={() => setShowEditor(true)}
            className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <Camera size={Math.round(size * 0.3)} className="text-white" />
          </button>
        )}
      </div>

      {/* Badge caméra pour les petits avatars */}
      {editable && size <= 48 && (
        <button
          onClick={() => setShowEditor(true)}
          className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 hover:bg-indigo-700 transition-colors"
        >
          <Camera size={10} className="text-white" />
        </button>
      )}

      {/* Modal éditeur */}
      {showEditor && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
            
            <div className="p-8 pb-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Photo de profil</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Personnalisez votre avatar</p>
              </div>
              <button onClick={() => setShowEditor(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Préview avatar */}
              <div className="flex justify-center">
                <div
                  className="flex items-center justify-center font-black text-white overflow-hidden"
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 28,
                    backgroundColor: previewImage ? 'transparent' : selectedColor,
                    fontSize: 32,
                    boxShadow: `0 15px 40px ${selectedColor}50`,
                  }}
                >
                  {previewImage ? (
                    <img src={previewImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
              </div>

              {/* Upload photo */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Photo de profil</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Camera size={16} /> Uploader
                  </button>
                  {previewImage && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-4 py-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl text-xs font-black text-rose-500 hover:bg-rose-100 transition-all"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Color picker */}
              {!previewImage && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Palette size={12} /> Couleur de fond
                  </p>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-9 h-9 rounded-xl transition-all active:scale-90 ${
                          selectedColor === color
                            ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  {/* Custom color input */}
                  <div className="flex items-center gap-3">
                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Couleur custom :</label>
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={e => setSelectedColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border-2 border-slate-200 dark:border-slate-700"
                    />
                    <span className="text-xs font-mono text-slate-400">{selectedColor}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Check size={16} /> Sauvegarder
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Avatar;