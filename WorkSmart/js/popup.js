document.addEventListener('DOMContentLoaded', function() {
    // 获取所有工具卡片
    const toolCards = document.querySelectorAll('.tool-card');
    const settingsBtn = document.getElementById('settings-btn');

    // 为每个工具卡片添加点击事件
    toolCards.forEach(card => {
        card.addEventListener('click', function() {
            const tool = this.getAttribute('data-tool');
            // 打开相应的工具页面
            chrome.tabs.create({ url: `tools/${tool}.html` });
        });
    });

    // 设置按钮点击事件
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            // 打开设置页面
            chrome.runtime.openOptionsPage();
        });
    }
});
