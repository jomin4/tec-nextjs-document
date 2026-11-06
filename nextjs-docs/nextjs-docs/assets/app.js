/* Next.js 한국어 학습 문서 - 공통 동작 (nav.js 가 window.NXKO 제공) */
(function () {
  const D = window.NXKO || { trees: { app: [], pages: [], shared: [] }, routes: {}, conf: {} };
  const body = document.body, root = document.documentElement;
  const ROUTE = body.dataset.route || '/docs';
  const $ = id => document.getElementById(id);
  const R = D.routes;
  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const isExt = r => /^https?:/.test(r);
  const href = r => (R[r] && R[r].d) ? R[r].s + '.html' : 'https://nextjs.org' + r;

  let pref = {};
  try { pref = JSON.parse(localStorage.getItem('nxko-pref') || '{}'); } catch (e) {}
  const save = () => { try { localStorage.setItem('nxko-pref', JSON.stringify(pref)); } catch (e) {} };

  /* ---------- 라우터 선택 ---------- */
  let router = body.dataset.router;
  if (router === 'shared') router = pref.router || 'app';
  else { pref.router = router; save(); }
  const RT = { app: ['Using App Router', 'Features available in /app'], pages: ['Using Pages Router', 'Features available in /pages'] };
  if ($('routerTitle')) { $('routerTitle').textContent = RT[router][0]; $('routerSub').textContent = RT[router][1]; }
  if ($('verText')) $('verText').textContent = (D.conf.version || '') + (D.conf.date ? ' · ' + D.conf.date + ' 원문 기준' : '');
  const menu = $('routerMenu');
  if ($('routerBtn') && menu) {
    $('routerBtn').onclick = e => { e.stopPropagation(); menu.hidden = !menu.hidden; };
    document.addEventListener('click', () => { menu.hidden = true; });
    menu.querySelectorAll('button').forEach(b => {
      b.classList.toggle('on', b.dataset.router === router);
      b.onclick = () => {
        const to = b.dataset.router;
        pref.router = to; save();
        if (to === router) { menu.hidden = true; return; }
        let target = '/docs/' + to;
        const m = ROUTE.match(/^\/docs\/(app|pages)(\/.*)?$/);
        if (m && m[2] && R['/docs/' + to + m[2]]) target = '/docs/' + to + m[2];
        location.href = href(target);
      };
    });
  }

  /* ---------- 사이드바 ---------- */
  const chev = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m6 4 4 4-4 4"/></svg>';
  function contains(node, r) { return node.r === r || (node.c || []).some(c => contains(c, r)); }
  function renderNode(nd, lvl) {
    const info = R[nd.r] || {};
    const done = info.d, act = nd.r === ROUTE;
    const label = `${esc(info.t || nd.r)}${info.k && info.k !== info.t ? `<span class="ko">${esc(info.k)}</span>` : ''}${info.v ? `<span class="vb">${esc(info.v)}</span>` : ''}`;
    const a = nd.r ? `<a class="item${act ? ' active' : ''}${done ? '' : ' todo'}" href="${href(nd.r)}"${done ? '' : ' target="_blank" rel="noopener" title="아직 번역 전: 원문으로 이동"'}>${label}</a>` : `<span class="item">${label}</span>`;
    const kids = nd.c || [];
    const open = kids.length && contains(nd, ROUTE);
    const search = esc(((info.t || '') + ' ' + (info.k || '')).toLowerCase());
    if (!kids.length) return `<li class="lvl${lvl}" data-s="${search}"><div class="row">${a}</div></li>`;
    return `<li class="lvl${lvl}${open ? ' open' : ''}" data-s="${search}"><div class="row">${a}<button class="tog" aria-label="펼치기">${chev}</button></div><ul>${kids.map(k => renderNode(k, lvl + 1)).join('')}</ul></li>`;
  }
  const nav = $('nav');
  if (nav) {
    const tree = D.trees[router] || [];
    nav.innerHTML = `<ul>${tree.map(n => renderNode(n, 0)).join('')}</ul><div class="sep"></div><ul>${D.trees.shared.map(n => renderNode(n, 0)).join('')}</ul>`;
    nav.querySelectorAll('.tog').forEach(b => b.addEventListener('click', e => { e.preventDefault(); b.closest('li').classList.toggle('open'); }));
    const act = nav.querySelector('a.active');
    if (act) setTimeout(() => act.scrollIntoView({ block: 'center' }), 0);
  }

  /* ---------- 목차 검색 ---------- */
  const search = $('search');
  if (search && nav) {
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      const lis = [...nav.querySelectorAll('li')];
      if (!q) { lis.forEach(li => { li.classList.remove('hidden-by-search'); li.classList.toggle('open', !!li.querySelector('a.active') && !!li.querySelector('ul')); }); return; }
      lis.forEach(li => li.classList.add('hidden-by-search'));
      lis.forEach(li => {
        if (li.dataset.s.includes(q)) {
          li.classList.remove('hidden-by-search');
          li.querySelectorAll('li').forEach(c => c.classList.remove('hidden-by-search'));
          let p = li.parentElement.closest('li');
          while (p) { p.classList.remove('hidden-by-search'); p.classList.add('open'); p = p.parentElement.closest('li'); }
        }
      });
    });
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (innerWidth <= 960) body.classList.add('nav-open'); search.focus(); search.select(); }
      if (e.key === 'Escape' && document.activeElement === search) { search.value = ''; search.dispatchEvent(new Event('input')); search.blur(); }
    });
  }

  /* ---------- 토글 ---------- */
  function apply() {
    root.classList.toggle('dark', !!pref.dark);
    body.classList.toggle('show-en', !!pref.en);
    $('btnEn') && $('btnEn').classList.toggle('on', !!pref.en);
  }
  apply();
  $('theme') && ($('theme').onclick = () => { pref.dark = !pref.dark; save(); apply(); });
  $('btnEn') && ($('btnEn').onclick = () => { pref.en = !pref.en; save(); apply(); });
  $('burger') && ($('burger').onclick = () => body.classList.toggle('nav-open'));

  /* ---------- 코드 ---------- */
  const toast = $('toast');
  function showToast(msg) { if (!toast) return; toast.textContent = msg; toast.classList.add('show'); clearTimeout(showToast.t); showToast.t = setTimeout(() => toast.classList.remove('show'), 1400); }
  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
    const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); return Promise.resolve();
  }
  if (window.hljs) document.querySelectorAll('.code pre code').forEach(c => { if (!/language-plaintext/.test(c.className)) { try { window.hljs.highlightElement(c); } catch (e) {} } });
  document.querySelectorAll('.code .copy').forEach(btn => btn.addEventListener('click', () => {
    const box = btn.closest('.code');
    const pre = [...box.querySelectorAll('pre')].find(p => !p.hidden);
    copyText(pre.innerText).then(() => { btn.classList.add('done'); showToast('코드를 복사했어요'); setTimeout(() => btn.classList.remove('done'), 1200); });
  }));
  function setLang(l) {
    pref.lang = l; save();
    document.querySelectorAll('.code.sw').forEach(box => {
      const js = l === 'js';
      box.querySelector('pre.v-ts').hidden = js; box.querySelector('pre.v-js').hidden = !js;
      box.querySelector('.fb-ts').hidden = js; box.querySelector('.fb-js').hidden = !js;
      const fn = box.querySelector('.fname'); if (fn) fn.textContent = (js ? fn.dataset.js : fn.dataset.ts) || fn.textContent;
      box.querySelector('.lang-sel span').textContent = js ? 'JavaScript' : 'TypeScript';
    });
  }
  document.querySelectorAll('.lang-sel').forEach(b => b.addEventListener('click', () => setLang(pref.lang === 'js' ? 'ts' : 'js')));
  if (pref.lang === 'js') setLang('js');
  function setPm(pm) {
    pref.pm = pm; save();
    document.querySelectorAll('.code.pm').forEach(box => {
      const has = box.querySelector('.pm-tab[data-pm="' + pm + '"]');
      if (!has) return;
      box.querySelectorAll('.pm-tab').forEach(t => t.classList.toggle('on', t.dataset.pm === pm));
      box.querySelectorAll('pre').forEach(p => { p.hidden = !p.classList.contains('pm-' + pm); });
    });
  }
  document.querySelectorAll('.pm-tab').forEach(t => t.addEventListener('click', () => setPm(t.dataset.pm)));
  if (pref.pm) setPm(pref.pm);

  /* ---------- 오른쪽 목차 스크롤 표시 ---------- */
  const tocLinks = [...document.querySelectorAll('aside.toc a')];
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const map = new Map(tocLinks.map(a => [decodeURIComponent(a.getAttribute('href').slice(1)), a]));
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) { tocLinks.forEach(a => a.classList.remove('on')); const a = map.get(e.target.id); if (a) a.classList.add('on'); } });
    }, { rootMargin: '-80px 0px -70% 0px' });
    map.forEach((a, id) => { const h = document.getElementById(id); if (h) io.observe(h); });
  }

  /* ---------- 마크다운 복사 ---------- */
  $('copyPage') && ($('copyPage').onclick = () => {
    const src = $('md-src');
    if (src) copyText(src.textContent.trim()).then(() => showToast('번역 마크다운을 복사했어요'));
  });
})();
