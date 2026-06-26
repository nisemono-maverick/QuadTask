# QuadTask 项目状态与后续计划

> 本文件用于帮助后续会话快速了解项目进度与下一步工作。

## 当前状态

- **阶段**: Phase 3 进行中（深色模式、甘特图、UI 美化、PWA、拖拽到清单已完成）
- **位置**: `/Users/maverick/AIProjects/QuadTask`
- **最后更新**: 2026-06-27
- **构建状态**: ✅ 通过 (`npm run build` 成功，`npm run lint` 0 warnings/errors)

## 已实现功能

### Phase 1 MVP（已完成）

- [x] 项目脚手架：Vite 8 + React 19 + TypeScript + Tailwind CSS 3
- [x] 本地数据层：Dexie.js + IndexedDB，含 tasks/lists/tags/taskTags/subTasks/reminders/settings 表
- [x] 任务 CRUD：创建、编辑、完成、软删除、恢复、永久删除
- [x] 优先级与四象限映射：urgency/importance 自动计算 Q1/Q2/Q3/Q4
- [x] 任务时间段：支持开始时间 + 结束时间（原单点 due_date 已扩展为时间段）
- [x] 四象限 2×2 视图 + 跨象限拖拽（@dnd-kit）
- [x] 四象限任务卡片支持删除
- [x] 日历视图：月/周/日三种视图，点击日期可快速创建任务
- [x] 子任务：任务下添加子任务、勾选完成、编辑删除，任务卡片显示进度
- [x] 搜索与过滤：全局搜索 + 标签/优先级/状态/截止日期/象限组合筛选
- [x] 清单管理：系统默认清单 + 自定义清单 CRUD
- [x] 标签系统：创建/删除标签，任务关联标签
- [x] 回收站：软删除、恢复、清空
- [x] 清单视图分组：未完成任务置顶，已完成任务自动后置到"已完成"分组
- [x] JSON 导入/导出备份
- [x] 基础 UI 组件：Button / Input / Dialog / Slider / Select / Textarea / DateTimeInput / ConfirmDialog / TaskCard / QuickAdd / TaskDialog

## 暂未实现的功能（后续计划）

### Phase 2 — 核心完善

- [x] 子任务（SubTask）：任务下添加子任务、勾选完成、编辑删除，任务卡片显示进度
- [x] 高级标签管理：编辑标签名称/颜色，编辑任务时标签可保存
- [x] 全文搜索（标题 + 描述）
- [x] 过滤器组合筛选（清单/标签/优先级/截止日期/状态/象限）
- [x] 日历视图（月/周/日）
- [x] 清单内拖拽排序
- [x] 智能清单（保存过滤条件）
- [x] 虚拟滚动（任务 > 500 条）
- [x] 响应式适配（平板 + 移动端）

### Phase 3 — 体验增强

- [x] 深色模式
- [ ] 提醒通知（浏览器 Notification API）
- [x] PWA 离线支持（Service Worker + 安装提示）
- [ ] 键盘快捷键
- [ ] 国际化（中/英）
- [ ] 重复任务（预设规则 + Cron）
- [x] UI 组件美化（弹窗、自定义 Select、日期输入、Textarea）
- [x] 拖拽任务到左侧清单（Microsoft Todo 风格：缩小卡片 + 清单高亮边框）
- [ ] 交互动效完善
- [ ] 新手引导 / 种子数据

### Phase 4 — 扩展

- [x] 甘特图视图（按时间/优先级/象限/清单排序）
- [ ] 数据统计（完成趋势 + 象限分布图表）
- [ ] 多端同步（WebDAV / 自建服务器）
- [ ] 每日/每周摘要通知
- [ ] Tauri 桌面端打包
- [ ] 移动端 PWA 体验优化
- [ ] E2E 测试（Playwright）

## 项目结构

```
QuadTask/
├── src/
│   ├── components/        # UI 组件
│   │   ├── ui/            # 基础组件（Button/Input/Dialog/Slider）
│   │   ├── QuadrantGrid.tsx    # 四象限视图 + 拖拽
│   │   ├── QuickAdd.tsx        # 顶部快速创建
│   │   ├── Sidebar.tsx         # 左侧导航
│   │   ├── TaskCard.tsx        # 任务卡片
│   │   ├── TaskDialog.tsx      # 任务创建/编辑弹窗
│   │   ├── TaskList.tsx        # 清单视图
│   │   ├── CalendarView.tsx    # 日历视图
│   │   ├── GanttView.tsx       # 甘特图视图
│   │   ├── PWAInstallPrompt.tsx # PWA 安装提示
│   │   └── SettingsView.tsx    # 设置 + 导入导出
│   ├── db/
│   │   ├── schema.ts      # Dexie 数据库定义
│   │   └── operations.ts  # 数据操作 + 过滤 + 导入导出
│   ├── hooks/
│   │   └── useApp.ts      # 全局状态 Hook
│   ├── stores/
│   │   ├── AppContext.tsx # React Context Provider
│   │   └── context.ts     # Context 实例
│   ├── types/
│   │   └── index.ts       # TypeScript 类型
│   ├── utils/
│   │   └── index.ts       # cn / 日期格式化 / 过期判断
│   ├── constants/
│   │   └── index.ts       # 常量与配置
│   ├── App.tsx            # 主布局
│   ├── main.tsx           # 入口
│   └── index.css          # Tailwind + CSS 变量
├── public/
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
├── tsconfig.json
├── README.md
└── PROJECT_STATUS.md      # 本文件
```

## 常用命令

```bash
cd /Users/maverick/AIProjects/QuadTask

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 预览生产版本
npm run preview

# 代码检查
npm run lint
```

## 关键设计决策

- **数据存储**: 纯本地 IndexedDB（Dexie.js），无后端；当前数据库版本 v3
- **象限划分**: urgency/importance 中位线为 5.5
- **拖拽**: @dnd-kit 实现跨象限移动、清单内排序、任务拖到左侧清单归类
- **智能清单**: 清单表新增 `filter_data` 字段保存筛选条件，选择智能清单时自动应用过滤
- **状态管理**: React Context + useReducer 风格（MVP 阶段足够）
- **样式**: Tailwind CSS + CSS 变量，支持浅色/深色/跟随系统三种主题
- **PWA**: `vite-plugin-pwa` 生成 Service Worker，支持离线访问与安装到桌面

## 已知限制 / 注意事项

1. **提醒通知未实现**: 没有到期提醒。
2. **chunk 体积**: 生产构建 JS 约 1.1MB，建议后续按需 code-split。
3. **npm registry**: 安装依赖时若官方 registry 超时，可切换淘宝镜像：
   ```bash
   npm install --registry=https://registry.npmmirror.com
   ```

## 下一步推荐工作

Phase 2、深色模式、甘特图、UI 美化与 PWA 已完成，若下次继续，建议按以下顺序推进 Phase 3：

1. **提醒通知**: 浏览器 Notification API + 到期提醒
2. **键盘快捷键**: 快速创建、切换视图、完成任务
3. **重复任务**: 预设规则 + Cron 调度
4. **国际化（中/英）**
5. **数据统计**: 完成趋势与象限分布图表

## 启动检查清单（新会话）

- [ ] 读取本文件了解进度
- [ ] 运行 `npm run lint && npm run build` 确认项目状态正常
- [ ] 运行 `npm run dev` 启动开发服务器
- [ ] 根据本次目标查看对应 Phase 的待办项
