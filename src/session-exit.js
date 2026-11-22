// A checked exit is a transaction boundary for offline match navigation.
// The UI must not claim that a match is safe to leave until its storage
// adapter confirms the latest queued write has committed.
export async function finalizeOfflineExit({isOnline, isDurable, prepare, persist, flush}) {
  if (isOnline()) {
    return {ok:false, reason:'A private online match is still active. Its clock keeps running on the server; return to the board instead.'};
  }

  // Pause the local clock and bot before serializing the final snapshot.
  try {
    prepare();
    if (!persist()) {
      return {ok:false, reason:'The match could not be saved. Stay in this session, open Recovery and export a copy before leaving.'};
    }
  } catch {
    return {ok:false, reason:'The match could not be prepared for saving. Stay in this session and retry.'};
  }

  if (!isDurable()) {
    return {ok:false, reason:'Session-only storage is active. This match will be lost when this tab closes. Return to the board or explicitly leave without saving.'};
  }
  try {
    // IndexedDB commits asynchronously: setItem alone is not durability.
    await flush();
  } catch {
    return {ok:false, reason:'The latest saved move was not committed. Stay in the match, open Recovery and retry saving.'};
  }
  if (!isDurable()) {
    return {ok:false, reason:'Persistent storage became unavailable. Stay in this tab; the latest match cannot be confirmed saved.'};
  }
  return {ok:true};
}
