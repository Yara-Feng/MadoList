const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

const ANTI_SPAM_INTERVAL = 30 * 60 * 1000; // 30分钟

/**
 * 提醒管理云函数
 * action: 'create' — 创建提醒（含防骚扰检查）
 */
exports.main = async (event, context) => {
  const { action, data } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  switch (action) {
    case 'create':
      return await createReminder(openid, data);
    default:
      return { success: false, errMsg: '未知操作' };
  }
};

/**
 * 创建提醒
 */
async function createReminder(senderOpenId, data) {
  try {
    const { taskId, receiverOpenId } = data || {};

    if (!taskId || !receiverOpenId) {
      return { success: false, errMsg: '参数不完整' };
    }

    // 验证任务是否存在且为共享任务
    const { data: tasks } = await db.collection('tasks')
      .where({ _id: taskId, isDeleted: false, visibility: 'GROUP' })
      .get();

    if (tasks.length === 0) {
      return { success: false, errMsg: '任务不存在或不是共享任务' };
    }

    const task = tasks[0];

    // 验证发送者和接收者在同一小组
    const { data: senderUsers } = await db.collection('users')
      .where({ _openid: senderOpenId }).get();
    const { data: receiverUsers } = await db.collection('users')
      .where({ _openid: receiverOpenId }).get();

    if (senderUsers.length === 0 || receiverUsers.length === 0) {
      return { success: false, errMsg: '用户不存在' };
    }

    const sender = senderUsers[0];
    const receiver = receiverUsers[0];

    if (sender.groupId !== receiver.groupId || sender.groupId !== task.groupId) {
      return { success: false, errMsg: '你和对方不在同一小组中' };
    }

    // 防骚扰检查：30分钟内不能重复提醒
    const thirtyMinutesAgo = new Date(Date.now() - ANTI_SPAM_INTERVAL);
    const { data: recentReminders } = await db.collection('reminders')
      .where({
        taskId,
        senderOpenId,
        receiverOpenId,
        createdAt: _.gte(thirtyMinutesAgo)
      })
      .get();

    if (recentReminders.length > 0) {
      return { success: false, errMsg: '30分钟内已提醒过，请稍后再试' };
    }

    // 创建提醒记录
    const reminder = {
      taskId,
      groupId: task.groupId,
      senderOpenId,
      receiverOpenId,
      createdAt: new Date()
    };

    await db.collection('reminders').add({ data: reminder });

    // 创建通知
    const senderName = sender.nickname || '组员';
    await db.collection('notifications').add({
      data: {
        receiverOpenId,
        senderOpenId,
        type: 'REMINDER',
        title: '组员提醒',
        content: `${senderName}提醒你：${task.title}`,
        relatedTaskId: taskId,
        isRead: false,
        createdAt: new Date()
      }
    });

    return {
      success: true,
      data: { message: '提醒已发送' }
    };
  } catch (err) {
    console.error('创建提醒失败:', err);
    return { success: false, errMsg: '发送提醒失败' };
  }
}
