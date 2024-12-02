// Toast 提示函数
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');

  // 2 秒后隐藏
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

// 防抖函数，减少频繁调用
function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

const inputElement = document.getElementById('json-input');
const outputElement = document.getElementById('formatted-json');
const outputContainer = document.getElementById('output');
const copyBtn = document.getElementById('copy-btn');
const compressCopyBtn = document.getElementById('compress-copy-btn');

// 实时验证和格式化 JSON
const formatJSON = () => {
  const input = inputElement.value;
  try {
    const parsedJson = JSON.parse(input);
    const formattedJson = JSON.stringify(parsedJson, null, 2); // 格式化 JSON
    outputElement.textContent = formattedJson;

    // 语法高亮
    Prism.highlightElement(outputElement);

    // 正常样式
    outputContainer.classList.remove('error');
  } catch (error) {
    // 显示错误信息
    outputElement.textContent = 'Invalid JSON: ' + error.message;
    outputContainer.classList.add('error');
  }
};

// 防抖处理输入事件
inputElement.addEventListener('input', debounce(formatJSON, 300));

// 复制功能
copyBtn.addEventListener('click', () => {
  const formattedText = outputElement.textContent;
  navigator.clipboard.writeText(formattedText)
    .then(() => showToast('Formatted JSON copied to clipboard!'))
    .catch(err => showToast('Failed to copy: ' + err));
});

// 压缩并复制功能
compressCopyBtn.addEventListener('click', () => {
  try {
    const input = inputElement.value;
    const parsedJson = JSON.parse(input);
    const compressedJson = JSON.stringify(parsedJson); // 压缩 JSON
    navigator.clipboard.writeText(compressedJson)
      .then(() => showToast('Compressed JSON copied to clipboard!'))
      .catch(err => showToast('Failed to copy: ' + err));
  } catch (error) {
    showToast('Invalid JSON. Cannot compress and copy.');
  }
});
