import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Layers, 
  Download, 
  Bookmark, 
  Check, 
  Copy, 
  AlertCircle, 
  Clock, 
  Maximize2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Gauge,
  Lock,
  ArrowRight,
  Box,
  Tag,
  Home,
  Sun,
  Palette,
  UploadCloud,
  CheckCircle2
} from 'lucide-react';
import { ApplianceTemplate, GeneratedAsset, ExecutionModel, TemplateVariableMode } from '../types';
import { useKieImageGenerator } from '../hooks/useKieImageGenerator';

interface StudioModalProps {
  template: ApplianceTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onAssetGenerated?: (asset: GeneratedAsset) => void;
  userGenerationLimit?: number;
  userCompletedGenerations?: number;
  userAllowUnlimited?: boolean;
  onOpenGovernance?: () => void;
}

export const StudioModal: React.FC<StudioModalProps> = ({
  template,
  isOpen,
  onClose,
  onAssetGenerated,
  userGenerationLimit = 50,
  userCompletedGenerations = 24,
  userAllowUnlimited = false,
  onOpenGovernance,
}) => {
  // Configurable scene parameters
  const [customAppliance, setCustomAppliance] = useState<string>('four-door smart refrigerator');
  const [customTitle, setCustomTitle] = useState<string>('Smart Inverter Tech - 2026 Edition');
  const [customEnvironment, setCustomEnvironment] = useState<string>('bright modern minimalist Scandinavian kitchen with marble island');
  const [customLighting, setCustomLighting] = useState<string>('soft natural daylight streaming through floor-to-ceiling windows');
  
  const [selectedModel, setSelectedModel] = useState<ExecutionModel>('nano-banana-2');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [savedToLibrary, setSavedToLibrary] = useState<boolean>(false);
  const [attachedRefImage, setAttachedRefImage] = useState<string | null>(null);

  const { generateImage, loading, status, error, cancelPolling, taskId, elapsedSeconds } =
    useKieImageGenerator();

  // Check quota limit status
  const isLimitReached = !userAllowUnlimited && userCompletedGenerations >= userGenerationLimit;
  const remainingGenerations = userAllowUnlimited ? 999999 : Math.max(0, userGenerationLimit - userCompletedGenerations);

  // Derive active variable mode
  const variableMode: TemplateVariableMode = template?.variableMode || 
    (template?.fieldPermissions?.applianceObject && template?.fieldPermissions?.text1 ? 'both_object_and_title' :
     template?.fieldPermissions?.applianceObject ? 'object_only' :
     template?.fieldPermissions?.text1 ? 'title_only' : 'both_object_and_title');

  const canChangeObject = variableMode === 'object_only' || variableMode === 'both_object_and_title' || variableMode === 'full_custom';
  const canChangeTitle = variableMode === 'title_only' || variableMode === 'both_object_and_title' || variableMode === 'full_custom';
  const canChangeEnvironment = variableMode === 'full_custom';
  const canChangeLighting = variableMode === 'full_custom';

  // Appliance quick swap options (e.g. user swapping Refrigerator -> Laundry Machine)
  const quickApplianceSwaps = [
    { label: '🧊 Refrigerator', value: 'four-door smart refrigerator with French glass doors' },
    { label: '🧺 Laundry / Washer', value: 'front-load eco-cotton smart washing machine' },
    { label: '☕ Espresso Barista', value: 'artisan stainless steel commercial espresso machine' },
    { label: '🍳 Convection Oven', value: 'built-in black mirror glass convection wall oven' },
    { label: '🍽️ Dishwasher', value: 'compact ultrasonic countertop dishwasher' },
    { label: '🤖 Robot Vacuum', value: 'autonomous LiDAR smart vacuum robot' },
  ];

  // Quick title presets
  const quickTitleOptions = [
    'Smart Inverter Tech - 2026 Edition',
    'Eco Silent Wash • 1200 RPM • AI Load 64%',
    'Titanium Pure Cold • Freshness 98%',
    'Precision Bake: 350°F • AI Crust Sensor',
    'RadmehrAI Living Zone • Climate 21.5°C'
  ];

  // Reset or populate state when template changes
  useEffect(() => {
    if (template) {
      const defaultObj = template.promptConfig?.applianceObject || template.defaultApplianceObject || 'four-door smart refrigerator';
      const defaultTtl = template.promptConfig?.titleOverlay || template.defaultTitleOverlay || template.defaultVariableValue || 'Smart Inverter Tech - 2026 Edition';
      const defaultEnv = template.promptConfig?.environmentPlace || template.defaultEnvironment || 'bright modern minimalist Scandinavian kitchen with marble island';
      const defaultLight = template.promptConfig?.moodLighting || template.defaultMoodLighting || 'soft natural daylight with architectural reflections';

      setCustomAppliance(defaultObj);
      setCustomTitle(defaultTtl);
      setCustomEnvironment(defaultEnv);
      setCustomLighting(defaultLight);
      setSelectedModel(template.model || 'nano-banana-2');
      setResultImageUrl(null);
      setSavedToLibrary(false);
      setAttachedRefImage(template.referenceImageUrl || null);
    }
  }, [template]);

  if (!isOpen || !template) return null;

  const constructFinalPrompt = (): string => {
    let p = template.basePrompt;
    
    // Replace modular placeholders
    p = p.replace(/\{\{OBJECT\}\}/g, customAppliance);
    p = p.replace(/\{\{TEXT_ZONE\}\}/g, customTitle);
    p = p.replace(/\{\{ENVIRONMENT\}\}/g, customEnvironment);
    p = p.replace(/\{\{PLACE\}\}/g, customEnvironment);
    p = p.replace(/\{\{LIGHTING\}\}/g, customLighting);
    p = p.replace(/\{\{MOOD\}\}/g, customLighting);
    p = p.replace(/\{\{COLOR_FINISH\}\}/g, template.promptConfig?.colorMaterial || template.defaultColorMaterial || 'brushed stainless steel');

    // Handle legacy single-variable templates
    if (p.includes('{{input}}')) {
      p = p.replace(/\{\{input\}\}/g, customTitle);
    } else if (p.includes('{{VARIABLE_NAME}}')) {
      p = p.replace(/\{\{VARIABLE_NAME\}\}/g, customTitle);
    }

    // Fallback if no variable was replaced
    if (!template.basePrompt.includes('{{') && customTitle) {
      p = `${p} Display Title: "${customTitle}"`;
    }

    return p;
  };

  const handleGenerate = async () => {
    if (isLimitReached) return;

    const finalPrompt = constructFinalPrompt();

    const imageUrl = await generateImage({
      prompt: finalPrompt,
      model: selectedModel,
      referenceImageUrl: attachedRefImage || template.referenceImageUrl,
      aspectRatio,
      templateId: template.id,
    });

    if (imageUrl) {
      setResultImageUrl(imageUrl);

      const newAsset: GeneratedAsset = {
        id: `asset_${Date.now()}`,
        templateId: template.id,
        templateName: template.name,
        prompt: finalPrompt,
        model: selectedModel,
        imageUrl,
        aspectRatio,
        creator: {
          name: 'Farhad Abdollahi',
          role: 'Enterprise AI Admin',
          email: 'farhad.abdollahi28@gmail.com',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        },
        createdAt: new Date().toISOString(),
        timeAgo: 'Just now',
        likes: 1,
        bookmarked: true,
        unitsUsed: 24,
      };

      if (onAssetGenerated) {
        onAssetGenerated(newAsset);
      }
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(constructFinalPrompt());
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleDownload = () => {
    if (!resultImageUrl) return;
    const a = document.createElement('a');
    a.href = resultImageUrl;
    a.download = `radmehrai_${template.id}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-soft-lg border border-[#DADCE0] w-full max-w-3xl overflow-hidden my-6 transition-all duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E0E2EC] flex items-center justify-between bg-[#F8F9FD]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1A73E8] flex items-center justify-center border border-blue-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#191c23] flex items-center gap-2">
                Generate Visual ({selectedModel})
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100/80 text-[#1A73E8] font-medium">
                  {template.category}
                </span>
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-[#5F6368]">{template.name}</p>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-[#1A73E8] border border-blue-200/50">
                  {variableMode === 'object_only' ? 'Mode: 1. Object Swappable' : 
                   variableMode === 'title_only' ? 'Mode: 2. Title Only' : 
                   variableMode === 'both_object_and_title' ? 'Mode: 3. Both Object & Title' :
                   variableMode === 'full_custom' ? 'Mode: 4. Full Custom' : 'Mode: 5. Fixed Preset'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Quota Status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#DADCE0] text-xs font-medium">
              <Gauge className="w-3.5 h-3.5 text-[#1A73E8]" />
              <span className="text-[#5F6368]">Limit:</span>
              <span className={`font-mono font-bold ${isLimitReached ? 'text-red-600' : 'text-[#191c23]'}`}>
                {userAllowUnlimited ? 'Unlimited' : `${userCompletedGenerations} / ${userGenerationLimit}`}
              </span>
            </div>

            <button
              onClick={() => {
                cancelPolling();
                onClose();
              }}
              className="p-1.5 rounded-full text-[#727785] hover:bg-[#E0E2EC] transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Quota Exhaustion Alert */}
          {isLimitReached && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-red-900">
                    AI Generation Limit Reached ({userCompletedGenerations} / {userGenerationLimit})
                  </h4>
                  <p className="text-xs text-red-700 mt-0.5">
                    You have reached your allocated maximum of {userGenerationLimit} completed AI image generations.
                  </p>
                </div>
              </div>

              {onOpenGovernance && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenGovernance();
                  }}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors shadow-2xs cursor-pointer"
                >
                  <span>Manage in Governance</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Model & Aspect Ratio Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#414754] uppercase tracking-wider mb-1.5">
                Execution Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ExecutionModel)}
                disabled={loading || isLimitReached}
                className="w-full px-3.5 py-2.5 bg-[#F1F4F9] border border-[#DADCE0] rounded-xl text-sm font-medium text-[#191c23] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:bg-white transition-all cursor-pointer disabled:opacity-50"
              >
                <option value="nano-banana-2">nano-banana-2 (Gemini Flash Image)</option>
                <option value="sedance-2.5-pro">sedance-2.5-pro (High Res Appliance)</option>
                <option value="SDXL">SDXL 1.0 (Commercial Industrial)</option>
                <option value="Midjourney v6">Midjourney v6 (Photorealistic Studio)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#414754] uppercase tracking-wider mb-1.5">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['16:9', '1:1', '4:3'].map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    disabled={loading || isLimitReached}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      aspectRatio === ratio
                        ? 'bg-[#E8F0FE] border-[#1A73E8] text-[#1A73E8]'
                        : 'bg-[#F1F4F9] border-[#DADCE0] text-[#5F6368] hover:bg-white'
                    } disabled:opacity-50`}
                  >
                    {ratio} {ratio === '16:9' ? '(Landscape)' : ratio === '1:1' ? '(Square)' : '(Standard)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* DYNAMIC VARIABLE SECTION: APPLIANCE / REFERENCE OBJECT */}
          <div className={`p-4 rounded-2xl border transition-all ${
            canChangeObject 
              ? 'bg-white border-[#1A73E8]/40 shadow-xs' 
              : 'bg-[#F8F9FD] border-[#E0E2EC]'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#191c23] flex items-center gap-2">
                <Box className={`w-4 h-4 ${canChangeObject ? 'text-[#1A73E8]' : 'text-gray-500'}`} />
                Reference Appliance Object
                <code className="text-[11px] font-mono text-[#1A73E8] bg-blue-50 px-1.5 py-0.5 rounded">{`{{OBJECT}}`}</code>
              </label>
              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                canChangeObject 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {canChangeObject ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <Lock className="w-3 h-3 text-gray-500" />}
                {canChangeObject ? 'Editable in this Template' : '🔒 Fixed by Template (Locked)'}
              </span>
            </div>

            {canChangeObject ? (
              <div className="space-y-2.5">
                <input
                  type="text"
                  value={customAppliance}
                  onChange={(e) => setCustomAppliance(e.target.value)}
                  placeholder="e.g. four-door smart refrigerator, washing machine, espresso maker..."
                  disabled={loading || isLimitReached}
                  className="w-full px-3.5 py-2.5 bg-[#F1F4F9] border border-[#DADCE0] rounded-xl text-sm font-medium text-[#191c23] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:bg-white transition-all shadow-inner disabled:opacity-50"
                />
                
                {/* Quick Appliance Swaps */}
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-[#5F6368]">Quick Appliance Swaps:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {quickApplianceSwaps.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setCustomAppliance(item.value)}
                        disabled={loading || isLimitReached}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          customAppliance === item.value
                            ? 'bg-[#1A73E8] text-white border-[#1A73E8] shadow-2xs font-semibold'
                            : 'bg-white text-[#414754] border-[#DADCE0] hover:border-[#1A73E8] hover:bg-blue-50/50'
                        } disabled:opacity-50`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white rounded-xl border border-[#DADCE0] flex items-center justify-between text-xs">
                <span className="font-mono text-[#191c23] font-medium">{customAppliance}</span>
                <span className="text-[11px] text-[#727785] italic">Appliance object is locked by creator</span>
              </div>
            )}
          </div>

          {/* DYNAMIC VARIABLE SECTION: TITLE / TEXT OVERLAY */}
          <div className={`p-4 rounded-2xl border transition-all ${
            canChangeTitle 
              ? 'bg-white border-purple-300 shadow-xs' 
              : 'bg-[#F8F9FD] border-[#E0E2EC]'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#191c23] flex items-center gap-2">
                <Tag className={`w-4 h-4 ${canChangeTitle ? 'text-purple-600' : 'text-gray-500'}`} />
                Title / Text Overlay in Image
                <code className="text-[11px] font-mono text-[#1A73E8] bg-blue-50 px-1.5 py-0.5 rounded">{`{{TEXT_ZONE}}`}</code>
              </label>
              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                canChangeTitle 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {canChangeTitle ? <CheckCircle2 className="w-3 h-3 text-purple-600" /> : <Lock className="w-3 h-3 text-gray-500" />}
                {canChangeTitle ? 'Editable in this Template' : '🔒 Fixed by Template (Locked)'}
              </span>
            </div>

            {canChangeTitle ? (
              <div className="space-y-2.5">
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Smart Inverter Tech - 2026 Edition"
                  disabled={loading || isLimitReached}
                  className="w-full px-3.5 py-2.5 bg-[#F1F4F9] border border-[#DADCE0] rounded-xl text-sm font-medium text-[#191c23] focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all shadow-inner disabled:opacity-50"
                />

                {/* Quick Title Presets */}
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-[#5F6368]">Suggested Titles:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {quickTitleOptions.map((title) => (
                      <button
                        key={title}
                        type="button"
                        onClick={() => setCustomTitle(title)}
                        disabled={loading || isLimitReached}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          customTitle === title
                            ? 'bg-purple-700 text-white border-purple-700 shadow-2xs font-semibold'
                            : 'bg-white text-[#414754] border-[#DADCE0] hover:border-purple-600 hover:bg-purple-50/50'
                        } disabled:opacity-50`}
                      >
                        {title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white rounded-xl border border-[#DADCE0] flex items-center justify-between text-xs">
                <span className="font-mono text-[#191c23] font-medium">{customTitle}</span>
                <span className="text-[11px] text-[#727785] italic">Title text is locked by creator</span>
              </div>
            )}
          </div>

          {/* LOCKED / FULL-CUSTOM: ENVIRONMENT & MOOD LIGHTING */}
          <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-[#E0E2EC] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#414754] uppercase tracking-wider flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-blue-600" />
                Environment & Lighting Scene Anchors
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 flex items-center gap-1">
                <Lock className="w-3 h-3 text-gray-500" />
                {canChangeEnvironment ? 'Customizable' : 'Fixed by Template'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-[#DADCE0]">
                <span className="text-[10px] font-bold text-[#5F6368] uppercase flex items-center gap-1 mb-1">
                  <Home className="w-3 h-3 text-blue-500" /> Place Setting
                </span>
                <p className="font-mono text-[#191c23] leading-relaxed">
                  {customEnvironment}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#DADCE0]">
                <span className="text-[10px] font-bold text-[#5F6368] uppercase flex items-center gap-1 mb-1">
                  <Sun className="w-3 h-3 text-amber-500" /> Mood & Lighting
                </span>
                <p className="font-mono text-[#191c23] leading-relaxed">
                  {customLighting}
                </p>
              </div>
            </div>
          </div>

          {/* Prompt Preview Accordion */}
          <div className="bg-[#F8F9FD] border border-[#E0E2EC] rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#5F6368] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#1A73E8]" />
                Compiled Prompt Payload (Dynamic Engine)
              </span>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="text-xs text-[#1A73E8] hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                {copiedPrompt ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                {copiedPrompt ? 'Copied' : 'Copy Prompt'}
              </button>
            </div>
            <p className="text-xs text-[#414754] font-mono leading-relaxed line-clamp-3 bg-white p-2.5 rounded-lg border border-[#E0E2EC]/70">
              {constructFinalPrompt()}
            </p>
          </div>

          {/* Generation Action Button & Polling Indicator */}
          <div>
            <button
              id="studio-modal-generate-btn"
              onClick={handleGenerate}
              disabled={loading || isLimitReached}
              className={`w-full font-medium py-3 px-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm text-sm cursor-pointer ${
                isLimitReached
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#1A73E8] hover:bg-[#1557B0] active:scale-[0.99] text-white disabled:opacity-50'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>
                    Generating Visual... ({status || 'PROCESSING'}) • Polling every 5s ({elapsedSeconds}s)
                  </span>
                </>
              ) : isLimitReached ? (
                <>
                  <Lock className="w-4 h-4 text-gray-500" />
                  <span>Generation Limit Exhausted ({userCompletedGenerations}/{userGenerationLimit})</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Create Visual ({remainingGenerations} Remaining in Quota)</span>
                </>
              )}
            </button>

            {loading && (
              <div className="mt-3 flex items-center justify-between text-xs text-[#5F6368] bg-[#E8F0FE]/60 px-4 py-2.5 rounded-xl border border-blue-100 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#1A73E8] animate-ping" />
                  <span>Task ID: <span className="font-mono">{taskId || 'Establishing connection...'}</span></span>
                </div>
                <button
                  type="button"
                  onClick={cancelPolling}
                  className="text-[#ba1a1a] hover:underline font-medium cursor-pointer"
                >
                  Cancel Polling
                </button>
              </div>
            )}

            {error && (
              <div className="mt-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-[#ba1a1a] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Generated Visual Result Display */}
          {resultImageUrl && (
            <div className="mt-4 pt-4 border-t border-[#E0E2EC] space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#191c23] flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-600" />
                  Visual Generated Successfully (Quota: {userCompletedGenerations + 1}/{userGenerationLimit})
                </span>
                <span className="text-xs text-[#5F6368] flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Ready in {elapsedSeconds || 5}s
                </span>
              </div>

              {/* Image Container */}
              <div className="relative rounded-2xl overflow-hidden border border-[#DADCE0] bg-black group shadow-sm aspect-video flex items-center justify-center">
                <img
                  src={resultImageUrl}
                  alt="Generated Appliance"
                  className="w-full h-full object-cover"
                />

                {/* Model tag watermark */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-mono font-medium">
                  {selectedModel}
                </div>

                {/* Quick actions overlay */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    className="p-2 bg-white/90 hover:bg-white text-[#191c23] rounded-full shadow-md backdrop-blur-sm transition-all cursor-pointer"
                    title="Download PNG"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSavedToLibrary(true)}
                    className="p-2 bg-white/90 hover:bg-white text-[#1A73E8] rounded-full shadow-md backdrop-blur-sm transition-all cursor-pointer"
                    title="Saved to Library"
                  >
                    {savedToLibrary ? <Check className="w-4 h-4 text-green-600" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleDownload}
                  className="flex-1 bg-[#191c23] hover:bg-[#2d3038] text-white py-2.5 px-4 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download High-Res Asset
                </button>
                <button
                  onClick={() => {
                    setResultImageUrl(null);
                    handleGenerate();
                  }}
                  disabled={isLimitReached}
                  className="px-4 py-2.5 bg-[#F1F4F9] hover:bg-[#E0E2EC] text-[#414754] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-Roll Visual
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#F8F9FD] border-t border-[#E0E2EC] flex items-center justify-between text-xs text-[#727785]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Kie.ai Protocol & Google GenAI Certified Engine</span>
          </div>
          <span>Quota: {userCompletedGenerations} / {userGenerationLimit} Images</span>
        </div>
      </div>
    </div>
  );
};
