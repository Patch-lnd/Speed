const button = document.querySelector("button");
// Converting File size from byte to bit
const size =(1965253)*8;
const test_count = 160;
// Frontend 
const progress = document.querySelector("progress");
const speedTest = document.querySelector("speed-test")

let speed_result = [];

function loadImage(){
    return new Promise((resolve, reject) => {
        let image = new Image()
        image.src = "./img1.gif?"+ parseInt(Math.random()*10000);
        let startTime = Date.now();

        /* console.log(startTime); */

        image.onload = function(){
          /*   console.log("Image Loaded"); */
            let endTime =  Date.now();
            resolve(endTime - startTime);
        }
        image.onerror =  function(err){
            reject(err);
        } 
    })
}
async function loadSpeed(){
    if (loadTime < 1) loadTime = 1;
    let loadTime = await loadImage;
    let speed_bps = size/loadTime;
    let speed_kps =  speed_bps/1024;
}

function avSpeed(){
    let sum = speed_result.reduce((a,b)=> a+b, 0);
    return sum/speed_result.length;
}

button.addEventListener('click', async function(){
    for (let i = 0; i < test_count; i++) {
      let speed =  await loadImage();
        speed_result.push(speed);   
        progress.style.width = ((i+1)/test_count*100)+"%";
    }
    console.log(avSpeed());
    speedTest.innerText = avSpeed().toFixed(2)+" kps";
})