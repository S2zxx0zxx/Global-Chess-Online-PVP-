// A match-history edit is only acknowledged after the backing storage confirms
// the transaction. Preserve the original raw bytes for fault recovery.
export async function commitHistoryReplacement(storage,key,entries) {
  if(!Array.isArray(entries))throw new TypeError('History must be an array');
  if(storage.durable===false)throw new Error('History changes cannot be saved in session-only mode');

  const previous=storage.getItem(key);
  const next=JSON.stringify(entries);
  if(previous===next)return;

  try{
    storage.setItem(key,next);
    if(storage.durable===false)throw new Error('Storage downgraded during history update');
    await storage.flush();
    if(storage.durable===false)throw new Error('Storage lost durability after history update');
  }catch(error){
    // A failed IDB transaction should leave the old persisted bytes intact.
    // Restore our in-memory view as well, and retry the restoration best-effort.
    try{
      if(previous===null)storage.removeItem(key);
      else storage.setItem(key,previous);
      if(storage.durable!==false)await storage.flush();
    }catch{
      // Never claim an unverified recovery succeeded.
    }
    throw new Error('History deletion was not durably confirmed. Keep your backup and retry.',{cause:error});
  }
}
