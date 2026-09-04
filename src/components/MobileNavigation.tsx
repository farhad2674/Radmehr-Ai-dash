import React, { useEffect, useRef, useState } from 'react';
import { Compass, HelpCircle, LayoutGrid, LogOut, MoreHorizontal, User, Users, Wrench, X } from 'lucide-react';

interface MobileNavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  isAdmin: boolean;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ currentView, onNavigate, onLogout, isAdmin }) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const tabs = [
    { id: 'workspace', label: 'فضای کار', icon: LayoutGrid },
    { id: 'builder', label: 'قالب‌ساز', icon: Wrench },
    { id: 'explore', label: 'کاوش', icon: Compass },
    { id: 'profile', label: 'پروفایل', icon: User },
  ];

  useEffect(() => {
    if (!isMoreOpen) return;

    const dialog = dialogRef.current;
    const moreButton = moreButtonRef.current;
    const focusableElements = () =>
      Array.from(dialog?.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])") ?? [])
        .filter((element) => !element.hasAttribute("disabled"));
    const frame = requestAnimationFrame(() => focusableElements()[0]?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsMoreOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const elements = focusableElements();
      if (elements.length === 0) {
        event.preventDefault();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      moreButton?.focus();
    };
  }, [isMoreOpen]);

  const navigate = (view: string) => {
    setIsMoreOpen(false);
    onNavigate(view);
  };

  return (
    <>
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-950/30" onClick={() => setIsMoreOpen(false)}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="گزینه‌های بیشتر" className="absolute inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-sm font-semibold text-slate-900">بیشتر</p>
              <button className="touch-target icon-button" onClick={() => setIsMoreOpen(false)} aria-label="بستن منوی بیشتر"><X className="h-5 w-5" /></button>
            </div>
            {isAdmin && <button className="mobile-menu-item" onClick={() => navigate('governance')}><Users className="h-5 w-5 text-[#1A73E8]" /><span>تیم و راهبری</span></button>}
            <button className="mobile-menu-item" onClick={() => { setIsMoreOpen(false); window.alert('راهنما و مستندات استودیو RadmehrAI\n\nقالب‌های قابل استفاده مجدد بسازید، تصاویر محصول تولید کنید و دارایی‌های تأییدشده را مدیریت کنید.'); }}><HelpCircle className="h-5 w-5 text-slate-500" /><span>راهنما و مستندات</span></button>
            <button className="mobile-menu-item text-red-700" onClick={() => { setIsMoreOpen(false); onLogout(); }}><LogOut className="h-5 w-5" /><span>خروج</span></button>
          </div>
        </div>
      )}
      <nav aria-label="پیمایش اصلی موبایل" className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-1 pt-1.5 pb-[max(.4rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id;
            return <button key={tab.id} id={`mobile-tab-${tab.id}`} onClick={() => navigate(tab.id)} aria-current={isActive ? 'page' : undefined} className={`min-h-14 rounded-xl px-1 text-[10px] font-medium transition-colors ${isActive ? 'bg-blue-50 text-[#1A73E8]' : 'text-slate-500 active:bg-slate-100'}`}><Icon className="mx-auto mb-0.5 h-5 w-5" strokeWidth={isActive ? 2.4 : 2} /><span>{tab.label}</span></button>;
          })}
          <button ref={moreButtonRef} onClick={() => setIsMoreOpen((open) => !open)} aria-expanded={isMoreOpen} aria-haspopup="dialog" className={`min-h-14 rounded-xl px-1 text-[10px] font-medium transition-colors ${currentView === 'governance' || isMoreOpen ? 'bg-blue-50 text-[#1A73E8]' : 'text-slate-500 active:bg-slate-100'}`}><MoreHorizontal className="mx-auto mb-0.5 h-5 w-5" /><span>بیشتر</span></button>
        </div>
      </nav>
    </>
  );
};
