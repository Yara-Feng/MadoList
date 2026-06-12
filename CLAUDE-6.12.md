# MadoList 开发上下文 — 2026-06-12

## 项目快照

| 项目 | 内容 |
|------|------|
| **项目** | MadoList — 微信小程序协作待办管理 |
| **版本** | v1.0.0 MVP |
| **技术栈** | 微信小程序原生 + 云开发 CloudBase + Node.js 云函数 |
| **仓库** | `f:/WeiXin/MadoList`（本地已 git init + 首次提交，未推送 GitHub） |
| **需求文档** | `项目需求-二版-2026_6-12.md` |
| **进度文档** | `开发进度.md` / `规范化记录.md` |

---

## 今日完成事项

### M1: 基础设施搭建 ✅
- [x] `miniprogram/app.json` — 路由 + TabBar（4 Tab: 首页/待办/日历/我的）
- [x] `miniprogram/app.js` — 全局状态管理（userInfo / groupInfo / unreadCount）+ `waitLogin()`
- [x] `miniprogram/app.wxss` — CSS 变量主题系统（`--color-primary: #0052D9`，间距/字号/阴影）
- [x] `miniprogram/utils/constants.js` — 枚举常量（VISIBILITY / PRIORITY / STATUS / NOTIFICATION_TYPE / GROUP_MAX_SIZE=10 / ANTI_SPAM_INTERVAL=30min）
- [x] `miniprogram/utils/api.js` — 统一云函数调用封装（5 API 模块：userApi / groupApi / taskApi / reminderApi / notificationApi）
- [x] `miniprogram/utils/date.js` — 日期工具（formatDate / isToday / isOverdue / getCalendarGrid 等）

### M2: 云函数开发 ✅（6 个模块，action-based dispatch）
- [x] `cloudfunctions/login/` — 微信登录 + 自动注册（openid → 查/建用户 → 返回 user+groupInfo+isNewUser）
- [x] `cloudfunctions/user/` — getProfile / updateProfile
- [x] `cloudfunctions/group/` — create（6位码循环）、join（退旧组校验+上限10人）、leave（末人解散+逻辑删分享任务）、detail、resetCode（仅创建者）
- [x] `cloudfunctions/task/` — 9 个 action：CRUD + toggle + switchVisibility + list（OR查询+筛选排序分页）+ detail + getDates + getByDate
- [x] `cloudfunctions/reminder/` — create（校验 GROUP 任务 + 同组成员 + 30分钟防骚扰）
- [x] `cloudfunctions/notification/` — list / markRead / markAllRead / unreadCount

### M3: 前端页面开发 ✅（10 个页面）
- [x] `pages/home/home` — 用户信息卡片 + 小组状态 + 今日待办 TOP5 + 未读通知入口
- [x] `pages/tasks/tasks` — 筛选面板（状态/优先级/可见性）+ 排序面板 + 分页 + FAB
- [x] `pages/tasks/detail` — 双模式（创建/编辑）+ toggleStatus + switchVisibility + delete + 提醒Ta
- [x] `pages/calendar/calendar` — 自定义月网格 + 日期圆点标记 + 底部面板 + 模式切换
- [x] `pages/group/group` — 条件 UI（无组→创建/加入；有组→信息+邀请码+退出）+ 复制/重置邀请码
- [x] `pages/group/create` / `pages/group/join` — 小组创建/加入
- [x] `pages/group/members` — 成员列表
- [x] `pages/notifications/notifications` — 分页列表 + 相对时间 + 标记已读 + 全部已读
- [x] `pages/profile/profile` — chooseAvatar + nickname 编辑

### M4: 公共组件 ✅
- [x] `components/task-card/` — 待办卡片（属性：task；事件：tap / toggle / longpress）
- [x] `components/empty-state/` — 空状态（属性：icon / text / showAction / actionText）

### M5: 图标集成 ✅
- [x] 选用 Remix Icon (Apache 2.0)，通过本地 npm 包 `remixicon@4.9.0` 获取 SVG
- [x] 编写 `scripts/generate-icons.mjs`（SVG 着色 → @resvg/resvg-js 转 81×81 PNG）
- [x] 生成 8 个 TabBar 图标至 `miniprogram/images/tab/`（灰色 #999 未选中态 / 蓝色 #0052D9 选中态）

### M6: 文档输出 ✅
- [x] `开发进度.md` — 时间线式里程碑记录
- [x] `规范化记录.md` — 项目信息 / 架构 / 数据库设计 / 命名规范 / 模块矩阵 / 质量指标 / 部署清单
- [x] `SETUP.md` — 部署指南 + 验证清单

---

## 项目文件清单（核心 72+ 文件）

```
MadoList/
├── cloudfunctions/
│   ├── login/index.js + config.json + package.json
│   ├── user/index.js + config.json + package.json
│   ├── group/index.js + config.json + package.json
│   ├── task/index.js + config.json + package.json
│   ├── reminder/index.js + config.json + package.json
│   └── notification/index.js + config.json + package.json
├── miniprogram/
│   ├── app.js / app.json / app.wxss
│   ├── utils/api.js / constants.js / date.js
│   ├── images/tab/ (home/home-active/tasks/tasks-active/calendar/calendar-active/profile/profile-active).png + README.md
│   ├── components/task-card/ (index.js/wxml/wxss/json)
│   ├── components/empty-state/ (index.js/wxml/wxss/json)
│   └── pages/
│       ├── home/home.js/wxml/wxss/json
│       ├── tasks/tasks.js/wxml/wxss/json + detail.js/wxml/wxss/json
│       ├── calendar/calendar.js/wxml/wxss/json
│       ├── group/group.js/wxml/wxss/json + create.js/wxml/wxss/json + join.js/wxml/wxss/json + members.js/wxml/wxss/json
│       ├── notifications/notifications.js/wxml/wxss/json
│       └── profile/profile.js/wxml/wxss/json
├── scripts/generate-icons.mjs
├── .gitignore
├── 开发进度.md
├── 规范化记录.md
├── SETUP.md
└── 项目需求-二版-2026_6-12.md
```

---

## 关键技术决策

1. **云函数模式**: action-based dispatch（每个模块一个云函数，通过 `event.action` 分发），而非每个接口独立云函数
2. **API 返回格式**: 统一 `{ success: boolean, data?: any, errMsg?: string }`
3. **软删除**: tasks 使用 `isDeleted: true` 逻辑删除
4. **邀请码**: 6 位，字符集排除 0/O/1/I/L（30 字符），循环查重生成
5. **小组解散**: 最后一人退出时自动解散，逻辑删除所有共享待办
6. **防骚扰**: 同任务+同发送者在 30 分钟内只能提醒一次
7. **图标**: Remix Icon 本地化生成，无需运行时依赖

---

## Git 状态

- [x] `git init` + 首次提交（140 files, 8662 lines）on `main`
- [x] `gh` CLI 已安装
- [ ] **未推送 GitHub** — 网络无法连接 github.com（TCP 超时），需切换网络或手动操作

推送命令（待执行）：
```bash
gh auth login    # → Paste GitHub token
gh repo create MadoList --public --source=. --remote=origin --push
```

---

## 待部署（云开发控制台）

1. 创建数据库集合：users / groups / tasks / reminders / notifications / checkins
2. 配置索引（参考 `规范化记录.md` 3.3 章节）
3. 配置安全规则
4. 部署所有云函数（右键 → 上传并部署：云端安装依赖）
5. 在 `app.js` 中设置正确的云环境 ID
6. 编译测试

---

## 技术债务（MVP 范围外）

| 项 | 说明 |
|-----|------|
| 日历周/日视图 | 仅实现月视图 |
| TDesign 组件库集成 | 目前纯原生组件 |
| 连续打卡模块 | 下一版 |
| 表情鼓励模块 | 下一版 |
| 标签系统 | 数据模型已预留 |
| 微信订阅消息 | 模板待配置 |

---

> 📅 下次开发时阅读本文即可快速恢复上下文。关键入口：需求文档 / 规范化记录 / 开发进度.md。
