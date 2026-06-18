/**
 * app.js — AI-Powered Asylum Aid, frontend logic
 *
 * Architecture:
 *  - State object holds all mutable app state.
 *  - renderUI() re-applies language strings any time lang changes.
 *  - showIntake() / showChat() switch screens.
 *  - sendMessage() POSTs to /api/chat and reads a streaming NDJSON response
 *    using fetch + ReadableStream + TextDecoder.
 *  - fetchResources() GETs /api/resources?country=...
 *
 * NDJSON stream parsing:
 *  We accumulate raw bytes via response.body.getReader(), decode with
 *  TextDecoder (streaming:true so multi-byte UTF-8 chars across chunk
 *  boundaries are handled correctly), append to a carry buffer, then
 *  split on "\n". Every complete line is JSON.parsed. Partial final
 *  lines (no trailing newline yet) are kept in the buffer for the next
 *  chunk. This guarantees no dropped or split JSON objects.
 */

(function () {
  "use strict";

  /* ---- State ---- */
  var state = {
    lang: "en",
    profile: null,      // set on intake submit
    messages: [],       // { role: "user"|"assistant", content: string }
    streaming: false,
  };

  /* ---- DOM refs (populated after DOMContentLoaded) ---- */
  var DOM = {};

  /* ---- Boot ---- */
  document.addEventListener("DOMContentLoaded", function () {
    cacheDOMRefs();
    state.lang = i18n.detectLanguage();
    populateLangSelector();
    buildLangGate();
    bindEvents();
    applyLanguage(state.lang);
    showIntake();
    openLangGate(); // prompt for language as soon as the page loads
  });

  /* =========================================================
     DOM helpers
  ========================================================= */

  function cacheDOMRefs() {
    DOM.disclaimerText    = document.getElementById("disclaimer-text");
    DOM.footerNote        = document.getElementById("footer-note");
    DOM.langSelector      = document.getElementById("lang-selector");
    DOM.langSelectorLabel = document.getElementById("lang-selector-label");
    DOM.intakeScreen      = document.getElementById("intake-screen");
    DOM.chatScreen        = document.getElementById("chat-screen");

    // Intake
    DOM.intakeHeading     = document.getElementById("intake-heading");
    DOM.intakeSubheading  = document.getElementById("intake-subheading");
    DOM.privacyHeading    = document.getElementById("privacy-heading");
    DOM.privacyText       = document.getElementById("privacy-text");
    DOM.lblOrigin         = document.getElementById("lbl-origin");
    DOM.inputOrigin       = document.getElementById("input-origin");
    DOM.lblAsylum         = document.getElementById("lbl-asylum");
    DOM.inputAsylum       = document.getElementById("input-asylum");
    DOM.lblLocation       = document.getElementById("lbl-location");
    DOM.inputLocation     = document.getElementById("input-location");
    DOM.lblGender         = document.getElementById("lbl-gender");
    DOM.inputGender       = document.getElementById("input-gender");
    DOM.lblCivil          = document.getElementById("lbl-civil");
    DOM.inputCivil        = document.getElementById("input-civil");
    DOM.lblNotes          = document.getElementById("lbl-notes");
    DOM.inputNotes        = document.getElementById("input-notes");
    DOM.submitBtn         = document.getElementById("submit-btn");
    DOM.requiredNote      = document.getElementById("required-note");

    // Chat
    DOM.chatTitle         = document.getElementById("chat-title");
    DOM.chatMessages      = document.getElementById("chat-messages");
    DOM.typingIndicator   = document.getElementById("typing-indicator");
    DOM.typingText        = document.getElementById("typing-text");
    DOM.chatInput         = document.getElementById("chat-input");
    DOM.sendBtn           = document.getElementById("send-btn");
    DOM.legalHelpBtn      = document.getElementById("legal-help-btn");
    DOM.newSessionBtn     = document.getElementById("new-session-btn");

    // Resources modal
    DOM.resourcesOverlay  = document.getElementById("resources-overlay");
    DOM.resourcesTitle    = document.getElementById("resources-title");
    DOM.resourcesFor      = document.getElementById("resources-for");
    DOM.resourcesCloseBtn = document.getElementById("resources-close-btn");
    DOM.resourcesLoading  = document.getElementById("resources-loading");
    DOM.resourcesLoadingText = document.getElementById("resources-loading-text");
    DOM.resourcesError    = document.getElementById("resources-error");
    DOM.resourcesContent  = document.getElementById("resources-content");

    // Global error
    DOM.globalError       = document.getElementById("global-error");
    DOM.globalErrorText   = document.getElementById("global-error-text");
    DOM.globalErrorClose  = document.getElementById("global-error-close");

    // Map (help near you)
    DOM.mapBtn        = document.getElementById("map-btn");
    DOM.mapOverlay    = document.getElementById("map-overlay");
    DOM.mapTitle      = document.getElementById("map-title");
    DOM.mapNote       = document.getElementById("map-note");
    DOM.mapLocateBtn  = document.getElementById("map-locate-btn");
    DOM.mapCloseBtn   = document.getElementById("map-close-btn");
    DOM.mapStatus     = document.getElementById("map-status");
    DOM.mapCanvas     = document.getElementById("map-canvas");
    DOM.mapList       = document.getElementById("map-list");
    DOM.mapLoading    = document.getElementById("map-loading");
    DOM.mapLoadingText = document.getElementById("map-loading-text");

    // Language gate (shown on load)
    DOM.langOverlay    = document.getElementById("lang-overlay");
    DOM.langGateTitle  = document.getElementById("lang-gate-title");
    DOM.langGateSub    = document.getElementById("lang-gate-sub");
    DOM.langGateSearch = document.getElementById("lang-gate-search");
    DOM.langGateList   = document.getElementById("lang-gate-list");
  }

  /* =========================================================
     Language handling
  ========================================================= */

  // Fallback list if languages.js failed to load (keeps the app usable).
  var FALLBACK_LANGUAGES = [
    { code: "en", name: "English", native: "English" },
    { code: "es", name: "Spanish", native: "Español" },
    { code: "ar", name: "Arabic", native: "العربية", rtl: true },
    { code: "fr", name: "French", native: "Français" },
    { code: "uk", name: "Ukrainian", native: "Українська" },
  ];
  function languageList() {
    return (window.LANGUAGES && window.LANGUAGES.length) ? window.LANGUAGES : FALLBACK_LANGUAGES;
  }
  // Look up a language entry by code.
  function languageEntry(code) {
    var list = languageList();
    for (var i = 0; i < list.length; i++) if (list[i].code === code) return list[i];
    return null;
  }
  // RTL if the canonical list flags it; fall back to i18n's known RTL set.
  function isLangRTL(code) {
    var e = languageEntry(code);
    if (e && typeof e.rtl === "boolean") return e.rtl;
    return i18n.isRTL(code);
  }

  function populateLangSelector() {
    DOM.langSelector.innerHTML = "";
    languageList().forEach(function (lng) {
      var el = document.createElement("option");
      el.value = lng.code;
      // Show the native name first (so a speaker recognizes it), then the English
      // name for staff/helpers. Fall back to the English name alone.
      el.textContent = (lng.native && lng.native !== lng.name)
        ? lng.native + " — " + lng.name
        : lng.name;
      DOM.langSelector.appendChild(el);
    });
    DOM.langSelector.value = state.lang;
  }

  /* ---- Country dropdowns (labels localized via Intl.DisplayNames) ---- */
  var _regionNames = {};
  function regionNames(lang) {
    if (!_regionNames[lang]) {
      try { _regionNames[lang] = new Intl.DisplayNames([lang], { type: "region" }); }
      catch (e) { _regionNames[lang] = new Intl.DisplayNames(["en"], { type: "region" }); }
    }
    return _regionNames[lang];
  }
  function codeToEnglishName(code) {
    if (!code) return "";
    try { return regionNames("en").of(code) || code; }
    catch (e) { return code; }
  }
  function populateCountrySelect(selectEl, lang) {
    if (!selectEl || !window.COUNTRY_CODES) return;
    var prev = selectEl.value; // preserve the selected code across re-localization
    var dn = regionNames(lang);
    var items = window.COUNTRY_CODES.map(function (code) {
      var name;
      try { name = dn.of(code) || code; } catch (e) { name = code; }
      return { code: code, name: name };
    });
    items.sort(function (a, b) { return a.name.localeCompare(b.name, lang); });
    selectEl.innerHTML = "";
    var ph = document.createElement("option");
    ph.value = "";
    ph.textContent = i18n.t(lang, "countrySelectPlaceholder");
    selectEl.appendChild(ph);
    items.forEach(function (it) {
      var o = document.createElement("option");
      o.value = it.code;
      o.textContent = it.name;
      selectEl.appendChild(o);
    });
    selectEl.value = prev;
  }

  /* ---- Gender / civil status dropdowns ---- */
  var GENDER_OPTIONS = [
    { value: "Female", key: "genderFemale" },
    { value: "Male", key: "genderMale" },
    { value: "Non-binary", key: "genderNonBinary" },
    { value: "Prefer not to say", key: "genderPreferNot" },
  ];
  var CIVIL_OPTIONS = [
    { value: "Single", key: "civilSingle" },
    { value: "Married", key: "civilMarried" },
    { value: "Divorced", key: "civilDivorced" },
    { value: "Widowed", key: "civilWidowed" },
    { value: "Separated", key: "civilSeparated" },
    { value: "Prefer not to say", key: "civilPreferNot" },
  ];
  // Populate an optional choice <select> with a localized placeholder + options.
  // Values are stable (English) so a selection survives a language switch; only
  // the visible labels re-localize.
  function populateChoiceSelect(selectEl, options, lang) {
    if (!selectEl) return;
    var prev = selectEl.value;
    selectEl.innerHTML = "";
    var ph = document.createElement("option");
    ph.value = "";
    ph.textContent = i18n.t(lang, "choosePlaceholder");
    selectEl.appendChild(ph);
    options.forEach(function (opt) {
      var o = document.createElement("option");
      o.value = opt.value;
      o.textContent = i18n.t(lang, opt.key);
      selectEl.appendChild(o);
    });
    selectEl.value = prev;
  }

  /* ---- Language gate (full language picker shown on load) ---- */
  function buildLangGate() {
    if (!DOM.langGateList) return;
    DOM.langGateList.innerHTML = "";
    languageList().forEach(function (lng) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lang-gate-item";
      btn.setAttribute("role", "option");
      btn.setAttribute("data-code", lng.code);
      btn.setAttribute(
        "data-search",
        ((lng.native || "") + " " + (lng.name || "")).toLowerCase()
      );
      if (lng.code === state.lang) btn.setAttribute("aria-selected", "true");
      var nat = document.createElement("span");
      nat.className = "lang-gate-native";
      nat.textContent = lng.native || lng.name;
      btn.appendChild(nat);
      if (lng.native && lng.native !== lng.name) {
        var en = document.createElement("span");
        en.className = "lang-gate-en";
        en.textContent = lng.name;
        btn.appendChild(en);
      }
      DOM.langGateList.appendChild(btn);
    });
  }

  function filterLangGate(q) {
    q = (q || "").toLowerCase().trim();
    var items = DOM.langGateList.querySelectorAll(".lang-gate-item");
    for (var i = 0; i < items.length; i++) {
      var hay = items[i].getAttribute("data-search") || "";
      items[i].style.display = (!q || hay.indexOf(q) !== -1) ? "" : "none";
    }
  }

  function openLangGate() {
    if (!DOM.langOverlay) return;
    DOM.langOverlay.classList.add("open");
    if (DOM.langGateSearch) { DOM.langGateSearch.value = ""; filterLangGate(""); }
    setTimeout(function () { if (DOM.langGateSearch) DOM.langGateSearch.focus(); }, 60);
  }

  function closeLangGate() {
    if (!DOM.langOverlay) return;
    DOM.langOverlay.classList.remove("open");
    if (DOM.inputOrigin) DOM.inputOrigin.focus();
  }

  function applyLanguage(lang) {
    state.lang = lang;
    var t = function (key) { return i18n.t(lang, key); };

    // RTL
    if (isLangRTL(lang)) {
      document.documentElement.setAttribute("dir", "rtl");
      document.documentElement.setAttribute("lang", lang);
    } else {
      document.documentElement.setAttribute("dir", "ltr");
      document.documentElement.setAttribute("lang", lang);
    }

    // Disclaimer (banner + footer reiteration)
    DOM.disclaimerText.textContent = t("disclaimer");
    if (DOM.footerNote) DOM.footerNote.textContent = t("disclaimer");

    // Header
    DOM.langSelectorLabel.textContent = t("languageLabel");
    DOM.langSelector.value = lang;

    // Language gate
    if (DOM.langGateTitle) DOM.langGateTitle.textContent = t("langGateTitle");
    if (DOM.langGateSub) DOM.langGateSub.textContent = t("langGateSub");
    if (DOM.langGateSearch) DOM.langGateSearch.setAttribute("placeholder", t("langGateSearch"));

    // Intake
    DOM.intakeHeading.textContent     = t("intakeHeading");
    DOM.intakeSubheading.textContent  = t("intakeSubheading");
    DOM.privacyHeading.textContent    = t("privacyHeading");
    DOM.privacyText.textContent       = t("privacyNotice");

    DOM.lblOrigin.textContent    = t("countryOfOriginLabel");
    populateCountrySelect(DOM.inputOrigin, lang);
    DOM.lblAsylum.textContent    = t("countryOfAsylumLabel");
    populateCountrySelect(DOM.inputAsylum, lang);
    DOM.lblLocation.textContent  = t("currentLocationLabel");
    DOM.inputLocation.placeholder= t("currentLocationPlaceholder");
    DOM.lblGender.textContent    = t("genderLabel");
    populateChoiceSelect(DOM.inputGender, GENDER_OPTIONS, lang);
    DOM.lblCivil.textContent     = t("civilStatusLabel");
    populateChoiceSelect(DOM.inputCivil, CIVIL_OPTIONS, lang);
    DOM.lblNotes.textContent     = t("notesLabel");
    DOM.inputNotes.placeholder   = t("notesPlaceholder");
    DOM.submitBtn.textContent    = t("submitButton");
    DOM.requiredNote.textContent = t("requiredNote");

    // Chat
    DOM.chatTitle.textContent        = t("chatHeading");
    DOM.typingText.textContent       = t("typingIndicator");
    DOM.chatInput.placeholder        = t("inputPlaceholder");
    DOM.sendBtn.textContent          = state.streaming ? t("sendingButton") : t("sendButton");
    DOM.legalHelpBtn.textContent     = t("legalHelpButton");
    DOM.newSessionBtn.textContent    = t("newSessionButton");

    // Resources modal
    DOM.resourcesTitle.textContent   = t("resourcesHeading");
    DOM.resourcesCloseBtn.setAttribute("aria-label", t("resourcesClose"));

    // Map
    DOM.mapBtn.textContent           = t("mapButton");
    DOM.mapTitle.textContent         = t("mapHeading");
    DOM.mapNote.textContent          = t("mapNote");
    DOM.mapLocateBtn.textContent     = t("mapUseMyLocation");
    DOM.mapCloseBtn.setAttribute("aria-label", t("resourcesClose"));
  }

  /* =========================================================
     Event bindings
  ========================================================= */

  function bindEvents() {
    // Language change
    DOM.langSelector.addEventListener("change", function () {
      applyLanguage(DOM.langSelector.value);
    });

    // Intake submit
    document.getElementById("intake-form").addEventListener("submit", function (e) {
      e.preventDefault();
      handleIntakeSubmit();
    });

    // Chat send
    DOM.sendBtn.addEventListener("click", handleChatSend);
    DOM.chatInput.addEventListener("keydown", function (e) {
      // Submit on Enter (not Shift+Enter)
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!state.streaming) handleChatSend();
      }
    });

    // Auto-grow textarea
    DOM.chatInput.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = Math.min(this.scrollHeight, 120) + "px";
    });

    // Legal help
    DOM.legalHelpBtn.addEventListener("click", handleLegalHelp);

    // New session
    DOM.newSessionBtn.addEventListener("click", function () {
      state.messages = [];
      state.profile = null;
      state.streaming = false;
      DOM.chatMessages.innerHTML = "";
      showIntake();
    });

    // Resources close
    DOM.resourcesCloseBtn.addEventListener("click", closeResourcesPanel);
    DOM.resourcesOverlay.addEventListener("click", function (e) {
      if (e.target === DOM.resourcesOverlay) closeResourcesPanel();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeResourcesPanel();
    });

    // Map
    DOM.mapBtn.addEventListener("click", openMapPanel);
    DOM.mapCloseBtn.addEventListener("click", closeMapPanel);
    DOM.mapOverlay.addEventListener("click", function (e) {
      if (e.target === DOM.mapOverlay) closeMapPanel();
    });
    DOM.mapLocateBtn.addEventListener("click", useMyLocation);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMapPanel();
    });

    // Language gate
    if (DOM.langGateList) {
      DOM.langGateList.addEventListener("click", function (e) {
        var btn = e.target.closest ? e.target.closest(".lang-gate-item") : null;
        if (!btn) return;
        var code = btn.getAttribute("data-code");
        if (code) applyLanguage(code);
        closeLangGate();
      });
    }
    if (DOM.langGateSearch) {
      DOM.langGateSearch.addEventListener("input", function () { filterLangGate(this.value); });
    }
    if (DOM.langOverlay) {
      DOM.langOverlay.addEventListener("click", function (e) {
        if (e.target === DOM.langOverlay) closeLangGate(); // accept the current language
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && DOM.langOverlay && DOM.langOverlay.classList.contains("open")) {
        closeLangGate();
      }
    });

    // Global error close
    DOM.globalErrorClose.addEventListener("click", hideGlobalError);
  }

  /* =========================================================
     Screen transitions
  ========================================================= */

  function showIntake() {
    DOM.intakeScreen.classList.remove("hidden");
    DOM.chatScreen.classList.add("hidden");
    DOM.inputOrigin.focus();
  }

  function showChat() {
    DOM.intakeScreen.classList.add("hidden");
    DOM.chatScreen.classList.remove("hidden");
    DOM.chatInput.focus();
  }

  /* =========================================================
     Intake form submission
  ========================================================= */

  function handleIntakeSubmit() {
    var originCode = DOM.inputOrigin.value;
    var asylumCode = DOM.inputAsylum.value;
    var location = DOM.inputLocation.value.trim();
    var gender   = DOM.inputGender.value.trim();
    var civil    = DOM.inputCivil.value.trim();
    var notes    = DOM.inputNotes.value.trim();

    if (!originCode || !asylumCode || !location) {
      showGlobalError(i18n.t(state.lang, "errorRequired"));
      return;
    }

    hideGlobalError();

    state.profile = {
      countryOfOrigin: codeToEnglishName(originCode),
      countryOfAsylum: codeToEnglishName(asylumCode),
      currentLocation: location,
      gender: gender || undefined,
      civilStatus: civil || undefined,
      notes: notes || undefined,
    };

    state.messages = [];
    DOM.chatMessages.innerHTML = "";

    // Build and send initial message
    var initialContent = i18n.buildInitialMessage(state.lang, state.profile);
    showChat();
    sendMessage(initialContent);
  }

  /* =========================================================
     Chat send
  ========================================================= */

  function handleChatSend() {
    if (state.streaming) return;
    var text = DOM.chatInput.value.trim();
    if (!text) return;

    DOM.chatInput.value = "";
    DOM.chatInput.style.height = "auto";
    hideGlobalError();
    sendMessage(text);
  }

  /* =========================================================
     Core: send a message and stream the response
  ========================================================= */

  function sendMessage(userContent) {
    // Append to history
    state.messages.push({ role: "user", content: userContent });

    // Render user message
    appendMessageBubble("user", userContent, false);

    // Set streaming state
    state.streaming = true;
    setInputsDisabled(true);
    showTypingIndicator();

    var body = JSON.stringify({
      language: state.lang,
      profile: state.profile,
      messages: state.messages.slice(), // send full history
    });

    // Create a placeholder bubble for the streaming assistant message
    var streamBubble = appendMessageBubble("assistant", "", true);

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
    })
      .then(function (response) {
        if (!response.ok) {
          return response.text().then(function (errText) {
            throw new Error(errText || "HTTP " + response.status);
          });
        }
        return readNDJSONStream(response.body, streamBubble);
      })
      .catch(function (err) {
        console.error("Stream error:", err);
        hideTypingIndicator();
        // Remove the empty/partial assistant history entry to keep history clean
        if (
          state.messages.length > 0 &&
          state.messages[state.messages.length - 1].role === "assistant" &&
          !state.messages[state.messages.length - 1].content
        ) {
          state.messages.pop();
        }
        // Replace stream bubble with error message
        streamBubble.parentElement.remove();
        var msg = err.message && err.message.indexOf("fetch") !== -1
          ? i18n.t(state.lang, "errorNetwork")
          : i18n.t(state.lang, "errorStream");
        appendMessageBubble("error", msg, false);
        showGlobalError(msg);
      })
      .finally(function () {
        state.streaming = false;
        setInputsDisabled(false);
        hideTypingIndicator();
        DOM.chatInput.focus();
      });
  }

  /**
   * Read an NDJSON stream from a ReadableStream.
   *
   * Strategy:
   *   - getReader() on the body
   *   - TextDecoder with stream:true so multi-byte chars across chunk
   *     boundaries are decoded correctly
   *   - Carry buffer: accumulate decoded text, split on "\n",
   *     parse each complete line, keep the tail fragment for the next chunk
   *   - On each {"type":"delta","text":"..."} line, append text to the
   *     streaming bubble and update the history entry
   *   - On {"type":"done"} finish cleanly
   *   - On {"type":"error"} surface the message to the user
   */
  function readNDJSONStream(readableStream, bubbleEl) {
    var reader = readableStream.getReader();
    var decoder = new TextDecoder("utf-8", { stream: true });
    var buffer = "";
    var accumulatedText = "";

    // Push a placeholder into history now; we'll update its content live
    var histIdx = state.messages.length;
    state.messages.push({ role: "assistant", content: "" });

    function pump() {
      return reader.read().then(function (result) {
        if (result.done) {
          // Flush any remaining bytes in decoder
          var tail = decoder.decode(new Uint8Array(0), { stream: false });
          if (tail) buffer += tail;
          // Parse any final line without trailing newline
          var remaining = buffer.trim();
          if (remaining) processLine(remaining);
          // Finalize
          finaliseStreamBubble(bubbleEl, accumulatedText);
          return;
        }

        // Decode chunk (stream:true keeps decoder state between calls)
        buffer += decoder.decode(result.value, { stream: true });

        // Split on newlines
        var lines = buffer.split("\n");
        // Last element is an incomplete line (or empty string); keep in buffer
        buffer = lines[lines.length - 1];
        // Process all complete lines
        for (var i = 0; i < lines.length - 1; i++) {
          processLine(lines[i]);
        }

        // Scroll to bottom
        scrollChatToBottom();

        return pump();
      });
    }

    function processLine(line) {
      line = line.trim();
      if (!line) return;
      var obj;
      try {
        obj = JSON.parse(line);
      } catch (e) {
        // Malformed line — skip silently (defensive)
        return;
      }

      if (obj.type === "delta" && typeof obj.text === "string") {
        accumulatedText += obj.text;
        // Update in-memory history
        state.messages[histIdx].content = accumulatedText;
        // Render markdown into the streaming bubble
        bubbleEl.innerHTML = renderMarkdown(accumulatedText);
        // Hide typing indicator once first text arrives
        hideTypingIndicator();
        scrollChatToBottom();
      } else if (obj.type === "done") {
        // Stream complete — handled in pump's done branch
      } else if (obj.type === "error") {
        throw new Error(obj.message || i18n.t(state.lang, "errorGeneral"));
      }
    }

    return pump();
  }

  /* =========================================================
     Markdown renderer (minimal, safe)
     Order: escape HTML first, then convert markdown tokens.
  ========================================================= */

  function renderMarkdown(raw) {
    // 1. Escape HTML to prevent XSS
    var escaped = raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    // 2. Convert markdown tokens (operate on escaped string)
    var html = escaped;

    // Links: [text](url) — url has already been HTML-escaped
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      function (_, linkText, linkUrl) {
        // Sanitize: only allow http/https
        var safe = /^https?:\/\//i.test(linkUrl.replace(/&amp;/g, "&"));
        if (!safe) return linkText;
        return '<a href="' + linkUrl + '" target="_blank" rel="noopener noreferrer">' +
               linkText + "</a>";
      }
    );

    // Bold: **text**
    html = html.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");

    // Process line-by-line for headings and lists.
    // IMPORTANT: blank lines between list items of the SAME type must NOT break
    // the list — otherwise each item becomes its own <ol> and restarts at "1.".
    var lines = html.split("\n");
    var output = [];
    var listType = null; // "ol" | "ul" | null

    function closeList() {
      if (listType === "ol") output.push("</ol>");
      else if (listType === "ul") output.push("</ul>");
      listType = null;
    }
    function isOrdered(s) { return /^\s*\d+\.\s+/.test(s); }
    function isUnordered(s) { return /^\s*[-*]\s+/.test(s); }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      // ## Heading (H2)
      var headingMatch = line.match(/^##\s+(.+)$/);
      if (headingMatch) {
        closeList();
        output.push("<h2>" + headingMatch[1] + "</h2>");
        continue;
      }

      // Numbered list item
      var olMatch = line.match(/^\s*\d+\.\s+(.+)$/);
      if (olMatch) {
        if (listType !== "ol") { closeList(); output.push("<ol>"); listType = "ol"; }
        output.push("<li>" + olMatch[1] + "</li>");
        continue;
      }

      // Bulleted list item
      var ulMatch = line.match(/^\s*[-*]\s+(.+)$/);
      if (ulMatch) {
        if (listType !== "ul") { closeList(); output.push("<ul>"); listType = "ul"; }
        output.push("<li>" + ulMatch[1] + "</li>");
        continue;
      }

      // Blank line: keep the list open if it resumes after the blank(s).
      if (line.trim() === "") {
        if (listType) {
          var j = i + 1;
          while (j < lines.length && lines[j].trim() === "") j++;
          if (j < lines.length &&
              ((listType === "ol" && isOrdered(lines[j])) ||
               (listType === "ul" && isUnordered(lines[j])))) {
            continue; // same list continues — do not close it
          }
          closeList();
        }
        continue;
      }

      // Normal text line
      closeList();
      output.push("<p>" + line + "</p>");
    }

    closeList();

    return output.join("\n");
  }

  /* =========================================================
     Chat message bubble helpers
  ========================================================= */

  /**
   * Append a message bubble to the chat.
   * Returns the inner .message-bubble element (so streaming can update it).
   * role: "user" | "assistant" | "error"
   * isStreaming: if true, aria-live="polite" for accessibility
   */
  function appendMessageBubble(role, content, isStreaming) {
    var t = function (key) { return i18n.t(state.lang, key); };

    var wrapper = document.createElement("div");
    wrapper.className = "message message-" + (role === "error" ? "error assistant" : role);

    var roleEl = document.createElement("div");
    roleEl.className = "message-role";
    roleEl.textContent = role === "user" ? t("youLabel") : t("assistantLabel");
    if (role === "error") roleEl.style.display = "none";

    var bubble = document.createElement("div");
    bubble.className = "message-bubble";
    if (isStreaming) {
      bubble.setAttribute("aria-live", "polite");
      bubble.setAttribute("aria-atomic", "false");
    }

    if (role === "user") {
      // User text: HTML-escape only (no markdown)
      bubble.textContent = content;
    } else if (content) {
      bubble.innerHTML = renderMarkdown(content);
    }

    wrapper.appendChild(roleEl);
    wrapper.appendChild(bubble);
    DOM.chatMessages.appendChild(wrapper);
    scrollChatToBottom();
    return bubble;
  }

  function finaliseStreamBubble(bubbleEl, text) {
    if (!text) {
      // Empty response — shouldn't happen, but handle gracefully
      bubbleEl.innerHTML = "";
    } else {
      bubbleEl.innerHTML = renderMarkdown(text);
    }
    bubbleEl.removeAttribute("aria-live");
    scrollChatToBottom();
  }

  function scrollChatToBottom() {
    DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
  }

  /* =========================================================
     Typing indicator
  ========================================================= */

  function showTypingIndicator() {
    DOM.typingIndicator.classList.add("visible");
    scrollChatToBottom();
  }

  function hideTypingIndicator() {
    DOM.typingIndicator.classList.remove("visible");
  }

  /* =========================================================
     Input enable/disable
  ========================================================= */

  function setInputsDisabled(disabled) {
    DOM.sendBtn.disabled    = disabled;
    DOM.chatInput.disabled  = disabled;
    DOM.sendBtn.textContent = disabled
      ? i18n.t(state.lang, "sendingButton")
      : i18n.t(state.lang, "sendButton");
  }

  /* =========================================================
     Legal help / resources
  ========================================================= */

  function handleLegalHelp() {
    if (!state.profile) return;
    openResourcesPanel(state.profile.countryOfAsylum);
  }

  function openResourcesPanel(country) {
    var t = function (key) { return i18n.t(state.lang, key); };

    // Reset
    DOM.resourcesContent.innerHTML = "";
    DOM.resourcesError.textContent = "";
    DOM.resourcesError.style.display = "none";
    DOM.resourcesLoading.style.display = "flex";
    DOM.resourcesLoadingText.textContent = t("resourcesLoading");
    DOM.resourcesFor.textContent = t("resourcesSubheading") + " " + country;

    DOM.resourcesOverlay.classList.add("open");
    DOM.resourcesCloseBtn.focus();

    fetch("/api/resources?country=" + encodeURIComponent(country))
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        DOM.resourcesLoading.style.display = "none";
        renderResources(data);
      })
      .catch(function () {
        DOM.resourcesLoading.style.display = "none";
        DOM.resourcesError.textContent = t("resourcesError");
        DOM.resourcesError.style.display = "block";
      });
  }

  function renderResources(data) {
    var t = function (key) { return i18n.t(state.lang, key); };
    var frag = document.createDocumentFragment();

    var sections = [
      { key: "official",  label: t("resourcesOfficial") },
      { key: "legalAid",  label: t("resourcesLegalAid") },
      { key: "global",    label: t("resourcesGlobal") },
    ];

    var hasAny = false;

    sections.forEach(function (section) {
      var items = data[section.key];
      if (!items || items.length === 0) return;
      hasAny = true;

      var sectionEl = document.createElement("div");
      sectionEl.className = "resources-section";

      var h3 = document.createElement("h3");
      h3.textContent = section.label;
      sectionEl.appendChild(h3);

      items.forEach(function (item) {
        var card = document.createElement("div");
        card.className = "resource-item";

        var a = document.createElement("a");
        a.href = item.url;
        a.textContent = item.name;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        card.appendChild(a);

        if (item.description) {
          var p = document.createElement("p");
          p.textContent = item.description;
          card.appendChild(p);
        }

        sectionEl.appendChild(card);
      });

      frag.appendChild(sectionEl);
    });

    if (!hasAny) {
      var none = document.createElement("p");
      none.textContent = t("resourcesNone");
      none.style.color = "var(--c-text-muted)";
      none.style.fontSize = "0.875rem";
      frag.appendChild(none);
    }

    DOM.resourcesContent.appendChild(frag);
  }

  function closeResourcesPanel() {
    DOM.resourcesOverlay.classList.remove("open");
    if (DOM.legalHelpBtn) DOM.legalHelpBtn.focus();
  }

  /* =========================================================
     Map: help near you (Leaflet + OpenStreetMap)
  ========================================================= */

  var mapState = { map: null, layer: null, initialized: false, abort: null, retry: null };

  // Search rings (metres). If nothing is found close by we automatically widen
  // the radius before telling the user "nothing nearby" — important for users in
  // less-densely-mapped suburban/rural areas where help may be 10–20 km away.
  var PLACES_RADII = [8000, 16000, 25000];

  // Status line under the header. When `retryFn` is given, a "Try again" button
  // is appended (used on errors so the user is never left at a dead end).
  function setMapStatus(msg, isError, retryFn) {
    DOM.mapStatus.innerHTML = "";
    if (!msg) {
      DOM.mapStatus.style.display = "none";
      DOM.mapStatus.className = "map-status";
      return;
    }
    DOM.mapStatus.className = "map-status" + (isError ? " map-status-error" : "");
    DOM.mapStatus.style.display = "block";
    var span = document.createElement("span");
    span.textContent = msg;
    DOM.mapStatus.appendChild(span);
    if (retryFn) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "map-retry-btn";
      btn.textContent = i18n.t(state.lang, "mapRetry");
      btn.addEventListener("click", retryFn);
      DOM.mapStatus.appendChild(btn);
    }
  }

  /* ---- Loading overlay + skeleton list ---- */
  function showMapLoading(msg) {
    DOM.mapLoadingText.textContent = msg || i18n.t(state.lang, "mapSearching");
    DOM.mapLoading.hidden = false;
  }
  function setMapLoadingText(msg) { DOM.mapLoadingText.textContent = msg; }
  function hideMapLoading() { DOM.mapLoading.hidden = true; }

  function renderMapSkeletons(n) {
    DOM.mapList.innerHTML = "";
    for (var i = 0; i < n; i++) {
      var card = document.createElement("div");
      card.className = "map-place-skeleton";
      var l1 = document.createElement("div");
      l1.className = "skeleton-line";
      var l2 = document.createElement("div");
      l2.className = "skeleton-line short";
      card.appendChild(l1);
      card.appendChild(l2);
      DOM.mapList.appendChild(card);
    }
  }

  // Abort any in-flight map request and hand back a fresh signal so a stale
  // response can never overwrite the results of a newer search.
  function freshMapAbort() {
    if (mapState.abort) { try { mapState.abort.abort(); } catch (e) {} }
    mapState.abort = (typeof AbortController !== "undefined") ? new AbortController() : null;
    return mapState.abort ? mapState.abort.signal : undefined;
  }

  function handleMapError(err, msg) {
    if (err && err.name === "AbortError") return; // superseded by a newer request
    hideMapLoading();
    DOM.mapList.innerHTML = "";
    setMapStatus(msg, true, mapState.retry);
  }

  function openMapPanel() {
    var t = function (key) { return i18n.t(state.lang, key); };
    DOM.mapOverlay.classList.add("open");
    DOM.mapCloseBtn.focus();

    if (!mapState.initialized) {
      if (typeof L === "undefined") { setMapStatus(t("mapError"), true); return; }
      try { L.Icon.Default.imagePath = "vendor/leaflet/images/"; } catch (e) {}
      mapState.map = L.map("map-canvas", { scrollWheelZoom: true }).setView([20, 0], 2);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapState.map);
      mapState.layer = L.layerGroup().addTo(mapState.map);
      mapState.initialized = true;
    }

    // Leaflet mis-measures a container that was display:none; fix after it shows.
    setTimeout(function () { if (mapState.map) mapState.map.invalidateSize(); }, 120);

    var query =
      (state.profile && (state.profile.currentLocation || state.profile.countryOfAsylum)) || "";
    if (query) centerByQuery(query);
    else { hideMapLoading(); setMapStatus("", false); }
  }

  function closeMapPanel() {
    // Cancel any in-flight lookup so it can't pop up after the panel is closed.
    if (mapState.abort) { try { mapState.abort.abort(); } catch (e) {} mapState.abort = null; }
    hideMapLoading();
    DOM.mapOverlay.classList.remove("open");
    if (DOM.mapBtn) DOM.mapBtn.focus();
  }

  function centerByQuery(query) {
    var t = function (key) { return i18n.t(state.lang, key); };
    mapState.retry = function () { centerByQuery(query); };
    var signal = freshMapAbort();
    setMapStatus("", false);
    showMapLoading(t("mapSearching"));
    renderMapSkeletons(4);
    fetch("/api/geocode?q=" + encodeURIComponent(query), { signal: signal })
      .then(function (res) { if (!res.ok) throw new Error("geocode"); return res.json(); })
      .then(function (loc) {
        if (mapState.map) mapState.map.setView([loc.lat, loc.lon], 12);
        // Reuse the same signal so geocode + places cancel together.
        return loadPlaces(loc.lat, loc.lon, signal);
      })
      .catch(function (err) { handleMapError(err, t("mapError")); });
  }

  function loadPlaces(lat, lon, signal) {
    var t = function (key) { return i18n.t(state.lang, key); };
    mapState.retry = function () { loadPlaces(lat, lon, freshMapAbort()); };
    if (signal === undefined) signal = freshMapAbort();
    if (mapState.layer) mapState.layer.clearLayers();
    showMapLoading(t("mapSearching"));
    renderMapSkeletons(4);

    var idx = 0;
    function attempt() {
      var radius = PLACES_RADII[idx];
      return fetch("/api/places?lat=" + lat + "&lon=" + lon + "&radius=" + radius, { signal: signal })
        .then(function (res) { if (!res.ok) throw new Error("places"); return res.json(); })
        .then(function (data) {
          var list = (data && data.places) || [];
          // Nothing close by: widen the ring and try again before giving up.
          if (list.length === 0 && idx < PLACES_RADII.length - 1) {
            idx++;
            setMapLoadingText(t("mapExpanding"));
            return attempt();
          }
          hideMapLoading();
          DOM.mapList.innerHTML = "";
          if (list.length === 0) { setMapStatus(t("mapEmpty"), false); return; }
          setMapStatus("", false);
          renderPlaces(list);
        });
    }
    return attempt().catch(function (err) { handleMapError(err, t("mapError")); });
  }

  function buildPopup(p) {
    var wrap = document.createElement("div");
    var nm = document.createElement("strong");
    nm.textContent = p.name;
    wrap.appendChild(nm);
    var cat = document.createElement("div");
    cat.style.fontSize = "0.78rem";
    cat.style.color = "#4e5868";
    cat.textContent = p.category;
    wrap.appendChild(cat);
    if (p.address) {
      var ad = document.createElement("div");
      ad.style.fontSize = "0.78rem";
      ad.textContent = p.address;
      wrap.appendChild(ad);
    }
    if (p.phone) {
      var ph = document.createElement("div");
      ph.style.fontSize = "0.78rem";
      ph.textContent = p.phone;
      wrap.appendChild(ph);
    }
    if (p.website) {
      var a = document.createElement("a");
      a.href = p.website; a.target = "_blank"; a.rel = "noopener noreferrer";
      a.textContent = "Website";
      wrap.appendChild(a);
    }
    return wrap;
  }

  function renderPlaces(list) {
    var t = function (key) { return i18n.t(state.lang, key); };

    list.forEach(function (p) {
      if (!mapState.layer) return;
      var marker = L.marker([p.lat, p.lon]);
      marker.bindPopup(buildPopup(p));
      mapState.layer.addLayer(marker);
    });

    var heading = document.createElement("h3");
    heading.className = "map-list-heading";
    heading.textContent = t("mapListHeading");
    DOM.mapList.appendChild(heading);

    list.forEach(function (p) {
      var item = document.createElement("div");
      item.className = "map-place";

      var top = document.createElement("div");
      top.className = "map-place-top";
      var nm = document.createElement("span");
      nm.className = "map-place-name";
      nm.textContent = p.name;
      var cat = document.createElement("span");
      cat.className = "map-place-cat";
      cat.textContent = p.category;
      top.appendChild(nm);
      top.appendChild(cat);
      item.appendChild(top);

      if (p.address) {
        var addr = document.createElement("div");
        addr.className = "map-place-meta";
        addr.textContent = p.address;
        item.appendChild(addr);
      }
      if (p.phone) {
        var ph = document.createElement("div");
        ph.className = "map-place-meta";
        ph.textContent = p.phone;
        item.appendChild(ph);
      }
      if (p.website) {
        var a = document.createElement("a");
        a.className = "map-place-link";
        a.href = p.website;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = p.website.replace(/^https?:\/\//, "").slice(0, 40);
        item.appendChild(a);
      }
      item.addEventListener("click", function () {
        if (mapState.map) mapState.map.setView([p.lat, p.lon], 16);
      });
      DOM.mapList.appendChild(item);
    });
  }

  function useMyLocation() {
    var t = function (key) { return i18n.t(state.lang, key); };
    if (!navigator.geolocation) { setMapStatus(t("mapError"), true); return; }
    mapState.retry = useMyLocation;
    setMapStatus("", false);
    showMapLoading(t("mapSearching"));
    renderMapSkeletons(4);
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        var la = pos.coords.latitude, lo = pos.coords.longitude;
        if (mapState.map) mapState.map.setView([la, lo], 13);
        loadPlaces(la, lo, freshMapAbort());
      },
      function () { hideMapLoading(); setMapStatus(t("mapError"), true, useMyLocation); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  }

  /* =========================================================
     Global error bar
  ========================================================= */

  function showGlobalError(msg) {
    DOM.globalErrorText.textContent = msg;
    DOM.globalError.classList.add("visible");
  }

  function hideGlobalError() {
    DOM.globalError.classList.remove("visible");
    DOM.globalErrorText.textContent = "";
  }

})();
