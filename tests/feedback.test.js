import test from 'node:test';
import assert from 'node:assert/strict';
import {feedbackPreferences,setFeedbackPreference,emitFeedback} from '../src/feedback.js';

test('sound and haptic effects are opt-in and never require an external asset', () => {
  const values = new Map();
  const storage = {
    getItem:k=>values.get(k)??null,
    setItem:(k,v)=>values.set(k,v),
  };
  assert.deepEqual(feedbackPreferences(storage),{sound:false,haptics:false});
  assert.equal(setFeedbackPreference('sound',true,storage),true);
  assert.equal(setFeedbackPreference('haptics',true,storage),true);
  assert.deepEqual(feedbackPreferences(storage),{sound:true,haptics:true});
  assert.throws(()=>setFeedbackPreference('invalid',true,storage));
  assert.throws(()=>setFeedbackPreference('sound','enabled',storage));
});

test('corrupt or blocked preference storage defaults to muted', () => {
  const blocked={getItem(){throw new Error('No storage');},setItem(){throw new Error('No storage');}};
  assert.deepEqual(feedbackPreferences(blocked),{sound:false,haptics:false});
  assert.equal(setFeedbackPreference('sound',true,blocked),false);
  assert.deepEqual(feedbackPreferences({getItem:()=>'{broken'}),{sound:false,haptics:false});
  assert.doesNotThrow(()=>emitFeedback('move'));
});
