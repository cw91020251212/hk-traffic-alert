import { useCallback, useEffect, useRef, useState } from "react";
import type { PriorityAlert } from "../../../server/transportData";
import {
  ALERT_EFFECTS_PREFERENCE_KEY,
  DEFAULT_ALERT_EFFECT_PREFERENCES,
  getNewHighImpactAlerts,
  parseAlertEffectPreferences,
  type AlertEffectPreferences,
} from "@/lib/alertEffects";

type AudioContextLike = AudioContext;

function loadPreferences(): AlertEffectPreferences {
  if (typeof window === "undefined") return { ...DEFAULT_ALERT_EFFECT_PREFERENCES };
  try {
    return parseAlertEffectPreferences(window.localStorage.getItem(ALERT_EFFECTS_PREFERENCE_KEY));
  } catch {
    return { ...DEFAULT_ALERT_EFFECT_PREFERENCES };
  }
}

async function playChime(context: AudioContextLike) {
  if (context.state !== "running") await context.resume();
  const start = context.currentTime + 0.025;
  [660, 880, 1046].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const noteStart = start + index * 0.16;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, noteStart);
    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.linearRampToValueAtTime(0.075, noteStart + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.14);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteStart + 0.15);
  });
}

export function useAlertEffects(alerts: PriorityAlert[], ready: boolean) {
  const [preferences, setPreferences] = useState<AlertEffectPreferences>(loadPreferences);
  const [audioReady, setAudioReady] = useState(false);
  const [status, setStatus] = useState("");
  const [newAlertNotice, setNewAlertNotice] = useState("");
  const audioContext = useRef<AudioContextLike | null>(null);
  const previousHighImpactIds = useRef<Set<string> | null>(null);
  const noticeTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(ALERT_EFFECTS_PREFERENCE_KEY, JSON.stringify(preferences));
    } catch {
      // Alert effects still work for this page when browser storage is unavailable.
    }
  }, [preferences]);

  const unlockAudio = useCallback(async () => {
    try {
      const AudioContextConstructor = window.AudioContext;
      if (!AudioContextConstructor) {
        setStatus("此瀏覽器不支援頁面提示音");
        return false;
      }
      const context = audioContext.current ?? new AudioContextConstructor();
      audioContext.current = context;
      await context.resume();
      if (context.state !== "running") {
        setStatus("瀏覽器未允許播放聲音，請檢查靜音或網站音效設定");
        return false;
      }
      setAudioReady(true);
      return true;
    } catch {
      setStatus("未能啟用提示音；請檢查裝置靜音或瀏覽器音效設定");
      return false;
    }
  }, []);

  const setSoundEnabled = useCallback(async (enabled: boolean) => {
    if (!enabled) {
      setPreferences((current) => ({ ...current, sound: false }));
      setStatus("聲音警示已關閉");
      if (audioContext.current?.state === "running") void audioContext.current.suspend();
      return;
    }
    const unlocked = await unlockAudio();
    if (unlocked) {
      setPreferences((current) => ({ ...current, sound: true }));
      setStatus("聲音警示已開啟；只提示新出現的重大警報");
    }
  }, [unlockAudio]);

  const testSound = useCallback(async () => {
    const unlocked = await unlockAudio();
    if (!unlocked || !audioContext.current) return;
    try {
      await playChime(audioContext.current);
      setStatus("試聽完成：新重大警報會播放短提示音");
    } catch {
      setStatus("提示音播放失敗；請檢查裝置音量及瀏覽器音效設定");
    }
  }, [unlockAudio]);

  const setBreathingEnabled = useCallback((enabled: boolean) => {
    setPreferences((current) => ({ ...current, breathing: enabled }));
    setStatus(enabled ? "呼吸提示已開啟" : "呼吸提示已關閉");
  }, []);

  useEffect(() => {
    if (!ready) return;
    const currentHighImpact = new Set(alerts.filter((alert) => alert.level !== "watch").map((alert) => alert.id));
    const previous = previousHighImpactIds.current;
    previousHighImpactIds.current = currentHighImpact;
    if (!previous) return; // Existing alerts on first load are not treated as sudden incidents.

    const newAlerts = getNewHighImpactAlerts(alerts, previous);
    if (newAlerts.length === 0) return;
    const notice = `新出現 ${newAlerts.length} 項重大警報`;
    setNewAlertNotice(notice);
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNewAlertNotice(""), 12_000);

    if (!preferences.sound) return;
    if (!audioReady || !audioContext.current) {
      setStatus("有新重大警報；按「試聽提示音」啟用此頁聲音");
      return;
    }
    void playChime(audioContext.current).catch(() => {
      setStatus("新警報已顯示，但瀏覽器未能播放提示音");
    });
  }, [alerts, audioReady, preferences.sound, ready]);

  useEffect(() => () => {
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    if (audioContext.current && audioContext.current.state !== "closed") void audioContext.current.close();
  }, []);

  return { preferences, audioReady, status, newAlertNotice, setSoundEnabled, setBreathingEnabled, testSound };
}
