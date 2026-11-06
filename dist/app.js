const $=id=>document.getElementById(id);
// Public-safe fictional practice set. The same fixed sequence is used for every local playtest.
const bank=[['EASY','node alpha'],['NORMAL','route preview --node alpha'],['EASY','link ready'],['NORMAL','packet trace --path blue'],['HARD','network preview --from alpha --to delta'],['NORMAL','signal check --zone violet'],['EASY','core ready'],['HARD','topology inspect --layer demo --mode quiet'],['NORMAL','path select --node beta'],['HARD','network preview --from beta --to gamma']];
const engineScript=document.createElement('script');engineScript.src='engine.js';engineScript.onload=init;document.head.append(engineScript);
const switchShape=`<g class="device"><path d="M10 55Q10 52 13 50L108 10Q111 9 115 11L169 40Q172 42 172 45V79Q172 82 169 84L57 128Q54 129 51 127L12 106Q10 105 10 102Z"/><path class="side" d="M54 78L172 43V81L54 128Z"/><path d="M10 53L54 78V128M54 78L172 43" fill="none"/>${Array.from({length:7},(_,i)=>`<path d="M${64+i*14} ${82-i*5}v11l9-3v-11Z" fill="var(--bg)"/>`).join('')}<path d="M18 72l26 13m-26-5 26 13m-26-5 26 13"/><circle cx="160" cy="63" r="2" fill="#00ed83" stroke="none"/></g>`;
const routerShape=`<g class="device"><path d="M3 105L105 54l113 56-108 53Z" stroke="#00b4fe" fill="var(--side)"/><path d="M3 105v12l107 55 108-54v-8M110 163v9" stroke="#00b4fe"/><path d="M24 79Q24 76 28 74L105 35q3-2 6 0l85 43q4 2 4 5v34q0 3-3 5l-84 43q-3 1-6-1L27 124q-3-2-3-5Z"/><path class="side" d="M110 122l90-42v38l-90 46Z"/><path d="M24 78l86 44v42M110 122l90-42" fill="none"/><path d="M55 61V8q0-8 8-8t8 8v45M159 59V13q0-8 8-8t8 8v54"/><path d="M108 78l-18-10m0 0 1 7m-1-7 9 0M118 73l18-10m0 0-8 0m8 0-1 7M103 86l-17 10m0 0 1-7m-1 7 9 0M117 86l18 10m0 0-1-7m1 7-9 0M137 111l45-21m-45 29 45-21m-45 29 45-21" fill="none"/><path d="M50 111v6m12 0v6m12 0v6m12 0v6" stroke="#00ed83" stroke-width="4"/></g>`;
const serverShape=`<g class="device"><path d="M20 44Q20 41 24 39L78 10q3-2 6 0l57 30q3 2 3 5v143q0 3-3 5l-54 31q-3 2-6 0l-58-32q-3-2-3-5Z"/><path class="side" d="M84 77l60-33v146l-60 35Z"/><path d="M20 43l64 34v147M84 77l60-33" fill="none"/>${Array.from({length:5},(_,i)=>`<path d="M28 ${59+i*28}l47 25v20L28 ${79+i*28}Z" fill="var(--bg)"/><path d="M35 ${68+i*28}v7m8-3v7m8-3v7"/><circle cx="66" cy="${89+i*28}" r="2" fill="#00ed83" stroke="none"/>`).join('')}<path d="M99 91l29-16m-29 25 29-16m-29 25 29-16m-29 50 29-16m-29 25 29-16"/></g>`;
const clientShape=`<g class="device"><path d="M20 38q0-3 3-5L113 3q5-2 5 4v94l59 32q5 3 0 6l-91 39q-3 2-6 0L16 144q-3-2 0-5l4-3Z"/><path d="M26 42l85-31v89l-85 33ZM20 139l98-38 61 35-96 37Z"/><path d="M31 142l85-32 36 21-84 33Z" fill="var(--side)"/><path d="M42 137l36 20m-23-25 36 20m-23-25 36 20m-23-25 36 20m-23-25 36 20M40 147l85-32m-73 39 85-32" stroke-width="1"/><path d="M54 68h14v14H54Z" fill="#00b4fe"/><path d="M47 98h12v12H47Z" fill="#00ed83"/><path d="M83 84h12v12H83Z" fill="#986cff"/><path d="M62 82v8l-9 8m9-8 21 0" fill="none"/></g>`;
// Lobby coordinates measured from reference_home_light.png, relative to (20, 140).
// Device SVGs remain external, byte-identical approved assets; only uniform placement.
const lobbyDevices = [
  { name:'Switch', asset:'switch', x:50, y:174, width:260, height:180 },
  { name:'Router', asset:'router', x:280, y:294, width:400, height:290 },
  { name:'Client', asset:'client', x:71, y:542, width:242, height:232 },
  { name:'Linux Server', asset:'linux-server', x:695, y:492, width:230, height:305 },
  { name:'Internet', asset:'internet', x:730, y:180, width:175, height:175 },
  { name:'Secret Core', asset:'secret-core', x:415, y:43, width:155, height:149 }
];
const lobbyRoutes = [
  { name:'switch-router', d:'M199 299 V329 L370 414' },
  { name:'router-internet', d:'M624 427 L810 333 V319' },
  { name:'router-client', d:'M403 516 V549 L220 642' },
  { name:'router-server', d:'M574 515 V555 L732 634' }
];
const lobbyPackets = [
  { route:'switch-router', x:242, y:350, color:'green' },
  { route:'switch-router', x:299, y:378, color:'blue' },
  { route:'router-internet', x:691, y:393.1, color:'green' },
  { route:'router-internet', x:728, y:374.4, color:'blue' },
  { route:'router-client', x:349, y:576.4, color:'green' },
  { route:'router-client', x:301, y:600.8, color:'blue' },
  { route:'router-server', x:612, y:574, color:'green' },
  { route:'router-server', x:666, y:601, color:'blue' }
];
// Animation metadata only: physical Router-outward order, independent of DOM order.
const lobbyGlowBranches = [
  { route:'switch-router', outwardX:-1 },
  { route:'router-client', outwardX:-1 },
  { route:'router-internet', outwardX:1 },
  { route:'router-server', outwardX:1 }
];
function lobbyGlowStyle(packet) {
  const branchIndex = lobbyGlowBranches.findIndex(b => b.route === packet.route);
  const branch = lobbyGlowBranches[branchIndex];
  const outward = lobbyPackets.filter(p => p.route === packet.route)
    .slice().sort((a,b) => branch.outwardX * (a.x-b.x));
  return `--glow-branch:${branchIndex};--glow-order:${outward.indexOf(packet)};color:var(--${packet.color})`;
}
$('homeMap').innerHTML=`<svg class="lobbyTopology" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid meet" role="img" aria-label="아이소메트릭 네트워크 토폴로지">
  <g class="links lobbyRoutes" stroke-linejoin="round" stroke-linecap="round">
    ${lobbyRoutes.map(r=>`<path data-route="${r.name}" d="${r.d}"/>`).join('')}
    <path class="coreUplink" d="M488 162 V354" stroke-dasharray="7 7"/>
  </g>
  <g class="lobbyPackets">${lobbyPackets.map(p=>`<rect data-route="${p.route}" style="${lobbyGlowStyle(p)}" x="${p.x-6}" y="${p.y-6}" width="12" height="12" fill="var(--${p.color})"/>`).join('')}</g>
  <g class="lobbyDevices">${lobbyDevices.map(d=>`<g data-device="${d.asset}" aria-label="${d.name}"><image class="lobbyDeviceLight" href="assets/${d.asset}-light.svg" x="${d.x}" y="${d.y}" width="${d.width}" height="${d.height}" preserveAspectRatio="xMidYMid meet"/><image class="lobbyDeviceNight" href="assets/${d.asset}-night.svg" x="${d.x}" y="${d.y}" width="${d.width}" height="${d.height}" preserveAspectRatio="xMidYMid meet"/></g>`).join('')}</g>
  <g class="links lobbySocketLeads"><path d="M810 333 V319.5"/><path class="coreUplink" d="M488 162 V190" stroke-dasharray="7 7"/></g>
  <g class="lobbyCallouts" fill="none" stroke-linejoin="round">
    <path class="labelLine" d="M97 161 L81 209 L110 234"/>
    <path class="labelLine" d="M537 260 L490 346"/>
    <path class="labelLine" d="M83 537 L71 581 L94 595"/>
    <path class="labelLine" d="M851 154 L832 192"/>
    <path class="labelLine" d="M892 504 L878 540"/>
    <path class="coreCallout" d="M534 109 L547 103 L563 66 L573 63"/>
  </g>
  <g class="lobbyCalloutPins">
    <rect x="91" y="155" width="11" height="11" fill="var(--blue)"/>
    <rect x="532" y="255" width="11" height="11" fill="var(--green)"/>
    <rect x="77" y="532" width="11" height="11" fill="var(--blue)"/>
    <rect x="847" y="150" width="8" height="8" fill="var(--blue)"/>
    <rect x="886" y="498" width="11" height="11" fill="var(--blue)"/>
  </g>
  <g class="lobbyLabels">
    <text x="112" y="167">SWITCH</text>
    <text x="550" y="266">ROUTER</text>
    <text x="98" y="543">CLIENT</text>
    <text x="862" y="159">INTERNET</text>
    <text x="906" y="510">LINUX</text><text x="906" y="536">SERVER</text>
    <text x="582" y="70">SECRET CORE NODE</text>
    <rect x="556" y="279" width="94" height="28" rx="3" fill="var(--green)"/>
    <text class="lobbyStatus activeStatus" x="566" y="300">ACTIVE</text>
    <rect x="582" y="80" width="94" height="27" rx="3" fill="var(--violet)"/>
    <text class="lobbyStatus lockedStatus" x="592" y="101">LOCKED</text>
    <text x="582" y="130" class="nodeNote">1위 전용 · 서버 연동 예정</text>
  </g>
</svg>`;
$('leftDevice').innerHTML=`<svg viewBox="0 0 230 550"><text x="20" y="70">SWITCH</text><g transform="translate(10 90)">${switchShape}</g><text x="20" y="330">ROUTER</text><g transform="translate(0 350)">${routerShape}</g></svg>`;
$('rightDevice').innerHTML=`<svg viewBox="0 0 170 300"><text x="25" y="25">SERVER</text><g transform="translate(0 40)">${serverShape}</g></svg>`;
function init(){
 const e=new TypingEngine();let view='lobby',best=0,wasPractice=false,lastJudgment='READY',anchor=0,wall=0;
 const now=()=>anchor+Math.max(performance.now()-anchor,Date.now()-wall);
 function dateKey(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return ['year','month','day'].map(type=>parts.find(p=>p.type===type).value).join('-')}
 let bestKey='';
 function loadBest(){bestKey=`cli-speedrun-best-v1:${dateKey()}`;best=0;try{const stored=Number(localStorage.getItem(bestKey));if(Number.isFinite(stored)&&stored>0)best=stored}catch{}$('best').textContent=best?formatTime(best):'—'}
 const formatTime=value=>{const centis=Math.floor(Math.max(0,value)*100),minutes=Math.floor(centis/6000),seconds=Math.floor(centis/100)%60,cs=centis%100;return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${String(cs).padStart(2,'0')}`};
 loadBest();
 function focus(){if(e.status==='running'&&!$('exitDialog').open)$('typing').focus({preventScroll:true})}
 function theme(n){document.body.classList.toggle('night',n);$('light').setAttribute('aria-pressed',!n);$('night').setAttribute('aria-pressed',n);$('themeName').textContent=n?'NIGHT':'LIGHT';try{localStorage.setItem('cli-theme',n?'night':'light')}catch{}}
 try{theme(localStorage.getItem('cli-theme')==='night')}catch{}
 $('light').onclick=()=>theme(false);$('night').onclick=()=>theme(true);
 function show(name){if(name==='lobby')loadBest();view=name;document.body.dataset.view=name;$('screenLabel').textContent=name==='arena'?'TYPING ARENA':'NETWORK LOBBY';for(const id of ['lobby','arena','result'])$(id).hidden=id!==name;document.querySelector('nav').hidden=name==='arena';$('screenLabel').style.display=name==='arena'?'block':'none';$('exit').hidden=name!=='arena';window.scrollTo(0,0)}
 function target(){return bank[e.index]?.[1]||''}
 function wrong(){return [...e.value].some((c,i)=>c!==target()[i])}
 function drawTarget(){const frag=document.createDocumentFragment();[...target()].forEach((c,i)=>{const span=document.createElement('span');span.textContent=c;if(i<e.value.length)span.className=e.value[i]===c?'correct':'incorrect';frag.append(span)});if(e.value.length>target().length){const extra=document.createElement('span');extra.className='incorrect';extra.textContent=e.value.slice(target().length);frag.append(extra)}$('target').replaceChildren(frag)}
 function command(){if(e.index>=bank.length)return;const [level]=bank[e.index];$('commandLabel').textContent=`COMMAND ${String(e.index+1).padStart(2,'0')}/10 · ${level}`;$('typing').value='';drawTarget()}
 function judgment(text,animate=false){$('feedback').textContent=text;$('feedback').className='pixel '+text.toLowerCase();$('judgmentContext').textContent=text==='ERROR'?'CURRENT INPUT':'LAST';const slot=$('feedback').parentElement;slot.dataset.judgment=text.toLowerCase();if(animate){const spark=document.createElement('i');spark.className='sparks';spark.setAttribute('aria-hidden','true');slot.querySelector('.sparks').replaceWith(spark)}}
 function render(){const secs=e.seconds(now()),progress=e.index/bank.length*100;$('time').textContent=formatTime(secs);$('timeBar').style.width=`${progress}%`;$('timeBar').setAttribute('aria-valuenow',String(e.index));$('commandProgress').textContent=`${String(e.index).padStart(2,'0')} / 10`;$('score').textContent=Math.round(e.metrics().score);$('accuracy').textContent=(e.metrics().accuracy*100).toFixed(1)+'%';$('combo').textContent='×'+e.combo;$('youChars').textContent=`${e.index}/10`;$('youMarker').style.left=progress+'%';$('typing').disabled=e.status!=='running';$('practiceNotice').hidden=!e.practice;$('modeLabel').textContent=e.practice?'PRACTICE SPEEDRUN · MIXED':'DAILY SPEEDRUN · MIXED'}
 function start(practice=false){loadBest();wasPractice=practice;anchor=performance.now();wall=Date.now();e.reset();e.practice=practice;e.status='countdown';e.started=anchor+3000;lastJudgment='READY';show('arena');command();judgment('READY');$('inputState').textContent='직접 입력 · Enter로 제출';$('countdown').hidden=false;$('countdownValue').textContent='3';render()}
 function finish(stopped=false,finishedAt=now()){e.finish(finishedAt);$('countdown').hidden=true;$('exitDialog').close();const m=e.metrics(),complete=!stopped&&e.index===bank.length,eligible=complete&&!e.practice;let newBest=false;if(eligible&&(!best||e.elapsed<best)){best=e.elapsed;newBest=true;try{localStorage.setItem(bestKey,String(best))}catch{}$('best').textContent=formatTime(best)}$('resultTitle').innerHTML=stopped?'SESSION<br>ENDED':complete?(e.practice?'PRACTICE<br>COMPLETE':'SPEEDRUN<br>COMPLETE'):'RUN<br>INCOMPLETE';$('resultDetail').textContent=complete?`10개 명령어 완료 · 총 완료 시간 ${formatTime(e.elapsed)}`:`${e.index}/10개 완료 · 미완주 기록은 저장하지 않습니다.`;$('finalScore').textContent=complete?formatTime(e.elapsed):'—';$('resultStats').innerHTML=`<div><small>ACCURACY</small><b>${(m.accuracy*100).toFixed(1)}%</b></div><div><small>COMMANDS</small><b>${e.index}/10</b></div><div><small>BEST COMBO</small><b>×${e.maxCombo}</b></div>`;$('recordStatus').textContent=stopped?'중도 종료 · 기록에 반영하지 않았습니다.':!complete?'미완주 · 기록에 반영하지 않았습니다.':e.practice?'연습 기록 · 오늘의 최고 기록에 반영하지 않았습니다.':newBest?'NEW BEST · 이 기기의 오늘 최고 완주 시간을 갱신했습니다.':'완주 기록 저장 · 이 기기에만 저장되며 공식 랭킹에는 전송되지 않습니다.';show('result')}
 function requestExit(){if(view==='arena')$('exitDialog').showModal();else show('lobby')}
 $('start').onclick=()=>start();$('practice').onclick=()=>start(true);$('retry').onclick=()=>start(wasPractice);$('back').onclick=()=>show('lobby');$('home').onclick=requestExit;$('exit').onclick=requestExit;$('cancelExit').onclick=()=>{$('exitDialog').close();focus()};$('confirmExit').onclick=()=>finish(true);$('exitDialog').addEventListener('close',focus);
 $('typing').addEventListener('input',ev=>{if(e.status!=='running')return;e.input(ev.target.value,target());drawTarget();judgment(wrong()?'ERROR':lastJudgment);$('inputState').textContent=wrong()?'표시된 오류를 수정해주세요':'Enter로 제출';render()});
 $('typing').addEventListener('paste',ev=>{ev.preventDefault();$('inputState').textContent='붙여넣기 대신 직접 입력해주세요.'});$('typing').addEventListener('drop',ev=>ev.preventDefault());
 $('typing').addEventListener('keydown',ev=>{if(ev.key!=='Enter'||ev.isComposing)return;ev.preventDefault();if(e.status!=='running')return;const submittedAt=now();const result=e.submit(target());if(!result){$('inputState').textContent='문구를 끝까지 정확하게 입력해주세요.';return}lastJudgment=result.toUpperCase();judgment(lastJudgment,true);if(e.index===bank.length){finish(false,submittedAt);return}command();$('inputState').textContent='다음 문구를 입력하세요';render()});
 $('records').onclick=()=>{$('recordText').textContent=best?`오늘 이 기기의 가장 빠른 완주 시간: ${formatTime(best)}. 서버 친구 랭킹은 연결되지 않았습니다.`:'오늘 이 기기에서 완주한 기록이 없습니다. 서버 친구 랭킹은 연결되지 않았습니다.';$('recordsDialog').showModal()};$('archive').onclick=()=>{$('recordText').textContent='Command Collection과 BOSS COMMAND는 현재 버전에 연결되어 있지 않습니다.';$('recordsDialog').showModal()};$('closeRecords').onclick=()=>$('recordsDialog').close();
 setInterval(()=>{if(view!=='arena')return;if(e.status==='countdown'){const left=e.started-now();$('countdownValue').textContent=Math.max(1,Math.ceil(left/1000));if(left<=0){e.status='running';$('countdown').hidden=true;render();focus()}}if(e.status==='running')render()},50);show('lobby');
}
