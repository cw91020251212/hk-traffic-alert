import { BellRing, Volume2, VolumeX, Waves } from "lucide-react";
import type { AlertEffectPreferences } from "@/lib/alertEffects";

type AlertEffectsSettingsProps = {
  preferences: AlertEffectPreferences;
  status: string;
  setSoundEnabled: (enabled: boolean) => void;
  setBreathingEnabled: (enabled: boolean) => void;
  testSound: () => void;
};

export function AlertEffectsSettings({
  preferences,
  status,
  setSoundEnabled,
  setBreathingEnabled,
  testSound,
}: AlertEffectsSettingsProps) {
  return <details className="alert-effects-settings">
    <summary><BellRing size={16} aria-hidden="true" /><span>突發警示設定</span><small>聲音{preferences.sound ? "開" : "關"} · 呼吸{preferences.breathing ? "開" : "關"}</small></summary>
    <div className="alert-effects-panel">
      <div className="alert-effect-row">
        <span className="alert-effect-icon alert-effect-icon--sound">{preferences.sound ? <Volume2 size={17} /> : <VolumeX size={17} />}</span>
        <span className="alert-effect-copy"><strong>新重大警報聲音</strong><small>只在此頁開啟時，發現新出現的高／最高級警報才提示；首次載入和一般提醒不會響。</small></span>
        <button type="button" role="switch" aria-checked={preferences.sound} aria-label={`新重大警報聲音${preferences.sound ? "已開啟" : "已關閉"}`} className={`alert-effect-switch${preferences.sound ? " is-on" : ""}`} onClick={() => void setSoundEnabled(!preferences.sound)}><span /></button>
      </div>
      <div className="alert-effect-row">
        <span className="alert-effect-icon alert-effect-icon--motion"><Waves size={17} /></span>
        <span className="alert-effect-copy"><strong>重大警報呼吸提示</strong><small>重大警報卡片和提示燈會輕柔脈動；遵從裝置的減少動態效果設定。</small></span>
        <button type="button" role="switch" aria-checked={preferences.breathing} aria-label={`重大警報呼吸提示${preferences.breathing ? "已開啟" : "已關閉"}`} className={`alert-effect-switch${preferences.breathing ? " is-on" : ""}`} onClick={() => setBreathingEnabled(!preferences.breathing)}><span /></button>
      </div>
      <div className="alert-effects-actions"><button type="button" className="alert-effect-test" onClick={() => void testSound()}><Volume2 size={15} /> 試聽一次</button><span>設定只保存在此裝置；頁面關閉後不會收到背景／推播警報。</span></div>
      <div className="alert-effect-status" role="status" aria-live="polite">{status || "聲音及呼吸提示預設關閉；按開關選擇啟用。「試聽一次」只測試音效。"}</div>
    </div>
  </details>;
}
