/* StudyQuest Online Resources portal — V11.0 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const safeUrl = value => {
    try { const u = new URL(String(value || '').trim()); return ['https:','http:'].includes(u.protocol) ? u.href : ''; }
    catch (_) { return ''; }
  };
  const hostOf = value => { try { return new URL(value).hostname.replace(/^www\./,''); } catch (_) { return ''; } };
  const escapeText = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const getResources = () => {
    if (!Array.isArray(window.STATE.resources)) window.STATE.resources = [];
    return window.STATE.resources;
  };
  const faviconFor = url => {
    const host = hostOf(url);
    return host ? 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(host) + '&sz=128' : '';
  };
  function resetForm() {
    $('resource-id').value = '';
    $('resource-name').value = '';
    $('resource-url').value = '';
    $('resource-description').value = '';
    $('resource-logo').value = '';
    $('resource-modal-title').textContent = 'Add online resource';
    $('resource-delete').classList.add('hidden');
    $('resource-preview').innerHTML = '<i class="fa-solid fa-globe text-xl"></i>';
    $('resource-modal').classList.remove('hidden');
    $('resource-modal').classList.add('flex');
    $('resource-name').focus();
  }
  function closeForm() {
    $('resource-modal').classList.add('hidden');
    $('resource-modal').classList.remove('flex');
  }
  function openEdit(id) {
    const item = getResources().find(r => r.id === id);
    if (!item) return;
    $('resource-id').value = item.id;
    $('resource-name').value = item.name || '';
    $('resource-url').value = item.url || '';
    $('resource-description').value = item.description || '';
    $('resource-logo').value = item.logo || '';
    $('resource-modal-title').textContent = 'Edit online resource';
    $('resource-delete').classList.remove('hidden');
    setPreview(item.logo || faviconFor(item.url));
    $('resource-modal').classList.remove('hidden');
    $('resource-modal').classList.add('flex');
  }
  function setPreview(url) {
    const preview = $('resource-preview');
    preview.innerHTML = '';
    if (!url) { preview.innerHTML = '<i class="fa-solid fa-globe text-xl"></i>'; return; }
    const img = document.createElement('img');
    img.src = url; img.alt = ''; img.className = 'w-10 h-10 object-contain rounded-lg';
    img.onerror = () => { preview.innerHTML = '<i class="fa-solid fa-globe text-xl"></i>'; };
    preview.appendChild(img);
  }
  function saveResource(event) {
    event.preventDefault();
    const url = safeUrl($('resource-url').value);
    if (!url) { alert('Enter a valid website address beginning with https:// or http://.'); return; }
    const id = $('resource-id').value || 'resource_' + Date.now();
    const old = getResources().find(r => r.id === id);
    const name = $('resource-name').value.trim() || hostOf(url) || 'Online resource';
    const duplicate = getResources().find(r => r.id !== id && hostOf(r.url) === hostOf(url));
    if (duplicate && !confirm('You already have a resource for this website (' + duplicate.name + '). Save another entry anyway?')) return;
    const data = { ...(old || {}), id, name, url, description: $('resource-description').value.trim(), logo: safeUrl($('resource-logo').value) || (old?.logo || faviconFor(url)), updatedAt: new Date().toISOString() };
    if (old) Object.assign(old, data); else getResources().push(data);
    if (typeof window.saveLocalStorage === 'function') window.saveLocalStorage();
    render();
    closeForm();
  }
  function deleteResource() {
    const id = $('resource-id').value;
    const resource = getResources().find(r => r.id === id);
    if (!resource || !confirm('Delete "' + resource.name + '" from Online Resources? Homework tasks linked to it will keep their saved assignment links, but the resource association will be cleared.')) return;
    window.STATE.tasks.forEach(t => { if (t.resourceId === id) t.resourceId = ''; });
    window.STATE.resources = getResources().filter(r => r.id !== id);
    if (typeof window.saveLocalStorage === 'function') window.saveLocalStorage();
    render(); closeForm();
  }
  function render() {
    const root = $('resources-list');
    if (!root) return;
    const query = ($('resources-search')?.value || '').trim().toLowerCase();
    const items = getResources().filter(r => !query || [r.name,r.url,r.description].join(' ').toLowerCase().includes(query));
    $('resources-count').textContent = getResources().length + ' resource' + (getResources().length === 1 ? '' : 's');
    root.innerHTML = '';
    $('resources-empty').classList.toggle('hidden', items.length > 0);
    items.forEach(item => {
      const linked = (window.STATE.tasks || []).filter(t => t.resourceId === item.id);
      const card = document.createElement('article');
      card.className = 'themed-card-sub border rounded-2xl p-4 sm:p-5 flex flex-col gap-3';
      const logo = item.logo || faviconFor(item.url);
      card.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="w-12 h-12 shrink-0 rounded-xl themed-card border flex items-center justify-center overflow-hidden" data-logo-box><i class="fa-solid fa-globe text-xl"></i></div>
          <div class="min-w-0 flex-1"><h3 class="font-extrabold break-words">${escapeText(item.name)}</h3><p class="text-xs opacity-60 break-all mt-1">${escapeText(hostOf(item.url))}</p><p class="text-sm opacity-75 mt-2 whitespace-pre-wrap break-words">${escapeText(item.description || 'No description added yet.')}</p></div>
        </div>
        <div class="flex flex-wrap gap-2">
          <a href="${escapeText(item.url)}" target="_blank" rel="noopener noreferrer" class="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"><i class="fa-solid fa-arrow-up-right-from-square mr-1"></i>Open website</a>
          <button type="button" data-edit="${escapeText(item.id)}" class="px-3 py-2 rounded-xl border themed-card text-xs font-bold"><i class="fa-solid fa-pen mr-1"></i>Edit</button>
        </div>
        <div class="border-t themed-card-sub pt-3"><p class="text-xs font-extrabold mb-2"><i class="fa-solid fa-link mr-1"></i>Linked homework <span class="opacity-60">(${linked.length})</span></p>
        ${linked.length ? '<div class="space-y-2">' + linked.map(t => '<div class="flex flex-wrap items-center justify-between gap-2 text-xs"><span class="min-w-0 break-words">' + escapeText(t.title) + '</span>' + (safeUrl(t.assignmentUrl) ? '<a class="text-indigo-400 font-bold" href="' + escapeText(safeUrl(t.assignmentUrl)) + '" target="_blank" rel="noopener noreferrer">Open assignment <i class="fa-solid fa-arrow-up-right-from-square ml-1"></i></a>' : '<span class="opacity-50">No assignment-specific link</span>') + '</div>').join('') + '</div>' : '<p class="text-xs opacity-55">Link this resource when creating or editing homework.</p>'}
        </div>`;
      const box = card.querySelector('[data-logo-box]');
      if (logo) { const img = document.createElement('img'); img.src = logo; img.alt = ''; img.className = 'w-10 h-10 object-contain'; img.onerror = () => { img.remove(); }; box.replaceChildren(img); }
      card.querySelector('[data-edit]').addEventListener('click', () => openEdit(item.id));
      root.appendChild(card);
    });
    const select = $('input-resource-id');
    if (select) {
      const current = select.value;
      select.innerHTML = '<option value="">No resource linked</option>' + getResources().map(r => '<option value="' + escapeText(r.id) + '">' + escapeText(r.name) + '</option>').join('');
      if (getResources().some(r => r.id === current)) select.value = current;
    }
  }
  function syncTaskLinkFields() {
    const id = $('input-resource-id')?.value || '';
    const item = getResources().find(r => r.id === id);
    const url = $('input-assignment-url');
    if (item && url && !url.value.trim()) url.placeholder = 'Optional: exact assignment URL on ' + hostOf(item.url);
  }
  function autoSuggest() {
    const url = safeUrl($('resource-url').value);
    if (!url) return;
    const host = hostOf(url);
    if (!$('resource-name').value.trim()) $('resource-name').value = host.split('.')[0].replace(/[-_]/g,' ').replace(/\b\w/g, c => c.toUpperCase());
    if (!$('resource-logo').value.trim()) setPreview(faviconFor(url));
  }
  function init() {
    if (!window.STATE) return;
    const state = window.STATE;
    if (!Array.isArray(state.resources)) state.resources = [];
    const oldNormalize = window.normalizeState;
    if (typeof oldNormalize === 'function' && !oldNormalize.__resourcesWrapped) {
      const wrapped = function(parsed) {
        const out = oldNormalize(parsed);
        out.resources = Array.isArray(parsed.resources) ? parsed.resources.map(r => ({...r})) : [];
        return out;
      };
      wrapped.__resourcesWrapped = true;
      window.normalizeState = wrapped;
    }
    $('resource-add').addEventListener('click', resetForm);
    $('resource-cancel').addEventListener('click', closeForm);
    $('resource-form').addEventListener('submit', saveResource);
    $('resource-delete').addEventListener('click', deleteResource);
    $('resources-search').addEventListener('input', render);
    $('resource-url').addEventListener('change', autoSuggest);
    $('resource-url').addEventListener('blur', autoSuggest);
    $('input-resource-id').addEventListener('change', syncTaskLinkFields);
    $('resource-logo').addEventListener('input', () => setPreview(safeUrl($('resource-logo').value)));
    render();
  }
  window.sqRenderResources = render;
  window.sqOpenResources = () => { if (typeof window.switchTab === 'function') window.switchTab('resources'); render(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
})();
