// Android Back must never silently discard an active match. This module
// consumes the Capacitor App bridge injected by the native Android runtime;
// normal browsers have no native dependency, network or mandatory login.
const PARENT=Object.freeze({
  menu:'match',pause:'match',result:'match',review:'history',history:'profile',
  lessons:'learn',lesson:'lessons',puzzles:'learn',puzzle:'puzzles',
  'puzzle-result':'puzzles',daily:'learn',progress:'profile',
  achievements:'profile',appearance:'profile',avatars:'profile',
  settings:'profile',data:'settings',transfer:'data',recovery:'match',
  update:'settings',about:'settings',play:'home',learn:'home',profile:'home',
});

export function targetForNativeBack(route) {
  return route==='match'?'menu':PARENT[route]??'home';
}

export async function bindNativeLifecycle({
  plugin,getRoute,go,getOpenDialog,onBackground,onForeground,
}) {
  if(!plugin?.addListener)return {registered:false,remove:async()=>{}};
  const handles=[];
  let busy=false;
  try {
    handles.push(await plugin.addListener('backButton',async()=>{
      if(busy)return;
      busy=true;
      try {
        const modal=getOpenDialog?.();
        if(modal){modal.close();return;}
        const route=getRoute();
        if(route==='home') {
          // Minimize rather than kill. Saved offline matches remain resumable.
          if(typeof plugin.minimizeApp==='function')await plugin.minimizeApp();
          return;
        }
        go(targetForNativeBack(route));
      } finally {busy=false;}
    }));
    handles.push(await plugin.addListener('pause',()=>{
      // The app should do this without any native permission request.
      Promise.resolve().then(onBackground).catch(()=>{});
    }));
    handles.push(await plugin.addListener('resume',()=>{
      Promise.resolve().then(onForeground).catch(()=>{});
    }));
  } catch(error) {
    await Promise.allSettled(handles.map(handle=>handle?.remove?.()));
    throw error;
  }
  return {
    registered:true,
    async remove(){await Promise.allSettled(handles.map(handle=>handle?.remove?.()));},
  };
}
