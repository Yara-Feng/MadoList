const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

/**
 * 用户资料云函数
 * action: 'getProfile' — 获取当前用户信息
 * action: 'updateProfile' — 更新昵称/头像
 */
exports.main = async (event, context) => {
  const { action, data } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  switch (action) {
    case 'getProfile':
      return await getProfile(openid);
    case 'updateProfile':
      return await updateProfile(openid, data);
    default:
      return { success: false, errMsg: '未知操作' };
  }
};

/**
 * 获取用户信息（含小组信息）
 */
async function getProfile(openid) {
  try {
    const { data: users } = await db.collection('users')
      .where({ _openid: openid })
      .get();

    if (users.length === 0) {
      return { success: false, errMsg: '用户不存在' };
    }

    const user = users[0];

    // 获取小组信息
    let groupInfo = null;
    if (user.groupId) {
      const { data: groups } = await db.collection('groups')
        .where({ _id: user.groupId })
        .get();
      if (groups.length > 0) {
        groupInfo = groups[0];

        // 获取成员列表
        const { data: members } = await db.collection('users')
          .where({ groupId: user.groupId })
          .field({ nickname: true, avatarUrl: true })
          .get();
        groupInfo.members = members;
        groupInfo.memberCount = members.length;
      }
    }

    return {
      success: true,
      data: { ...user, groupInfo }
    };
  } catch (err) {
    console.error('获取用户信息失败:', err);
    return { success: false, errMsg: '获取用户信息失败' };
  }
}

/**
 * 更新用户资料
 */
async function updateProfile(openid, data) {
  try {
    const { nickname, avatarUrl } = data || {};
    const updateData = { updatedAt: new Date() };

    if (nickname !== undefined) updateData.nickname = nickname;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    await db.collection('users')
      .where({ _openid: openid })
      .update({ data: updateData });

    // 返回更新后的用户信息
    return await getProfile(openid);
  } catch (err) {
    console.error('更新用户信息失败:', err);
    return { success: false, errMsg: '更新用户信息失败' };
  }
}
