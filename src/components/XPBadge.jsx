import { useEffect, useState } from "react";
import { getXP, getLevelInfo } from "../utils/xp";
import "./XPBadge.css";

function XPBadge() {
  const [info, setInfo] = useState(() => getLevelInfo(getXP()));
  useEffect(() => {
    const refresh = () => setInfo(getLevelInfo(getXP()));
    window.addEventListener("cybertrace-progress-synced", refresh);
    window.addEventListener("cybertrace-progress-changed", refresh);
    return () => {
      window.removeEventListener("cybertrace-progress-synced", refresh);
      window.removeEventListener("cybertrace-progress-changed", refresh);
    };
  }, []);

  return (
    <div className="xp-badge" title={`${info.xp} XP`}>
      <div className="xp-badge-text">
        <span className="xp-badge-level">المستوى {info.level}</span>
        <strong className="xp-badge-title">{info.title}</strong>
      </div>

      <div className="xp-badge-bar">
        <div
          className="xp-badge-fill"
          style={{ width: `${info.progress}%` }}
        ></div>
      </div>

      <span className="xp-badge-count">
        {info.next ? `${info.xp} / ${info.xp + info.xpForNext} XP` : `${info.xp} XP · أعلى مستوى`}
      </span>
    </div>
  );
}

export default XPBadge;