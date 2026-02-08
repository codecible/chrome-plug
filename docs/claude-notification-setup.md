# Claude Code 飞书通知配置文档

> **最后更新**: 2026-02-04
> **状态**: ✅ 已配置完成
> **通知方式**: 飞书自定义机器人

---

## 📋 目录

1. [需求背景](#需求背景)
2. [配置项](#配置项)
3. [快速开始指南](#快速开始指南)
5. [技术实现细节](#技术实现细节)
6. [附录](#附录)
---

## 需求背景

在使用 Claude Code 进行编程时,经常需要等待 Claude 的确认或任务完成通知。为了避免一直盯着 VSCode 窗口,需要一个远程通知方案,能在手机上实时接收通知。

**核心需求**:
- 当 Claude 需要用户确认时,发送通知
- 当后台任务完成时,发送通知
- 支持手机推送,响应及时(1-3秒)
- 消息格式美观,易于阅读

---

## 配置项

### 1. 文件结构

```
~/.claude/
├── settings.json          # Claude 全局配置 (已添加 hooks)
└── scripts/
    └── notify-feishu.sh   # 飞书通知脚本
```

```
/Users/wanghaokun/code/chrome-plug/
├── .claude/
│   └── settings.local.json  # 项目级配置
└── docs/
    └── claude-notification-setup.md  # 本文档
```

### 2. 核心配置文件

#### `~/.claude/settings.json`

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "AskUserQuestion",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/scripts/notify-feishu.sh '🤔 Claude 需要您的确认' '**项目**: '$(basename \"$PWD\")'\\n**时间**: '$(date '+%H:%M:%S')'\\n\\n请返回 VSCode 查看详情'",
            "async": true
          }
        ]
      },
      {
        "matcher": "TaskComplete",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/scripts/notify-feishu.sh '✅ 任务已完成' '**项目**: '$(basename \"$PWD\")'\\n**时间**: '$(date '+%H:%M:%S')'\\n\\n请查看执行结果'",
            "async": true
          }
        ]
      }
    ]
  }
}
```

**配置说明**:
- `Notification`: 通知事件类型
- `matcher`: 触发条件(AskUserQuestion/TaskComplete)
- `async: true`: 异步执行,不阻塞 Claude 工作
- `$(basename "$PWD")`: 动态获取当前项目名称
- `$(date '+%H:%M:%S')`: 获取当前时间

---

## 快速开始指南

### 第一步: 创建飞书自定义机器人

1. 打开**飞书**,进入任意群聊(或创建"Claude通知"群)
2. 点击右上角 **···** → **设置** → **群机器人**
3. 点击 **添加机器人** → 选择 **自定义机器人**
4. 配置机器人:
   - **名称**: Claude 助手
   - **描述**: Claude Code 任务通知
   - **安全设置**: 不设置或选择"签名校验"
5. **复制 Webhook 地址**

### 第二步: 配置 Webhook URL

```bash
# 编辑脚本
open -e ~/.claude/scripts/notify-feishu.sh

# 找到这一行
WEBHOOK_URL="YOUR_FEISHU_WEBHOOK_URL_HERE"

# 替换为你的实际地址
WEBHOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/xxxxx-xxxx-xxxx"
```

### 第三步: 测试通知

```bash
# 执行测试命令
~/.claude/scripts/notify-feishu.sh "修复测试" "项目: chrome-plug\n时间: $(date '+%H:%M:%S')\n\n这次应该只会收到一条消息了！"          
```

如果配置正确,您的飞书会立即收到测试消息!

---

## 技术实现细节

### 1. Claude Hooks 机制

Claude Code 支持在特定事件时触发自定义命令,通过 `settings.json` 中的 `hooks` 字段配置。

**支持的事件类型**:
- `Notification.AskUserQuestion` - Claude 需要用户回答问题
- `Notification.TaskComplete` - 后台任务完成
- `PreToolUse` - 工具使用前
- `PostToolUse` - 工具使用后
- `SessionStart` - 会话开始
- `SessionEnd` - 会话结束

**Hook 类型**:
- `command` - 执行 Shell 命令
- `prompt` - LLM 提示词处理
- `agent` - 代理验证

### 2. 飞书消息卡片格式

飞书支持以下消息类型:
- `text` - 纯文本
- `post` - 富文本
- `interactive` - 消息卡片 ⭐ 当前使用

消息卡片优势:
- 支持标题栏(可自定义颜色)
- 支持 Markdown 格式
- 支持按钮交互
- 支持图片、链接

**卡片结构**:
```json
{
  "msg_type": "interactive",
  "card": {
    "header": { /* 标题栏 */ },
    "elements": [ /* 内容区 */ ]
  }
}
```

### 3. 通知去重逻辑

为避免频繁通知打扰,实现了简单的去重机制:

```bash
LOCK_FILE="/tmp/claude_notify_feishu_${PROJECT_NAME}.lock"

# 检查上次通知时间
if [ -f "$LOCK_FILE" ]; then
  LAST_TIME=$(cat "$LOCK_FILE")
  NOW=$(date +%s)

  # 10秒内不重复通知
  if [ $((NOW - LAST_TIME)) -lt 10 ]; then
    exit 0
  fi
fi

# 记录本次通知时间
echo $(date +%s) > "$LOCK_FILE"
```

**去重策略**:
- 按项目名称隔离(不同项目独立计时)
- 时间窗口: 10秒
- 存储位置: `/tmp/` (系统重启自动清理)

### 4. 失败重试机制

网络不稳定时,自动重试最多3次:

```bash
for i in {1..3}; do
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" ...)

  HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
  BODY=$(echo "$RESPONSE" | head -n -1)

  if [ "$HTTP_CODE" = "200" ]; then
    # 检查飞书 API 返回码
    if echo "$BODY" | grep -q '"code":0'; then
      exit 0  # 成功
    fi
  fi

  [ $i -lt 3 ] && sleep 1  # 重试前等待1秒
done
```

---

## 附录

### 相关资源

- [Claude Code 官方文档](https://github.com/anthropics/claude-code)
- [飞书开放平台文档](https://open.feishu.cn/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN)
- [飞书消息卡片搭建工具](https://open.feishu.cn/tool/cardbuilder)

### 常用命令速查

```bash
# 编辑脚本
open -e ~/.claude/scripts/notify-feishu.sh

# 测试通知
~/.claude/scripts/notify-feishu.sh "标题" "内容"

# 查看 hooks 配置
cat ~/.claude/settings.json | jq '.hooks'

# 清理锁文件
rm /tmp/claude_notify_feishu_*.lock

# 查看脚本权限
ls -lh ~/.claude/scripts/

# 查看最近的通知日志(如果有)
tail -f /tmp/claude_notify.log
```

### 版本历史

- **v1.0** (2026-02-04)
  - ✅ 初始版本
  - ✅ 支持飞书消息卡片
  - ✅ 通知去重机制
  - ✅ 失败重试机制
  - ✅ AskUserQuestion 和 TaskComplete 事件
