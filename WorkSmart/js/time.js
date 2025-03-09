document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const timestampInput = document.getElementById('timestamp-input');
    const timestampToDateBtn = document.getElementById('timestamp-to-date-btn');
    const timestampResultUtc = document.getElementById('timestamp-result-utc');
    const timestampResultLocal = document.getElementById('timestamp-result-local');
    const timestampResult = document.getElementById('timestamp-result');

    const dateInput = document.getElementById('date-input');
    const timezoneSelect = document.getElementById('timezone-select');
    const dateToTimestampBtn = document.getElementById('date-to-timestamp-btn');
    const dateResultTimestamp = document.getElementById('date-result-timestamp');
    const dateResult = document.getElementById('date-result');

    // 获取当前北京时间元素
    const currentBeijingTimeElement = document.getElementById('current-beijing-time');
    const currentTimestampElement = document.getElementById('current-timestamp');

    const copyButtons = document.querySelectorAll('.copy-button');

    // 设置当前时间作为默认值
    const now = new Date();
    timestampInput.value = Math.floor(now.getTime() / 1000);
    dateInput.value = formatDate(now);

    // 更新当前北京时间和时间戳
    function updateCurrentBeijingTime() {
        // 获取当前时间
        const now = new Date();

        // 获取当前时间戳（秒）
        const timestamp = Math.floor(now.getTime() / 1000);

        // 计算北京时间（UTC+8）
        // 使用Intl.DateTimeFormat来格式化特定时区的时间
        const beijingTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
            timeZone: 'Asia/Shanghai',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        // 获取格式化后的北京时间部分
        const beijingTimeParts = beijingTimeFormatter.formatToParts(now);

        // 从格式化的部分中提取年、月、日、时、分、秒
        const beijingTimeObj = {};
        beijingTimeParts.forEach(part => {
            if (part.type !== 'literal') {
                beijingTimeObj[part.type] = part.value;
            }
        });

        // 构建北京时间字符串
        const beijingTimeStr = `${beijingTimeObj.year}-${beijingTimeObj.month}-${beijingTimeObj.day} ${beijingTimeObj.hour}:${beijingTimeObj.minute}:${beijingTimeObj.second}`;

        // 更新显示
        currentBeijingTimeElement.textContent = beijingTimeStr;
        currentTimestampElement.textContent = timestamp;
    }

    // 初始更新当前北京时间
    updateCurrentBeijingTime();

    // 每秒更新一次当前北京时间
    setInterval(updateCurrentBeijingTime, 1000);

    // 时间戳转日期
    timestampToDateBtn.addEventListener('click', function() {
        const timestamp = parseInt(timestampInput.value);
        if (isNaN(timestamp)) {
            alert('请输入有效的时间戳');
            return;
        }

        const date = new Date(timestamp * 1000);

        // UTC时间
        timestampResultUtc.textContent = formatDate(date);

        // 本地时间
        // const localDate = new Date(date.getTime());
        // timestampResultLocal.textContent = formatDate(localDate);

        // 显示结果容器
        timestampResult.classList.add('show');
    });

    // 日期转时间戳
    dateToTimestampBtn.addEventListener('click', function() {
        const dateStr = dateInput.value;
        const timezone = timezoneSelect.value;

        try {
            // 解析日期字符串
            const timestamp = getTimestampFromDate(dateStr, timezone);
            dateResultTimestamp.textContent = timestamp;

            // 显示结果容器
            dateResult.classList.add('show');
        } catch (error) {
            alert('请输入有效的日期时间格式 (YYYY-MM-DD HH:MM:SS)');
        }
    });

    // 复制结果
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const resultId = this.getAttribute('data-result');
            let textToCopy = '';

            if (resultId === 'timestamp-result') {
                textToCopy = `${timestampResultUtc.textContent}\n${timestampResultLocal.textContent}`;
            } else {
                textToCopy = document.getElementById(resultId).textContent;
            }

            copyToClipboard(textToCopy);

            // 显示复制成功提示
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-check"></i> 已复制';

            setTimeout(() => {
                this.innerHTML = originalText;
            }, 2000);
        });
    });

    // 初始化页面时执行一次转换
    timestampToDateBtn.click();
    dateToTimestampBtn.click();
});

// 格式化日期为 YYYY-MM-DD HH:MM:SS
function formatDate(date) {
    const pad = (num) => (num < 10 ? '0' + num : num);

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 获取本地时区
function getLocalTimeZone() {
    const offset = new Date().getTimezoneOffset();
    const sign = offset <= 0 ? '+' : '-';
    const hours = Math.abs(Math.floor(offset / 60));
    const minutes = Math.abs(offset % 60);

    return `GMT${sign}${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}`;
}

// 从日期字符串获取时间戳
function getTimestampFromDate(dateStr, timezone) {
    // 解析日期字符串
    const pattern = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
    const match = dateStr.match(pattern);

    if (!match) {
        throw new Error('Invalid date format');
    }

    const year = parseInt(match[1]);
    const month = parseInt(match[2]) - 1; // 月份从0开始
    const day = parseInt(match[3]);
    const hours = parseInt(match[4]);
    const minutes = parseInt(match[5]);
    const seconds = parseInt(match[6]);

    // 创建日期对象
    let date;

    if (timezone === 'UTC') {
        date = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
    } else {
        // 使用本地时区
        date = new Date(year, month, day, hours, minutes, seconds);

        // 根据选择的时区调整时间
        // 这里简化处理，实际应用中可能需要更复杂的时区处理库
        if (timezone === 'Asia/Shanghai') {
            // 中国标准时间 (GMT+8)
            date = new Date(date.getTime() - 8 * 60 * 60 * 1000);
        } else if (timezone === 'America/New_York') {
            // 美国东部时间 (GMT-5)
            date = new Date(date.getTime() + 5 * 60 * 60 * 1000);
        } else if (timezone === 'Europe/London') {
            // 英国时间 (GMT+0)
            // 不需要调整
        }
    }

    // 返回时间戳（秒）
    return Math.floor(date.getTime() / 1000);
}

// 复制文本到剪贴板
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}
