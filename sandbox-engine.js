/**
 * Sandbox Engine
 * 该文件作为底层框架，负责在页面中注入 HTML 骨架并挂载通用交互逻辑。
 * 业务只需在 HTML 中定义 SANDBOX_CONFIG、appState 和 renderUI()。
 */
(function() {
  // 1. 初始化 DOM 骨架
  const skeleton = `
    <div class="page">
      <!-- 顶部导航 -->
      <div class="header" style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1>可交互原型</h1>
          <p>完整的初始化流程，左侧呈现主干状态机，右侧负责触发环境与用户分支。</p>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <button class="btn" style="background: #1a1a1a; color: white; border: none; margin: 0; padding: 8px 16px; font-size: 13px; transition: all 0.2s;" onclick="toggleZenMode()" id="zenBtn">🖥️ 演示模式</button>
        </div>
      </div>

      <div id="zen-toast"></div>

      <!-- 核心左右分屏 -->
      <div class="explorer-grid">
        <!-- 左侧：手机UI -->
        <div class="phone">
           <div class="screen">
              <div class="screen-content">
                 <h2 style="margin-top:20px; font-size:24px;">业务流程</h2>
                 <p style="font-size:14px; color:rgba(255,255,255,0.7); margin-bottom:24px;">请根据业务需求在下方操作：</p>
                 <div class="global-progress" id="progress-bar">
                   <!-- 进度条由业务 JS 渲染 -->
                 </div>
                 <!-- 业务卡片容器 -->
                 <div id="business-container"></div>
              </div>
              
              <!-- 弹窗/遮罩层 -->
              <div class="screen-overlay" id="screen-overlay" onclick="closeSheet()"></div>
              <div class="bottom-sheet" id="sheet-container"></div>
              <!-- 底部 Start 按钮 -->
              <div><button id="start-btn" class="footer-btn" disabled>Start</button></div>
           </div>
        </div>

        <!-- 右侧：控制台 -->
        <div class="branch-console" id="console">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px;">
            <div>
              <h2 style="margin: 0 0 12px 0; font-size: 24px;">状态与分支控制台</h2>
              <p style="color: var(--muted); font-size: 15px; margin: 0;">这里将动态显示当前操作可能引发的分支结局</p>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <div class="dropdown">
                <button class="btn" style="background: rgba(0,0,0,0.03); color: var(--muted); border: 1px solid rgba(0,0,0,0.05); margin: 0; padding: 8px 16px; font-size: 13px;" onclick="toggleDropdown(event)">📥 导出测试用例 ▾</button>
                <div id="exportDropdown" class="dropdown-content">
                  <a class="dropdown-item" onclick="exportXMind(); toggleDropdown(event)">🧠 导出 XMind 脑图 (.md)</a>
                  <a class="dropdown-item" onclick="exportCSV(); toggleDropdown(event)">📊 导出 禅道/TAPD (.csv)</a>
                </div>
              </div>
              <button class="btn" style="background: rgba(0,0,0,0.03); color: var(--muted); border: 1px solid rgba(0,0,0,0.05); margin: 0; padding: 8px 16px; font-size: 13px;" onclick="resetAllStates()" id="resetBtn">🔄 重置全部</button>
            </div>
          </div>
          <div id="branch-container">
             <div class="empty-state">左侧操作将在此处触发分支逻辑</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // 页面加载完成后注入骨架
  document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = skeleton;
    document.body.appendChild(wrapper.firstElementChild);

    // 尝试调用业务层初始渲染
    if (typeof window.renderUI === 'function') {
      window.renderUI();
    }
  });

  // ========== 通用全局逻辑 ==========

  window.toggleBranch = function(el, stateKey, outcome) {
    if (window.appState) {
      window.appState[stateKey] = outcome;
    }
    if (typeof window.renderUI === 'function') {
      window.renderUI();
    }
    const allItems = el.closest('.branch-list').querySelectorAll('.branch-item');
    allItems.forEach(item => item.classList.remove('active'));
    el.classList.add('active');
  };

  window.renderConsole = function(branches) {
    const container = document.getElementById('branch-container');
    if (!container) return;
    
    if (!branches || branches.length === 0) {
      container.innerHTML = '<div class="empty-state">当前状态暂无特定分支</div>';
      return;
    }

    container.innerHTML = '<div class="branch-list"></div>';
    const list = container.querySelector('.branch-list');
    
    branches.forEach(branch => {
      const div = document.createElement('div');
      div.className = `branch-item ${branch.type || 'info'}`;
      div.onclick = function() { window.toggleBranch(this, branch.stateKey, branch.outcome); };
      div.innerHTML = `
        <h3><div class="status-dot ${branch.type || 'info'}"></div> ${branch.title}</h3>
        <p>${branch.desc || ''}</p>
        <div class="spec-container">
           ${branch.specHTML || '<p style="color:#999;font-size:13px;">暂无交互规约明细</p>'}
        </div>
      `;
      list.appendChild(div);
    });
  };

  window.toggleZenMode = function() {
    document.body.classList.toggle('zen-mode');
    const toast = document.getElementById('zen-toast');
    if (toast) {
      toast.textContent = document.body.classList.contains('zen-mode') ? '进入演示模式' : '退出演示模式';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }
  };

  window.resetAllStates = function() {
    if (window.SANDBOX_CONFIG && window.SANDBOX_CONFIG.initialState) {
      window.appState = JSON.parse(JSON.stringify(window.SANDBOX_CONFIG.initialState));
      if (typeof window.renderUI === 'function') {
        window.renderUI();
      }
      const container = document.getElementById('branch-container');
      if (container) container.innerHTML = '<div class="empty-state">已重置，左侧操作将在此处触发分支逻辑</div>';
    }
  };

  window.toggleDropdown = function(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('exportDropdown');
    if (dropdown) {
      dropdown.classList.toggle('show');
    }
  };

  window.closeSheet = function() {
    const overlay = document.getElementById('screen-overlay');
    const sheet = document.getElementById('sheet-container');
    if (overlay) overlay.classList.remove('open');
    if (sheet) sheet.classList.remove('open');
  };

  // 点击空白关闭下拉菜单
  window.onclick = function(event) {
    if (!event.target.matches('.btn') && !event.target.closest('.dropdown')) {
      const dropdowns = document.getElementsByClassName("dropdown-content");
      for (let i = 0; i < dropdowns.length; i++) {
        if (dropdowns[i].classList.contains('show')) {
          dropdowns[i].classList.remove('show');
        }
      }
    }
  };

  // 全屏快捷键支持 (演示模式盲操)
  window.addEventListener('keydown', function(e) {
    if (document.body.classList.contains('zen-mode')) {
      const keys = ['1','2','3','q','w','e','r'];
      if (keys.includes(e.key.toLowerCase())) {
        const toast = document.getElementById('zen-toast');
        if (toast) {
          toast.textContent = `触发隐藏逻辑: ${e.key.toUpperCase()}`;
          toast.classList.add('show');
          setTimeout(() => toast.classList.remove('show'), 1500);
        }
      }
    }
  });

  // ========== 测试用例导出逻辑 ==========

  window.exportCSV = function() {
    if (!window.SANDBOX_CONFIG || !window.SANDBOX_CONFIG.testCases) {
      alert("配置中未发现 SANDBOX_CONFIG.testCases 数据！");
      return;
    }
    let csvContent = "\uFEFF用例编号,所属模块,用例名称,前置条件,操作步骤,预期结果,用例级别\n";
    window.SANDBOX_CONFIG.testCases.forEach((tc, idx) => {
      const row = [
        tc.id || `TC-${idx+1}`,
        tc.module || '默认模块',
        tc.name || '',
        tc.precondition || '',
        tc.steps || '',
        tc.expected || '',
        tc.level || 'P1'
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
      csvContent += row + "\n";
    });
    
    downloadFile(csvContent, 'text/csv;charset=utf-8;', 'testcases.csv');
  };

  window.exportXMind = function() {
    if (!window.SANDBOX_CONFIG || !window.SANDBOX_CONFIG.testCases) {
      alert("配置中未发现 SANDBOX_CONFIG.testCases 数据！");
      return;
    }
    let mdContent = "# 交互沙盒测试用例\n\n";
    window.SANDBOX_CONFIG.testCases.forEach(tc => {
      mdContent += `## ${tc.module || '默认模块'}\n`;
      mdContent += `### ${tc.name}\n`;
      mdContent += `- **用例级别**: ${tc.level || 'P1'}\n`;
      mdContent += `- **前置条件**: ${tc.precondition}\n`;
      mdContent += `- **操作步骤**: ${tc.steps}\n`;
      mdContent += `- **预期结果**: ${tc.expected}\n\n`;
    });
    
    downloadFile(mdContent, 'text/markdown;charset=utf-8;', 'testcases.md');
  };

  function downloadFile(content, mimeType, filename) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

})();
