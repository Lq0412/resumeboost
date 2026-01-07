// 表单输入组件

// 紧凑输入框
export function CompactInput({ 
  label, 
  value, 
  onChange, 
  placeholder 
}: { 
  label?: string; 
  value: string; 
  onChange: (v: string) => void; 
  placeholder?: string;
}) {
  return (
    <div className="flex-1">
      {label && <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-1.5 text-xs text-gray-200 bg-white/[0.04] border border-white/[0.08] rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400/60 focus:bg-white/[0.06] transition-all placeholder:text-gray-500"
        placeholder={placeholder}
      />
    </div>
  );
}

// 紧凑日期范围选择器
export function CompactDateRange({ 
  startYear, 
  startMonth, 
  endYear, 
  endMonth, 
  onStartChange, 
  onEndChange, 
  showPresent 
}: {
  startYear?: string; 
  startMonth?: string; 
  endYear?: string; 
  endMonth?: string;
  onStartChange: (y: string, m: string) => void;
  onEndChange: (y: string, m: string) => void;
  showPresent?: boolean;
}) {
  const currentYear = new Date().getFullYear();
  const years = [
    ...Array.from({ length: 5 }, (_, i) => String(currentYear + 5 - i)), 
    ...Array.from({ length: 25 }, (_, i) => String(currentYear - i))
  ];
  const months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
  const selectBase = "text-xs text-gray-300 bg-white/[0.04] border border-white/[0.08] rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400/60 transition-all";
  const yearSelectClass = `px-2 py-1.5 ${selectBase} flex-1 min-w-0`;
  const monthSelectClass = `px-2 py-1.5 ${selectBase} w-14 min-w-[56px]`;
  
  return (
    <div className="flex items-center gap-1.5 text-xs flex-wrap">
      <div className="flex gap-1 flex-1 min-w-[120px]">
        <select 
          value={startYear || ''} 
          onChange={(e) => onStartChange(e.target.value, startMonth || '')} 
          className={yearSelectClass}
        >
          <option value="">年</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select 
          value={startMonth || ''} 
          onChange={(e) => onStartChange(startYear || '', e.target.value)} 
          className={monthSelectClass}
        >
          <option value="">月</option>
          {months.map(m => <option key={m} value={m}>{parseInt(m)}</option>)}
        </select>
      </div>
      <span className="text-gray-600 flex-shrink-0">~</span>
      <div className="flex gap-1 flex-1 min-w-[120px]">
        <select 
          value={endYear || ''} 
          onChange={(e) => onEndChange(e.target.value, e.target.value === 'present' ? '' : (endMonth || ''))} 
          className={yearSelectClass}
        >
          <option value="">年</option>
          {showPresent && <option value="present">至今</option>}
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {endYear !== 'present' && (
          <select 
            value={endMonth || ''} 
            onChange={(e) => onEndChange(endYear || '', e.target.value)} 
            className={monthSelectClass}
          >
            <option value="">月</option>
            {months.map(m => <option key={m} value={m}>{parseInt(m)}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}
