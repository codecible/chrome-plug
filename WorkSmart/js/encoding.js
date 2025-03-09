document.addEventListener('DOMContentLoaded', function() {
    // 标签页切换功能
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    // 检查是否有保存的活动标签页
    const activeTab = localStorage.getItem('encoding_active_tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除所有active类
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // 为当前点击的标签添加active类
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-content`).classList.add('active');

            // 保存当前活动标签页
            localStorage.setItem('encoding_active_tab', tabId);
        });

        // 如果有保存的活动标签页，激活它
        if (activeTab && tab.getAttribute('data-tab') === activeTab) {
            tab.click();
        }
    });

    // URL编码/解码功能
    const urlInput = document.getElementById('url-input');
    const urlEncodeBtn = document.getElementById('url-encode-btn');
    const urlDecodeBtn = document.getElementById('url-decode-btn');
    const sqlDecodeBtn = document.getElementById('sql-decode-btn');
    const urlResult = document.getElementById('url-result');

    urlEncodeBtn.addEventListener('click', function() {
        try {
            urlResult.textContent = encodeURIComponent(urlInput.value);
        } catch (error) {
            alert('URL编码失败: ' + error.message);
        }
    });

    urlDecodeBtn.addEventListener('click', function() {
        try {
            urlResult.textContent = decodeURIComponent(urlInput.value);
        } catch (error) {
            alert('URL解码失败: ' + error.message);
        }
    });

    // SQL解码功能 - 将URL解码后的文本中的 + 替换为空格
    sqlDecodeBtn.addEventListener('click', function() {
        try {
            // 先进行URL解码
            const urlDecoded = decodeURIComponent(urlInput.value);
            // 然后将 + 替换为空格
            urlResult.textContent = urlDecoded.replace(/\+/g, ' ');
        } catch (error) {
            alert('SQL解码失败: ' + error.message);
        }
    });

    // Base64编码/解码功能
    const base64Type = document.getElementById('base64-type');
    const base64TextInputGroup = document.getElementById('base64-text-input-group');
    const base64FileInputGroup = document.getElementById('base64-file-input-group');
    const base64TextInput = document.getElementById('base64-text-input');
    const base64FileInput = document.getElementById('base64-file-input');
    const base64EncodeBtn = document.getElementById('base64-encode-btn');
    const base64DecodeBtn = document.getElementById('base64-decode-btn');
    const base64Result = document.getElementById('base64-result');

    // 切换Base64输入类型
    base64Type.addEventListener('change', function() {
        if (this.value === 'text') {
            base64TextInputGroup.style.display = 'block';
            base64FileInputGroup.style.display = 'none';
        } else {
            base64TextInputGroup.style.display = 'none';
            base64FileInputGroup.style.display = 'block';
        }
    });

    // Base64编码
    base64EncodeBtn.addEventListener('click', function() {
        if (base64Type.value === 'text') {
            try {
                base64Result.textContent = btoa(unescape(encodeURIComponent(base64TextInput.value)));
            } catch (error) {
                alert('Base64编码失败: ' + error.message);
            }
        } else {
            const file = base64FileInput.files[0];
            if (!file) {
                alert('请选择一个文件');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                base64Result.textContent = e.target.result.split(',')[1];
            };
            reader.onerror = function() {
                alert('文件读取失败');
            };
            reader.readAsDataURL(file);
        }
    });

    // Base64解码
    base64DecodeBtn.addEventListener('click', function() {
        try {
            base64Result.textContent = decodeURIComponent(escape(atob(base64TextInput.value)));
        } catch (error) {
            alert('Base64解码失败: ' + error.message);
        }
    });

    // JSON格式化功能
    const jsonInput = document.getElementById('json-input');
    const jsonFormatBtn = document.getElementById('json-format-btn');
    const jsonMinifyBtn = document.getElementById('json-minify-btn');
    const jsonResult = document.getElementById('json-result');

    jsonFormatBtn.addEventListener('click', function() {
        try {
            const json = JSON.parse(jsonInput.value);
            jsonResult.textContent = JSON.stringify(json, null, 2);
        } catch (error) {
            alert('JSON格式化失败: ' + error.message);
        }
    });

    jsonMinifyBtn.addEventListener('click', function() {
        try {
            const json = JSON.parse(jsonInput.value);
            jsonResult.textContent = JSON.stringify(json);
        } catch (error) {
            alert('JSON压缩失败: ' + error.message);
        }
    });

    // 复制结果功能
    const copyButtons = document.querySelectorAll('.copy-button');

    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const resultId = this.getAttribute('data-result');
            const resultElement = document.getElementById(resultId);

            copyToClipboard(resultElement.textContent);

            // 显示复制成功提示
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-check"></i> 已复制';

            setTimeout(() => {
                this.innerHTML = originalText;
            }, 2000);
        });
    });
});

// 复制文本到剪贴板
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}
