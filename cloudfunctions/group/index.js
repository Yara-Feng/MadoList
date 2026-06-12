const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 邀请码字符集（排除 0/O、1/I/L，共 30 个字符）
const INVITE_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 6;
const GROUP_MAX_SIZE = 10;

/**
 * 小组管理云函数
 * action: 'create' — 创建小组
 * action: 'join' — 加入小组
 * action: 'leave' — 退出小组
 * action: 'detail' — 获取小组详情+成员列表
 * action: 'resetCode' — 重置邀请码
 */
exports.main = async (event, context) => {
  const { action, data } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  switch (action) {
    case 'create':
      return await createGroup(openid, data);
    case 'join':
      return await joinGroup(openid, data);
    case 'leave':
      return await leaveGroup(openid);
    case 'detail':
      return await getGroupDetail(openid);
    case 'resetCode':
      return await resetInviteCode(openid);
    default:
      return { success: false, errMsg: '未知操作' };
  }
};

/**
 * 生成唯一的6位邀请码
 */
async function generateUniqueCode() {
  const groupsCol = db.collection('groups');
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = '';
    for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
      const idx = Math.floor(Math.random() * INVITE_CODE_CHARS.length);
      code += INVITE_CODE_CHARS[idx];
    }

    const { data: existing } = await groupsCol.where({ inviteCode: code }).get();
    if (existing.length === 0) {
      isUnique = true;
    }
  }

  return code;
}

/**
 * 创建小组
 */
async function createGroup(openid, data) {
  try {
    const { name } = data || {};
    if (!name || !name.trim()) {
      return { success: false, errMsg: '小组名称不能为空' };
    }

    // 检查用户是否已有小组
    const { data: users } = await db.collection('users')
      .where({ _openid: openid })
      .get();

    if (users.length === 0) {
      return { success: false, errMsg: '用户不存在' };
    }

    if (users[0].groupId) {
      return { success: false, errMsg: '你已在一个小组中，请先退出当前小组' };
    }

    // 生成唯一邀请码
    const inviteCode = await generateUniqueCode();

    // 创建小组
    const group = {
      name: name.trim(),
      inviteCode,
      createdBy: openid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const { _id } = await db.collection('groups').add({ data: group });
    group._id = _id;

    // 将创建者加入小组
    await db.collection('users')
      .where({ _openid: openid })
      .update({
        data: {
          groupId: _id,
          updatedAt: new Date()
        }
      });

    return {
      success: true,
      data: group
    };
  } catch (err) {
    console.error('创建小组失败:', err);
    return { success: false, errMsg: '创建小组失败' };
  }
}

/**
 * 通过邀请码加入小组
 */
async function joinGroup(openid, data) {
  try {
    const { inviteCode } = data || {};
    if (!inviteCode) {
      return { success: false, errMsg: '请输入邀请码' };
    }

    // 查询用户
    const { data: users } = await db.collection('users')
      .where({ _openid: openid })
      .get();

    if (users.length === 0) {
      return { success: false, errMsg: '用户不存在' };
    }

    const user = users[0];

    // 检查是否已有小组
    if (user.groupId) {
      return { success: false, errMsg: '你已在一个小组中，请先退出当前小组' };
    }

    // 通过邀请码查询小组
    const { data: groups } = await db.collection('groups')
      .where({ inviteCode: inviteCode.toUpperCase() })
      .get();

    if (groups.length === 0) {
      return { success: false, errMsg: '邀请码无效' };
    }

    const group = groups[0];

    // 检查小组人数
    const { total } = await db.collection('users')
      .where({ groupId: group._id })
      .count();

    if (total >= GROUP_MAX_SIZE) {
      return { success: false, errMsg: '小组已满（最多10人）' };
    }

    // 加入小组
    await db.collection('users')
      .where({ _openid: openid })
      .update({
        data: {
          groupId: group._id,
          updatedAt: new Date()
        }
      });

    return {
      success: true,
      data: group
    };
  } catch (err) {
    console.error('加入小组失败:', err);
    return { success: false, errMsg: '加入小组失败' };
  }
}

/**
 * 退出小组
 */
async function leaveGroup(openid) {
  try {
    const { data: users } = await db.collection('users')
      .where({ _openid: openid })
      .get();

    if (users.length === 0) {
      return { success: false, errMsg: '用户不存在' };
    }

    const user = users[0];
    if (!user.groupId) {
      return { success: false, errMsg: '你还没有加入小组' };
    }

    const groupId = user.groupId;

    // 查询小组剩余人数
    const { total } = await db.collection('users')
      .where({ groupId })
      .count();

    // 如果是最后一个人，解散小组
    if (total <= 1) {
      // 逻辑删除该小组所有共享待办
      await db.collection('tasks')
        .where({ groupId, visibility: 'GROUP', isDeleted: false })
        .update({
          data: {
            isDeleted: true,
            updatedAt: new Date()
          }
        });

      // 删除小组
      await db.collection('groups').doc(groupId).remove();
    }

    // 用户退出小组
    await db.collection('users')
      .where({ _openid: openid })
      .update({
        data: {
          groupId: null,
          updatedAt: new Date()
        }
      });

    return {
      success: true,
      data: { groupDissolved: total <= 1 }
    };
  } catch (err) {
    console.error('退出小组失败:', err);
    return { success: false, errMsg: '退出小组失败' };
  }
}

/**
 * 获取小组详情和成员列表
 */
async function getGroupDetail(openid) {
  try {
    const { data: users } = await db.collection('users')
      .where({ _openid: openid })
      .get();

    if (users.length === 0 || !users[0].groupId) {
      return { success: false, errMsg: '你还没有加入小组' };
    }

    const groupId = users[0].groupId;

    // 获取小组信息
    const { data: groups } = await db.collection('groups')
      .where({ _id: groupId })
      .get();

    if (groups.length === 0) {
      // 小组已被解散，清理用户的 groupId
      await db.collection('users')
        .where({ _openid: openid })
        .update({ data: { groupId: null, updatedAt: new Date() } });
      return { success: false, errMsg: '小组已解散' };
    }

    const group = groups[0];

    // 获取成员列表
    const { data: members } = await db.collection('users')
      .where({ groupId })
      .field({
        _id: true,
        nickname: true,
        avatarUrl: true,
        createdAt: true
      })
      .get();

    return {
      success: true,
      data: {
        ...group,
        members,
        memberCount: members.length,
        isCreator: group.createdBy === openid
      }
    };
  } catch (err) {
    console.error('获取小组详情失败:', err);
    return { success: false, errMsg: '获取小组详情失败' };
  }
}

/**
 * 重置邀请码（仅创建者可操作）
 */
async function resetInviteCode(openid) {
  try {
    const { data: users } = await db.collection('users')
      .where({ _openid: openid })
      .get();

    if (users.length === 0 || !users[0].groupId) {
      return { success: false, errMsg: '你还没有加入小组' };
    }

    const groupId = users[0].groupId;
    const { data: groups } = await db.collection('groups')
      .where({ _id: groupId })
      .get();

    if (groups.length === 0) {
      return { success: false, errMsg: '小组不存在' };
    }

    const group = groups[0];
    if (group.createdBy !== openid) {
      return { success: false, errMsg: '仅小组创建者可以重置邀请码' };
    }

    // 生成新邀请码
    const newCode = await generateUniqueCode();
    await db.collection('groups').doc(groupId).update({
      data: {
        inviteCode: newCode,
        updatedAt: new Date()
      }
    });

    return {
      success: true,
      data: { inviteCode: newCode }
    };
  } catch (err) {
    console.error('重置邀请码失败:', err);
    return { success: false, errMsg: '重置邀请码失败' };
  }
}
