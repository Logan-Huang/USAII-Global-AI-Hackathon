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
    applyLanguage(state.lang);
    bindEvents();
    showIntake();
  });

  /* =========================================================
     DOM helpers
  ========================================================= */

  function cacheDOMRefs() {
    DOM.disclaimerText    = document.getElementById("disclaimer-text");
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
    DOM.resourcesError    = document.getElementById("resources-error");
    DOM.resourcesContent  = document.getElementById("resources-content");

    // Global error
    DOM.globalError       = document.getElementById("global-error");
    DOM.globalErrorText   = document.getElementById("global-error-text");
    DOM.globalErrorClose  = document.getElementById("global-error-close");
  }

  /* =========================================================
     Language handling
  ========================================================= */

  function populateLangSelector() {
    var options = [
      { code: "en", label: "English" },
      { code: "es", label: "Español" },
      { code: "ar", label: "العربية" },
      { code: "fr", label: "Français" },
      { code: "uk", label: "Українська" },
    ];
    DOM.langSelector.innerHTML = "";
    options.forEach(function (opt) {
      var el = document.createElement("option");
      el.value = opt.code;
      el.textContent = opt.label;
      DOM.langSelector.appendChild(el);
    });
    DOM.langSelector.value = state.lang;
  }

  function applyLanguage(lang) {
    state.lang = lang;
    var t = function (key) { return i18n.t(lang, key); };

    // RTL
    if (i18n.isRTL(lang)) {
      document.documentElement.setAttribute("dir", "rtl");
      document.documentElement.setAttribute("lang", lang);
    } else {
      document.documentElement.setAttribute("dir", "ltr");
      document.documentElement.setAttribute("lang", lang);
    }

    // Disclaimer
    DOM.disclaimerText.textContent = t("disclaimer");

    // Header
    DOM.langSelectorLabel.textContent = t("languageLabel");
    DOM.langSelector.value = lang;

    // Intake
    DOM.intakeHeading.textContent     = t("intakeHeading");
    DOM.intakeSubheading.textContent  = t("intakeSubheading");
    DOM.privacyHeading.textContent    = t("privacyHeading");
    DOM.privacyText.textContent       = t("privacyNotice");

    DOM.lblOrigin.textContent    = t("countryOfOriginLabel");
    DOM.inputOrigin.placeholder  = t("countryOfOriginPlaceholder");
    DOM.lblAsylum.textContent    = t("countryOfAsylumLabel");
    DOM.inputAsylum.placeholder  = t("countryOfAsylumPlaceholder");
    DOM.lblLocation.textContent  = t("currentLocationLabel");
    DOM.inputLocation.placeholder= t("currentLocationPlaceholder");
    DOM.lblGender.textContent    = t("genderLabel");
    DOM.inputGender.placeholder  = t("genderPlaceholder");
    DOM.lblCivil.textContent     = t("civilStatusLabel");
    DOM.inputCivil.placeholder   = t("civilStatusPlaceholder");
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
    var origin   = DOM.inputOrigin.value.trim();
    var asylum   = DOM.inputAsylum.value.trim();
    var location = DOM.inputLocation.value.trim();
    var gender   = DOM.inputGender.value.trim();
    var civil    = DOM.inputCivil.value.trim();
    var notes    = DOM.inputNotes.value.trim();

    if (!origin || !asylum || !location) {
      showGlobalError(i18n.t(state.lang, "errorRequired"));
      return;
    }

    hideGlobalError();

    state.profile = {
      countryOfOrigin: origin,
      countryOfAsylum: asylum,
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

    // Process line-by-line for headings and lists
    var lines = html.split("\n");
    var output = [];
    var inUL = false;
    var inOL = false;

    function closeList() {
      if (inUL) { output.push("</ul>"); inUL = false; }
      if (inOL) { output.push("</ol>"); inOL = false; }
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      // ## Heading (only H2 per spec)
      var headingMatch = line.match(/^##\s+(.+)$/);
      if (headingMatch) {
        closeList();
        output.push("<h2>" + headingMatch[1] + "</h2>");
        continue;
      }

      // Numbered list: "1. item" or "2. item" etc.
      var olMatch = line.match(/^\d+\.\s+(.+)$/);
      if (olMatch) {
        if (inUL) { output.push("</ul>"); inUL = false; }
        if (!inOL) { output.push("<ol>"); inOL = true; }
        output.push("<li>" + olMatch[1] + "</li>");
        continue;
      }

      // Unordered list: "- item" or "* item"
      var ulMatch = line.match(/^[-*]\s+(.+)$/);
      if (ulMatch) {
        if (inOL) { output.push("</ol>"); inOL = false; }
        if (!inUL) { output.push("<ul>"); inUL = true; }
        output.push("<li>" + ulMatch[1] + "</li>");
        continue;
      }

      // Normal line
      closeList();
      if (line.trim() === "") {
        // Blank line — close any paragraphs; will render as spacing
        output.push("");
      } else {
        output.push("<p>" + line + "</p>");
      }
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
    DOM.resourcesLoading.style.display = "block";
    DOM.resourcesLoading.textContent = t("resourcesLoading");
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
