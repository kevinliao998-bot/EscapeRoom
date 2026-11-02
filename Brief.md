# 黃燈之後 · v2 故事簡報

2026-11-03 使用者核准：俯視像素、三場景、15–20 分鐘目標、兩結局。

林澄為尋找失蹤的妹妹林沐，回到第零層。01:17 的維修頻道帶來熟悉的聲音。他在重複的走廊找出不變標籤，在站務室校準廣播並比對被改動的記錄，最後沿供電的琥珀燈校正黃線路徑。紀錄能證實有人改動資料，不能證明當下的聲音身分或林沐生死。

終局：隔離重播支路、帶著問題離站；或回應聲音、暫緩離站。兩者都保留證據的不確定性。

故事、答案、文案與提示唯一來源：content/story.json。場景與謎題規格：docs/Puzzle-Spec.md。

```mermaid
flowchart TD
  V2_START["開場：顯示語音與維修頻道（V2_01）"] --> V2_CORRIDOR["走廊：不變標籤與最多三次返回（V2_02）"]
  V2_CORRIDOR --> V2_CARD["取得門禁卡；撬片可先拿（V2_03）"]
  V2_CARD --> V2_OFFICE["進站務室；保留返回走廊的路（V2_03）"]
  V2_OFFICE --> V2_POWER["撬片開盒、備用供電（V2_04）"]
  V2_POWER --> V2_WAVE["依貼紙校準波形，揭露三聲標記（V2_05）"]
  V2_WAVE --> V2_RECORDS["壓痕、文件連線、限縮結論（V2_06）"]
  V2_RECORDS --> V2_REWARDS["夾層路線片、電池倉電池（V2_07）"]
  V2_REWARDS --> V2_PLATFORM["月台：兩設備與供電相鄰節點（V2_08）"]
  V2_PLATFORM --> V2_CHOICE{"維修門與選擇前存檔（V2_09）"}
  V2_CHOICE -->|執行斷路| V2_END_A["甲：離站並保留疑問（V2_10）"]
  V2_CHOICE -->|回應聲音| V2_END_B["乙：拼接短卡與01:17（V2_11）"]
  V2_END_A --> V2_MENU["主選單：回看或回選擇前（V2_10、V2_11）"]
  V2_END_B --> V2_MENU
  V2_MENU -->|重選| V2_CHOICE
  V2_OFFICE -->|漏拿撬片可返回| V2_CORRIDOR
  V2_CORRIDOR -->|有卡可返回站務室| V2_OFFICE
  V2_WAVE -->|錯誤只改草稿| V2_WAVE
  V2_RECORDS -->|錯線可重試| V2_RECORDS
  V2_PLATFORM -->|錯路或重裝可重試| V2_PLATFORM```
