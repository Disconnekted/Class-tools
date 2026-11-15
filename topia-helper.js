/* TOPIA Helper: the Class Gradesheet's TOPIA tools as buttons on TOPIA pages (no bookmarks needed).
   Built from the gradesheet's own code; nothing is saved on TOPIA until the teacher presses Save. */
(function () {
  if (location.hostname.indexOf('topiaenglishzone.co.kr') < 0) { alert('Open TOPIA first, then tap the TOPIA Helper bookmark.'); return; }
  if (window.__gsHelper) { if (window.__gsBookmark) { window.__gsBookmark = 0; if (typeof window.__gsHelper === 'function') window.__gsHelper(); } return; }
  window.__gsHelper = 1;
function topiaFillBookmarklet(given) {
  const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  const until = async function (f, ms) { for (let t = 0; t < (ms || 8000); t += 150) { const v = f(); if (v) return v; await sleep(150); } return null; };
  const vis = function (el) { return !!(el && el.offsetParent); };
  const norm = function (s) { return String(s || '').toLowerCase().replace(/[^a-z0-9가-힣]/g, ''); };
  const setSelect = function (s, v) { Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, v); s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); };
  const sels = function () { return Array.from(document.querySelectorAll('select')).filter(vis); };
  const sessionSel = function () { return sels().find(function (s) { return Array.from(s.options).some(function (o) { return /회차/.test(o.text); }); }); };
  const classSel = function () { return sels().find(function (s) { return Array.from(s.options).some(function (o) { return /_\d+\s*\(/.test(o.text); }); }); };
  const clsKey = function (t) { return norm(String(t).split('(')[0]); };
  const grp = function (l) { return /particip/i.test(l) ? 'participation' : /writ|essay|summary/i.test(l) ? 'writing' : /word|vocab|idiom/i.test(l) ? 'vocab' : /present|debate|speech/i.test(l) ? 'presentation' : /monthly/i.test(l) ? 'monthly' : ''; };
  const run = async function (txt) {
    if (!txt || txt.indexOf('#GS-TOPIA') !== 0) { alert('Copy the scores in the gradesheet first (Copy Day N for TOPIA).'); return; }
    let data; try { data = JSON.parse(txt.slice(10)); } catch (e) { alert('Those copied scores could not be read. Copy them again.'); return; }
    let ss = sessionSel();
    if (!ss) {
      const cs = classSel();
      if (cs && clsKey(cs.options[cs.selectedIndex].text) !== clsKey(data.cls)) {
        const o = Array.from(cs.options).find(function (x) { return clsKey(x.text) === clsKey(data.cls); });
        if (!o) { alert('TOPIA has no class called ' + data.cls + '. Pick the class here, then try again.'); return; }
        setSelect(cs, o.value); await sleep(1500);
      }
      const reg = await until(function () { return Array.from(document.querySelectorAll('button')).find(function (b) { return vis(b) && /^\s*(register|등록)\s*$/i.test(b.innerText); }); }, 5000);
      if (!reg) { alert('Open TOPIA → Weekly Report first, then click the bookmark.'); return; }
      reg.click(); ss = await until(sessionSel);
      if (!ss) { alert('The Register form did not open. Click Register, then try again.'); return; }
    }
    const want = Array.from(ss.options).find(function (o) { return parseInt(o.text, 10) === data.day; });
    if (!want) { alert('TOPIA has no ' + data.day + '회차 for this class yet.'); return; }
    if (ss.value !== want.value) { setSelect(ss, want.value); await sleep(900); }
    const inputs = (await until(function () { const a = Array.from(document.querySelectorAll('input[name^="infoList."]')).filter(vis); return a.length ? a : null; })) || [];
    if (!inputs.length) { alert('No score boxes found on the Register form.'); return; }
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    let who = '', filled = 0; const seen = {}, missing = [];
    inputs.forEach(function (inp) {
      const tr = inp.closest('tr'), cells = tr ? Array.from(tr.cells) : [], n = cells.length;
      if (n >= 5) who = cells[n - 4].innerText;
      else for (let r = tr.previousElementSibling; r; r = r.previousElementSibling) { const nc = r.querySelector('td.col_name'); if (nc) { who = nc.innerText; break; } if (r.querySelector('input')) break; }
      const label = n >= 3 ? cells[n - 3].innerText : '', perfect = parseFloat(n >= 2 ? cells[n - 2].innerText : '') || 100;
      const parts = who.split(/[\n()]+/).map(norm).filter(Boolean);
      const row = data.rows.find(function (r) { return (r.kor && parts.indexOf(norm(r.kor)) >= 0) || (r.eng && parts.indexOf(norm(r.eng)) >= 0); });
      if (!row) { if (who && !seen[who]) { seen[who] = 1; missing.push(who.replace(/\s+/g, ' ').trim()); } return; }
      seen[who] = 1;
      const p = row.g[grp(label)]; if (p == null) return;
      setter.call(inp, String(Math.round(p * perfect / 100))); inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true }));
      inp.style.background = '#fff4b8'; filled++;
    });
    let box = document.getElementById('gsTopiaNote');
    if (!box) { box = document.createElement('div'); box.id = 'gsTopiaNote'; box.style.cssText = 'position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:99999;background:#fff4b8;color:#222;border:2px solid #c9a400;border-radius:10px;padding:12px 16px;font:15px/1.4 sans-serif;max-width:560px;box-shadow:0 6px 20px rgba(0,0,0,.25);cursor:pointer'; box.title = 'Click to close'; box.onclick = function () { box.remove(); }; document.body.appendChild(box); }
    box.textContent = '✓ Filled ' + filled + ' boxes: ' + data.cls + ', ' + data.day + '회차 (yellow).' + (missing.length ? ' Not in the gradesheet: ' + missing.join(', ') + '.' : '') + ' Check them, then press Save.';
    setTimeout(function () { if (box.isConnected) box.remove(); }, 15000);
  };
  const ask = function () { run(prompt('Paste the scores copied from the gradesheet:') || ''); };
  if (typeof given === 'string') return run(given);
  if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(run, ask); else ask();
}
function topiaHomeworkBookmarklet() {
  var GS = 'https://disconnekted.github.io/Class-tools/gradesheet.html';
  var API = 'https://front-api.topiaenglishzone.co.kr/v1/t/';
  var iPad = /iPad|iPhone/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform));
  var win = iPad ? null : window.open('', 'gsOnline');
  if (win) { try { win.document.write('<p style="font:16px sans-serif;padding:20px">Reading online homework from TOPIA…</p>'); } catch (e) {} }
  function note(html) {
    var box = document.getElementById('gsTopiaNote');
    if (!box) { box = document.createElement('div'); box.id = 'gsTopiaNote'; box.style.cssText = 'position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:99999;background:#fff4b8;color:#222;border:2px solid #c9a400;border-radius:10px;padding:12px 16px;font:15px/1.4 sans-serif;max-width:560px;box-shadow:0 6px 20px rgba(0,0,0,.25)'; document.body.appendChild(box); }
    box.innerHTML = html + ' <a href="#" data-x style="margin-left:8px">close</a>';
    box.querySelector('[data-x]').onclick = function (e) { e.preventDefault(); box.remove(); };
    return box;
  }
  var tk = document.cookie.match(/__TP_ACCESS_TOKEN=([^;]+)/);
  if (!tk || !/topiaenglishzone/.test(location.hostname)) { if (win) win.close(); note('Log in to TOPIA (www.topiaenglishzone.co.kr) first, then try again.'); return; }
  var AH = { headers: { Authorization: 'Bearer ' + decodeURIComponent(tk[1]) } };
  // TOPIA's server is slow, so at most 6 requests run at once and a failed one is tried again.
  var busy = 0, waiting = [];
  var slot = function () { return new Promise(function (r) { if (busy < 6) { busy++; r(); } else waiting.push(r); }); };
  var free = function () { var n = waiting.shift(); if (n) n(); else busy--; };
  var get = async function (p) {
    for (var t = 0; t < 3; t++) {
      await slot();
      try { var r = await fetch(API + p, AH); if (r.ok) { var j = await r.json(); free(); return j; } } catch (e) {}
      free(); await new Promise(function (r) { setTimeout(r, 1500 * (t + 1)); });
    }
    return null;
  };
  // John's rule: Word Study and Matching Game done, plus tests 1, 2 and 3 each 80% or higher (rounded down), or all 5 tests done.
  function judge(st) {
    var t = {}; (st.pretestList || []).forEach(function (p) { t[p.studyTypeNum] = p; });
    var ws = !!st.isWordStudy, mg = !!st.isMatchStudy, done = Object.keys(t).length;
    var ok8 = function (p) { return p.correctCount >= Math.floor(p.wordCount * 0.8 + 1e-9); };
    var f3 = [1, 2, 3].every(function (n) { return t[n] && ok8(t[n]); }), all5 = [1, 2, 3, 4, 5].every(function (n) { return t[n]; });
    if (ws && mg && (f3 || all5)) return '';
    if (!ws && !mg && !done) return 'not started';
    var r = []; if (!ws) r.push('no Word Study'); if (!mg) r.push('no Matching Game');
    if (!(f3 || all5)) { var low = [1, 2, 3].filter(function (n) { return t[n] && !ok8(t[n]); }).map(function (n) { return 'T' + n + ' ' + Math.round(100 * t[n].correctCount / t[n].wordCount) + '%'; }); r.push(done ? done + ' of 5 tests' + (low.length ? ' (' + low.join(', ') + ')' : '') : 'no tests'); }
    return r.join(', ');
  }
  async function squeeze(obj) {
    var raw = new TextEncoder().encode(JSON.stringify(obj)), u8 = raw, tag = 'j';
    if (typeof CompressionStream === 'function') { u8 = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()); tag = 'z'; }
    var s = ''; for (var i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return tag + btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  async function run() {
    note('Reading online homework from TOPIA…');
    var info = await get('class/info'), cls = info && info.data && info.data.list;
    if (!cls) { if (win) win.close(); note('Could not load your classes. Refresh TOPIA (log in again if asked) and try once more.'); return; }
    var out = [], nUnits = 0;
    await Promise.all(cls.map(async function (c) {
      var subs = (c.subjectList || []).map(function (s) { return String(s.sourceSubjectId); });
      var units = {}, shadow = {};
      await Promise.all([(async function () {
      var list = [];
      for (var pg = 1; pg < 10; pg++) { var j = await get('online-contents/onlineword?classId=' + c.classId + '&limit=100&page=' + pg), d = j && j.data; if (!d) break; list = list.concat(d.list || []); if (!d.hasNextPage) break; }
      list = list.filter(function (u) { return subs.indexOf(String(u.sourceSubjectObj && u.sourceSubjectObj.id)) >= 0 && u.countObj && u.countObj.participantCount > 0; });
      await Promise.all(list.map(async function (u) {
        var j = await get('online-contents/onlineword/' + c.classId + '/' + u.sourceSubjectObj.id + '/' + u.unitNum), L = j && j.data && j.data.list; if (!L) return;
        var p = [], f = [];
        L.forEach(function (st) { var s = st.studentObj || {}, nm = [String(s.nameE || '').trim(), String(s.nameK || '').trim()], why = judge(st); if (why) f.push(nm.concat(why)); else p.push(nm); });
        units[u.unitNum] = { name: u.unitName, p: p, f: f }; nUnits++; note('Reading online homework from TOPIA… ' + nUnits + ' so far');
      }));
      })(), (async function () {
      // Shadowing lives in the Homework (과제평가) grid: score 2 = done (O), 0 or 1 = not done.
      var today = new Date().toISOString().slice(0, 10);
      await Promise.all(subs.map(async function (sid) {
        var j = await get('class/homework/list?classId=' + c.classId + '&sourceSubjectId=' + sid), L = j && j.data && j.data.list;
        if (!L || !Array.isArray(L.studentInfolist)) return;
        L.studentInfolist.forEach(function (st) {
          var nm = [String(st.nameE || '').trim(), String(st.nameK || '').trim()];
          (st.homeworkList || []).forEach(function (h) {
            var o = h.onlineHomeworkInfo && h.onlineHomeworkInfo.shadowing, v = h.onlineHomeworkScoreInfo && h.onlineHomeworkScoreInfo.shadowing;
            if (!o || v == null || v === '') return;
            var d = String(h.classDate || '').slice(0, 10), k = o.unitNum + '|' + (o.unitDay || '');
            var u = shadow[k] || (shadow[k] = { u: String(o.unitNum), d: o.unitDay || '', date: d, name: o.name || '', p: [], f: [] });
            if (d && d < u.date) u.date = d;
            if (String(v) === '2') u.p.push(nm); else if (d && d < today) u.f.push(nm.concat('shadowing not done'));
          });
        });
      }));
      })()]);
      nUnits += Object.keys(shadow).length;
      out.push({ shadow: shadow, cls: c.className, subj: (c.subjectList || []).map(function (s) { return s.subjectName || s.name || ''; }).join('/'), units: units });
    }));
    var data = { app: 'gs-online', at: new Date().toISOString().slice(0, 10), classes: out };
    window.__gsOnlineData = data;
    var link = GS + '#online=' + await squeeze(data), text = '#GS-ONLINE ' + JSON.stringify(data);
    var copy = function (b) { var ok = function () { if (b) b.textContent = '✓ Copied'; }; (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(ok, function () { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) {} ta.remove(); }); };
    if (win) { win.location.href = link; note('✓ Read ' + nUnits + ' word units and shadowing lessons in ' + out.length + ' classes. The gradesheet opened in a new tab and ticked them.'); return; }
    var box = note('✓ Read ' + nUnits + ' word units and shadowing lessons in ' + out.length + ' classes. <button data-c style="font:inherit;padding:4px 10px">Copy</button> then tap <b>Paste online homework</b> in the gradesheet app, or <a href="' + link + '" target="_blank">open the gradesheet here</a>.');
    box.querySelector('[data-c]').onclick = function () { copy(this); };
    try { await navigator.clipboard.writeText(text); box.querySelector('[data-c]').textContent = '✓ Copied'; } catch (e) {}
  }
  run().catch(function (e) { if (win) win.close(); note('Something went wrong: ' + e.message); });
}
function copyStudentsBookmarklet() {
  var D = document, out = ['#TOPIA-NAMETAGS'];
  var dateEl = D.querySelector('input[type=date]');
  if (dateEl && dateEl.value) out.push('#DATE ' + dateEl.value);
  var vis = function (el) { return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); };
  var cls = function (el) { return String(el.getAttribute('class') || ''); };
  var txt = function (el) { return (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim(); };
  var isRow = function (el) {
    var k = el.children;
    if (el.tagName === 'TR') return true;
    if (!/row/i.test(cls(el)) || k.length < 2) return false;
    for (var i = 0; i < k.length; i++) if (!/col|cell/i.test(cls(k[i]))) return false;
    return true;
  };
  var rowsNow = function () {
    var r = [], all = D.body.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) if (isRow(all[i]) && vis(all[i])) r.push(all[i]);
    return r;
  };
  var cellsOf = function (row) { var c = []; for (var j = 0; j < row.children.length; j++) c.push(txt(row.children[j])); return c.join('\t'); };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var banned = /^(save|저장|all present|전체\s*출석)$/i;
  var squash = function (s) { return String(s || '').replace(/\s+/g, '').toLowerCase(); };
  var isHead = function (line) { return /(^|\t)(name|이름|성명|학생명)(\t|$)/i.test(line); };
  var sameClass = function (a, b) { a = squash(a); b = squash(b); return !!a && !!b && (a.indexOf(b) === 0 || b.indexOf(a) === 0 || a.split('(')[0] === b.split('(')[0]); };
  var popupInfo = function () {
    var t = D.body.innerText || '';
    var n = t.match(/(?:student\s*count|학생\s*수|인원\s*수?)\s*[:：]?\s*(\d+)/i);
    var c = t.match(/class\s*name\s*[:：]\s*([^\n\r\t]+)/i) || t.match(/반\s*이름\s*[:：]\s*([^\n\r\t]+)/);
    return { count: n ? +n[1] : null, name: c ? c[1].trim() : '' };
  };
  var freshRows = function () { return rowsNow().filter(function (r) { return base.indexOf(r) < 0; }); };
  var box = D.createElement('div');
  box.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2147483647;background:#7A1701;color:#FBEDC5;font:15px Arial,sans-serif;padding:14px 18px;border-radius:10px;box-shadow:0 4px 18px rgba(0,0,0,.35);max-width:360px;max-height:80vh;overflow:auto;line-height:1.4';
  D.body.appendChild(box);
  var say = function (h) { box.innerHTML = h; };
  // Each message is in English, then Korean underneath.
  var ko = function (h) { return '<div style="font-size:13px;opacity:.85;margin-top:3px">' + h + '</div>'; };
  var base = rowsNow();
  base.forEach(function (r) { out.push(cellsOf(r)); });
  var buttons = [];
  base.forEach(function (r) {
    var b = r.querySelector('button');
    if (b && /attendance|출석/i.test(txt(b))) buttons.push({ btn: b, name: txt(r.children[0]) });
  });
  if (!buttons.length) { say('No Attendance buttons found. Open the Attendance page with your class list first.' + ko('출석 버튼을 찾지 못했습니다. 먼저 반 목록이 있는 출석 페이지를 여세요.')); setTimeout(function () { box.remove(); }, 5000); return; }
  var closePopup = async function () {
    var closers = Array.prototype.filter.call(D.querySelectorAll('button, a'), function (el) {
      var w = txt(el);
      return vis(el) && !banned.test(w) && (/^(cancel|취소|close|닫기)$/i.test(w) || /close/i.test(cls(el)));
    });
    closers.sort(function (a, b) { return (/^(cancel|취소)$/i.test(txt(b)) ? 1 : 0) - (/^(cancel|취소)$/i.test(txt(a)) ? 1 : 0); });
    if (closers.length) closers[0].click();
    for (var u = 0; u < 40; u++) { await sleep(150); if (!freshRows().length && !popupInfo().name) break; }
    await sleep(400);
  };
  var readClass = async function (item, label, labelKo) {
    var best = null;
    for (var attempt = 1; attempt <= 3; attempt++) {
      say(label + (attempt > 1 ? ' (try ' + attempt + ')' : '') + '&hellip;' + ko(labelKo + (attempt > 1 ? ' (' + attempt + '번째 시도)' : '') + '&hellip;'));
      item.btn.click();
      var seen = [], keys = {}, started = Date.now(), changed = Date.now(), info = { count: null };
      while (Date.now() - started < 15000) {
        await sleep(200);
        info = popupInfo();
        if (info.name && !sameClass(info.name, item.name)) { info = { count: null }; continue; }
        var lines = freshRows().map(cellsOf);
        if (lines.length && seen.length && !lines.some(function (l) { return keys[l]; })) { seen = []; keys = {}; }
        lines.forEach(function (l) { if (!keys[l]) { keys[l] = 1; seen.push(l); changed = Date.now(); } });
        var n = seen.filter(function (l) { return !isHead(l); }).length;
        var still = Date.now() - changed;
        if (info.count !== null && n >= info.count && still > 600) break;
        if (info.count === null && n > 0 && still > 2500) break;
        if (info.count !== null && n < info.count && lines.length && still > 800) {
          var rows = freshRows(), last = rows[rows.length - 1];
          for (var el = last && last.parentElement; el && el !== D.body; el = el.parentElement) {
            if (el.scrollHeight > el.clientHeight + 4) el.scrollTop = el.scrollHeight;
          }
        }
      }
      var got = { lines: seen, students: seen.filter(function (l) { return !isHead(l); }).length, count: info.count };
      if (!best || got.students > best.students || (got.count !== null && best.count === null)) best = got;
      await closePopup();
      if (best.count !== null ? best.students >= best.count : best.students > 0) break;
      await sleep(800);
    }
    return best;
  };
  var readAll = async function () {
    try {
      var tok = (D.cookie.match(/(?:^|; )__TP_ACCESS_TOKEN=([^;]+)/) || [])[1];
      if (!tok) return null;
      var now = new Date(), day = dateEl && dateEl.value ? dateEl.value : new Date(now - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      var get = async function (path) {
        var res = await fetch('https://front-api.topiaenglishzone.co.kr/v1/t/class/attendance' + path + '?searchDate=' + encodeURIComponent(day),
          { headers: { Authorization: 'Bearer ' + decodeURIComponent(tok) } });
        if (!res.ok) throw new Error('http ' + res.status);
        return res.json();
      };
      var found = {}, order = [];
      var walk = function (v, d) {
        if (!v || typeof v !== 'object' || d > 6) return;
        if (Array.isArray(v)) { v.forEach(function (x) { walk(x, d + 1); }); return; }
        if (typeof v.classId === 'number' && typeof v.className === 'string' && v.className && !found[v.classId]) { found[v.classId] = v.className; order.push(v.classId); }
        Object.keys(v).forEach(function (k) { walk(v[k], d + 1); });
      };
      say('Reading your classes&hellip;' + ko('반 목록을 읽는 중&hellip;'));
      walk(await get(''), 0);
      if (order.length !== buttons.length) return null;
      var list = await Promise.all(order.map(async function (id) {
        var j = await get('/' + id), info = j && j.data && j.data.info;
        if (!info || !Array.isArray(info.studentObjList)) throw new Error('no list');
        return { name: info.className || found[id], students: info.studentObjList.length,
          count: null,
          lines: ['English Name\tKorean Name'].concat(info.studentObjList.map(function (s) { return clean(s.nameE) + '\t' + clean(s.nameK); })) };
      }));
      var pos = function (r) { for (var k = 0; k < buttons.length; k++) if (sameClass(buttons[k].name, r.name)) return k; return buttons.length; };
      return list.sort(function (a, b) { return pos(a) - pos(b); });
    } catch (e) { return null; }
  };
  var clean = function (s) { return String(s || '').replace(/[\t\r\n]+/g, ' ').trim(); };
  (async function () {
    var report = [], total = 0, short = 0;
    var list = await readAll();
    if (!list) {
      list = [];
      for (var i = 0; i < buttons.length; i++) {
        var r = await readClass(buttons[i], 'Reading class ' + (i + 1) + ' of ' + buttons.length + ': <b>' + buttons[i].name + '</b>',
          '반 읽는 중 (' + (i + 1) + '/' + buttons.length + '): <b>' + buttons[i].name + '</b>');
        r.name = buttons[i].name; list.push(r);
      }
    }
    list.forEach(function (r) {
      out.push('▶ ' + r.name);
      r.lines.forEach(function (l) { out.push(l); });
      total += r.students;
      var full = r.count === null || r.students >= r.count;
      if (!full) short++;
      report.push((full ? '&#10003; ' : '&#9888; ') + r.name + ': ' + r.students + (r.count !== null ? ' of ' + r.count : '') + ' students');
    });
    var text = out.join('\n');
    say((short ? '<b>' + short + ' class' + (short > 1 ? 'es are' : ' is') + ' missing students.</b> Close this and click Copy students again, or add them by hand.' +
        ko('<b>' + short + '개 반에 빠진 학생이 있습니다.</b> 이 창을 닫고 학생 복사를 다시 누르거나 직접 추가하세요.')
      : 'Read <b>' + buttons.length + '</b> classes and <b>' + total + '</b> students.' + ko('반 <b>' + buttons.length + '</b>개, 학생 <b>' + total + '</b>명을 읽었습니다.')) +
      '<div style="font-size:12.5px;margin:6px 0 2px;opacity:.9">' + report.join('<br>') + '</div>' +
      '<button id="ntg-copy" style="margin-top:10px;padding:8px 14px;border:0;border-radius:6px;background:#FBEDC5;color:#7A1701;font-weight:bold;cursor:pointer">Copy for name tags · 이름표용 복사</button> ' +
      '<button id="ntg-x" style="margin-top:10px;padding:8px 10px;border:0;border-radius:6px;background:transparent;color:#FBEDC5;cursor:pointer">Close · 닫기</button>' +
      '<div style="font-size:10.5px;margin-top:8px;opacity:.55">Name Tag Generator by Joseph McLaren</div>');
    D.getElementById('ntg-x').onclick = function () { box.remove(); };
    D.getElementById('ntg-copy').onclick = function () {
      var ok = function () { say('Copied. Go to the name tag tool, click the paste box and press <b>Ctrl+V</b>.' + ko('복사했습니다. 이름표 도구로 가서 붙여 넣기 칸을 누르고 <b>Ctrl+V</b>를 누르세요.')); setTimeout(function () { box.remove(); }, 6000); };
      var fallback = function () {
        var ta = D.createElement('textarea');
        ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:0;user-select:text';
        D.body.appendChild(ta); ta.select();
        var done = false; try { done = D.execCommand('copy'); } catch (e) {}
        ta.remove();
        if (done) ok(); else say('Copying was blocked by the browser. Please try the button again.' + ko('브라우저가 복사를 막았습니다. 버튼을 다시 눌러 주세요.'));
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fallback); else fallback();
    };
  })();
}
  /* One tidy button at the bottom right ("📒 Gradesheet"); tap it for the tools that fit this page. */
  var css = document.createElement('style');
  css.textContent = '#gsHelper{position:fixed;right:18px;bottom:18px;z-index:99998;font:14px/1.3 system-ui,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;display:flex;flex-direction:column;align-items:flex-end;gap:8px}' +
    '#gsHelper .gsMain{border:0;border-radius:999px;padding:10px 16px;background:#1f6fb0;color:#fff;font-weight:700;box-shadow:0 4px 14px rgba(10,18,30,.3);cursor:pointer}' +
    '#gsHelper .gsMenu{display:none;flex-direction:column;gap:4px;background:#fff;color:#18233a;border:1px solid #cfd6e0;border-radius:12px;padding:6px;box-shadow:0 10px 30px rgba(10,18,30,.22);min-width:250px}' +
    '#gsHelper.open .gsMenu{display:flex}' +
    '#gsHelper .gsMenu button{border:0;background:none;text-align:left;padding:9px 12px;border-radius:8px;cursor:pointer;font:inherit;color:inherit}' +
    '#gsHelper .gsMenu button:hover{background:#eef4fb}#gsHelper .gsMenu button small{display:block;color:#5a6579;font-size:12px}' +
    '#gsHelper .gsMenu .gsHide{color:#5a6579;font-size:12.5px}';
  var root = document.createElement('div'); root.id = 'gsHelper';
  var menu = document.createElement('div'); menu.className = 'gsMenu';
  var main = document.createElement('button'); main.type = 'button'; main.className = 'gsMain'; main.textContent = '📒 Gradesheet';
  main.onclick = function () { root.classList.toggle('open'); show(); };
  function item(label, sub, fn) { var b = document.createElement('button'); b.type = 'button'; b.innerHTML = label + '<small>' + sub + '</small>'; b.onclick = function () { root.classList.remove('open'); fn(); }; menu.appendChild(b); return b; }
  var csB = item('⧉ Copy students', 'Every class list on this Attendance page', function () { copyStudentsBookmarklet(); });
  var fillB = item('✎ Fill from gradesheet', 'Put the copied scores in the Register form (you press Save)', function () { topiaFillBookmarklet(); });
  var hwB = item('⇩ Online homework → gradesheet', 'Word study and shadowing for all your classes', function () { topiaHomeworkBookmarklet(); });
  var hide = document.createElement('button'); hide.type = 'button'; hide.className = 'gsHide'; hide.textContent = 'Hide until the page reloads'; hide.onclick = function () { root.remove(); }; menu.appendChild(hide);
  function show() {
    fillB.style.display = /weekly-report/.test(location.pathname) ? '' : 'none';
    var att = /attend/i.test(location.pathname) || Array.prototype.some.call(document.querySelectorAll('button,a'), function (b) { return b.offsetParent && /^(attendance|출석)$/i.test((b.textContent || '').trim()); });
    csB.style.display = att ? '' : 'none';
  }
  root.append(menu, main);
  (document.body ? Promise.resolve() : new Promise(function (r) { addEventListener('DOMContentLoaded', r); })).then(function () { document.head.appendChild(css); document.body.appendChild(root); show(); });
  document.addEventListener('click', function (e) { if (!root.contains(e.target)) root.classList.remove('open'); });
  window.__gsHelper = function () { if (!root.isConnected) document.body.appendChild(root); root.classList.add('open'); show(); };
  /* Opened from the bookmark (iPad, tablets, school PCs): show the menu straight away, unless scores are waiting to be filled. */
  var fromBm = window.__gsBookmark; window.__gsBookmark = 0;
  /* "Send Day N to TOPIA" in the gradesheet opens the Weekly Report with #gs-topia=<scores>. Keep them for this tab
     (in case TOPIA asks to log in first), then fill the Register form once the page is ready. Nothing is saved: the teacher presses Save. */
  try {
    var m = location.hash.match(/^#gs-topia=([A-Za-z0-9_-]+)$/);
    if (m) {
      var b = atob(m[1].replace(/-/g, '+').replace(/_/g, '/')), u = new Uint8Array(b.length);
      for (var k = 0; k < b.length; k++) u[k] = b.charCodeAt(k);
      sessionStorage.setItem('gsTopiaFill', '#GS-TOPIA ' + new TextDecoder().decode(u));
      history.replaceState(null, '', location.pathname + location.search);
    }
  } catch (e) {}
  (function waitFill(t) {
    var txt = sessionStorage.getItem('gsTopiaFill'); if (!txt) { if (fromBm && t === 0) setTimeout(window.__gsHelper, 50); return; }
    if (!/weekly-report/.test(location.pathname)) { if (t < 120) setTimeout(function () { waitFill(t + 1); }, 1000); return; }
    var ready = Array.prototype.some.call(document.querySelectorAll('button'), function (x) { return x.offsetParent && /^\s*(register|등록)\s*$/i.test(x.innerText); }) || document.querySelector('input[name^="infoList."]');
    if (!ready) { if (t < 120) setTimeout(function () { waitFill(t + 1); }, 500); return; }
    sessionStorage.removeItem('gsTopiaFill');
    setTimeout(function () { topiaFillBookmarklet(txt); }, 600);
  })(0);
})();
