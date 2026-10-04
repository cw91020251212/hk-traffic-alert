import { ChevronDown, CloudRain, MapPin } from "lucide-react";
import { getWeatherWarningLevel, type WeatherWarning } from "../../../server/transportData";

type ActiveWeatherWarningsProps = {
  warnings: WeatherWarning[];
};

function formatHkt(value?: string) {
  if (!value) return "時間未提供";
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}+08:00`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-HK", { timeZone: "Asia/Hong_Kong", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

function warningScope(warning: WeatherWarning) {
  if (warning.code === "WFNTSA") return "新界北部";
  if (warning.code === "WRAIN") return "全港";
  return "詳情見公告";
}

function severityLabel(warning: WeatherWarning) {
  const level = getWeatherWarningLevel(warning);
  return level === "critical" ? "嚴重" : level === "high" ? "較高" : "提醒";
}

export function ActiveWeatherWarnings({ warnings }: ActiveWeatherWarningsProps) {
  if (warnings.length === 0) return null;

  return <section className="hko-warning-panel" aria-labelledby="hko-warning-heading">
    <div className="hko-warning-panel-heading">
      <span className="hko-warning-icon"><CloudRain size={17} aria-hidden="true" /></span>
      <span className="hko-warning-heading-copy"><strong id="hko-warning-heading">天文台生效警告</strong><small>暴雨、寒冷、雷暴、洪水等官方訊號</small></span>
      <span className="hko-warning-count">{warnings.length} 項</span>
    </div>
    <div className="hko-warning-list">
      {warnings.map((warning, index) => {
        const level = getWeatherWarningLevel(warning);
        const preview = warning.content.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 2).join(" ");
        return <details className={`hko-warning-item hko-warning-${level}`} key={`${warning.code}-${warning.subtype ?? ""}-${warning.updatedAt ?? index}`}>
          <summary>
            <span className="hko-warning-badge">{severityLabel(warning)}</span>
            <span className="hko-warning-text"><strong>{warning.label}</strong>{preview && <small>{preview}</small>}</span>
            <span className="hko-warning-scope"><MapPin size={12} aria-hidden="true" />{warningScope(warning)}</span>
            <ChevronDown className="hko-warning-chevron" size={15} aria-hidden="true" />
          </summary>
          <div className="hko-warning-details">
            {warning.content ? <p>{warning.content}</p> : <p>天文台官方警告目前生效。詳情請查看香港天文台公告。</p>}
            <span>天文台更新：{formatHkt(warning.updatedAt)} HKT</span>
            <a href="https://www.hko.gov.hk/tc/index.html" target="_blank" rel="noreferrer">查看天文台官方消息</a>
          </div>
        </details>;
      })}
    </div>
  </section>;
}
