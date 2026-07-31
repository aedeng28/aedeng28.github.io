const svgNS = "http://w3.org";
  
const svgCanvas = document.getElementbyId("tree");

function branch(a,b,x){
  return  Math.floor(a/b)-((x*a)%b);
}
function createcircle(cx,cy,r){
  const newShape = document.createElementNS(svgNS,"circle");
  newShape.setAttribute("cx", cx);
  newShape.setAttribute("cy", cy);
  newShape.setAttribute("r", r);
  svgCanvas.appendChild(newShape);
}
function createline(x1,y1,x2, y2){
  const newShape = document.createElementNS(svgNS,"circle");
  newShape.setAttribute("x1", x1);
  newShape.setAttribute("y1", y1);
  newShape.setAttribute("x2", x2);
  newShape.setAttribute("y2", y2);
  svgCanvas.appendChild(newShape);
}
// creates a circle between beta and betb, with fraction a/b
// circfrac(1,2,25,50,0,5)
// .......o..
// 0   25  |  50
function circfrac(a,b,beta,betb,y,r){
  createcircle(beta+(((betb-beta)*a)/b),y,r)
// creates n lines between xl and xh with start point x,y
function lineran(x,y,yn,xl,xh,n) {
  for (let i = 1; i < n; i++) {
    createline(x,y,((xl+(xh*i)/n)+(xl+(xh*(i-1))/n)/2),yn)
  {
