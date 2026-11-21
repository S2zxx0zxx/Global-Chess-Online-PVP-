// Produces the native Android raster/adaptive icon family from the SAME
// in-repo original SVG brand artwork shipped to the PWA. No paid design API,
// stock asset or third-party branding is used. Generate after cap sync.
import { Resvg } from '@resvg/resvg-js';
import {readFileSync,writeFileSync,mkdirSync,statSync} from 'node:fs';
import {join} from 'node:path';

const source=path=>readFileSync(new URL('../public/'+path,import.meta.url),'utf8');
const nativeRoot=new URL('../android/app/src/main/res/',import.meta.url).pathname;
const icon=source('icon.svg');
const mask=source('maskable.svg');
const foreground=mask.replace('<rect width="256" height="256" fill="url(#bg)"/>','');
if(foreground===mask)throw Error('Maskable foreground transparency transform failed');
const background='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="#231310"/></svg>';
const monochrome='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g fill="#ffffff"><path d="M85 184l10-21-12-14-5-29-9-16 7-15 25-16 27 8 13 24-21 28 8 25 11 26H85Z"/><path d="M131 184l9-15 6-61 14-14-5-10V71h10V60h8v11h11v13h-11v10l14 14 7 61 9 15Z"/></g></svg>';

const sizes={mdpi:[48,108],hdpi:[72,162],xhdpi:[96,216],xxhdpi:[144,324],xxxhdpi:[192,432]};
function png(svg,size){
 const buffer=new Resvg(svg,{fitTo:{mode:'width',value:size},font:{loadSystemFonts:false}}).render().asPng();
 if(buffer.length<100)throw Error('Generated PNG is unexpectedly small');
 return buffer;
}
for(const [density,[legacy,adaptive]] of Object.entries(sizes)){
 const dir=join(nativeRoot,'mipmap-'+density);
 mkdirSync(dir,{recursive:true});
 for(const [name,svg,size] of [
  ['ic_launcher.png',icon,legacy],
  ['ic_launcher_round.png',icon,legacy],
  ['ic_launcher_foreground.png',foreground,adaptive],
  ['ic_launcher_background.png',background,adaptive],
  ['ic_launcher_monochrome.png',monochrome,adaptive],
 ]){
  const dest=join(dir,name);
  writeFileSync(dest,png(svg,size));
  if(statSync(dest).size<100)throw Error('Missing branded native icon '+dest);
 }
}
const xml='<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n  <background android:drawable="@mipmap/ic_launcher_background"/>\n  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n  <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>\n</adaptive-icon>\n';
const xmlDir=join(nativeRoot,'mipmap-anydpi-v26');
mkdirSync(xmlDir,{recursive:true});
writeFileSync(join(xmlDir,'ic_launcher.xml'),xml);
writeFileSync(join(xmlDir,'ic_launcher_round.xml'),xml);
console.log('Original native icons generated: 5 density groups x 5 PNGs + 2 adaptive XML resources');
