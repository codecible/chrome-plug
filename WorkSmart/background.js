// 监听插件安装或更新事件
chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install') {
        // 首次安装
        console.log('WorkSmart插件已安装');

        // 设置默认选项
        const defaultOptions = {
            theme: 'light',
            defaultTimezone: 'Asia/Shanghai',
            dateFormat: 'YYYY-MM-DD HH:MM:SS',
            saveHistory: true
        };

        chrome.storage.sync.set({ options: defaultOptions });

        // 打开欢迎页面
        chrome.tabs.create({ url: 'index.html' });
    } else if (details.reason === 'update') {
        // 插件更新
        console.log('WorkSmart插件已更新到版本 ' + chrome.runtime.getManifest().version);
    }
});

// 监听来自内容脚本或弹出窗口的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'saveHistory') {
        // 保存使用历史
        saveHistory(request.data);
        sendResponse({ success: true });
    } else if (request.action === 'getHistory') {
        // 获取使用历史
        getHistory(function(history) {
            sendResponse({ success: true, history: history });
        });
        return true; // 异步响应
    }
});

// 保存使用历史
function saveHistory(data) {
    // 检查是否启用了历史记录保存
    chrome.storage.sync.get('options', function(result) {
        const options = result.options || {};

        if (options.saveHistory !== false) {
            chrome.storage.local.get('history', function(result) {
                let history = result.history || [];

                // 添加新记录
                history.unshift({
                    tool: data.tool,
                    input: data.input,
                    timestamp: Date.now()
                });

                // 限制历史记录数量
                if (history.length > 20) {
                    history = history.slice(0, 20);
                }

                chrome.storage.local.set({ history: history });
            });
        }
    });
}

// 获取使用历史
function getHistory(callback) {
    chrome.storage.local.get('history', function(result) {
        callback(result.history || []);
    });
}
