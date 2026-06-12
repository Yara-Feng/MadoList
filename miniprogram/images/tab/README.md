# TabBar 图标

> 来源：Remix Icon (Apache 2.0 License)
> 风格：统一线性/填充风格，灰色(未选中) / 品牌蓝(选中)
> 尺寸：81×81 px PNG 透明背景

## 图标清单

| 图标 | 文件 | 风格 | 颜色 | 大小 |
|------|------|------|------|------|
| 🏠 首页 | `home.png` | Line | #999999 | 1.1 KB |
| 🏠 首页·选中 | `home-active.png` | Fill | #0052D9 | 0.8 KB |
| 📋 待办 | `tasks.png` | Line | #999999 | 0.8 KB |
| 📋 待办·选中 | `tasks-active.png` | Fill | #0052D9 | 0.7 KB |
| 📅 日历 | `calendar.png` | Line | #999999 | 0.5 KB |
| 📅 日历·选中 | `calendar-active.png` | Fill | #0052D9 | 0.5 KB |
| 👤 我的 | `profile.png` | Line | #999999 | 1.8 KB |
| 👤 我的·选中 | `profile-active.png` | Fill | #0052D9 | 1.2 KB |

## 源文件

- Line (未选中): `Buildings/home-line.svg`, `Document/task-line.svg`, `Business/calendar-line.svg`, `User & Faces/user-line.svg`
- Fill (选中): `Buildings/home-fill.svg`, `Document/task-fill.svg`, `Business/calendar-fill.svg`, `User & Faces/user-fill.svg`

## 重新生成

```bash
cd scripts
npm install
node generate-icons.mjs
```
