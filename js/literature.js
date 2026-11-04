/* Orr Biologicals · Literature discovery engine (Division 03).
   Client-side search against public scholarly APIs — Crossref and OpenAlex.
   No credentials, no scraping, no paywall bypass. Availability is reported
   only from each provider's own open-access metadata.

   Safety rules enforced here:
   - Every API string is rendered with textContent, never HTML.
   - Requests are aborted on timeout; network errors surface honestly.
   - Results are cached in sessionStorage with a TTL to respect rate limits.
   - DOI records are normalized and de-duplicated across result pages. */
(function () {
  'use strict';

  var CROSSREF_API = 'https://api.crossref.org';
  var OPENALEX_API = 'https://api.openalex.org';
  /* Polite-pool contact, the site's published correspondence address. */
  var CONTACT = 'service@orrbiologicals.com';
  var CACHE_KEY = 'orr-lit-cache-v1';
  var CACHE_TTL_MS = 30 * 60 * 1000;
  var PAGE_SIZE = 20;
  var MIN_QUERY = 3;
  var TIMEOUT_MS = 15000;
  var DEBOUNCE_MS = 450;
  var DOI_URL_RE = /^https?:\/\/(?:dx\.)?doi\.org\/(10\.\d{4,9}\/\S+)$/i;
  var BARE_DOI_RE = /^(?:doi:)?(10\.\d{4,9}\/\S+)$/i;
  var YEAR_RE = /^(?:1[89]|20)\d{2}$/;

  var el = {};

  function text(node, value) { node.textContent = value; return node; }
  function className(node, className) { node.className = className; return node; }

  /* ---------- cache ---------- */
  function readCache() { try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}'); } catch (error) { return {}; } }
  function writeCache(cache) {
    try {
      var keys = Object.keys(cache);
      if (keys.length > 40) {
        keys.sort(function (a, b) { return cache[a].at - cache[b].at; })
            .slice(0, keys.length - 40).forEach(function (key) { delete cache[key]; });
      }
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) { /* storage unavailable: search still works uncached */ }
  }
  function cacheGet(key) {
    var hit = readCache()[key];
    if (!hit || Date.now() - hit.at > CACHE_TTL_MS) return null;
    return hit.value;
  }
  function cachePut(key, value) {
    var cache = readCache(); cache[key] = { at: Date.now(), value: value }; writeCache(cache);
  }

  /* ---------- API access ---------- */
  function fetchJson(url, signal) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);
    if (signal) signal.addEventListener('abort', function () { controller.abort(); });
    return fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } })
      .then(function (response) {
        if (!response.ok) {
          if (response.status === 429) throw new Error('rate-limited');
          if (response.status === 404) throw new Error('http-404');
          if (response.status >= 500) throw new Error('upstream');
          throw new Error('http-' + response.status);
        }
        return response.json();
      })
      .catch(function (error) {
        if (error.name === 'AbortError') throw new Error(signal && signal.aborted ? 'aborted' : 'timeout');
        if (error instanceof TypeError) throw new Error('network');
        throw error;
      })
      .finally(function () { clearTimeout(timer); });
  }

  function normalizeDoi(raw) {
    var match = DOI_URL_RE.exec(raw.trim()) || BARE_DOI_RE.exec(raw.trim());
    return match ? match[1].replace(/\s+/g, '').toLowerCase() : '';
  }

  function openAlexFilters() {
    var filters = [];
    if (el.oa.checked) filters.push('open_access.is_oa:true');
    if (el.from.value && YEAR_RE.test(el.from.value)) filters.push('from_public_date:' + el.from.value + '-01-01');
    if (el.to.value && YEAR_RE.test(el.to.value)) filters.push('to_public_date:' + el.to.value + '-12-31');
    return filters;
  }

  function openAlexUrl(cursor) {
    var search = [el.q.value.trim(), el.author.value.trim()]
      .filter(Boolean).map(function (part) { return part.replace(/[",]/g, ' '); }).join(' ');
    var params = new URLSearchParams({ search: search, 'per-page': String(PAGE_SIZE), mailto: CONTACT });
    if (cursor) params.set('cursor', cursor);
    var filters = openAlexFilters();
    if (filters.length) params.set('filter', filters.join(','));
    return OPENALEX_API + '/works?' + params.toString();
  }

  function crossrefUrl(offset) {
    var params = new URLSearchParams({
      query: el.q.value.trim(), rows: String(PAGE_SIZE),
      offset: String(offset || 0), mailto: CONTACT
    });
    if (el.author.value.trim()) params.set('query.author', el.author.value.trim());
    var filters = [];
    if (el.from.value && YEAR_RE.test(el.from.value)) filters.push('from-pub-date:' + el.from.value + '-01-01');
    if (el.to.value && YEAR_RE.test(el.to.value)) filters.push('to-pub-date:' + el.to.value + '-12-31');
    if (filters.length) params.set('filter', filters.join(','));
    return CROSSREF_API + '/works?' + params.toString();
  }

  function runSearch(offset, signal) {
    if (el.source.value === 'openalex') {
      return fetchJson(openAlexUrl(null), signal).then(function (json) {
        return {
          items: (json.results || []).map(mapOpenAlex),
          total: json.meta && json.meta.count,
          next: json.meta && json.meta.next_cursor
        };
      });
    }
    return fetchJson(crossrefUrl(offset), signal).then(function (json) {
      var message = json.message || {};
      return { items: (message.items || []).map(mapCrossref), total: message['total-results'], next: null };
    });
  }

  function runDoiLookup(doi, signal) {
    var crossref = CROSSREF_API + '/works/' + encodeURIComponent(doi) + '?mailto=' + encodeURIComponent(CONTACT);
    var openalex = OPENALEX_API + '/works/doi:' + encodeURIComponent(doi) + '?mailto=' + encodeURIComponent(CONTACT);
    return Promise.all([
      fetchJson(crossref, signal).catch(function () { return null; }),
      fetchJson(openalex, signal).catch(function () { return null; })
    ]).then(function (results) {
      if (!results[0] && !results[1]) throw new Error('not-found');
      return { doi: doi, crossref: results[0], openalex: results[1] };
    });
  }

  /* ---------- record mapping ---------- */
  function stripHtml(value) {
    return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function mapOpenAlex(work) {
    var best = work.best_oa_location || {};
    return {
      title: stripHtml(work.title || work.display_name) || 'Untitled record',
      authors: (work.authorships || []).map(function (a) { return a.author && a.author.display_name; }).filter(Boolean),
      year: work.publication_year || (work.publication_date && work.publication_date.slice(0, 4)) || '',
      venue: (work.primary_location && work.primary_location.source && work.primary_location.source.display_name) || '',
      doi: work.doi ? stripHtml(work.doi).replace(/^https?:\/\/doi\.org\//i, '').toLowerCase() : '',
      citedBy: typeof work.cited_by_count === 'number' ? work.cited_by_count : null,
      oa: !!(work.open_access && work.open_access.is_oa),
      oaStatus: (work.open_access && work.open_access.oa_status) || '',
      oaHost: best.landing_page_url || '',
      oaPdf: best.pdf_url || '',
      abstract: work.abstract ? stripHtml(work.abstract).slice(0, 2400) : ''
    };
  }

  function mapCrossref(item) {
    var dateParts = (item.issued && item.issued['date-parts'] && item.issued['date-parts'][0]) || [];
    return {
      title: stripHtml(item.title && item.title[0]) || 'Untitled record',
      authors: (item.author || []).map(function (a) { return [a.given, a.family].filter(Boolean).join(' '); }).filter(Boolean),
      year: String(dateParts[0] || ''),
      venue: (item['container-title'] && item['container-title'][0]) || item.publisher || '',
      doi: item.DOI ? String(item.DOI).toLowerCase() : '',
      citedBy: item['is-referenced-by-count'],
      oa: undefined, oaStatus: '', oaHost: '', oaPdf: '',
      abstract: item.abstract ? stripHtml(item.abstract).slice(0, 2400) : ''
    };
  }

  /* ---------- rendering ---------- */
  var knownDois = {};

  function badge(cls, label) {
    return text(className(document.createElement('span'), 'lit-badge ' + cls), label);
  }

  function availabilityBadges(record) {
    var box = className(document.createElement('div'), 'lit-badges');
    if (record.oa === true) {
      box.appendChild(badge('oa', 'Open access'));
      if (record.oaStatus) box.appendChild(badge('plain', 'OA: ' + record.oaStatus));
    } else if (record.oa === false) {
      box.appendChild(badge('paywalled', 'No open-access copy classified'));
    } else {
      box.appendChild(badge('plain', 'Availability not classified by source'));
    }
    if (record.citedBy != null) box.appendChild(badge('plain', 'Cited by ' + record.citedBy));
    if (record.year || record.venue) box.appendChild(badge('plain', [record.year, record.venue].filter(Boolean).join(' · ')));
    return box;
  }

  function renderCard(record) {
    var card = className(document.createElement('article'), 'lit-card');
    card.appendChild(text(document.createElement('h3'), record.title));
    var authorsNode = className(document.createElement('p'), 'lit-authors');
    card.appendChild(text(authorsNode, record.authors.length
      ? record.authors.slice(0, 4).join(', ') + (record.authors.length > 4 ? ' et al.' : '')
      : 'Author list not provided by source'));
    card.appendChild(availabilityBadges(record));
    if (record.doi) {
      var venue = className(document.createElement('p'), 'lit-venue');
      var doiLink = document.createElement('a');
      doiLink.href = 'https://doi.org/' + record.doi;
      doiLink.rel = 'noopener'; doiLink.target = '_blank';
      venue.appendChild(text(doiLink, 'doi.org/' + record.doi));
      card.appendChild(venue);
    }
    var availability = record.oaHost || record.oaPdf;
    if (availability) {
      var read = className(document.createElement('a'), 'lit-read');
      read.href = availability;
      read.rel = 'noopener'; read.target = '_blank';
      card.appendChild(text(read, 'Open available version ↗ (published or repository-hosted)'));
    }
    if (record.abstract && record.abstract.length > 80) {
      var details = document.createElement('details');
      details.appendChild(text(document.createElement('summary'), 'Abstract'));
      var truncated = record.abstract.length >= 2400 ? record.abstract + ' …' : record.abstract;
      details.appendChild(text(document.createElement('p'), truncated));
      card.appendChild(details);
    }
    return card;
  }

  function renderDoi(result) {
    var card = className(document.createElement('article'), 'lit-card');
    var meta = (result.crossref && result.crossref.message) || null;
    var oaWork = result.openalex;
    var record = meta
      ? { title: stripHtml(meta.title && meta.title[0]) || 'Metadata from Crossref',
          authors: (meta.author || []).map(function (a) { return [a.given, a.family].filter(Boolean).join(' '); }),
          year: (meta.issued && meta.issued['date-parts'] && String(meta.issued['date-parts'][0][0])) || '',
          venue: (meta['container-title'] && meta['container-title'][0]) || meta.publisher || '',
          doi: result.doi, citedBy: meta['is-referenced-by-count'],
          oa: undefined, oaStatus: '', oaHost: '', oaPdf: '',
          abstract: meta.abstract ? stripHtml(meta.abstract).slice(0, 2400) : '' }
      : mapOpenAlex(oaWork);
    if (meta && oaWork) {
      record.oa = !!(oaWork.open_access && oaWork.open_access.is_oa);
      record.oaStatus = (oaWork.open_access && oaWork.open_access.oa_status) || '';
      var best = oaWork.best_oa_location || {};
      record.oaHost = best.landing_page_url || '';
      record.oaPdf = best.pdf_url || '';
      if (typeof oaWork.cited_by_count === 'number') {
        record.citedBy = Math.max(record.citedBy || 0, oaWork.cited_by_count);
      }
    }
    card.appendChild(text(document.createElement('h3'), record.title));
    card.appendChild(text(className(document.createElement('p'), 'lit-program'),
      'DOI resolved against Crossref and OpenAlex · ' + new Date().toLocaleDateString()));
    card.appendChild(availabilityBadges(record));
    if (record.oaHost || record.oaPdf) {
      var read = className(document.createElement('a'), 'lit-read');
      read.href = record.oaHost || record.oaPdf;
      read.rel = 'noopener'; read.target = '_blank';
      card.appendChild(text(read, 'Open available open-access version ↗'));
    }
    var doiLink = className(document.createElement('a'), 'lit-read');
    doiLink.href = 'https://doi.org/' + result.doi;
    doiLink.rel = 'noopener'; doiLink.target = '_blank';
    card.appendChild(text(doiLink, 'Open publisher record ↗'));
    if (record.abstract && record.abstract.length > 80) {
      var details = document.createElement('details');
      details.appendChild(text(document.createElement('summary'), 'Abstract'));
      var truncated = record.abstract.length >= 2400 ? record.abstract + ' …' : record.abstract;
      details.appendChild(text(document.createElement('p'), truncated));
      card.appendChild(details);
    }
    return card;
  }

  /* ---------- view state ---------- */
  function setResultsVisible(show) {
    el.empty.hidden = true;
    el.error.hidden = true;
    el.moreRow.hidden = true;
    el.results.textContent = '';
    knownDois = {};
    el.results.hidden = !show;
  }

  function setStatus(message, state) {
    el.status.textContent = message;
    if (state) el.status.setAttribute('data-state', state); else el.status.removeAttribute('data-state');
  }

  function showError(message) {
    setResultsVisible(false);
    el.error.hidden = false;
    text(el.errorBody, message);
    setStatus('Search halted — ' + message, 'error');
  }

  function explain(code) {
    var map = {
      timeout: 'the request to the metadata service timed out. Try again in a moment.',
      network: 'the network request to the metadata service failed. Check your connection and try again.',
      'rate-limited': 'the metadata service applied a temporary rate limit. Wait a minute and try again.',
      upstream: 'the metadata service reported a temporary problem. Try again shortly.',
      'http-404': 'no record was returned for that DOI. Check the spelling.',
      'not-found': 'that DOI did not resolve in Crossref or OpenAlex. Check for typos.'
    };
    return map[code] || 'an unexpected problem with the metadata services. Try again in a moment.';
  }

  /* ---------- controller ---------- */
  var inFlight = null;
  var searchToken = 0;
  var debounceTimer = 0;
  var nextCursor = null;
  var currentOffset = 0;

  /* DOI entries look like 10.xxxx/suffix or doi.org links. */
  function doiMode() { return !!normalizeDoi(el.q.value); }

  function executeSearch(offset) {
    var raw = el.q.value.trim();
    var doi = doiMode() ? normalizeDoi(raw) : '';
    var key = [el.source.value, doi || raw, el.author.value.trim().toLowerCase(),
               el.from.value, el.to.value, el.oa.checked, offset || 0].join('|');
    var token = ++searchToken;
    if (inFlight) inFlight.abort();
    inFlight = new AbortController();
    var signal = inFlight.signal;
    setResultsVisible(false);
    setStatus((doi ? 'Resolving DOI ' + doi : 'Searching') + ' …', 'busy');
    var startedAt = Date.now();

    var cached = cacheGet(key);
    var work = cached ? Promise.resolve(cached) : (doi ? runDoiLookup(doi, signal) : runSearch(offset, signal));

    work.then(function (payload) {
      if (token !== searchToken || signal.aborted) return;
      if (!cached) cachePut(key, payload);
      if (doi) {
        el.results.appendChild(renderDoi(payload));
        el.results.hidden = false;
        setStatus('DOI resolved · Crossref + OpenAlex availability · ' + (Date.now() - startedAt) + ' ms', '');
        return;
      }
      var rendered = 0;
      payload.items.forEach(function (record) {
        if (record.doi && knownDois[record.doi]) return;
        if (record.doi) knownDois[record.doi] = true;
        el.results.appendChild(renderCard(record));
        rendered += 1;
      });
      nextCursor = payload.next || null;
      currentOffset = (offset || 0) + PAGE_SIZE;
      el.results.hidden = false;
      if (!payload.items.length) {
        el.empty.hidden = false;
        setStatus('No indexed results · the providers only hold metadata for records they have', '');
        return;
      }
      var totalLabel = payload.total == null ? 'unknown' : String(payload.total);
      var moreLabel = nextCursor ? 'Load more indexed records' : (payload.total > currentOffset ? 'Load more' : '');
      if (moreLabel) {
        text(el.loadMore, moreLabel);
        el.moreRow.hidden = false;
        el.loadMore.hidden = false;
      }
      setStatus(rendered + (offset ? ' more ' : ' ') + 'record' + (rendered === 1 ? '' : 's') +
        ' of roughly ' + totalLabel + ' indexed · ' + (Date.now() - startedAt) + ' ms', '');
    }).catch(function (error) {
      if (signal.aborted || token !== searchToken) return;
      showError(explain(error.message || String(error)));
    });
  }

  function queueDebouncedSearch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      var raw = el.q.value.trim();
      if (doiMode() || raw.length >= MIN_QUERY) {
        nextCursor = null; currentOffset = 0;
        executeSearch(0);
        return;
      }
      if (inFlight) inFlight.abort();
      ++searchToken;
      setResultsVisible(false);
      if (!raw) {
        setStatus('Type a title, keyword, author, or paste a DOI to search.', '');
      } else {
        setStatus('Keep typing — at least ' + MIN_QUERY + ' characters.', '');
      }
    }, DEBOUNCE_MS);
  }

  function bind() {
    el.form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (el.from.value && !YEAR_RE.test(el.from.value) || el.to.value && !YEAR_RE.test(el.to.value)) {
        showError('Years must be four-digit values such as 2010 or 2025.');
        return;
      }
      if (el.from.value && el.to.value && Number(el.from.value) > Number(el.to.value)) {
        showError('Start year is after end year.');
        return;
      }
      nextCursor = null; currentOffset = 0;
      clearTimeout(debounceTimer);
      executeSearch(0);
    });
    el.q.addEventListener('input', queueDebouncedSearch);
    el.author.addEventListener('input', queueDebouncedSearch);
    el.from.addEventListener('change', queueDebouncedSearch);
    el.to.addEventListener('change', queueDebouncedSearch);
    el.oa.addEventListener('change', queueDebouncedSearch);
    el.source.addEventListener('change', function () {
      el.oa.disabled = el.source.value !== 'openalex';
      if (!el.oa.disabled) setStatus('Source changed — press Search to re-run against ' +
        (el.source.value === 'openalex' ? 'OpenAlex' : 'Crossref') + '.', '');
      else setStatus('Open-access classification is provided by OpenAlex; the Crossref mode ignores this filter.', '');
      queueDebouncedSearch();
    });
    el.q.addEventListener('input', function () {
      try { sessionStorage.setItem('orr-lit-last-query', el.q.value); } catch (error) { /* ignore */ }
    });
    var restored = '';
    try { restored = sessionStorage.getItem('orr-lit-last-query') || ''; } catch (error) { /* ignore */ }
    if (restored) el.q.value = restored;
  }

  /* Load more: OpenAlex pages by cursor; Crossref pages by row offset. */
  function loadMoreClicked() {
    if (el.loadMore.hidden) return;
    if (el.source.value === 'openalex') {
      var token = searchToken;
      if (inFlight) inFlight.abort();
      inFlight = new AbortController();
      var signal = inFlight.signal;
      var startedAt = Date.now();
      setStatus('Loading further indexed records …', 'busy');
      fetchJson(openAlexUrl(nextCursor), signal).then(function (json) {
        if (token !== searchToken || signal.aborted) return;
        var payload = { items: (json.results || []).map(mapOpenAlex), total: json.meta && json.meta.count, next: json.meta && json.meta.next_cursor };
        nextCursor = payload.next || null;
        el.loadMore.hidden = !nextCursor;
        el.moreRow.hidden = !nextCursor;
        var rendered = 0;
        payload.items.forEach(function (record) {
          if (record.doi && knownDois[record.doi]) return;
          if (record.doi) knownDois[record.doi] = true;
          el.results.appendChild(renderCard(record));
          rendered += 1;
        });
        setStatus((rendered ? rendered + ' more records · ' : '') + (Date.now() - startedAt) + ' ms', '');
      }).catch(function (error) {
        if (signal.aborted || token !== searchToken) return;
        showError(explain(error.message || String(error)));
      });
      return;
    }
    executeSearch(currentOffset);
  }

  function resolve() {
    el.app = document.getElementById('litApp');
    if (!el.app) return;
    el.form = document.getElementById('litForm');
    el.q = document.getElementById('litQuery');
    el.author = document.getElementById('litAuthor');
    el.from = document.getElementById('litFrom');
    el.to = document.getElementById('litTo');
    el.oa = document.getElementById('litOA');
    el.source = document.getElementById('litSource');
    el.status = document.getElementById('litStatus');
    el.results = document.getElementById('litResults');
    el.empty = document.getElementById('litEmpty');
    el.error = document.getElementById('litError');
    el.errorBody = document.getElementById('litErrorBody');
    el.loadMore = document.getElementById('litMore');
    el.moreRow = document.getElementById('litMoreRow');
    el.results.setAttribute('role', 'list');
    el.status.setAttribute('role', 'status');
    el.loadMore.addEventListener('click', loadMoreClicked);
    bind();
    setStatus('Type at least ' + MIN_QUERY + ' characters, or paste a DOI. Sources: Crossref and OpenAlex.', '');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', resolve);
  else resolve();
})();
