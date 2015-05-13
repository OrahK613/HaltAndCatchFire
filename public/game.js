
/*
	 Below is a 2D grid used for the terrain.  
	 The 1's and 2's represent walls with different textures.
	 The 0's represent space where the player can walk around.
 */
 var wallMatrix = [ // 1  2  3  4  5  6  7  8  9  10 11 12
				   [1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1,], // 0
				   [2, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1,], // 1
				   [2, 0, 0, 0, 0, 0, 0 ,1, 0, 1, 0, 0, 1,], // 2
				   [2, 2, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1,], // 3
				   [2, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1,], // 4
				   [2, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 2, 1,], // 5
				   [2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 1,], // 6
				   [2, 2, 1, 2, 1, 1, 0, 1, 0, 0, 0, 0, 1,], // 7
				   [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,], // 8
				   [2, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 1,], // 9
				   [2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1,], // 10
				   [2, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1,], // 11
				  ]; 
var wallMatrixCols = wallMatrix.length, wallMatrixRows = wallMatrix[0].length; walls=[], wallMeshes=[];
//var particle1, particle2, particle4, particle4, particle5, particle6;
//var lights,  laserCooked, laserBeam;
var	light;
var light1, light2, light3, light4, light5, light6;

// Global vars
var WIDTH = window.innerWidth,
	HEIGHT = window.innerHeight,
	ASPECT = WIDTH / HEIGHT,
	//UNITSIZE = 1,
	UNITSIZE = 10,
	WALLHEIGHT = UNITSIZE / 2.5,
	MOVESPEED = 100,
	LOOKSPEED = 0.075,
	BULLETMOVESPEED = MOVESPEED * 5,
	NUMAI = 5,
	PROJECTILEDAMAGE = 20;
	

var scene, cam, renderer, clock, projector, model, skin;

var sphereShape, sphereBody, world, physicsMaterial,balls=[], ballMeshes=[], boxes=[], boxMeshes=[];
var geometry, material, mesh, ground;
var controls,time = Date.now();

var blocker = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );

var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

if ( havePointerLock ) {

	var element = document.body;

	var pointerlockchange = function ( event ) {

		if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

			controls.enabled = true;

			blocker.style.display = 'none';

		} else {

			controls.enabled = false;

			blocker.style.display = '-webkit-box';
			blocker.style.display = '-moz-box';
			blocker.style.display = 'box';

			instructions.style.display = '';

		}

	}

	var pointerlockerror = function ( event ) {
		instructions.style.display = '';
	}

	// Hook pointer lock state change events
	document.addEventListener( 'pointerlockchange', pointerlockchange, false );
	document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
	document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

	document.addEventListener( 'pointerlockerror', pointerlockerror, false );
	document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
	document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

	instructions.addEventListener( 'click', function ( event ) {
		instructions.style.display = 'none';

		// Ask the browser to lock the pointer
		element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

		if ( /Firefox/i.test( navigator.userAgent ) ) {

			var fullscreenchange = function ( event ) {

				if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {

					document.removeEventListener( 'fullscreenchange', fullscreenchange );
					document.removeEventListener( 'mozfullscreenchange', fullscreenchange );

					element.requestPointerLock();
				}

			}

			document.addEventListener( 'fullscreenchange', fullscreenchange, false );
			document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

			element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

			element.requestFullscreen();

		} else {

			element.requestPointerLock();

		}

	}, false );

} else {

	instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

}


initCannon();
init();
animate();

function initCannon()
{
	// Setup our world
	world = new CANNON.World();
	world.quatNormalizeSkip = 0;
	world.quatNormalizeFast = false;

	var solver = new CANNON.GSSolver();

	world.defaultContactMaterial.contactEquationStiffness = 1e9;
	world.defaultContactMaterial.contactEquationRelaxation = 4;

	solver.iterations = 7;
	solver.tolerance = 0.1;
	var split = true;
	if(split)
		world.solver = new CANNON.SplitSolver(solver);
	else
		world.solver = solver;

	world.gravity.set(0,-20,0);
	world.broadphase = new CANNON.NaiveBroadphase();

	// Create a slippery material (friction coefficient = 0.0)
	physicsMaterial = new CANNON.Material("slipperyMaterial");
	var physicsContactMaterial = new CANNON.ContactMaterial(physicsMaterial,
															physicsMaterial,
															0.0, // friction coefficient
															0.3  // restitution
															);
	// We must add the contact materials to the world
	world.addContactMaterial(physicsContactMaterial);

	// Create a sphere
	var mass = 5, radius = 1.3;
	sphereShape = new CANNON.Sphere(radius);
	sphereBody = new CANNON.Body({ mass: mass });
	sphereBody.addShape(sphereShape);
	sphereBody.position.set(0,1,0);
	//sphereBody.position.set(0,5,0);
	sphereBody.linearDamping = 0.9;
	world.add(sphereBody);

	// Create a plane
	var groundShape = new CANNON.Plane();
	var groundBody = new CANNON.Body({ mass: 0 });
	groundBody.addShape(groundShape);
	groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
	world.add(groundBody);
}

function init() 
{

	cam = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
	
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x000000, 0, 500 );

	// Adds lighting for scene
	 var ambient = new THREE.AmbientLight( 0x111111 );
	scene.add( ambient );

	light = new THREE.SpotLight( 0xffffff );
	light.position.set( 10, 30, 20 );
	light.target.position.set( 0, 0, 0 );
	if(true){
		light.castShadow = true;

		light.shadowCameraNear = 20;
		light.shadowCameraFar = 50;//camera.far;
		light.shadowCameraFov = 40;

		light.shadowMapBias = 0.1;
		light.shadowMapDarkness = 0.7;
		light.shadowMapWidth = 2*512;
		light.shadowMapHeight = 2*512;

		//light.shadowCameraVisible = true;
	}
	scene.add( light );
	
	// Lighting
	 var directionalLight1 = new THREE.DirectionalLight( 0xF7EFBE, 0.7 );
	directionalLight1.position.set( 0.5, 1, 0.5 );
	scene.add( directionalLight1 );
	var directionalLight2 = new THREE.DirectionalLight( 0xF7EFBE, 0.5 );
	directionalLight2.position.set( -0.5, -1, -0.5 );
	scene.add( directionalLight2 );
	
	
	var intensity = 2.5;
	var distance = 100;
	var c1 = 0xff0040, c2 = 0x0040ff, c3 = 0x80ff80, c4 = 0xffaa00, c5 = 0x00ffaa, c6 = 0xff1100;
	//var c1 = 0xffffff, c2 = 0xffffff, c3 = 0xffffff, c4 = 0xffffff, c5 = 0xffffff, c6 = 0xffffff;
	var sphere = new THREE.SphereGeometry( 0.25, 16, 8 );

	light1 = new THREE.PointLight( c1, intensity, distance );
	light1.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: c1 } ) ) );
	scene.add( light1 );
	
	controls = new PointerLockControls( cam , sphereBody );
	scene.add( controls.getObject() );
	
	
	

	light2 = new THREE.PointLight( c2, intensity, distance );
	light2.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: c2 } ) ) );
	scene.add( light2 );

	light3 = new THREE.PointLight( c3, intensity, distance );
	light3.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: c3 } ) ) );
	scene.add( light3 );

	light4 = new THREE.PointLight( c4, intensity, distance );
	light4.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: c4 } ) ) );
	scene.add( light4 );

	light5 = new THREE.PointLight( c5, intensity, distance );
	light5.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: c5 } ) ) );
	scene.add( light5 );

	light6 = new THREE.PointLight( c6, intensity, distance );
	light6.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: c6 } ) ) );
	scene.add( light6 );

	var dlight = new THREE.DirectionalLight( 0xffffff, 0.1 );
	dlight.position.set( 0.5, -1, 0 ).normalize();
	scene.add( dlight ); 
				
	
	// World objects
	//setupScene();
	
	 // ground
   //groundGeometry = new THREE.PlaneGeometry( wallMatrixCols * UNITSIZE * 1.3, wallMatrixCols * UNITSIZE * 1.3, 10, 10 );
   //groundGeometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
	
	//material = new THREE.MeshLambertMaterial( { color: 0xdddddd } );
	//var groundTexture = THREE.ImageUtils.loadTexture( "images/stone_ground.png" );
	//groundTexture.repeat.set( 10, 10 );
	//groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
	//groundTexture.format = THREE.RGBFormat;
	//var groundMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, map: groundTexture } );
  
	//ground = new THREE.Mesh( groundGeometry, material );
	
	//ground.castShadow = true;
	//ground.receiveShadow = true;
	//scene.add( ground );
	

	
	renderer = new THREE.WebGLRenderer();
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( scene.fog.color, 1 );
	document.body.appendChild(renderer.domElement); // Adds the canvas to the document
	window.addEventListener( 'resize', onWindowResize, false );
	
	
	// World objects
	setupScene();
}


function setupScene()
{
	
   // ground
   groundGeometry = new THREE.PlaneGeometry( wallMatrixCols * UNITSIZE * 1.3, wallMatrixCols * UNITSIZE * 1.3, 10, 10 );
   groundGeometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
	
	material = new THREE.MeshLambertMaterial( { color: 0xdddddd } );
	var groundTexture = THREE.ImageUtils.loadTexture( "images/stone_ground.png" );
	groundTexture.repeat.set( 10, 10 );
	groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
	groundTexture.format = THREE.RGBFormat;
	var groundMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, map: groundTexture } );
  
	ground = new THREE.Mesh( groundGeometry, groundMaterial );
	
	ground.castShadow = true;
	ground.receiveShadow = true;
	scene.add( ground );

   // walls
	var halfExtents = new CANNON.Vec3(UNITSIZE/2,WALLHEIGHT/2,UNITSIZE/2);
	
	var boxShape = new CANNON.Box(halfExtents);
	var wallGeometry = new THREE.BoxGeometry(halfExtents.x * 2,halfExtents.y * 2,halfExtents.z * 2);
	
		 var wallMaterials = [
		 new THREE.MeshLambertMaterial({/*color: 0x00CCAA,*/map: THREE.ImageUtils.loadTexture('images/light_stone.jpg')}),
		 new THREE.MeshLambertMaterial({/*color: 0xC5EDA0,*/map: THREE.ImageUtils.loadTexture('images/ornate.jpg')}),
		 new THREE.MeshLambertMaterial({color: 0xFBEBCD}),
		 ]; 
	 // /*
		// We loop over the map array to create the cubes representing the walls.
		// Each cube is then placed in position.
		// The material texture is an image, which is stretched across each cube face.
	 // */
	 for (var column = 0; column < wallMatrixCols; column++) 
	 {
		 
		  for (var row = 0, m = wallMatrix[column].length; row < m; row++) 
		  {
			 
			  if (wallMatrix[column][row]) 
			  {
				
				  var x = (column - wallMatrixCols/2) * UNITSIZE;
				
				  var y = WALLHEIGHT/2;
				
				  var z = (row - wallMatrixCols/2) * UNITSIZE;
				  var wallBody = new CANNON.Body({ mass: 0 });
				  wallBody.addShape(boxShape);
				
				  var wallMesh = new THREE.Mesh(wallGeometry, wallMaterials[wallMatrix[column][row]-1]);
				  world.add(wallBody);
				  scene.add(wallMesh);
				  
				  wallBody.position.set(x,y,z);
				  wallMesh.position.set(x,y,z);
				  
				  wallMesh.castShadow = true;
				  wallMesh.receiveShadow = true;
				  
				  walls.push(wallBody);
				  wallMeshes.push(wallMesh);
			  }
		  }
	 }
	
	
}

function onWindowResize() {
	cam.aspect = window.innerWidth / window.innerHeight;
	cam.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

var dt = 1/60;

function animate() 
{
	var light_time = Date.now() * 0.00025;
	var d = 150;
	
	requestAnimationFrame( animate );
	if(controls.enabled)
	{
		world.step(dt);

		// Update ball positions
		for(var i=0; i<balls.length; i++)
		{
			ballMeshes[i].position.copy(balls[i].position);
			ballMeshes[i].quaternion.copy(balls[i].quaternion);
		}
		
		// Update walls
		for(var i=0; i<walls.length; i++){
			wallMeshes[i].position.copy(walls[i].position);
			wallMeshes[i].quaternion.copy(walls[i].quaternion);
		}
		
	
		
		light1.position.x = Math.sin( light_time * 0.7 ) * d;
		light1.position.y = Math.sin( light_time * 0.5 ) * d;
		light1.position.z = Math.cos( light_time * 0.3 ) * d;

		light2.position.x = Math.cos( light_time * 0.3 ) * d;
		light2.position.y = Math.cos( light_time * 0.1 ) * d;
		light2.position.z = Math.sin( light_time * 0.7 ) * d;

		light3.position.x = Math.sin( light_time * 0.7 ) * d;
		light3.position.y = Math.sin( light_time * 0.2 ) * d;
		light3.position.z = Math.sin( light_time * 0.5 ) * d;

		light4.position.x = Math.sin( light_time * 0.3 ) * d;
		light4.position.y = Math.sin( light_time * 0.3 ) * d;
		light4.position.z = Math.sin( light_time * 0.5 ) * d;

		light5.position.x = Math.cos( light_time * 0.3 ) * d;
		light5.position.y = Math.cos( light_time * 0.8 ) * d;
		light5.position.z = Math.sin( light_time * 0.5 ) * d;

		light6.position.x = Math.cos( light_time * 0.7 ) * d;
		light6.position.y = Math.cos( light_time * 0.4 ) * d;
		light6.position.z = Math.cos( light_time * 0.5 ) * d; 
		
	
	}
	controls.update( Date.now() - time );
	renderer.render( scene, cam );
	time = Date.now();	
	
}


var ballShape = new CANNON.Sphere(0.2);
var ballGeometry = new THREE.SphereGeometry(ballShape.radius, 32, 32);
var shootDirection = new THREE.Vector3();
var shootVelo = 15;
var projector = new THREE.Projector();
function getShootDir(targetVec){
	var vector = targetVec;
	targetVec.set(0,0,1);
	projector.unprojectVector(vector, cam);
	var ray = new THREE.Ray(sphereBody.position, vector.sub(sphereBody.position).normalize() );
	targetVec.copy(ray.direction);
}



 window.addEventListener("click",function(e){
	if(controls.enabled==true){
		var x = sphereBody.position.x;
		var y = sphereBody.position.y;
		var z = sphereBody.position.z;
		var ballBody = new CANNON.Body({ mass: 1 });
		ballBody.addShape(ballShape);
		var ballMesh = new THREE.Mesh( ballGeometry, material );
		world.add(ballBody);
		scene.add(ballMesh);
		ballMesh.castShadow = true;
		ballMesh.receiveShadow = true;
		balls.push(ballBody);
		ballMeshes.push(ballMesh);
		getShootDir(shootDirection);
		ballBody.velocity.set(  shootDirection.x * shootVelo,
								shootDirection.y * shootVelo,
								shootDirection.z * shootVelo);

		// Move the ball outside the player sphere
		x += shootDirection.x * (sphereShape.radius*1.02 + ballShape.radius);
		y += shootDirection.y * (sphereShape.radius*1.02 + ballShape.radius);
		z += shootDirection.z * (sphereShape.radius*1.02 + ballShape.radius);
		ballBody.position.set(x,y,z);
		ballMesh.position.set(x,y,z);
	}
});
