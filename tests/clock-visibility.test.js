import test from 'node:test';
import assert from 'node:assert/strict';
import {localClockIsRunning} from '../src/clock.js';

test('local clocks tick only while visible match is active with menu closed', () => {
  assert.equal(localClockIsRunning({documentHidden:false,screen:'match',menuOpen:false}),true);
  for (const state of [
    {documentHidden:true,screen:'match',menuOpen:false},
    {documentHidden:false,screen:'home',menuOpen:false},
    {documentHidden:false,screen:'play',menuOpen:false},
    {documentHidden:false,screen:'match',menuOpen:true},
  ]) assert.equal(localClockIsRunning(state),false);
});
