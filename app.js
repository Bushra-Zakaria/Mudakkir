/* mudakkir-app v1780991148 */
let attachments=gs('mz4_att',{});// {itemType_itemId: [{id,name,size,type,data,date}]}
function getAttKey(type,id){return `${type}
function getAttCount(type,id){
  const key=getAttKey(type,id);
  return(attachments[key]||[]).length;
}

const MN=['\u064a\u0646\u0627\u064a\u0631','\u0641\u0628\u0631\u0627\u064a\u0631','\u0645\u0627\u0631\u0633','\u0623\u0628\u0631\u064a\u0644','\u0645\u0627\u064a\u0648','\u064a\u0648\u0646\u064a\u0648','\u064a\u0648\u0644\u064a\u0648','\u0623\u063a\u0633\u0637\u0633','\u0633\u0628\u062a\u0645\u0628\u0631','\u0623\u0643\u062a\u0648\u0628\u0631','\u0646\u0648\u0641\u0645\u0628\u0631','\u062f\u064a\u0633\u0645\u0628\u0631'];
const DN=['\u0623\u062d\u062f','\u0625\u062b\u0646\u064a\u0646','\u062b\u0644\u0627\u062b\u0627\u0621','\u0623\u0631\u0628\u0639\u0627\u0621','\u062e\u0645\u064a\u0633','\u062c\u0645\u0639\u0629','\u0633\u0628\u062a'];
const MMP={\u064a\u0646\u0627\u064a\u0631:'01',\u0641\u0628\u0631\u0627\u064a\u0631:'02',\u0645\u0627\u0631\u0633:'03',\u0623\u0628\u0631\u064a\u0644:'04',\u0645\u0627\u064a\u0648:'05',\u064a\u0648\u0646\u064a\u0648:'06',\u064a\u0648\u0644\u064a\u0648:'07',\u0623\u063a\u0633\u0637\u0633:'08',\u0633\u0628\u062a\u0645\u0628\u0631:'09',\u0623\u0643\u062a\u0648\u0628\u0631:'10',\u0646\u0648\u0641\u0645\u0628\u0631:'11',\u062f\u064a\u0633\u0645\u0628\u0631:'12'};
const AVC=['#6C63FF','#1D9E75','#378ADD','#D85A30','#D4537E','#BA7517'];
function gs(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;}}
function ss(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
function tstr(){return new Date().toISOString().split('T')[0];}
function fd(d){if(!d)return'';const p=d.split('-');return p[2]+'/'+p[1]+'/'+p[0];}
function gi(n){return n?n.trim().split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase():'';}

let tasks=gs('mz4_t',[]);
let notes=gs('mz4_n',[]);
let contacts=gs('mz4_c',[]);
let meetings=gs('mz4_m',[]);
let nid=gs('mz4_nid',1);
let calY=new Date().getFullYear(),calM=new Date().getMonth();
let curN=null,_fired={},curFilter='today';
let fbConfig=gs('mz4_fb',null),syncActive=false;
let soundOn=gs('mz4_snd',true),alarmInt=null,audioCtx=null,audioUnlocked=false;
let _pickerMsg='',_pickerFromNotif=false,_selectedContacts=new Set();

function save(){
  ss('mz4_t',tasks);ss('mz4_n',notes);ss('mz4_c',contacts);ss('mz4_m',meetings);ss('mz4_nid',nid);
  if(syncActive)pushToFB();
}

function setupFirebase(){
  const pid=document.getElementById('fb-pid').value.trim();
  const key=document.getElementById('fb-key').value.trim();
  const uid=document.getElementById('fb-uid').value.trim();
  if(!pid||!key||!uid){alert('\u064a\u0631\u062c\u0649 \u062a\u0639\u0628\u0626\u0629 \u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0644');return;}
  fbConfig={pid,key,uid};ss('mz4_fb',fbConfig);initFirebase();
}

function initFirebase(){
  if(!fbConfig)return;
  const{pid,key,uid}=fbConfig;
  fbConfig._url=`https://${pid}-default-rtdb.asia-southeast1.firebasedatabase.app/mudakkir/${uid}.json?auth=${key}`;
  syncActive=true;
  updateSyncBadge('ok','\u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629 \u0641\u0639\u0627\u0644\u0629');
  document.getElementById('fbsetup').style.display='none';
  document.getElementById('fb-ok').style.display='block';
  document.getElementById('fb-info').textContent=`Project: ${pid} | \u0627\u0644\u0645\u0639\u0631\u0641: ${uid}`;
  pullFromFB();pullAttFromFB();
  setInterval(()=>{pullFromFB();pullAttFromFB();},5000);
}

function pushToFB(){
  if(!syncActive||!fbConfig._url)return;
  const ver=(gs('mz4_ver',0))+1;ss('mz4_ver',ver);
  fetch(fbConfig._url,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({tasks,notes,contacts,meetings,nid,ver,ts:Date.now()})})
    .then(()=>updateSyncBadge('ok','\u062a\u0645\u062a \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629 '+new Date().toLocaleTimeString('ar')))
    .catch(()=>updateSyncBadge('err','\u062e\u0637\u0623 \u0641\u064a \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629'));
}

function pullFromFB(){
  if(!syncActive||!fbConfig._url)return;
  fetch(fbConfig._url+'&t='+Date.now())
    .then(r=>r.json())
    .then(data=>{
      if(data&&data.ver!==undefined){
        const rv=data.ver,lv=gs('mz4_ver',0);
        if(rv>lv){
          tasks=data.tasks||[];notes=data.notes||[];contacts=data.contacts||[];meetings=data.meetings||[];nid=data.nid||nid;
          ss('mz4_t',tasks);ss('mz4_n',notes);ss('mz4_c',contacts);ss('mz4_nid',nid);ss('mz4_ver',rv);
          renderAll();toast('\u062a\u0645\u062a \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629 \u0645\u0646 \u062c\u0647\u0627\u0632 \u0622\u062e\u0631');
        }
        updateSyncBadge('ok','\u0645\u0632\u0627\u0645\u0646\u0629 \u0641\u0639\u0627\u0644\u0629');
      }
    }).catch(()=>updateSyncBadge('warn','\u0644\u0627 \u064a\u0648\u062c\u062f \u0627\u062a\u0635\u0627\u0644'));
}

function updateSyncBadge(t,m){
  document.getElementById('syncbadge').className='sync-badge sync-'+t;
  document.getElementById('synclbl').textContent=m;
}
function disconnectFB(){fbConfig=null;ss('mz4_fb',null);syncActive=false;updateSyncBadge('warn','\u0627\u0636\u063a\u0637 \u0644\u0625\u0639\u062f\u0627\u062f \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629');document.getElementById('fbsetup').style.display='block';document.getElementById('fb-ok').style.display='none';toast('\u062a\u0645 \u0642\u0637\u0639 \u0627\u0644\u0627\u062a\u0635\u0627\u0644');}
function syncNow(){if(syncActive)pushToFB();else sp('sync');}

function tc(t){
  const done=t.status==='done',del=t.status==='delayed';
  const tb=t.type==='meeting'?'<span class="badge bm">\u0627\u062c\u062a\u0645\u0627\u0639</span>':t.type==='task'?'<span class="badge bt">\u0645\u0647\u0645\u0629</span>':'<span class="badge bn">\u0645\u0644\u0627\u062d\u0638\u0629</span>';
  const sb=done?'<span class="badge bdo">\u0645\u0643\u062a\u0645\u0644</span>':del?'<span class="badge bdy">\u0645\u0624\u062c\u0644</span>':'';
  const wb=t.src==='wa'?'<span class="badge bw">\u0648\u0627\u062a\u0633\u0627\u0628</span>':'';
  const ub=(t.prio==='high'&&!done)?'<span class="badge bu">\u0639\u0627\u062c\u0644</span>':'';
  const di=del&&t.delayDate?`<span class="ttime"><i class="ti ti-calendar-event" style="font-size:11px;color:var(--wn)"></i>\u0645\u0624\u062c\u0644: ${fd(t.delayDate)} ${t.delayTime||''}</span>`:'';
  const bodyHtml=t.body?`<div style="font-size:12px;color:var(--mu);margin-top:5px;padding:7px 10px;background:var(--bg);border-radius:var(--rs);border-right:3px solid var(--pr);line-height:1.6">${t.body}</div>`:'';
  return`<div class="tc${done?' dc':''}" id="tc${t.id}">
    <div class="chk${done?' done':''}" onclick="tgl(${t.id})">${done?'<i class="ti ti-check"></i>':''}</div>
    <div class="tb">
      <div class="tt${done?' stk':''}">${t.title}</div>
      <div class="tm">${tb}${sb}${wb}${ub}<span class="ttime"><i class="ti ti-calendar" style="font-size:11px"></i>${fd(t.date)}${t.time?' — '+t.time:''}</span>${di}</div>
      ${bodyHtml}
    </div>
    <div class="tacts">
      ${!done?`<button class="bi" onclick="tgl(${t.id})"><i class="ti ti-check"></i></button>`:''}
      <button class="bi wab" onclick="twA(${t.id})"><i class="ti ti-brand-whatsapp"></i></button>
      <button class="bi" onclick="openAttachmentsModal('task',${t.id},'${t.title.replace(/'/g,"\\'")}')" title="\u0627\u0644\u0645\u0631\u0641\u0642\u0627\u062a ${getAttCount('task',t.id)?'('+getAttCount('task',t.id)+')':''}"><i class="ti ti-paperclip"></i>${getAttCount('task',t.id)?`<span style="font-size:9px;background:var(--in);color:#fff;border-radius:var(--rf);padding:0 4px;margin-right:1px">${getAttCount('task',t.id)}</span>`:''}</button>
      <button class="bi" onclick="editT(${t.id})"><i class="ti ti-edit"></i></button>
      <button class="bi dlb" onclick="delT(${t.id})"><i class="ti ti-trash"></i></button>
    </div></div>`;}

function renderAll(){
  const ts=tstr(),done=tasks.filter(t=>t.status==='done'),del=tasks.filter(t=>t.status==='delayed'),mtg=tasks.filter(t=>t.type==='meeting'),urg=tasks.filter(t=>t.date===ts&&t.status==='pending');
  document.getElementById('s0').textContent=urg.length;
  document.getElementById('s1').textContent=done.length;
  document.getElementById('s2').textContent=del.length;
  document.getElementById('s3').textContent=mtg.length;
  document.getElementById('s4').textContent=tasks.filter(t=>t.prio==='high'&&t.status!=='done').length;
  document.getElementById('s5').textContent=notes.length;
  const nb=document.getElementById('nbt');nb.textContent=urg.length;nb.style.display=urg.length?'inline':'none';
  const aa=document.getElementById('alertarea');
  aa.innerHTML=urg.length?`<div class="alert-bar"><i class="ti ti-bell-exclamation" style="color:var(--er);font-size:17px"></i><div style="flex:1;font-size:12px;color:var(--er);font-weight:500">\u0644\u062f\u064a\u0643 ${urg.length} \u0645\u0647\u0645\u0629 \u0639\u0627\u062c\u0644\u0629 \u0627\u0644\u064a\u0648\u0645</div><button style="background:none;border:none;cursor:pointer;color:var(--er)" onclick="this.parentElement.remove()"><i class="ti ti-x"></i></button></div>`:'';
  filterHome(curFilter);
  document.getElementById('atasks').innerHTML=tasks.length?tasks.map(tc).join(''):'<div class="empty"><i class="ti ti-checkbox"></i>\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0647\u0627\u0645</div>';
  document.getElementById('watasks').innerHTML=tasks.filter(t=>t.src==='wa').map(tc).join('')||'<div class="empty"><i class="ti ti-brand-whatsapp"></i>\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0647\u0627\u0645 \u0645\u0633\u062a\u0648\u0631\u062f\u0629</div>';
  document.getElementById('r0').textContent=tasks.length;
  if(document.getElementById('r0s'))document.getElementById('r0s').textContent=`${done.length} \u0645\u0643\u062a\u0645\u0644\u0629`;
  const totalAll=tasks.length+meetings.length+notes.length;
  const totalDone=done.length+meetings.filter(m=>m.status==='done').length+notes.filter(n=>n.status==='done').length;
  document.getElementById('r1').textContent=totalAll?Math.round(totalDone/totalAll*100)+'%':'0%';
  document.getElementById('r2').textContent=meetings.length;
  if(document.getElementById('r2s'))document.getElementById('r2s').textContent=`${meetings.filter(m=>m.status==='done').length} \u0645\u0646\u062a\u0647\u064a\u0629`;
  if(document.getElementById('r5'))document.getElementById('r5').textContent=notes.length;
  if(document.getElementById('r5s'))document.getElementById('r5s').textContent=`${notes.filter(n=>n.status==='done').length} \u0645\u0646\u062c\u0632\u0629`;
  const tp=[{l:'\u0645\u0647\u0627\u0645 \u0642\u064a\u062f \u0627\u0644\u062a\u0646\u0641\u064a\u0630',c:tasks.filter(t=>t.status==='pending').length,col:'var(--pr)'},{l:'\u0645\u0647\u0627\u0645 \u0645\u0643\u062a\u0645\u0644\u0629',c:done.length,col:'var(--ok)'},{l:'\u0645\u0647\u0627\u0645 \u0645\u0624\u062c\u0644\u0629',c:del.length,col:'var(--wn)'},{l:'\u0627\u062c\u062a\u0645\u0627\u0639\u0627\u062a',c:meetings.length,col:'var(--in)'},{l:'\u0645\u0644\u0627\u062d\u0638\u0627\u062a',c:notes.length,col:'#BA7517'}];
  const mx=Math.max(...tp.map(x=>x.c),1);
  document.getElementById('rbars').innerHTML=tp.map(x=>`<div class="pr"><div class="pl" style="font-size:11px;width:110px">${x.l}</div><div class="pb"><div class="pf" style="width:${Math.round(x.c/mx*100)}%;background:${x.col}"></div></div><div class="pp">${x.c}</div></div>`).join('');
  if(document.getElementById('report-preview'))renderReportPreview();
  renderCal();renderNotes();renderContacts();renderCMini();renderMeetings();
}

function filterHome(type){
  curFilter=type;
  document.querySelectorAll('#sc0,#sc1,#sc2,#sc3').forEach(s=>s.classList.remove('af'));
  const map={today:'sc0',done:'sc1',delayed:'sc2',meeting:'sc3'};
  if(map[type])document.getElementById(map[type]).classList.add('af');
  const ftitles={today:'\u0645\u0647\u0627\u0645 \u0627\u0644\u064a\u0648\u0645',done:'\u0627\u0644\u0645\u0647\u0627\u0645 \u0627\u0644\u0645\u0643\u062a\u0645\u0644\u0629',delayed:'\u0627\u0644\u0645\u0647\u0627\u0645 \u0627\u0644\u0645\u0624\u062c\u0644\u0629',meeting:'\u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639\u0627\u062a',urgent:'\u0627\u0644\u0645\u0647\u0627\u0645 \u0627\u0644\u0639\u0627\u062c\u0644\u0629',all:'\u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0647\u0627\u0645'};
  document.getElementById('hft').textContent=ftitles[type]||'\u0627\u0644\u0645\u0647\u0627\u0645';
  const ts=tstr();
  let list=type==='today'?tasks.filter(t=>t.date===ts&&t.status!=='done'):type==='done'?tasks.filter(t=>t.status==='done'):type==='delayed'?tasks.filter(t=>t.status==='delayed'):type==='meeting'?tasks.filter(t=>t.type==='meeting'):type==='urgent'?tasks.filter(t=>t.prio==='high'&&t.status!=='done'):tasks;
  document.getElementById('htasks').innerHTML=list.length?list.map(tc).join(''):'<div class="empty"><i class="ti ti-checks"></i>\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0647\u0627\u0645 \u0641\u064a \u0647\u0630\u0647 \u0627\u0644\u0641\u0626\u0629</div>';
}

// ─── REPORTS ─────────────────────────────────────────────────────────────
function renderRTasks(){renderReportPreview();}

function getFilteredTasks(){
  const v=document.getElementById('rfilter')?document.getElementById('rfilter').value:'all';
  if(v==='pending')return tasks.filter(t=>t.status==='pending');
  if(v==='done')return tasks.filter(t=>t.status==='done');
  if(v==='delayed')return tasks.filter(t=>t.status==='delayed');
  if(v==='urgent')return tasks.filter(t=>t.prio==='high'&&t.status!=='done');
  return tasks;
}
function getFilteredMeetings(){
  const v=document.getElementById('rmfilter')?document.getElementById('rmfilter').value:'all';
  if(v==='upcoming')return meetings.filter(m=>m.status==='upcoming'||m.status==='inprogress');
  if(v==='done')return meetings.filter(m=>m.status==='done');
  return meetings;
}
function incTasks(){return document.getElementById('inc-tasks')?.checked;}
function incMeetings(){return document.getElementById('inc-meetings')?.checked;}
function incNotes(){return document.getElementById('inc-notes')?.checked;}
function incCalendar(){return document.getElementById('inc-calendar')?.checked;}

function toggleReportSection(sec){
  const lbl=document.getElementById('lbl-'+sec);
  const checked=document.getElementById('inc-'+sec)?.checked;
  if(lbl)lbl.style.borderColor=checked?'var(--pr)':'var(--bd)';
  renderReportPreview();
}
function selectAllReport(){
  ['tasks','meetings','notes','calendar'].forEach(s=>{
    const cb=document.getElementById('inc-'+s);if(cb)cb.checked=true;
    const lbl=document.getElementById('lbl-'+s);if(lbl)lbl.style.borderColor='var(--pr)';
  });
  renderReportPreview();
}

function renderReportPreview(){
  const tList=incTasks()?getFilteredTasks():[];
  const mList=incMeetings()?getFilteredMeetings():[];
  const nList=incNotes()?notes:[];
  const cList=incCalendar()?tasks.filter(t=>t.date):[];
  const total=tList.length+mList.length+nList.length;
  const el=document.getElementById('report-preview');
  const cnt=document.getElementById('report-count');
  if(cnt)cnt.textContent=`${total} \u0639\u0646\u0635\u0631 \u0645\u062d\u062f\u062f`;
  let html='';
  if(tList.length){
    html+=`<div style="margin-bottom:14px"><div style="font-size:12px;font-weight:600;color:var(--pr);margin-bottom:7px;display:flex;align-items:center;gap:6px"><i class="ti ti-checkbox"></i> \u0627\u0644\u0645\u0647\u0627\u0645 (${tList.length})</div>`;
    html+=`<div class="tl">${tList.map(t=>tc(t)).join('')}</div></div>`;
  }
  if(mList.length){
    html+=`<div style="margin-bottom:14px"><div style="font-size:12px;font-weight:600;color:var(--in);margin-bottom:7px;display:flex;align-items:center;gap:6px"><i class="ti ti-users-group"></i> \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639\u0627\u062a (${mList.length})</div>`;
    html+=mList.map(m=>{
      const tl=mtypeLabels[m.mtype]||'\u0627\u062c\u062a\u0645\u0627\u0639';
      const st=mstatusLabels[m.status]||'\u0642\u0627\u062f\u0645';
      return`<div class="tc" style="margin-bottom:6px${m.status==='done'?';opacity:.6':''}">
        <div class="chk${m.status==='done'?' done':''}">${m.status==='done'?'<i class="ti ti-check"></i>':''}</div>
        <div class="tb">
          <div class="tt${m.status==='done'?' stk':''}">${m.title}</div>
          <div class="tm">
            <span class="badge bm">${tl}</span>
            <span class="badge" style="background:var(--bg);color:var(--mu)">${st}</span>
            ${m.date?`<span class="ttime"><i class="ti ti-calendar" style="font-size:11px"></i>${fd(m.date)}${m.time?' - '+m.time:''}</span>`:''}
            ${m.location?`<span class="ttime"><i class="ti ti-map-pin" style="font-size:11px"></i>${m.location}</span>`:''}
          </div>
          ${m.decisions?`<div style="font-size:11px;color:var(--mu);margin-top:4px;padding:5px 8px;background:var(--ok-l);border-radius:var(--rs);border-right:2px solid var(--ok)">\u0627\u0644\u0642\u0631\u0627\u0631\u0627\u062a: ${m.decisions}</div>`:''}
        </div>
      </div>`;}).join('');
    html+='</div>';
  }
  if(nList.length){
    html+=`<div style="margin-bottom:14px"><div style="font-size:12px;font-weight:600;color:var(--wn);margin-bottom:7px;display:flex;align-items:center;gap:6px"><i class="ti ti-note"></i> \u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0627\u062a (${nList.length})</div>`;
    html+=`<div class="sgrid">${nList.map(n=>`<div class="sk ${n.color}" style="${n.status==='done'?'opacity:.6':''}">
      <div class="sk-t" style="${n.status==='done'?'text-decoration:line-through':''}">${n.title}</div>
      <div class="sk-b">${n.text}</div>
      ${n.prio&&n.prio!=='normal'?`<div style="font-size:10px;color:${n.prio==='high'?'var(--er)':'var(--wn)'};margin-top:5px;font-weight:600">${n.prio==='high'?'\u0639\u0627\u0644\u064a\u0629 \u0627\u0644\u0627\u0647\u0645\u064a\u0629':'\u0645\u062a\u0648\u0633\u0637 \u0627\u0644\u0627\u0647\u0645\u064a\u0629'}</div>`:''}
      <div class="sk-d" style="margin-top:6px">${n.date}${n.date2?' - \u062a\u0630\u0643\u064a\u0631: '+fd(n.date2):''}</div>
    </div>`).join('')}</div></div>`;
  }
  if(!html)html='<div class="empty"><i class="ti ti-file-off"></i>\u0627\u062e\u062a\u0631 \u0627\u0644\u0627\u0642\u0633\u0627\u0645 \u0627\u0644\u062a\u064a \u062a\u0631\u064a\u062f \u062a\u0636\u0645\u064a\u0646\u0647\u0627 \u0641\u064a \u0627\u0644\u062a\u0642\u0631\u064a\u0631</div>';
  if(el)el.innerHTML=html;
}

function buildFullHTML(){
  const tList=incTasks()?getFilteredTasks():[];
  const mList=incMeetings()?getFilteredMeetings():[];
  const nList=incNotes()?notes:[];
  const now=new Date(),ds=`${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`;
  const doneT=tList.filter(t=>t.status==='done').length;
  const doneM=mList.filter(m=>m.status==='done').length;
  const doneN=nList.filter(n=>n.status==='done').length;
  const total=tList.length+mList.length+nList.length;
  const totalDone=doneT+doneM+doneN;
  const pct=total?Math.round(totalDone/total*100):0;

  let tasksHTML='',meetingsHTML='',notesHTML='';
  if(tList.length){
    tasksHTML=`<h2 style="font-size:15px;color:#6C63FF;border-bottom:2px solid #6C63FF;padding-bottom:6px;margin:20px 0 12px">\u0627\u0644\u0645\u0647\u0627\u0645 (${tList.length})</h2>
    <table><thead><tr><th>\u0627\u0644\u0645\u0647\u0645\u0629</th><th>\u0627\u0644\u0646\u0648\u0639</th><th>\u0627\u0644\u062a\u0627\u0631\u064a\u062e</th><th>\u0627\u0644\u0627\u0648\u0644\u0648\u064a\u0629</th><th>\u0627\u0644\u062d\u0627\u0644\u0629</th></tr></thead><tbody>
    ${tList.map(t=>{
      const st=t.status==='done'?'\u0645\u0643\u062a\u0645\u0644':t.status==='delayed'?'\u0645\u0624\u062c\u0644':'\u0642\u064a\u062f \u0627\u0644\u062a\u0646\u0641\u064a\u0630';
      const stc=t.status==='done'?'#1D9E75':t.status==='delayed'?'#BA7517':'#378ADD';
      const tp=t.type==='meeting'?'\u0627\u062c\u062a\u0645\u0627\u0639':t.type==='task'?'\u0645\u0647\u0645\u0629':'\u0645\u0644\u0627\u062d\u0638\u0629';
      return`<tr><td style="font-weight:500${t.status==='done'?';text-decoration:line-through;color:#999':''}">${t.title}${t.body?`<br><small style="color:#888;font-weight:400">${t.body}</small>`:''}</td>
      <td>${tp}</td><td>${fd(t.date)}${t.time?' '+t.time:''}</td>
      <td>${t.prio==='high'?'<span style="color:#E24B4A;font-weight:600">\u0639\u0627\u062c\u0644</span>':'\u0639\u0627\u062f\u064a'}</td>
      <td style="color:${stc};font-weight:500">${st}</td></tr>`;}).join('')}
    </tbody></table>`;
  }
  if(mList.length){
    meetingsHTML=`<h2 style="font-size:15px;color:#378ADD;border-bottom:2px solid #378ADD;padding-bottom:6px;margin:20px 0 12px">\u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639\u0627\u062a (${mList.length})</h2>`;
    mList.forEach(m=>{
      const tl=mtypeLabels[m.mtype]||'\u0627\u062c\u062a\u0645\u0627\u0639';
      const st=mstatusLabels[m.status]||'\u0642\u0627\u062f\u0645';
      meetingsHTML+=`<div style="border:1px solid #e8e6f0;border-radius:10px;padding:12px 14px;margin-bottom:10px${m.status==='done'?';opacity:.7':''}">
        <div style="font-size:14px;font-weight:700${m.status==='done'?';text-decoration:line-through':''}">
          ${m.title} <span style="font-size:11px;background:#E6F1FB;color:#0C447C;padding:2px 7px;border-radius:99px;font-weight:500">${tl}</span>
          <span style="font-size:11px;background:${m.status==='done'?'#E1F5EE':'#F8F7FF'};color:${m.status==='done'?'#1D9E75':'#6b6880'};padding:2px 7px;border-radius:99px;font-weight:500">${st}</span>
        </div>
        ${m.date?`<div style="font-size:12px;color:#6b6880;margin-top:4px">\u0627\u0644\u062a\u0627\u0631\u064a\u062e: ${fd(m.date)}${m.time?' - '+m.time:''}${m.duration?' ('+m.duration+' \u062f\u0642\u064a\u0642\u0629)':''}</div>`:''}
        ${m.location?`<div style="font-size:12px;color:#6b6880">\u0627\u0644\u0645\u0643\u0627\u0646: ${m.location}</div>`:''}
        ${m.organizer?`<div style="font-size:12px;color:#6b6880">\u0627\u0644\u0645\u0646\u0638\u0645: ${m.organizer}</div>`:''}
        ${m.attendees?`<div style="font-size:12px;color:#6b6880">\u0627\u0644\u062d\u0636\u0648\u0631: ${m.attendees}</div>`:''}
        ${m.agenda?`<div style="font-size:12px;margin-top:6px;padding:7px 10px;background:#F8F7FF;border-radius:6px;border-right:3px solid #378ADD"><strong>\u062c\u062f\u0648\u0644 \u0627\u0644\u0627\u0639\u0645\u0627\u0644:</strong><br>${m.agenda.replace(/\n/g,'<br>')}</div>`:''}
        ${m.decisions?`<div style="font-size:12px;margin-top:6px;padding:7px 10px;background:#E1F5EE;border-radius:6px;border-right:3px solid #1D9E75"><strong>\u0627\u0644\u0642\u0631\u0627\u0631\u0627\u062a:</strong><br>${m.decisions.replace(/\n/g,'<br>')}</div>`:''}
        ${m.nextActions?`<div style="font-size:12px;margin-top:6px;padding:7px 10px;background:#EEEDFE;border-radius:6px;border-right:3px solid #6C63FF"><strong>\u0627\u0644\u0627\u062c\u0631\u0627\u0621\u0627\u062a \u0627\u0644\u062a\u0627\u0644\u064a\u0629:</strong><br>${m.nextActions.replace(/\n/g,'<br>')}</div>`:''}
      </div>`;
    });
  }
  if(nList.length){
    notesHTML=`<h2 style="font-size:15px;color:#BA7517;border-bottom:2px solid #BA7517;padding-bottom:6px;margin:20px 0 12px">\u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0627\u062a (${nList.length})</h2>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
    ${nList.map(n=>{
      const bg={sy:'#FAEEDA',sp:'#EEEDFE',sg:'#EAF3DE',sb2:'#E6F1FB',sc:'#FAECE7'}[n.color]||'#F8F7FF';
      const bd={sy:'#FAC775',sp:'#CECBF6',sg:'#C0DD97',sb2:'#B5D4F4',sc:'#F5C4B3'}[n.color]||'#e8e6f0';
      return`<div style="background:${bg};border:1px solid ${bd};border-radius:10px;padding:12px${n.status==='done'?';opacity:.6':''}">
        <div style="font-size:13px;font-weight:700;color:#2C2C2A${n.status==='done'?';text-decoration:line-through':''};margin-bottom:5px">${n.title}</div>
        <div style="font-size:12px;color:#5F5E5A;line-height:1.5">${n.text}</div>
        ${n.prio&&n.prio!=='normal'?`<div style="font-size:10px;color:${n.prio==='high'?'#E24B4A':'#BA7517'};font-weight:600;margin-top:5px">${n.prio==='high'?'\u0639\u0627\u0644\u064a\u0629 \u0627\u0644\u0627\u0647\u0645\u064a\u0629':'\u0645\u062a\u0648\u0633\u0637 \u0627\u0644\u0627\u0647\u0645\u064a\u0629'}</div>`:''}
        <div style="font-size:10px;color:#888;margin-top:6px">${n.date}${n.date2?' - \u062a\u0630\u0643\u064a\u0631: '+fd(n.date2):''}</div>
      </div>`;}).join('')}
    </div>`;
  }

  return`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
    @media print{body{margin:0}@page{margin:15mm;size:A4}}
    body{font-family:'Tajawal',Arial,sans-serif;margin:0;padding:24px;color:#1a1a2e;background:#fff;font-size:13px}
    .hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:16px;border-bottom:3px solid #6C63FF}
    .logo{display:flex;align-items:center;gap:12px}
    .logo-box{width:44px;height:44px;background:#6C63FF;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}
    .sc{background:#F8F7FF;border-radius:10px;padding:12px;text-align:center;border:1px solid #e8e6f0}
    .sv{font-size:22px;font-weight:700;margin-bottom:2px}.sl{font-size:11px;color:#6b6880}
    table{width:100%;border-collapse:collapse;margin-bottom:10px}
    th{background:#6C63FF;color:#fff;padding:9px 10px;font-size:12px;text-align:right;font-weight:500}
    td{padding:8px 10px;border-bottom:1px solid #f0eef8;font-size:12px}
    tr:nth-child(even) td{background:#F8F7FF}
    .footer{margin-top:24px;padding-top:12px;border-top:1px solid #eee;font-size:11px;color:#a09db8;text-align:center}
  </style></head><body>
  <div class="hdr">
    <div class="logo">
      <div class="logo-box">&#128276;</div>
      <div><div style="font-size:20px;font-weight:700">\u062a\u0642\u0631\u064a\u0631 \u0645\u0630\u0643\u0631</div><div style="font-size:11px;color:#6b6880">\u0627\u0644\u0645\u0633\u0627\u0639\u062f \u0627\u0644\u0630\u0643\u064a \u0644\u0644\u0645\u0648\u0627\u0639\u064a\u062f \u0648\u0627\u0644\u0627\u0639\u0645\u0627\u0644</div></div>
    </div>
    <div style="text-align:left">
      <div style="font-size:13px;font-weight:500;color:#1a1a2e">\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062a\u0642\u0631\u064a\u0631: ${ds}</div>
      <div style="font-size:11px;color:#6b6880;margin-top:3px">\u0627\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0639\u0646\u0627\u0635\u0631: ${total} | \u0627\u0644\u0645\u0646\u062c\u0632: ${totalDone} (${pct}%)</div>
    </div>
  </div>
  <div class="stats">
    <div class="sc"><div class="sv" style="color:#6C63FF">${tList.length}</div><div class="sl">\u0627\u0644\u0645\u0647\u0627\u0645</div></div>
    <div class="sc"><div class="sv" style="color:#378ADD">${mList.length}</div><div class="sl">\u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639\u0627\u062a</div></div>
    <div class="sc"><div class="sv" style="color:#BA7517">${nList.length}</div><div class="sl">\u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0627\u062a</div></div>
    <div class="sc"><div class="sv" style="color:#1D9E75">${pct}%</div><div class="sl">\u0646\u0633\u0628\u0629 \u0627\u0644\u0627\u0646\u062c\u0627\u0632</div></div>
  </div>
  ${tasksHTML}${meetingsHTML}${notesHTML}
  <div class="footer">\u062a\u0645 \u0627\u0646\u0634\u0627\u0621 \u0647\u0630\u0627 \u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0628\u0648\u0627\u0633\u0637\u0629 \u062a\u0637\u0628\u064a\u0642 \u0645\u0630\u0643\u0631 - ${ds}</div>
  </body></html>`;}

function exportFullPDF(){
  const w=window.open('','_blank');
  w.document.write(buildFullHTML());
  w.document.close();
  setTimeout(()=>w.print(),700);
  toast('\u0627\u062e\u062a\u0631 \u062d\u0641\u0638 \u0643\u0640 PDF \u0639\u0646\u062f \u0627\u0644\u0637\u0628\u0627\u0639\u0629');
}
function printReport(){exportFullPDF();}

function shareFullReportWA(){
  if(!contacts.length){toast('\u0627\u0636\u0641 \u062c\u0647\u0629 \u0627\u062a\u0635\u0627\u0644 \u0627\u0648\u0644\u0627\u064b');return;}
  const tList=incTasks()?getFilteredTasks():[];
  const mList=incMeetings()?getFilteredMeetings():[];
  const nList=incNotes()?notes:[];
  const now=new Date(),ds=`${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`;
  const total=tList.length+mList.length+nList.length;
  const done=tList.filter(t=>t.status==='done').length+mList.filter(m=>m.status==='done').length+nList.filter(n=>n.status==='done').length;
  const pct=total?Math.round(done/total*100):0;
  let msg=`* \u062a\u0642\u0631\u064a\u0631 \u0645\u0630\u0643\u0631 - ${ds} *\n\n\u0627\u062c\u0645\u0627\u0644\u064a: ${total} \u0639\u0646\u0635\u0631\n\u0645\u0646\u062c\u0632: ${done} (${pct}%)`;
  if(tList.length){msg+=`\n\n\u0627\u0644\u0645\u0647\u0627\u0645 (${tList.length}):\n${tList.slice(0,5).map(t=>`- ${t.title} [${t.status==='done'?'\u0645\u0643\u062a\u0645\u0644':t.status==='delayed'?'\u0645\u0624\u062c\u0644':'\u0642\u064a\u062f \u0627\u0644\u062a\u0646\u0641\u064a\u0630'}]`).join('\n')}${tList.length>5?`\n...\u0648${tList.length-5} \u0627\u062e\u0631\u0649`:''}`;}
  if(mList.length){msg+=`\n\n\u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639\u0627\u062a (${mList.length}):\n${mList.slice(0,3).map(m=>`- ${m.title} [${fd(m.date)}]`).join('\n')}`;}
  if(nList.length){msg+=`\n\n\u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0627\u062a (${nList.length}):\n${nList.slice(0,3).map(n=>`- ${n.title}`).join('\n')}`;}
  msg+='\n\n-- \u0645\u0630\u0643\u0631';
  showContactPicker(msg);
}

function renderCal(){
  document.getElementById('cmt').textContent=`${MN[calM]} ${calY}`;
  document.getElementById('calh').innerHTML=['\u0623','\u0625','\u062b','\u0623\u0631','\u062e','\u062c','\u0633'].map(d=>`<div class="chd">${d}</div>`).join('');
  const first=new Date(calY,calM,1).getDay(),dim=new Date(calY,calM+1,0).getDate();
  let h='';for(let i=0;i<first;i++)h+=`<div></div>`;
  for(let d=1;d<=dim;d++){const ds=`${calY}-${String(calM+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;const it=ds===tstr(),he=tasks.some(t=>t.date===ds||t.delayDate===ds);h+=`<div class="cd${it?' today':''}${he?' hev':''}" onclick="fbd('${ds}')">${d}</div>`;}
  document.getElementById('cald').innerHTML=h;
  const ev=tasks.filter(t=>t.date&&t.date.startsWith(`${calY}-${String(calM+1).padStart(2,'0')}`));
  document.getElementById('calevents').innerHTML=ev.length?ev.map(tc).join(''):'<div class="empty"><i class="ti ti-calendar"></i>\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0648\u0627\u0639\u064a\u062f</div>';
}
function fbd(ds){document.getElementById('cetitle').textContent=`\u0645\u0648\u0627\u0639\u064a\u062f ${fd(ds)}`;const ev=tasks.filter(t=>t.date===ds||t.delayDate===ds);document.getElementById('calevents').innerHTML=ev.length?ev.map(tc).join(''):'<div class="empty"><i class="ti ti-calendar-off"></i>\u0644\u0627 \u0645\u0648\u0627\u0639\u064a\u062f \u0641\u064a \u0647\u0630\u0627 \u0627\u0644\u064a\u0648\u0645</div>';}
function chM(d){calM+=d;if(calM>11){calM=0;calY++;}if(calM<0){calM=11;calY--;}renderCal();}

function renderNotes(){
  const prioLabel={high:'\u0639\u0627\u0644\u064a\u0629 \u0627\u0644\u0627\u0647\u0645\u064a\u0629',medium:'\u0645\u062a\u0648\u0633\u0637 \u0627\u0644\u0627\u0647\u0645\u064a\u0629',normal:'\u0639\u0627\u062f\u064a'};
  const prioColor={high:'var(--er)',medium:'var(--wn)',normal:'var(--ok)'};
  document.getElementById('sgrid').innerHTML=notes.map(n=>{
    const hasPrio=n.prio&&n.prio!=='normal';
    const hasDate=n.date2;
    const isToday=n.date2===tstr();
    const isDone=n.status==='done';
    return`<div class="sk ${n.color}" style="${isDone?'opacity:0.6;':''}${isToday&&!isDone?'border-color:var(--er);border-width:2px':''}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:4px;margin-bottom:6px">
        <div style="display:flex;align-items:center;gap:6px;flex:1">
          <div class="chk${isDone?' done':''}" onclick="tglNote(${n.id})" style="width:18px;height:18px;border-radius:50%;border:2px solid ${isDone?'var(--ok)':'rgba(0,0,0,.2)'};background:${isDone?'var(--ok)':'transparent'};display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .2s">
            ${isDone?'<i class="ti ti-check" style="font-size:10px;color:#fff"></i>':''}
          </div>
          <div class="sk-t" style="${isDone?'text-decoration:line-through;color:#999':''}flex:1">${n.title}</div>
        </div>
        ${hasPrio&&!isDone?`<span style="font-size:9px;padding:2px 6px;border-radius:var(--rf);background:rgba(255,255,255,.75);color:${prioColor[n.prio]};font-weight:600;white-space:nowrap;flex-shrink:0">${prioLabel[n.prio]}</span>`:''}
        ${isDone?`<span style="font-size:9px;padding:2px 6px;border-radius:var(--rf);background:rgba(255,255,255,.75);color:var(--ok);font-weight:600;white-space:nowrap;flex-shrink:0"><i class="ti ti-check"></i> \u0645\u0646\u062c\u0632</span>`:''}
      </div>
      <div class="sk-b" style="${isDone?'text-decoration:line-through;color:#999':''}color:#5F5E5A">${n.text}</div>
      ${hasDate&&!isDone?`<div style="font-size:10px;color:${isToday?'var(--er)':'#666'};margin-top:7px;display:flex;align-items:center;gap:4px;font-weight:${isToday?'700':'400'}">
        <i class="ti ti-bell" style="font-size:11px"></i>${isToday?'\u0627\u0644\u064a\u0648\u0645!':fd(n.date2)}${n.time?' - '+n.time:''}
      </div>`:''}
      <div class="sk-footer">
        <div class="sk-d"><i class="ti ti-calendar" style="font-size:10px"></i> ${n.date}</div>
        <div class="sk-acts">
          ${!isDone?`<button class="sk-btn" onclick="tglNote(${n.id})" title="\u062a\u0645 \u0627\u0644\u0627\u0646\u062c\u0627\u0632" style="background:rgba(255,255,255,.7)"><i class="ti ti-circle-check" style="color:var(--ok)"></i></button>`:''}
          <button class="sk-btn" onclick="openAttachmentsModal('note',${n.id},'${n.title.replace(/'/g,"\\'")}')" title="\u0627\u0644\u0645\u0631\u0641\u0642\u0627\u062a" style="position:relative">
            <i class="ti ti-paperclip" style="color:var(--in)"></i>
            ${getAttCount('note',n.id)?`<span style="position:absolute;top:-4px;left:-4px;background:var(--in);color:#fff;border-radius:50%;width:14px;height:14px;font-size:9px;display:flex;align-items:center;justify-content:center">${getAttCount('note',n.id)}</span>`:''}
          </button>
          <button class="sk-btn" onclick="shareNote(${n.id})" title="\u0627\u0631\u0633\u0627\u0644 \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628"><i class="ti ti-brand-whatsapp" style="color:var(--wa)"></i></button>
          <button class="sk-btn" onclick="editNote(${n.id})" title="\u062a\u0639\u062f\u064a\u0644"><i class="ti ti-edit" style="color:#555"></i></button>
          <button class="sk-btn" onclick="delNote(${n.id})" title="\u062d\u0630\u0641"><i class="ti ti-trash" style="color:var(--er)"></i></button>
        </div>
      </div>
    </div>`;}).join('')||'<div class="empty" style="grid-column:1/-1"><i class="ti ti-note"></i>\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0644\u0627\u062d\u0638\u0627\u062a — \u0627\u0636\u063a\u0637 \u0625\u0636\u0627\u0641\u0629 \u0645\u0644\u0627\u062d\u0638\u0629</div>';
}
function renderContacts(){document.getElementById('cgrid').innerHTML=contacts.map(c=>`<div class="cc"><div class="cc-hdr"><div class="av" style="background:${c.color}20;color:${c.color};font-size:11px">${c.ini||gi(c.name)}</div><div><div style="font-size:13px;font-weight:500">${c.name}</div><div style="font-size:10px;color:var(--mu)">${c.role||''}</div></div></div><div class="cf"><i class="ti ti-phone"></i><span>+${c.phone}</span></div><div class="cacts"><button class="bsm" onclick="waSend(${c.id})"><i class="ti ti-brand-whatsapp" style="color:var(--wa)"></i>\u0625\u0631\u0633\u0627\u0644</button><button class="bsm" onclick="editC(${c.id})"><i class="ti ti-edit"></i>\u062a\u0639\u062f\u064a\u0644</button><button class="bsm" onclick="delC(${c.id})" style="color:var(--er)"><i class="ti ti-trash"></i>\u062d\u0630\u0641</button></div></div>`).join('')||'<div class="empty"><i class="ti ti-users"></i>\u0644\u0627 \u062a\u0648\u062c\u062f \u062c\u0647\u0627\u062a \u0627\u062a\u0635\u0627\u0644</div>';}
function renderCMini(){document.getElementById('cmini').innerHTML=contacts.slice(0,3).map(c=>`<div class="c-chip" onclick="waSend(${c.id})"><div class="av" style="background:${c.color}20;color:${c.color}">${c.ini||gi(c.name)}</div><div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:500;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.name}</div><div style="font-size:10px;color:var(--mu)">+${c.phone}</div></div><i class="ti ti-brand-whatsapp" style="color:var(--wa);font-size:13px"></i></div>`).join('');}

const ptitles={home:'\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645',tasks:'\u0627\u0644\u0645\u0647\u0627\u0645',meetings:'\u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639\u0627\u062a',calendar:'\u0627\u0644\u0645\u0648\u0627\u0639\u064a\u062f',sticky:'\u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0627\u062a',wa:'\u0627\u0633\u062a\u064a\u0631\u0627\u062f \u0648\u0627\u062a\u0633\u0627\u0628',contacts:'\u062c\u0647\u0627\u062a \u0627\u0644\u062a\u0630\u0643\u064a\u0631',sync:'\u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629',reports:'\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631'};
function sp(name,el,mob=0){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel-'+name).classList.add('active');
  if(!mob){document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));if(el)el.classList.add('active');}
  else{document.querySelectorAll('.mni').forEach(n=>n.classList.remove('active'));if(el)el.classList.add('active');}
  document.getElementById('ptitle').textContent=ptitles[name]||name;
  if(mob)document.getElementById('sb').classList.remove('open');
  renderAll();}
function toggleSB(){document.getElementById('sb').classList.toggle('open');}
function tgl(id){const t=tasks.find(t=>t.id===id);if(!t)return;t.status=t.status==='done'?'pending':'done';save();renderAll();}
function tglNote(id){const n=notes.find(n=>n.id===id);if(!n)return;n.status=n.status==='done'?'pending':'done';save();renderNotes();toast(n.status==='done'?'\u062a\u0645 \u0627\u0646\u062c\u0627\u0632 \u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0629':'\u062a\u0645 \u0627\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0629 \u0644\u0644\u0646\u0634\u0637\u0629');}
function tglMeeting(id){const m=meetings.find(m=>m.id===id);if(!m)return;m.status=m.status==='done'?'upcoming':'done';save();renderMeetings();toast(m.status==='done'?'\u062a\u0645 \u0627\u0646\u062c\u0627\u0632 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639':'\u062a\u0645 \u0627\u0639\u0627\u062f\u0629 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639 \u0644\u0644\u0646\u0634\u0637\u0629');}
function delT(id){if(!confirm('\u0647\u0644 \u062a\u0631\u064a\u062f \u062d\u0630\u0641 \u0647\u0630\u0647 \u0627\u0644\u0645\u0647\u0645\u0629\u061f'))return;tasks=tasks.filter(t=>t.id!==id);save();renderAll();}
function delNote(id){notes=notes.filter(n=>n.id!==id);save();renderAll();}
function delC(id){if(!confirm('\u062d\u0630\u0641 \u062c\u0647\u0629 \u0627\u0644\u0627\u062a\u0635\u0627\u0644\u061f'))return;contacts=contacts.filter(c=>c.id!==id);save();renderAll();}

function twA(id){
  const t=tasks.find(t=>t.id===id);if(!t)return;
  if(!contacts.length){toast('\u0623\u0636\u0641 \u062c\u0647\u0629 \u0627\u062a\u0635\u0627\u0644 \u0623\u0648\u0644\u0627\u064b');return;}
  const tp=t.type==='meeting'?'\u0627\u062c\u062a\u0645\u0627\u0639':t.type==='task'?'\u0645\u0647\u0645\u0629':'\u0645\u0644\u0627\u062d\u0638\u0629';
  let msg=`* \u062a\u0630\u0643\u064a\u0631: ${t.title} *\n- \u0627\u0644\u0646\u0648\u0639: ${tp}\n- \u0627\u0644\u062a\u0627\u0631\u064a\u062e: ${fd(t.date)}${t.time?' - \u0627\u0644\u0633\u0627\u0639\u0629 '+t.time:''}`;
  if(t.body)msg+=`\n\n- \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644:\n${t.body}`;
  msg+='\n\n-- \u0645\u0630\u0643\u0631';
  showContactPicker(msg);}

function sendViaWA(){
  if(!curN)return;const t=tasks.find(t=>t.id===curN);if(!t)return;
  if(!contacts.length){toast('\u0623\u0636\u0641 \u062c\u0647\u0629 \u0627\u062a\u0635\u0627\u0644 \u0623\u0648\u0644\u0627\u064b');closeN(null);return;}
  stopAlarm();document.getElementById('nover').style.display='none';
  const tp=t.type==='meeting'?'\u0627\u062c\u062a\u0645\u0627\u0639':t.type==='task'?'\u0645\u0647\u0645\u0629':'\u0645\u0644\u0627\u062d\u0638\u0629';
  let msg=`* \u062a\u0630\u0643\u064a\u0631: ${t.title} *\n- \u0627\u0644\u0646\u0648\u0639: ${tp}\n- \u0627\u0644\u062a\u0627\u0631\u064a\u062e: ${fd(t.date)}${t.time?' - \u0627\u0644\u0633\u0627\u0639\u0629 '+t.time:''}`;
  if(t.body)msg+=`\n\n- \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644:\n${t.body}`;
  msg+='\n\n-- \u0645\u0630\u0643\u0631';
  showContactPicker(msg,true);}

function waSend(cid){
  const c=contacts.find(c=>c.id===cid);if(!c)return;
  const urg=tasks.filter(t=>t.status==='pending'&&t.date===tstr());
  const msg=urg.length?'\u062a\u0630\u0643\u064a\u0631 \u0628\u0627\u0644\u0645\u0648\u0627\u0639\u064a\u062f:\n'+urg.map(t=>'- '+t.title+(t.time?' '+t.time:'')).join('\n'):'\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0648\u0627\u0639\u064a\u062f \u0639\u0627\u062c\u0644\u0629 \u0627\u0644\u064a\u0648\u0645.';
  window.open(`https://wa.me/${c.phone}?text=${encodeURIComponent(msg)}`,'_blank');}

function showContactPicker(msg,fromNotif=false){
  _pickerMsg=msg;_pickerFromNotif=fromNotif;_selectedContacts=new Set();renderPicker();}

function renderPicker(){
  const list=contacts.map(c=>{const sel=_selectedContacts.has(c.id);
    return`<div onclick="togglePick(${c.id})" style="display:flex;align-items:center;gap:12px;padding:11px 13px;border:2px solid ${sel?'var(--wa)':'var(--bd)'};border-radius:var(--r);cursor:pointer;background:${sel?'var(--wa-l)':'var(--card)'};transition:all .15s">
      <div class="av" style="background:${c.color}20;color:${c.color};font-size:13px;width:38px;height:38px">${c.ini||gi(c.name)}</div>
      <div style="flex:1"><div style="font-size:13px;font-weight:500">${c.name}</div><div style="font-size:11px;color:var(--mu)">${c.role||''} — +${c.phone}</div></div>
      <div style="width:22px;height:22px;border-radius:50%;border:2px solid ${sel?'var(--wa)':'var(--bd)'};background:${sel?'var(--wa)':'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0">${sel?'<i class="ti ti-check" style="font-size:12px;color:#fff"></i>':''}</div>
    </div>`;}).join('');
  const cnt=_selectedContacts.size;
  M(`<div class="mback" onclick="if(event.target===this)closeM()"><div class="modal">
    <div class="modal-t"><i class="ti ti-brand-whatsapp" style="color:var(--wa)"></i>\u0627\u062e\u062a\u0631 \u0645\u0646 \u062a\u0631\u064a\u062f \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062a\u0630\u0643\u064a\u0631 \u0644\u0647</div>
    <div style="font-size:11px;color:var(--mu);margin-bottom:10px">\u064a\u0645\u0643\u0646\u0643 \u0627\u062e\u062a\u064a\u0627\u0631 \u0623\u0643\u062b\u0631 \u0645\u0646 \u0634\u062e\u0635</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">${list}</div>
    <button style="background:var(--wa);color:#fff;border:none;border-radius:var(--rs);padding:10px;font-size:13px;cursor:pointer;width:100%;font-family:var(--fn);font-weight:500;display:flex;align-items:center;justify-content:center;gap:7px" onclick="sendToSelected()">
      <i class="ti ti-brand-whatsapp"></i>\u0625\u0631\u0633\u0627\u0644 ${cnt>0?'\u0625\u0644\u0649 '+cnt+' \u0634\u062e\u0635':'— \u0627\u062e\u062a\u0631 \u0634\u062e\u0635\u0627\u064b \u0623\u0648\u0644\u0627\u064b'}
    </button>
    <button class="bs2" onclick="closeM()" style="margin-top:6px">\u0625\u0644\u063a\u0627\u0621</button>
  </div></div>`);}

function togglePick(id){if(_selectedContacts.has(id))_selectedContacts.delete(id);else _selectedContacts.add(id);renderPicker();}
function sendToSelected(){
  if(!_selectedContacts.size)return;
  const phones=contacts.filter(c=>_selectedContacts.has(c.id));
  closeM();
  phones.forEach((c,i)=>setTimeout(()=>window.open(`https://wa.me/${c.phone}?text=${encodeURIComponent(_pickerMsg)}`,'_blank'),i*600));
  if(_pickerFromNotif)curN=null;
  toast(`\u062a\u0645 \u0641\u062a\u062d \u0648\u0627\u062a\u0633\u0627\u0628 \u0644\u0640 ${phones.length} \u0634\u062e\u0635`);}

function M(h){document.getElementById('mroot').innerHTML=h;}
function closeM(){document.getElementById('mroot').innerHTML='';}

function openAdd(){M(`<div class="mback" onclick="if(event.target===this)closeM()"><div class="modal">
    <div class="modal-t"><i class="ti ti-plus" style="color:var(--pr)"></i>\u0625\u0636\u0627\u0641\u0629 \u0645\u0647\u0645\u0629 \u0623\u0648 \u0645\u0648\u0639\u062f</div>
    <div class="fg"><label class="fl">\u0627\u0644\u0639\u0646\u0648\u0627\u0646</label><input type="text" id="mt" placeholder="\u0627\u0643\u062a\u0628 \u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0647\u0646\u0627..."></div>
    <div class="fr">
      <div class="fg" style="flex:1"><label class="fl">\u0627\u0644\u0646\u0648\u0639</label><select id="mtp"><option value="task">\u0645\u0647\u0645\u0629</option><option value="meeting">\u0627\u062c\u062a\u0645\u0627\u0639</option><option value="note">\u0645\u0644\u0627\u062d\u0638\u0629</option></select></div>
      <div class="fg" style="flex:1"><label class="fl">\u0627\u0644\u0623\u0648\u0644\u0648\u064a\u0629</label><select id="mpr"><option value="high">\u0639\u0627\u062c\u0644</option><option value="normal">\u0639\u0627\u062f\u064a</option></select></div>
    </div>
    <div class="fg"><label class="fl">\u0627\u0644\u0645\u062d\u062a\u0648\u0649 / \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644</label><textarea id="mbody" placeholder="\u0627\u0643\u062a\u0628 \u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0645\u0647\u0645\u0629 \u0623\u0648 \u0627\u0644\u0645\u0648\u0639\u062f \u0647\u0646\u0627... (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)&#10;\u0633\u064a\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0647\u0630\u0627 \u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u0639\u0646\u062f \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628" style="min-height:80px"></textarea></div>
    <div class="fr">
      <div class="fg" style="flex:1"><label class="fl">\u0627\u0644\u062a\u0627\u0631\u064a\u062e</label><input type="date" id="md" value="${tstr()}"></div>
      <div class="fg" style="flex:1"><label class="fl">\u0627\u0644\u0648\u0642\u062a</label><input type="time" id="mti" value="09:00"></div>
    </div>
    <button class="bp" onclick="saveTask()">\u062d\u0641\u0638</button><button class="bs2" onclick="closeM()">\u0625\u0644\u063a\u0627\u0621</button>
  </div></div>`);}

function editT(id){const t=tasks.find(t=>t.id===id);if(!t)return;
  M(`<div class="mback" onclick="if(event.target===this)closeM()"><div class="modal">
    <div class="modal-t"><i class="ti ti-edit" style="color:var(--pr)"></i>\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0645\u0647\u0645\u0629</div>
    <div class="fg"><label class="fl">\u0627\u0644\u0639\u0646\u0648\u0627\u0646</label><input type="text" id="mt" value="${t.title.replace(/"/g,'&quot;')}"></div>
    <div class="fr">
      <div class="fg" style="flex:1"><label class="fl">\u0627\u0644\u0646\u0648\u0639</label><select id="mtp"><option value="task"${t.type==='task'?' selected':''}>\u0645\u0647\u0645\u0629</option><option value="meeting"${t.type==='meeting'?' selected':''}>\u0627\u062c\u062a\u0645\u0627\u0639</option><option value="note"${t.type==='note'?' selected':''}>\u0645\u0644\u0627\u062d\u0638\u0629</option></select></div>
      <div class="fg" style="flex:1"><label class="fl">\u0627\u0644\u062d\u0627\u0644\u0629</label><select id="mst"><option value="pending"${t.status==='pending'?' selected':''}>\u0642\u064a\u062f \u0627\u0644\u062a\u0646\u0641\u064a\u0630</option><option value="done"${t.status==='done'?' selected':''}>\u0645\u0643\u062a\u0645\u0644</option><option value="delayed"${t.status==='delayed'?' selected':''}>\u0645\u0624\u062c\u0644</option></select></div>
    </div>
    <div class="fg"><label class="fl">\u0627\u0644\u0645\u062d\u062a\u0648\u0649 / \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644</label><textarea id="mbody" style="min-height:80px" placeholder="\u062a\u0641\u0627\u0635\u064a\u0644 \u0625\u0636\u0627\u0641\u064a\u0629...">${t.body||''}</textarea></div>
    <div class="fr">
      <div class="fg" style="flex:1"><label class="fl">\u0627\u0644\u062a\u0627\u0631\u064a\u062e</label><input type="date" id="md" value="${t.date}"></div>
      <div class="fg" style="flex:1"><label class="fl">\u0627\u0644\u0648\u0642\u062a</label><input type="time" id="mti" value="${t.time||'09:00'}"></div>
    </div>
    <button class="bp" onclick="updTask(${id})">\u062d\u0641\u0638 \u0627\u0644\u062a\u0639\u062f\u064a\u0644\u0627\u062a</button><button class="bs2" onclick="closeM()">\u0625\u0644\u063a\u0627\u0621</button>
  </div></div>`);}

function saveTask(){
  const tt=document.getElementById('mt').value.trim();if(!tt){alert('\u064a\u0631\u062c\u0649 \u0643\u062a\u0627\u0628\u0629 \u0627\u0644\u0639\u0646\u0648\u0627\u0646');return;}
  tasks.push({id:nid++,title:tt,type:document.getElementById('mtp').value,date:document.getElementById('md').value,time:document.getElementById('mti').value,status:'pending',src:'manual',prio:document.getElementById('mpr').value,body:document.getElementById('mbody').value.trim()});
  save();closeM();renderAll();toast('\u062a\u0645 \u0627\u0644\u062d\u0641\u0638');}

function updTask(id){const t=tasks.find(t=>t.id===id);if(!t)return;
  t.title=document.getElementById('mt').value.trim();t.type=document.getElementById('mtp').value;
  t.status=document.getElementById('mst').value;t.date=document.getElementById('md').value;
  t.time=document.getElementById('mti').value;t.body=document.getElementById('mbody').value.trim();
  save();closeM();renderAll();toast('\u062a\u0645 \u0627\u0644\u062a\u062d\u062f\u064a\u062b');}

function openAddSticky(editId=null){
  const n=editId?notes.find(n=>n.id===editId):null;
  M(`<div class="mback" onclick="if(event.target===this)closeM()"><div class="modal">
    <div class="modal-t"><i class="ti ti-note" style="color:var(--wn)"></i>${n?'\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0629':'\u0625\u0636\u0627\u0641\u0629 \u0645\u0644\u0627\u062d\u0638\u0629'}</div>
    <div class="fg"><label class="fl">\u0627\u0644\u0639\u0646\u0648\u0627\u0646</label><input type="text" id="nt" value="${n?n.title.replace(/"/g,'&quot;'):''}" placeholder="\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0629..."></div>
    <div class="fg"><label class="fl">\u0627\u0644\u0646\u0635 / \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644</label><textarea id="nb" placeholder="\u0627\u0643\u062a\u0628 \u0645\u0644\u0627\u062d\u0638\u062a\u0643 \u0647\u0646\u0627..." style="min-height:90px">${n?n.text:''}</textarea></div>
    <div class="fr">
      <div class="fg" style="flex:1"><label class="fl">\u0627\u0644\u0623\u0648\u0644\u0648\u064a\u0629</label>
        <select id="nprio">
          <option value="high"${n&&n.prio==='high'?' selected':''}>\u0639\u0627\u0644\u064a\u0629 \u0627\u0644\u0627\u0647\u0645\u064a\u0629</option>
          <option value="medium"${n&&n.prio==='medium'?' selected':''}>\u0645\u062a\u0648\u0633\u0637 \u0627\u0644\u0627\u0647\u0645\u064a\u0629</option>
          <option value="normal"${(!n||!n.prio||n.prio==='normal')?' selected':''}>\u0639\u0627\u062f\u064a</option>
        </select>
      </div>
    </div>
    <div class="fr">
      <div class="fg" style="flex:1"><label class="fl">\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062a\u0630\u0643\u064a\u0631 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)</label><input type="date" id="nd" value="${n&&n.date2?n.date2:''}"></div>
      <div class="fg" style="flex:1"><label class="fl">\u0627\u0644\u0648\u0642\u062a</label><input type="time" id="nti" value="${n&&n.time?n.time:'09:00'}"></div>
    </div>
    <div class="fg"><label class="fl">\u0627\u0644\u0644\u0648\u0646</label>
      <div style="display:flex;gap:8px;margin-top:4px">
        ${[['sy','#FAEEDA','#FAC775'],['sp','#EEEDFE','#CECBF6'],['sg','#EAF3DE','#C0DD97'],['sb2','#E6F1FB','#B5D4F4'],['sc','#FAECE7','#F5C4B3']].map(([val,bg,bd])=>`
          <div onclick="selectColor('${val}')" id="colopt-${val}" style="width:32px;height:32px;border-radius:8px;background:${bg};border:2px solid ${n&&n.color===val?'#333':bd};cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s">
            ${n&&n.color===val?'<i class="ti ti-check" style="font-size:14px;color:#333"></i>':''}
          </div>`).join('')}
      </div>
      <input type="hidden" id="nc" value="${n?n.color:'sy'}">
    </div>
    <button class="bp" onclick="${n?'saveEditNote('+editId+')':'saveNote()'}">${n?'\u062d\u0641\u0638 \u0627\u0644\u062a\u0639\u062f\u064a\u0644\u0627\u062a':'\u0625\u0636\u0627\u0641\u0629'}</button>
    <button class="bs2" onclick="closeM()">\u0625\u0644\u063a\u0627\u0621</button>
  </div></div>`);
}

function selectColor(val){
  document.getElementById('nc').value=val;
  document.querySelectorAll('[id^="colopt-"]').forEach(el=>{
    const v=el.id.replace('colopt-','');
    const colors={sy:'#FAC775',sp:'#CECBF6',sg:'#C0DD97',sb2:'#B5D4F4',sc:'#F5C4B3'};
    el.style.border=`2px solid ${v===val?'#333':colors[v]}`;
    el.innerHTML=v===val?'<i class="ti ti-check" style="font-size:14px;color:#333"></i>':'';
  });
}

function editNote(id){openAddSticky(id);}

function saveEditNote(id){
  const n=notes.find(n=>n.id===id);if(!n)return;
  const tt=document.getElementById('nt').value.trim(),nb=document.getElementById('nb').value.trim();
  if(!tt||!nb){alert('\u064a\u0631\u062c\u0649 \u062a\u0639\u0628\u0626\u0629 \u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0644');return;}
  n.title=tt;n.text=nb;n.color=document.getElementById('nc').value;
  n.prio=document.getElementById('nprio').value;
  n.date2=document.getElementById('nd').value;
  n.time=document.getElementById('nti').value;
  save();closeM();renderNotes();toast('\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0629');
}

function shareNote(id){
  const n=notes.find(n=>n.id===id);if(!n)return;
  if(!contacts.length){toast('\u0623\u0636\u0641 \u062c\u0647\u0629 \u0627\u062a\u0635\u0627\u0644 \u0623\u0648\u0644\u0627\u064b');return;}
  showContactPicker(`* \u0645\u0644\u0627\u062d\u0638\u0629: ${n.title} *\n\n${n.text}\n\n-- \u0645\u0630\u0643\u0631`);
}

function saveNote(){
  const tt=document.getElementById('nt').value.trim(),nb=document.getElementById('nb').value.trim();
  if(!tt||!nb){alert('\u064a\u0631\u062c\u0649 \u062a\u0639\u0628\u0626\u0629 \u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0644');return;}
  const d=new Date();
  notes.push({id:nid++,title:tt,text:nb,color:document.getElementById('nc').value,
    date:`${d.getDate()} ${MN[d.getMonth()]}`,
    prio:document.getElementById('nprio').value,
    date2:document.getElementById('nd').value,
    time:document.getElementById('nti').value});
  save();closeM();renderAll();toast('\u062a\u0645\u062a \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0629');
}

function openAddContact(eid=null){const c=eid?contacts.find(c=>c.id===eid):null;
  M(`<div class="mback" onclick="if(event.target===this)closeM()"><div class="modal">
    <div class="modal-t"><i class="ti ti-user-plus" style="color:var(--pr)"></i>${c?'\u062a\u0639\u062f\u064a\u0644 \u062c\u0647\u0629 \u0627\u0644\u0627\u062a\u0635\u0627\u0644':'\u0625\u0636\u0627\u0641\u0629 \u062c\u0647\u0629 \u0627\u062a\u0635\u0627\u0644'}</div>
    <div class="fg"><label class="fl">\u0627\u0644\u0627\u0633\u0645</label><input type="text" id="cname" value="${c?c.name:''}" placeholder="\u0627\u0633\u0645 \u0627\u0644\u0634\u062e\u0635..."></div>
    <div class="fg"><label class="fl">\u0627\u0644\u0635\u0641\u0629 / \u0627\u0644\u062f\u0648\u0631</label><input type="text" id="crole" value="${c?c.role:''}" placeholder="\u0645\u062b\u0627\u0644: \u0627\u0644\u0645\u062f\u064a\u0631 \u0627\u0644\u0639\u0627\u0645"></div>
    <div class="fg"><label class="fl">\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644 (\u0645\u0639 \u0631\u0645\u0632 \u0627\u0644\u062f\u0648\u0644\u0629 \u0628\u062f\u0648\u0646 +)</label><input type="tel" id="cphone" value="${c?c.phone:''}" placeholder="966501234567" dir="ltr"></div>
    <button class="bp" onclick="${c?'updC('+eid+')':'saveC()'}">${c?'\u062d\u0641\u0638 \u0627\u0644\u062a\u0639\u062f\u064a\u0644\u0627\u062a':'\u0625\u0636\u0627\u0641\u0629'}</button>
    <button class="bs2" onclick="closeM()">\u0625\u0644\u063a\u0627\u0621</button>
  </div></div>`);}

function editC(id){openAddContact(id);}
function saveC(){const n=document.getElementById('cname').value.trim(),p=document.getElementById('cphone').value.trim().replace(/\D/g,'');
  if(!n||!p){alert('\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0627\u0644\u0627\u0633\u0645 \u0648\u0627\u0644\u0631\u0642\u0645');return;}
  contacts.push({id:nid++,name:n,role:document.getElementById('crole').value.trim(),phone:p,color:AVC[contacts.length%AVC.length],ini:gi(n)});
  save();closeM();renderAll();toast('\u062a\u0645\u062a \u0627\u0644\u0625\u0636\u0627\u0641\u0629');}
function updC(id){const c=contacts.find(c=>c.id===id);if(!c)return;
  c.name=document.getElementById('cname').value.trim();c.role=document.getElementById('crole').value.trim();
  c.phone=document.getElementById('cphone').value.trim().replace(/\D/g,'');c.ini=gi(c.name);
  save();closeM();renderAll();toast('\u062a\u0645 \u0627\u0644\u062a\u062d\u062f\u064a\u062b');}

function parseWA(){const txt=document.getElementById('wainput').value.trim();if(!txt){alert('\u064a\u0631\u062c\u0649 \u0644\u0635\u0642 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0623\u0648\u0644\u0627\u064b');return;}
  let date=tstr(),time='',title=txt.length>80?txt.substring(0,80)+'...':txt;
  const dm=txt.match(/(\d{1,2})\s*(\u064a\u0646\u0627\u064a\u0631|\u0641\u0628\u0631\u0627\u064a\u0631|\u0645\u0627\u0631\u0633|\u0623\u0628\u0631\u064a\u0644|\u0645\u0627\u064a\u0648|\u064a\u0648\u0646\u064a\u0648|\u064a\u0648\u0644\u064a\u0648|\u0623\u063a\u0633\u0637\u0633|\u0633\u0628\u062a\u0645\u0628\u0631|\u0623\u0643\u062a\u0648\u0628\u0631|\u0646\u0648\u0641\u0645\u0628\u0631|\u062f\u064a\u0633\u0645\u0628\u0631)/i);
  if(dm){const m=MMP[dm[2]];if(m)date=`${new Date().getFullYear()}-${m}-${String(dm[1]).padStart(2,'0')}`;}
  const tm=txt.match(/(\d{1,2})(?::(\d{2}))?\s*(\u0635\u0628\u0627\u062d\u0627\u064b|\u0645\u0633\u0627\u0621\u064b|\u0638\u0647\u0631\u0627\u064b|\u0635\u0628\u0627\u062d|\u0645\u0633\u0627\u0621|\u0638\u0647\u0631|\u0635|\u0645)/i);
  if(tm){let h=parseInt(tm[1]);const mn=tm[2]||'00';const pm=tm[3]&&/[\u0645\u0638]/.test(tm[3]);if(pm&&h<12)h+=12;if(!pm&&h===12)h=0;time=`${String(h).padStart(2,'0')}:${mn}`;}
  tasks.push({id:nid++,title,type:'meeting',date,time,status:'pending',src:'wa',prio:'high'});
  save();const r=document.getElementById('wares');r.style.display='block';
  r.innerHTML=`<i class="ti ti-check" style="color:var(--ok)"></i> \u062a\u0645 \u0627\u0644\u0627\u0633\u062a\u062e\u0631\u0627\u062c — ${title}<br>\u0627\u0644\u062a\u0627\u0631\u064a\u062e: ${fd(date)}${time?' \u0627\u0644\u0633\u0627\u0639\u0629 '+time:''}`;
  document.getElementById('wainput').value='';renderAll();toast('\u062a\u0645 \u0627\u0633\u062a\u064a\u0631\u0627\u062f \u0627\u0644\u0645\u0648\u0639\u062f');}

function updateSoundBtn(){
  document.getElementById('sndicon').className=soundOn?'ti ti-volume':'ti ti-volume-off';
  document.getElementById('sndlbl').textContent=soundOn?'\u0635\u0648\u062a':'\u0635\u0627\u0645\u062a';
}
function toggleSound(){soundOn=!soundOn;ss('mz4_snd',soundOn);updateSoundBtn();toast(soundOn?'\u0627\u0644\u0635\u0648\u062a \u0645\u0641\u0639\u0651\u0644':'\u062a\u0645 \u062a\u0635\u0645\u064a\u062a \u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a');}
function toggleSoundFromBell(){
  soundOn=!soundOn;ss('mz4_snd',soundOn);updateSoundBtn();
  const ic=document.getElementById('nbellicon'),mu=document.getElementById('nbellmuted');
  if(soundOn){ic.className='ti ti-bell-ringing nbell';ic.style.color='';mu.style.display='none';stopAlarm();startAlarm();}
  else{ic.className='ti ti-bell-off nbell';ic.style.color='var(--mu)';mu.style.display='block';stopAlarm();}
}
function unlockAudio(){
  if(audioUnlocked)return;
  try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended')audioCtx.resume();
    const b=audioCtx.createBuffer(1,1,22050),s=audioCtx.createBufferSource();
    s.buffer=b;s.connect(audioCtx.destination);s.start(0);audioUnlocked=true;}catch(e){}
}
function playAlarm(){
  if(!soundOn)return;
  try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    const play=()=>{try{[880,660,880,660,880].forEach((f,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.frequency.value=f;o.type='sine';const t=audioCtx.currentTime+i*.28;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.5,t+.06);g.gain.linearRampToValueAtTime(0,t+.24);o.start(t);o.stop(t+.28);});}catch(e){}};
    if(audioCtx.state==='suspended')audioCtx.resume().then(play);else play();}catch(e){}
  try{if(navigator.vibrate)navigator.vibrate([500,200,500,200,500]);}catch(e){}
}
function startAlarm(){stopAlarm();playAlarm();alarmInt=setInterval(()=>{if(document.getElementById('nover').style.display==='flex')playAlarm();else stopAlarm();},3500);}
function stopAlarm(){if(alarmInt){clearInterval(alarmInt);alarmInt=null;}}

function fireNotif(id){
  const t=tasks.find(t=>t.id===id);if(!t||t.status==='done')return;
  curN=id;
  document.getElementById('ntitle').textContent='\u062a\u0630\u0643\u064a\u0631: '+t.title;
  document.getElementById('nbody').textContent=`${fd(t.date)}${t.time?' — \u0627\u0644\u0633\u0627\u0639\u0629 '+t.time:''}\n\n\u0647\u0630\u0627 \u0627\u0644\u062a\u0630\u0643\u064a\u0631 \u064a\u0628\u0642\u0649 \u0646\u0634\u0637\u0627\u064b \u062d\u062a\u0649 \u062a\u063a\u0644\u0642\u0647 \u064a\u062f\u0648\u064a\u0627\u064b.`;
  const ic=document.getElementById('nbellicon'),mu=document.getElementById('nbellmuted');
  ic.className='ti ti-bell-ringing nbell';ic.style.color='';mu.style.display='none';
  document.getElementById('nover').style.display='flex';
  startAlarm();
}
function closeN(act){
  stopAlarm();
  if(act==='done'&&curN&&!String(curN).startsWith('note_'))tgl(curN);
  document.getElementById('nover').style.display='none';curN=null;
}
function showDelay(){
  stopAlarm();document.getElementById('nover').style.display='none';
  const tm=new Date();tm.setDate(tm.getDate()+1);
  document.getElementById('ddate').value=tm.toISOString().split('T')[0];
  document.getElementById('dtime').value='09:00';
  document.getElementById('delay-over').style.display='flex';
}
function cancelDelay(){document.getElementById('delay-over').style.display='none';document.getElementById('nover').style.display='flex';}
function quickDelay(mins,label){
  if(!curN)return;const t=tasks.find(t=>t.id===curN);if(!t)return;
  const dt=new Date(Date.now()+mins*60000);
  const ds=dt.toISOString().split('T')[0];
  const ts2=`${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
  t.status='delayed';t.date=ds;t.time=ts2;t.delayDate=ds;t.delayTime=ts2;
  save();renderAll();document.getElementById('delay-over').style.display='none';
  toast(`\u062a\u0645 \u0627\u0644\u062a\u0623\u062c\u064a\u0644 ${label} — ${fd(ds)} ${ts2}`);}
function confirmDelay(){
  if(!curN)return;const t=tasks.find(t=>t.id===curN);if(!t)return;
  const ds=document.getElementById('ddate').value,ts2=document.getElementById('dtime').value;
  if(!ds){alert('\u064a\u0631\u062c\u0649 \u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u062a\u0627\u0631\u064a\u062e');return;}
  t.status='delayed';t.date=ds;t.time=ts2;t.delayDate=ds;t.delayTime=ts2;
  save();renderAll();document.getElementById('delay-over').style.display='none';
  toast(`\u062a\u0645 \u0627\u0644\u062a\u0623\u062c\u064a\u0644 \u0625\u0644\u0649 ${fd(ds)} ${ts2}`);}

function chkAlarms(){
  const ts=tstr(),now=new Date(),hh=String(now.getHours()).padStart(2,'0'),mm=String(now.getMinutes()).padStart(2,'0'),cur=hh+':'+mm;
  tasks.forEach(t=>{const cd=t.delayDate||t.date,ct=t.delayTime||t.time;
    if(t.status!=='done'&&cd===ts&&ct===cur&&!_fired['t'+t.id]){_fired['t'+t.id]=1;fireNotif(t.id);}});
  notes.forEach(n=>{
    if(n.date2===ts&&n.time===cur&&!_fired['n'+n.id]){
      _fired['n'+n.id]=1;fireNoteNotif(n.id);}});
}

function fireNoteNotif(id){
  const n=notes.find(n=>n.id===id);if(!n)return;
  curN='note_'+id;
  document.getElementById('ntitle').textContent='\u0645\u0644\u0627\u062d\u0638\u0629: '+n.title;
  document.getElementById('nbody').textContent=`${n.text}\n\n\u0647\u0630\u0627 \u0627\u0644\u062a\u0630\u0643\u064a\u0631 \u064a\u0628\u0642\u0649 \u0646\u0634\u0637\u0627\u064b \u062d\u062a\u0649 \u062a\u063a\u0644\u0642\u0647 \u064a\u062f\u0648\u064a\u0627\u064b.`;
  document.getElementById('nbellicon').className='ti ti-bell-ringing nbell';
  document.getElementById('nbellmuted').style.display='none';
  document.getElementById('nover').style.display='flex';
  startAlarm();
}

// ─── MEETINGS ─────────────────────────────────────────────────────────────
let curMeetingFilter='all';

const mtypeLabels={internal:'\u062f\u0627\u062e\u0644\u064a',external:'\u062e\u0627\u0631\u062c\u064a',board:'\u0645\u062c\u0644\u0633 \u0625\u062f\u0627\u0631\u0629',client:'\u0639\u0645\u064a\u0644',review:'\u0645\u0631\u0627\u062c\u0639\u0629',other:'\u0623\u062e\u0631\u0649'};
const mstatusLabels={upcoming:'\u0642\u0627\u062f\u0645',inprogress:'\u062c\u0627\u0631\u064a',done:'\u0645\u0646\u062a\u0647\u064a',cancelled:'\u0645\u0644\u063a\u064a'};

function mcCard(m){
  const sl=mstatusLabels[m.status]||'\u0642\u0627\u062f\u0645';
  const sc='mc-'+(m.status||'upcoming');
  const tl=mtypeLabels[m.mtype]||'\u0627\u062c\u062a\u0645\u0627\u0639';
  const icons={internal:'🏢',external:'🤝',board:'👔',client:'💼',review:'📋',other:'📌'};
  const ic=icons[m.mtype]||'📅';
  const attendees=m.attendees?m.attendees.split('\u060c').map(a=>a.trim()).filter(Boolean):[];
  const isDone=m.status==='done';
  return`<div class="mc" id="mc${m.id}" style="${isDone?'opacity:0.65':''}">
    <div class="mc-header">
      <div class="mc-icon" style="background:${isDone?'var(--ok-l)':'var(--in-l)'}">${isDone?'✅':ic}</div>
      <div style="flex:1;min-width:0">
        <div class="mc-title" style="${isDone?'text-decoration:line-through;color:var(--mu)':''}">${m.title}</div>
        <div class="mc-meta">
          <span class="mc-badge ${sc}">${sl}</span>
          <span class="mc-badge" style="background:var(--bg);color:var(--mu)">${tl}</span>
          ${m.date?`<span style="font-size:11px;color:var(--mu)"><i class="ti ti-calendar" style="font-size:11px"></i> ${fd(m.date)}${m.time?' - '+m.time:''}</span>`:''}
          ${m.duration?`<span style="font-size:11px;color:var(--mu)"><i class="ti ti-clock" style="font-size:11px"></i> ${m.duration} \u062f</span>`:''}
        </div>
      </div>
      <div onclick="tglMeeting(${m.id})" style="width:22px;height:22px;border-radius:50%;border:2px solid ${isDone?'var(--ok)':'var(--bd)'};background:${isDone?'var(--ok)':'transparent'};display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .2s">
        ${isDone?'<i class="ti ti-check" style="font-size:12px;color:#fff"></i>':''}
      </div>
    </div>
    <div class="mc-body">
      ${m.location?`<div class="mc-row"><i class="ti ti-map-pin"></i><div><span style="color:var(--mu);font-size:11px">\u0627\u0644\u0645\u0643\u0627\u0646: </span><span class="mc-row-val">${m.location}</span></div></div>`:''}
      ${m.organizer?`<div class="mc-row"><i class="ti ti-user-check"></i><div><span style="color:var(--mu);font-size:11px">\u0627\u0644\u0645\u0646\u0638\u0645: </span><span class="mc-row-val">${m.organizer}</span></div></div>`:''}
      ${attendees.length?`<div class="mc-row"><i class="ti ti-users"></i><div><span style="color:var(--mu);font-size:11px">\u0627\u0644\u062d\u0636\u0648\u0631: </span><span class="mc-row-val">${attendees.map(a=>`<span style="display:inline-block;background:var(--pr-l);color:var(--pr-d);border-radius:var(--rf);padding:1px 7px;font-size:10px;margin:1px">${a}</span>`).join('')}</span></div></div>`:''}
      ${m.agenda?`<div class="mc-row"><i class="ti ti-list"></i><div><span style="color:var(--mu);font-size:11px">\u062c\u062f\u0648\u0644 \u0627\u0644\u0627\u0639\u0645\u0627\u0644: </span><div class="mc-row-val" style="margin-top:3px;padding:8px;background:var(--bg);border-radius:var(--rs);border-right:3px solid var(--in)">${m.agenda.replace(/\n/g,'<br>')}</div></div></div>`:''}
      ${m.notes?`<div class="mc-row"><i class="ti ti-notes"></i><div><span style="color:var(--mu);font-size:11px">\u0645\u0644\u0627\u062d\u0638\u0627\u062a / \u0645\u062d\u0636\u0631: </span><div class="mc-row-val" style="margin-top:3px;padding:8px;background:var(--bg);border-radius:var(--rs)">${m.notes.replace(/\n/g,'<br>')}</div></div></div>`:''}
      ${m.decisions?`<div class="mc-row"><i class="ti ti-circle-check" style="color:var(--ok)"></i><div><span style="color:var(--mu);font-size:11px">\u0627\u0644\u0642\u0631\u0627\u0631\u0627\u062a: </span><div class="mc-row-val" style="margin-top:3px;padding:8px;background:var(--ok-l);border-radius:var(--rs);border-right:3px solid var(--ok)">${m.decisions.replace(/\n/g,'<br>')}</div></div></div>`:''}
      ${m.nextActions?`<div class="mc-row"><i class="ti ti-arrow-right" style="color:var(--pr)"></i><div><span style="color:var(--mu);font-size:11px">\u0627\u0644\u0627\u062c\u0631\u0627\u0621\u0627\u062a \u0627\u0644\u062a\u0627\u0644\u064a\u0629: </span><div class="mc-row-val" style="margin-top:3px;padding:8px;background:var(--pr-l);border-radius:var(--rs)">${m.nextActions.replace(/\n/g,'<br>')}</div></div></div>`:''}
    </div>
    <div class="mc-actions">
      ${!isDone?`<button class="mc-btn done-btn" onclick="tglMeeting(${m.id})"><i class="ti ti-check"></i>\u062a\u0645 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639</button>`:`<button class="mc-btn" onclick="tglMeeting(${m.id})"><i class="ti ti-refresh"></i>\u0627\u0639\u0627\u062f\u0629 \u062a\u0641\u0639\u064a\u0644</button>`}
      ${!isDone&&m.status!=='cancelled'?`<button class="mc-btn cancel-btn" onclick="setMeetingStatus(${m.id},'cancelled')"><i class="ti ti-x"></i>\u0627\u0644\u063a\u0627\u0621</button>`:''}
      <button class="mc-btn" onclick="openAttachmentsModal('meeting',${m.id},'${m.title.replace(/'/g,"\\'")}')" style="position:relative">
        <i class="ti ti-paperclip"></i>\u0627\u0644\u0645\u0631\u0641\u0642\u0627\u062a
        ${getAttCount('meeting',m.id)?`<span style="background:var(--in);color:#fff;border-radius:var(--rf);font-size:9px;padding:0 5px;margin-right:2px">${getAttCount('meeting',m.id)}</span>`:''}
      </button>
      <button class="mc-btn wa" onclick="shareMeetingWA(${m.id})"><i class="ti ti-brand-whatsapp"></i>\u0627\u0631\u0633\u0627\u0644</button>
      <button class="mc-btn" onclick="openEditMeeting(${m.id})"><i class="ti ti-edit"></i>\u062a\u0639\u062f\u064a\u0644</button>
      <button class="mc-btn" onclick="delMeeting(${m.id})" style="color:var(--er)"><i class="ti ti-trash"></i>\u062d\u0630\u0641</button>
    </div>
  </div>`;}

function renderMeetings(){
  let list=meetings;
  if(curMeetingFilter==='upcoming')list=meetings.filter(m=>m.status==='upcoming'||m.status==='inprogress');
  else if(curMeetingFilter==='done')list=meetings.filter(m=>m.status==='done');
  else if(curMeetingFilter==='cancelled')list=meetings.filter(m=>m.status==='cancelled');
  list=[...list].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const el=document.getElementById('meetings-list');
  if(el)el.innerHTML=list.length?list.map(mcCard).join(''):'<div class="empty"><i class="ti ti-users-group"></i>\u0644\u0627 \u062a\u0648\u062c\u062f \u0627\u062c\u062a\u0645\u0627\u0639\u0627\u062a — \u0627\u0636\u063a\u0637 \u0627\u062c\u062a\u0645\u0627\u0639 \u062c\u062f\u064a\u062f</div>';
  const nb=document.getElementById('nbtm');
  if(nb){const uc=meetings.filter(m=>m.status==='upcoming').length;nb.textContent=uc;nb.style.display=uc?'inline':'none';}
}

function filterMeetings(f){
  curMeetingFilter=f;
  document.querySelectorAll('.mfbtn').forEach(b=>b.classList.remove('mfbtn-active'));
  const el=document.getElementById('mf-'+f);if(el)el.classList.add('mfbtn-active');
  renderMeetings();
}

function openAddMeeting(editId=null){
  const m=editId?meetings.find(m=>m.id===editId):null;
  M(`<div class="mback" onclick="if(event.target===this)closeM()"><div class="modal" style="max-width:420px">
    <div class="modal-t"><i class="ti ti-users-group" style="color:var(--in)"></i>${m?'\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639':'\u0627\u062c\u062a\u0645\u0627\u0639 \u062c\u062f\u064a\u062f'}</div>
    <div class="fg"><label class="fl">\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639 *</label><input type="text" id="m_title" value="${m?m.title.replace(/"/g,'&quot;'):''}" placeholder="\u0645\u062b\u0627\u0644: \u0627\u062c\u062a\u0645\u0627\u0639 \u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0645\u064a\u0632\u0627\u0646\u064a\u0629 \u0627\u0644\u0631\u0628\u0639\u064a\u0629"></div>
    <div class="fr">
      <div class="fg" style="flex:1"><label class="fl">\u0646\u0648\u0639 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639</label><select id="m_type">
        <option value="internal"${m&&m.mtype==='internal'?' selected':''}>\u062f\u0627\u062e\u0644\u064a</option>
        <option value="external"${m&&m.mtype==='external'?' selected':''}>\u062e\u0627\u0631\u062c\u064a</option>
        <option value="board"${m&&m.mtype==='board'?' selected':''}>\u0645\u062c\u0644\u0633 \u0625\u062f\u0627\u0631\u0629</option>
        <option value="client"${m&&m.mtype==='client'?' selected':''}>\u0645\u0639 \u0639\u0645\u064a\u0644</option>
        <option value="review"${m&&m.mtype==='review'?' selected':''}>\u0645\u0631\u0627\u062c\u0639\u0629</option>
        <option value="other"${m&&m.mtype==='other'?' selected':''}>\u0623\u062e\u0631\u0649</option>
      </select></div>
      <div class="fg" style="flex:1"><label class="fl">\u0627\u0644\u062d\u0627\u0644\u0629</label><select id="m_status">
        <option value="upcoming"${(!m||m.status==='upcoming')?' selected':''}>\u0642\u0627\u062f\u0645</option>
        <option value="inprogress"${m&&m.status==='inprogress'?' selected':''}>\u062c\u0627\u0631\u064a</option>
        <option value="done"${m&&m.status==='done'?' selected':''}>\u0645\u0646\u062a\u0647\u064a</option>
        <option value="cancelled"${m&&m.status==='cancelled'?' selected':''}>\u0645\u0644\u063a\u064a</option>
      </select></div>
    </div>
    <div class="fr">
      <div class="fg" style="flex:1"><label class="fl">\u0627\u0644\u062a\u0627\u0631\u064a\u062e</label><input type="date" id="m_date" value="${m?m.date:tstr()}"></div>
      <div class="fg" style="flex:1"><label class="fl">\u0627\u0644\u0648\u0642\u062a</label><input type="time" id="m_time" value="${m?m.time:'09:00'}"></div>
    </div>
    <div class="fr">
      <div class="fg" style="flex:1"><label class="fl">\u0627\u0644\u0645\u0643\u0627\u0646 / \u0627\u0644\u0631\u0627\u0628\u0637</label><input type="text" id="m_location" value="${m?m.location||'':''}" placeholder="\u0642\u0627\u0639\u0629 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639\u0627\u062a / Teams / Zoom"></div>
      <div class="fg" style="flex:1"><label class="fl">\u0627\u0644\u0645\u062f\u0629 (\u0628\u0627\u0644\u062f\u0642\u0627\u0626\u0642)</label><input type="text" id="m_duration" value="${m?m.duration||'':''}" placeholder="60"></div>
    </div>
    <div class="fg"><label class="fl">\u0645\u0646\u0638\u0645 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639 / \u0627\u0644\u0631\u0626\u064a\u0633</label><input type="text" id="m_organizer" value="${m?m.organizer||'':''}" placeholder="\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u0638\u0645"></div>
    <div class="fg"><label class="fl">\u0627\u0644\u062d\u0636\u0648\u0631 (\u0627\u0641\u0635\u0644 \u0628\u0640 \u060c)</label><input type="text" id="m_attendees" value="${m?m.attendees||'':''}" placeholder="\u0623\u062d\u0645\u062f\u060c \u0633\u0627\u0631\u0629\u060c \u0645\u062d\u0645\u062f"></div>
    <div class="fg"><label class="fl">\u062c\u062f\u0648\u0644 \u0627\u0644\u0623\u0639\u0645\u0627\u0644</label><textarea id="m_agenda" style="min-height:70px" placeholder="1. \u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0623\u0631\u0642\u0627\u0645&#10;2. \u0645\u0646\u0627\u0642\u0634\u0629 \u0627\u0644\u062e\u0637\u0629&#10;3. \u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0645\u0647\u0627\u0645">${m?m.agenda||'':''}</textarea></div>
    <div class="fg"><label class="fl">\u0645\u0644\u0627\u062d\u0638\u0627\u062a / \u0645\u062d\u0636\u0631 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639</label><textarea id="m_notes" style="min-height:70px" placeholder="\u0645\u0627 \u062a\u0645 \u0645\u0646\u0627\u0642\u0634\u062a\u0647...">${m?m.notes||'':''}</textarea></div>
    <div class="fg"><label class="fl">\u0627\u0644\u0642\u0631\u0627\u0631\u0627\u062a \u0627\u0644\u0645\u062a\u062e\u0630\u0629</label><textarea id="m_decisions" style="min-height:60px" placeholder="\u0627\u0644\u0642\u0631\u0627\u0631\u0627\u062a \u0627\u0644\u062a\u064a \u062a\u0645 \u0627\u0644\u0627\u062a\u0641\u0627\u0642 \u0639\u0644\u064a\u0647\u0627...">${m?m.decisions||'':''}</textarea></div>
    <div class="fg"><label class="fl">\u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a \u0627\u0644\u062a\u0627\u0644\u064a\u0629</label><textarea id="m_nextActions" style="min-height:60px" placeholder="\u0627\u0644\u0645\u0647\u0627\u0645 \u0648\u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a \u0628\u0639\u062f \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639...">${m?m.nextActions||'':''}</textarea></div>
    <button class="bp" onclick="${m?'saveMeeting('+editId+')':'saveMeeting()'}" style="background:var(--in)">${m?'\u062d\u0641\u0638 \u0627\u0644\u062a\u0639\u062f\u064a\u0644\u0627\u062a':'\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639'}</button>
    <button class="bs2" onclick="closeM()">\u0625\u0644\u063a\u0627\u0621</button>
  </div></div>`);
}

function openEditMeeting(id){openAddMeeting(id);}

function saveMeeting(editId=null){
  const title=document.getElementById('m_title').value.trim();
  if(!title){alert('\u064a\u0631\u062c\u0649 \u0643\u062a\u0627\u0628\u0629 \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639');return;}
  const data={
    title,mtype:document.getElementById('m_type').value,
    status:document.getElementById('m_status').value,
    date:document.getElementById('m_date').value,
    time:document.getElementById('m_time').value,
    location:document.getElementById('m_location').value.trim(),
    duration:document.getElementById('m_duration').value.trim(),
    organizer:document.getElementById('m_organizer').value.trim(),
    attendees:document.getElementById('m_attendees').value.trim(),
    agenda:document.getElementById('m_agenda').value.trim(),
    notes:document.getElementById('m_notes').value.trim(),
    decisions:document.getElementById('m_decisions').value.trim(),
    nextActions:document.getElementById('m_nextActions').value.trim(),
  };
  if(editId){
    const m=meetings.find(m=>m.id===editId);if(!m)return;
    Object.assign(m,data);
  } else {
    meetings.push({id:nid++,...data});
  }
  save();closeM();renderMeetings();toast(editId?'\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639':'\u062a\u0645\u062a \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639');
}

function setMeetingStatus(id,status){
  const m=meetings.find(m=>m.id===id);if(!m)return;
  m.status=status;save();renderMeetings();
}
function delMeeting(id){
  if(!confirm('\u0647\u0644 \u062a\u0631\u064a\u062f \u062d\u0630\u0641 \u0647\u0630\u0627 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639\u061f'))return;
  meetings=meetings.filter(m=>m.id!==id);save();renderMeetings();toast('\u062a\u0645 \u0627\u0644\u062d\u0630\u0641');
}

function shareMeetingWA(id){
  const m=meetings.find(m=>m.id===id);if(!m)return;
  if(!contacts.length){toast('\u0623\u0636\u0641 \u062c\u0647\u0629 \u0627\u062a\u0635\u0627\u0644 \u0623\u0648\u0644\u0627\u064b');return;}
  const tl=mtypeLabels[m.mtype]||'\u0627\u062c\u062a\u0645\u0627\u0639';
  let msg=`* ${m.title} *\n- \u0627\u0644\u0646\u0648\u0639: ${tl}\n- \u0627\u0644\u062a\u0627\u0631\u064a\u062e: ${fd(m.date)}${m.time?' - '+m.time:''}${m.duration?' ('+m.duration+' \u062f\u0642\u064a\u0642\u0629)':''}`;
  if(m.location)msg+=`\n- \u0627\u0644\u0645\u0643\u0627\u0646: ${m.location}`;
  if(m.organizer)msg+=`\n- \u0627\u0644\u0645\u0646\u0638\u0645: ${m.organizer}`;
  if(m.attendees)msg+=`\n- \u0627\u0644\u062d\u0636\u0648\u0631: ${m.attendees}`;
  if(m.agenda)msg+=`\n\n\u062c\u062f\u0648\u0644 \u0627\u0644\u0627\u0639\u0645\u0627\u0644:\n${m.agenda}`;
  if(m.decisions)msg+=`\n\n\u0627\u0644\u0642\u0631\u0627\u0631\u0627\u062a:\n${m.decisions}`;
  if(m.nextActions)msg+=`\n\n\u0627\u0644\u0627\u062c\u0631\u0627\u0621\u0627\u062a \u0627\u0644\u062a\u0627\u0644\u064a\u0629:\n${m.nextActions}`;
  msg+='\n\n-- \u0645\u0630\u0643\u0631';
  showContactPicker(msg);
}

// ─── ATTACHMENTS ──────────────────────────────────────────────────────────

function saveAttachments(){
  ss('mz4_att',attachments);
  if(syncActive)pushAttToFB();
}

function pushAttToFB(){
  if(!syncActive||!fbConfig._url)return;
  const attUrl=fbConfig._url.replace('.json','/attachments.json');
  fetch(attUrl,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(attachments)})
    .catch(()=>{});
}

function pullAttFromFB(){
  if(!syncActive||!fbConfig._url)return;
  const attUrl=fbConfig._url.replace('.json','/attachments.json')+'&t='+Date.now();
  fetch(attUrl).then(r=>r.json()).then(data=>{
    if(data&&typeof data==='object'){
      attachments=data;ss('mz4_att',attachments);
    }
  }).catch(()=>{});
}

_${id}`;}

function getFileIcon(mime){
  if(!mime)return'📎';
  if(mime.startsWith('image/'))return'🖼';
  if(mime.includes('pdf'))return'📄';
  if(mime.includes('word')||mime.includes('document'))return'📝';
  if(mime.includes('sheet')||mime.includes('excel'))return'📊';
  if(mime.includes('presentation')||mime.includes('powerpoint'))return'📑';
  if(mime.includes('video'))return'🎬';
  if(mime.includes('audio'))return'🎵';
  if(mime.includes('zip')||mime.includes('rar'))return'🗜';
  return'📎';
}

function fmtSize(bytes){
  if(bytes<1024)return bytes+'B';
  if(bytes<1048576)return(bytes/1024).toFixed(1)+'KB';
  return(bytes/1048576).toFixed(1)+'MB';
}

function openAttachmentsModal(type,id,title){
  const key=getAttKey(type,id);
  const atts=attachments[key]||[];
  renderAttModal(type,id,title,atts);
}

function renderAttModal(type,id,title,atts){
  const key=getAttKey(type,id);
  const attHTML=atts.length?atts.map(a=>{
    const icon=getFileIcon(a.type);
    const isImg=a.type&&a.type.startsWith('image/');
    return`<div class="att-item" id="att-${a.id}">
      <div class="att-icon" style="background:var(--pr-l)">${icon}</div>
      <div class="att-info">
        <div class="att-name">${a.name}</div>
        <div class="att-size">${fmtSize(a.size)} — ${a.date}</div>
      </div>
      <div class="att-acts">
        ${isImg?`<button class="att-btn" onclick="previewAtt('${a.id}','${key}')" title="\u0639\u0631\u0636"><i class="ti ti-eye"></i></button>`:''}
        <button class="att-btn" onclick="downloadAtt('${a.id}','${key}')" title="\u062a\u062d\u0645\u064a\u0644"><i class="ti ti-download"></i></button>
        <button class="att-btn del" onclick="deleteAtt('${a.id}','${key}')" title="\u062d\u0630\u0641"><i class="ti ti-trash"></i></button>
      </div>
    </div>`;}).join(''):'<div class="empty" style="padding:20px"><i class="ti ti-paperclip"></i>\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0631\u0641\u0642\u0627\u062a \u0628\u0639\u062f</div>';

  M(`<div class="mback" onclick="if(event.target===this)closeM()"><div class="modal" style="max-width:400px">
    <div class="modal-t"><i class="ti ti-paperclip" style="color:var(--pr)"></i>\u0627\u0644\u0645\u0631\u0641\u0642\u0627\u062a — ${title}</div>
    <div id="att-modal-list" class="att-list">${attHTML}</div>
    <div class="att-zone" onclick="document.getElementById('att-file-input').click()">
      <i class="ti ti-cloud-upload"></i>
      <span>\u0627\u0636\u063a\u0637 \u0644\u0631\u0641\u0639 \u0645\u0644\u0641 \u0645\u0631\u0641\u0642</span>
      <span style="font-size:10px;color:var(--hi);margin-top:2px">\u0635\u0648\u0631\u060c PDF\u060c Word\u060c Excel\u060c \u0648\u063a\u064a\u0631\u0647\u0627 — \u062d\u062f 5MB</span>
    </div>
    <input type="file" id="att-file-input" style="display:none" multiple onchange="handleFileUpload(event,'${type}',${id},'${title}')">
    <button class="bs2" onclick="closeM()" style="margin-top:8px">\u0625\u063a\u0644\u0627\u0642</button>
  </div></div>`);
}

function handleFileUpload(event,type,id,title){
  const files=Array.from(event.target.files);
  if(!files.length)return;
  const key=getAttKey(type,id);
  if(!attachments[key])attachments[key]=[];
  let processed=0;
  files.forEach(file=>{
    if(file.size>5*1024*1024){toast(`\u0627\u0644\u0645\u0644\u0641 ${file.name} \u0627\u0643\u0628\u0631 \u0645\u0646 5MB`);processed++;if(processed===files.length)refreshAttModal(type,id,title);return;}
    const reader=new FileReader();
    reader.onload=e=>{
      const att={id:'a'+Date.now()+'_'+Math.random().toString(36).substr(2,5),name:file.name,size:file.size,type:file.type,data:e.target.result,date:new Date().toLocaleDateString('ar')};
      attachments[key].push(att);
      processed++;
      if(processed===files.length){saveAttachments();refreshAttModal(type,id,title);toast(`\u062a\u0645 \u0631\u0641\u0639 ${files.length} \u0645\u0644\u0641`);}
    };
    reader.readAsDataURL(file);
  });
}

function refreshAttModal(type,id,title){
  const key=getAttKey(type,id);
  const atts=attachments[key]||[];
  const listEl=document.getElementById('att-modal-list');
  if(listEl){
    const attHTML=atts.length?atts.map(a=>{
      const icon=getFileIcon(a.type);
      const isImg=a.type&&a.type.startsWith('image/');
      return`<div class="att-item" id="att-${a.id}">
        <div class="att-icon" style="background:var(--pr-l)">${icon}</div>
        <div class="att-info"><div class="att-name">${a.name}</div><div class="att-size">${fmtSize(a.size)} — ${a.date}</div></div>
        <div class="att-acts">
          ${isImg?`<button class="att-btn" onclick="previewAtt('${a.id}','${key}')" title="\u0639\u0631\u0636"><i class="ti ti-eye"></i></button>`:''}
          <button class="att-btn" onclick="downloadAtt('${a.id}','${key}')" title="\u062a\u062d\u0645\u064a\u0644"><i class="ti ti-download"></i></button>
          <button class="att-btn del" onclick="deleteAtt('${a.id}','${key}')" title="\u062d\u0630\u0641"><i class="ti ti-trash"></i></button>
        </div>
      </div>`;}).join(''):'<div class="empty" style="padding:20px"><i class="ti ti-paperclip"></i>\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0631\u0641\u0642\u0627\u062a \u0628\u0639\u062f</div>';
    listEl.innerHTML=attHTML;
  }
}

function previewAtt(attId,key){
  const att=(attachments[key]||[]).find(a=>a.id===attId);
  if(!att)return;
  const prev=document.createElement('div');
  prev.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:3000;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px';
  prev.onclick=e=>{if(e.target===prev)prev.remove();};
  prev.innerHTML=`<img src="${att.data}" style="max-width:90vw;max-height:80vh;border-radius:8px;object-fit:contain">
    <div style="display:flex;gap:10px">
      <button onclick="downloadAtt('${attId}','${key}')" style="background:var(--pr);color:#fff;border:none;border-radius:var(--rs);padding:8px 16px;font-size:13px;cursor:pointer;font-family:var(--fn)"><i class="ti ti-download"></i> \u062a\u062d\u0645\u064a\u0644</button>
      <button onclick="this.closest('div').parentElement.remove()" style="background:rgba(255,255,255,.2);color:#fff;border:none;border-radius:var(--rs);padding:8px 16px;font-size:13px;cursor:pointer;font-family:var(--fn)">\u0625\u063a\u0644\u0627\u0642</button>
    </div>`;
  document.body.appendChild(prev);
}

function downloadAtt(attId,key){
  const att=(attachments[key]||[]).find(a=>a.id===attId);
  if(!att)return;
  const a=document.createElement('a');
  a.href=att.data;a.download=att.name;a.click();
}

function deleteAtt(attId,key){
  if(!confirm('\u0647\u0644 \u062a\u0631\u064a\u062f \u062d\u0630\u0641 \u0647\u0630\u0627 \u0627\u0644\u0645\u0631\u0641\u0642\u061f'))return;
  attachments[key]=(attachments[key]||[]).filter(a=>a.id!==attId);
  saveAttachments();
  const el=document.getElementById('att-'+attId);
  if(el)el.remove();
  toast('\u062a\u0645 \u062d\u0630\u0641 \u0627\u0644\u0645\u0631\u0641\u0642');
}



function attBadge(type,id){
  const cnt=getAttCount(type,id);
  return cnt?`<span style="background:var(--in-l);color:#0C447C;font-size:10px;padding:1px 6px;border-radius:var(--rf);font-weight:500"><i class="ti ti-paperclip" style="font-size:10px"></i>${cnt}</span>`:'';
}

function toast(msg){const el=document.createElement('div');el.className='toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),2500);}}

const nd=new Date();
document.getElementById('dtlbl').textContent=`${DN[nd.getDay()]} ${nd.getDate()} ${MN[nd.getMonth()]} ${nd.getFullYear()}`;
if('Notification' in window&&Notification.permission==='default')Notification.requestPermission();
setInterval(chkAlarms,30000);
if(fbConfig)initFirebase();
updateSoundBtn();renderAll();chkAlarms();
document.addEventListener('click',e=>{unlockAudio();const sb=document.getElementById('sb');if(sb.classList.contains('open')&&!sb.contains(e.target)&&!e.target.closest('.hamburger'))sb.classList.remove('open');});
document.addEventListener('touchstart',()=>unlockAudio(),{once:true});
