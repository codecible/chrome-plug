document.addEventListener('DOMContentLoaded', function() {
    // 获取所有工具卡片
    const toolCards = document.querySelectorAll('.tool-card');

    // 为每个工具卡片添加点击事件
    toolCards.forEach(card => {
        card.addEventListener('click', function() {
            const tool = this.getAttribute('data-tool');

            // 根据工具类型打开相应的页面
            switch(tool) {
                case 'time':
                    window.location.href = 'tools/time.html';
                    break;
                case 'url':
                    window.location.href = 'tools/encoding.html';
                    // 在页面加载后自动选择URL标签页
                    localStorage.setItem('encoding_active_tab', 'url');
                    break;
                case 'base64':
                    window.location.href = 'tools/encoding.html';
                    // 在页面加载后自动选择Base64标签页
                    localStorage.setItem('encoding_active_tab', 'base64');
                    break;
                case 'json':
                    window.location.href = 'tools/encoding.html';
                    // 在页面加载后自动选择JSON标签页
                    localStorage.setItem('encoding_active_tab', 'json');
                    break;
                default:
                    break;
            }
        });
    });
});
