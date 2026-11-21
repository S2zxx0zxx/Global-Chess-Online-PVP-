import test from 'node:test';
import assert from 'node:assert/strict';
import {targetForNativeBack,bindNativeLifecycle} from '../src/native-lifecycle.js';

test('deep screen hierarchy returns home without losing active chess session',()=>{
  assert.equal(targetForNativeBack('match'),'menu');
  assert.equal(targetForNativeBack('menu'),'match');
  assert.equal(targetForNativeBack('pause'),'match');
  assert.equal(targetForNativeBack('lesson'),'lessons');
  assert.equal(targetForNativeBack('settings'),'profile');
  assert.equal(targetForNativeBack('data'),'settings');
  assert.equal(targetForNativeBack('history'),'profile');
  assert.equal(targetForNativeBack('play'),'home');
});

function harness(){
  const events=new Map(), calls=[];
  let route='match', modal=null, minimized=0;
  const plugin={
    async addListener(name,fn){events.set(name,fn);return {async remove(){events.delete(name);}};},
    async minimizeApp(){minimized++;calls.push('minimize');},
  };
  return {
    events,calls,plugin,
    getRoute:()=>route,setRoute:next=>{route=next;},
    go:next=>{calls.push(next);route=next;},
    getOpenDialog:()=>modal,setModal:value=>{modal=value;},
    minimized:()=>minimized,
    onBackground:()=>calls.push('save-background'),
    onForeground:()=>calls.push('resume-foreground'),
  };
}

test('hardware Back shows game menu; Back again returns board',async()=>{
  const h=harness(),registration=await bindNativeLifecycle(h);
  assert.equal(registration.registered,true);
  await h.events.get('backButton')();
  await h.events.get('backButton')();
  assert.deepEqual(h.calls,['menu','match']);
  await registration.remove();
  assert.equal(h.events.size,0);
});

test('open native dialog closes before moving to another screen',async()=>{
  const h=harness(),dialog={close(){h.calls.push('close')}};
  h.setModal(dialog);
  await bindNativeLifecycle(h);
  await h.events.get('backButton')();
  assert.deepEqual(h.calls,['close']);
});

test('Back on Home minimizes Android instead of force-exiting and dropping session',async()=>{
  const h=harness();h.setRoute('home');
  await bindNativeLifecycle(h);
  await h.events.get('backButton')();
  assert.equal(h.minimized(),1);
  assert.deepEqual(h.calls,['minimize']);
});

test('background and foreground callbacks are registered without asking permissions',async()=>{
  const h=harness();
  await bindNativeLifecycle(h);
  h.events.get('pause')();h.events.get('resume')();
  await Promise.resolve();await Promise.resolve();
  assert.deepEqual(h.calls,['save-background','resume-foreground']);
});

test('normal browser without a native plugin retains standard navigation',async()=>{
  const h=harness();
  const x=await bindNativeLifecycle({...h,plugin:null});
  assert.equal(x.registered,false);
  assert.equal(h.events.size,0);
});
