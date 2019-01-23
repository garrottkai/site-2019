// author: Kai Garrott <garrottkai@gmail.com>

/*---------- Set up scene with globe ----------*/

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
// var texture = new THREE.TextureLoader().load('assets/elevation.png');
// var material = new THREE.MeshBasicMaterial({
//   map: texture,
// });
var geometry = new THREE.SphereGeometry(15, 48, 48);
//var mesh = new THREE.Mesh(geometry, material);
var latitude = 0; // this is used when the scene is rendered
var pointSystem; // used later for data points
//scene.add(mesh /*, lighting*/ );

/*------- Parse data and display on globe -------*/

// split csv into 2d array of points
var getArray = (csv) => {
  let lines = csv.split('\n');
  let points = lines.map(line => line.split(','));
  points = points.map(point => point.map(val => Number(val)))
  return points;
};

var addData = (data) => {
  // //var dataGeometry = new THREE.Geometry();
  // var dataMaterial = new THREE.MeshBasicMaterial({
  //   color: 0xFFFFFF
  // });
  // //var dataCylinder = new THREE.Mesh(new THREE.CylinderBufferGeometry(.1, .1, 16, 5, 5));
  // var dataCylinder = new THREE.CylinderBufferGeometry(.1, .1, 16, 5, 5);
  // var allData = [];
  //
  // data.forEach(point => {
  //   let [lat, long, val] = point;
  //   let phi = (Math.PI / 180) * lat;
  //   let theta = (Math.PI / 180) * (long - 180);
  //
  //   let x = -16 * Math.cos(phi) * Math.cos(theta);
  //   let y = 16 * Math.sin(phi);
  //   let z = 16 * Math.cos(phi) * Math.sin(theta);
  //
  //   let dataVector = new THREE.Vector3(x, y, z);
  //   dataCylinder.position = dataVector;
  //   dataCylinder.lookAt(new THREE.Vector3(0, 0, 0));
  //   //dataGeometry.mergeMesh(dataCylinder);
  //   let dataMesh = new THREE.Mesh(dataCylinder, [new THREE.MeshBasicMaterial()]);
  //   allData.push(dataMesh);
  // });
  //
  // allData.forEach(item => {
  //   scene.add(item);
  // })

  var positions = new Float32Array(data.length * 3);
  //var colors = new Uint32Array(data.length);
  var colors = new Float32Array(data.length * 3);
  var dataGeometry = new THREE.BufferGeometry();

  // utility function for generating colors along a gradient based on the vegetation value from 0 to 1
  var getColor = val => {
    let lowR = 0, lowG = 0, lowB = 255;
    let highR = 0, highG = 255, highB = 0;

    let outR = (highR - lowR) * val + lowR;
    let outG = (highG - lowG) * val + lowG;
    let outB = (highB - lowB) * val + lowB;

    return {
        r: outR,
        g: outG,
        b: outB
    }
  }

  for (let i = 0; i < data.length; i ++) {

      let point = data[i];
      let [lat, long, val] = point;
      // is there a better way to get rid of the last, useless zero?
      if(lat == undefined || long == undefined || val == undefined) continue;

      let phi = (Math.PI / 180) * lat;
      let theta = (Math.PI / 180) * (long - 180);
      let x = -16 * Math.cos(phi) * Math.cos(theta);
      let y = -16 * Math.sin(phi);
      let z = 16 * Math.cos(phi) * Math.sin(theta);

      let pointVector = new THREE.Vector3(x, y, z).normalize();

      pointVector.multiplyScalar(15.1);

      let base = ((i + 1) * 3) - 3;

      positions[base] = pointVector.x;
      positions[base + 1] = pointVector.y;
      positions[base + 2] = pointVector.z;

      let color = getColor(val);

      //colors[base] = 0xff0000
      //let color = new THREE.Color(0,255,0);
      colors[base] = color.r;
      colors[base + 1] = color.g;
      colors[base + 2] = color.b;
  }

  dataGeometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
  dataGeometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));

  let loader = new THREE.TextureLoader();
  // var pointMap = loader.load('assets/circle.png');
  //
  // var pointMaterial = new THREE.PointsMaterial({
  //   //color: 0x00ff00,
  //   size: 0.2,
  //   map: pointMap,
  //   blending: THREE.AdditiveBlending,
  //   transparent: false
  // });

  let vertexShader = `

    attribute float size;
  	varying vec3 vColor;

  	  void main() {
  		vColor = color;
  		vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  		gl_PointSize = 4.0;
  		gl_Position = projectionMatrix * mvPosition;
  	  }

  `;

  let fragmentShader = `

      uniform sampler2D texture;
      varying vec3 vColor;

      void main() {
          gl_FragColor = vec4(vColor, 1.0);
          gl_FragColor = gl_FragColor * texture2D(texture, gl_PointCoord);
      }

  `;

  let uniforms = { texture: { value: loader.load( 'assets/circle.png' ), /*size: 0.2,*/ }};

  var shaderMaterial = new THREE.ShaderMaterial({
	uniforms: uniforms,
	vertexShader,
	fragmentShader,
	blending: THREE.AdditiveBlending,
	depthTest: false,
	transparent: false,
	vertexColors: true
  });

  // let geo = new THREE.BufferGeometry();
  // geo.mergeMesh(mesh);
  // geo.mergeMesh(new THREE.Mesh(dataGeometry));
  // scene.add(geo)

  pointSystem = new THREE.Points(dataGeometry, /*pointMaterial*/ shaderMaterial);
  scene.add(pointSystem);

};

//$(document).ready(() => {
jQuery.get('data/data.csv', data => {
  data = getArray(data);
  addData(data);
});
//});


/*------- Slider for latitude adjustment -------*/

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

/*---------------------------------------------*/


function animate() {
  requestAnimationFrame(animate);

  if(/*mesh && */pointSystem) { // don't rotate until everything is ready
      // rotate the model
      //mesh.rotation.y += 0.002;
      pointSystem.rotation.y += 0.002;
      // set the latitude angle to whatever the user has defined
      // need to convert degrees to radians
      //mesh.rotation.x = latitude * (Math.PI / 180);
      pointSystem.rotation.x = latitude * (Math.PI / 180);
  }
  renderer.render(scene, camera);
//  stats.update();
}

animate();
