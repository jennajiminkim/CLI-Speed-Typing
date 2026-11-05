/* Fictional interface phrases only. No private training data. */
class TypingEngine {
 constructor(){this.reset()}
 reset(){this.status='ready';this.practice=false;this.elapsed=0;this.started=0;this.chars=0;this.errors=0;this.combo=0;this.maxCombo=0;this.index=0;this.commandErrors=0;this.value=''}
 start(now,practice=false){this.reset();this.practice=practice;this.status='running';this.started=now}
 seconds(now){return Math.max(0,this.elapsed+(this.status==='running'?Math.max(0,now-this.started)/1000:0))}
 input(next,target){let a=0;while(a<this.value.length&&a<next.length&&this.value[a]===next[a])a++;let oldEnd=this.value.length,newEnd=next.length;while(oldEnd>a&&newEnd>a&&this.value[oldEnd-1]===next[newEnd-1]){oldEnd--;newEnd--}for(let i=a;i<newEnd;i++)if(next[i]!==target[i]){this.errors++;this.commandErrors++}this.value=next}
 submit(target){if(this.status!=='running'||this.value!==target)return false;this.chars+=target.length;const perfect=this.commandErrors===0;this.combo=perfect?this.combo+1:0;this.maxCombo=Math.max(this.maxCombo,this.combo);this.index++;this.value='';this.commandErrors=0;return perfect?'perfect':'good'}
 metrics(){const accuracy=this.chars+this.errors?this.chars/(this.chars+this.errors):1;const cpm=this.chars/1.5;return {accuracy,cpm,score:cpm*accuracy*accuracy}}
 finish(now){if(this.status==='running')this.elapsed=this.seconds(now);this.status='finished'}
}
if(typeof module!=='undefined')module.exports=TypingEngine;
