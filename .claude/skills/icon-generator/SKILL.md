---
name: icon-generator
description: Convert a PNG image into standard Chrome Extension icon sizes (16, 48, 128px). Use when the user asks to generate, update, or convert icons for a Chrome extension.
---

# Icon Generator Skill

This skill allows Claude to generate standard Chrome Extension icons from a source PNG image.

## Usage

When activated, Claude will use the following tools to generate icons:

### generate_icons

**Description:** Generate Chrome extension icons (16x16, 48x48, 128x128) from a source PNG.

**Implementation Logic:**
The skill uses the `sharp` library to resize the input image.

**Parameters:**
- `input_path`: Path to the input PNG file.
- `output_dir`: (Optional) Directory to save the icons. Defaults to the same directory as the input.

## Examples

- "Generate icons for my extension from src/logo.png"
- "Convert this image into chrome icons"
