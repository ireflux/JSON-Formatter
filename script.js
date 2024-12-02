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
  
  // 使用防抖处理输入事件
  inputElement.addEventListener('input', debounce(formatJSON, 300));
  