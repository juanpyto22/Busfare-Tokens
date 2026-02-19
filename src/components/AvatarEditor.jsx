import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Palette, User, Shirt, Crown, Smile, Eye } from 'lucide-react';
import { db } from '@/lib/db';
import { useToast } from '@/components/ui/use-toast';

// Opciones de personalización compatibles con DiceBear Avataaars
const SKIN_COLORS = [
  { id: 'pale', label: 'Pálido', color: '#ffdfc4' },
  { id: 'light', label: 'Claro', color: '#f0d5be' },
  { id: 'tanned', label: 'Bronceado', color: '#edb98a' },
  { id: 'yellow', label: 'Amarillo', color: '#fce5a8' },
  { id: 'brown', label: 'Moreno', color: '#d08b5b' },
  { id: 'darkBrown', label: 'Marrón Oscuro', color: '#ae5d29' },
  { id: 'black', label: 'Negro', color: '#614335' }
];

const HAIR_STYLES = [
  { id: 'shortRound', label: 'Corto Redondeado' },
  { id: 'shortFlat', label: 'Corto Plano' },
  { id: 'shortCurly', label: 'Corto Rizado' },
  { id: 'shortWaved', label: 'Corto Ondulado' },
  { id: 'longButNotTooLong', label: 'Largo' },
  { id: 'curly', label: 'Rizado' },
  { id: 'curvy', label: 'Ondulado' },
  { id: 'frizzle', label: 'Encrespado' },
  { id: 'shaggy', label: 'Despeinado' },
  { id: 'shaggyMullet', label: 'Mullet' },
  { id: 'dreads', label: 'Rastas' },
  { id: 'bigHair', label: 'Voluminoso' },
  { id: 'bob', label: 'Bob' },
  { id: 'bun', label: 'Moño' },
  { id: 'fro', label: 'Afro' },
  { id: 'froBand', label: 'Afro con Banda' },
  { id: 'sides', label: 'Rapado Lados' },
  { id: 'shavedSides', label: 'Lados Rapados' },
  { id: 'noHair', label: 'Sin Pelo' }
];

const HAIR_COLORS = [
  { id: 'black', label: 'Negro', color: '#2c1810' },
  { id: 'brown', label: 'Castaño', color: '#724133' },
  { id: 'auburn', label: 'Caoba', color: '#a52a2a' },
  { id: 'blonde', label: 'Rubio', color: '#e8c96e' },
  { id: 'blondeGolden', label: 'Rubio Dorado', color: '#ffd700' },
  { id: 'pastelPink', label: 'Rosa Pastel', color: '#ffb6c1' },
  { id: 'red', label: 'Rojo', color: '#c62328' },
  { id: 'platinum', label: 'Platino', color: '#e5e5e5' },
  { id: 'silverGray', label: 'Gris Plata', color: '#c0c0c0' }
];

const FACIAL_HAIR_STYLES = [
  { id: 'none', label: 'Sin Barba' },
  { id: 'beardLight', label: 'Barba Ligera' },
  { id: 'beardMedium', label: 'Barba Media' },
  { id: 'beardMajestic', label: 'Barba Majestuosa' },
  { id: 'moustacheFancy', label: 'Bigote Elegante' },
  { id: 'moustacheMagnum', label: 'Bigote Magnum' }
];

const EYES_STYLES = [
  { id: 'default', label: 'Normal' },
  { id: 'close', label: 'Cerrados' },
  { id: 'cry', label: 'Llorando' },
  { id: 'dizzy', label: 'Mareado' },
  { id: 'eyeRoll', label: 'Rodando' },
  { id: 'happy', label: 'Feliz' },
  { id: 'hearts', label: 'Corazones' },
  { id: 'side', label: 'De Lado' },
  { id: 'squint', label: 'Entrecerrados' },
  { id: 'surprised', label: 'Sorprendido' },
  { id: 'wink', label: 'Guiño' },
  { id: 'winkWacky', label: 'Guiño Loco' }
];

const EYEBROW_STYLES = [
  { id: 'default', label: 'Normal' },
  { id: 'angry', label: 'Enfadado' },
  { id: 'angryNatural', label: 'Enfadado Natural' },
  { id: 'flatNatural', label: 'Plano Natural' },
  { id: 'raisedExcited', label: 'Emocionado' },
  { id: 'raisedExcitedNatural', label: 'Emocionado Natural' },
  { id: 'sadConcerned', label: 'Triste' },
  { id: 'sadConcernedNatural', label: 'Triste Natural' },
  { id: 'unibrowNatural', label: 'Uniceja' },
  { id: 'upDown', label: 'Arriba/Abajo' },
  { id: 'upDownNatural', label: 'Arriba/Abajo Natural' }
];

const MOUTH_STYLES = [
  { id: 'smile', label: 'Sonrisa' },
  { id: 'default', label: 'Normal' },
  { id: 'serious', label: 'Serio' },
  { id: 'concerned', label: 'Preocupado' },
  { id: 'disbelief', label: 'Incrédulo' },
  { id: 'eating', label: 'Comiendo' },
  { id: 'grimace', label: 'Mueca' },
  { id: 'sad', label: 'Triste' },
  { id: 'screamOpen', label: 'Gritando' },
  { id: 'tongue', label: 'Lengua Fuera' },
  { id: 'twinkle', label: 'Pícaro' },
  { id: 'vomit', label: 'Enfermo' }
];

const ACCESSORIES = [
  { id: 'none', label: 'Sin Accesorios' },
  { id: 'kurt', label: 'Gafas Kurt' },
  { id: 'prescription01', label: 'Gafas Graduadas' },
  { id: 'prescription02', label: 'Gafas Cuadradas' },
  { id: 'round', label: 'Gafas Redondas' },
  { id: 'sunglasses', label: 'Gafas de Sol' },
  { id: 'wayfarers', label: 'Wayfarers' }
];

const CLOTHING_STYLES = [
  { id: 'hoodie', label: 'Sudadera' },
  { id: 'blazerAndShirt', label: 'Blazer y Camisa' },
  { id: 'blazerAndSweater', label: 'Blazer y Suéter' },
  { id: 'collarAndSweater', label: 'Cuello y Suéter' },
  { id: 'graphicShirt', label: 'Camiseta Gráfica' },
  { id: 'overall', label: 'Overol' },
  { id: 'shirtCrewNeck', label: 'Camiseta Cuello Redondo' },
  { id: 'shirtScoopNeck', label: 'Camiseta Escote' },
  { id: 'shirtVNeck', label: 'Camiseta Cuello V' }
];

const CLOTHING_COLORS = [
  { id: 'blue01', label: 'Azul', color: '#65c9ff' },
  { id: 'blue02', label: 'Azul Oscuro', color: '#5199e4' },
  { id: 'blue03', label: 'Azul Marino', color: '#25557c' },
  { id: 'gray01', label: 'Gris Claro', color: '#e6e6e6' },
  { id: 'gray02', label: 'Gris', color: '#929598' },
  { id: 'heather', label: 'Jaspeado', color: '#3c4f5c' },
  { id: 'pastelBlue', label: 'Azul Pastel', color: '#b1e2ff' },
  { id: 'pastelGreen', label: 'Verde Pastel', color: '#a7ffc4' },
  { id: 'pastelOrange', label: 'Naranja Pastel', color: '#ffdeb5' },
  { id: 'pastelRed', label: 'Rojo Pastel', color: '#ffafb9' },
  { id: 'pastelYellow', label: 'Amarillo Pastel', color: '#ffffb1' },
  { id: 'pink', label: 'Rosa', color: '#ff488e' },
  { id: 'red', label: 'Rojo', color: '#ff5c5c' },
  { id: 'white', label: 'Blanco', color: '#ffffff' },
  { id: 'black', label: 'Negro', color: '#262e33' }
];

const HAT_STYLES = [
  { id: 'none', label: 'Sin Sombrero' },
  { id: 'hat', label: 'Gorra' },
  { id: 'hijab', label: 'Hijab' },
  { id: 'turban', label: 'Turbante' },
  { id: 'winterHat1', label: 'Gorro de Invierno 1' },
  { id: 'winterHat2', label: 'Gorro de Invierno 2' },
  { id: 'winterHat3', label: 'Gorro de Invierno 3' },
  { id: 'winterHat4', label: 'Gorro de Invierno 4' }
];

const HAT_COLORS = [
  { id: 'blue01', label: 'Azul', color: '#65c9ff' },
  { id: 'blue02', label: 'Azul Oscuro', color: '#5199e4' },
  { id: 'blue03', label: 'Azul Marino', color: '#25557c' },
  { id: 'gray01', label: 'Gris Claro', color: '#e6e6e6' },
  { id: 'gray02', label: 'Gris', color: '#929598' },
  { id: 'red', label: 'Rojo', color: '#ff5c5c' },
  { id: 'pink', label: 'Rosa', color: '#ff488e' },
  { id: 'black', label: 'Negro', color: '#262e33' },
  { id: 'white', label: 'Blanco', color: '#ffffff' }
];

// Función para generar la URL del avatar
const generateAvatarUrl = (config) => {
  if (!config) return 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
  
  // Base URL con seed
  const seed = config.seed || 'default';
  let url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  
  // Skin color mapping (DiceBear usa nombres específicos)
  const skinTones = ['tanned', 'yellow', 'pale', 'light', 'brown', 'darkBrown', 'black'];
  if (config.skinColor && skinTones.includes(config.skinColor)) {
    url += `&skinColor=${config.skinColor}`;
  }
  
  // Top/Hair - DiceBear avataaars v7.x usa 'top' para el pelo
  const topStyles = ['bigHair', 'bob', 'bun', 'curly', 'curvy', 'dreads', 'frida', 'fro', 'froBand', 'frizzle', 'hat', 'hijab', 'longButNotTooLong', 'miaWallace', 'noHair', 'shaggy', 'shaggyMullet', 'shavedSides', 'shortCurly', 'shortFlat', 'shortRound', 'shortWaved', 'sides', 'straight01', 'straight02', 'straightAndStrand', 'theCaesar', 'theCaesarAndSidePart', 'turban', 'winterHat1', 'winterHat2', 'winterHat3', 'winterHat4'];
  if (config.hairStyle && topStyles.includes(config.hairStyle)) {
    url += `&top=${config.hairStyle}`;
  }
  
  // Hair color
  const hairColors = ['auburn', 'black', 'blonde', 'blondeGolden', 'brown', 'brownDark', 'pastelPink', 'platinum', 'red', 'silverGray'];
  if (config.hairColor && hairColors.includes(config.hairColor)) {
    url += `&hairColor=${config.hairColor}`;
  }
  
  // Facial Hair
  const facialHairTypes = ['beardLight', 'beardMajestic', 'beardMedium', 'moustacheFancy', 'moustacheMagnum'];
  if (config.facialHair && config.facialHair !== 'none' && facialHairTypes.includes(config.facialHair)) {
    url += `&facialHair=${config.facialHair}&facialHairProbability=100`;
  } else {
    url += `&facialHairProbability=0`;
  }
  
  // Eyes
  const eyeTypes = ['close', 'cry', 'default', 'dizzy', 'eyeRoll', 'happy', 'hearts', 'side', 'squint', 'surprised', 'wink', 'winkWacky'];
  if (config.eyes && eyeTypes.includes(config.eyes)) {
    url += `&eyes=${config.eyes}`;
  }
  
  // Eyebrows  
  const eyebrowTypes = ['angry', 'angryNatural', 'default', 'defaultNatural', 'flatNatural', 'frownNatural', 'raisedExcited', 'raisedExcitedNatural', 'sadConcerned', 'sadConcernedNatural', 'unibrowNatural', 'upDown', 'upDownNatural'];
  if (config.eyebrows && eyebrowTypes.includes(config.eyebrows)) {
    url += `&eyebrows=${config.eyebrows}`;
  }
  
  // Mouth
  const mouthTypes = ['concerned', 'default', 'disbelief', 'eating', 'grimace', 'sad', 'screamOpen', 'serious', 'smile', 'tongue', 'twinkle', 'vomit'];
  if (config.mouth && mouthTypes.includes(config.mouth)) {
    url += `&mouth=${config.mouth}`;
  }
  
  // Accessories
  const accessoryTypes = ['blank', 'kurt', 'prescription01', 'prescription02', 'round', 'sunglasses', 'wayfarers'];
  if (config.accessories && config.accessories !== 'none' && accessoryTypes.includes(config.accessories)) {
    url += `&accessories=${config.accessories}&accessoriesProbability=100`;
  } else {
    url += `&accessoriesProbability=0`;
  }
  
  // Clothing
  const clothingTypes = ['blazerAndShirt', 'blazerAndSweater', 'collarAndSweater', 'graphicShirt', 'hoodie', 'overall', 'shirtCrewNeck', 'shirtScoopNeck', 'shirtVNeck'];
  if (config.clothing && clothingTypes.includes(config.clothing)) {
    url += `&clothing=${config.clothing}`;
  }
  
  // Clothing color
  const clothingColors = ['black', 'blue01', 'blue02', 'blue03', 'gray01', 'gray02', 'heather', 'pastelBlue', 'pastelGreen', 'pastelOrange', 'pastelRed', 'pastelYellow', 'pink', 'red', 'white'];
  if (config.clothingColor && clothingColors.includes(config.clothingColor)) {
    url += `&clothingColor=${config.clothingColor}`;
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
      if (userId) {
        const savedConfig = await db.getAvatarConfig(userId);
        setConfig({
          ...db.getDefaultAvatarConfig(),
          ...savedConfig,
          seed: username
        });
      }
    };
    if (open) {
      loadConfig();
    }
  }, [open, userId, username]);
  
  const handleChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };
  
  const handleSave = async () => {
    setSaving(true);
    try {
      await db.saveAvatarConfig(userId, config);
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
  
  const handleReset = () => {
    setConfig({
      ...db.getDefaultAvatarConfig(),
      seed: username
    });
  };
  
  if (!config) return null;
  
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
      <DialogContent className="bg-slate-950 border-blue-500/30 text-white max-w-2xl max-h-[90vh] overflow-hidden">
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
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-xs font-bold">
                Preview
              </div>
            </div>
            <p className="mt-4 text-blue-300 text-sm text-center">
              Personaliza tu avatar con diferentes opciones
            </p>
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
                      renderColorSelector(HAIR_COLORS, config.facialHairColor, v => handleChange('facialHairColor', v), 'Color de Barba')
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
                  </>
                )}
                
                {activeTab === 'accessories' && (
                  <>
                    {renderStyleSelector(ACCESSORIES, config.accessories, v => handleChange('accessories', v), 'Gafas/Accesorios')}
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
        <div className="flex justify-between pt-4 border-t border-blue-500/20">
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-blue-500/30 text-blue-300 hover:bg-blue-950/30"
          >
            Restablecer
          </Button>
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
      </DialogContent>
    </Dialog>
  );
};

export { generateAvatarUrl };
export default AvatarEditor;
