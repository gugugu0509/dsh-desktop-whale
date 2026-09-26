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
# 1) 准备 exe（二选一，见下方「配置」）
#    A. 放进包内：assets/DS.Desktop.Whale.exe
#    B. 放在任意位置，并用环境变量 DSH_DESKTOP_WHALE_EXE 指向它

# 2) 以本地包方式挂进 web profile（在仓库根目录执行）
dsh plugin --profile web add link:.

# 3) 重启 dsh web 生效
```

## 配置

| 环境变量 | 作用 |
| --- | --- |
| `DSH_DESKTOP_WHALE_EXE` | exe 的完整路径（**推荐**）。设置后不再使用包内 `assets/`；结束进程树时按该文件的镜像名匹配 |

未设置时使用包内 `assets/DS.Desktop.Whale.exe`；两条路径都不存在时只记一条日志，不会报错。

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

## 安全注意事项

- **本插件不做完整性校验**：它只做一次存在性检查（`fs.existsSync`），然后按固定路径
  `assets/DS.Desktop.Whale.exe` 启动该程序。**被替换/篡改的 exe 会被直接执行** ——
  请自行确认 exe 来源可信，必要时校验哈希或数字签名。
- **路径固定、无拼接**：exe 路径来自包内常量（不拼接用户输入或环境变量），
  但仍建议不要把 `assets/` 放在其他用户可写的目录里。
- **权限**：请以普通用户权限运行 DSH，不要用管理员权限启动来源不明的程序。
- **无担保**：本插件按「原样」提供，作者不对使用本插件或外部 exe 造成的损失负责。

## 说明

- 本插件与上游两个项目、以及 **DeepSeek 官方均无任何关联**，未获其授权或认可；「DS / DeepSeek」
  相关名称与角色权利属于各自所有者。本项目为非官方插件。
- 本插件与上游项目**无代码/素材共用**，只是按路径（可配置）拉起并回收一个由使用者提供的 exe。
