/* ==========================================================================
   LAVA CLASSROOM - PORTAL INTERACTION LOGIC
   Vanilla JavaScript SPA Tab Navigation, Schedule Expanders, Filters, 
   Notification Toggles & Chart.js Visuals
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Application Components
  initTabNavigation();
  initScheduleAccordion();
  initFilters();
  initNotificationDropdown();
  initMobileSidebar();
  initChatSystem();
  initGlobalSearch();
  initCharts();
});

/* --------------------------------------------------------------------------
   1. TAB NAVIGATION SYSTEM
   -------------------------------------------------------------------------- */
function initTabNavigation() {
  const sidebarItems = document.querySelectorAll('.sidebar-menu li');
  const tabContents = document.querySelectorAll('.tab-content');

  sidebarItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const targetTab = item.getAttribute('data-tab');
      if (!targetTab) return;

      // Update active sidebar state
      sidebarItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Switch tab visibility
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `tab-${targetTab}`) {
          content.classList.add('active');
        }
      });

      // Close mobile sidebar if open
      const sidebar = document.querySelector('.sidebar');
      if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    });
  });
}

// Helper to switch tab programmatically
function switchTab(tabName) {
  const targetMenuItem = document.querySelector(`.sidebar-menu li[data-tab="${tabName}"]`);
  if (targetMenuItem) {
    targetMenuItem.click();
  }
}

/* --------------------------------------------------------------------------
   2. SCHEDULE ACCORDION CONTROLLER
   -------------------------------------------------------------------------- */
function initScheduleAccordion() {
  const dayHeaders = document.querySelectorAll('.day-card-header');

  dayHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const parentCard = header.parentElement;
      const body = parentCard.querySelector('.day-card-body');

      // Toggle display
      if (body.style.display === 'block') {
        body.style.display = 'none';
        parentCard.classList.remove('open');
      } else {
        body.style.display = 'block';
        parentCard.classList.add('open');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   3. SCHEDULE SEARCH & FILTERING LOGIC
   -------------------------------------------------------------------------- */
function initFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const statusSelect = document.getElementById('statusFilterSelect');
  const dayCards = document.querySelectorAll('.day-card');
  const weekDividers = document.querySelectorAll('.week-heading-divider');

  let currentWeekFilter = 'all';
  let currentStatusFilter = 'all';

  function applyFilters() {
    dayCards.forEach(card => {
      const cardWeek = card.getAttribute('data-week');
      const cardStatus = card.getAttribute('data-status');

      const matchesWeek = (currentWeekFilter === 'all' || cardWeek === currentWeekFilter);
      const matchesStatus = (currentStatusFilter === 'all' || cardStatus === currentStatusFilter);

      if (matchesWeek && matchesStatus) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });

    // Toggle week headings based on active filter
    weekDividers.forEach(divider => {
      const dividerWeek = divider.getAttribute('data-week');
      if (currentWeekFilter === 'all' || dividerWeek === currentWeekFilter) {
        divider.style.display = 'block';
      } else {
        divider.style.display = 'none';
      }
    });
  }

  // Week Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentWeekFilter = btn.getAttribute('data-filter');
      applyFilters();
    });
  });

  // Status Filter Dropdown
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      currentStatusFilter = e.target.value;
      applyFilters();
    });
  }
}

/* --------------------------------------------------------------------------
   4. NOTIFICATION DROPDOWN TOGGLE
   -------------------------------------------------------------------------- */
function initNotificationDropdown() {
  const notifBtn = document.getElementById('notifBtn');
  const notifMenu = document.getElementById('notifMenu');

  if (!notifBtn || !notifMenu) return;

  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    notifMenu.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!notifMenu.contains(e.target) && !notifBtn.contains(e.target)) {
      notifMenu.classList.remove('show');
    }
  });
}

/* --------------------------------------------------------------------------
   5. MOBILE SIDEBAR TOGGLE
   -------------------------------------------------------------------------- */
function initMobileSidebar() {
  const mobileToggle = document.getElementById('mobileToggle');
  const sidebar = document.querySelector('.sidebar');

  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

/* --------------------------------------------------------------------------
   6. SIMULATED CHAT / MESSAGING SYSTEM
   -------------------------------------------------------------------------- */
function initChatSystem() {
  const chatInput = document.getElementById('chatInput');
  const sendMessageBtn = document.getElementById('sendMessageBtn');
  const chatMessages = document.getElementById('chatMessages');

  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append outgoing bubble
    const msgBubble = document.createElement('div');
    msgBubble.className = 'message-bubble outgoing';
    msgBubble.innerHTML = `<p>${escapeHtml(text)}</p><span class="msg-time">${timeStr}</span>`;
    chatMessages.appendChild(msgBubble);

    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Simulated Auto Trainer Response
    setTimeout(() => {
      const trainerBubble = document.createElement('div');
      trainerBubble.className = 'message-bubble incoming';
      trainerBubble.innerHTML = `<p>Thank you for your update! I have logged this into John's file.</p><span class="msg-time">${timeStr}</span>`;
      chatMessages.appendChild(trainerBubble);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1200);
  }

  if (sendMessageBtn && chatInput) {
    sendMessageBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

/* --------------------------------------------------------------------------
   7. GLOBAL SEARCH (Instantly Filters Lessons Across Portal)
   -------------------------------------------------------------------------- */
function initGlobalSearch() {
  const searchInput = document.getElementById('globalSearch');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const dayCards = document.querySelectorAll('.day-card');

    if (query !== '') {
      switchTab('schedule'); // Switch to schedule tab when typing search
    }

    dayCards.forEach(card => {
      const cardText = card.innerText.toLowerCase();
      if (cardText.includes(query)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });
}

/* --------------------------------------------------------------------------
   8. CHART.JS INITIALIZATION
   -------------------------------------------------------------------------- */
function initCharts() {
  // Weekly Progress Line Chart
  const weeklyCtx = document.getElementById('weeklyProgressChart');
  if (weeklyCtx) {
    new Chart(weeklyCtx, {
      type: 'line',
      data: {
        labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7', 'Day 8'],
        datasets: [{
          label: 'Daily Task Completion (%)',
          data: [100, 100, 100, 100, 100, 100, 100, 50],
          borderColor: '#A00000',
          backgroundColor: 'rgba(160, 0, 0, 0.1)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#A00000',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: value => value + '%'
            }
          }
        }
      }
    });
  }

  // Quiz Performance Bar Chart
  const quizCtx = document.getElementById('quizChart');
  if (quizCtx) {
    new Chart(quizCtx, {
      type: 'bar',
      data: {
        labels: ['Insurance 101', 'English 101', 'Policy Cycle', 'Home Ins.', 'Auto Ins.'],
        datasets: [{
          label: 'Score Percentage',
          data: [95, 92, 96, 94, 90],
          backgroundColor: [
            '#A00000',
            '#121212',
            '#A00000',
            '#121212',
            '#A00000'
          ],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: value => value + '%'
            }
          }
        }
      }
    });
  }
}
