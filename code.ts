// After selecting items, this plugin will open a modal to prompt the user to enter a 
// number (px) and orientation and modify the space between selections accordingly.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser enviroment (see documentation).

// Helper Function: Reorder Array of Objects based on Object Value
const compareValues = (key, order='asc') => {
  return function(a, b) {
    if(!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
      // property doesn't exist on either object
      return 0;
    }

    const varA = (typeof a[key] === 'string') ?
      a[key].toUpperCase() : a[key];
    const varB = (typeof b[key] === 'string') ?
      b[key].toUpperCase() : b[key];

    let comparison = 0;
    if (varA > varB) {
      comparison = 1;
    } else if (varA < varB) {
      comparison = -1;
    }

    return (
      (order == 'desc') ? (comparison * -1) : comparison
    );
  };
}

// Helper Function: Calculate vertices of a rotated rectangle
function getRectFourPoints(x,y, width, height, ang) {

  let rad = ang * (Math.PI / 180) 
  
	let points = {
    first: {x,y},
    second: null,
    third: null,
    fourth: null,
    center: null,
    bounding:{
      width:null,
      height:null,
      x:null,
      y:null
    },
    offset: {
      x:null,
      y:null
    },
  }

	const sinAng = Math.sin(rad)	
  const cosAng = Math.cos(rad)
  
	points.second = {x: x + cosAng * width, y: y - sinAng * width}
	
	points.third = {x: x + sinAng * height, y: y + cosAng * height}
	
  points.fourth = {x: points.second.x + sinAng * height, y: points.second.y + cosAng * height}
  
  points.center = {x: (x+points.fourth.x)/2, y:(y+points.fourth.y)/2}

  points.bounding.width = Math.abs(sinAng) * height + Math.abs(cosAng) * width
  points.bounding.height = Math.abs(sinAng) * width + Math.abs(cosAng) * height

  points.bounding.x = points.center.x - points.bounding.width/2
  points.bounding.y = points.center.y - points.bounding.height/2

  points.offset.x = x - points.bounding.x 
  points.offset.y = y - points.bounding.y

	return points
}

let init = () => {
  if(figma.currentPage.selection.length > 1){

    figma.clientStorage.getAsync('distribute_by').then((res)=>{
      figma.ui.postMessage(res)
    })

    figma.showUI(__html__,{ width: 200, height: 200 });

    figma.ui.onmessage = (msg) => {
      if (msg.type === 'distance') {
        figma.clientStorage.setAsync('distribute_by',msg.config)
        // console.log(msg.config)
        let counter = 0;
        let ifCenter = (msg.config.fromCenter) ? .5 : 1

        let nodesSorted = []
        figma.currentPage.selection.forEach(e=>{
          const calc = getRectFourPoints(e.x,e.y,e.width,e.height,e.rotation)
          nodesSorted.push({
            id:e.id,
            x:calc.bounding.x,
            y:calc.bounding.y,
            width:calc.bounding.width,
            height:calc.bounding.height,
            offset:calc.offset,
            node:e
          })
        })

        nodesSorted.sort(compareValues(msg.config.axis));

        nodesSorted.forEach((e,i)=>{

          let nodeBoundingDim = (msg.config.axis === 'x') ? e.width : e.height 

          if(i===0){
            let startCoor = e[msg.config.axis]
            counter += startCoor + (nodeBoundingDim * ifCenter) + msg.config.amount
          }else{
            e.node[msg.config.axis] = counter + e.offset[msg.config.axis]
            counter += msg.config.amount + (nodeBoundingDim * ifCenter)
          }

        })
      }
      figma.closePlugin();
    };
  }else{
    figma.closePlugin();
  }
}

init()



