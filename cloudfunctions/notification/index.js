const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

/**
 * 通知管理云函数
 * action: 'list' — 通知列表（分页）
 * action: 'markRead' — 标记已读（单条）
 * action: 'markAllRead' — 全部已读
 * action: 'unreadCount' — 未读数量
 */
exports.main = async (event, context) => {
  const { action, data } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  switch (action) {
    case 'list':
      return await listNotifications(openid, data);
    case 'markRead':
      return await markRead(openid, data);
    case 'markAllRead':
      return await markAllRead(openid);
    case 'unreadCount':
      return await getUnreadCount(openid);
    default:
      return { success: false, errMsg: '未知操作' };
  }
};

/**
 * 获取通知列表
 */
async function listNotifications(openid, data) {
  try {
    const { page = 1, pageSize = 20 } = data || {};

    const { data: notifications } = await db.collection('notifications')
      .where({ receiverOpenId: openid })
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    const { total } = await db.collection('notifications')
      .where({ receiverOpenId: openid })
      .count();

    return {
      success: true,
      data: {
        notifications,
        total,
        page,
        pageSize,
        hasMore: (page - 1) * pageSize + notifications.length < total
      }
    };
  } catch (err) {
    console.error('获取通知列表失败:', err);
    return { success: false, errMsg: '获取通知列表失败' };
  }
}

/**
 * 标记单条已读
 */
async function markRead(openid, data) {
  try {
    const { notificationId } = data || {};

    if (notificationId) {
      // 标记指定通知已读
      await db.collection('notifications')
        .where({ _id: notificationId, receiverOpenId: openid })
        .update({
          data: { isRead: true }
        });
    }

    return { success: true };
  } catch (err) {
    console.error('标记已读失败:', err);
    return { success: false, errMsg: '操作失败' };
  }
}

/**
 * 标记全部已读
 */
async function markAllRead(openid) {
  try {
    await db.collection('notifications')
      .where({ receiverOpenId: openid, isRead: false })
      .update({
        data: { isRead: true }
      });

    return { success: true };
  } catch (err) {
    console.error('标记全部已读失败:', err);
    return { success: false, errMsg: '操作失败' };
  }
}

/**
 * 获取未读数量
 */
async function getUnreadCount(openid) {
  try {
    const { total } = await db.collection('notifications')
      .where({ receiverOpenId: openid, isRead: false })
      .count();

    return { success: true, data: total };
  } catch (err) {
    console.error('获取未读数失败:', err);
    return { success: false, errMsg: '操作失败' };
  }
}
