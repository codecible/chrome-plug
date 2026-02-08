#!/usr/bin/env python3
"""
Chrome Extension Icon Converter
将 PNG 图片转换为 Chrome 扩展标准图标尺寸（16、32、48、128px）

使用方法:
    python icon_converter.py input.png [-o output_dir]
    python icon_converter.py ./images/ [-o output_dir]
"""

import os
import sys
import argparse
from pathlib import Path
from typing import List, Tuple, Optional

try:
    from PIL import Image
except ImportError:
    print("错误: 需要安装 Pillow 库")
    print("请运行: pip install Pillow")
    sys.exit(1)

# Chrome 扩展标准图标尺寸
STANDARD_SIZES = [16, 32, 48, 128]

# 文件大小警告阈值（字节）
SIZE_WARNINGS = {
    16: 3 * 1024,      # 3KB
    32: 5 * 1024,      # 5KB
    48: 10 * 1024,     # 10KB
    128: 50 * 1024,    # 50KB
}


class IconConverter:
    """Chrome 扩展图标转换器"""

    def __init__(self, verbose: bool = True):
        self.verbose = verbose
        self.results = []

    def log(self, message: str):
        """打印日志信息"""
        if self.verbose:
            print(message)

    def validate_input(self, input_path: Path) -> bool:
        """验证输入文件"""
        if not input_path.exists():
            raise FileNotFoundError(f"输入路径不存在: {input_path}")

        if input_path.is_file():
            if input_path.suffix.lower() != '.png':
                raise ValueError(f"仅支持 PNG 格式: {input_path}")

        return True

    def smart_crop_square(self, image: Image.Image) -> Image.Image:
        """
        智能裁剪为正方形
        居中裁剪，保持主体内容在中心区域
        """
        width, height = image.size

        if width == height:
            return image

        # 计算正方形尺寸（取较小边）
        size = min(width, height)

        # 计算裁剪区域（居中）
        left = (width - size) // 2
        top = (height - size) // 2
        right = left + size
        bottom = top + size

        self.log(f"  裁剪: {width}x{height} → {size}x{size} (居中)")

        return image.crop((left, top, right, bottom))

    def resize_image(self, source_image: Image.Image, target_size: int) -> Image.Image:
        """
        使用高质量算法调整图片大小
        LANCZOS 提供 4 级抗锯齿，确保小尺寸图标清晰
        """
        # 兼容不同版本的 Pillow
        try:
            resampling = Image.Resampling.LANCZOS
        except AttributeError:
            resampling = Image.LANCZOS

        return source_image.resize(
            (target_size, target_size),
            resample=resampling
        )

    def process_image(self, image_path: Path) -> Image.Image:
        """
        处理图片：加载、转换模式、裁剪
        """
        self.log(f"\n处理图片: {image_path.name}")

        # 加载图片
        try:
            img = Image.open(image_path)
        except Exception as e:
            raise ValueError(f"无法打开图片 {image_path}: {e}")

        # 显示原始尺寸
        width, height = img.size
        self.log(f"  原始尺寸: {width}x{height}")

        # 检查最小尺寸建议
        min_size = min(width, height)
        if min_size < 128:
            self.log(f"  ⚠️  警告: 图片尺寸较小 ({min_size}px)，建议使用 ≥128px 的源图片以获得更好质量")

        # 转换为 RGBA 模式（保留透明度）
        if img.mode != 'RGBA':
            self.log(f"  转换模式: {img.mode} → RGBA")
            img = img.convert('RGBA')

        # 裁剪为正方形
        img = self.smart_crop_square(img)

        return img

    def save_icon(self, image: Image.Image, output_path: Path, size: int) -> dict:
        """
        保存优化的图标文件
        返回文件信息字典
        """
        # 调整尺寸
        resized = self.resize_image(image, size)

        # 优化保存
        resized.save(output_path, 'PNG', optimize=True)

        # 获取文件大小
        file_size = output_path.stat().st_size
        file_size_kb = file_size / 1024

        # 检查文件大小
        warning = ""
        if file_size > SIZE_WARNINGS.get(size, float('inf')):
            warning = " ⚠️  文件较大"

        self.log(f"  ✓ {size}x{size}: {output_path.name} ({file_size_kb:.1f}KB){warning}")

        return {
            "size": f"{size}x{size}",
            "path": str(output_path),
            "size_bytes": file_size,
            "size_kb": round(file_size_kb, 2)
        }

    def convert_single_file(self,
                           input_path: Path,
                           output_dir: Optional[Path] = None,
                           prefix: str = "icon") -> List[dict]:
        """
        转换单个 PNG 文件

        Args:
            input_path: 输入 PNG 文件路径
            output_dir: 输出目录（默认为输入文件所在目录的 icons/ 子目录）
            prefix: 输出文件名前缀

        Returns:
            生成的文件信息列表
        """
        # 验证输入
        self.validate_input(input_path)

        # 确定输出目录
        if output_dir is None:
            output_dir = input_path.parent / "icons"

        # 创建输出目录
        output_dir.mkdir(parents=True, exist_ok=True)
        self.log(f"\n输出目录: {output_dir}")

        # 处理图片
        source_image = self.process_image(input_path)

        # 生成各种尺寸
        self.log(f"\n生成图标:")
        generated_files = []

        for size in STANDARD_SIZES:
            output_filename = f"{prefix}{size}.png"
            output_path = output_dir / output_filename

            file_info = self.save_icon(source_image, output_path, size)
            generated_files.append(file_info)

        self.log(f"\n✅ 成功生成 {len(generated_files)} 个图标文件")

        return generated_files

    def convert_directory(self,
                         input_dir: Path,
                         output_dir: Optional[Path] = None) -> dict:
        """
        批量转换目录中的所有 PNG 文件

        Args:
            input_dir: 输入目录
            output_dir: 输出目录（默认为每个文件所在目录的 icons/ 子目录）

        Returns:
            转换结果字典
        """
        # 查找所有 PNG 文件
        png_files = list(input_dir.glob("*.png"))

        if not png_files:
            raise ValueError(f"目录中没有找到 PNG 文件: {input_dir}")

        self.log(f"\n找到 {len(png_files)} 个 PNG 文件")

        results = {}
        for png_file in png_files:
            try:
                # 使用文件名（不含扩展名）作为前缀
                prefix = png_file.stem

                # 如果指定了输出目录，为每个文件创建子目录
                if output_dir:
                    file_output_dir = output_dir / prefix
                else:
                    file_output_dir = None

                generated_files = self.convert_single_file(
                    png_file,
                    file_output_dir,
                    prefix=prefix
                )

                results[str(png_file)] = {
                    "success": True,
                    "files": generated_files
                }

            except Exception as e:
                self.log(f"\n❌ 处理失败 {png_file.name}: {e}")
                results[str(png_file)] = {
                    "success": False,
                    "error": str(e)
                }

        # 统计
        success_count = sum(1 for r in results.values() if r.get("success"))
        self.log(f"\n\n批量转换完成: {success_count}/{len(png_files)} 成功")

        return results

    def convert(self,
                input_path: str,
                output_dir: Optional[str] = None,
                prefix: str = "icon") -> dict:
        """
        主转换方法
        自动检测输入是文件还是目录

        Args:
            input_path: 输入路径（文件或目录）
            output_dir: 输出目录
            prefix: 文件名前缀（仅用于单文件转换）

        Returns:
            转换结果字典
        """
        input_path = Path(input_path).resolve()
        output_dir = Path(output_dir).resolve() if output_dir else None

        try:
            if input_path.is_file():
                # 单文件转换
                generated_files = self.convert_single_file(input_path, output_dir, prefix)
                return {
                    "success": True,
                    "mode": "single_file",
                    "input": str(input_path),
                    "output_dir": str(output_dir or input_path.parent / "icons"),
                    "files": generated_files
                }

            elif input_path.is_dir():
                # 批量转换
                results = self.convert_directory(input_path, output_dir)
                return {
                    "success": True,
                    "mode": "batch",
                    "input": str(input_path),
                    "results": results
                }

            else:
                raise ValueError(f"输入路径无效: {input_path}")

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


def main():
    """命令行入口"""
    parser = argparse.ArgumentParser(
        description="将 PNG 图片转换为 Chrome 扩展标准图标尺寸",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 转换单个文件（输出到 ./icons/）
  python icon_converter.py logo.png

  # 转换单个文件到指定目录
  python icon_converter.py logo.png -o ./output

  # 批量转换目录中的所有 PNG
  python icon_converter.py ./images/ -o ./all_icons

  # 自定义文件名前缀
  python icon_converter.py logo.png --prefix myapp
        """
    )

    parser.add_argument(
        'input_path',
        help='输入 PNG 文件或目录路径'
    )

    parser.add_argument(
        '-o', '--output',
        dest='output_dir',
        help='输出目录（默认为输入文件所在目录的 icons/ 子目录）'
    )

    parser.add_argument(
        '--prefix',
        default='icon',
        help='输出文件名前缀（默认: icon）'
    )

    parser.add_argument(
        '-q', '--quiet',
        action='store_true',
        help='安静模式（不显示详细信息）'
    )

    args = parser.parse_args()

    # 创建转换器
    converter = IconConverter(verbose=not args.quiet)

    # 执行转换
    result = converter.convert(
        args.input_path,
        args.output_dir,
        args.prefix
    )

    # 返回状态码
    sys.exit(0 if result.get("success") else 1)


if __name__ == "__main__":
    main()
