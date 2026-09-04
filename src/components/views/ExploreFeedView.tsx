import React, { useState } from 'react';
import { 
  Search, 
  Download, 
  Bookmark, 
  LayoutGrid, 
  List, 
  MoreVertical, 
  ArrowUpRight, 
  Filter, 
  Heart, 
  Cpu, 
  Check, 
  Sparkles,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { GeneratedAsset } from '../../types';
import { localizeRelativeTime, localizeRole } from '../../utils/localization';

interface ExploreFeedViewProps {
  assets: GeneratedAsset[];
  onSelectTemplateById?: (templateId: string) => void;
  onBookmarkToggle?: (assetId: string) => void;
}

export const ExploreFeedView: React.FC<ExploreFeedViewProps> = ({
  assets,
  onSelectTemplateById,
  onBookmarkToggle,
}) => {
  const [roleFilter, setRoleFilter] = useState<string>('All Roles');
  const [modelFilter, setModelFilter] = useState<string>('All Models');
  const [dateFilter, setDateFilter] = useState<string>('Last 7 Days');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>('grid');
  const [selectedAssetForModal, setSelectedAssetForModal] = useState<GeneratedAsset | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filteredAssets = assets.filter((asset) => {
    const matchesRole = roleFilter === 'All Roles' || asset.creator.role === roleFilter;
    const matchesModel = modelFilter === 'All Models' || asset.model === modelFilter;
    const matchesSearch =
      asset.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.templateName && asset.templateName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesModel && matchesSearch;
  });

  const handleDownloadImage = (url: string, id: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `radmehrai_asset_${id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in pb-28 md:pb-10">
      
      {/* Header & Controls matching Screenshot 1 & 6 */}
      <div className="flex flex-col gap-4 border-b border-[#E0E2EC] pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#191c23]">
              کاوش تصاویر تولیدشده
            </h2>
            <p className="text-sm text-[#5F6368] mt-1 hidden sm:block">
              تصاویر تولیدشده با مدل‌ها، تیم‌ها و گروه‌های مختلف محصول را مرور کنید.
            </p>
          </div>

          {/* View Toggles (Grid / List-Feed) matching Screenshot 1 */}
          <div className="flex items-center gap-1 bg-white border border-[#DADCE0] p-1 rounded-xl shadow-xs">
            <button
              onClick={() => setViewMode('feed')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'feed' ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'text-[#727785] hover:text-[#191c23]'
              }`}
              title="نمای فهرستی"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'text-[#727785] hover:text-[#191c23]'
              }`}
              title="نمای شبکه‌ای"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile filter disclosure keeps controls comfortable at narrow widths. */}
        <button onClick={() => setMobileFiltersOpen((open) => !open)} aria-expanded={mobileFiltersOpen} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 sm:hidden"><Filter className="h-4 w-4" />{mobileFiltersOpen ? "بستن فیلترها" : "فیلترها"}</button>
        <div className={(mobileFiltersOpen ? "flex" : "hidden") + " flex-col items-stretch justify-between gap-3 pt-1 sm:flex lg:flex-row lg:items-center"}>
          <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
            
            {/* Filter 1: Creator Role */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#5F6368] font-medium hidden sm:inline">نقش سازنده</span>
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="appearance-none ps-3 pe-8 py-1.5 bg-white border border-[#DADCE0] rounded-lg text-xs font-medium text-[#191c23] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] cursor-pointer shadow-xs"
                >
                  <option value="All Roles">همه نقش‌ها</option>
                  <option value="Enterprise AI Admin">مدیر هوش مصنوعی سازمانی</option>
                  <option value="Supervisor">سرپرست</option>
                  <option value="Lead Orchestrator">راهبر ارشد</option>
                  <option value="Data Scientist">دانشمند داده</option>
                  <option value="Manager">مدیر</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#727785] absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Filter 2: Model Version */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#5F6368] font-medium hidden sm:inline">نسخه مدل</span>
              <div className="relative">
                <select
                  value={modelFilter}
                  onChange={(e) => setModelFilter(e.target.value)}
                  className="appearance-none ps-3 pe-8 py-1.5 bg-white border border-[#DADCE0] rounded-lg text-xs font-medium text-[#191c23] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] cursor-pointer shadow-xs"
                >
                  <option value="All Models">همه مدل‌ها</option>
                  <option value="nano-banana-2">nano-banana-2</option>
                  <option value="sedance-2.5-pro">sedance-2.5-pro</option>
                  <option value="SDXL">SDXL</option>
                  <option value="Midjourney v6">Midjourney v6</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#727785] absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Filter 3: Date Range */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#5F6368] font-medium hidden sm:inline">بازه زمانی</span>
              <div className="relative">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="appearance-none ps-3 pe-8 py-1.5 bg-white border border-[#DADCE0] rounded-lg text-xs font-medium text-[#191c23] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] cursor-pointer shadow-xs"
                >
                  <option value="Last 7 Days">۷ روز گذشته</option>
                  <option value="Last 24 Hours">۲۴ ساعت گذشته</option>
                  <option value="Last 30 Days">۳۰ روز گذشته</option>
                  <option value="All Time">همه زمان‌ها</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#727785] absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Search Box matching Screenshot 1 & 6 */}
          <div className="relative w-full lg:w-auto lg:min-w-[280px]">
            <Search className="w-4 h-4 text-[#727785] absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="جست‌وجوی پرامپت‌ها…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-9 pe-3.5 py-1.5 bg-white border border-[#DADCE0] rounded-lg text-xs text-[#191c23] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] shadow-xs"
            />
          </div>
        </div>
      </div>

      {filteredAssets.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <Search className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-3 text-base font-semibold text-slate-900">تصویری با این فیلترها پیدا نشد</h3>
          <p className="mt-1 text-sm text-slate-500">فیلترها را پاک یا تغییر دهید تا تصاویر تولیدشده نمایش داده شوند.</p>
        </div>
      )}

      {/* Grid Mode matching Screenshot 1 & 6 */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              id={`asset-card-${asset.id}`}
              className="bg-white rounded-2xl border border-[#DADCE0] overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-200 flex flex-col group"
            >
              {/* Asset Image Box */}
              <div 
                className="relative aspect-[4/3] bg-slate-950 overflow-hidden cursor-pointer"
                onClick={() => setSelectedAssetForModal(asset)}
              >
                <img
                  src={asset.imageUrl}
                  alt={asset.prompt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Model Pill Badge */}
                <div className="absolute top-3 end-3 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[#191c23] text-[11px] font-mono font-medium shadow-xs">
                  {asset.model}
                </div>
              </div>

              {/* Action Bar matching Screenshot 1 & 6 */}
              <div className="p-3 bg-white border-t border-[#F0F2F8] flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    if (asset.templateId && onSelectTemplateById) {
                      onSelectTemplateById(asset.templateId);
                    } else {
                      setSelectedAssetForModal(asset);
                    }
                  }}
                  className="text-xs font-semibold text-[#1A73E8] hover:text-[#1557B0] transition-colors flex items-center gap-1 cursor-pointer truncate"
                >
                  <span>مشاهده قالب اصلی</span>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleDownloadImage(asset.imageUrl, asset.id)}
                    className="p-1.5 text-[#5F6368] hover:text-[#191c23] hover:bg-[#F1F4F9] rounded-lg transition-colors cursor-pointer"
                    title="دانلود تصویر"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onBookmarkToggle && onBookmarkToggle(asset.id)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      asset.bookmarked ? 'text-[#1A73E8] bg-blue-50' : 'text-[#5F6368] hover:text-[#191c23] hover:bg-[#F1F4F9]'
                    }`}
                    title={asset.bookmarked ? 'ذخیره‌شده' : 'ذخیره'}
                  >
                    <Bookmark className="w-4 h-4" fill={asset.bookmarked ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feed Mode matching Screenshot 5 (Mobile/Social Card view) */}
      {viewMode === 'feed' && (
        <div className="max-w-xl mx-auto space-y-6">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white rounded-2xl border border-[#DADCE0] overflow-hidden shadow-soft space-y-3 p-4"
            >
              {/* Creator Header matching Screenshot 5 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {asset.creator.avatar ? (
                    <img
                      src={asset.creator.avatar}
                      alt={asset.creator.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#DADCE0]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1A73E8] font-bold text-sm flex items-center justify-center">
                      {asset.creator.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-semibold text-[#191c23] leading-none">
                      {asset.creator.name}
                    </h4>
                    <p className="text-xs text-[#5F6368] mt-1">
                      {localizeRelativeTime(asset.timeAgo)} • <span className="font-medium text-[#1A73E8]">{localizeRole(asset.creator.role)}</span>
                    </p>
                  </div>
                </div>

                <button className="text-[#727785] hover:text-[#191c23] p-1.5 rounded-lg">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Asset Image matching Screenshot 5 */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black">
                <img
                  src={asset.imageUrl}
                  alt={asset.prompt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 start-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[#191c23] text-xs font-mono font-medium shadow-xs">
                  {asset.model}
                </div>
              </div>

              {/* Prompt Text */}
              <p className="text-xs text-[#414754] line-clamp-2 italic px-1 font-mono">
                "{asset.prompt}"
              </p>

              {/* Two Action Buttons matching Screenshot 5 */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => handleDownloadImage(asset.imageUrl, asset.id)}
                  className="w-full bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold py-2.5 px-4 rounded-full flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود</span>
                </button>
                <button
                  onClick={() => onBookmarkToggle && onBookmarkToggle(asset.id)}
                  className="w-full bg-white border border-[#DADCE0] hover:bg-[#F1F4F9] text-[#414754] text-xs font-semibold py-2.5 px-4 rounded-full flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Bookmark className="w-4 h-4" fill={asset.bookmarked ? '#1A73E8' : 'none'} />
                  <span>{asset.bookmarked ? 'ذخیره‌شده' : 'ذخیره'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Asset Inspection Modal */}
      {selectedAssetForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-soft-lg border border-[#DADCE0] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#191c23]">
                  {selectedAssetForModal.templateName || 'پیش‌نمایش تصویر تولیدشده'}
                </h3>
                <p className="text-xs text-[#5F6368]">
                  ساخته‌شده توسط {selectedAssetForModal.creator.name} ({localizeRole(selectedAssetForModal.creator.role)})
                </p>
              </div>
              <button
                onClick={() => setSelectedAssetForModal(null)}
                className="text-[#727785] hover:text-[#191c23] p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl overflow-hidden aspect-video bg-black">
              <img
                src={selectedAssetForModal.imageUrl}
                alt="Enlarged Visual"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="bg-[#F8F9FD] p-3 rounded-xl border border-[#E0E2EC] text-xs font-mono text-[#414754]">
              {selectedAssetForModal.prompt}
            </div>

            <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-[#5F6368]">مدل: <strong dir="ltr" className="font-mono text-[#191c23]">{selectedAssetForModal.model}</strong></span>
              <button
                onClick={() => handleDownloadImage(selectedAssetForModal.imageUrl, selectedAssetForModal.id)}
                className="px-5 py-2 rounded-full bg-[#1A73E8] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> دانلود با کیفیت اصلی
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
