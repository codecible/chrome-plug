# Chrome Extension Icon Generator

将 PNG 图片转换为 Chrome 扩展标准图标尺寸的技能工具。

## 功能特性

- ✅ 自动生成 Chrome 扩展标准图标尺寸：16×16、32×32、48×48、128×128
- ✅ 高质量图片缩放（LANCZOS 算法，4 级抗锯齿）
- ✅ 透明度保留（RGBA 模式）
- ✅ 智能居中裁剪（非正方形图片自动裁剪为正方形）
- ✅ PNG 文件优化（减小文件大小）
- ✅ 支持单文件和批量处理
- ✅ 文件大小验证和警告

## Chrome 扩展图标规范

根据 Chrome 官方规范和最佳实践：

| 尺寸 | 用途 | 推荐文件大小 |
|------|------|-------------|
| 16×16 | 扩展图标（favicon） | ~1KB |
| 32×32 | Windows 等系统 | ~2KB |
| 48×48 | 扩展管理页面 | ~4KB |
| 128×128 | Chrome 网上应用店、安装时显示 | 15-25KB |

**文件格式要求：**
- 格式：PNG
- 色彩模式：RGBA（支持透明背景）
- 推荐源图尺寸：≥128×128 像素（越大越好）

## 使用方法

### 方式 1：通过 Claude Code 调用（推荐）

在 Claude Code 中直接调用技能：

```
使用 icon-generator 技能，将 logo.png 转换为 Chrome 扩展图标
```

### 方式 2：命令行直接调用

#### 转换单个文件（默认输出到 ./icons/）

```bash
python .claude/skills/icon-generator/icon_converter.py logo.png
```

#### 指定输出目录

```bash
python .claude/skills/icon-generator/icon_converter.py logo.png -o ./output
```

#### 自定义文件名前缀

```bash
python .claude/skills/icon-generator/icon_converter.py logo.png --prefix myapp
```

输出文件将为：`myapp16.png`, `myapp32.png`, `myapp48.png`, `myapp128.png`

#### 批量处理目录中的所有 PNG

```bash
python .claude/skills/icon-generator/icon_converter.py ./images/ -o ./all_icons
```

### 方式 3：通过 handler.py（MCP 工具方式）

```bash
echo '{"tool":"generate_icons","args":{"input_path":"logo.png"}}' | python .claude/skills/icon-generator/handler.py
```

## 输出示例

**输入：**
```
logo.png (512×512, RGBA)
```

**输出：**
```
icons/
├── icon16.png   (16×16, ~1.2KB)
├── icon32.png   (32×32, ~2.4KB)
├── icon48.png   (48×48, ~4.5KB)
└── icon128.png  (128×128, ~18.3KB)
```

## 在 manifest.json 中使用

生成图标后，在 Chrome 扩展的 `manifest.json` 中引用：

```json
{
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0",
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "action": {
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  }
}
```

## 处理流程

```
输入验证 → 图片加载 → RGBA转换 → 正方形裁剪 → 多尺寸缩放 → 优化保存
```

1. **输入验证**：检查文件存在性、格式（必须是 PNG）
2. **图片加载**：使用 Pillow 加载图片
3. **RGBA 转换**：转换为 RGBA 模式以保留透明度
4. **正方形裁剪**：如果图片非正方形，居中裁剪为正方形
5. **多尺寸缩放**：使用 LANCZOS 算法生成 4 种标准尺寸
6. **优化保存**：使用 PNG 优化选项减小文件大小

## 最佳实践

### 推荐的源图片要求

- **尺寸**：≥512×512 像素（更大更好）
- **格式**：PNG
- **形状**：正方形（避免裁剪）
- **内容**：主体居中，四周留适当边距
- **背景**：透明背景（RGBA）或纯色背景

### 图片质量建议

- 如果源图尺寸 <128px，工具会显示警告
- 源图越大，缩小后的小尺寸图标质量越好
- 建议使用矢量图（SVG）导出为高分辨率 PNG 后再转换

### 文件大小控制

工具会自动检查生成的图标文件大小，如果超过以下阈值会显示警告：

- 16×16: >3KB
- 32×32: >5KB
- 48×48: >10KB
- 128×128: >50KB

## 依赖项

- **Python**: 3.7+
- **Pillow**: ≥10.0.0

### 安装依赖

```bash
pip install -r .claude/skills/icon-generator/requirements.txt
```

或直接安装：

```bash
pip install Pillow
```

## 故障排除

### 问题：提示 "需要安装 Pillow 库"

**解决方案：**
```bash
pip install Pillow
```

### 问题：生成的图标模糊

**原因：** 源图尺寸太小

**解决方案：** 使用 ≥512px 的高分辨率源图片

### 问题：非正方形图片被裁剪了重要内容

**原因：** 智能裁剪默认居中裁剪

**解决方案：**
1. 使用图片编辑工具（如 Photoshop、GIMP）手动裁剪为正方形
2. 或者在源图四周添加透明边距，使其成为正方形

### 问题：文件大小过大

**原因：** 源图包含过多细节或使用了高色深

**解决方案：**
- 简化图标设计（Chrome 图标通常设计简洁）
- 确保源图是 PNG 格式（不是 BMP 等未压缩格式）
- 工具已自动使用 PNG 优化，通常无需额外处理

## 技术细节

### 图片处理算法

- **重采样算法**：LANCZOS（Pillow 9.0+）或 Image.LANCZOS（旧版本兼容）
- **抗锯齿级别**：4 级
- **色彩空间**：RGBA（32 位）
- **PNG 优化**：启用（`optimize=True`）

### 裁剪策略

非正方形图片处理：
```python
# 取较小边作为正方形尺寸
size = min(width, height)

# 居中裁剪
left = (width - size) // 2
top = (height - size) // 2
```

## 项目结构

```
.claude/skills/icon-generator/
├── skill.json          # 技能配置文件
├── handler.py          # MCP 工具处理器
├── icon_converter.py   # 核心转换脚本
├── requirements.txt    # Python 依赖
└── README.md           # 本文档
```

## 版本历史

### v1.0.0 (2026-02-03)
- ✨ 初始版本
- ✅ 支持标准 Chrome 扩展图标尺寸生成
- ✅ 高质量 LANCZOS 缩放
- ✅ 透明度保留
- ✅ 智能裁剪
- ✅ PNG 优化
- ✅ 批量处理支持

## 许可证

本技能工具作为项目的一部分，遵循项目许可证。

## 参考资料

- [Chrome 扩展官方文档 - Icons](https://developer.chrome.com/docs/extensions/mv3/manifest/icons/)
- [Pillow 文档](https://pillow.readthedocs.io/)
