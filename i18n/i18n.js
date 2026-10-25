/* Idiomas da Mi.IA: PT (padrão), EN, ES.
   Os textos ficam em /i18n/pt.json, /i18n/en.json e /i18n/es.json (um arquivo por idioma).
   Na página, cada texto tem data-i="chave". O português já está escrito no HTML. */
(function () {
  var LANGS = ['pt', 'en', 'es'];
  var HTML_LANG = { pt: 'pt-BR', en: 'en', es: 'es' };
  var KEY = 'mia_lang';
  var dict = {}, pt = {}, cur = 'pt', subs = [], ready = false;

  function saved() { try { var v = localStorage.getItem(KEY); if (LANGS.indexOf(v) > -1) return v; } catch (e) {} return 'pt'; }
  function save(l) { try { localStorage.setItem(KEY, l); } catch (e) {} }

  function t(k, fb) { var v = dict[k]; if (v == null) v = pt[k]; return v == null ? (fb == null ? k : fb) : v; }
  function f(k, o) { return String(t(k)).replace(/\{(\w+)\}/g, function (m, n) { return o && o[n] != null ? o[n] : m; }); }
  function get(url) { return fetch(url, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(url); return r.json(); }); }

  function apply() {
    document.documentElement.lang = HTML_LANG[cur];
    var i, el, els;
    els = document.querySelectorAll('[data-i]');
    for (i = 0; i < els.length; i++) { el = els[i]; var v = t(el.getAttribute('data-i'), null); if (v != null) el.innerHTML = v; }
    els = document.querySelectorAll('[data-i-attr]');
    for (i = 0; i < els.length; i++) {
      el = els[i];
      el.getAttribute('data-i-attr').split(';').forEach(function (p) {
        var s = p.indexOf(':'); if (s < 0) return;
        el.setAttribute(p.slice(0, s), t(p.slice(s + 1)));
      });
    }
    els = document.querySelectorAll('[data-i-wa]');
    for (i = 0; i < els.length; i++) {
      el = els[i];
      if (!el.getAttribute('data-wa-base')) el.setAttribute('data-wa-base', el.getAttribute('href').split('text=')[0] + 'text=');
      el.setAttribute('href', el.getAttribute('data-wa-base') + encodeURIComponent(t(el.getAttribute('data-i-wa'))));
    }
    renderSwitch();
    subs.forEach(function (fn) { try { fn(cur); } catch (e) {} });
  }

  function renderSwitch() {
    var hosts = document.querySelectorAll('[data-lang-sw]');
    for (var i = 0; i < hosts.length; i++) {
      var h = hosts[i]; h.className = 'lang-sw'; h.setAttribute('role', 'group'); h.setAttribute('aria-label', t('lang.label'));
      h.innerHTML = '';
      LANGS.forEach(function (l) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = l.toUpperCase();
        b.setAttribute('aria-pressed', l === cur ? 'true' : 'false'); b.setAttribute('lang', l);
        b.addEventListener('click', function () { set(l); });
        h.appendChild(b);
      });
    }
  }

  function set(l) {
    if (LANGS.indexOf(l) < 0) l = 'pt';
    save(l);
    return (l === 'pt' ? Promise.resolve(pt) : get('/i18n/' + l + '.json')).then(function (d) { cur = l; dict = d; apply(); }).catch(function () {});
  }

  function css() {
    var s = document.createElement('style');
    s.textContent = '.lang-sw{display:inline-flex;gap:3px;align-items:center;flex:none}' +
      '.lang-sw button{font:600 .76rem/1 system-ui,sans-serif;color:inherit;background:transparent;border:1px solid currentColor;border-radius:8px;padding:6px 7px;cursor:pointer;opacity:.55;min-width:32px}' +
      '.lang-sw button:hover{opacity:.9}' +
      '.lang-sw button[aria-pressed="true"]{opacity:1;font-weight:800;box-shadow:inset 0 -3px 0 currentColor}';
    document.head.appendChild(s);
  }

  window.MI18N = {
    t: t, f: f, get lang() { return cur; }, set: set,
    onChange: function (fn) { subs.push(fn); if (ready) { try { fn(cur); } catch (e) {} } },
    ready: function () { return ready; }
  };

  function boot() {
    css(); renderSwitch();
    get('/i18n/pt.json').then(function (d) { pt = d; dict = d; }).catch(function () {}).then(function () {
      var want = saved();
      return (want === 'pt' ? Promise.resolve() : set(want));
    }).then(function () { ready = true; subs.forEach(function (fn) { try { fn(cur); } catch (e) {} }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
