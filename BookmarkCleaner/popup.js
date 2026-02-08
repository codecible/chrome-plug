// 书签清除工具核心逻辑
document.addEventListener('DOMContentLoaded', function() {
    const clearButton = document.getElementById('clearBookmarks');
    const statusDiv = document.getElementById('status');
    
    // 初始化状态显示
    statusDiv.textContent = '准备好清除书签';
    statusDiv.className = 'status-message info';
    
    /**
     * 解析HTML书签文件内容
     */
    function parseBookmarksHTML(htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const rootElement = doc.querySelector('DL');
        
        if (!rootElement) {
            throw new Error('无效的书签文件格式：未找到根DL元素');
        }
        
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
                            title: h3.textContent.trim() || '未命名文件夹',
                            addDate: h3.getAttribute('ADD_DATE') || '',
                            lastModified: h3.getAttribute('LAST_MODIFIED') || '',
                            personalToolbarFolder: h3.getAttribute('PERSONAL_TOOLBAR_FOLDER') === 'true',
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
                        const url = a.getAttribute('HREF');
                        if (url && url.trim() !== '') {
                            const bookmark = {
                                type: 'bookmark',
                                title: a.textContent.trim() || '未命名书签',
                                url: url,
                                addDate: a.getAttribute('ADD_DATE') || '',
                                icon: a.getAttribute('ICON') || ''
                            };
                            
                            items.push(bookmark);
                            result.bookmarks++;
                        }
                    }
                }
                currentElement = currentElement.nextElementSibling;
            }
            
            return items;
        }
        
        result.tree = parseDL(rootElement);
        return result;
    }
    
    /**
     * 验证书签文件内容
     */
    function validateBookmarksFile(content) {
        // 检查基本格式
        if (!content.includes('<!DOCTYPE NETSCAPE-Bookmark-file-1>')) {
            throw new Error('不是有效的书签导出文件');
        }
        
        // 检查是否有书签内容
        if (!content.includes('<DL><p>')) {
            throw new Error('书签文件内容为空');
        }
        
        return true;
    }
    
    /**
     * 统计解析结果
     */
    function getStatsSummary(parsedData) {
        let maxDepth = 0;
        let folderNames = new Set();
        
        function calculateDepth(items, currentDepth = 1) {
            maxDepth = Math.max(maxDepth, currentDepth);
            
            for (const item of items) {
                if (item.type === 'folder') {
                    folderNames.add(item.title);
                    calculateDepth(item.children, currentDepth + 1);
                }
            }
        }
        
        calculateDepth(parsedData.tree);
        
        return {
            totalItems: parsedData.bookmarks + parsedData.folders,
            bookmarks: parsedData.bookmarks,
            folders: parsedData.folders,
            uniqueFolders: folderNames.size,
            maxDepth: maxDepth
        };
    }
    
    // 获取导入相关的DOM元素
    const importButton = document.getElementById('importBookmarks');
    const fileInput = document.getElementById('fileInput');
    const importPreview = document.getElementById('importPreview');
    const previewContent = document.getElementById('previewContent');
    const confirmImportButton = document.getElementById('confirmImport');
    const cancelImportButton = document.getElementById('cancelImport');
    
    // 导入按钮点击事件
    importButton.addEventListener('click', function() {
        fileInput.click();
    });
    
    // 文件选择事件
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // 验证文件类型
        if (!file.name.endsWith('.html')) {
            showStatus('❌ 请选择HTML格式的书签文件', 'error');
            return;
        }
        
        // 验证文件大小（最大10MB）
        if (file.size > 10 * 1024 * 1024) {
            showStatus('❌ 文件过大，请选择小于10MB的文件', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                
                // 验证文件格式
                validateBookmarksFile(content);
                
                // 解析书签内容
                const parsedData = parseBookmarksHTML(content);
                const stats = getStatsSummary(parsedData);
                
                // 显示预览
                showImportPreview(parsedData, stats);
                importPreview.style.display = 'block';
                
            } catch (error) {
                showStatus(`❌ 文件解析失败：${error.message}`, 'error');
                fileInput.value = ''; // 清空文件选择
            }
        };
        
        reader.onerror = function() {
            showStatus('❌ 文件读取失败，请重试', 'error');
            fileInput.value = '';
        };
        
        reader.readAsText(file);
    });
    
    // 取消导入事件
    cancelImportButton.addEventListener('click', function() {
        importPreview.style.display = 'none';
        fileInput.value = '';
        previewContent.innerHTML = '';
    });
    
    // 确认导入事件
    confirmImportButton.addEventListener('click', async function() {
        const file = fileInput.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const content = e.target.result;
                const parsedData = parseBookmarksHTML(content);
                
                // 显示确认对话框
                const stats = getStatsSummary(parsedData);
                const confirmed = confirm(
                    '⚠️ 重要警告！\n\n' +
                    `即将导入：${stats.bookmarks} 个书签，${stats.folders} 个文件夹\n\n` +
                    '导入操作将：\n' +
                    '1. 清空浏览器中所有现有书签\n' +
                    '2. 导入选中的书签文件内容\n' +
                    '3. 操作不可撤销\n\n' +
                    '确定要执行导入操作吗？'
                );
                
                if (!confirmed) {
                    showStatus('导入操作已取消', 'info');
                    return;
                }
                
                await performBookmarksImport(parsedData);
                
            } catch (error) {
                showStatus(`❌ 导入失败：${error.message}`, 'error');
            }
        };
        
        reader.readAsText(file);
    });
    
    /**
     * 显示导入预览信息
     */
    function showImportPreview(parsedData, stats) {
        const content = `
            <div><strong>📊 统计信息：</strong></div>
            <div>• 书签数量：${stats.bookmarks} 个</div>
            <div>• 文件夹数量：${stats.folders} 个</div>
            <div>• 唯一文件夹：${stats.uniqueFolders} 个</div>
            <div>• 最大深度：${stats.maxDepth} 层</div>
            <div>• 总计项目：${stats.totalItems} 个</div>
            <div style="margin-top: 8px; color: #666; font-size: 0.8em;">
                点击"确认导入"开始导入操作
            </div>
        `;
        previewContent.innerHTML = content;
    }
    
    /**
     * 显示导入进度信息
     */
    function showImportProgress(current, total, action = '导入') {
        const percent = Math.round((current / total) * 100);
        statusDiv.innerHTML = `
            <div style="text-align: center;">
                <div><strong>${action}进度: ${percent}%</strong></div>
                <div style="font-size: 0.8em; margin-top: 4px;">
                    ${current} / ${total} 个项目
                </div>
                <div style="width: 100%; height: 6px; background: #f0f0f0; border-radius: 3px; margin-top: 8px;">
                    <div style="width: ${percent}%; height: 100%; background: #74b9ff; border-radius: 3px; transition: width 0.3s;"></div>
                </div>
            </div>
        `;
    }
    
    /**
     * 执行书签导入操作
     */
    async function performBookmarksImport(parsedData) {
        try {
            // 禁用导入按钮
            importButton.disabled = true;
            importButton.innerHTML = '<span class="loading"></span> 导入中...';
            confirmImportButton.disabled = true;
            
            showStatus('开始导入书签，请稍候...', 'info');
            
            // 第一步：清空现有书签
            showStatus('正在清空现有书签...', 'info');
            const clearResult = await clearAllBookmarksForImport();
            
            if (!clearResult.success) {
                throw new Error(`清空书签失败：${clearResult.error}`);
            }
            
            // 第二步：导入新书签
            showStatus('正在导入书签文件内容...', 'info');

            // 初始化汇总结果
            const aggregateResult = {
                success: true,
                importedCount: 0,
                errorCount: 0,
                bookmarks: 0,
                folders: 0,
                errors: []
            };

            // 遍历根节点，根据类型分发到不同的系统文件夹
            for (const item of parsedData.tree) {
                let result;

                if (item.type === 'folder' && item.personalToolbarFolder) {
                    // 如果是"书签栏"，将其子项导入到系统书签栏 (ID: 1)
                    // 注意：这里导入的是 children，即合并内容，而不是创建文件夹
                    if (item.children && item.children.length > 0) {
                        result = await importBookmarks(item.children, '1');
                    } else {
                        result = { success: true, importedCount: 0, errorCount: 0, bookmarks: 0, folders: 0, errors: [] };
                    }
                } else if (item.type === 'folder' && (item.title === 'Other Bookmarks' || item.title === '其他书签')) {
                    // 如果是"其他书签"，将其子项导入到系统其他书签 (ID: 2)
                    if (item.children && item.children.length > 0) {
                        result = await importBookmarks(item.children, '2');
                    } else {
                        result = { success: true, importedCount: 0, errorCount: 0, bookmarks: 0, folders: 0, errors: [] };
                    }
                } else {
                    // 其他根级别的项目（散落的书签或自定义文件夹），默认导入到书签栏 (ID: 1)
                    result = await importBookmarks([item], '1');
                }

                // 汇总结果
                if (result) {
                    aggregateResult.importedCount += result.importedCount;
                    aggregateResult.errorCount += result.errorCount;
                    aggregateResult.bookmarks += result.bookmarks;
                    aggregateResult.folders += result.folders;
                    if (result.errors && result.errors.length > 0) {
                        aggregateResult.errors.push(...result.errors);
                    }
                    if (!result.success) {
                        aggregateResult.success = false;
                    }
                }
            }

            if (aggregateResult.success) {
                showStatus(`✅ 成功导入 ${aggregateResult.importedCount} 个项目`, 'success');
                setTimeout(() => {
                    showStatus(`导入完成：${aggregateResult.bookmarks} 书签 + ${aggregateResult.folders} 文件夹`, 'success');
                }, 1500);

                // 隐藏预览界面
                importPreview.style.display = 'none';
                fileInput.value = '';
                previewContent.innerHTML = '';
            } else {
                throw new Error(`导入过程中出现错误：${aggregateResult.errors[0]?.error || '未知错误'}`);
            }
            
        } catch (error) {
            console.error('导入书签时出错:', error);
            showStatus(`❌ 导入失败：${error.message}`, 'error');
        } finally {
            // 重置按钮状态
            importButton.disabled = false;
            importButton.innerHTML = '<span class="button-icon">📥</span> 导入书签文件';
            confirmImportButton.disabled = false;
        }
    }
    
    /**
     * 专用的清空书签函数（用于导入流程）
     */
    async function clearAllBookmarksForImport() {
        try {
            const tree = await chrome.bookmarks.getTree();
            if (!tree || tree.length === 0) {
                return { success: true, deleted: 0 };
            }
            
            const stats = countBookmarks(tree[0]);
            if (stats.total === 0) {
                return { success: true, deleted: 0 };
            }
            
            const result = await deleteAllBookmarks(tree[0]);
            return {
                success: result.success,
                deleted: result.deleted,
                error: result.error
            };
            
        } catch (error) {
            return {
                success: false,
                deleted: 0,
                error: error.message
            };
        }
    }
    
    /**
     * 导入书签的递归函数
     */
    async function importBookmarks(items, parentId = '1') {
        let importedCount = 0;
        let errorCount = 0;
        const errors = [];
        let bookmarks = 0;
        let folders = 0;
        
        // 计算总项目数用于进度显示
        let totalCount = 0;
        function countItems(itemList) {
            for (const item of itemList) {
                totalCount++;
                if (item.type === 'folder' && item.children) {
                    countItems(item.children);
                }
            }
        }
        countItems(items);
        
        for (const item of items) {
            try {
                if (item.type === 'folder') {
                    // 创建文件夹
                    const folder = await chrome.bookmarks.create({
                        parentId: parentId,
                        title: item.title
                    });
                    
                    folders++;
                    
                    // 递归导入子项
                    if (item.children && item.children.length > 0) {
                        const result = await importBookmarks(item.children, folder.id);
                        importedCount += result.importedCount;
                        errorCount += result.errorCount;
                        bookmarks += result.bookmarks;
                        folders += result.folders;
                        errors.push(...result.errors);
                    }
                    
                } else if (item.type === 'bookmark') {
                    // 创建书签
                    await chrome.bookmarks.create({
                        parentId: parentId,
                        title: item.title,
                        url: item.url
                    });
                    bookmarks++;
                }
                
                importedCount++;
                
                // 更新进度显示
                if (totalCount > 0) {
                    showImportProgress(importedCount, totalCount, '导入');
                }
                
                // 避免API限制，添加延迟
                await new Promise(resolve => setTimeout(resolve, 50));
                
            } catch (error) {
                errorCount++;
                errors.push({
                    title: item.title,
                    type: item.type,
                    error: error.message
                });
                
                // 即使出错也更新进度
                if (totalCount > 0) {
                    showImportProgress(importedCount, totalCount, '导入');
                }
            }
        }
        
        return {
            success: errorCount === 0,
            importedCount,
            errorCount,
            bookmarks,
            folders,
            errors
        };
    }
    
    // 清除按钮点击事件
    clearButton.addEventListener('click', async function() {
        // 双重确认机制
        const userConfirmed = confirm(
            '⚠️ 重要警告！\n\n' +
            '此操作将永久删除浏览器中所有书签和文件夹。\n' +
            '删除后无法恢复，请确保已备份重要书签。\n\n' +
            '确定要继续清除所有书签吗？'
        );
        
        if (!userConfirmed) {
            showStatus('操作已取消', 'info');
            return;
        }
        
        // 最终确认
        const finalConfirm = confirm(
            '最后确认：\n\n' +
            '您确定要永久删除所有书签吗？\n' +
            '此操作不可撤销，所有书签数据将永久丢失！'
        );
        
        if (!finalConfirm) {
            showStatus('操作已取消', 'info');
            return;
        }
        
        await clearAllBookmarks();
    });
    
    /**
     * 清除所有书签的主函数
     */
    async function clearAllBookmarks() {
        try {
            // 禁用按钮并显示加载状态
            clearButton.disabled = true;
            clearButton.innerHTML = '<span class="loading"></span> 清除中...';
            showStatus('开始清除书签，请稍候...', 'info');
            
            // 获取完整的书签树
            const tree = await chrome.bookmarks.getTree();
            if (!tree || tree.length === 0) {
                showStatus('未找到可清除的书签', 'info');
                resetButton();
                return;
            }
            
            // 统计书签和文件夹数量
            const stats = countBookmarks(tree[0]);
            if (stats.total === 0) {
                showStatus('没有需要清除的书签', 'info');
                resetButton();
                return;
            }
            
            // 显示统计信息并要求最终确认
            const proceed = confirm(
                `检测到 ${stats.bookmarks} 个书签和 ${stats.folders} 个文件夹，总计 ${stats.total} 个项目。\n\n` +
                '确定要删除这些书签吗？'
            );
            
            if (!proceed) {
                showStatus('操作已取消', 'info');
                resetButton();
                return;
            }
            
            // 执行书签清除
            showStatus('正在清除书签，请勿关闭窗口...', 'info');
            const deleteResult = await deleteAllBookmarks(tree[0]);
            
            if (deleteResult.success) {
                showStatus(`✅ 成功清除 ${deleteResult.deleted} 个书签项目`, 'success');
                
                // 可选：显示清除详情
                setTimeout(() => {
                    showStatus(`清理完成：${deleteResult.bookmarks} 书签 + ${deleteResult.folders} 文件夹`, 'success');
                }, 1500);
            } else {
                showStatus(`❌ 清除失败：${deleteResult.error}`, 'error');
            }
            
        } catch (error) {
            console.error('清除书签时出错:', error);
            showStatus(`❌ 发生错误：${error.message}`, 'error');
        } finally {
            resetButton();
        }
    }
    
    /**
     * 统计书签树中的项目数量
     */
    function countBookmarks(node) {
        let bookmarks = 0;
        let folders = 0;
        
        function traverse(node) {
            if (node.url) {
                // 书签节点
                bookmarks++;
            } else if (node.children) {
                // 文件夹节点（跳过根节点）
                if (node.id !== '0' && node.id !== '1' && node.id !== '2') {
                    folders++;
                }
                // 递归遍历子节点
                node.children.forEach(traverse);
            }
        }
        
        traverse(node);
        return {
            bookmarks,
            folders,
            total: bookmarks + folders
        };
    }
    
    /**
     * 删除所有书签的递归函数
     */
    async function deleteAllBookmarks(node) {
        let deletedBookmarks = 0;
        let deletedFolders = 0;
        let lastError = null;
        
        try {
            // 先递归删除子节点（深度优先）
            if (node.children) {
                for (const child of [...node.children]) { // 复制数组避免修改时的问题
                    const result = await deleteAllBookmarks(child);
                    deletedBookmarks += result.bookmarks;
                    deletedFolders += result.folders;
                    if (result.error) {
                        lastError = result.error;
                    }
                    
                    // 添加小幅延迟避免API限制
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }
            
            // 删除当前节点（跳过特殊节点）
            if (node.id !== '0' && node.id !== '1' && node.id !== '2') {
                try {
                    if (node.children) {
                        // 文件夹节点
                        await chrome.bookmarks.removeTree(node.id);
                        deletedFolders++;
                    } else {
                        // 书签节点
                        await chrome.bookmarks.remove(node.id);
                        deletedBookmarks++;
                    }
                } catch (error) {
                    console.error(`删除节点 ${node.id} 失败:`, error);
                    lastError = error.message;
                }
            }
            
        } catch (error) {
            console.error('删除书签时出错:', error);
            lastError = error.message;
        }
        
        return {
            success: !lastError,
            deleted: deletedBookmarks + deletedFolders,
            bookmarks: deletedBookmarks,
            folders: deletedFolders,
            error: lastError
        };
    }
    
    /**
     * 显示状态消息
     */
    function showStatus(message, type = 'info') {
        statusDiv.textContent = message;
        statusDiv.className = `status-message ${type}`;
    }
    
    /**
     * 重置按钮状态
     */
    function resetButton() {
        clearButton.disabled = false;
        clearButton.innerHTML = '<span class="button-icon">🗑️</span> 清除所有书签';
    }
    
    // 添加键盘快捷键支持
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            // ESC键关闭弹窗
            window.close();
        }
    });
    
    // 页面卸载时清理
    window.addEventListener('beforeunload', function() {
        if (clearButton.disabled) {
            // 如果在清除过程中关闭，提示用户
            return '书签清除操作仍在进行中，确定要关闭吗？';
        }
    });
});