import { AppState, NativeModules } from "react-native";
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AttackSound } from "./game/types";

type Sound = "click" | AttackSound;
type Voice = { player: AudioPlayer; seeking: boolean };
const sources: Record<Sound, number> = {
  click: require("../assets/sounds/click.mp3"),
  sword: require("../assets/sounds/sword.mp3"),
  throw: require("../assets/sounds/throw.mp3"),
};
const voices: Record<Sound, Voice[]> = { click: [], sword: [], throw: [] };
const nextVoice: Record<Sound, number> = { click: 0, sword: 0, throw: 0 };
let enabled = false;
let generation = 0;
let playbackVersion = 0;
let reportedError = false;

function reportError(error: unknown) {
  if (reportedError) return;
  reportedError = true;
  console.warn("Could not play game audio", error);
}

// Keep a small reusable pool so simultaneous attacks can overlap without
// allocating a native player for every attack or rapid button press.
export function startGameAudio() {
  const session = ++generation;
  let foreground = AppState.currentState === "active";
  void setAudioModeAsync({
    allowsRecording: false,
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: "mixWithOthers",
  })
    .then(() => {
      if (session !== generation) return;
      for (const sound of Object.keys(sources) as Sound[]) {
        for (let i = 0; i < (sound === "click" ? 2 : 6); i++) {
          const player = createAudioPlayer(sources[sound], {
            updateInterval: 1000,
          });
          player.volume = sound === "click" ? 0.7 : 0.45;
          voices[sound].push({ player, seeking: false });
        }
      }
      enabled = foreground;
      console.info("Game audio initialized: 14 native players");
      const diagnostics = NativeModules?.ReleaseDiagnostics;
      const diagnosticOptions = diagnostics?.getConstants?.() ?? diagnostics;
      if (diagnosticOptions?.audioSmokeTest === true) {
        // Exercise the real native setup, asset loading, seeking and playback
        // paths in the optimized APK, without needing a UI automation session.
        let attempts = 0;
        const verify = () => {
          if (session !== generation) return;
          const loaded = Object.values(voices)
            .flat()
            .filter((v) => v.player.currentStatus.isLoaded).length;
          if (loaded < 14 && ++attempts < 40) {
            setTimeout(verify, 250);
            return;
          }
          console.info("Audio smoke test: loaded voices", loaded);
          for (const sound of ["click", "sword", "throw"] as const)
            playSound(sound);
          setTimeout(() => {
            if (session !== generation) return;
            console.info(
              "Audio smoke test: playback",
              JSON.stringify(
                Object.fromEntries(
                  Object.entries(voices).map(([sound, pool]) => [
                    sound,
                    pool.map((v) => ({
                      time: v.player.currentTime,
                      duration: v.player.duration,
                      loaded: v.player.currentStatus.isLoaded,
                    })),
                  ]),
                ),
              ),
            );
          }, 300);
        };
        verify();
      }
    })
    .catch(reportError);
  const subscription = AppState.addEventListener("change", (state) => {
    foreground = state === "active";
    enabled = foreground;
    if (!foreground) {
      playbackVersion++;
      for (const pool of Object.values(voices))
        for (const { player } of pool) player.pause();
    }
  });
  return () => {
    subscription.remove();
    generation++;
    playbackVersion++;
    enabled = false;
    for (const sound of Object.keys(voices) as Sound[]) {
      for (const { player } of voices[sound]) player.remove();
      voices[sound] = [];
      nextVoice[sound] = 0;
    }
  };
}

export function playSound(sound: Sound) {
  if (!enabled) return;
  const pool = voices[sound];
  for (let offset = 0; offset < pool.length; offset++) {
    const index = (nextVoice[sound] + offset) % pool.length;
    const voice = pool[index];
    // Android's isLoaded property becomes false at the end of a clip;
    // currentStatus keeps completed clips loaded so they can replay.
    if (voice.seeking || !voice.player.currentStatus.isLoaded) continue;
    nextVoice[sound] = (index + 1) % pool.length;
    voice.seeking = true;
    const session = generation;
    const version = playbackVersion;
    void voice.player
      .seekTo(0)
      .then(() => {
        if (enabled && session === generation && version === playbackVersion)
          voice.player.play();
      })
      .catch(reportError)
      .finally(() => {
        voice.seeking = false;
      });
    return;
  }
}
