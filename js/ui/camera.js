/* 戰場／大地圖共用鏡頭幾何；座標與 UI 狀態由各場景持有。 */
function clampSceneCamera(c,view,size,margin={x:0,y:0}){
 const lim=(v,viewport,content,m)=>content+2*m<=viewport?(viewport-content)/2:Math.min(m,Math.max(viewport-content-m,v));
 return {x:lim(c.x,view.w,size.w,margin.x),y:lim(c.y,view.h,size.h,margin.y)};
}
function sceneZoomCamera(camera,oldZoom,newZoom,oldPoint,newPoint=oldPoint){
 return {x:newPoint.x-(oldPoint.x-camera.x)/oldZoom*newZoom,y:newPoint.y-(oldPoint.y-camera.y)/oldZoom*newZoom};
}
