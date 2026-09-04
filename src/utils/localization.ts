const ROLE_LABELS: Record<string, string> = {
  Admin: 'مدیر سامانه',
  SUPER_ADMIN: 'مدیر ارشد سامانه',
  Supervisor: 'سرپرست',
  Manager: 'مدیر',
  Editor: 'ویرایشگر',
  Creator: 'سازنده',
  Viewer: 'مشاهده‌گر',
  'Enterprise AI Admin': 'مدیر هوش مصنوعی سازمانی',
  'Lead Orchestrator': 'راهبر ارشد',
  'Data Scientist': 'دانشمند داده',
  USER: 'کاربر',
};

const STATUS_LABELS: Record<string, string> = {
  Active: 'فعال',
  Invited: 'دعوت‌شده',
  Suspended: 'تعلیق‌شده',
  Operational: 'عملیاتی',
  Connected: 'متصل',
  INITIATING: 'در حال آغاز',
  PROCESSING: 'در حال پردازش',
  PENDING: 'در انتظار',
  COMPLETED: 'تکمیل‌شده',
  SUCCESS: 'موفق',
  FAILED: 'ناموفق',
};

const CATEGORY_LABELS: Record<string, string> = {
  All: 'همه',
  'Smart Kitchen': 'آشپزخانه هوشمند',
  'Climate Control': 'کنترل تهویه',
  'Home Automation': 'اتوماسیون خانه',
  'Laundry AI': 'شست‌وشوی هوشمند',
  'Kitchen Luxury': 'آشپزخانه لوکس',
  'Commercial Tech': 'فناوری تجاری',
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  'User Authenticated': 'ورود کاربر',
  'Generated Image': 'تولید تصویر',
  'Template Deleted': 'حذف قالب',
  'Template Modified': 'ویرایش قالب',
  'Template Created': 'ایجاد قالب',
  'Template Saved': 'ذخیره قالب',
  'Limit Modified': 'تغییر سقف مصرف',
  'Quota Reset': 'بازنشانی سهمیه',
  'Role Modified': 'تغییر نقش',
  'Role Changed': 'تغییر نقش',
  'User Deleted': 'حذف کاربر',
};

const localizeAuditDetailsText = (value: string) => value
  .replace("Session verified for ", "نشست تأیید شد برای ")
  .replace(". Insured SOC-2 session active.", ". نشست امن SOC-2 فعال است.")
  .replace("Deleted template ", "قالب حذف شد: ")
  .replace("Updated template ", "قالب به‌روزرسانی شد: ")
  .replace("Created new template ", "قالب جدید ایجاد شد: ")
  .replace("Prompt: ", "پرامپت: ")
  .replace(" Model: ", " مدل: ")
  .replace("Quota:", "سهمیه:")
  .replace("Updated AI generation limit for ", "سقف تولید تصویر به‌روزرسانی شد برای ")
  .replace("Reset completed image generations count to 0 for ", "شمارنده تولید تصویر به صفر بازنشانی شد برای ")
  .replace("Set workspace default AI image generation limit to ", "سهمیه پیش‌فرض فضای کاری تنظیم شد روی ")
  .replace("Batch reset completed generations count to 0 for all ", "شمارنده تولید برای همه اعضای فعال بازنشانی شد؛ تعداد: ")
  .replace("Invited user ", "کاربر دعوت شد: ")
  .replace("Modified role for ", "نقش تغییر کرد برای ")
  .replace("Removed user ", "کاربر از فضای کاری حذف شد: ");

export const localizeRole = (value: string) => ROLE_LABELS[value] ?? value;
export const localizeStatus = (value: string) => STATUS_LABELS[value] ?? value;
export const localizeCategory = (value: string) => CATEGORY_LABELS[value] ?? value;
export const localizeAuditAction = (value: string) => AUDIT_ACTION_LABELS[value] ?? value;
export const localizeAuditDetails = localizeAuditDetailsText;
export const formatFaNumber = (value: number | string) => new Intl.NumberFormat('fa-IR').format(Number(value));
export const formatFaDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};
export const localizeRelativeTime = (value: string) => {
  if (value === 'Just now') return 'همین حالا';
  return value
    .replace(/minutes? ago/i, 'دقیقه پیش')
    .replace(/hours? ago/i, 'ساعت پیش')
    .replace(/days? ago/i, 'روز پیش');
};
