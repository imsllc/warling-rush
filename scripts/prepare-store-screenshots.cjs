const fs=require('node:fs');const path=require('node:path');const Module=require('node:module');require('tsx/cjs');
async function main(){
 const kit=await require('canvaskit-wasm/bin/full/canvaskit.js')({wasmBinary:fs.readFileSync(require.resolve('canvaskit-wasm/bin/full/canvaskit.wasm'))});
 const {JsiSkApi}=require('../node_modules/@shopify/react-native-skia/lib/commonjs/skia/web/JsiSkia.js');const Skia=JsiSkApi(kit),load=Module._load;
 Module._load=function(id,...args){if(id==='@shopify/react-native-skia')return{Skia,PaintStyle:{Fill:0,Stroke:1}};return load.call(this,id,...args);};
 const {drawWorld}=require('../src/rendering/draw.ts');Module._load=load;
 const {createWorld,step}=require('../src/game/engine.ts'),{spawn}=require('../src/game/units.ts'),{UNITS}=require('../src/game/config.ts');
 const setups=[
  {name:'desert',wave:86,army:['stormblade','cannon','basketballPlayer'],players:[['cannon',310,0,.02],['basketballPlayer',355,2,.13],['stormblade',435,1,.80],['cannon',190,2,.22]]},
  {name:'space',wave:46,army:['gundam','mech','spaceMarine'],players:[['mech',330,0,.01],['spaceMarine',210,2,.07],['gundam',455,1,1.0]]},
  {name:'lava',wave:36,army:['darkMage','skeletonKing','barbarian'],players:[['darkMage',380,0,.02],['skeletonKing',462,1,.75],['barbarian',405,2,1.15],['darkMage',265,0,.17]]}
 ];
 const out=path.resolve(__dirname,'../artifacts/store-screenshots');fs.mkdirSync(out,{recursive:true});const scenes=[];
 for(const setup of setups){
  const w=createWorld({food:55,health:18,damage:0},setup.army,setup.army,setup.wave);w.food=setup.players.reduce((n,[kind])=>n+UNITS[kind].cost,46);w.nextAI=1e9;
  for(const [kind,x,lane,delay] of setup.players){if(!spawn(w,'player',kind))throw Error('spawn failed '+kind);const u=w.units.at(-1);u.x=x;u.lane=lane;u.cooldown=delay;}
  for(const [i,x] of [620,665,740,805,875,930].entries()){
   const kind=i%3===2?'slimeThrower':'slimeArm',trait=kind==='slimeArm'&&i%2===0?'armored':kind==='slimeThrower'?'frail':undefined;
   if(!spawn(w,'enemy',kind,trait))throw Error('Enemy spawn failed');const u=w.units.at(-1);u.x=x;u.lane=i%3;u.cooldown=.1+i*.09;
  }
  const candidates=[];
  for(let i=0;i<300;i++){
   step(w,1/60,()=>.55);
   if(i%3!==0)continue;
   const effects=w.effects.filter(e=>e.visual),heavy=effects.filter(e=>['fireball','missile','cannonball'].includes(e.visual.kind)&&e.age>.06&&e.age<.44),lightning=effects.filter(e=>e.visual.kind==='stormblade'&&e.age<.28),melee=effects.filter(e=>['gundam','skeletonKing','barbarian'].includes(e.visual.kind)&&e.age<.28);
   const living=w.units.filter(u=>u.hp>0),playerCount=living.filter(u=>u.side==='player').length,enemyCount=living.filter(u=>u.side==='enemy').length;
   if(playerCount<3||enemyCount<4)continue;
   const projectiles=w.projectiles.filter(p=>p.side==='player'),distinct=new Set(projectiles.map(p=>p.kind));
   let score=heavy.length*10+lightning.length*12+melee.length*6+projectiles.length*2+distinct.size*3;
   // Prefer a readable central battle rather than effects against the far edge.
   score-=heavy.filter(e=>e.x<200||e.x>850).length*10;
   score-=effects.filter(e=>e.visual&&e.age<.12).length*1.2;
   candidates.push({score,time:w.time,world:structuredClone(w)});
  }
  candidates.sort((a,b)=>b.score-a.score);
  const picks=[];for(const x of candidates){if(picks.every(y=>Math.abs(y.time-x.time)>.18))picks.push(x);if(picks.length===6)break;}
  const surface=Skia.Surface.Make(1080,900),c=surface.getCanvas();
  for(const [index,pick] of picks.entries()){
   c.clear(Skia.Color('#41495d'));const pic=drawWorld(pick.world,1080,900);c.drawPicture(pic);pic.dispose();surface.flush();const image=surface.makeImageSnapshot();fs.writeFileSync(path.join(out,setup.name+'-candidate-'+index+'.png'),image.encodeToBytes());image.dispose();
  }
  surface.dispose();
  if(!picks.length)throw Error('No viable scene for '+setup.name);
  scenes.push({name:setup.name,coins:setup.name==='desert'?2480:setup.name==='space'?8640:4930,candidates:picks});
  console.log(setup.name,picks.map(p=>({score:p.score,time:p.time.toFixed(2),effects:p.world.effects.filter(e=>e.visual).map(e=>[e.visual.kind,e.age.toFixed(2)])})));
 }
 fs.writeFileSync(path.join(out,'candidates.json'),JSON.stringify(scenes));
 const chosen=scenes.map(s=>({name:s.name,coins:s.coins,world:s.candidates[0].world}));fs.writeFileSync(path.join(out,'scenes.json'),JSON.stringify(chosen));
}
main().catch(e=>{console.error(e);process.exitCode=1});




