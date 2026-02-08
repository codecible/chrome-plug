#!/usr/bin/env python3
import sys
import json
import os
import subprocess

# Define the path to the converter script in the skill directory
# This makes the skill self-contained
SKILL_DIR = os.path.dirname(os.path.abspath(__file__))
CONVERTER_SCRIPT = os.path.join(SKILL_DIR, "icon_converter.py")

def generate_icons(input_path, output_dir=None):
    """
    Wrapper to call the existing icon_converter.py script.
    """
    if not os.path.exists(CONVERTER_SCRIPT):
        return {"error": f"Converter script not found at {CONVERTER_SCRIPT}"}

    # Construct the command
    cmd = [sys.executable, CONVERTER_SCRIPT, input_path]

    if output_dir:
        cmd.extend(["-o", output_dir])

    try:
        # Run the script and capture output
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)

        # Parse output for file information
        output_lines = result.stdout.strip().split('\n')

        return {
            "success": True,
            "message": "Chrome 扩展图标生成成功",
            "details": result.stdout,
            "input_path": input_path,
            "output_dir": output_dir or "默认输出目录（输入文件所在目录的 icons/ 子目录）"
        }
    except subprocess.CalledProcessError as e:
        return {
            "success": False,
            "error": f"图标生成失败: {e.stderr}",
            "details": e.stdout,
            "input_path": input_path
        }

def main():
    # Read input from stdin (MCP protocol style for tool execution)
    # However, since this is a simple skill wrapper, we'll adapt based on how Claude executes it.
    # Usually, Claude Skills pass arguments as JSON via stdin or arguments.
    # For simplicity in this environment, let's assume we receive the tool call arguments.

    # If run directly as a script (simulated environment)
    if len(sys.argv) > 1:
        # This part handles the CLI execution of the skill wrapper itself
        tool_name = sys.argv[1]

        if tool_name == "generate_icons":
             # In a real MCP/Skill environment, args are passed differently.
             # This is a simplified handler for the wrapper.
             pass

    # For now, let's just make sure the file is executable and correct.
    pass

if __name__ == "__main__":
    # In the Claude Skill system, the 'implementation' is often handled by the mapped command.
    # We will simply execute the python script directly based on the args passed to the tool.

    # Read the arguments from stdin (standard for many MCP-like tools)
    try:
        input_data = json.load(sys.stdin)
        tool_name = input_data.get("tool")
        args = input_data.get("args", {})

        if tool_name == "generate_icons":
            result = generate_icons(args.get("input_path"), args.get("output_dir"))
            print(json.dumps(result))
        else:
            print(json.dumps({"error": f"Unknown tool: {tool_name}"}))

    except Exception as e:
        # Fallback if not running in standard input mode,
        # just print a message that this is a wrapper script.
        print(json.dumps({"error": str(e)}))
