/* 大地圖地點。座標是地圖上的位置（地圖寬 1000、高 700，左上角是 0,0）。
   改 x、y 就能搬動地點，周圍的森林樹木、房子、山和道路都會跟著走。
   links：跟哪些地點有路相連（style: "road" 大路 / "trail" 小徑） */
const WORLD = {
  width: 1000, height: 700,
  locations: [
    {id:"town",   name:"城鎮",       kind:"town",   x:584, y:513,
     desc:"山腳下的小鎮。"},
    {id:"tavern", name:"軟呼呼酒館", kind:"tavern", x:882, y:556,
     desc:"矮人大爺的酒館，在城鎮東邊的郊外。"},
    {id:"forest", name:"森林",       kind:"forest", x:681, y:244,
     desc:"鎮外的森林，最近怪怪的。"},
    {id:"cave",   name:"洞窟",       kind:"cave",   x:200, y:407,
     desc:"城鎮西邊丘陵裡的洞窟。"}
  ],
  links: [
    {a:"tavern", b:"town",   style:"road"},
    {a:"town",   b:"forest", style:"road"},
    {a:"town",   b:"cave",   style:"road"}
  ]
};
