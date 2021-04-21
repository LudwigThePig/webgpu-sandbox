// I do not think this will even run but that is no too important. The goal of this is to highlight
// the differences between WebGPU and WebGL for a tech talk.
// Code comes from https://www.willusher.io/graphics/2020/06/15/0-to-gltf-triangle


main();

//
// Start here
//
function main() {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();

  const canvas = document.querySelector('.my-canvas');
  const gl = canvas.getContext('gpupresent');

  
  // If we don't have a GL context, give up now
  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  
  // Vertex shader program
  const vsByteCode = new Uint32Array([0x07230203,0x00010000,0x000d0008 /* ... */]);
  
  // Fragment shader program
  const fsByteCode = new Uint32Array([0x07230203,0x00010000,0x000d0008 /* ... */]);

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(device, vsByteCode, fsByteCode);

  // Collect all the info needed to use the shader program.
  // Look up which attribute our shader program is using
  // for aVertexPosition and look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(device);

  // Draw the scene
  drawScene(gl, programInfo, buffers);

  requestAnimationFrame(() => frame(device));
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple two-dimensional square.
//
function initBuffers(device) {

  const dataBuffer = device.createBuffer({
    size: 3 * 2 * 4 * 4,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  
  // Now create an array of positions for the triangle.
  const positions = [
    0, 1.0, // Top Point
    -1.0, -1.0, // Bottom Left Point
    1.0, -1,0, // Bottom Right Point
  ];

  // Interleaved positions and colors as a float4.
  // float4 is a 4 four-component vector where the components are x, y, z, and w or
  // r, g, b, and a
  new Float32Array(dataBuf.getMappedRange()).set([
    1, -1, 0, 1, // position (Attribute 0)
    1, 0, 0, 1, // color (Attribute 1)
    -1, -1, 0, 1, // position (Attribute 0)
    0, 1, 0, 1, // color (Attribute 1)
    0, 1, 0, 1, // position (Attribute 0)
    0, 0, 1, 1, // color (Attribute (1))
  ]);
  dataBuf.unmap();

  // Describe to the vertex input buffer slots and attributes provided by those buffers for the
  // "Input Assembler" to feed to the vertex shader
  // https://www.willusher.io/assets/img/webgpu-ia-slots.svg
  const vertexState = {
    vertexBuffers: [{
      // Jump 32 bytes to get somewhere
      arrayStride: 2 * 4 * 4,
      // Describe position attribute
      attributes: [{
          format: 'float4',
          offset: 0,
          shaderLocation: 0
      },
      // Describes color attribute
      {
          format: 'float4',
          offset: 4 * 4,
          shaderLocation: 1
      }],
    }],
  };
}

//
// Draw the scene.
//
function drawScene(device, renderPipeline, renderPassDesc) {
  renderPassDesc.colorAttachments[0].attachment = swapChain.getCurrentTexture().createView();

  const commandEncoder = device.createCommandEncoder();

  const renderPass = commandEncoder.beginRenderPass(renderPassDesc);

  renderPass.setPipeline(renderPipeline);
  renderPass.setVertexBuffer(0, dataBuf);
  renderPass.draw(3, 1, 0, 0);

  renderPass.endPass();
  device.defaultQueue.submit([commandEncoder.finish()]);
  requestAnimationFrame(() => drawScene(device, renderPipeline, renderPassDesc));
}



function initShaderProgram({device, vertexStage, fragmentStage, vertexState, swapChainFormat, depthFormat}) {
  // Setup render outputs

  // The texture format. Short hand for "Blue Green Red Alpha 8 Bit Unsigned Normalized"
  // https://gpuweb.github.io/gpuweb/#texture-formats
  const swapChainFormat = 'bgra8unorm';
  const swapChain = context.configureSwapChain({
      device: device,
      format: swapChainFormat,
      usage: GPUTextureUsage.OUTPUT_ATTACHMENT
  });

  const depthAndStencilFormat = 'depth24plus-stencil8';
  // Sometimes called a Z-buffer, the depth texture is a texture where the distance from the pixel
  // to the camera is saved. We will use it for depthStencilAttachment https://en.wikipedia.org/wiki/Z-buffering
  const depthTexture = device.createTexture({
      size: {
          width: canvas.width,
          height: canvas.height,
          depth: 1
      },
      format: depthAndStencilFormat,
      usage: GPUTextureUsage.OUTPUT_ATTACHMENT
  });

  const layout = device.createPipelineLayout({bindGroupLayouts: []});

  const renderPipeline = device.createRenderPipeline({
      layout: layout,
      vertexStage: vertexStage,
      fragmentStage: fragmentStage,
      primitiveTopology: 'triangle-list',
      vertexState: vertexState,
      colorStates: [{
        format: swapChainFormat
      }],
      depthStencilState: {
        format: depthFormat,
        depthWriteEnabled: true,
        depthCompare: 'less'
      }
  });

  const renderPassDesc = {
    colorAttachments: [{
      attachment: undefined,
      loadValue: [0.3, 0.3, 0.3, 1]
    }],
    depthStencilAttachment: {
      attachment: depthTexture.createView(),
      depthLoadValue: 1.0,
      depthStoreOp: 'store',
      stencilLoadValue: 0,
      stencilStoreOp: 'store'
    }
  };

  return {renderPipeline, renderPassDesc}
}


function loadShader() {
  // Gotta compile it yourself sucker!
}


