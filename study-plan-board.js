/* StudyQuest visual weekly planner — V10.1 */
(() => {
  const STYLE_ID = 'sq-visual-plan-style';
  const BOARD_ID = 'sq-visual-plan-board';
  let installed = false;

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${BOARD_ID} .sq-week-grid { display:grid; grid-template-columns:repeat(7,minmax(150px,1fr)); gap:10px; overflow-x:auto; padding-bottom:8px; }
      #${BOARD_ID} .sq-day-column { min-height:250px; border:1px solid var(--border-color); border-radius:14px; background:var(--bg-card-sub); padding:10px; transition:border-color .15s,background .15s; }
      #${BOARD_ID} .sq-day-column.sq-drop-ready { border:2px dashed #818cf8; background:color-mix(in srgb,#818cf8 9%,var(--bg-card-sub)); }
      #${BOARD_ID} .sq-day-column.sq-today { border-color:#818cf8; }
      #${BOARD_ID} .sq-session-card { cursor:grab; border:1px solid var(--border-color); border-left:3px solid #818cf8; border-radius:10px; padding:9px; margin-top:8px; background:var(--bg-card); }
      #${BOARD_ID} .sq-session-card:active { cursor:grabbing; }
      #${BOARD_ID} .sq-session-card.sq-dragging { opacity:.4; }
      #${BOARD_ID} .sq-session-time { font-size:10px; opacity:.7; margin-top:4px; }
      #${BOARD_ID} .sq-drop-hint { border:1px dashed var(--border-color); border-radius:9px; padding:12px 5px; text-align:center; font-size:10px; opacity:.55; margin-top:8px; }
      #${BOARD_ID} .sq-board-note { font-size:11px; opacity:.65; }
      @media(max-width:700px) { #${BOARD_ID} .sq-week-grid { grid-template-columns:repeat(7,minmax(170px,1fr)); } }
    `;
    document.head.appendChild(style);
  }

  function keyFor(date) {
    return typeof dateKey === 'function' ? dateKey(date) : date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
  }
  function dateFor(key) { return new Date(key+'T12:00:00'); }
  function esc(value) { return typeof escapeHtml === 'function' ? escapeHtml(String(value ?? '')) : String(value ?? '').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function getBoard() { return document.getElementById(BOARD_ID); }

  function ensureBoard() {
    const plan = document.getElementById('tab-plan');
    if (!plan || getBoard()) return;
    const section = document.createElement('section');
    section.id = BOARD_ID;
    section.className = 'themed-card rounded-3xl p-5 sm:p-7 border shadow-xl space-y-4';
    section.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div><h3 class="text-lg font-black"><i class="fa-solid fa-grip text-indigo-400 mr-2"></i>Visual weekly planner</h3>
        <p class="sq-board-note mt-1">Drag a planned session to another day, or drag a suggestion onto a day to schedule it. Times stay the same when moving sessions.</p></div>
        <button type="button" id="sq-board-today" class="themed-card-sub border rounded-xl px-3 py-2 text-xs font-bold">This week</button>
      </div>
      <div id="sq-week-grid" class="sq-week-grid" aria-label="Drag-and-drop weekly study plan"></div>
      <p id="sq-board-status" class="text-xs opacity-70" aria-live="polite"></p>`;
    const suggestions = plan.querySelector('#schedule-suggestions-list')?.closest('section');
    const accepted = plan.querySelector('#planned-session-list')?.closest('section');
    if (suggestions) plan.insertBefore(section, suggestions);
    else if (accepted) plan.insertBefore(section, accepted);
    else plan.appendChild(section);
    section.querySelector('#sq-board-today').addEventListener('click', renderBoard);
    document.addEventListener('dragstart', onDragStart);
    document.addEventListener('dragend', onDragEnd);
    section.addEventListener('dragover', onDragOver);
    section.addEventListener('dragleave', onDragLeave);
    section.addEventListener('drop', onDrop);
  }

  function renderBoard() {
    ensureBoard();
    const board = getBoard();
    if (!board || typeof STATE === 'undefined') return;
    const grid = board.querySelector('#sq-week-grid');
    if (!grid) return;
    const start = typeof startOfToday === 'function' ? startOfToday() : new Date();
    const days = Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(d.getDate()+i);return d;});
    grid.innerHTML = days.map(day=>{
      const key=keyFor(day);
      const sessions=(STATE.plannedSessions||[]).filter(s=>s.date===key && s.status!=='dismissed').sort((a,b)=>String(a.start).localeCompare(String(b.start)));
      const today=key===keyFor(new Date());
      const cards=sessions.map(s=>`<article class="sq-session-card" draggable="${s.status!=='completed'}" data-session-id="${esc(s.id)}" style="${s.status==='completed'?'opacity:.6;':''}">
        <div class="flex items-start gap-2"><i class="fa-solid fa-grip-vertical opacity-40 mt-1"></i><div class="min-w-0 flex-1"><div class="text-xs font-extrabold ${s.status==='completed'?'line-through':''}">${esc(s.title)}</div><div class="sq-session-time">${esc(s.start)}–${esc(s.end)} · ${Number(s.estimatedMinutes)||0} min</div><div class="text-[10px] opacity-55 mt-1">${esc(s.subject||'Other')}${s.status==='completed'?' · Completed':''}</div></div></div>
        <div class="flex gap-1 mt-2"><button type="button" class="sq-edit-session themed-card-sub border rounded-md px-2 py-1 text-[10px]" data-id="${esc(s.id)}">Edit</button>${s.status==='planned'?'<button type="button" class="sq-remove-session themed-card-sub border rounded-md px-2 py-1 text-[10px]" data-id="'+esc(s.id)+'">Remove</button>':''}</div>
      </article>`).join('');
      return `<div class="sq-day-column ${today?'sq-today':''}" data-day="${key}" role="group" aria-label="Drop sessions on ${key}"><div class="flex items-center justify-between gap-1"><div><div class="text-xs font-black">${day.toLocaleDateString(undefined,{weekday:'short'})}</div><div class="text-[10px] opacity-60">${day.toLocaleDateString(undefined,{day:'numeric',month:'short'})}</div></div><span class="text-[10px] opacity-50">${sessions.length}</span></div>${cards||'<div class="sq-drop-hint">Drop a session here</div>'}</div>`;
    }).join('');
    grid.querySelectorAll('.sq-edit-session').forEach(b=>b.addEventListener('click',()=>typeof editPlannedSession==='function'&&editPlannedSession(b.dataset.id)));
    grid.querySelectorAll('.sq-remove-session').forEach(b=>b.addEventListener('click',()=>typeof removePlannedSession==='function'&&removePlannedSession(b.dataset.id)));
    tagSuggestionSources();
  }

  function tagSuggestionSources() {
    document.querySelectorAll('#schedule-suggestions-list > div').forEach(row=>{
      const btn=row.querySelector('button[onclick*="acceptSuggestion"]');
      const match=btn?.getAttribute('onclick')?.match(/acceptSuggestion\(['"]([^'"]+)['"]\)/);
      if (!match) return;
      row.draggable=true;
      row.dataset.sqSuggestionId=match[1];
      row.style.cursor='grab';
      row.title='Drag this suggestion onto a day in the visual planner';
    });
  }

  function onDragStart(event) {
    const session=event.target.closest('[data-session-id]');
    const suggestion=event.target.closest('[data-sq-suggestion-id]');
    if (session) {
      event.dataTransfer.setData('text/plain','session:'+session.dataset.sessionId);
      event.dataTransfer.effectAllowed='move';
      session.classList.add('sq-dragging');
    } else if (suggestion) {
      event.dataTransfer.setData('text/plain','suggestion:'+suggestion.dataset.sqSuggestionId);
      event.dataTransfer.effectAllowed='move';
    } else { event.preventDefault(); }
  }
  function onDragEnd(event) {
    event.target.closest('.sq-session-card')?.classList.remove('sq-dragging');
    getBoard()?.querySelectorAll('.sq-drop-ready').forEach(el=>el.classList.remove('sq-drop-ready'));
  }
  function onDragOver(event) {
    const day=event.target.closest('[data-day]');
    if (!day) return;
    event.preventDefault();
    event.dataTransfer.dropEffect='move';
    day.classList.add('sq-drop-ready');
  }
  function onDragLeave(event) {
    const day=event.target.closest('[data-day]');
    if (day && !day.contains(event.relatedTarget)) day.classList.remove('sq-drop-ready');
  }
  function overlaps(date,start,end,exceptId) {
    return (STATE.plannedSessions||[]).some(s=>s.id!==exceptId&&s.status==='planned'&&s.date===date&&timeMinutes(s.start)<timeMinutes(end)&&timeMinutes(s.end)>timeMinutes(start));
  }
  function findFreeTime(date, minutes, preferredStart) {
    const weekday=dateFor(date).getDay();
    const avail=(STATE.availability||defaultAvailability())[weekday];
    if (!avail?.enabled) return null;
    const step=15, first=timeMinutes(avail.start), last=timeMinutes(avail.end);
    const pref=Math.max(first,Math.min(last-minutes,timeMinutes(preferredStart)));
    const candidates=[pref];
    for(let t=first;t+minutes<=last;t+=step) if(t!==pref)candidates.push(t);
    candidates.sort((a,b)=>Math.abs(a-pref)-Math.abs(b-pref));
    for(const start of candidates){
      const end=start+minutes;
      const hh=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
      if(end<=last&&!overlaps(date,hh(start),hh(end),null)) return {start:hh(start),end:hh(end)};
    }
    return null;
  }
  function onDrop(event) {
    const day=event.target.closest('[data-day]');
    if (!day) return;
    event.preventDefault(); day.classList.remove('sq-drop-ready');
    const payload=event.dataTransfer.getData('text/plain')||'';
    const [type,id]=payload.split(':');
    const date=day.dataset.day;
    const status=getBoard()?.querySelector('#sq-board-status');
    if(type==='session'){
      const session=(STATE.plannedSessions||[]).find(s=>s.id===id);
      if(!session||session.status!=='planned'||session.date===date)return;
      if(overlaps(date,session.start,session.end,session.id)){if(status)status.textContent='That move overlaps another session. Try another day or edit its time.';return;}
      if(typeof pushUndo==='function')pushUndo('Move study session');
      session.date=date;session.updatedAt=new Date().toISOString();
      saveLocalStorage();renderBoard();if(typeof renderDashboard==='function')renderDashboard();
      if(status)status.textContent='Session moved to '+date+'.';
    } else if(type==='suggestion'){
      const suggestion=(STATE.scheduleSuggestions||[]).find(s=>s.id===id);
      if(!suggestion)return;
      const minutes=Number(suggestion.estimatedMinutes)||Math.max(15,timeMinutes(suggestion.end)-timeMinutes(suggestion.start));
      let time={start:suggestion.start,end:suggestion.end};
      if(overlaps(date,time.start,time.end,null))time=findFreeTime(date,minutes,suggestion.start);
      if(!time){time=findFreeTime(date,minutes,suggestion.start);}
      if(!time){if(status)status.textContent='No free time fits this session on that day. Change availability or choose another day.';return;}
      if(typeof pushUndo==='function')pushUndo('Schedule suggested session');
      STATE.plannedSessions=STATE.plannedSessions||[];
      STATE.plannedSessions.push({...suggestion,id:typeof createId==='function'?createId('session'):'session-'+Date.now(),date,start:time.start,end:time.end,estimatedMinutes:timeMinutes(time.end)-timeMinutes(time.start),status:'planned',acceptedAt:new Date().toISOString()});
      STATE.scheduleSuggestions=(STATE.scheduleSuggestions||[]).filter(s=>s.id!==id);
      saveLocalStorage();renderBoard();if(typeof renderStudyPlan==='function')renderStudyPlan();if(typeof renderDashboard==='function')renderDashboard();
      if(status)status.textContent='Session scheduled for '+date+'.';
    }
  }

  function install() {
    if(installed)return;installed=true;addStyles();ensureBoard();
    if(typeof window.renderStudyPlan==='function'){
      const original=window.renderStudyPlan;
      window.renderStudyPlan=function(){original.apply(this,arguments);renderBoard();};
    }
    const list=document.getElementById('schedule-suggestions-list');
    if(list)new MutationObserver(tagSuggestionSources).observe(list,{childList:true});
    renderBoard();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();