/**
 * MadoList 常量定义
 */

// 可见性
const VISIBILITY = {
  PERSONAL: 'PERSONAL',
  GROUP: 'GROUP'
};

const VISIBILITY_LABEL = {
  PERSONAL: '个人可见',
  GROUP: '小组可见'
};

// 优先级
const PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
};

const PRIORITY_LABEL = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高'
};

const PRIORITY_ORDER = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2
};

// 待办状态
const STATUS = {
  TODO: 'TODO',
  DONE: 'DONE'
};

const STATUS_LABEL = {
  TODO: '未完成',
  DONE: '已完成'
};

// 通知类型
const NOTIFICATION_TYPE = {
  REMINDER: 'REMINDER',
  SYSTEM: 'SYSTEM',
  TASK_DUE: 'TASK_DUE',
  TASK_COMPLETED: 'TASK_COMPLETED'
};

const NOTIFICATION_TYPE_LABEL = {
  REMINDER: '组员提醒',
  SYSTEM: '系统提醒',
  TASK_DUE: '任务到期',
  TASK_COMPLETED: '任务完成'
};

// 周期类型
const RECURRING_TYPE = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY'
};

const RECURRING_TYPE_LABEL = {
  DAILY: '每天',
  WEEKLY: '每周',
  MONTHLY: '每月'
};

// 排序方式
const SORT_BY = {
  DUE_TIME: 'dueTime',
  CREATED_AT: 'createdAt',
  PRIORITY: 'priority'
};

const SORT_BY_LABEL = {
  dueTime: '截止时间',
  createdAt: '创建时间',
  priority: '优先级'
};

// 日历视图类型
const CALENDAR_VIEW = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day'
};

// 日历显示模式
const CALENDAR_MODE = {
  PERSONAL: 'personal',
  GROUP: 'group',
  ALL: 'all'
};

// 邀请码字符集（排除 0/O、1/I/L，共 30 个字符）
const INVITE_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 6;

// 防骚扰时间（30分钟，单位毫秒）
const ANTI_SPAM_INTERVAL = 30 * 60 * 1000;

// 分页大小
const PAGE_SIZE = 20;

// 小组最大人数
const GROUP_MAX_SIZE = 10;

module.exports = {
  VISIBILITY,
  VISIBILITY_LABEL,
  PRIORITY,
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  STATUS,
  STATUS_LABEL,
  NOTIFICATION_TYPE,
  NOTIFICATION_TYPE_LABEL,
  RECURRING_TYPE,
  RECURRING_TYPE_LABEL,
  SORT_BY,
  SORT_BY_LABEL,
  CALENDAR_VIEW,
  CALENDAR_MODE,
  INVITE_CODE_CHARS,
  INVITE_CODE_LENGTH,
  ANTI_SPAM_INTERVAL,
  PAGE_SIZE,
  GROUP_MAX_SIZE
};
