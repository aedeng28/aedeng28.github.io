const svgNS = "http://w3.org"
  
const svgCanvas = document.getElementbyId("tree")

function branch(a,b,x){
  return  Math.floor(a/b)-((x*a)%b);
}
function createcircle(cx,cy,r){
  const newShape = document.createElementNS(svgNS,"circle")
  newShape.setAttribute("cx", cx)
  newShape.setAttribute("cy", cy)
  newShape.setAttribute("r", r)
  svgCanvas.appendChild(newcircle)
