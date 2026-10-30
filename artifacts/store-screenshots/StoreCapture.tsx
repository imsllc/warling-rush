import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BattleScreen } from '../../src/ui/BattleScreen';
import { chrome, Resource } from '../../src/ui/chrome';
import { ui } from '../../src/ui/theme';
import { BATTLE } from '../../src/game/config';
import type { World } from '../../src/game/types';
const scenes = require('./scenes.json') as {name:string; coins:number; world:World}[];
// Capture-only entry: freezes real combat snapshots. It never loads or saves progress.
Object.assign(BATTLE, { fixedStep: Number.POSITIVE_INFINITY });
const noop=()=>{};
export default function StoreCapture(){
 const [index,setIndex]=useState(0),scene=scenes[index];
 return <SafeAreaProvider><StatusBar hidden/><SafeAreaView style={ui.screen}>
  <View style={ui.screen}>
   <Pressable onPress={()=>setIndex((index+1)%scenes.length)} style={chrome.header}>
    <Resource icon='coin' value={scene.coins} size={26}/>
    <Text style={[chrome.title,styles.title]}>Wave {scene.world.battleNumber}/100</Text>
   </Pressable>
   <View style={styles.content}>
    <BattleScreen key={index} world={scene.world} phase='playing' hidden={false} onPlay={noop} onEnd={noop} onLeave={noop} onEarnings={noop} leaving={false} leaveError=''/>
   </View>
  </View>
 </SafeAreaView></SafeAreaProvider>;
}
const styles=StyleSheet.create({content:{flex:1},title:{position:'absolute',left:110,right:110,textAlign:'center'}});
