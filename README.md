# dsh-desktop-whale

DSH 插件：**随 DSH 启停管理一只独立桌面鲸鱼**。

它不注入 Web UI，而是在 DSH Host 启动时拉起桌面上独立运行的鲸鱼 exe，DSH 退出时把整棵进程树关掉——让一个普通桌面 exe 像其它 DSH 插件一样拥有生命周期管理。

## 工作原理

| 时机 | 动作 |
| --- | --- |
| DSH 启动（`apply`） | 先 `taskkill /F /T /IM` 清掉可能残留/手动开着的旧实例（避免双开），800ms 后 `spawn` 拉起 exe |
| DSH 退出 | `ctx.effect` 的 disposer 触发 `taskkill /F /T /IM DS.Desktop.Whale.exe`，连 WebView2 子进程一起收掉 |

exe 路径固定为包内 `assets/DS.Desktop.Whale.exe`（`lib/index.js` 顶部常量）；不存在时只记一条日志，不报错。

## 目录

```
dsh-desktop-whale/
├── lib/index.js            # 插件本体（ESM，导出 name/inject/apply）
├── cordis.patch.yml        # bundle 挂载声明
├── package.json
├── README.md
└── assets/                 # ← 需你自备 DS.Desktop.Whale.exe（不随包分发）
```

## 安装

```bash
# 1) 先把 exe 放到位（见下方「许可边界」）
#    assets/DS.Desktop.Whale.exe

# 2) 以本地包方式挂进 web profile（在仓库根目录执行）
dsh plugin --profile web add link:.

# 3) 重启 dsh web 生效
```

## ⚠️ 许可边界（重要）

| 内容 | 许可 | 能否公开分发 |
| --- | --- | --- |
| **本插件代码**（`lib/index.js`、`cordis.patch.yml`） | MIT | ✅ 可以 |
| **`assets/DS.Desktop.Whale.exe`** | 🔴 无有效授权 | ❌ **不可以** |

**为什么 exe 不能分发**：它是 Tauri（Rust + WebView2）应用，改造自两个上游：

1. [`xiaolinnnnnnn/DeepSeek-Balance-Whale-Widget`](https://github.com/xiaolinnnnnnn/DeepSeek-Balance-Whale-Widget)
   —— 鲸鱼挂件的 Tauri v2 Windows 桌面独立版；fork 自 MeteorNOX 的 MIT 项目，但**该 fork 自身没有 LICENSE 文件**，其新增的 Tauri 重构代码默认「保留所有权利」。
2. [`QCYTSN/dsh-dafeiyu`](https://github.com/QCYTSN/dsh-dafeiyu)
   —— 其 `ASSET_LICENSE.md` 明确：源码 MIT，但**角色美术素材不在 MIT 覆盖范围内**，且声明「图像处理、缩放或重新打包都不会改变底层美术的权利」「未授予任何额外许可」。

因此 `package.json` 的 `files` **刻意排除了 `assets/`**：即便执行 `npm pack` / `publish`，也不会把 exe 打进包里。使用时请**自备** exe（自己构建，或取得上游作者授权），并自行承担相应合规责任。

> 想做一个可公开的桌面桌宠：用自有美术（或 CC 授权素材）重写 Tauri 壳，代码与素材两条许可线都干净。

## 说明

- 本插件与上游两个项目**无代码/素材共用**，只是按镜像名拉起并回收一个由使用者提供的 exe。
- 「DS / DeepSeek」相关名称与角色权利属于各自所有者；本项目为非官方插件。
