const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

/**
 * 待办管理云函数
 * action: 'create' — 创建待办
 * action: 'update' — 编辑待办
 * action: 'delete' — 逻辑删除
 * action: 'toggle' — TODO↔DONE 切换
 * action: 'switchVisibility' — PERSONAL↔GROUP 切换
 * action: 'list' — 列表查询（筛选+排序+分页）
 * action: 'detail' — 单条查询
 * action: 'getDates' — 获取有任务标记的日期
 * action: 'getByDate' — 获取指定日期的待办
 */
exports.main = async (event, context) => {
  const { action, data } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  switch (action) {
    case 'create':
      return await createTask(openid, data);
    case 'update':
      return await updateTask(openid, data);
    case 'delete':
      return await deleteTask(openid, data);
    case 'toggle':
      return await toggleTask(openid, data);
    case 'switchVisibility':
      return await switchVisibility(openid, data);
    case 'list':
      return await listTasks(openid, data);
    case 'detail':
      return await getTaskDetail(openid, data);
    case 'getDates':
      return await getTaskDates(openid, data);
    case 'getByDate':
      return await getTasksByDate(openid, data);
    default:
      return { success: false, errMsg: '未知操作' };
  }
};

/**
 * 创建待办
 */
async function createTask(openid, data) {
  try {
    const { title, description, priority, visibility, dueTime, remindAt } = data || {};

    if (!title || !title.trim()) {
      return { success: false, errMsg: '待办标题不能为空' };
    }

    // 检查 visibility 合法性
    if (visibility === 'GROUP') {
      // 获取用户所属小组
      const { data: users } = await db.collection('users')
        .where({ _openid: openid }).get();
      if (users.length === 0 || !users[0].groupId) {
        return { success: false, errMsg: '未加入小组，无法创建共享待办' };
      }
    }

    const task = {
      _openid: openid,
      groupId: null,
      title: title.trim(),
      description: description || '',
      visibility: visibility || 'PERSONAL',
      priority: priority || 'MEDIUM',
      status: 'TODO',
      dueTime: dueTime ? new Date(dueTime) : null,
      remindAt: remindAt ? new Date(remindAt) : null,
      isRecurring: false,
      recurringType: null,
      recurringInterval: 1,
      nextOccurrence: null,
      completedAt: null,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 如果是 GROUP 待办，设置 groupId
    if (task.visibility === 'GROUP') {
      const { data: users } = await db.collection('users')
        .where({ _openid: openid }).get();
      if (users.length > 0) {
        task.groupId = users[0].groupId;
      }
    }

    const { _id } = await db.collection('tasks').add({ data: task });
    task._id = _id;

    return { success: true, data: task };
  } catch (err) {
    console.error('创建待办失败:', err);
    return { success: false, errMsg: '创建待办失败' };
  }
}

/**
 * 编辑待办
 */
async function updateTask(openid, data) {
  try {
    const { taskId, ...updateFields } = data || {};

    if (!taskId) {
      return { success: false, errMsg: '缺少任务ID' };
    }

    // 验证任务属于当前用户
    const { data: tasks } = await db.collection('tasks')
      .where({ _id: taskId, _openid: openid, isDeleted: false })
      .get();

    if (tasks.length === 0) {
      return { success: false, errMsg: '任务不存在或无权操作' };
    }

    const updateData = { updatedAt: new Date() };

    // 允许更新的字段
    const allowedFields = ['title', 'description', 'priority', 'dueTime', 'remindAt', 'isRecurring', 'recurringType', 'recurringInterval'];
    for (const field of allowedFields) {
      if (updateFields[field] !== undefined) {
        if (field === 'dueTime' || field === 'remindAt') {
          updateData[field] = updateFields[field] ? new Date(updateFields[field]) : null;
        } else {
          updateData[field] = updateFields[field];
        }
      }
    }

    await db.collection('tasks').doc(taskId).update({ data: updateData });

    // 返回更新后的任务
    const { data: updated } = await db.collection('tasks').doc(taskId).get();
    return { success: true, data: updated };
  } catch (err) {
    console.error('编辑待办失败:', err);
    return { success: false, errMsg: '编辑待办失败' };
  }
}

/**
 * 逻辑删除待办
 */
async function deleteTask(openid, data) {
  try {
    const { taskId } = data || {};
    if (!taskId) {
      return { success: false, errMsg: '缺少任务ID' };
    }

    const { data: tasks } = await db.collection('tasks')
      .where({ _id: taskId, _openid: openid, isDeleted: false })
      .get();

    if (tasks.length === 0) {
      return { success: false, errMsg: '任务不存在或无权操作' };
    }

    await db.collection('tasks').doc(taskId).update({
      data: {
        isDeleted: true,
        updatedAt: new Date()
      }
    });

    return { success: true };
  } catch (err) {
    console.error('删除待办失败:', err);
    return { success: false, errMsg: '删除待办失败' };
  }
}

/**
 * 切换 TODO ↔ DONE
 */
async function toggleTask(openid, data) {
  try {
    const { taskId } = data || {};
    if (!taskId) {
      return { success: false, errMsg: '缺少任务ID' };
    }

    const { data: tasks } = await db.collection('tasks')
      .where({ _id: taskId, _openid: openid, isDeleted: false })
      .get();

    if (tasks.length === 0) {
      return { success: false, errMsg: '任务不存在或无权操作' };
    }

    const task = tasks[0];
    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    const updateData = {
      status: newStatus,
      updatedAt: new Date()
    };

    if (newStatus === 'DONE') {
      updateData.completedAt = new Date();
    }
    // 取消完成时保留 completedAt 历史记录

    await db.collection('tasks').doc(taskId).update({ data: updateData });

    // 如果任务完成、是共享任务，发送通知给组员
    if (newStatus === 'DONE' && task.visibility === 'GROUP' && task.groupId) {
      await createTaskCompletedNotification(openid, task);
    }

    return {
      success: true,
      data: { status: newStatus, completedAt: updateData.completedAt }
    };
  } catch (err) {
    console.error('切换待办状态失败:', err);
    return { success: false, errMsg: '操作失败' };
  }
}

/**
 * 切换 PERSONAL ↔ GROUP
 */
async function switchVisibility(openid, data) {
  try {
    const { taskId, visibility } = data || {};
    if (!taskId || !visibility) {
      return { success: false, errMsg: '参数不完整' };
    }

    if (!['PERSONAL', 'GROUP'].includes(visibility)) {
      return { success: false, errMsg: '可见性参数无效' };
    }

    const { data: tasks } = await db.collection('tasks')
      .where({ _id: taskId, _openid: openid, isDeleted: false })
      .get();

    if (tasks.length === 0) {
      return { success: false, errMsg: '任务不存在或无权操作' };
    }

    const task = tasks[0];

    // 切换到 GROUP 时检查用户是否在小组
    if (visibility === 'GROUP') {
      const { data: users } = await db.collection('users')
        .where({ _openid: openid }).get();
      if (users.length === 0 || !users[0].groupId) {
        return { success: false, errMsg: '未加入小组，无法切换为共享待办' };
      }

      await db.collection('tasks').doc(taskId).update({
        data: {
          visibility: 'GROUP',
          groupId: users[0].groupId,
          updatedAt: new Date()
        }
      });
    } else {
      // 切换到 PERSONAL
      await db.collection('tasks').doc(taskId).update({
        data: {
          visibility: 'PERSONAL',
          groupId: null,
          updatedAt: new Date()
        }
      });
    }

    return { success: true, data: { visibility } };
  } catch (err) {
    console.error('切换可见性失败:', err);
    return { success: false, errMsg: '操作失败' };
  }
}

/**
 * 待办列表（支持筛选、排序、分页）
 */
async function listTasks(openid, data) {
  try {
    const {
      status,
      priority,
      visibility,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      pageSize = 20
    } = data || {};

    // 获取用户信息
    const { data: users } = await db.collection('users')
      .where({ _openid: openid }).get();
    const user = users.length > 0 ? users[0] : null;
    const groupId = user ? user.groupId : null;

    // 构建查询条件：用户自己的任务 + 组内共享任务
    const conditions = [];

    // 自己的任务
    const ownCondition = { _openid: openid, isDeleted: false };
    if (visibility === 'PERSONAL') {
      ownCondition.visibility = 'PERSONAL';
    }
    conditions.push(ownCondition);

    // 组内共享任务（如果用户在小组中）
    if (groupId && (!visibility || visibility === 'GROUP' || visibility === 'ALL')) {
      const groupCondition = {
        groupId: groupId,
        visibility: 'GROUP',
        isDeleted: false
      };
      if (status) groupCondition.status = status;
      if (priority) groupCondition.priority = priority;
      conditions.push(groupCondition);
    }

    // 使用 or 查询
    const query = db.collection('tasks').where(_.or(conditions));

    // 筛选
    if (status) {
      // 已在条件中处理
    }
    if (priority) {
      // 已在条件中处理
    }

    // 排序
    const sortField = ['createdAt', 'dueTime', 'priority'].includes(sortBy)
      ? sortBy : 'createdAt';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    if (sortField === 'priority') {
      // 优先级使用自定义排序映射
      // CloudBase 不支持复杂排序，这里在查询后用 JS 排序
      query.orderBy('createdAt', 'desc');
    } else {
      query.orderBy(sortField, order);
    }

    // 分页
    const skip = (page - 1) * pageSize;
    const { data: tasks } = await query
      .skip(skip)
      .limit(pageSize)
      .get();

    // 获取总数
    const { total } = await db.collection('tasks')
      .where(_.or(conditions))
      .count();

    // 如果按优先级排序，在 JS 中排序
    if (sortField === 'priority') {
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      tasks.sort((a, b) => {
        const orderA = priorityOrder[a.priority] || 2;
        const orderB = priorityOrder[b.priority] || 2;
        return order === 'asc' ? orderA - orderB : orderB - orderA;
      });
    }

    return {
      success: true,
      data: {
        tasks,
        total,
        page,
        pageSize,
        hasMore: skip + tasks.length < total
      }
    };
  } catch (err) {
    console.error('获取待办列表失败:', err);
    return { success: false, errMsg: '获取待办列表失败' };
  }
}

/**
 * 单条查询
 */
async function getTaskDetail(openid, data) {
  try {
    const { taskId } = data || {};
    if (!taskId) {
      return { success: false, errMsg: '缺少任务ID' };
    }

    const { data: tasks } = await db.collection('tasks')
      .where({ _id: taskId, isDeleted: false })
      .get();

    if (tasks.length === 0) {
      return { success: false, errMsg: '任务不存在' };
    }

    const task = tasks[0];

    // 访问控制：个人任务只有自己可见，共享任务组员可见
    if (task.visibility === 'PERSONAL' && task._openid !== openid) {
      return { success: false, errMsg: '无权查看此任务' };
    }

    if (task.visibility === 'GROUP') {
      const { data: users } = await db.collection('users')
        .where({ _openid: openid }).get();
      const user = users.length > 0 ? users[0] : null;
      if (!user || user.groupId !== task.groupId) {
        return { success: false, errMsg: '无权查看此任务' };
      }
    }

    return { success: true, data: task };
  } catch (err) {
    console.error('获取待办详情失败:', err);
    return { success: false, errMsg: '获取待办详情失败' };
  }
}

/**
 * 获取月份中有待办的日期（用于日历标记）
 */
async function getTaskDates(openid, data) {
  try {
    const { year, month, mode = 'all' } = data || {};

    const { data: users } = await db.collection('users')
      .where({ _openid: openid }).get();
    const user = users.length > 0 ? users[0] : null;
    const groupId = user ? user.groupId : null;

    // 构建日期范围
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const conditions = [{ _openid: openid, isDeleted: false }];
    if (groupId && (mode === 'group' || mode === 'all')) {
      conditions.push({
        groupId,
        visibility: 'GROUP',
        isDeleted: false
      });
    }

    const { data: tasks } = await db.collection('tasks')
      .where(_.or(conditions))
      .field({ dueTime: true })
      .get();

    // 提取有截止时间的日期
    const dates = new Set();
    for (const task of tasks) {
      if (task.dueTime) {
        const d = new Date(task.dueTime);
        if (d >= startDate && d <= endDate) {
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          dates.add(dateStr);
        }
      }
    }

    return {
      success: true,
      data: Array.from(dates)
    };
  } catch (err) {
    console.error('获取任务日期失败:', err);
    return { success: false, errMsg: '获取任务日期失败' };
  }
}

/**
 * 获取指定日期的待办
 */
async function getTasksByDate(openid, data) {
  try {
    const { date, mode = 'all' } = data || {};

    const { data: users } = await db.collection('users')
      .where({ _openid: openid }).get();
    const user = users.length > 0 ? users[0] : null;
    const groupId = user ? user.groupId : null;

    const dayStart = new Date(date + 'T00:00:00');
    const dayEnd = new Date(date + 'T23:59:59');

    const conditions = [{
      _openid: openid,
      isDeleted: false,
      dueTime: _.gte(dayStart).and(_.lte(dayEnd))
    }];

    if (groupId && (mode === 'group' || mode === 'all')) {
      conditions.push({
        groupId,
        visibility: 'GROUP',
        isDeleted: false,
        dueTime: _.gte(dayStart).and(_.lte(dayEnd))
      });
    }

    const { data: tasks } = await db.collection('tasks')
      .where(_.or(conditions))
      .orderBy('createdAt', 'desc')
      .get();

    return {
      success: true,
      data: tasks
    };
  } catch (err) {
    console.error('获取日期任务失败:', err);
    return { success: false, errMsg: '获取日期任务失败' };
  }
}

/**
 * 创建任务完成通知给组员
 */
async function createTaskCompletedNotification(senderOpenId, task) {
  try {
    // 获取组员列表
    const { data: members } = await db.collection('users')
      .where({ groupId: task.groupId, _openid: _.neq(senderOpenId) })
      .get();

    // 获取发送者昵称
    const { data: senders } = await db.collection('users')
      .where({ _openid: senderOpenId }).get();
    const senderName = senders.length > 0 ? senders[0].nickname : '组员';

    // 为每个组员创建通知
    for (const member of members) {
      await db.collection('notifications').add({
        data: {
          receiverOpenId: member._openid,
          senderOpenId: senderOpenId,
          type: 'TASK_COMPLETED',
          title: '任务完成',
          content: `${senderName} 完成了「${task.title}」`,
          relatedTaskId: task._id,
          isRead: false,
          createdAt: new Date()
        }
      });
    }
  } catch (err) {
    console.error('创建通知失败:', err);
  }
}
