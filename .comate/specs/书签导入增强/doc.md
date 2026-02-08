# 书签导入增强需求文档

## 需求背景
当前BookmarkCleaner扩展只具备清除书签功能，需要增加导入书签功能，支持用户导入类似#bookmarks_2026_2_3.html格式的书签文件，并且在导入前自动清空现有书签并提示用户确认。

## 需求场景
1. 用户点击扩展图标打开弹窗界面
2. 新增"导入书签"按钮，点击后弹出文件选择器
3. 用户选择HTML格式的书签文件
4. 系统显示文件内容预览和统计信息
5. 警告用户导入操作将清除现有书签
6. 双重确认后执行导入操作
7. 显示导入进度和结果

## 架构技术方案

### 核心功能模块
1. **文件选择器模块**
   - 使用 `<input type="file">` 选择HTML书签文件
   - 支持文件类型过滤（.html）

2. **HTML解析器模块**
   - 解析NETSCAPE-Bookmark-file-1格式
   - 提取文件夹结构和书签URL
   - 统计书签数量和层级关系

3. **书签导入引擎**
   - 使用 `chrome.bookmarks.create()` API
   - 递归创建文件夹和书签
   - 处理导入过程中的错误和异常

4. **用户界面更新**
   - 动态显示导入进度
   - 成功/失败状态反馈
   - 操作历史记录

### 影响文件
- **BookmarkCleaner/popup.html** - 增加导入按钮界面
- **BookmarkCleaner/popup.js** - 实现导入逻辑
- **BookmarkCleaner/styles.css** - 新增导入相关样式
- **BookmarkCleaner/manifest.json** - 确认已有bookmarks权限

## 实现细节

### HTML解析算法
```javascript
function parseBookmarksHTML(htmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const rootElement = doc.querySelector('DL');
  
  const result = {
    folders: 0,
    bookmarks: 0,
    tree: []
  };
  
  function parseDL(dlElement, parentPath = '') {
    const items = [];
    let currentElement = dlElement.firstElementChild;
    
    while (currentElement) {
      if (currentElement.tagName === 'DT') {
        const h3 = currentElement.querySelector('H3');
        const a = currentElement.querySelector('A');
        
        if (h3) {
          // 文件夹节点
          const folder = {
            type: 'folder',
            title: h3.textContent,
            addDate: h3.getAttribute('ADD_DATE'),
            children: []
          };
          
          const subDL = currentElement.querySelector('DL');
          if (subDL) {
            folder.children = parseDL(subDL, `${parentPath}/${folder.title}`);
          }
          
          items.push(folder);
          result.folders++;
        } else if (a) {
          // 书签节点
          const bookmark = {
            type: 'bookmark',
            title: a.textContent,
            url: a.getAttribute('HREF'),
            addDate: a.getAttribute('ADD_DATE'),
            icon: a.getAttribute('ICON')
          };
          
          items.push(bookmark);
          result.bookmarks++;
        }
      }
      currentElement = currentElement.nextElementSibling;
    }
    
    return items;
  }
  
  result.tree = parseDL(rootElement);
  return result;
}
```

### 书签导入流程
```javascript
async function importBookmarks(bookmarkTree, parentId = '1') {
  let importedCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (const item of bookmarkTree) {
    try {
      if (item.type === 'folder') {
        // 创建文件夹
        const folder = await chrome.bookmarks.create({
          parentId: parentId,
          title: item.title
        });
        
        // 递归导入子项
        const result = await importBookmarks(item.children, folder.id);
        importedCount += result.importedCount + 1; // +1 表示文件夹本身
        errorCount += result.errorCount;
        errors.push(...result.errors);
        
      } else if (item.type === 'bookmark') {
        // 创建书签
        await chrome.bookmarks.create({
          parentId: parentId,
          title: item.title,
          url: item.url
        });
        importedCount++;
      }
      
      // 避免API限制，添加延迟
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      errorCount++;
      errors.push({
        title: item.title,
        error: error.message
      });
    }
  }
  
  return { importedCount, errorCount, errors };
}
```

### UI界面更新
```html
<!-- 新增导入按钮区域 -->
<div class="import-section">
  <button id="importBookmarks" class="import-button">
    <span class="button-icon">📥</span>
    导入书签文件
  </button>
  <input type="file" id="fileInput" accept=".html" style="display: none;">
  
  <div id="importPreview" class="import-preview" style="display: none;">
    <h3>文件预览</h3>
    <div id="previewContent"></div>
    <button id="confirmImport" class="danger-button">确认导入</button>
  </div>
</div>
```

## 边界条件与异常处理

### 文件处理边界
- 文件大小限制：最大10MB
- 格式验证：必须为有效的HTML书签格式
- 编码处理：支持UTF-8编码

### 性能考虑
- 大文件分块处理
- API调用频率限制（添加延迟）
- 进度反馈显示

### 错误处理
- 文件读取错误
- API调用失败
- 网络连接问题
- 权限拒绝

## 数据流动路径
1. 用户选择文件 → 文件读取 → HTML解析 → 预览显示 → 用户确认 → 清空书签 → 递归导入 → 结果反馈

## 预期成果
- 完整的书签导入功能，与现有的清除功能形成完整的管理工具
- 友好的用户界面和操作流程
- 稳定可靠的错误处理机制
- 详细的导入结果反馈