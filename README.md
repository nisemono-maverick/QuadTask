# QuadTask

一款融合 Todo 清单与艾森豪威尔四象限的个人任务管理工具。

## 功能特性

- ✅ 任务 CRUD：创建、编辑、删除、完成、恢复
- 🟦 四象限视图：任务按紧急/重要程度自动映射到 Q1/Q2/Q3/Q4
- 🖱️ 拖拽移动：在四象限之间拖拽任务，自动调整优先级
- 📋 清单管理：系统默认清单 + 自定义清单
- 🏷️ 标签系统：创建标签并关联任务
- 💾 本地存储：基于 IndexedDB，离线可用
- 📤 数据备份：JSON 导入/导出

## 技术栈

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 3
- Dexie.js (IndexedDB)
- @dnd-kit (拖拽)
- Lucide React (图标)

## 快速开始

```bash
# 进入项目目录
cd QuadTask

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 项目结构

```
QuadTask/
├── src/
│   ├── components/       # UI 组件
│   ├── db/              # Dexie.js 数据层
│   ├── stores/          # React Context 状态管理
│   ├── types/           # TypeScript 类型
│   ├── utils/           # 工具函数
│   ├── constants/       # 常量配置
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

## MVP 范围

本版本为 Phase 1 MVP，聚焦核心闭环：

- 任务管理与四象限映射
- 清单与标签管理
- 本地数据持久化
- JSON 备份

暂未实现：子任务、日历视图、搜索过滤、智能清单、提醒通知、PWA、深色模式、国际化、重复任务、统计图表、数据同步。

## 数据存储

所有数据存储在浏览器本地 IndexedDB 中，数据库名为 `QuadTaskDB`。建议定期使用设置中的"导出 JSON"功能备份数据。
