document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const themeSelect = document.getElementById('theme-select');
    const defaultTimezone = document.getElementById('default-timezone');
    const dateFormat = document.getElementById('date-format');
    const saveHistory = document.getElementById('save-history');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const saveOptionsBtn = document.getElementById('save-options-btn');
    const resetOptionsBtn = document.getElementById('reset-options-btn');

    // 默认设置
    const defaultOptions = {
        theme: 'light',
        defaultTimezone: 'Asia/Shanghai',
        dateFormat: 'YYYY-MM-DD HH:MM:SS',
        saveHistory: true
    };

    // 加载设置
    loadOptions();

    // 保存设置按钮点击事件
    saveOptionsBtn.addEventListener('click', function() {
        const options = {
            theme: themeSelect.value,
            defaultTimezone: defaultTimezone.value,
            dateFormat: dateFormat.value,
            saveHistory: saveHistory.checked
        };

        // 保存设置到Chrome存储
        chrome.storage.sync.set({ options: options }, function() {
            showMessage('设置已保存');
        });
    });

    // 重置为默认按钮点击事件
    resetOptionsBtn.addEventListener('click', function() {
        // 重置为默认设置
        chrome.storage.sync.set({ options: defaultOptions }, function() {
            loadOptions();
            showMessage('设置已重置为默认');
        });
    });

    // 清除历史记录按钮点击事件
    clearHistoryBtn.addEventListener('click', function() {
        if (confirm('确定要清除所有历史记录吗？此操作无法撤销。')) {
            chrome.storage.local.remove('history', function() {
                showMessage('历史记录已清除');
            });
        }
    });

    // 加载设置函数
    function loadOptions() {
        chrome.storage.sync.get('options', function(data) {
            const options = data.options || defaultOptions;

            themeSelect.value = options.theme;
            defaultTimezone.value = options.defaultTimezone;
            dateFormat.value = options.dateFormat;
            saveHistory.checked = options.saveHistory;
        });
    }

    // 显示消息函数
    function showMessage(message) {
        // 创建消息元素
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.textContent = message;

        // 添加到页面
        document.body.appendChild(messageElement);

        // 2秒后移除
        setTimeout(function() {
            messageElement.classList.add('hide');
            setTimeout(function() {
                document.body.removeChild(messageElement);
            }, 500);
        }, 2000);
    }
});
