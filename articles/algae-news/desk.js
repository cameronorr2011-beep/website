/* The daily digest is data, not markup: the noon build commits a JSON file and
   nothing else has to regenerate. The button asks the desk's Worker for ten
   papers this reader has not seen yet; the answer is kept in this browser so a
   reload does not throw it away. If the Worker is unreachable, the committed
   digest stays on screen. */
(function () {
  var section = document.getElementById('daily');
  if (!section) return;
  var list = document.getElementById('daily-list');
  var meta = document.getElementById('daily-meta');
  var status = document.getElementById('daily-status');
  var button = document.getElementById('daily-refresh');
  var endpoint = (section.getAttribute('data-endpoint') || '').replace(/\/+$/, '');
  var STORE = 'orr-algae-manual';
  var fmtDay = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  var fmtTime = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
  var current = [];

  function dayLabel(iso) {
    return iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)
      ? fmtDay.format(new Date(iso + 'T00:00:00')) : '';
  }

  function render(data, header) {
    var items = (data.items || []).slice(0, 10);
    if (!items.length) return false;
    list.textContent = '';
    items.forEach(function (item) {
      var li = document.createElement('li');
      var body = document.createElement('div');
      var topic = document.createElement('p');
      topic.className = 'topic'; topic.textContent = item.topic || 'Research';
      var h3 = document.createElement('h3');
      var a = document.createElement('a');
      a.href = item.url; a.rel = 'noopener'; a.textContent = item.title;
      h3.appendChild(a);
      body.appendChild(topic); body.appendChild(h3);
      if (item.hook) {
        var hook = document.createElement('p');
        hook.className = 'hook'; hook.textContent = item.hook;
        body.appendChild(hook);
      }
      var src = document.createElement('p');
      src.className = 'src';
      src.textContent = [item.journal, dayLabel(item.pub_date)].filter(Boolean).join(' \u00b7 ');
      body.appendChild(src);
      li.appendChild(body);
      list.appendChild(li);
    });
    current = items;
    meta.textContent = [header || dayLabel(data.date), items.length + ' papers', 'PubMed']
      .filter(Boolean).join(' \u00b7 ');
    section.hidden = false;
    return true;
  }

  function stored() {
    try {
      var raw = localStorage.getItem(STORE);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return data && data.items && data.items.length ? data : null;
    } catch (e) { return null; }
  }

  function remember(data) {
    try {
      localStorage.setItem(STORE, JSON.stringify({
        date: data.date, generated_at: data.generated_at, items: data.items
      }));
    } catch (e) { /* private mode: the refresh still shows once */ }
  }

  function setStatus(message, state) {
    status.textContent = '';
    status.dataset.state = state || '';
    if (!message) return;
    status.appendChild(document.createTextNode(message));
    if (state === 'thinking') {
      var dots = document.createElement('span');
      dots.className = 'dots';
      for (var i = 0; i < 3; i += 1) {
        var dot = document.createElement('span');
        dot.textContent = '.';
        dots.appendChild(dot);
      }
      status.appendChild(dots);
    }
  }

  function busy(on) {
    if (button) button.disabled = on;
    section.setAttribute('aria-busy', on ? 'true' : 'false');
  }

  fetch('data/latest.json', { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error('no digest'); return r.json(); })
    .then(function (data) {
      var manual = stored();
      if (manual && manual.generated_at && data.generated_at &&
          manual.generated_at > data.generated_at) {
        render(manual, 'Manual refresh \u00b7 ' + fmtTime.format(new Date(manual.generated_at)));
        return;
      }
      render(data);
    })
    .catch(function () {
      var manual = stored();
      if (manual) {
        render(manual, 'Manual refresh \u00b7 ' + fmtTime.format(new Date(manual.generated_at)));
      }
    });

  if (!button) return;
  button.addEventListener('click', function () {
    if (button.disabled) return;
    if (!endpoint) {
      setStatus('Manual refresh is not configured on this build.', 'error');
      return;
    }
    var seen = current.map(function (item) { return String(item.pmid); });
    var manual = stored();
    if (manual) {
      manual.items.forEach(function (item) {
        if (seen.indexOf(String(item.pmid)) === -1) seen.push(String(item.pmid));
      });
    }

    busy(true);
    setStatus('Thinking', 'thinking');

    fetch(endpoint + '/api/algae-refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ seen: seen })
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (!response.ok) {
          throw new Error(body && body.message ? body.message : 'The desk could not refresh.');
        }
        return body;
      });
    }).then(function (data) {
      if (!data.items || !data.items.length) throw new Error('No new papers came back.');
      render(data, 'Manual refresh \u00b7 ' + fmtTime.format(new Date()));
      remember(data);
      busy(false);
      setStatus('Ten new papers.', 'done');
      window.setTimeout(function () { setStatus('', ''); }, 5000);
    }).catch(function (error) {
      busy(false);
      setStatus((error && error.message ? error.message : 'The desk could not refresh.') +
        ' The noon edition is below.', 'error');
    });
  });
})();
