/* StudyQuest visual weekly planner — V10.1 */
(() => {
  const STYLE_ID = 'sq-visual-plan-style';
  const BOARD_ID = 'sq-visual-plan-board';
  let installed = false;
  let drawerOpen = false;

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${BOARD_ID}{color:#eaf1ff;background:linear-gradient(145deg,#071329,#0a1b38 58%,#071226)!important;border:1px solid #1b3d68!important;border-radius:22px!important;padding:22px!important;box-shadow:0 22px 60px #0004!important}
      #${BOARD_ID} .sq-week-grid{display:grid;grid-template-columns:repeat(7,minmax(145px,1fr));gap:0;overflow-x:auto;border:1px solid #17365e;border-radius:14px;background:#06142b;padding-bottom:0}
      #${BOARD_ID} .sq-day-column{min-height:520px;border:0;border-left:1px solid #17365e;border-radius:0;background:repeating-linear-gradient(to bottom,transparent 0,transparent 55px,#163153 56px);padding:10px 7px;transition:background .15s;min-width:0}
      #${BOARD_ID} .sq-day-column.sq-drop-ready{outline:2px dashed #818cf8;outline-offset:-3px;background-color:#122650}
      #${BOARD_ID} .sq-day-column.sq-today{background-color:#0d2046;box-shadow:inset 0 3px #6868ff}
      #${BOARD_ID} .sq-day-column>div:first-child{padding:5px 3px 12px;border-bottom:1px solid #1b3a63;margin-bottom:8px}
      #${BOARD_ID} .sq-session-card{cursor:grab;border:1px solid var(--task-color,#2b6f88);border-left:4px solid var(--task-color,#2dd4bf);border-radius:9px;padding:9px;margin-top:8px;background:color-mix(in srgb,var(--task-color,#2dd4bf) 24%,#081832);box-shadow:0 5px 15px #0002;overflow-wrap:anywhere}
      #${BOARD_ID} .sq-session-card:active{cursor:grabbing}
      #${BOARD_ID} .sq-session-card.sq-dragging{opacity:.4}
      #${BOARD_ID} .sq-session-time{font-size:10px;color:#b5d1f7;margin-top:5px}
      #${BOARD_ID} .sq-drop-hint{border:1px dashed #23456f;border-radius:9px;padding:16px 5px;text-align:center;font-size:10px;color:#9db8e7;margin-top:8px}
      #${BOARD_ID} .sq-board-note{font-size:12px;color:#9db8e7}
      #${BOARD_ID} .sq-plan-top{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:18px}
      #sq-task-drawer{position:fixed;z-index:9999;top:0;right:0;height:100dvh;width:min(390px,92vw);background:#081832;border-left:1px solid #294b7c;box-shadow:-20px 0 70px #0008;padding:20px;overflow:auto;transform:translateX(105%);transition:transform .22s ease;color:#eaf1ff}
      #sq-task-drawer.is-open{transform:translateX(0)}
      #sq-drawer-backdrop{position:fixed;inset:0;background:#020817aa;z-index:9998;opacity:0;pointer-events:none;transition:opacity .2s}
      #sq-drawer-backdrop.is-open{opacity:1;pointer-events:auto}
      #sq-task-drawer .sq-pool-task{border:1px solid #294b7c;border-radius:12px;padding:12px;margin-top:9px;background:#0c2040;cursor:grab}
      #sq-task-drawer .sq-pool-task:hover{border-color:#8b8cff}
      #sq-task-drawer .sq-plan-btn{border:1px solid #345b8d;border-radius:10px;background:#10264a;color:#eaf1ff;padding:9px 12px;font-size:12px;font-weight:800}
      #sq-task-drawer .sq-plan-btn-primary{background:linear-gradient(100deg,#4338ca,#6d45d9);border-color:#7771ff;color:white}
      #${BOARD_ID} .sq-day-column button{background:#0b2040;color:#dbeafe;border-color:#284d7b}
      @media(max-width:700px){#${BOARD_ID} .sq-week-grid{grid-template-columns:repeat(7,minmax(170px,1fr))}}
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
      <div class="sq-plan-top"><div><div style="font-size:10px;letter-spacing:.2em;font-weight:900;color:#8ea9ff">PLAN · FOCUS · ACHIEVE</div><h3 class="text-2xl font-black mt-2" style="color:#f5f7ff"><i class="fa-solid fa-calendar-days mr-2" style="color:#a5b4fc"></i>Weekly Study Planner</h3><p class="sq-board-note mt-2">Your week at a glance. Drag any task onto a day to plan it.</p></div><div class="flex gap-2 flex-wrap"><button type="button" id="sq-board-today" class="sq-plan-btn">This week</button><button type="button" id="sq-open-tasks" class="sq-plan-btn sq-plan-btn-primary"><i class="fa-solid fa-list-check mr-2"></i>All tasks <span id="sq-task-count"></span></button></div></div>
      <div id="sq-week-grid" class="sq-week-grid" aria-label="Drag-and-drop weekly study plan"></div>
      <div id="sq-drawer-backdrop" class="sq-drawer-backdrop"></div><aside id="sq-task-drawer" class="sq-task-drawer" aria-label="All tasks panel"><div class="flex items-center justify-between gap-3"><div><div style="font-size:10px;letter-spacing:.18em;color:#9db8e7;font-weight:800">YOUR TASK LIBRARY</div><h4 class="text-xl font-black mt-1">All tasks</h4><p class="sq-board-note mt-1">Drag any active task into a day.</p></div><button type="button" id="sq-close-tasks" class="sq-plan-btn" aria-label="Close task panel">✕</button></div><input id="sq-task-search" type="search" placeholder="Search your tasks…" class="w-full mt-4 px-3 py-2.5 rounded-xl border" style="background:#0c2040;color:#fff;border-color:#294b7c"><div id="sq-task-library" class="mt-3"></div><p id="sq-task-library-empty" class="sq-drop-hint">No active tasks found.</p><button type="button" id="sq-create-task" class="sq-plan-btn sq-plan-btn-primary w-full mt-4"><i class="fa-solid fa-plus mr-2"></i>Create a task</button></aside>
      <p id="sq-board-status" class="text-xs opacity-70" aria-live="polite"></p>`;
    const suggestions = plan.querySelector('#schedule-suggestions-list')?.closest('section');
    const accepted = plan.querySelector('#planned-session-list')?.closest('section');
    if (suggestions) { plan.insertBefore(section, suggestions); suggestions.style.display='none'; }
    else if (accepted) { plan.insertBefore(section, accepted); accepted.style.display='none'; }
    else plan.appendChild(section);
    if (suggestions) suggestions.style.display='none';
    if (accepted) accepted.style.display='none';
    const drawer=section.querySelector('#sq-task-drawer'),backdrop=section.querySelector('#sq-drawer-backdrop');
    if(drawer)document.body.appendChild(drawer);
    if(backdrop)document.body.appendChild(backdrop);
    Array.from(plan.children).forEach(child=>{if(child!==section)child.style.display='none'});
    section.querySelector('#sq-board-today').addEventListener('click', renderBoard);
    section.querySelector('#sq-open-tasks').addEventListener('click',()=>toggleDrawer(true));document.getElementById('sq-close-tasks').addEventListener('click',()=>toggleDrawer(false));document.getElementById('sq-drawer-backdrop').addEventListener('click',()=>toggleDrawer(false));document.getElementById('sq-task-search').addEventListener('input',renderTaskLibrary);document.getElementById('sq-create-task').addEventListener('click',()=>{if(typeof openTaskModal==='function')openTaskModal()});
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
      const cards=sessions.map(s=>`<article class="sq-session-card" draggable="${s.status!=='completed'}" data-session-id="${esc(s.id)}" style="--task-color:${esc(s.color||getTaskColor(s.taskId))};${s.status==='completed'?'opacity:.6;':''}">
        <div class="flex items-start gap-2"><i class="fa-solid fa-grip-vertical opacity-40 mt-1"></i><div class="min-w-0 flex-1"><div class="text-xs font-extrabold ${s.status==='completed'?'line-through':''}">${esc(s.title)}</div><div class="sq-session-time">${esc(s.start)}–${esc(s.end)} · ${Number(s.estimatedMinutes)||0} min</div><div class="text-[10px] opacity-55 mt-1">${esc(s.subject||'Other')}${s.status==='completed'?' · Completed':''}</div></div></div>
        <div class="flex gap-1 mt-2"><button type="button" class="sq-edit-session themed-card-sub border rounded-md px-2 py-1 text-[10px]" data-id="${esc(s.id)}">Edit</button>${s.status==='planned'?'<button type="button" class="sq-remove-session themed-card-sub border rounded-md px-2 py-1 text-[10px]" data-id="'+esc(s.id)+'">Remove</button>':''}</div>
      </article>`).join('');
      return `<div class="sq-day-column ${today?'sq-today':''}" data-day="${key}" role="group" aria-label="Drop sessions on ${key}"><div class="flex items-center justify-between gap-1"><div><div class="text-xs font-black">${day.toLocaleDateString(undefined,{weekday:'short'})}</div><div class="text-[10px] opacity-60">${day.toLocaleDateString(undefined,{day:'numeric',month:'short'})}</div></div><span class="text-[10px] opacity-50">${sessions.length}</span></div>${cards||'<div class="sq-drop-hint">Drop a session here</div>'}</div>`;
    }).join('');
    grid.querySelectorAll('.sq-edit-session').forEach(b=>b.addEventListener('click',()=>typeof editPlannedSession==='function'&&editPlannedSession(b.dataset.id)));
    grid.querySelectorAll('.sq-remove-session').forEach(b=>b.addEventListener('click',()=>typeof removePlannedSession==='function'&&removePlannedSession(b.dataset.id)));
    renderTaskLibrary();
    tagSuggestionSources();
  }

  function toggleDrawer(open){drawerOpen=open;document.getElementById('sq-task-drawer')?.classList.toggle('is-open',open);document.getElementById('sq-drawer-backdrop')?.classList.toggle('is-open',open);document.body.classList.toggle('sq-task-drawer-open',open);if(open)renderTaskLibrary()}
  function getTaskColor(taskId){const t=(STATE.tasks||[]).find(x=>String(x.id)===String(taskId));return t?.color||'#6366f1'}
  function renderTaskLibrary(){const b=getBoard();if(!b||typeof STATE==='undefined')return;const list=document.getElementById('sq-task-library'),empty=document.getElementById('sq-task-library-empty'),count=document.getElementById('sq-task-count');if(!list)return;const q=(document.getElementById('sq-task-search')?.value||'').trim().toLowerCase();const tasks=(STATE.tasks||[]).filter(t=>!t.completed&&t.status!=='completed'&&String(t.type||'').toLowerCase()!=='milestone'&&t.workKind!=='milestone'&&`${t.title||''} ${t.subject||''} ${t.type||''} ${t.notes||''}`.toLowerCase().includes(q));if(count)count.textContent='('+tasks.length+')';list.innerHTML=tasks.map(t=>'<div class="sq-pool-task" draggable="true" data-sq-task-id="'+esc(t.id)+'" style="border-left:4px solid '+esc(t.color||'#6366f1')+';background:color-mix(in srgb,'+esc(t.color||'#6366f1')+' 18%,#0c2040)"><div class="font-extrabold text-sm">'+esc(t.title)+'</div><div class="sq-small mt-1">'+esc(t.subject||'Other')+' · '+esc(t.type||'Task')+'</div><div class="sq-small mt-1">'+(t.deadline?'Due '+esc(t.deadline):'No deadline')+' · '+esc(t.time||t.estimatedTime||'30m')+'</div></div>').join('');if(empty)empty.style.display=tasks.length?'none':'block';}
  function tagSuggestionSources(){
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
    const task=event.target.closest('[data-sq-task-id]');
    if (session) {
      event.dataTransfer.setData('text/plain','session:'+session.dataset.sessionId);
      event.dataTransfer.effectAllowed='move';
      session.classList.add('sq-dragging');
    } else if (task) {event.dataTransfer.setData('text/plain','task:'+task.dataset.sqTaskId);event.dataTransfer.effectAllowed='copy';
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
    } else if(type==='task'){
      const task=(STATE.tasks||[]).find(t=>String(t.id)===id);if(!task)return;const raw=String(task.time||task.estimatedTime||'30m').toLowerCase(),hm=raw.match(/(\d+(?:\\.\d+)?)\s*h/),mm=raw.match(/(\d+)\s*m/),minutes=Math.max(15,Math.round((((hm?+hm[1]*60:0)+(mm?+mm[1]:0))||parseInt(raw,10)||30)/15)*15);const time=findFreeTime(date,minutes,'16:00');if(!time){if(status)status.textContent='No available time fits this task on that day. Adjust availability or choose another day.';return;}if(typeof pushUndo==='function')pushUndo('Schedule task from task library');STATE.plannedSessions=STATE.plannedSessions||[];STATE.plannedSessions.push({id:typeof createId==='function'?createId('session'):'session-'+Date.now(),taskId:task.id,title:task.title,subject:task.subject||'Other',color:task.color||'#6366f1',date,start:time.start,end:time.end,estimatedMinutes:minutes,status:'planned',source:'task-library',createdAt:new Date().toISOString()});saveLocalStorage();renderBoard();if(typeof renderDashboard==='function')renderDashboard();toggleDrawer(false);if(status)status.textContent='“'+task.title+'” added to '+date+'.';
    } else if(type==='suggestion'){
      const suggestion=(STATE.scheduleSuggestions||[]).find(s=>s.id===id);
      if(!suggestion)return;
      const minutes=Number(suggestion.estimatedMinutes)||Math.max(15,timeMinutes(suggestion.end)-timeMinutes(suggestion.start));
      let time={start:suggestion.start,end:suggestion.end};
      if(date!==suggestion.date || overlaps(date,time.start,time.end,null))time=findFreeTime(date,minutes,suggestion.start);
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