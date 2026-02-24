import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { Palette, User, Smile, Eye, Shirt, Crown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  SKIN_COLORS,
  HAIR_STYLES,
  HAIR_COLORS,
  FACIAL_HAIR_STYLES,
  EYES_STYLES,
  EYEBROW_STYLES,
  MOUTH_STYLES,
  ACCESSORIES,
  CLOTHING_STYLES,
  CLOTHING_COLORS,
  HAT_STYLES,
  HAT_COLORS,
  CLOTHING_GRAPHIC,
  FACIAL_HAIR_COLORS,
  ACCESSORIES_COLORS,
  skinColorMap,
  hairColorMap,
  clothingColorMap,
  hatColorMap,
  accessoriesColorMap,
  facialHairColorMap
} from '@/lib/avatar-constants';

// Devuelve solo valores válidos para DiceBear
export function sanitizeAvatarConfig(config) {
  const pick = (arr, v, def) => arr.some(x => x.id === v) ? v : def;
  return {
    ...config,
    skinColor: pick(SKIN_COLORS, config.skinColor, 'light'),
    hairStyle: pick(HAIR_STYLES, config.hairStyle, 'shortRound'),
    hairColor: pick(HAIR_COLORS, config.hairColor, 'brown'),
    facialHair: pick(FACIAL_HAIR_STYLES, config.facialHair, 'none'),
    facialHairColor: pick(FACIAL_HAIR_COLORS, config.facialHairColor, 'brown'),
    eyes: pick(EYES_STYLES, config.eyes, 'default'),
    eyebrows: pick(EYEBROW_STYLES, config.eyebrows, 'default'),
    mouth: pick(MOUTH_STYLES, config.mouth, 'smile'),
    accessories: pick(ACCESSORIES, config.accessories, 'none'),
    accessoriesColor: pick(ACCESSORIES_COLORS, config.accessoriesColor, 'black'),
    clothing: pick(CLOTHING_STYLES, config.clothing, 'hoodie'),
    clothingColor: pick(CLOTHING_COLORS, config.clothingColor, 'blue01'),
    clothingGraphic: pick(CLOTHING_GRAPHIC, config.clothingGraphic, 'none'),
    hat: pick(HAT_STYLES, config.hat, 'none'),
    hatColor: pick(HAT_COLORS, config.hatColor, 'black'),
  };
}

export const generateAvatarUrl = (rawConfig) => {
  const config = sanitizeAvatarConfig(rawConfig);
  if (!config) return 'https://api.dicebear.com/9.x/avataaars/svg?seed=default';
  
  const seed = config.seed || 'default';
  let url = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  
  // Skin color
  if (config.skinColor && skinColorMap[config.skinColor]) {
    url += `&skinColor=${skinColorMap[config.skinColor]}`;
  }
  
  // Top: hats override hair style (both use the 'top' parameter in DiceBear 9.x)
  if (config.hat && config.hat !== 'none') {
    url += `&top=${config.hat}&topProbability=100`;
  } else if (config.hairStyle && config.hairStyle !== 'noHair') {
    url += `&top=${config.hairStyle}&topProbability=100`;
  } else if (config.hairStyle === 'noHair') {
    url += `&topProbability=0`;
  }
  
  // Hair color
  if (config.hairColor && hairColorMap[config.hairColor]) {
    url += `&hairColor=${hairColorMap[config.hairColor]}`;
  }
  
  // Hat color (for winterHat, turban, hijab, etc.)
  if (config.hat && config.hat !== 'none' && config.hatColor && hatColorMap[config.hatColor]) {
    url += `&hatColor=${hatColorMap[config.hatColor]}`;
  }
  
  // Facial Hair
  if (config.facialHair && config.facialHair !== 'none') {
    url += `&facialHair=${config.facialHair}&facialHairProbability=100`;
    // Facial hair color
    if (config.facialHairColor && facialHairColorMap[config.facialHairColor]) {
      url += `&facialHairColor=${facialHairColorMap[config.facialHairColor]}`;
    }
  } else {
    url += `&facialHairProbability=0`;
  }
  
  // Eyes
  if (config.eyes) {
    url += `&eyes=${config.eyes}`;
  }
  
  // Eyebrows  
  if (config.eyebrows) {
    url += `&eyebrows=${config.eyebrows}`;
  }
  
  // Mouth
  if (config.mouth) {
    url += `&mouth=${config.mouth}`;
  }
  
  // Accessories
  if (config.accessories && config.accessories !== 'none') {
    url += `&accessories=${config.accessories}&accessoriesProbability=100`;
    // Accessories color
    if (config.accessoriesColor && accessoriesColorMap[config.accessoriesColor]) {
      url += `&accessoriesColor=${accessoriesColorMap[config.accessoriesColor]}`;
    }
  }
  return url;
};

const AvatarEditor = ({ open, onOpenChange, userId, username, onSave }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('skin');
  const [config, setConfig] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [step, setStep] = useState(undefined);
  
  useEffect(() => {
    let timeoutId;
    let finished = false;
    const loadConfig = async () => {
      setLoadError(null);
      const safeUsername = username || "default";
      console.log("[AvatarEditor] loadConfig: userId=", userId, "username=", username);
      if (userId) {
        try {
          const savedConfig = await db.getAvatarConfig(userId);
          if (finished) return;
          console.log("[AvatarEditor] savedConfig=", savedConfig);
          setConfig({
            ...db.getDefaultAvatarConfig(),
            ...savedConfig,
            seed: safeUsername
          });
        } catch (e) {
          if (finished) return;
          console.error("[AvatarEditor] Error loading avatar config:", e);
          setConfig({
            ...db.getDefaultAvatarConfig(),
            seed: safeUsername
          });
          setLoadError("No se pudo cargar tu avatar. Se usará el avatar por defecto.");
        }
      } else {
        if (finished) return;
        setConfig({
          ...db.getDefaultAvatarConfig(),
          seed: safeUsername
        });
      }
    };
    if (open) {
      setStep(undefined);
      timeoutId = setTimeout(() => {
        finished = true;
        setConfig({
          ...db.getDefaultAvatarConfig(),
          seed: username || "default"
        });
        setLoadError("La carga del avatar está tardando demasiado. Se usará el avatar por defecto.");
      }, 2000);
      loadConfig().catch(e => {
        if (finished) return;
        console.error("[AvatarEditor] loadConfig fatal error:", e);
        setConfig({
          ...db.getDefaultAvatarConfig(),
          seed: username || "default"
        });
        setLoadError("Error fatal al cargar el avatar. Se usará el avatar por defecto.");
      }).finally(() => {
        clearTimeout(timeoutId);
        finished = true;
      });
    }
    return () => {
      clearTimeout(timeoutId);
      finished = true;
    };
  }, [open, userId, username]);
  
  const handleChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };
  
  const handleSave = async () => {
    setSaving(true);
    try {
      await db.saveAvatarConfig(userId, config);
      // Notificar a otros tabs/componentes del cambio de avatar
      window.dispatchEvent(new Event('avatarConfigChanged'));
      toast({
        title: "¡Avatar guardado!",
        description: "Tu avatar ha sido actualizado",
        className: "bg-green-600 text-white"
      });
      if (onSave) onSave(config);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el avatar",
        variant: "destructive"
      });
    }
    setSaving(false);
  };
  
  // Presets de avatar
  const avatarPresets = [
    {
      name: 'Clásico',
      config: {
        skinColor: 'light', hairStyle: 'shortRound', hairColor: 'brown', facialHair: 'none', facialHairColor: 'brown', eyes: 'default', eyebrows: 'default', mouth: 'smile', accessories: 'none', accessoriesColor: 'black', clothing: 'hoodie', clothingColor: 'blue01', clothingGraphic: 'none', hat: 'none', hatColor: 'black'
      }
    },
    {
      name: 'Cool',
      config: {
        skinColor: 'tanned', hairStyle: 'shaggy', hairColor: 'black', facialHair: 'beardLight', facialHairColor: 'black', eyes: 'happy', eyebrows: 'raised', mouth: 'smile', accessories: 'sunglasses', accessoriesColor: 'black', clothing: 'graphicShirt', clothingColor: 'red', clothingGraphic: 'pizza', hat: 'none', hatColor: 'black'
      }
    },
    {
      name: 'Gamer',
      config: {
        skinColor: 'pale', hairStyle: 'bob', hairColor: 'blonde', facialHair: 'none', facialHairColor: 'brown', eyes: 'wink', eyebrows: 'up', mouth: 'smile', accessories: 'glasses', accessoriesColor: 'blue', clothing: 'hoodie', clothingColor: 'purple', clothingGraphic: 'none', hat: 'beanie', hatColor: 'blue'
      }
    }
  ];

  const handlePreset = (preset) => {
    setConfig(prev => ({ ...db.getDefaultAvatarConfig(), ...preset.config, seed: username }));
  };

  const handleReset = () => {
    setConfig({
      ...db.getDefaultAvatarConfig(),
      seed: username
    });
  };
  
    // Mostrar el modal siempre que open sea true, aunque config sea null
      <div className="flex flex-col gap-3 pt-6 border-t border-blue-500/20 mt-6">
      {/* ...otros elementos... */}
      </div>

    const tabs = [
    { id: 'skin', label: 'Piel', icon: Palette },
    { id: 'hair', label: 'Pelo', icon: User },
    { id: 'face', label: 'Cara', icon: Smile },
    { id: 'eyes', label: 'Ojos', icon: Eye },
    { id: 'clothing', label: 'Ropa', icon: Shirt },
    { id: 'accessories', label: 'Accesorios', icon: Crown }
  ];
  
  // NUEVO DISEÑO MINIMALISTA Y MODERNO
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-blue-950 to-slate-900 text-white max-w-xl w-full min-h-[420px] rounded-2xl shadow-2xl flex flex-col items-center justify-center p-0">
        {!config ? (
          <div className="flex flex-col items-center justify-center w-full h-full py-16">
            <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-cyan-400 mb-6"></div>
            <div className="text-cyan-300 text-xl font-bold">Cargando avatar...</div>
            {loadError && (
              <div className="mt-6 text-red-400 text-base font-bold">{loadError}</div>
            )}
          </div>
        ) : (
          <div className="w-full flex flex-col md:flex-row">
            {/* Vista previa avatar */}
            <div className="flex flex-col items-center justify-center md:w-1/2 w-full p-8">
              <img
                key={JSON.stringify(config)}
                src={generateAvatarUrl(config)}
                alt="Avatar Preview"
                className="w-36 h-36 rounded-full border-4 border-cyan-500 shadow-lg bg-slate-900"
                onError={e => { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/9.x/avataaars/svg?seed=default'; }}
              />
              <div className="mt-4 text-center">
                <div className="text-cyan-400 font-bold text-lg">Vista previa</div>
                <div className="text-blue-300 text-sm">Personaliza tu avatar</div>
              </div>
            </div>
            {/* Opciones avatar */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
              <div className="grid grid-cols-2 gap-4 w-full">
                <button className="bg-cyan-900/60 rounded-xl py-4 text-lg font-bold text-cyan-200 hover:bg-cyan-800/80 transition" onClick={() => setStep('skin')}>Piel</button>
                <button className="bg-cyan-900/60 rounded-xl py-4 text-lg font-bold text-cyan-200 hover:bg-cyan-800/80 transition" onClick={() => setStep('hair')}>Pelo</button>
                <button className="bg-cyan-900/60 rounded-xl py-4 text-lg font-bold text-cyan-200 hover:bg-cyan-800/80 transition" onClick={() => setStep('face')}>Cara</button>
                <button className="bg-cyan-900/60 rounded-xl py-4 text-lg font-bold text-cyan-200 hover:bg-cyan-800/80 transition" onClick={() => setStep('eyes')}>Ojos</button>
                <button className="bg-cyan-900/60 rounded-xl py-4 text-lg font-bold text-cyan-200 hover:bg-cyan-800/80 transition" onClick={() => setStep('clothing')}>Ropa</button>
                <button className="bg-cyan-900/60 rounded-xl py-4 text-lg font-bold text-cyan-200 hover:bg-cyan-800/80 transition" onClick={() => setStep('accessories')}>Accesorios</button>
              </div>
              {/* Paso de edición */}
              {step && (
                <div className="w-full mt-4 bg-blue-950/80 rounded-xl p-4 flex flex-col gap-4">
                  <button className="mb-2 text-cyan-400 flex items-center gap-2 font-bold" onClick={() => setStep(undefined)}>
                    <span className="material-icons">arrow_back</span> Volver
                  </button>
                  {step === 'skin' && (
                    <div className="flex flex-wrap gap-3 justify-center">
                      {SKIN_COLORS.map(opt => (
                        <button
                          key={opt.id}
                          className={`w-10 h-10 rounded-full border-4 ${config.skinColor === opt.id ? 'border-cyan-400 scale-110' : 'border-transparent'} transition-all`}
                          style={{ background: opt.color }}
                          onClick={() => handleChange('skinColor', opt.id)}
                          aria-label={opt.label}
                        />
                      ))}
                    </div>
                  )}
                  {step === 'hair' && (
                    <>
                      <div className="mb-2 text-cyan-300 font-semibold">Estilo</div>
                      <div className="flex flex-col items-center">
                        <div className="flex flex-wrap gap-2 justify-center mb-4 max-h-40 overflow-auto scrollbar-thin scrollbar-thumb-cyan-700 scrollbar-track-blue-950 pr-2 rounded-lg">
                          {HAIR_STYLES.map(opt => (
                            <button
                              key={opt.id}
                              className={`px-3 py-1 rounded-lg border ${config.hairStyle === opt.id ? 'bg-cyan-700 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-cyan-200'} text-sm font-medium transition`}
                              onClick={() => handleChange('hairStyle', opt.id)}
                            >{opt.label}</button>
                          ))}
                        </div>
                      </div>
                      <div className="mb-2 text-cyan-300 font-semibold">Color</div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {HAIR_COLORS.map(opt => (
                          <button
                            key={opt.id}
                            className={`w-8 h-8 rounded-full border-4 ${config.hairColor === opt.id ? 'border-cyan-400 scale-110' : 'border-transparent'} transition-all`}
                            style={{ background: opt.color }}
                            onClick={() => handleChange('hairColor', opt.id)}
                            aria-label={opt.label}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  {step === 'face' && (
                    <>
                      <div className="mb-2 text-cyan-300 font-semibold">Boca</div>
                      <div className="flex flex-wrap gap-2 justify-center mb-4">
                        {MOUTH_STYLES.map(opt => (
                          <button
                            key={opt.id}
                            className={`px-3 py-1 rounded-lg border ${config.mouth === opt.id ? 'bg-cyan-700 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-cyan-200'} text-sm font-medium transition`}
                            onClick={() => handleChange('mouth', opt.id)}
                          >{opt.label}</button>
                        ))}
                      </div>
                      <div className="mb-2 text-cyan-300 font-semibold">Barba/Bigote</div>
                      <div className="flex flex-wrap gap-2 justify-center mb-2">
                        {FACIAL_HAIR_STYLES.map(opt => (
                          <button
                            key={opt.id}
                            className={`px-3 py-1 rounded-lg border ${config.facialHair === opt.id ? 'bg-cyan-700 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-cyan-200'} text-sm font-medium transition`}
                            onClick={() => handleChange('facialHair', opt.id)}
                          >{opt.label}</button>
                        ))}
                      </div>
                      {config.facialHair !== 'none' && (
                        <div className="mb-2 text-cyan-300 font-semibold">Color Barba</div>
                      )}
                      {config.facialHair !== 'none' && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {FACIAL_HAIR_COLORS.map(opt => (
                            <button
                              key={opt.id}
                              className={`w-8 h-8 rounded-full border-4 ${config.facialHairColor === opt.id ? 'border-cyan-400 scale-110' : 'border-transparent'} transition-all`}
                              style={{ background: opt.color }}
                              onClick={() => handleChange('facialHairColor', opt.id)}
                              aria-label={opt.label}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {step === 'eyes' && (
                    <>
                      <div className="mb-2 text-cyan-300 font-semibold">Ojos</div>
                      <div className="flex flex-wrap gap-2 justify-center mb-4">
                        {EYES_STYLES.map(opt => (
                          <button
                            key={opt.id}
                            className={`px-3 py-1 rounded-lg border ${config.eyes === opt.id ? 'bg-cyan-700 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-cyan-200'} text-sm font-medium transition`}
                            onClick={() => handleChange('eyes', opt.id)}
                          >{opt.label}</button>
                        ))}
                      </div>
                      <div className="mb-2 text-cyan-300 font-semibold">Cejas</div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {EYEBROW_STYLES.map(opt => (
                          <button
                            key={opt.id}
                            className={`px-3 py-1 rounded-lg border ${config.eyebrows === opt.id ? 'bg-cyan-700 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-cyan-200'} text-sm font-medium transition`}
                            onClick={() => handleChange('eyebrows', opt.id)}
                          >{opt.label}</button>
                        ))}
                      </div>
                    </>
                  )}
                  {step === 'clothing' && (
                    <>
                      <div className="mb-2 text-cyan-300 font-semibold">Ropa</div>
                      <div className="flex flex-col items-center">
                        <div className="flex flex-wrap gap-2 justify-center mb-4 max-h-32 overflow-auto scrollbar-thin scrollbar-thumb-cyan-700 scrollbar-track-blue-950 pr-2 rounded-lg">
                          {CLOTHING_STYLES.map(opt => (
                            <button
                              key={opt.id}
                              className={`px-3 py-1 rounded-lg border ${config.clothing === opt.id ? 'bg-cyan-700 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-cyan-200'} text-sm font-medium transition`}
                              onClick={() => handleChange('clothing', opt.id)}
                            >{opt.label}</button>
                          ))}
                        </div>
                      </div>
                      <div className="mb-2 text-cyan-300 font-semibold">Color</div>
                      <div className="flex flex-wrap gap-2 justify-center mb-4">
                        {CLOTHING_COLORS.map(opt => (
                          <button
                            key={opt.id}
                            className={`w-8 h-8 rounded-full border-4 ${config.clothingColor === opt.id ? 'border-cyan-400 scale-110' : 'border-transparent'} transition-all`}
                            style={{ background: opt.color }}
                            onClick={() => handleChange('clothingColor', opt.id)}
                            aria-label={opt.label}
                          />
                        ))}
                      </div>
                      <div className="mb-2 text-cyan-300 font-semibold">Gráfico</div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {CLOTHING_GRAPHIC.map(opt => (
                          <button
                            key={opt.id}
                            className={`px-3 py-1 rounded-lg border ${config.clothingGraphic === opt.id ? 'bg-cyan-700 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-cyan-200'} text-sm font-medium transition`}
                            onClick={() => handleChange('clothingGraphic', opt.id)}
                          >{opt.label}</button>
                        ))}
                      </div>
                    </>
                  )}
                  {step === 'accessories' && (
                    <>
                      <div className="mb-2 text-cyan-300 font-semibold">Accesorios</div>
                      <div className="flex flex-wrap gap-2 justify-center mb-4">
                        {ACCESSORIES.map(opt => (
                          <button
                            key={opt.id}
                            className={`px-3 py-1 rounded-lg border ${config.accessories === opt.id ? 'bg-cyan-700 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-cyan-200'} text-sm font-medium transition`}
                            onClick={() => handleChange('accessories', opt.id)}
                          >{opt.label}</button>
                        ))}
                      </div>
                      <div className="mb-2 text-cyan-300 font-semibold">Color Accesorio</div>
                      <div className="flex flex-wrap gap-2 justify-center mb-4">
                        {ACCESSORIES_COLORS.map(opt => (
                          <button
                            key={opt.id}
                            className={`w-8 h-8 rounded-full border-4 ${config.accessoriesColor === opt.id ? 'border-cyan-400 scale-110' : 'border-transparent'} transition-all`}
                            style={{ background: opt.color }}
                            onClick={() => handleChange('accessoriesColor', opt.id)}
                            aria-label={opt.label}
                          />
                        ))}
                      </div>
                      <div className="mb-2 text-cyan-300 font-semibold">Sombrero</div>
                      <div className="flex flex-wrap gap-2 justify-center mb-4">
                        {HAT_STYLES.map(opt => (
                          <button
                            key={opt.id}
                            className={`px-3 py-1 rounded-lg border ${config.hat === opt.id ? 'bg-cyan-700 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-cyan-200'} text-sm font-medium transition`}
                            onClick={() => handleChange('hat', opt.id)}
                          >{opt.label}</button>
                        ))}
                      </div>
                      {config.hat !== 'none' && (
                        <>
                          <div className="mb-2 text-cyan-300 font-semibold">Color Sombrero</div>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {HAT_COLORS.map(opt => (
                              <button
                                key={opt.id}
                                className={`w-8 h-8 rounded-full border-4 ${config.hatColor === opt.id ? 'border-cyan-400 scale-110' : 'border-transparent'} transition-all`}
                                style={{ background: opt.color }}
                                onClick={() => handleChange('hatColor', opt.id)}
                                aria-label={opt.label}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 rounded-xl text-lg shadow-lg border-2 border-cyan-400 transition"
              >
                {saving ? 'Guardando...' : 'Guardar Avatar'}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AvatarEditor;