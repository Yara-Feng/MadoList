/**
 * 日期工具函数
 */

/**
 * 格式化日期为 yyyy-MM-dd
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化日期时间为 yyyy-MM-dd HH:mm
 */
function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const dateStr = formatDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
}

/**
 * 格式化相对时间（如"刚刚"、"3分钟前"、"2小时前"）
 */
function formatRelativeTime(date) {
  if (!date) return '';
  const now = Date.now();
  const diff = now - new Date(date).getTime();

  if (diff < 60 * 1000) return '刚刚';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分钟前`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;

  return formatDate(date);
}

/**
 * 获取指定月份的天数
 */
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * 获取指定日期是星期几（0=周日）
 */
function getDayOfWeek(date) {
  return new Date(date).getDay();
}

/**
 * 获取今天日期字符串 yyyy-MM-dd
 */
function getToday() {
  return formatDate(new Date());
}

/**
 * 判断是否为今天
 */
function isToday(date) {
  return formatDate(date) === formatDate(new Date());
}

/**
 * 判断是否过期
 */
function isOverdue(dueTime) {
  if (!dueTime) return false;
  return new Date(dueTime).getTime() < Date.now();
}

/**
 * 获取月初日期
 */
function getMonthStart(year, month) {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

/**
 * 获取月末日期
 */
function getMonthEnd(year, month) {
  const days = getDaysInMonth(year, month);
  return `${year}-${String(month).padStart(2, '0')}-${String(days).padStart(2, '0')}`;
}

module.exports = {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  getDaysInMonth,
  getDayOfWeek,
  getToday,
  isToday,
  isOverdue,
  getMonthStart,
  getMonthEnd
};
