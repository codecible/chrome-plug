// 创建二维码容器
function createQRCodeContainer() {
  const container = document.createElement('div');
  container.className = 'qrcode-container';
  
  // 创建二维码元素
  const qrcodeElement = document.createElement('div');
  qrcodeElement.id = 'qrcode';
  
  // 创建网站标题元素
  const titleElement = document.createElement('div');
  titleElement.className = 'website-title';
  
  container.appendChild(qrcodeElement);
  container.appendChild(titleElement);
  document.body.appendChild(container);
  
  return { container, qrcodeElement, titleElement };
}

// 获取网站图标URL
function getFaviconUrl() {
  const iconLink = document.querySelector("link[rel*='icon']");
  return iconLink ? iconLink.href : '/favicon.ico';
}

// 创建favicon覆盖层
function createFaviconOverlay(faviconUrl) {
  const overlay = document.createElement('img');
  overlay.className = 'favicon-overlay';
  overlay.src = faviconUrl;
  overlay.onerror = () => {
    overlay.src = '/favicon.ico';
  };
  return overlay;
}

// 主函数
function init() {
  // 创建DOM元素
  const { container, qrcodeElement, titleElement } = createQRCodeContainer();
  
  // 获取当前页面URL和标题
  const currentUrl = window.location.href;
  const pageTitle = document.title.slice(0, 10) + (document.title.length > 10 ? '...' : '');
  
  // 设置标题
  titleElement.textContent = pageTitle;
  titleElement.title = document.title; // 设置完整标题为提示文本
  
  // 生成二维码
  const qrcode = new QRCode(qrcodeElement, {
    text: currentUrl,
    width: 128,
    height: 128,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
  
  // 添加网站图标覆盖
  const faviconUrl = getFaviconUrl();
  const faviconOverlay = createFaviconOverlay(faviconUrl);
  qrcodeElement.appendChild(faviconOverlay);
}

// 等待页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}