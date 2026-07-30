/* ==========================================================================
   LAVA AUTOMATION - MULTI-VA TRAINING PORTAL INTERACTION LOGIC
   ========================================================================== */

let scheduleCounter = 0;
let isPresentationMode = false;

// Default VA Preset Data
const defaultVAs = [
  {
    agency: "Apex Insurance Agency",
    firstName: "John",
    lastName: "Doe",
    support: "Personal Lines",
    activeDay: "8",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  }
];

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Default VA Calendar Instance
  defaultVAs.forEach(va => addNewSchedule(va));

  // Global Event Listeners
  document.getElementById('addScheduleBtn').addEventListener('click', () => addNewSchedule());
  document.getElementById('presentationModeBtn').addEventListener('click', () => togglePresentationMode(true));
  document.getElementById('unhideBtn').addEventListener('click', () => togglePresentationMode(false));
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);

  // Close modal when clicking backdrop
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('detailModal');
    if (e.target === modal) closeModal();
  });
});

/**
 * Creates and appends a new VA Training Calendar Card
 */
function addNewSchedule(data = null) {
  scheduleCounter++;
  const id = scheduleCounter;

  const agency = data ? data.agency : "New Insurance Agency";
  const firstName = data ? data.firstName : "Jane";
  const lastName = data ? data.lastName : "Smith";
  const support = data ? data.support : "Commercial Lines";
  const activeDay = data ? data.activeDay : "1";
  const photo = data ? data.photo : "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80";

  const cardContainer = document.createElement('div');
  cardContainer.className = 'calendar-instance';
  cardContainer.id = `schedule-card-${id}`;

  cardContainer.innerHTML = `
    <!-- EDIT CONTROLS BAR -->
    <div class="instance-editor-bar ${isPresentationMode ? 'hidden' : ''}">
      <div class="editor-group">
        <span class="editor-label">
          <i class="fa-solid fa-pen-to-square"></i> Calendar #${id} Settings:
        </span>
        
        <input type="text" id="agencyInput-${id}" class="input-field" value="${agency}" placeholder="Agency Name">
        <input type="text" id="fnInput-${id}" class="input-field input-fn" value="${firstName}" placeholder="First Name">
        <input type="text" id="lnInput-${id}" class="input-field input-ln" value="${lastName}" placeholder="Last Name">

        <!-- INSURANCE SUPPORT DROPDOWN -->
        <select id="supportSelect-${id}" class="input-field">
          <option value="Personal Lines" ${support === 'Personal Lines' ? 'selected' : ''}>Personal Lines</option>
          <option value="Commercial Lines" ${support === 'Commercial Lines' ? 'selected' : ''}>Commercial Lines</option>
          <option value="Personal & Commercial Lines" ${support === 'Personal & Commercial Lines' ? 'selected' : ''}>Personal & Commercial Lines</option>
        </select>

        <!-- ACTIVE DAY DROPDOWN -->
        <select id="daySelect-${id}" class="input-field">
          ${Array.from({length: 15}, (_, i) => `<option value="${i+1}" ${activeDay == (i+1) ? 'selected' : ''}>Day ${i+1} of 15</option>`).join('')}
        </select>

        <!-- UPLOAD PHOTO -->
        <input type="file" id="photoInput-${id}" class="input-field input-file-photo" accept="image/*">
      </div>

      <button class="btn-delete-card" onclick="removeSchedule(${id})">
        <i class="fa-solid fa-trash-can"></i> Remove Calendar
      </button>
    </div>

    <!-- PRESENTATION BANNER -->
    <section class="profile-banner">
      <div class="agency-box">
        <div class="agency-icon-box">
          <i class="fa-solid fa-building-shield"></i>
        </div>
        <div class="agency-details">
          <label>Insurance Agency</label>
          <h2 id="agencyDisplay-${id}">${agency}</h2>
        </div>
      </div>

      <div class="va-profile-box">
        <img id="avatarDisplay-${id}" src="${photo}" alt="VA Photo" class="va-avatar">
        
        <div class="va-info">
          <label>Assigned Virtual Assistant</label>
          <h2 id="vaNameDisplay-${id}">${firstName} ${lastName}</h2>
        </div>

        <div class="meta-badges-group">
          <!-- INSURANCE SUPPORT BADGE -->
          <div class="support-badge" id="supportBadge-${id}">
            <i class="fa-solid fa-file-contract"></i> <span id="supportBadgeText-${id}">${support}</span>
          </div>

          <!-- ACTIVE DAY BADGE -->
          <div class="va-status-tag">
            <i class="fa-solid fa-circle-play"></i> Active: <span id="dayBadgeText-${id}">Day ${activeDay} of 15</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 3-WEEK MATRIX TABLE -->
    <div class="table-container">
      <table class="schedule-table">
        <thead>
          <tr class="week-header-row">
            <th style="width: 16%; background: #4A0000;">Category</th>
            <th colspan="5">WEEK 1</th>
            <th colspan="5">WEEK 2</th>
            <th colspan="5">WEEK 3</th>
          </tr>
          <tr class="day-header-row">
            <th style="background: #FAFAFA;">Training Days</th>
            <th><span class="day-name">Monday</span>Day 1</th>
            <th><span class="day-name">Tuesday</span>Day 2</th>
            <th><span class="day-name">Wednesday</span>Day 3</th>
            <th><span class="day-name">Thursday</span>Day 4</th>
            <th><span class="day-name">Friday</span>Day 5</th>
            <th><span class="day-name">Monday</span>Day 6</th>
            <th><span class="day-name">Tuesday</span>Day 7</th>
            <th><span class="day-name">Wednesday</span>Day 8</th>
            <th><span class="day-name">Thursday</span>Day 9</th>
            <th><span class="day-name">Friday</span>Day 10</th>
            <th><span class="day-name">Monday</span>Day 11</th>
            <th><span class="day-name">Tuesday</span>Day 12</th>
            <th><span class="day-name">Wednesday</span>Day 13</th>
            <th><span class="day-name">Thursday</span>Day 14</th>
            <th><span class="day-name">Friday</span>Day 15</th>
          </tr>
        </thead>
        <tbody>
          <!-- HR Contract Signing Row -->
          <tr>
            <td class="category-cell category-blue">
              <i class="fa-solid fa-users"></i>
              <span>HR Contract Signing</span>
            </td>
            <td onclick="showDetails('Day 1', 'HR Contract Signing')">HR Contract Signing</td>
            <td onclick="showDetails('Day 2', 'Getting to know you')">Getting to know you</td>
            <td></td>
            <td></td>
            <td></td>
            <td onclick="showDetails('Day 6', 'Home Insurance Types')">Home Insurance Types</td>
            <td onclick="showDetails('Day 7', 'Intro to Auto Insurance')">Intro to Auto Insurance</td>
            <td onclick="showDetails('Day 8', 'Analyzing a Sample Home Dec Page')">Analyzing a Sample Home Dec Page</td>
            <td onclick="showDetails('Day 9', 'Trailer Overview and Quoting')">Trailer Overview and Quoting</td>
            <td onclick="showDetails('Day 10', 'AMS')">AMS</td>
            <td rowspan="2" onclick="showDetails('Day 11', 'Personal/Commercial Insurance ACORD Forms')">Personal/Commercial Insurance ACORD Forms</td>
            <td onclick="showDetails('Day 12', 'Personal Test/Review')">Personal Test/Review</td>
            <td></td>
            <td></td>
            <td></td>
          </tr>

          <!-- HR New Hire Orientation Row -->
          <tr>
            <td class="category-cell category-blue">
              <i class="fa-solid fa-user-plus"></i>
              <span>HR New Hire Orientation</span>
            </td>
            <td onclick="showDetails('Day 1', 'HR New Hire Orientation')">HR New Hire Orientation</td>
            <td onclick="showDetails('Day 2', 'Different Roles of a LAVA VA')">Different Roles of a LAVA VA</td>
            <td onclick="showDetails('Day 3', 'Insurance 101')">Insurance 101</td>
            <td onclick="showDetails('Day 4', 'Insurance Documents')">Insurance Documents</td>
            <td onclick="showDetails('Day 5', 'English 101')">English 101</td>
            <td onclick="showDetails('Day 6', 'Coverages in Home Insurance')">Coverages in Home Insurance</td>
            <td onclick="showDetails('Day 7', 'Common Fields You Will See When Quoting Home & Auto')">Common Fields You Will See When Quoting Home & Auto</td>
            <td onclick="showDetails('Day 8', 'Analyzing a Sample Auto Dec Page')">Analyzing a Sample Auto Dec Page</td>
            <td onclick="showDetails('Day 9', 'Boat & RV Overview and Quoting')">Boat & RV Overview and Quoting</td>
            <td onclick="showDetails('Day 10', 'CRM')">CRM</td>
            <td onclick="showDetails('Day 13', 'Insurance Final Exam')">Insurance Final Exam</td>
            <td onclick="showDetails('Day 14', 'Lava U Completion')">Lava U Completion</td>
            <td onclick="showDetails('Day 15', 'Recognition with TL\'s and Trainers (Certificate)')">Recognition with TL's and Trainers (Certificate)</td>
          </tr>

          <!-- Insurance Onboarding Row -->
          <tr>
            <td class="category-cell category-green">
              <i class="fa-solid fa-shield-halved"></i>
              <span>Insurance Onboarding Meeting</span>
            </td>
            <td onclick="showDetails('Day 1', 'Insurance Onboarding Meeting')">Insurance Onboarding Meeting</td>
            <td onclick="showDetails('Day 2', 'Standard Work Ethics')">Standard Work Ethics</td>
            <td onclick="showDetails('Day 3', 'Policy Cycle')">Policy Cycle</td>
            <td onclick="showDetails('Day 4', 'Admin Task')">Admin Task</td>
            <td onclick="showDetails('Day 5', 'Insurance CSR')">Insurance CSR</td>
            <td onclick="showDetails('Day 6', 'Home Construction Knowledge')">Home Construction Knowledge</td>
            <td onclick="showDetails('Day 7', 'Home and Auto Quoting')">Home and Auto Quoting</td>
            <td onclick="showDetails('Day 8', 'Home & Auto Quote Simulations')">
              Home Quote Simulation<br><br>Auto Quote Simulation
            </td>
            <td onclick="showDetails('Day 9', 'Umbrella Insurance')">Umbrella Insurance</td>
            <td onclick="showDetails('Day 10', 'Raters & Carriers')">
              Raters<br><br>Carriers
            </td>
            <td onclick="showDetails('Day 11', 'SOP')">SOP</td>
            <td onclick="showDetails('Day 12', 'Commercial Summative Test/Review')">Commercial Summative Test/Review</td>
            <td></td>
            <td></td>
            <td></td>
          </tr>

          <!-- Virtual Assistant Onboarding Row -->
          <tr class="lava-u-row">
            <td class="category-cell category-peach">
              <i class="fa-solid fa-headset"></i>
              <span>Virtual Assistant Onboarding</span>
            </td>
            <td onclick="showDetails('Day 1', 'Lava U Setup')">Lava U</td>
            <td onclick="showDetails('Day 2', 'Lava U Modules')">Lava U</td>
            <td onclick="showDetails('Day 3', 'Lava U Modules')">Lava U</td>
            <td onclick="showDetails('Day 4', 'Lava U Modules')">Lava U</td>
            <td onclick="showDetails('Day 5', 'Lava U Modules')">Lava U</td>
            <td onclick="showDetails('Day 6', 'Lava U Modules')">Lava U</td>
            <td onclick="showDetails('Day 7', 'Lava U Modules')">Lava U</td>
            <td onclick="showDetails('Day 8', 'Lava U Modules')">Lava U</td>
            <td onclick="showDetails('Day 9', 'Lava U Modules')">Lava U</td>
            <td onclick="showDetails('Day 10', 'Lava U Modules')">Lava U</td>
            <td onclick="showDetails('Day 11', 'Lava U Modules')">Lava U</td>
            <td onclick="showDetails('Day 12', 'Lava U Modules')">Lava U</td>
            <td onclick="showDetails('Day 13', 'Lava U Modules')">Lava U</td>
            <td onclick="showDetails('Day 14', 'Lava U Modules')">Lava U</td>
            <td onclick="showDetails('Day 15', 'Lava U Graduation')">Lava U</td>
          </tr>

          <!-- NEW ROWS: Client Tasks and Agency Training & specific LAVA U Courses -->
          <tr>
            <td class="category-cell category-gold" rowspan="2">
              <i class="fa-solid fa-laptop-file"></i>
              <span style="font-size: 10px; line-height: 1.3;">Virtual Assistant Onboarding / LAVA University Courses (VA onboarding and Security Awareness)</span>
            </td>
            <td onclick="showDetails('Day 1', 'Client Tasks and Agency Training')">Client Tasks and Agency Training</td>
            <td onclick="showDetails('Day 2', 'Client Tasks and Agency Training')">Client Tasks and Agency Training</td>
            <td onclick="showDetails('Day 3', 'Client Tasks and Agency Training')">Client Tasks and Agency Training</td>
            <td onclick="showDetails('Day 4', 'Client Tasks and Agency Training')">Client Tasks and Agency Training</td>
            <td onclick="showDetails('Day 5', 'Client Tasks and Agency Training')">Client Tasks and Agency Training</td>
            <td onclick="showDetails('Day 6', 'Client Tasks and Agency Training')">Client Tasks and Agency Training</td>
            <td onclick="showDetails('Day 7', 'Client Tasks and Agency Training')">Client Tasks and Agency Training</td>
            <td onclick="showDetails('Day 8', 'Client Tasks and Agency Training')">Client Tasks and Agency Training</td>
            <td onclick="showDetails('Day 9', 'Client Tasks and Agency Training')">Client Tasks and Agency Training</td>
            <td onclick="showDetails('Day 10', 'Client Tasks and Agency Training')">Client Tasks and Agency Training</td>
            <td onclick="showDetails('Day 11', 'Client Tasks and Agency Training')">Client Tasks and Agency Training</td>
            <td rowspan="2" onclick="showDetails('Day 12', 'Client Tasks and Agency Training')">Client Tasks and Agency Training</td>
            <td rowspan="2" onclick="showDetails('Day 13', 'Client Tasks and Agency Training')">Client Tasks and Agency Training</td>
            <td rowspan="2" onclick="showDetails('Day 14', 'Client Tasks and Agency Training')">Client Tasks and Agency Training</td>
            <td rowspan="2" onclick="showDetails('Day 15', 'Client Tasks and Agency Training')">Client Tasks and Agency Training</td>
          </tr>
          <tr>
            <td onclick="showDetails('Day 1', 'LAVA University Course')">LAVA University Course</td>
            <td onclick="showDetails('Day 2', 'LAVA University Course')">LAVA University Course</td>
            <td onclick="showDetails('Day 3', 'LAVA University Course')">LAVA University Course</td>
            <td onclick="showDetails('Day 4', 'LAVA University Course')">LAVA University Course</td>
            <td onclick="showDetails('Day 5', 'LAVA University Course')">LAVA University Course</td>
            <td onclick="showDetails('Day 6', 'LAVA U Course on Client Specific AMS and CRM')">LAVA U Course on Client Specific AMS and CRM</td>
            <td onclick="showDetails('Day 7', 'LAVA U Course on Home Quoting Simulator')">LAVA U Course on Home Quoting Simulator</td>
            <td onclick="showDetails('Day 8', 'LAVA U Course on Auto Quoting Simulator')">LAVA U Course on Auto Quoting Simulator</td>
            <td onclick="showDetails('Day 9', 'LAVA U Course on Client Specific Carriers')">LAVA U Course on Client Specific Carriers</td>
            <td onclick="showDetails('Day 10', 'LAVA U Course on Client Specific Carriers')">LAVA U Course on Client Specific Carriers</td>
            <td onclick="showDetails('Day 11', 'LAVA U Course on ACORD Forms')">LAVA U Course on ACORD Forms</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- FOOTER LEGEND -->
    <footer class="footer-bar">
      <div class="lava-u-tag">
        <div class="lava-u-badge"><i class="fa-solid fa-graduation-cap"></i></div>
        <span>LAVA U &ndash; <em>Continuous Learning. Endless Growth.</em></span>
      </div>

      <div class="legend-container">
        <div class="legend-item"><span class="legend-dot blue"></span><span>HR & Orientation</span></div>
        <div class="legend-item"><span class="legend-dot green"></span><span>Insurance Onboarding</span></div>
        <div class="legend-item"><span class="legend-dot peach"></span><span>VA Onboarding</span></div>
        <div class="legend-item"><span class="legend-dot gold"></span><span>Client & Agency Tasks</span></div>
      </div>
    </footer>
  `;

  document.getElementById('schedulesContainer').appendChild(cardContainer);

  // Attach Event Listeners to Inputs
  document.getElementById(`agencyInput-${id}`).addEventListener('input', () => updateCardDisplay(id));
  document.getElementById(`fnInput-${id}`).addEventListener('input', () => updateCardDisplay(id));
  document.getElementById(`lnInput-${id}`).addEventListener('input', () => updateCardDisplay(id));
  document.getElementById(`supportSelect-${id}`).addEventListener('change', () => updateCardDisplay(id));
  document.getElementById(`daySelect-${id}`).addEventListener('change', () => updateCardDisplay(id));
  document.getElementById(`photoInput-${id}`).addEventListener('change', (e) => handlePhotoUpload(e, id));

  updateCardDisplay(id);
}

/**
 * Removes a schedule instance card by ID
 */
function removeSchedule(id) {
  const card = document.getElementById(`schedule-card-${id}`);
  if (card) {
    card.remove();
  }
}

/**
 * Updates Card Labels & Badges dynamically
 */
function updateCardDisplay(id) {
  const agencyVal = document.getElementById(`agencyInput-${id}`).value.trim() || 'Insurance Agency';
  const fnVal = document.getElementById(`fnInput-${id}`).value.trim();
  const lnVal = document.getElementById(`lnInput-${id}`).value.trim();
  const supportVal = document.getElementById(`supportSelect-${id}`).value;
  const dayVal = document.getElementById(`daySelect-${id}`).value;

  document.getElementById(`agencyDisplay-${id}`).innerText = agencyVal;
  document.getElementById(`vaNameDisplay-${id}`).innerText = `${fnVal} ${lnVal}`.trim() || 'Virtual Assistant';
  document.getElementById(`supportBadgeText-${id}`).innerText = supportVal;
  document.getElementById(`dayBadgeText-${id}`).innerText = `Day ${dayVal} of 15`;

  // Support Badge Theme Variations
  const supportBadge = document.getElementById(`supportBadge-${id}`);
  supportBadge.className = "support-badge";
  if (supportVal === 'Commercial Lines') {
    supportBadge.classList.add('commercial');
  } else if (supportVal === 'Personal & Commercial Lines') {
    supportBadge.classList.add('both');
  }
}

/**
 * FileReader image loader for VA Avatar
 */
function handlePhotoUpload(e, id) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      document.getElementById(`avatarDisplay-${id}`).src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }
}

/**
 * Presentation Mode Switcher
 */
function togglePresentationMode(hideControls) {
  isPresentationMode = hideControls;
  const toolbar = document.getElementById('globalToolbar');
  const unhideBtn = document.getElementById('unhideBtn');
  const editorBars = document.querySelectorAll('.instance-editor-bar');

  if (hideControls) {
    toolbar.classList.add('hidden');
    unhideBtn.style.display = 'flex';
    editorBars.forEach(bar => bar.classList.add('hidden'));
  } else {
    toolbar.classList.remove('hidden');
    unhideBtn.style.display = 'none';
    editorBars.forEach(bar => bar.classList.remove('hidden'));
  }
}

/**
 * Topic Details Modal
 */
function showDetails(day, topic) {
  document.getElementById('modalDay').innerText = day;
  document.getElementById('modalTopic').innerText = topic;
  document.getElementById('detailModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('detailModal').style.display = 'none';
}
