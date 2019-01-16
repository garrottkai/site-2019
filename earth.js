// author: Kai Garrott <garrottkai@gmail.com>

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').insertBefore(renderer.domElement, document.getElementById('overlay'));

var scene = new THREE.Scene();

var fov = 75;
var aspect = window.innerWidth / window.innerHeight;
var nearClippingPlane = 0.1;
var farClippingPlane = 5000;
var camera = new THREE.PerspectiveCamera(fov, aspect, nearClippingPlane, farClippingPlane);
camera.position.set(0, 0, 30);

window.addEventListener( 'resize', onWindowResize, false );


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

// var stats = new Stats();
// document.body.appendChild(stats.dom);

//var lighting = new THREE.PointLight(0x89E3FF, 0.1, 0);
var texture = new THREE.TextureLoader().load('assets/elevation.png');
var material = new THREE.MeshBasicMaterial({
  map: texture,
});
var geometry = new THREE.SphereGeometry(15, 48, 48);
var mesh = new THREE.Mesh(geometry, material);
var latitude = 0;
scene.add(mesh /*, lighting*/ );

// var getArray = (csv) => {
//   let lines = csv.split('\n');
//   lines.map(line => line.split(','));
//   return lines;
// };

// var addData = (data) => {
//   //var dataGeometry = new THREE.Geometry();
//   var dataMaterial = new THREE.MeshBasicMaterial({
//     color: 0xFFFFFF
//   });
//   //var dataCylinder = new THREE.Mesh(new THREE.CylinderBufferGeometry(.1, .1, 16, 5, 5));
//   var dataCylinder = new THREE.CylinderBufferGeometry(.1, .1, 16, 5, 5);
//   var allData = [];
//
//   data.forEach(point => {
//     let [lat, long, val] = point;
//     let phi = (Math.PI / 180) * lat;
//     let theta = (Math.PI / 180) * (long - 180);
//
//     let x = -16 * Math.cos(phi) * Math.cos(theta);
//     let y = 16 * Math.sin(phi);
//     let z = 16 * Math.cos(phi) * Math.sin(theta);
//
//     let dataVector = new THREE.Vector3(x, y, z);
//     dataCylinder.position = dataVector;
//     dataCylinder.lookAt(new THREE.Vector3(0, 0, 0));
//     //dataGeometry.mergeMesh(dataCylinder);
//     let dataMesh = new THREE.Mesh(dataCylinder, [new THREE.MeshBasicMaterial()]);
//     allData.push(dataMesh);
//   });
//
//   allData.forEach(item => {
//     scene.add(item);
//   })
//
// };

// //$(document).ready(() => {
// jQuery.get('data/data.csv', data => {
//   data = getArray(data);
//   addData(data);
// });
// //});


/*-- Slider for latitude adjustment --*/

var slider = null;
var handle = null;
var mouseY = 0;
var handleY = 0;
var sliderTop = null;
var sliderBot = null;

document.getElementById('slider').onmousedown = function () {
    start(this);
};

function start(element) {
    slider = element;
    sliderTop = element.offsetTop;
    sliderBot = sliderTop + 200;
    handle = element.querySelector('#handle');
    handleY = mouseY - handle.offsetTop;
}

function move(element) {
    mouseY = element.pageY;

    if(slider !== null && handle !== null) {

        let pos;
        let tryPos = mouseY;
        if(tryPos < sliderTop) {
            pos = sliderTop;
        } else if(tryPos > sliderBot) {
            pos = sliderBot;
        } else {
            pos = tryPos;
        }
        handle.style.top = pos - sliderTop - /*handle radius:*/12 + 'px';
        // get latitude degrees from relative slider position
        // range: 23.5N to 23.5S
        latitude = (pos - sliderTop - 100) * .235;
    }
}

function end() {
    slider = null;
    handle = null;
}

document.onmousemove = move;
document.onmouseup = end;

/*------------------------------------*/


function animate() {
  requestAnimationFrame(animate);

  // rotate the model
  mesh.rotation.y += 0.002;
  // set the latitude angle to whatever the user has defined
  // need to convert degrees to radians
  mesh.rotation.x = latitude * (Math.PI / 180);

  renderer.render(scene, camera);
//  stats.update();
}

animate();
