# MayorFlow 市长工坊

《模拟城市：我是市长》的桌面端生产材料规划器。

在线使用：[MayorFlow 市长工坊](https://minsecrus.github.io/MayorFlow/)

## 功能

- 使用 63 张游戏物品图片选择生产目标
- 将商店配方递归展开到工厂原料
- 合并重复原料并统计数量与总工作量
- 根据任意数量的并行工厂槽位优化完工时间
- 展示每个槽位的生产顺序和时间轴
- 按配方依赖生成后续商店加工流程
- 使用浏览器本地存储自动保存生产清单

## 技术栈

- React 19 + TypeScript + Vite
- Ant Design
- Zustand
- ECharts
- Web Worker
- Vitest

## 本地运行

    npm install
    npm run dev

默认地址：http://localhost:3001/

## 校验

    npm run lint
    npm test
    npm run build

## 部署

推送到 `main` 分支后，GitHub Actions 会自动构建并部署到 GitHub Pages。也可以在 Actions 页面手动触发部署。

配方与基础生产时间参考 SimCity Wiki，物品图片来自 SCBuildIt HubsInfo。

## 许可

项目代码使用 [MIT License](LICENSE)。游戏名称和物品图片归各自权利人所有。

本项目未经 EA 或其许可方认可，亦与其不存在关联。

> This project is not endorsed by or affiliated with EA or its licensors.
