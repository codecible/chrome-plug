# PNG图标转换器需求文档

## 需求场景具体处理逻辑
为用户提供一个简洁高效的PNG图片转换工具，能够将任意PNG图片调整为Chrome扩展插件所需的标准尺寸（16x16, 32x32, 48x48, 128x128像素），支持批量处理和自动命名。

## 架构技术方案
- **Python实现**：使用Pillow(PIL)库进行图片处理
- **命令行界面**：简单易用的脚本工具
- **文件模式**：支持单个文件处理和批量目录处理
- **输出格式**：保持PNG格式，支持透明度处理

## 影响文件
- **新增文件**：`scripts/icon_converter.py`（项目根目录下的scripts目录）
- **新增目录**：`scripts/`（现在已存在）
- **影响类型**：纯新增Python工具脚本，不影响现有Chrome扩展项目结构
- **主要函数**：`resize_image()`, `process_single_file()`, `process_directory()`, `main()`

## 实现细节

### 核心处理逻辑
```python
def resize_image(input_path, size, output_path):
    """将图片调整为指定尺寸，保持宽高比并居中放置"""
    with Image.open(input_path) as img:
        # 创建透明背景
        background = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        
        # 计算缩放比例和位置
        img = img.convert('RGBA')
        img.thumbnail((size, size), Image.Resampling.LANCZOS)
        
        # 居中放置图片
        x = (size - img.width) // 2
        y = (size - img.height) // 2
        background.paste(img, (x, y), img)
        
        background.save(output_path, 'PNG')
```

### 文件处理逻辑
```python
def process_single_file(input_path, output_dir=None):
    """处理单个文件，生成所有标准尺寸"""
    base_name = os.path.splitext(os.path.basename(input_path))[0]
    if output_dir is None:
        output_dir = os.path.dirname(input_path)
    
    standard_sizes = [16, 32, 48, 128]
    created_files = []
    
    for size in standard_sizes:
        output_filename = f"{base_name}{size}.png"
        output_path = os.path.join(output_dir, output_filename)
        resize_image(input_path, size, output_path)
        created_files.append(output_path)
    
    return created_files
```

### 批量处理支持
```python
def process_directory(input_dir, output_dir=None):
    """处理目录下所有PNG文件"""
    if output_dir is None:
        output_dir = input_dir
    
    png_files = glob.glob(os.path.join(input_dir, "*.png"))
    results = {}
    
    for png_file in png_files:
        results[png_file] = process_single_file(png_file, output_dir)
    
    return results
```

### 主函数和参数解析
```python
def main():
    parser = argparse.ArgumentParser(description='PNG图标转换器 - Chrome扩展专用')
    parser.add_argument('input', help='输入文件路径或目录路径')
    parser.add_argument('-o', '--output', help='输出目录路径')
    parser.add_argument('--size', type=int, help='自定义尺寸（覆盖默认尺寸）')
    
    args = parser.parse_args()
    
    # 确保scripts目录存在
    script_dir = os.path.dirname(os.path.abspath(__file__))
    if not os.path.exists(script_dir):
        os.makedirs(script_dir)
```

## 边界条件与异常处理
- **文件验证**：检查输入文件是否存在且为有效PNG格式
- **尺寸验证**：确保输出尺寸为正整数
- **目录处理**：自动创建不存在的输出目录
- **错误处理**：友好的错误消息和堆栈跟踪

## 数据流动路径
1. 用户输入文件路径 → 参数解析
2. 文件读取 → 尺寸验证 → 图片处理
3. 缩放计算 → 透明度处理 → 保存输出
4. 结果汇总 → 用户反馈

## 预期成果
- 一个独立的`scripts/icon_converter.py`文件
- 支持命令行调用：`python scripts/icon_converter.py input.png`
- 自动生成`input16.png`, `input32.png`, `input48.png`, `input128.png`
- 支持批量处理：`python scripts/icon_converter.py ./images/`
- 提供详细的处理进度和结果报告