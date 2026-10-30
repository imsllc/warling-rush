import { test } from "node:test";
import assert from "node:assert/strict";

test("sound effects overlap, stop in the background, and release native players", async () => {
  const players: FakePlayer[] = [];
  let onAppState: ((state: string) => void) | undefined;
  let removedListener = false;
  class FakePlayer {
    volume = 1;
    isLoaded = true;
    currentStatus = { isLoaded: true };
    plays = 0;
    pauses = 0;
    removed = false;
    pendingSeek?: () => void;
    play() {
      assert.equal(this.removed, false);
      this.plays++;
    }
    pause() {
      this.pauses++;
    }
    remove() {
      this.removed = true;
    }
    seekTo(seconds: number) {
      assert.equal(seconds, 0);
      return new Promise<void>((resolve) => {
        this.pendingSeek = resolve;
      });
    }
  }
  const loader = require("node:module");
  const originalLoad = loader._load;
  // Isolate native audio so lifecycle races can be checked in the Node runner.
  loader._load = function (id: string, ...args: unknown[]) {
    if (id === "react-native")
      return {
        AppState: {
          currentState: "active",
          addEventListener: (_: string, listener: typeof onAppState) => {
            onAppState = listener;
            return { remove: () => (removedListener = true) };
          },
        },
      };
    if (id === "expo-audio")
      return {
        setAudioModeAsync: async (mode: {
          shouldPlayInBackground: boolean;
        }) => {
          assert.equal(mode.shouldPlayInBackground, false);
        },
        createAudioPlayer: () => {
          const player = new FakePlayer();
          players.push(player);
          return player;
        },
      };
    if (id.endsWith(".mp3")) return 1;
    return originalLoad.call(this, id, ...args);
  };
  let audio: typeof import("../src/audio");
  try {
    audio = require("../src/audio");
  } finally {
    loader._load = originalLoad;
  }
  const flush = async () => {
    for (const player of players) {
      player.pendingSeek?.();
      player.pendingSeek = undefined;
    }
    await new Promise((resolve) => setImmediate(resolve));
  };
  const totalPlays = () =>
    players.reduce((sum, player) => sum + player.plays, 0);
  const stop = audio.startGameAudio();
  await flush();
  assert.ok(players.length > 0);
  audio.playSound("click");
  audio.playSound("click");
  await flush();
  assert.equal(totalPlays(), 2, "rapid clicks should overlap and replay");
  for (const player of players) player.isLoaded = false;
  audio.playSound("click");
  audio.playSound("click");
  await flush();
  assert.equal(
    totalPlays(),
    4,
    "completed Android clips must remain replayable",
  );
  audio.playSound("sword");
  audio.playSound("throw");
  onAppState?.("background");
  await flush();
  assert.equal(
    totalPlays(),
    4,
    "pending seeks must not restart audio in background",
  );
  assert.ok(players.every((player) => player.pauses > 0));
  audio.playSound("click");
  await flush();
  assert.equal(totalPlays(), 4);
  onAppState?.("active");
  audio.playSound("sword");
  audio.playSound("throw");
  await flush();
  assert.equal(totalPlays(), 6, "both attack sounds resume in foreground");
  audio.playSound("click");
  stop();
  await flush();
  assert.equal(
    totalPlays(),
    6,
    "pending playback must not use released players",
  );
  assert.ok(players.every((player) => player.removed));
  assert.ok(removedListener);
});
