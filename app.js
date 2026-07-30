/* ==========================================================================
   LAVA AUTOMATION - MULTI-VA TRAINING PORTAL
   Supabase-backed persistence + storage. Static-friendly (Vercel-ready).
   ========================================================================== */

(function () {
  "use strict";

  const cfg = window.LAVA_CONFIG || {};
  const SUPABASE_URL = (cfg.SUPABASE_URL || "").trim();
  const SUPABASE_ANON_KEY = (cfg.SUPABASE_ANON_KEY || "").trim();
  const PHOTO_BUCKET = cfg.PHOTO_BUCKET || "va-photos";
  const FALLBACK_PHOTO =
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80";

  const isConfigured =
    !!SUPABASE_URL &&
    !!SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes("YOUR_") &&
    !SUPABASE_ANON_KEY.includes("YOUR_");

  let db = null;
  if (isConfigured && window.supabase && window.supabase.createClient) {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  let isPresentationMode = false;
  const saveTimers = {}; // id -> debounce timeout

  /* ------------------------------------------------------------------ */
  /*  Small UI helpers                                                   */
  /* ------------------------------------------------------------------ */
  function setStatus(state, text) {
    const pill = document.getElementById("connStatus");
    if (!pill) return;
    pill.className = "conn-pill " + state;
    const t = pill.querySelector(".conn-text");
    if (t) t.innerText = text;
  }

  function showToast(message) {
    const toast = document.getElementById("toastNotification");
    if (!toast) return;
    if (message) {
      const span = toast.querySelector(".toast-text");
      if (span) span.innerText = message;
    }
    toast.className = "toast show";
    setTimeout(() => {
      toast.className = toast.className.replace("show", "").trim();
    }, 3000);
  }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function rowToView(row) {
    return {
      id: row.id,
      agency: row.agency != null ? row.agency : "New Insurance Agency",
      firstName: row.first_name != null ? row.first_name : "Jane",
      lastName: row.last_name != null ? row.last_name : "Smith",
      support: row.support != null ? row.support : "Commercial Lines",
      activeDay: String(row.active_day != null ? row.active_day : 1),
      photo: row.photo_url || FALLBACK_PHOTO,
    };
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* ------------------------------------------------------------------ */
  /*  Data layer (Supabase, with graceful local-only fallback)          */
  /* ------------------------------------------------------------------ */
  async function loadAll() {
    if (!db) return [];
    const { data, error } = await db
      .from("calendars")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function loadOne(id) {
    if (!db) return null;
    const { data, error } = await db
      .from("calendars")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  async function createCalendar() {
    const defaults = {
      agency: "New Insurance Agency",
      first_name: "Jane",
      last_name: "Smith",
      support: "Commercial Lines",
      active_day: 1,
      photo_url: null,
    };
    if (!db) {
      return Object.assign({ id: uuid(), created_at: new Date().toISOString() }, defaults);
    }
    setStatus("saving", "Saving…");
    const { data, error } = await db
      .from("calendars")
      .insert(defaults)
      .select()
      .single();
    if (error) {
      setStatus("error", "Save failed");
      throw error;
    }
    setStatus("ok", "Connected");
    return data;
  }

  async function persist(id, patch) {
    if (!db) return; // local-only mode: nothing to persist
    setStatus("saving", "Saving…");
    const { error } = await db.from("calendars").update(patch).eq("id", id);
    if (error) {
      console.error("Save failed", error);
      setStatus("error", "Save failed");
      return;
    }
    setStatus("ok", "Saved");
    setTimeout(() => setStatus("ok", "Connected"), 900);
  }

  function persistDebounced(id, patch) {
    clearTimeout(saveTimers[id]);
    saveTimers[id] = setTimeout(() => persist(id, patch), 500);
  }

  async function deleteCalendar(id) {
    if (!db) return;
    setStatus("saving", "Saving…");
    const { error } = await db.from("calendars").delete().eq("id", id);
    if (error) {
      setStatus("error", "Delete failed");
      throw error;
    }
    setStatus("ok", "Connected");
  }

  async function uploadPhoto(id, file) {
    // Local-only mode: just return a base64 data URL for preview
    if (!db) {
      return await new Promise((res) => {
        const reader = new FileReader();
        reader.onload = (e) => res(e.target.result);
        reader.readAsDataURL(file);
      });
    }
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = id + "/" + Date.now() + "." + ext;
    setStatus("saving", "Uploading…");
    const up = await db.storage
      .from(PHOTO_BUCKET)
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    if (up.error) {
      setStatus("error", "Upload failed");
      throw up.error;
    }
    const { data } = db.storage.from(PHOTO_BUCKET).getPublicUrl(path);
    setStatus("ok", "Connected");
    return data.publicUrl;
  }

  /* ------------------------------------------------------------------ */
  /*  Rendering                                                          */
  /* ------------------------------------------------------------------ */
  function scheduleTableHTML(id) {
    // The 3-week training matrix is identical for every VA.
    return (
      '<div class="table-container"><table class="schedule-table"><thead>' +
      '<tr class="week-header-row">' +
      '<th style="width:16%;background:#4A0000;">Category</th>' +
      '<th colspan="5">WEEK 1</th><th colspan="5">WEEK 2</th><th colspan="5">WEEK 3</th>' +
      "</tr>" +
      '<tr class="day-header-row">' +
      '<th style="background:#FAFAFA;">Training Days</th>' +
      dayHeaders() +
      "</tr></thead><tbody>" +
      row1() + row2() + row3() + row4() + row5() +
      "</tbody></table></div>"
    );
  }

  function dayHeaders() {
    const names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    let out = "";
    for (let d = 1; d <= 15; d++) {
      const name = names[(d - 1) % 5];
      out += '<th><span class="day-name">' + name + "</span>Day " + d + "</th>";
    }
    return out;
  }

  function cell(day, topic, display, opts) {
    opts = opts || {};
    if (display === "") return "<td></td>";
    const rowspan = opts.rowspan ? ' rowspan="' + opts.rowspan + '"' : "";
    return (
      "<td" + rowspan + ' onclick="showDetails(' +
      "'Day " + day + "','" + esc(topic).replace(/'/g, "\\'") + "')\">" +
      display + "</td>"
    );
  }

  function row1() {
    return (
      "<tr>" +
      '<td class="category-cell category-blue"><i class="fa-solid fa-users"></i><span>HR Contract Signing</span></td>' +
      cell(1, "HR Contract Signing", "HR Contract Signing") +
      cell(2, "Getting to know you", "Getting to know you") +
      "<td></td><td></td><td></td>" +
      cell(6, "Home Insurance Types", "Home Insurance Types") +
      cell(7, "Intro to Auto Insurance", "Intro to Auto Insurance") +
      cell(8, "Analyzing a Sample Home Dec Page", "Analyzing a Sample Home Dec Page") +
      cell(9, "Trailer Overview and Quoting", "Trailer Overview and Quoting") +
      cell(10, "AMS", "AMS") +
      cell(11, "Personal/Commercial Insurance ACORD Forms", "Personal/Commercial Insurance ACORD Forms", { rowspan: 2 }) +
      cell(12, "Personal Test/Review", "Personal Test/Review") +
      "<td></td><td></td><td></td>" +
      "</tr>"
    );
  }

  function row2() {
    return (
      "<tr>" +
      '<td class="category-cell category-blue"><i class="fa-solid fa-user-plus"></i><span>HR New Hire Orientation</span></td>' +
      cell(1, "HR New Hire Orientation", "HR New Hire Orientation") +
      cell(2, "Different Roles of a LAVA VA", "Different Roles of a LAVA VA") +
      cell(3, "Insurance 101", "Insurance 101") +
      cell(4, "Insurance Documents", "Insurance Documents") +
      cell(5, "English 101", "English 101") +
      cell(6, "Coverages in Home Insurance", "Coverages in Home Insurance") +
      cell(7, "Common Fields You Will See When Quoting Home & Auto", "Common Fields You Will See When Quoting Home & Auto") +
      cell(8, "Analyzing a Sample Auto Dec Page", "Analyzing a Sample Auto Dec Page") +
      cell(9, "Boat & RV Overview and Quoting", "Boat & RV Overview and Quoting") +
      cell(10, "CRM", "CRM") +
      cell(13, "Insurance Final Exam", "Insurance Final Exam") +
      cell(14, "Lava U Completion", "Lava U Completion") +
      cell(15, "Recognition with TL's and Trainers (Certificate)", "Recognition with TL's and Trainers (Certificate)") +
      "</tr>"
    );
  }

  function row3() {
    return (
      "<tr>" +
      '<td class="category-cell category-green"><i class="fa-solid fa-shield-halved"></i><span>Insurance Onboarding Meeting</span></td>' +
      cell(1, "Insurance Onboarding Meeting", "Insurance Onboarding Meeting") +
      cell(2, "Standard Work Ethics", "Standard Work Ethics") +
      cell(3, "Policy Cycle", "Policy Cycle") +
      cell(4, "Admin Task", "Admin Task") +
      cell(5, "Insurance CSR", "Insurance CSR") +
      cell(6, "Home Construction Knowledge", "Home Construction Knowledge") +
      cell(7, "Home and Auto Quoting", "Home and Auto Quoting") +
      cell(8, "Home & Auto Quote Simulations", "Home Quote Simulation<br><br>Auto Quote Simulation") +
      cell(9, "Umbrella Insurance", "Umbrella Insurance") +
      cell(10, "Raters & Carriers", "Raters<br><br>Carriers") +
      cell(11, "SOP", "SOP") +
      cell(12, "Commercial Summative Test/Review", "Commercial Summative Test/Review") +
      "<td></td><td></td><td></td>" +
      "</tr>"
    );
  }

  function row4() {
    let cells = "";
    for (let d = 1; d <= 15; d++) {
      cells += cell(d, d === 1 ? "Lava U Setup" : d === 15 ? "Lava U Graduation" : "Lava U Modules", "Lava U");
    }
    return (
      '<tr class="lava-u-row">' +
      '<td class="category-cell category-peach"><i class="fa-solid fa-headset"></i><span>Virtual Assistant Onboarding</span></td>' +
      cells +
      "</tr>"
    );
  }

  function row5() {
    // Two-row gold block: Client Tasks + LAVA University courses
    let clientRow =
      "<tr>" +
      '<td class="category-cell category-gold" rowspan="2"><i class="fa-solid fa-laptop-file"></i>' +
      '<span style="font-size:10px;line-height:1.3;">Virtual Assistant Onboarding / LAVA University Courses (VA onboarding and Security Awareness)</span></td>';
    for (let d = 1; d <= 11; d++) {
      clientRow += cell(d, "Client Tasks and Agency Training", "Client Tasks and Agency Training");
    }
    for (let d = 12; d <= 15; d++) {
      clientRow += cell(d, "Client Tasks and Agency Training", "Client Tasks and Agency Training", { rowspan: 2 });
    }
    clientRow += "</tr>";

    const courses = {
      1: "LAVA University Course", 2: "LAVA University Course", 3: "LAVA University Course",
      4: "LAVA University Course", 5: "LAVA University Course",
      6: "LAVA U Course on Client Specific AMS and CRM",
      7: "LAVA U Course on Home Quoting Simulator",
      8: "LAVA U Course on Auto Quoting Simulator",
      9: "LAVA U Course on Client Specific Carriers",
      10: "LAVA U Course on Client Specific Carriers",
      11: "LAVA U Course on ACORD Forms",
    };
    let courseRow = "<tr>";
    for (let d = 1; d <= 11; d++) {
      courseRow += cell(d, courses[d], courses[d]);
    }
    courseRow += "</tr>";
    return clientRow + courseRow;
  }

  function renderCard(view, opts) {
    opts = opts || {};
    const id = view.id;
    const card = document.createElement("div");
    card.className = "calendar-instance";
    card.id = "schedule-card-" + id;
    card.dataset.id = id;

    const days = Array.from({ length: 15 }, (_, i) =>
      '<option value="' + (i + 1) + '" ' +
      (String(view.activeDay) === String(i + 1) ? "selected" : "") +
      ">Day " + (i + 1) + " of 15</option>"
    ).join("");

    const supportOpts = ["Personal Lines", "Commercial Lines", "Personal & Commercial Lines"]
      .map((s) => '<option value="' + s + '" ' + (view.support === s ? "selected" : "") + ">" + s + "</option>")
      .join("");

    card.innerHTML =
      '<div class="instance-editor-bar ' + (isPresentationMode ? "hidden" : "") + '">' +
        '<div class="editor-group">' +
          '<span class="editor-label"><i class="fa-solid fa-pen-to-square"></i> Calendar Settings:</span>' +
          '<input type="text" id="agencyInput-' + id + '" class="input-field" value="' + esc(view.agency) + '" placeholder="Agency Name">' +
          '<input type="text" id="fnInput-' + id + '" class="input-field input-fn" value="' + esc(view.firstName) + '" placeholder="First Name">' +
          '<input type="text" id="lnInput-' + id + '" class="input-field input-ln" value="' + esc(view.lastName) + '" placeholder="Last Name">' +
          '<select id="supportSelect-' + id + '" class="input-field">' + supportOpts + "</select>" +
          '<select id="daySelect-' + id + '" class="input-field">' + days + "</select>" +
          '<input type="file" id="photoInput-' + id + '" class="input-field input-file-photo" accept="image/*">' +
        "</div>" +
        '<div style="display:flex;gap:10px;">' +
          '<button class="btn-action btn-share btn-copy-link"><i class="fa-solid fa-link"></i> Copy Link</button>' +
          '<button class="btn-delete-card btn-remove"><i class="fa-solid fa-trash-can"></i> Remove</button>' +
        "</div>" +
      "</div>" +
      '<section class="profile-banner">' +
        '<div class="agency-box">' +
          '<div class="agency-icon-box"><i class="fa-solid fa-building-shield"></i></div>' +
          '<div class="agency-details"><label>Insurance Agency</label><h2 id="agencyDisplay-' + id + '">' + esc(view.agency) + "</h2></div>" +
        "</div>" +
        '<div class="va-profile-box">' +
          '<img id="avatarDisplay-' + id + '" src="' + esc(view.photo) + '" alt="VA Photo" class="va-avatar">' +
          '<div class="va-info"><label>Assigned Virtual Assistant</label><h2 id="vaNameDisplay-' + id + '">' + esc(view.firstName + " " + view.lastName) + "</h2></div>" +
          '<div class="meta-badges-group">' +
            '<div class="support-badge" id="supportBadge-' + id + '"><i class="fa-solid fa-file-contract"></i> <span id="supportBadgeText-' + id + '">' + esc(view.support) + "</span></div>" +
            '<div class="va-status-tag"><i class="fa-solid fa-circle-play"></i> Active: <span id="dayBadgeText-' + id + '">Day ' + esc(view.activeDay) + " of 15</span></div>" +
          "</div>" +
        "</div>" +
      "</section>" +
      scheduleTableHTML(id) +
      '<footer class="footer-bar">' +
        '<div class="lava-u-tag"><div class="lava-u-badge"><i class="fa-solid fa-graduation-cap"></i></div>' +
        "<span>LAVA U &ndash; <em>Continuous Learning. Endless Growth.</em></span></div>" +
        '<div class="legend-container">' +
          '<div class="legend-item"><span class="legend-dot blue"></span><span>HR & Orientation</span></div>' +
          '<div class="legend-item"><span class="legend-dot green"></span><span>Insurance Onboarding</span></div>' +
          '<div class="legend-item"><span class="legend-dot peach"></span><span>VA Onboarding</span></div>' +
          '<div class="legend-item"><span class="legend-dot gold"></span><span>Client & Agency Tasks</span></div>' +
        "</div>" +
      "</footer>";

    document.getElementById("schedulesContainer").appendChild(card);

    if (!opts.readOnly) {
      const on = (elId, evt, fn) => {
        const el = document.getElementById(elId);
        if (el) el.addEventListener(evt, fn);
      };
      const collect = () => ({
        agency: document.getElementById("agencyInput-" + id).value.trim(),
        first_name: document.getElementById("fnInput-" + id).value.trim(),
        last_name: document.getElementById("lnInput-" + id).value.trim(),
        support: document.getElementById("supportSelect-" + id).value,
        active_day: parseInt(document.getElementById("daySelect-" + id).value, 10),
      });
      const changed = () => {
        updateCardDisplay(id);
        persistDebounced(id, collect());
      };
      on("agencyInput-" + id, "input", changed);
      on("fnInput-" + id, "input", changed);
      on("lnInput-" + id, "input", changed);
      on("supportSelect-" + id, "change", changed);
      on("daySelect-" + id, "change", changed);
      on("photoInput-" + id, "change", (e) => handlePhotoUpload(e, id));

      const copyBtn = card.querySelector(".btn-copy-link");
      if (copyBtn) copyBtn.addEventListener("click", () => copyShareLink(id));
      const removeBtn = card.querySelector(".btn-remove");
      if (removeBtn) removeBtn.addEventListener("click", () => removeSchedule(id));
    }

    updateCardDisplay(id);
  }

  function updateCardDisplay(id) {
    const g = (x) => document.getElementById(x);
    if (!g("agencyDisplay-" + id)) return;
    const agencyInput = g("agencyInput-" + id);
    // In read-only viewer mode there are no inputs; displays are already set.
    if (!agencyInput) return;

    const agencyVal = agencyInput.value.trim() || "Insurance Agency";
    const fnVal = g("fnInput-" + id).value.trim();
    const lnVal = g("lnInput-" + id).value.trim();
    const supportVal = g("supportSelect-" + id).value;
    const dayVal = g("daySelect-" + id).value;

    g("agencyDisplay-" + id).innerText = agencyVal;
    g("vaNameDisplay-" + id).innerText = (fnVal + " " + lnVal).trim() || "Virtual Assistant";
    g("supportBadgeText-" + id).innerText = supportVal;
    g("dayBadgeText-" + id).innerText = "Day " + dayVal + " of 15";

    const badge = g("supportBadge-" + id);
    badge.className = "support-badge";
    if (supportVal === "Commercial Lines") badge.classList.add("commercial");
    else if (supportVal === "Personal & Commercial Lines") badge.classList.add("both");
  }

  async function handlePhotoUpload(e, id) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await uploadPhoto(id, file);
      const img = document.getElementById("avatarDisplay-" + id);
      if (img) img.src = url;
      if (db) await persist(id, { photo_url: url });
    } catch (err) {
      console.error(err);
      alert("Photo upload failed. Check that the storage bucket exists and is public.");
    }
  }

  function copyShareLink(id) {
    const base = window.location.href.split("?")[0].split("#")[0];
    const shareUrl = base + "?id=" + encodeURIComponent(id);
    navigator.clipboard.writeText(shareUrl).then(
      () => showToast("View link copied to clipboard!"),
      () => window.prompt("Copy this share link:", shareUrl)
    );
  }

  async function removeSchedule(id) {
    if (!window.confirm("Remove this VA calendar? This cannot be undone.")) return;
    try {
      await deleteCalendar(id);
      const card = document.getElementById("schedule-card-" + id);
      if (card) card.remove();
    } catch (err) {
      console.error(err);
      alert("Could not delete this calendar.");
    }
  }

  async function addNewSchedule() {
    try {
      const row = await createCalendar();
      renderCard(rowToView(row));
    } catch (err) {
      console.error(err);
      alert("Could not create a new calendar. Check your Supabase connection.");
    }
  }

  function togglePresentationMode(hideControls) {
    if (document.body.classList.contains("viewer-mode")) return;
    isPresentationMode = hideControls;
    const toolbar = document.getElementById("globalToolbar");
    const unhideBtn = document.getElementById("unhideBtn");
    const editorBars = document.querySelectorAll(".instance-editor-bar");
    if (hideControls) {
      toolbar.classList.add("hidden");
      unhideBtn.style.display = "flex";
      editorBars.forEach((b) => b.classList.add("hidden"));
    } else {
      toolbar.classList.remove("hidden");
      unhideBtn.style.display = "none";
      editorBars.forEach((b) => b.classList.remove("hidden"));
    }
  }

  // Exposed for inline onclick handlers inside the schedule table
  window.showDetails = function (day, topic) {
    document.getElementById("modalDay").innerText = day;
    document.getElementById("modalTopic").innerText = topic;
    document.getElementById("detailModal").style.display = "flex";
  };
  window.closeModal = function () {
    document.getElementById("detailModal").style.display = "none";
  };

  /* ------------------------------------------------------------------ */
  /*  Boot                                                               */
  /* ------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", async () => {
    // Wire global controls
    const addBtn = document.getElementById("addScheduleBtn");
    const presBtn = document.getElementById("presentationModeBtn");
    const unhideBtn = document.getElementById("unhideBtn");
    const closeBtn = document.getElementById("modalCloseBtn");
    if (addBtn) addBtn.addEventListener("click", addNewSchedule);
    if (presBtn) presBtn.addEventListener("click", () => togglePresentationMode(true));
    if (unhideBtn) unhideBtn.addEventListener("click", () => togglePresentationMode(false));
    if (closeBtn) closeBtn.addEventListener("click", window.closeModal);
    window.addEventListener("click", (e) => {
      if (e.target === document.getElementById("detailModal")) window.closeModal();
    });

    // Config banner + status
    if (!isConfigured) {
      const banner = document.getElementById("setupBanner");
      if (banner) banner.classList.add("show");
      setStatus("local", "Local only");
    } else {
      setStatus("ok", "Connected");
    }

    const params = new URLSearchParams(window.location.search);
    const viewId = params.get("id");
    const hash = window.location.hash;

    // 1) New-style shared view link: ?id=<uuid>
    if (viewId) {
      document.body.classList.add("viewer-mode");
      togglePresentationModeForced(true);
      try {
        const row = db ? await loadOne(viewId) : null;
        if (row) {
          renderCard(rowToView(row), { readOnly: true });
        } else {
          alert("This calendar could not be found. It may have been removed.");
        }
      } catch (e) {
        console.error(e);
        alert("This share link could not be opened.");
      }
      return;
    }

    // 2) Legacy shared link: #va=<base64 json>  (kept for backward compatibility)
    if (hash.startsWith("#va=")) {
      document.body.classList.add("viewer-mode");
      togglePresentationModeForced(true);
      try {
        const decoded = decodeURIComponent(atob(hash.replace("#va=", "")));
        const data = JSON.parse(decoded);
        renderCard(
          {
            id: uuid(),
            agency: data.agency,
            firstName: data.firstName,
            lastName: data.lastName,
            support: data.support,
            activeDay: data.activeDay,
            photo: data.photo || FALLBACK_PHOTO,
          },
          { readOnly: true }
        );
      } catch (e) {
        console.error("Invalid legacy share link", e);
        alert("This share link appears to be invalid.");
      }
      return;
    }

    // 3) Manager view: load everything (or seed one if empty)
    try {
      let rows = await loadAll();
      if (isConfigured && rows.length === 0) {
        const first = await createCalendar();
        rows = [first];
      }
      if (!isConfigured) {
        // Local-only preview so the UI is usable before Supabase is set up
        rows = [await createCalendar()];
      }
      rows.forEach((r) => renderCard(rowToView(r)));
    } catch (e) {
      console.error(e);
      setStatus("error", "Load failed");
      alert("Could not load calendars from Supabase. Check config.js and your table setup.");
    }
  });

  // Force presentation mode even in viewer-mode (bypasses the viewer guard)
  function togglePresentationModeForced(hide) {
    isPresentationMode = hide;
    const toolbar = document.getElementById("globalToolbar");
    const unhideBtn = document.getElementById("unhideBtn");
    if (hide) {
      if (toolbar) toolbar.classList.add("hidden");
      if (unhideBtn) unhideBtn.style.display = "none";
    }
  }
})();
