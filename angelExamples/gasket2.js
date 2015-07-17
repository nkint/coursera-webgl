"use strict";

var canvas, gui;
var gl, program;

var points = [];
var colors = [];

var theta = 0.2;
var flag = false;
var subdivide = 2;
var wireframe = false;
var polygon = 4;
var radius = 0.5;


//------------------------------------------------------ webgl things

var self = this;

function initWebgl() {
  canvas = document.getElementById( "gl-canvas" );

  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl ) { alert( "WebGL isn't available" ); }

  gl.viewport( 0, 0, canvas.width, canvas.height );
  
  //  Load shaders and initialize attribute buffers

  program = initShaders( gl, "vertex-shader", "fragment-shader" );
  gl.useProgram( program );


  var controls = [];
  gui = new dat.GUI();
  controls.push( gui.add(self, 'theta', -3.15, 3.15) );
  controls.push( gui.add(self, 'subdivide', 1, 6).step(1) );
  controls.push( gui.add(self, 'wireframe') );
  controls.push( gui.add(self, 'polygon', 3, 10).step(1) );
  controls.push( gui.add(self, 'radius', 0.1, 1) );

  // call sketch() on each onChange
  controls.map(function(n) {
    n.onChange(function() {
      sketch()
    });
  });
}

//------------------------------------------------------ sketch


function sketch() {
  initPoints();
  initVBO();
  render();
};

function render()
{
  gl.clearColor( 0.952, 0.933, 0.909, 1.0 );
  gl.clear( gl.COLOR_BUFFER_BIT );
  
  if(wireframe) {
    for (var i=0; i<points.length; i+=3) {
      gl.drawArrays(gl.LINE_LOOP, i, 3);
    }
    gl.drawArrays( gl.LINE_LOOP, 0, 3 );
  } else {
    gl.drawArrays( gl.TRIANGLES, 0, points.length );  
  }
  
}

function initVBO() {
  // Load the data into the GPU

  var gBufferId = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, gBufferId );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
  var vPosition = gl.getAttribLocation( program, "vPosition" );
  gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  var cBufferId = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
  var vColor = gl.getAttribLocation( program, "vColor" );
  gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vColor );
}

function createPolygon(n, r) {
  var triangles = [];

  if(n==3) {
    triangles.push([
      vec2( -r, -r ), vec2(  0,  r ), vec2(  r, -r )
    ]);
    return triangles;
  }

  var a1=0,
      delta = Math.PI*2 / n,
      i, angle=a1,
      center=vec2(0,0);

  var p1, p2;
  for (i=1; i < n; i++) {
    p1 = vec2(r*Math.cos(angle),r*Math.sin(angle));
    angle = a1 + delta*i;
    p2 = vec2(r*Math.cos(angle),r*Math.sin(angle));
    var triangle = [ p1, center, p2 ];
    triangles.push(triangle);
  }

  // last one
  p1 = vec2(r*Math.cos(angle),r*Math.sin(angle));
  p2 = vec2(r*Math.cos(a1),r*Math.sin(a1));
  var triangle = [ p1, center, p2 ];
  triangles.push(triangle);

  return triangles;
}


function initPoints() {
  points = [];
  colors = [];

  var triangles = createPolygon(polygon, radius);

  var colors = [
    vec3(1,0,0),
    vec3(0,1,0),
    vec3(0,0,1),
  ];

  for(var i=0; i<triangles.length; ++i) {
    var vertices = triangles[i];
    divideTriangle( vertices[0], vertices[1], vertices[2], subdivide);  
  }
}

function rotate_xy(vertex){
  // vertex = [x,y];
  var d = flag ? 1 : Math.sqrt((vertex[0] * vertex[0]) + (vertex[1] * vertex[1]));
  var new_x = 0, new_y = 0;
  new_x = vertex[0] * Math.cos(d*theta) - vertex[1] * Math.sin(d*theta);
  new_y = vertex[0] * Math.sin(d*theta) + vertex[1] * Math.cos(d*theta);
  return [new_x, new_y];
}

var colorsBase = [
  vec3(0.937, 0.113, 0.372),
  vec3(0.058, 0.662, 0.329),
  vec3(0.0, 0.682, 1),
  vec3(0.329, 0.223, 0.431)
];

function triangle( a, b, c )
{
    points.push( rotate_xy(a), rotate_xy(b), rotate_xy(c) );

    var col = colorsBase[Math.floor(Math.random()*colorsBase.length)];
    colors.push(col, col, col);
}

function divideTriangle( a, b, c, count )
{

  // check for end of recursion

  if ( count === 0 ) {
    triangle( a, b, c );
  }
  else {

    //bisect the sides

    var ab = mix( a, b, 0.5 );
    var ac = mix( a, c, 0.5 );
    var bc = mix( b, c, 0.5 );

    --count;

    // three new triangles

    divideTriangle( a, ab, ac, count );
    divideTriangle( ab, b, bc, count );
    divideTriangle( ab, ac, bc, count );
    divideTriangle( ac, bc, c, count );
  }
}

//------------------------------------------------------ getter && setter


function setTheta(val, id){
  document.getElementById('range').innerHTML = val;
  var radian = (Math.PI * val)/180;
  theta = radian;

  sketch();
}
function setSubdivision(value, id){
  document.getElementById(id).innerHTML = value;
  subdivide = value;
  
  sketch();
}

//------------------------------------------------------ onload

window.onload = function() {
  initWebgl();
  sketch();
}