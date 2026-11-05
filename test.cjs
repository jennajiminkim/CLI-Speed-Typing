const assert = require('node:assert/strict');
const fs = require('node:fs');
const Engine = require('./dist/engine.js');
let count = 0;
const test = (name, fn) => {fn();count++;console.log('PASS '+name)};

test('PERFECT and corrected GOOD combo', () => {
  const e = new Engine(); e.start(0);
  e.input('abc','abc'); assert.equal(e.submit('abc'),'perfect'); assert.equal(e.combo,1);
  e.input('ax','abc');e.input('a','abc');e.input('abc','abc');
  assert.equal(e.errors,1);assert.equal(e.submit('abc'),'good');assert.equal(e.combo,0);
});
test('Incorrect/incomplete input does not advance',()=>{
  const e=new Engine(); e.start(0);e.input('ax','abc');
  assert.equal(e.submit('abc'),false);assert.equal(e.index,0);
});
test('Scoring and accuracy arithmetic for distinct typing traces',()=>{
  for(const trace of [['abc'],['x','','abc'],['abcx','abc'],['abx','ab','abc'],['a','axb','ab','abc']]){
    const e=new Engine();e.start(0);for(const s of trace)e.input(s,'abc');
    const before=e.errors;
    assert.equal(e.submit('abc'),before?'good':'perfect');
    const m=e.metrics(),expectedAccuracy=3/(3+before);
    assert.equal(m.accuracy,expectedAccuracy);
    assert.equal(m.cpm,3/1.5);
    assert.equal(m.score,(3/1.5)*expectedAccuracy*expectedAccuracy);
  }
});
test('Clock has no pause and stops at 90 seconds',()=>{
  const e=new Engine();e.start(3000);
  assert.equal(e.pause,undefined);assert.equal(e.resume,undefined);
  assert.equal(e.seconds(53000),50);e.finish(103000);assert.equal(e.elapsed,90);
});
test('Unfinished command excluded at game end',()=>{
  const e=new Engine();e.start(0);e.input('ab','abc');e.finish(90000);
  assert.equal(e.chars,0);assert.equal(e.submit('abc'),false);
});
test('Countdown deadline and removed playback controls',()=>{
  const js=fs.readFileSync('dist/app.js','utf8');
  const html=fs.readFileSync('dist/index.html','utf8');
  assert.match(js,/e.started=anchor\+3000/);
  assert.match(js,/Date.now\(\)-wall/);
  assert.doesNotMatch(js,/visibilitychange|\.pause\(|BAD/);
  assert.doesNotMatch(html,/id="(?:pause|resume|stop)"/);
});
console.log(count+' suites passed');
