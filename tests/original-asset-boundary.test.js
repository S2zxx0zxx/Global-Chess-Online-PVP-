import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const files=[];
function visit(dir){
  for (const entry of readdirSync(join(root,dir),{withFileTypes:true})){
    const path=join(dir,entry.name);
    if(entry.isDirectory()) visit(path);
    else if(entry.isFile()) files.push(path.split(sep).join('/'));
  }
}
visit('public');
test('distributable public assets exclude extracted Unity/APK binaries and atlases',()=>{
  const forbidden=files.filter(path=>/(?:^|\/)(?:sharedassets\d*|globalgamemanagers|resources\.assets|assembly-csharp|vivoxcanvas)|\.(?:apk|aab|astc|unity3d|assetbundle|dex|obb)$/i.test(path));
  assert.deepEqual(forbidden,[],'Not permitted: '+forbidden.join(', '));
});
test('original royal backdrop is accounted for as a public asset',()=>{
  assert.ok(files.includes('public/brand/original-royal-hall.svg'));
});
