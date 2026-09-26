// DSH 插件：随 DSH 启动/关闭 独立桌面版鲸鱼（DS.Desktop.Whale.exe）
//
// 该插件不注入 Web UI，而是在 DSH Host 启动时拉起桌面上独立运行的鲸鱼 exe，
// DSH 退出时将其整树关闭，从而像其它 DSH 插件一样由 DSH 管理生命周期。
//
// ── 关于那个 exe（重要）────────────────────────────────────────────────
// exe 是 **Tauri（Rust + WebView2）** 应用，改造自：
//   · xiaolinnnnnnn/DeepSeek-Balance-Whale-Widget（Tauri v2 Windows 桌面版，
//     fork 自 MeteorNOX 的 MIT 项目，但该 fork 自身没有 LICENSE）
//   · QCYTSN/dsh-dafeiyu（大肥鱼桌宠，其角色美术明确不在 MIT 覆盖范围内）
// 因此 **exe 不可公开分发**；本插件文件本身不含上游代码与美术，只是拉起
// assets/ 下用户自备的 exe，可独立使用（请勿连同 exe 一起发布）。
// ──────────────────────────────────────────────────────────────────────
// ── 免责声明 ─────────────────────────────────────────────────────────
// 本插件与上述上游项目、以及 DeepSeek 官方**均无任何关联**，未获其授权或认可。
// 它只提供「按路径拉起 / 回收进程」的生命周期管理：不包含、不分发任何第三方代码
// 或美术资源，也不做任何完整性校验（见 README「安全注意事项」）。
// ──────────────────────────────────────────────────────────────────────
import { spawn, execFile } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// exe 路径可配置（二选一）：
//   ① 环境变量 DSH_DESKTOP_WHALE_EXE 指向任意位置的 exe（推荐，便于放在任意目录）
//   ② 否则使用包内 assets/DS.Desktop.Whale.exe（该目录不入库，需你自备）
const EXE = process.env.DSH_DESKTOP_WHALE_EXE
  ? path.resolve(process.env.DSH_DESKTOP_WHALE_EXE)
  : path.join(PACKAGE_ROOT, 'assets', 'DS.Desktop.Whale.exe')
const EXE_NAME = path.basename(EXE)   // 结束进程树时按镜像名匹配

const name = 'dsh-desktop-whale'
const inject = []

function log(ctx, msg) {
  try {
    if (ctx && ctx.logger && ctx.logger.info) ctx.logger.info('[dsh-desktop-whale] ' + msg)
    else console.log('[dsh-desktop-whale] ' + msg)
  } catch (err) { /* ignore */ }
}

function killAllWhale() {
  // Windows：按镜像名杀整棵进程树（Tauri 主进程 + 其 WebView2 子进程）
  execFile('taskkill', ['/F', '/T', '/IM', EXE_NAME], { windowsHide: true }, () => {})
}

function apply(ctx) {
  let proc = null

  function startWhale() {
    if (proc && !proc.killed) return
    if (!fs.existsSync(EXE)) {
      log(ctx, `exe not found: ${EXE}`)
      return
    }
    // 先清理可能残留/手动启动的旧实例，避免双开
    killAllWhale()
    setTimeout(() => {
      try {
        proc = spawn(EXE, [], { cwd: PACKAGE_ROOT, detached: false, stdio: 'ignore' })
        proc.on('exit', () => { proc = null })
        proc.on('error', () => { proc = null })
        log(ctx, 'started')
      } catch (err) {
        log(ctx, 'spawn failed: ' + err)
      }
    }, 800)
  }

  startWhale()
  ctx.effect(() => () => {
    killAllWhale()
    proc = null
    log(ctx, 'stopped')
  })
}

export { name, inject, apply }
