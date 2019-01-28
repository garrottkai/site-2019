// author: Kai Garrott <garrottkai@gmail.com>

/*---------- Set up scene with globe ----------*/
var renderer,
  scene,
  camera,
  mesh,
  pointSystem, // used later for data points
  latitude = 0; // this is used when the scene is rendered

function setupScene() {

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('container').insertBefore(renderer.domElement, document.getElementById('overlay'));

  scene = new THREE.Scene();

  let fov = 75;
  let aspect = window.innerWidth / window.innerHeight;
  let nearClippingPlane = 0.1;
  let farClippingPlane = 5000;

  camera = new THREE.PerspectiveCamera(fov, aspect, nearClippingPlane, farClippingPlane);
  camera.position.set(0, 0, 30);

  // handle window abuse

  onWindowResize = () => {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

  }

  window.addEventListener('resize', onWindowResize, false);

  // var stats = new Stats();
  // document.body.appendChild(stats.dom);

  //var lighting = new THREE.PointLight(0x89E3FF, 0.1, 0);
  let texture = new THREE.TextureLoader().load('assets/elevation.png');
  let material = new THREE.MeshBasicMaterial({
    color: 0x000000
  });
  var geometry = new THREE.SphereGeometry(15, 48, 48);
  mesh = new THREE.Mesh(geometry, material);

  scene.add(mesh /*, lighting*/ );

}

// fetch CSV with data
function getArray(csv) {

  let lines = csv.split('\n');
  let points = lines.map(line => line.split(','));
  points = points.map(point => point.map(val => Number(val)));

  return points;

}

// utility function for generating colors along a gradient based on the vegetation value from 0 to 1
function getColor(val) {

  let lowR = 236,
    lowG = 224,
    lowB = 215;
  let highR = 11,
    highG = 36,
    highB = 3;

  let outR = (highR - lowR) * val + lowR;
  let outG = (highG - lowG) * val + lowG;
  let outB = (highB - lowB) * val + lowB;

  return {
    r: outR < 255 ? Math.round(outR) : 255,
    g: outG < 255 ? Math.round(outG) : 255,
    b: outB < 255 ? Math.round(outB) : 255
  }

}

// parse data and add points to model
function addData(data) {

  let positions = new Float32Array(data.length * 3);
  //var colors = new Uint32Array(data.length);
  let colors = new Float32Array(data.length * 3);
  let dataGeometry = new THREE.BufferGeometry();

  for (let i = 0; i < data.length; i++) {

    let point = data[i];
    let [lat, long, val] = point;
    // is there a better way to get rid of the last, useless zero?
    if (lat == undefined || long == undefined || val == undefined) continue;

    // get vectors from lat/long pairs
    let phi = (Math.PI / 180) * lat;
    let theta = (Math.PI / 180) * (long - 180);
    let x = -16 * Math.cos(phi) * Math.cos(theta);
    let y = -16 * Math.sin(phi);
    let z = 16 * Math.cos(phi) * Math.sin(theta);

    let pointVector = new THREE.Vector3(x, y, z).normalize();

    pointVector.multiplyScalar(15.1); // 0.1 above background sphere to avoid clipping at oblique angles

    let base = ((i + 1) * 3) - 3;

    positions[base] = pointVector.x;
    positions[base + 1] = pointVector.y;
    positions[base + 2] = pointVector.z;

    let rgb = getColor(val);
    // using this to get values between 0 and 1 rather than 0 and 255
    let color = new THREE.Color(`rgb(${rgb.r},${rgb.g},${rgb.b})`);
    colors[base] = color.r;
    colors[base + 1] = color.g;
    colors[base + 2] = color.b;

  }

  dataGeometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
  dataGeometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));

  // need to manually create shaders to allow individually assigning colors to points

  let vertexShader = `

    attribute float size;
  	varying vec3 vColor;

  	  void main() {
  		vColor = color;
  		vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  		gl_PointSize = 5.0;
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

  let loader = new THREE.TextureLoader();

  let uniforms = {
    texture: {
      value: loader.load('assets/hard-circle.png')
    }
  };

  let shaderMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader,
    fragmentShader,
    blending: THREE.AdditiveBlending,
    depthTest: true,
    transparent: false,
    vertexColors: true
  });

  pointSystem = new THREE.Points(dataGeometry, shaderMaterial);
  scene.add(pointSystem);

}

/*------- Slider for latitude adjustment -------*/
function setupSlider() {

  let slider = null;
  let handle = null;
  let mouseY = 0;
  let handleY = 0;
  let sliderTop = null;
  let sliderBot = null;

  document.getElementById('slider').onmousedown = function() {
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

    if (slider !== null && handle !== null) {

      let pos;
      let tryPos = mouseY;

      if (tryPos < sliderTop) {

        pos = sliderTop;

      } else if (tryPos > sliderBot) {

        pos = sliderBot;

      } else {

        pos = tryPos;

      }

      handle.style.top = pos - sliderTop - /*handle radius:*/ 12 + 'px';
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

}
/*---------------------------------------------*/


function animate() {

  requestAnimationFrame(animate);

  if (mesh && pointSystem) { // don't rotate until everything is ready
    // rotate the model
    mesh.rotation.y += 0.002;
    pointSystem.rotation.y += 0.002;
    // set the latitude angle to whatever the user has defined
    // need to convert degrees to radians
    mesh.rotation.x = latitude * (Math.PI / 180);
    pointSystem.rotation.x = latitude * (Math.PI / 180);

  }

  renderer.render(scene, camera);
  //  stats.update();

}

// Run things

setupScene();

jQuery.get('data/data.csv', data => {
  data = getArray(data);
  addData(data);
});

setupSlider();

animate();
