/**
 * Sandbox Engine
 * 底层框架只负责注入左右分屏、右侧分支控制台、演示模式与测试用例导出。
 * 左侧默认只提供 App 内容画布，不生成手机外壳、默认标题、默认进度条或默认 Start。
 */
(function() {
  const skeleton = `
    <div class="page">
      <div class="top-actions">
        <button class="btn zen-btn" onclick="toggleZenMode()" id="zenBtn">演示模式</button>
      </div>

      <div id="zen-toast"></div>

      <div class="explorer-grid">
        <div class="app-canvas" id="app-canvas">
          <div id="business-container"></div>
          <div class="screen-overlay" id="screen-overlay" onclick="closeSheet()"></div>
          <div class="bottom-sheet" id="sheet-container"></div>
        </div>

        <div class="branch-console" id="console">
          <div class="console-head">
            <div>
              <h2>状态与分支控制台</h2>
              <p>这里将动态显示当前操作可能引发的分支结局</p>
            </div>
            <div class="console-actions">
              <div class="dropdown">
                <button class="btn ghost" onclick="toggleDropdown(event)">导出测试用例 ▾</button>
                <div id="exportDropdown" class="dropdown-content">
                  <a class="dropdown-item" onclick="exportXMind(); toggleDropdown(event)">导出 XMind 脑图 (.md)</a>
                  <a class="dropdown-item" onclick="exportCSV(); toggleDropdown(event)">导出 禅道/TAPD (.csv)</a>
                </div>
              </div>
              <button class="btn ghost" onclick="resetAllStates()" id="resetBtn">重置全部</button>
            </div>
          </div>
          <div id="branch-container">
            <div class="empty-state">左侧操作将在此处触发分支逻辑</div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = skeleton;
    document.body.appendChild(wrapper.firstElementChild);

    if (typeof window.renderUI === 'function') {
      window.renderUI();
    }
  });

  function getAppScrollTarget() {
    return document.querySelector('#business-container .bkw-scroll') ||
      document.querySelector('#business-container [data-scroll-container]') ||
      document.querySelector('#business-container .screen-content') ||
      document.getElementById('business-container');
  }

  function captureAppScroll() {
    const target = getAppScrollTarget();
    return target ? target.scrollTop : 0;
  }

  function restoreAppScroll(scrollTop) {
    window.requestAnimationFrame(() => {
      const target = getAppScrollTarget();
      if (target && typeof scrollTop === 'number') {
        target.scrollTop = scrollTop;
      }
    });
  }

  window.toggleBranch = function(el, stateKey, outcome, branch) {
    const scrollTop = captureAppScroll();

    if (branch && typeof branch.onSelect === 'function') {
      branch.onSelect(branch);
    } else if (window.appState && stateKey) {
      window.appState[stateKey] = outcome;
      if (typeof window.renderUI === 'function') {
        window.renderUI();
      }
    }

    const list = el.closest('.branch-list');
    if (list) {
      list.querySelectorAll('.branch-item').forEach(item => item.classList.remove('active'));
    }
    el.classList.add('active');
    restoreAppScroll(scrollTop);
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
      div.className = `branch-item ${branch.type || 'info'}${branch.selected ? ' active' : ''}`;
      div.onclick = function() {
        window.toggleBranch(this, branch.stateKey, branch.outcome, branch);
      };
      div.innerHTML = `
        <h3><div class="status-dot ${branch.type || 'info'}"></div> ${branch.title}</h3>
        <p>${branch.desc || ''}</p>
        <div class="spec-container">
          ${branch.specHTML || '<p class="muted-text">暂无交互规约明细</p>'}
        </div>
      `;
      list.appendChild(div);
    });
  };

  window.toggleZenMode = function() {
    document.body.classList.toggle('zen-mode');
    const zenBtn = document.getElementById('zenBtn');
    const isZen = document.body.classList.contains('zen-mode');
    if (zenBtn) zenBtn.textContent = isZen ? '退出演示模式' : '演示模式';

    const toast = document.getElementById('zen-toast');
    if (toast) {
      toast.textContent = isZen ? '进入演示模式' : '退出演示模式';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 1600);
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
    if (dropdown) dropdown.classList.toggle('show');
  };

  window.closeSheet = function() {
    const overlay = document.getElementById('screen-overlay');
    const sheet = document.getElementById('sheet-container');
    if (overlay) overlay.classList.remove('open');
    if (sheet) sheet.classList.remove('open');
  };

  window.onclick = function(event) {
    if (!event.target.matches('.btn') && !event.target.closest('.dropdown')) {
      Array.from(document.getElementsByClassName('dropdown-content')).forEach(dropdown => {
        dropdown.classList.remove('show');
      });
    }
  };

  window.addEventListener('keydown', function(e) {
    if (document.body.classList.contains('zen-mode')) {
      const keys = ['1', '2', '3', 'q', 'w', 'e', 'r'];
      if (keys.includes(e.key.toLowerCase())) {
        const toast = document.getElementById('zen-toast');
        if (toast) {
          toast.textContent = `已触发快捷键: ${e.key.toUpperCase()}`;
          toast.classList.add('show');
          setTimeout(() => toast.classList.remove('show'), 1200);
        }
      }
    }
  });

  window.exportCSV = function() {
    if (!window.SANDBOX_CONFIG || !window.SANDBOX_CONFIG.testCases) {
      alert('配置中未发现 SANDBOX_CONFIG.testCases 数据！');
      return;
    }
    let csvContent = '\uFEFF用例编号,所属模块,用例名称,前置条件,操作步骤,预期结果,用例级别\n';
    window.SANDBOX_CONFIG.testCases.forEach((tc, idx) => {
      const row = [
        tc.id || `TC-${idx + 1}`,
        tc.module || '默认模块',
        tc.name || '',
        tc.precondition || '',
        tc.steps || '',
        tc.expected || '',
        tc.level || 'P1'
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
      csvContent += row + '\n';
    });

    downloadFile(csvContent, 'text/csv;charset=utf-8;', 'testcases.csv');
  };

  window.exportXMind = function() {
    if (!window.SANDBOX_CONFIG || !window.SANDBOX_CONFIG.testCases) {
      alert('配置中未发现 SANDBOX_CONFIG.testCases 数据！');
      return;
    }
    let mdContent = '# 交互沙盒测试用例\n\n';
    window.SANDBOX_CONFIG.testCases.forEach(tc => {
      mdContent += `## ${tc.module || '默认模块'}\n`;
      mdContent += `### ${tc.name}\n`;
      mdContent += `- **用例级别**: ${tc.level || 'P1'}\n`;
      mdContent += `- **前置条件**: ${tc.precondition || ''}\n`;
      mdContent += `- **操作步骤**: ${tc.steps || ''}\n`;
      mdContent += `- **预期结果**: ${tc.expected || ''}\n\n`;
    });

    downloadFile(mdContent, 'text/markdown;charset=utf-8;', 'testcases.md');
  };

  function downloadFile(content, mimeType, filename) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
})();
