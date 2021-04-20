function main() {
  // Get the rendering context
  const canvas = document.querySelector('.my-canvas');
  const gl = canvas.getContext('webgl'); // sometimes declared as 'ctx'

  if (!gl) {
    throw new Error('This browser does not support webgl');
  }

  // Set clear color to black and fully opaque;
  // Color values are from 0 to 1
  gl.clearColor(0, 0, 0, 1);
  // Clear the color buffer with clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

  const shaderProgram = initShaderProgram(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);

  const programInfo = {
    program: shaderProgram,
    // Attributes get their value from the buffer. They change with each shader iteration
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    },
    // Uniforms are globals that do not change with each shader iteration
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
  };

  const buffers = initBuffers(gl);
  drawScene(gl, programInfo, buffers);
}

/** * The vertext shader program *
 * This transforms a vertex from an arbitrary input shape into "clip space"
 */
const VERTEX_SHADER_SOURCE =`
  attribue vec4 aVertexPosition;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  void main() {
    // Magic variable already declared by webGL
    gl_position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  void main() {
    // Magic variable already declared by webGL
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
`;


function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    throw new Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
  }

  return shaderProgram;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    throw new Error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
  }
  return shader;
}

function initBuffers(gl) {
  // Buffer for vertex positions
  const positionBuffer = gl.createBuffer();

  const positions = [
    -1.0, 1.0,
    1.0, 1.0,
    -1.0, 1.0,
    1.0, 1.0,
    // -0.5, 0.5, 0.0,
    // -0.5,-0.5, 0.0,
    //  0.5,-0.5, 0.0,
  ];
  
  gl.bufferData(
    /* target */ gl.ARRAY_BUFFER,
    /* source data */ new Float32Array(positions),
    /* usage */ gl.STATIC_DRAW,
  );

  return {position: positionBuffer}
}

function drawScene(gl, programInfo, buffers) {
  // Clear to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear Everything
  gl.clearDepth(1.0);
  // Enable depth testing
  gl.enable(gl.DEPTH_TEST);
  // Nearest things obscure far things.
  gl.depthFunc(gl.LEQUAL);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // 45 degress in radians
  const fieldOfView = 45 * Math.PI / 180;
  const aspectRatio = gl.canvas.clientWidth / gl.canvas.clientHeight;

  // Only render things that are 0.1 to 100.0 units away from camera
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  mat4.perspective(projectionMatrix, fieldOfView, aspectRatio, zNear, zFar);

  const modelViewMatrix = mat4.create();

  mat4.translate(
    /* Destination matrix */ modelViewMatrix,
    /* Matrix to translate */ modelViewMatrix,
    /* Amount to translate */[0.0, 0.0, -6.0]
  );

  // Set up attributes
  {
    // The type of data in the buffer, 32bit float
    const type = gl.FLOAT;
    // Pull out 2 components out of the buffer every shader iteration.
    // Will be 64 bit chunk
    const numComponents = 2;

    // Can ignore, do not normalize, stride, or offset
    const normalize = false;
    // do not stride, use components above
    const stride = 0;
    // Start reading from beginning of chunk
    const offset = 0;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    // Use settings declared above to tell the GL how to read the buffer
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }

  gl.useProgram(programInfo.program);

  // Set the shader uniforms
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix,
  );
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    projectionMatrix,
  );

  {
    const offset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
}


window.onload = main;