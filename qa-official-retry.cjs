const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { setImmediate: flush } = require('node:timers/promises');
const { test } = require('node:test');
const { join } = require('node:path');
const vm = require('node:vm');

const commands = Array.from({ length: 10 }, (_, i) => i + 1);
const receiptA = { complete: true, elapsed_ms: 15120, seoul_day: '2026-11-10' };
const receiptB = { complete: true, elapsed_ms: 22340, seoul_day: '2026-11-11' };

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function game({ step = (run, number) => number === 10 ? (run === 'A' ? receiptA : receiptB) : {}, rankFor = () => ({ rank: 2 }) } = {}) {
  const nodes = new Map();
  const storage = new Map();
  const calls = [];
  const ranks = [];
  let starts = 0;
  let tick;
  let ms = 0;
  const base = Date.parse('2026-11-11T00:00:00Z');
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [base + ms])); }
    static now() { return base + ms; }
  }
  function element() {
    return {
      dataset: {}, style: {}, value: '', classList: { toggle() {} },
      addEventListener(name, handler) { this[name] = handler; },
      setAttribute() {}, append() {}, replaceChildren() {}, focus() {},
      close() {}, querySelector: element
    };
  }
  const get = id => {
    if (!nodes.has(id)) nodes.set(id, element());
    return nodes.get(id);
  };
  const context = vm.createContext({
    Date: ClockDate, Intl, performance: { now: () => ms },
    setInterval: callback => { tick = callback; },
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    document: { getElementById: get, createElement: element, createDocumentFragment: element, head: element(), body: element(), querySelector: element },
    window: {
      scrollTo() {},
      CLI_RANKED: {
        async start() { return ++starts === 1 ? 'A' : 'B'; },
        async step(run, number, command) {
          calls.push([run, number, command]);
          return step(run, number);
        },
        async rankFor(day) {
          ranks.push(day);
          return rankFor(day);
        }
      }
    }
  });
  for (const file of ['engine.js', 'app.js']) {
    vm.runInContext(readFileSync(join(__dirname, 'dist', file), 'utf8'), context);
  }
  vm.runInContext('init()', context);
  const bank = vm.runInContext('bank.map(entry => entry[1])', context);
  return {
    get, ranks, storage,
    get starts() { return starts; },
    submissions: run => calls.filter(([id]) => id === run).map(([, number, command]) => [number, command]),
    expected: numbers => numbers.map(number => [number, bank[number - 1]]),
    async start(button = 'start') {
      get(button).onclick();
      assert.equal(get('typing').disabled, true);
      ms += 3000;
      tick();
      await flush();
      assert.equal(get('typing').disabled, false);
    },
    async play(numbers = commands) {
      for (const number of numbers) {
        ms += 1000;
        const typing = get('typing');
        typing.value = bank[number - 1];
        typing.input({ target: typing });
        typing.keydown({ key: 'Enter', preventDefault() {} });
        await flush();
      }
    }
  };
}

function assertVerified(g, run, receipt, displayTime) {
  assert.deepEqual(g.submissions(run), g.expected(commands));
  assert.equal(g.get('resultMode').textContent, 'SERVER VERIFIED RESULT');
  assert.equal(g.get('finalScore').textContent, displayTime);
  assert.equal(g.get('resultRank').textContent, '#2');
  assert.equal(g.ranks.at(-1), receipt.seoul_day);
}

test('late rejection of A cannot prevent all ten B submissions after Retry', async () => {
  const oldFinal = deferred();
  const g = game({ step: (run, number) => number === 10 ? (run === 'A' ? oldFinal.promise : receiptB) : {} });
  await g.start();
  await g.play();
  assert.deepEqual(g.submissions('A'), g.expected(commands));
  assert.equal(g.get('resultRankStatus').textContent, '서버 확인 중…');
  await g.start('retry');
  assert.equal(g.starts, 2);
  oldFinal.reject(new Error('old verification rejected'));
  await flush();
  await g.play();
  assertVerified(g, 'B', receiptB, '00:22.34');
});

test('late successful A receipt cannot replace B receipt during result rendering', async () => {
  const oldFinal = deferred();
  const newFinal = deferred();
  const g = game({ step: (run, number) => number === 10 ? (run === 'A' ? oldFinal.promise : newFinal.promise) : {} });
  await g.start();
  await g.play();
  await g.start('retry');
  await g.play();
  assert.deepEqual(g.submissions('A'), g.expected(commands));
  assert.deepEqual(g.submissions('B'), g.expected(commands));
  assert.equal(g.get('resultRankStatus').textContent, '서버 확인 중…');
  newFinal.resolve(receiptB);
  oldFinal.resolve(receiptA);
  await flush();
  assertVerified(g, 'B', receiptB, '00:22.34');
  assert.deepEqual(g.ranks, [receiptB.seoul_day]);
});

test('a rejected step in the current B run still prevents verification', async () => {
  const currentStep = deferred();
  const g = game({
    step: (run, number) => {
      if (run === 'B' && number === 1) return currentStep.promise;
      return number === 10 ? receiptA : {};
    }
  });
  await g.start();
  await g.play();
  await g.start('retry');
  await g.play();
  assert.deepEqual(g.submissions('B'), g.expected([1]));
  currentStep.reject(new Error('current verification rejected'));
  await flush();
  assert.equal(g.get('resultMode').textContent, 'PLAYTEST RESULT');
  assert.equal(g.get('resultRank').textContent, '—');
  assert.equal(g.get('resultRankStatus').textContent, '서버 검증 실패 · 로컬 기록만 유지');
  assert.deepEqual(g.ranks, [receiptA.seoul_day]);
});

test('normal official completion and Practice stay separate', async () => {
  const g = game();
  await g.start();
  await g.play();
  assertVerified(g, 'A', receiptA, '00:15.12');
  const best = g.storage.get('cli-speedrun-best-v1:2026-11-11');
  assert.equal(best, '10');
  await g.start('practice');
  await g.play();
  assert.equal(g.get('resultTitle').textContent, 'PRACTICE COMPLETE');
  assert.equal(g.get('resultMode').textContent, 'PLAYTEST RESULT');
  assert.equal(g.starts, 1);
  assert.deepEqual(g.submissions('A'), g.expected(commands));
  assert.deepEqual(g.ranks, [receiptA.seoul_day]);
  assert.equal(g.storage.get('cli-speedrun-best-v1:2026-11-11'), best);
});

test('queued A steps are not sent after Retry', async () => {
  const oldStep = deferred();
  const g = game({ step: (run, number) => run === 'A' && number === 9 ? oldStep.promise : (number === 10 ? receiptB : {}) });
  await g.start();
  await g.play();
  assert.deepEqual(g.submissions('A'), g.expected(commands.slice(0, 9)));
  await g.start('retry');
  oldStep.resolve({ complete: false });
  await flush();
  await g.play();
  assert.deepEqual(g.submissions('A'), g.expected(commands.slice(0, 9)));
  assertVerified(g, 'B', receiptB, '00:22.34');
});

test('late A rank lookup failure cannot replace the verified B rank label', async () => {
  const oldRank = deferred();
  const g = game({ rankFor: day => day === receiptA.seoul_day ? oldRank.promise : { rank: 2 } });
  await g.start();
  await g.play();
  assert.deepEqual(g.ranks, [receiptA.seoul_day]);
  await g.start('retry');
  await g.play();
  assertVerified(g, 'B', receiptB, '00:22.34');
  oldRank.reject(new Error('old rank lookup rejected'));
  await flush();
  assert.equal(g.get('resultRankStatus').textContent, '오늘의 친구 랭킹');
});
