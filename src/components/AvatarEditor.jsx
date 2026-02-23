import React, { useState, useEffect } from 'react';
import { Palette, User, Smile, Eye, Shirt, Crown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
function sanitizeAvatarConfig(config) {
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

const generateAvatarUrl = (rawConfig) => {
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
  } else {
    url += `&accessoriesProbability=0`;
  }
  
  // Clothing
  if (config.clothing) {
    url += `&clothing=${config.clothing}`;
  }
  
  // Clothing color - DiceBear 9.x uses 'clothesColor'
  if (config.clothingColor && clothingColorMap[config.clothingColor]) {
    url += `&clothesColor=${clothingColorMap[config.clothingColor]}`;
  }
  
  // Clothing graphic (visible on graphicShirt)
  if (config.clothing === 'graphicShirt' && config.clothingGraphic && config.clothingGraphic !== 'none') {
    url += `&clothingGraphic=${config.clothingGraphic}`;
  }
  
  return url;
};

const AvatarEditor = ({ open, onOpenChange, userId, username, onSave }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('skin');
  const [config, setConfig] = useState(null);
  
  useEffect(() => {
    const loadConfig = async () => {
      const safeUsername = username || "default";
      console.log("[AvatarEditor] loadConfig: userId=", userId, "username=", username);
      if (userId) {
        try {
          const savedConfig = await db.getAvatarConfig(userId);
          console.log("[AvatarEditor] savedConfig=", savedConfig);
          setConfig({
            ...db.getDefaultAvatarConfig(),
            ...savedConfig,
            seed: safeUsername
          });
        } catch (e) {
          console.error("[AvatarEditor] Error loading avatar config:", e);
          setConfig({
            ...db.getDefaultAvatarConfig(),
            seed: safeUsername
          });
        }
      } else {
        setConfig({
          ...db.getDefaultAvatarConfig(),
          seed: safeUsername
        });
      }
    };
    if (open) {
      loadConfig().catch(e => {
        console.error("[AvatarEditor] loadConfig fatal error:", e);
        setConfig({
          ...db.getDefaultAvatarConfig(),
          seed: username || "default"
        });
      });
    }
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
  // Si config es null, mostrar un loader/spinner
  
  const tabs = [
    { id: 'skin', label: 'Piel', icon: Palette },
    { id: 'hair', label: 'Pelo', icon: User },
    { id: 'face', label: 'Cara', icon: Smile },
    { id: 'eyes', label: 'Ojos', icon: Eye },
    { id: 'clothing', label: 'Ropa', icon: Shirt },
    { id: 'accessories', label: 'Accesorios', icon: Crown }
  ];
  
  const renderColorSelector = (options, currentValue, onChange, label) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-blue-200">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              currentValue === opt.id 
                ? 'border-cyan-400 scale-110 shadow-[0_0_10px_rgba(34,211,238,0.5)]' 
                : 'border-blue-500/30 hover:border-blue-400/60'
            }`}
            style={{ backgroundColor: opt.color }}
            title={opt.label}
          />
        ))}
      </div>
    </div>
  );
  
  const renderStyleSelector = (options, currentValue, onChange, label) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-blue-200">{label}</label>
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {options.map(opt => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`px-3 py-2 text-xs rounded-lg border transition-all ${
              currentValue === opt.id 
                ? 'border-cyan-400 bg-cyan-500/20 text-white' 
                : 'border-blue-500/30 bg-blue-950/30 text-blue-300 hover:border-blue-400/60 hover:bg-blue-900/30'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-blue-500/30 text-white max-w-2xl max-h-[90vh] overflow-hidden flex items-center justify-center min-h-[300px]">
        {!config ? (
          <div className="flex flex-col items-center justify-center w-full h-full py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mb-4"></div>
            <div className="text-cyan-300 text-lg font-bold">Cargando avatar...</div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <User className="h-5 w-5 text-cyan-400" />
                Personalizar Avatar
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preview */}
              <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-950/50 to-slate-900/50 rounded-xl border border-blue-500/20">
                <div className="relative">
                  <img 
                    key={JSON.stringify(config)}
                    src={generateAvatarUrl(config)}
                    alt="Avatar Preview"
                    className="w-40 h-40 rounded-full border-4 border-cyan-500 shadow-[0_0_30px_rgba(34,211,238,0.4)] bg-slate-900"
                    onError={e => { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/9.x/avataaars/svg?seed=default'; }}
                  />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-xs font-bold">
                    Preview
                  </div>
                </div>
                <p className="mt-4 text-blue-300 text-sm text-center">
                  Personaliza tu avatar con diferentes opciones
                </p>
                {/* DEBUG: Show generated URL for troubleshooting */}
                <div className="mt-2 break-all text-xs text-cyan-300 bg-slate-800/80 p-2 rounded max-w-xs select-all">
                  {generateAvatarUrl(config)}
                </div>
              </div>
              {/* Options */}
              <div className="space-y-4">
                {/* Tabs */}
                <div className="flex flex-wrap gap-1 p-1 bg-blue-950/50 rounded-lg">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                          : 'text-blue-300 hover:bg-blue-900/30'
                      }`}
                    >
                      <tab.icon className="h-3 w-3" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>
                {/* Content */}
                <ScrollArea className="h-64 pr-4">
                  <div className="space-y-4">
                    {activeTab === 'skin' && (
                      <>
                        {renderColorSelector(SKIN_COLORS, config.skinColor, v => handleChange('skinColor', v), 'Color de Piel')}
                      </>
                    )}
                    {activeTab === 'hair' && (
                      <>
                        {renderStyleSelector(HAIR_STYLES, config.hairStyle, v => handleChange('hairStyle', v), 'Estilo de Pelo')}
                        {renderColorSelector(HAIR_COLORS, config.hairColor, v => handleChange('hairColor', v), 'Color de Pelo')}
                        {renderStyleSelector(FACIAL_HAIR_STYLES, config.facialHair, v => handleChange('facialHair', v), 'Barba')}
                        {config.facialHair && config.facialHair !== 'none' && (
                          renderColorSelector(FACIAL_HAIR_COLORS, config.facialHairColor, v => handleChange('facialHairColor', v), 'Color de Barba')
                        )}
                      </>
                    )}
                    {activeTab === 'face' && (
                      <>
                        {renderStyleSelector(MOUTH_STYLES, config.mouth, v => handleChange('mouth', v), 'Boca')}
                      </>
                    )}
                    {activeTab === 'eyes' && (
                      <>
                        {renderStyleSelector(EYES_STYLES, config.eyes, v => handleChange('eyes', v), 'Ojos')}
                        {renderStyleSelector(EYEBROW_STYLES, config.eyebrows, v => handleChange('eyebrows', v), 'Cejas')}
                      </>
                    )}
                    {activeTab === 'clothing' && (
                      <>
                        {renderStyleSelector(CLOTHING_STYLES, config.clothing, v => handleChange('clothing', v), 'Tipo de Ropa')}
                        {renderColorSelector(CLOTHING_COLORS, config.clothingColor, v => handleChange('clothingColor', v), 'Color de Ropa')}
                        {config.clothing === 'graphicShirt' && (
                          renderStyleSelector(CLOTHING_GRAPHIC, config.clothingGraphic, v => handleChange('clothingGraphic', v), 'Gráfico de Camiseta')
                        )}
                      </>
                    )}
                    {activeTab === 'accessories' && (
                      <>
                        {renderStyleSelector(ACCESSORIES, config.accessories, v => handleChange('accessories', v), 'Gafas/Accesorios')}
                        {config.accessories && config.accessories !== 'none' && (
                          renderColorSelector(ACCESSORIES_COLORS, config.accessoriesColor, v => handleChange('accessoriesColor', v), 'Color de Accesorios')
                        )}
                        {renderStyleSelector(HAT_STYLES, config.hat, v => handleChange('hat', v), 'Sombrero/Gorra')}
                        {config.hat && config.hat !== 'none' && (
                          renderColorSelector(HAT_COLORS, config.hatColor, v => handleChange('hatColor', v), 'Color de Sombrero')
                        )}
                      </>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
            {/* Actions */}
            <div className="flex flex-col gap-2 pt-4 border-t border-blue-500/20">
              <div className="flex gap-2 mb-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-blue-500/30 text-blue-300 hover:bg-blue-950/30"
                >
                  Restablecer
                </Button>
                <div className="flex gap-1 flex-wrap">
                  {avatarPresets.map((preset) => (
                    <Button key={preset.name} variant="outline" className="border-blue-500/30 text-blue-300 hover:bg-blue-950/30 px-2 py-1 text-xs" onClick={() => handlePreset(preset)}>
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-blue-500/30 text-blue-300 hover:bg-blue-950/30"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
                >
                  {saving ? 'Guardando...' : 'Guardar Avatar'}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export { generateAvatarUrl, sanitizeAvatarConfig };
export default AvatarEditor;
