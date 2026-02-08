# Chrome书签清除插件需求文档

## 需求场景具体处理逻辑
开发一个Chrome扩展插件，用户点击插件图标后的弹窗界面中显示"清除bookmark"按钮。点击该按钮后，插件会安全地清除当前Chrome浏览器中的所有书签。

### 用户交互流程
1. 用户点击浏览器工具栏中的插件图标
2. 弹出界面显示"清除bookmark"按钮
3. 用户点击按钮后，显示确认对话框
4. 用户确认后，执行书签清除操作
5. 显示操作结果（成功/失败）

## 架构技术方案
### 技术栈
- Chrome Extension Manifest V3
- HTML + CSS + JavaScript
- Chrome Bookmarks API

### 核心组件
1. **manifest.json** - 插件配置文件，声明书签权限
2. **popup.html** - 弹出窗口用户界面
3. **popup.js** - 处理和清除逻辑
4. **background.js** - 后台服务（用于权限管理）

## 影响文件
### 新建文件
- `BookmarkCleaner/manifest.json` - 插件配置文件
- `BookmarkCleaner/popup.html` - 用户界面
- `BookmarkCleaner/popup.js` - 核心逻辑
- `BookmarkCleaner/styles.css` - 样式文件
- `BookmarkCleaner/icons/` - 图标文件夹（16x16, 48x48, 128x128）

### 修改类型
- 新增完整的独立插件结构
- 使用Chrome Bookmarks API进行书签管理
- 添加用户交互界面和安全确认机制

## 实现细节

### manifest.json 关键配置
```json
{
  "manifest_version": 3,
  "name": "书签清除工具",
  "version": "1.0.0",
  "description": "安全清除浏览器书签的工具",
  "permissions": ["bookmarks"],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png", 
      "128": "icons/icon128.png"
    }
  }
}
```

### popup.html 界面设计
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h3>书签管理</h3>
        <button id="clearBookmarks" class="danger-button">
            清除所有书签
        </button>
        <div id="status"></div>
    </div>
    <script src="popup.js"></script>
</body>
</html>
```

### popup.js 核心逻辑
```javascript
document.addEventListener('DOMContentLoaded', function() {
    const clearButton = document.getElementById('clearBookmarks');
    const statusDiv = document.getElementById('status');
    
    clearButton.addEventListener('click', function() {
        if (confirm('确定要清除所有书签吗？此操作无法撤销！')) {
            clearAllBookmarks();
        }
    });
    
    async function clearAllBookmarks() {
        try {
            statusDiv.textContent = '正在清除书签...';
            clearButton.disabled = true;
            
            // 获取书签树
            const tree = await chrome.bookmarks.getTree();
            
            // 递归删除所有书签
            await deleteBookmarkTree(tree[0]);
            
            statusDiv.textContent = '书签清除完成！';
            statusDiv.className = 'success';
        } catch (error) {
            statusDiv.textContent = '清除失败: ' + error.message;
            statusDiv.className = 'error';
        } finally {
            clearButton.disabled = false;
        }
    }
    
    async function deleteBookmarkTree(node) {
        if (node.children) {
            for (const child of node.children) {
                await deleteBookmarkTree(child);
            }
        }
        
        // 跳过根节点
        if (node.id !== '0' && node.id !== '1' && node.id !== '2') {
            await chrome.bookmarks.remove(node.id);
        }
    }
});
```

## 边界条件与异常处理
1. **权限检查**：确保用户已授权书签权限
2. **网络环境**：本地操作，不依赖网络
3. **浏览器兼容性**：支持Chrome 88+（Manifest V3）
4. **错误处理**：捕获API调用异常，提供友好错误信息
5. **撤销保护**：添加确认对话框防止误操作

## 数据流动路径
1. 用户点击插件图标 → popup.html加载
2. 用户点击清除按钮 → JavaScript事件触发
3. 显示确认对话框 → 用户确认
4. 调用chrome.bookmarks.getTree() → 获取书签结构
5. 递归遍历书签树 → 逐个删除书签节点
6. 显示操作结果 → 用户反馈

## 预期成果
1. 功能完整的Chrome插件，可安全清除所有书签
2. 用户友好的界面和交互体验
3. 完善的错误处理和用户反馈机制
4. 符合Chrome Web Store发布标准的代码结构