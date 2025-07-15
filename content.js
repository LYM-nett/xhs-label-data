(function () {
  const CONFIG = {
    MAIN_CONTAINER: '.feeds-container',
    POST_SELECTOR: 'section.note-item',
    TITLE_SELECTOR: '.title span, h3, h4, .title',
    JSON_URL: 'http://localhost:8080/checked_labeled_with_comments.json'
  };

  /** note_id → type_lable   */
  let type_lableMap = {};
  /** JSON 是否已加载完毕 */
  let dataReady = false;

  /** ------------ 1. 读取本地 JSON ---------------- */
  function fetchtype_lableData() {
    fetch(CONFIG.JSON_URL)
      .then(r => r.json())
      .then(data => {
        data.forEach(item => (type_lableMap[item.note_id] = item.type_lable));
        dataReady = true;
        highlightIfReady();          // 尝试首次标注
      })
      .catch(err => console.error('无法获取分类数据:', err));
  }

  /** ------------ 2. 仅在容器 + 数据都就绪时才标注 ---- */
  function highlightIfReady() {
    if (!dataReady) return;                              // 数据还没好
    const container = document.querySelector(CONFIG.MAIN_CONTAINER);
    if (!container) return;                              // 容器还没渲染
    highlightTitles(container);
  }

  /** ------------ 3. 遍历帖子并插入徽标 --------------- */
  function highlightTitles(container) {
    const posts = Array.from(container.querySelectorAll(CONFIG.POST_SELECTOR))
      .filter(p => p.offsetHeight > 100);

    posts.forEach(post => {
      /* 提取 noteId */
      const link = post.querySelector('a[href*="/explore/"]');
      const m = link && link.getAttribute('href').match(/\/explore\/([a-zA-Z0-9]+)/);
      const noteId = m ? m[1] : null;
      if (!noteId || !type_lableMap[noteId]) return;

      /* 计算标签字母 */
      const type = type_lableMap[noteId];
      const label = type === '0' ? 'A' : type === '1' ? 'B' : '';
      if (!label) return;

      /* 插入 badge */
      const title = post.querySelector(CONFIG.TITLE_SELECTOR);
      if (title && !title.querySelector('.type_lable-badge')) {
        const badge = document.createElement('span');
        badge.textContent = label;
        badge.className = 'type_lable-badge';
        badge.style.cssText =
          'background:#0066ff;color:#fff;padding:2px 6px;border-radius:5px;font-size:12px;margin-right:8px;';
        title.insertBefore(badge, title.firstChild);
      }
    });
  }

  /** ------------ 4. 初始等待 + MutationObserver ---- */
  function waitForContainer(retry = 40) {
    const container = document.querySelector(CONFIG.MAIN_CONTAINER);
    if (!container) {
      if (retry === 0) return console.error('多次重试仍未出现 .feeds-container');
      setTimeout(() => waitForContainer(retry - 1), 500);
      return;
    }

    /* 容器出现 → 监听新增节点 */
    const ob = new MutationObserver(() => highlightIfReady());
    ob.observe(container, { childList: true, subtree: true });

    highlightIfReady();   // 再尝试一次（若此时数据已准备好会立刻标注）
  }

  /** ------------ 5. 启动 --------------------------- */
  fetchtype_lableData();   // 先拉 JSON
  waitForContainer();      // 等待容器 + 监听后续新增
})();
