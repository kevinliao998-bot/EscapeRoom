export interface Spot {
  id: string;
  label: string;
  x: number;
  y: number;
  art?: string;
}
const device = (
  id: string,
  label: string,
  x: number,
  art = "console",
): Spot => ({ id, label, x, y: 111, art });
export const spots: Record<string, Spot[]> = {
  distribution: [
    device("wiring", "回路與固定架", 136, "panel"),
    device("power", "四格供電盤", 280, "console"),
    device("b1docs", "現場工單", 392, "cabinet"),
  ],
  pump: [
    device("pipes", "管線與檢修窗", 136, "panel"),
    device("valves", "四閥排水台", 280, "console"),
    device("check", "止回閥標牌", 392, "lightbox"),
  ],
  vestibule: [
    device("gateHistory", "當年故障單", 136, "cabinet"),
    device("gate", "隔離門與放行", 280, "panel"),
    device("stairs", "樓層通道", 424, "lightbox"),
  ],
  monitor: [
    device("calibration", "備援校時測試", 136, "lightbox"),
    device("timeline", "事故事件時間線", 280, "console"),
    device("D07", "M-042 簽領原件", 392, "cabinet"),
  ],
  recording: [
    device("audio", "錄音與設備狀態", 136, "console"),
    device("splice", "原音與剪接波形", 280, "map"),
    device("D04", "撤離與復位列印", 392, "cabinet"),
  ],
  evidence: [
    device("cards", "維修憑證保管格", 136, "cabinet"),
    device("D05", "鑰匙領用副本", 280, "panel"),
    device("stairs", "工作井往 B3", 424, "lightbox"),
  ],
  observation: [
    device("grid", "雙路配電與銘牌", 136, "panel"),
    device("D13", "電源邊界標牌", 280, "map"),
    device("controller", "實體 K-CTRL", 392, "panel"),
  ],
  interlock: [
    device("bolts", "互鎖把手與觀察孔", 136, "console"),
    device("records", "救援與身分原件", 280, "cabinet"),
    device("history", "復位與通知歷史", 392, "cabinet"),
  ],
  control: [
    device("shutdown", "停機檢修終端", 136, "console"),
    device("controller", "實體 K-CTRL", 280, "panel"),
    device("elevator", "離站升降梯", 424, "lightbox"),
  ],
};
