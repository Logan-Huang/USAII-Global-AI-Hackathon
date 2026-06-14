/**
 * i18n.js — UI string translations for AI-Powered Asylum Aid
 *
 * Hand-written, reviewed set: en, es, ar, fr, uk (below). English is canonical.
 * Every other canonical language (data/languages.json, ~100 codes) is filled in
 * by MACHINE translations from public/ui-translations.js (window.UI_TRANSLATIONS,
 * loaded just before this file). Those are merged UNDER the hand-written set, so
 * a reviewed language always wins. Any string still missing falls back to English.
 *
 * To regenerate the machine set after editing the English strings:
 *     node scripts/gen-ui-translations.js
 */
(function (global) {
  "use strict";

  var TRANSLATIONS = {
    en: {
      // Meta / page
      appTitle: "Asylum Aid",
      appSubtitle: "Confidential guidance for asylum seekers",

      // Disclaimer banner
      disclaimer:
        "This tool provides general information, not legal advice. Always confirm with a qualified attorney.",

      // Privacy notice
      privacyNotice:
        "We do not store your information. Nothing you type is saved or shared with any government.",
      privacyHeading: "Your Privacy",

      // Language selector
      languageLabel: "Language",

      // Intake form
      intakeHeading: "Tell us about your situation",
      intakeSubheading:
        "Your answers help us give you relevant, plain-language guidance. All fields marked (optional) are voluntary.",
      countryOfOriginLabel: "Country of origin",
      countryOfOriginPlaceholder: "e.g. Afghanistan",
      countryOfAsylumLabel: "Country where you are seeking protection",
      countryOfAsylumPlaceholder: "e.g. United States",
      currentLocationLabel: "Current location (city or country)",
      currentLocationPlaceholder: "e.g. New York, USA",
      genderLabel: "Gender (optional)",
      genderPlaceholder: "e.g. Female, Male, Non-binary",
      civilStatusLabel: "Civil status (optional)",
      civilStatusPlaceholder: "e.g. Single, Married, Widowed",
      notesLabel: "Briefly describe your situation (optional)",
      notesPlaceholder:
        "e.g. I fled conflict in my home country and arrived here two weeks ago.",
      submitButton: "Get guidance",
      requiredNote: 'Fields without "(optional)" are required.',

      // Chat view
      chatHeading: "Your guidance session",
      inputPlaceholder: "Ask a follow-up question…",
      sendButton: "Send",
      sendingButton: "Sending…",
      legalHelpButton: "Find legal help",
      newSessionButton: "Start over",
      typingIndicator: "Generating response…",
      youLabel: "You",
      assistantLabel: "Asylum Aid",

      // Resources panel
      resourcesHeading: "Legal Help & Resources",
      resourcesSubheading: "For:",
      resourcesOfficial: "Official Government Resources",
      resourcesLegalAid: "Legal Aid Organizations",
      resourcesGlobal: "Global Organizations",
      resourcesClose: "Close",
      resourcesError: "Could not load resources. Please try again.",
      resourcesLoading: "Loading resources…",
      resourcesNone: "No resources found for this country.",

      // Country dropdown
      countrySelectPlaceholder: "Select a country…",

      // Map (help near you)
      mapButton: "Help near me (map)",
      mapHeading: "Help near you",
      mapNote: "These places are mapped by the community (OpenStreetMap) and are not verified. For checked asylum help, use “Find legal help.”",
      mapUseMyLocation: "Use my location",
      mapSearching: "Looking for services near you…",
      mapEmpty: "No mapped places found nearby. Please use “Find legal help” for trusted organizations.",
      mapError: "Could not load the map. Please use “Find legal help” instead.",
      mapExpanding: "Nothing close by — widening the search area…",
      mapRetry: "Try again",
      mapListHeading: "Places on the map",

      // Errors
      errorNetwork: "Network error. Please check your connection and try again.",
      errorStream: "The response was interrupted. Please try again.",
      errorGeneral: "Something went wrong. Please try again.",
      errorRequired: "Please fill in all required fields.",

      // Initial message template (composed client-side in the user's language)
      initialMessageTemplate:
        "I am from {countryOfOrigin} and I am seeking asylum in {countryOfAsylum}. My current location is {currentLocation}. {genderLine}{civilStatusLine}{notes} Please explain in simple language what the asylum process looks like, what documents I might need, and what my first steps should be.",
      genderLine: "My gender is {gender}. ",
      civilStatusLine: "My civil status is {civilStatus}. ",
    },

    es: {
      appTitle: "Ayuda para Solicitantes de Asilo",
      appSubtitle: "Orientación confidencial para solicitantes de asilo",

      disclaimer:
        "Esta herramienta ofrece información general, no asesoramiento legal. Siempre consulte con un abogado calificado.",

      privacyNotice:
        "No almacenamos su información. Nada de lo que escriba se guarda ni se comparte con ningún gobierno.",
      privacyHeading: "Su privacidad",

      languageLabel: "Idioma",

      intakeHeading: "Cuéntenos su situación",
      intakeSubheading:
        "Sus respuestas nos ayudan a darle orientación clara y sencilla. Los campos marcados como (opcional) son voluntarios.",
      countryOfOriginLabel: "País de origen",
      countryOfOriginPlaceholder: "p. ej. Venezuela",
      countryOfAsylumLabel: "País donde busca protección",
      countryOfAsylumPlaceholder: "p. ej. España",
      currentLocationLabel: "Ubicación actual (ciudad o país)",
      currentLocationPlaceholder: "p. ej. Madrid, España",
      genderLabel: "Género (opcional)",
      genderPlaceholder: "p. ej. Femenino, Masculino, No binario",
      civilStatusLabel: "Estado civil (opcional)",
      civilStatusPlaceholder: "p. ej. Soltero/a, Casado/a, Viudo/a",
      notesLabel: "Describa brevemente su situación (opcional)",
      notesPlaceholder:
        "p. ej. Huí del conflicto en mi país y llegué aquí hace dos semanas.",
      submitButton: "Obtener orientación",
      requiredNote: 'Los campos sin "(opcional)" son obligatorios.',

      chatHeading: "Su sesión de orientación",
      inputPlaceholder: "Haga una pregunta adicional…",
      sendButton: "Enviar",
      sendingButton: "Enviando…",
      legalHelpButton: "Buscar ayuda legal",
      newSessionButton: "Empezar de nuevo",
      typingIndicator: "Generando respuesta…",
      youLabel: "Usted",
      assistantLabel: "Asylum Aid",

      resourcesHeading: "Ayuda Legal y Recursos",
      resourcesSubheading: "Para:",
      resourcesOfficial: "Recursos Oficiales del Gobierno",
      resourcesLegalAid: "Organizaciones de Asistencia Legal",
      resourcesGlobal: "Organizaciones Globales",
      resourcesClose: "Cerrar",
      resourcesError: "No se pudieron cargar los recursos. Intente de nuevo.",
      resourcesLoading: "Cargando recursos…",
      resourcesNone: "No se encontraron recursos para este país.",

      countrySelectPlaceholder: "Seleccione un país…",

      mapButton: "Ayuda cerca de mí (mapa)",
      mapHeading: "Ayuda cerca de usted",
      mapNote: "Estos lugares están cartografiados por la comunidad (OpenStreetMap) y no están verificados. Para ayuda de asilo verificada, use «Buscar ayuda legal».",
      mapUseMyLocation: "Usar mi ubicación",
      mapSearching: "Buscando servicios cerca de usted…",
      mapEmpty: "No se encontraron lugares cercanos en el mapa. Use «Buscar ayuda legal» para organizaciones de confianza.",
      mapError: "No se pudo cargar el mapa. Use «Buscar ayuda legal» en su lugar.",
      mapExpanding: "Nada cerca: ampliando el área de búsqueda…",
      mapRetry: "Reintentar",
      mapListHeading: "Lugares en el mapa",

      errorNetwork:
        "Error de red. Verifique su conexión e intente de nuevo.",
      errorStream: "La respuesta fue interrumpida. Intente de nuevo.",
      errorGeneral: "Algo salió mal. Intente de nuevo.",
      errorRequired: "Por favor complete todos los campos requeridos.",

      initialMessageTemplate:
        "Soy de {countryOfOrigin} y estoy solicitando asilo en {countryOfAsylum}. Mi ubicación actual es {currentLocation}. {genderLine}{civilStatusLine}{notes} Por favor explique en lenguaje sencillo cómo es el proceso de asilo, qué documentos podría necesitar y cuáles deberían ser mis primeros pasos.",
      genderLine: "Mi género es {gender}. ",
      civilStatusLine: "Mi estado civil es {civilStatus}. ",
    },

    ar: {
      appTitle: "مساعدة طالبي اللجوء",
      appSubtitle: "إرشادات سرية لطالبي اللجوء",

      disclaimer:
        "تقدم هذه الأداة معلومات عامة فقط، وليست استشارة قانونية. تأكد دائمًا من المعلومات مع محامٍ مؤهل.",

      privacyNotice:
        "لا نحتفظ بمعلوماتك. لا يتم حفظ أي شيء تكتبه أو مشاركته مع أي جهة حكومية.",
      privacyHeading: "خصوصيتك",

      languageLabel: "اللغة",

      intakeHeading: "أخبرنا عن وضعك",
      intakeSubheading:
        "تساعدنا إجاباتك في تقديم إرشادات واضحة وبسيطة لك. الحقول المحددة بـ (اختياري) طوعية.",
      countryOfOriginLabel: "بلد المنشأ",
      countryOfOriginPlaceholder: "مثال: سوريا",
      countryOfAsylumLabel: "البلد الذي تطلب فيه الحماية",
      countryOfAsylumPlaceholder: "مثال: ألمانيا",
      currentLocationLabel: "موقعك الحالي (مدينة أو بلد)",
      currentLocationPlaceholder: "مثال: برلين، ألمانيا",
      genderLabel: "الجنس (اختياري)",
      genderPlaceholder: "مثال: أنثى، ذكر",
      civilStatusLabel: "الحالة المدنية (اختياري)",
      civilStatusPlaceholder: "مثال: أعزب، متزوج، أرمل",
      notesLabel: "صف وضعك بإيجاز (اختياري)",
      notesPlaceholder: "مثال: فررت من النزاع في بلدي ووصلت هنا منذ أسبوعين.",
      submitButton: "احصل على إرشادات",
      requiredNote: "الحقول التي لا تحتوي على «(اختياري)» مطلوبة.",

      chatHeading: "جلسة الإرشادات الخاصة بك",
      inputPlaceholder: "اطرح سؤالًا إضافيًا…",
      sendButton: "إرسال",
      sendingButton: "جارٍ الإرسال…",
      legalHelpButton: "ابحث عن مساعدة قانونية",
      newSessionButton: "البدء من جديد",
      typingIndicator: "جارٍ توليد الرد…",
      youLabel: "أنت",
      assistantLabel: "مساعدة اللجوء",

      resourcesHeading: "المساعدة القانونية والموارد",
      resourcesSubheading: "لـ:",
      resourcesOfficial: "الموارد الحكومية الرسمية",
      resourcesLegalAid: "منظمات المساعدة القانونية",
      resourcesGlobal: "المنظمات العالمية",
      resourcesClose: "إغلاق",
      resourcesError: "تعذّر تحميل الموارد. يرجى المحاولة مرة أخرى.",
      resourcesLoading: "جارٍ تحميل الموارد…",
      resourcesNone: "لم يتم العثور على موارد لهذا البلد.",

      countrySelectPlaceholder: "اختر بلدًا…",

      mapButton: "مساعدة بالقرب مني (خريطة)",
      mapHeading: "مساعدة بالقرب منك",
      mapNote: "هذه الأماكن مرسومة من قبل المجتمع (OpenStreetMap) وغير مُتحقَّق منها. للحصول على مساعدة لجوء موثوقة، استخدم «ابحث عن مساعدة قانونية».",
      mapUseMyLocation: "استخدم موقعي",
      mapSearching: "جارٍ البحث عن خدمات بالقرب منك…",
      mapEmpty: "لم يتم العثور على أماكن قريبة على الخريطة. استخدم «ابحث عن مساعدة قانونية» للمنظمات الموثوقة.",
      mapError: "تعذّر تحميل الخريطة. استخدم «ابحث عن مساعدة قانونية» بدلاً من ذلك.",
      mapExpanding: "لا يوجد شيء قريب — جارٍ توسيع منطقة البحث…",
      mapRetry: "حاول مرة أخرى",
      mapListHeading: "الأماكن على الخريطة",

      errorNetwork: "خطأ في الشبكة. يرجى التحقق من اتصالك والمحاولة مرة أخرى.",
      errorStream: "تمت مقاطعة الرد. يرجى المحاولة مرة أخرى.",
      errorGeneral: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
      errorRequired: "يرجى ملء جميع الحقول المطلوبة.",

      initialMessageTemplate:
        "أنا من {countryOfOrigin} وأطلب اللجوء في {countryOfAsylum}. موقعي الحالي هو {currentLocation}. {genderLine}{civilStatusLine}{notes} يرجى شرح عملية اللجوء بلغة بسيطة، وما هي الوثائق التي قد أحتاجها، وما هي خطواتي الأولى.",
      genderLine: "جنسي هو {gender}. ",
      civilStatusLine: "حالتي المدنية هي {civilStatus}. ",
    },

    fr: {
      appTitle: "Aide aux demandeurs d'asile",
      appSubtitle: "Conseils confidentiels pour les demandeurs d'asile",

      disclaimer:
        "Cet outil fournit des informations générales, pas des conseils juridiques. Confirmez toujours avec un avocat qualifié.",

      privacyNotice:
        "Nous ne stockons pas vos informations. Rien de ce que vous tapez n'est enregistré ni partagé avec aucun gouvernement.",
      privacyHeading: "Votre confidentialité",

      languageLabel: "Langue",

      intakeHeading: "Parlez-nous de votre situation",
      intakeSubheading:
        "Vos réponses nous aident à vous fournir des conseils clairs et simples. Les champs marqués (facultatif) sont volontaires.",
      countryOfOriginLabel: "Pays d'origine",
      countryOfOriginPlaceholder: "ex. Haïti",
      countryOfAsylumLabel: "Pays où vous demandez la protection",
      countryOfAsylumPlaceholder: "ex. France",
      currentLocationLabel: "Localisation actuelle (ville ou pays)",
      currentLocationPlaceholder: "ex. Paris, France",
      genderLabel: "Genre (facultatif)",
      genderPlaceholder: "ex. Femme, Homme, Non-binaire",
      civilStatusLabel: "Situation civile (facultatif)",
      civilStatusPlaceholder: "ex. Célibataire, Marié(e), Veuf/Veuve",
      notesLabel: "Décrivez brièvement votre situation (facultatif)",
      notesPlaceholder:
        "ex. J'ai fui les conflits dans mon pays et je suis arrivé(e) ici il y a deux semaines.",
      submitButton: "Obtenir des conseils",
      requiredNote: "Les champs sans «(facultatif)» sont obligatoires.",

      chatHeading: "Votre session de conseils",
      inputPlaceholder: "Posez une question complémentaire…",
      sendButton: "Envoyer",
      sendingButton: "Envoi en cours…",
      legalHelpButton: "Trouver une aide juridique",
      newSessionButton: "Recommencer",
      typingIndicator: "Génération de la réponse…",
      youLabel: "Vous",
      assistantLabel: "Asylum Aid",

      resourcesHeading: "Aide juridique et ressources",
      resourcesSubheading: "Pour :",
      resourcesOfficial: "Ressources gouvernementales officielles",
      resourcesLegalAid: "Organisations d'aide juridique",
      resourcesGlobal: "Organisations mondiales",
      resourcesClose: "Fermer",
      resourcesError: "Impossible de charger les ressources. Veuillez réessayer.",
      resourcesLoading: "Chargement des ressources…",
      resourcesNone: "Aucune ressource trouvée pour ce pays.",

      countrySelectPlaceholder: "Choisissez un pays…",

      mapButton: "Aide près de moi (carte)",
      mapHeading: "Aide près de vous",
      mapNote: "Ces lieux sont cartographiés par la communauté (OpenStreetMap) et ne sont pas vérifiés. Pour une aide à l’asile vérifiée, utilisez « Trouver une aide juridique ».",
      mapUseMyLocation: "Utiliser ma position",
      mapSearching: "Recherche de services près de vous…",
      mapEmpty: "Aucun lieu trouvé à proximité sur la carte. Utilisez « Trouver une aide juridique » pour des organisations fiables.",
      mapError: "Impossible de charger la carte. Utilisez « Trouver une aide juridique » à la place.",
      mapExpanding: "Rien à proximité — élargissement de la zone de recherche…",
      mapRetry: "Réessayer",
      mapListHeading: "Lieux sur la carte",

      errorNetwork:
        "Erreur réseau. Vérifiez votre connexion et réessayez.",
      errorStream: "La réponse a été interrompue. Veuillez réessayer.",
      errorGeneral: "Une erreur s'est produite. Veuillez réessayer.",
      errorRequired: "Veuillez remplir tous les champs obligatoires.",

      initialMessageTemplate:
        "Je viens de {countryOfOrigin} et je demande l'asile en {countryOfAsylum}. Ma localisation actuelle est {currentLocation}. {genderLine}{civilStatusLine}{notes} Veuillez expliquer en langage simple comment se déroule le processus d'asile, quels documents je pourrais avoir besoin et quelles sont mes premières étapes.",
      genderLine: "Mon genre est {gender}. ",
      civilStatusLine: "Ma situation civile est {civilStatus}. ",
    },

    uk: {
      appTitle: "Допомога шукачам притулку",
      appSubtitle: "Конфіденційна допомога шукачам притулку",

      disclaimer:
        "Цей інструмент надає загальну інформацію, а не юридичні поради. Завжди консультуйтеся з кваліфікованим адвокатом.",

      privacyNotice:
        "Ми не зберігаємо вашу інформацію. Нічого з того, що ви вводите, не зберігається і не передається жодному уряду.",
      privacyHeading: "Ваша конфіденційність",

      languageLabel: "Мова",

      intakeHeading: "Розкажіть нам про вашу ситуацію",
      intakeSubheading:
        "Ваші відповіді допомагають нам надати вам зрозумілі та прості поради. Поля, позначені як (необов'язково), є добровільними.",
      countryOfOriginLabel: "Країна походження",
      countryOfOriginPlaceholder: "напр. Україна",
      countryOfAsylumLabel: "Країна, де ви шукаєте захист",
      countryOfAsylumPlaceholder: "напр. Польща",
      currentLocationLabel: "Поточне місцезнаходження (місто або країна)",
      currentLocationPlaceholder: "напр. Варшава, Польща",
      genderLabel: "Стать (необов'язково)",
      genderPlaceholder: "напр. Жінка, Чоловік, Небінарна особа",
      civilStatusLabel: "Сімейний стан (необов'язково)",
      civilStatusPlaceholder: "напр. Неодружений/а, Одружений/а, Вдівець/Вдова",
      notesLabel: "Коротко опишіть вашу ситуацію (необов'язково)",
      notesPlaceholder:
        "напр. Я втік/втекла від конфлікту у своїй країні і приїхав/приїхала сюди два тижні тому.",
      submitButton: "Отримати пораду",
      requiredNote: "Поля без «(необов'язково)» є обов'язковими.",

      chatHeading: "Ваша сесія консультації",
      inputPlaceholder: "Задайте додаткове запитання…",
      sendButton: "Надіслати",
      sendingButton: "Надсилання…",
      legalHelpButton: "Знайти юридичну допомогу",
      newSessionButton: "Почати заново",
      typingIndicator: "Генерація відповіді…",
      youLabel: "Ви",
      assistantLabel: "Asylum Aid",

      resourcesHeading: "Юридична допомога та ресурси",
      resourcesSubheading: "Для:",
      resourcesOfficial: "Офіційні державні ресурси",
      resourcesLegalAid: "Організації правової допомоги",
      resourcesGlobal: "Міжнародні організації",
      resourcesClose: "Закрити",
      resourcesError: "Не вдалося завантажити ресурси. Спробуйте ще раз.",
      resourcesLoading: "Завантаження ресурсів…",
      resourcesNone: "Для цієї країни ресурси не знайдено.",

      countrySelectPlaceholder: "Виберіть країну…",

      mapButton: "Допомога поруч (карта)",
      mapHeading: "Допомога поруч із вами",
      mapNote: "Ці місця нанесені спільнотою (OpenStreetMap) і не перевірені. Для перевіреної допомоги шукачам притулку скористайтеся «Знайти юридичну допомогу».",
      mapUseMyLocation: "Використати моє місцезнаходження",
      mapSearching: "Пошук служб поруч із вами…",
      mapEmpty: "Поблизу не знайдено місць на карті. Скористайтеся «Знайти юридичну допомогу» для надійних організацій.",
      mapError: "Не вдалося завантажити карту. Скористайтеся «Знайти юридичну допомогу».",
      mapExpanding: "Поблизу нічого немає — розширюємо зону пошуку…",
      mapRetry: "Спробувати ще раз",
      mapListHeading: "Місця на карті",

      errorNetwork:
        "Помилка мережі. Перевірте з'єднання та спробуйте ще раз.",
      errorStream: "Відповідь була перервана. Спробуйте ще раз.",
      errorGeneral: "Щось пішло не так. Спробуйте ще раз.",
      errorRequired: "Будь ласка, заповніть усі обов'язкові поля.",

      initialMessageTemplate:
        "Я з {countryOfOrigin} і шукаю притулку в {countryOfAsylum}. Моє поточне місцезнаходження: {currentLocation}. {genderLine}{civilStatusLine}{notes} Будь ласка, поясніть простою мовою, як виглядає процес отримання притулку, які документи можуть знадобитися і які мої перші кроки.",
      genderLine: "Моя стать: {gender}. ",
      civilStatusLine: "Мій сімейний стан: {civilStatus}. ",
    },
  };

  // Hand-written, reviewed languages — these always take priority on merge.
  var HAND_WRITTEN = ["en", "es", "ar", "fr", "uk"];

  // Merge the machine-generated translations (public/ui-translations.js) UNDER the
  // hand-written set: only add a language we don't already have by hand. Per-key
  // gaps still fall back to English via t().
  var GENERATED = global.UI_TRANSLATIONS || {};
  Object.keys(GENERATED).forEach(function (code) {
    if (!TRANSLATIONS[code]) TRANSLATIONS[code] = GENERATED[code];
  });

  // Everything we can render the UI in: hand-written first (canonical order),
  // then the generated languages.
  var SUPPORTED_LANGUAGES = HAND_WRITTEN.concat(
    Object.keys(TRANSLATIONS).filter(function (c) {
      return HAND_WRITTEN.indexOf(c) === -1;
    })
  );

  // RTL set: derive from the canonical language list (loaded before this file as
  // window.LANGUAGES) so every right-to-left script is covered, not just Arabic.
  var RTL_LANGUAGES = (global.LANGUAGES || [])
    .filter(function (l) { return l && l.rtl; })
    .map(function (l) { return l.code; });
  if (RTL_LANGUAGES.indexOf("ar") === -1) RTL_LANGUAGES.push("ar");

  /**
   * Detect the best supported language from navigator.language.
   * Falls back to "en".
   */
  function detectLanguage() {
    var nav = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    // Try exact match first (e.g. "es")
    var base = nav.split("-")[0];
    if (SUPPORTED_LANGUAGES.indexOf(base) !== -1) return base;
    // Try region variant (e.g. "zh-TW" won't match but "es-MX" → "es" does above)
    return "en";
  }

  /**
   * Get a translation key for a given language, falling back to "en".
   */
  function t(lang, key) {
    var langObj = TRANSLATIONS[lang] || TRANSLATIONS["en"];
    if (langObj[key] !== undefined) return langObj[key];
    // Fallback to English
    if (TRANSLATIONS["en"][key] !== undefined) return TRANSLATIONS["en"][key];
    return key; // Last resort: return the key itself
  }

  /**
   * Check if a language is RTL.
   */
  function isRTL(lang) {
    return RTL_LANGUAGES.indexOf(lang) !== -1;
  }

  /**
   * Build the initial user message from the profile and language.
   */
  function buildInitialMessage(lang, profile) {
    var template = t(lang, "initialMessageTemplate");
    var genderLine = profile.gender
      ? t(lang, "genderLine").replace("{gender}", profile.gender)
      : "";
    var civilStatusLine = profile.civilStatus
      ? t(lang, "civilStatusLine").replace("{civilStatus}", profile.civilStatus)
      : "";
    var notes = profile.notes ? profile.notes + " " : "";

    return template
      .replace("{countryOfOrigin}", profile.countryOfOrigin)
      .replace("{countryOfAsylum}", profile.countryOfAsylum)
      .replace("{currentLocation}", profile.currentLocation)
      .replace("{genderLine}", genderLine)
      .replace("{civilStatusLine}", civilStatusLine)
      .replace("{notes}", notes);
  }

  // Expose on window
  global.i18n = {
    translations: TRANSLATIONS,
    supportedLanguages: SUPPORTED_LANGUAGES,
    rtlLanguages: RTL_LANGUAGES,
    detectLanguage: detectLanguage,
    t: t,
    isRTL: isRTL,
    buildInitialMessage: buildInitialMessage,
  };
})(window);
