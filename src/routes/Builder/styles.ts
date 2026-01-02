// 样式常量和工具类

// 按钮样式
export const buttonStyles = {
  primary: 'px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm',
  secondary: 'px-2 py-1 text-xs text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors shadow-sm',
  ghost: 'px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-md transition-colors',
  danger: 'text-xs text-red-500 hover:text-red-700 transition-colors',
  link: 'text-xs text-blue-600 hover:text-blue-800 transition-colors',
};

// 输入框样式
export const inputStyles = {
  base: 'w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
  textarea: 'w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
  select: 'px-2 py-1 text-xs border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
};

// 卡片样式
export const cardStyles = {
  base: 'p-3 bg-white rounded-lg border border-gray-200 shadow-sm',
  hover: 'p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow',
  form: 'p-2.5 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors',
};

// Tab 样式
export const tabStyles = {
  active: 'flex-1 px-2 py-2 text-xs font-medium transition-all bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm',
  inactive: 'flex-1 px-2 py-2 text-xs font-medium transition-all text-gray-600 hover:text-gray-900 hover:bg-gray-100',
};

// 拖拽条样式
export const dragHandleStyles = 'w-1 bg-gray-300 hover:bg-blue-500 active:bg-blue-600 cursor-col-resize flex-shrink-0 transition-colors';

// 空状态样式
export const emptyStateStyles = 'text-xs text-gray-400 py-6 text-center';

// 标签样式
export const labelStyles = 'block text-xs font-medium text-gray-700 mb-1';

// 分隔线样式
export const dividerStyles = 'border-t border-gray-200 my-3';
