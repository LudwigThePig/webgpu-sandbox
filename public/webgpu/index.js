console.log('helo')

// https://www.youtube.com/watch?v=nLe4QMieQYs
async function init() {

}

init();

class API {
  /** Initialize the graphics API */
  static async init() {
    // Download compiler to convert glsl into SPIR-V byte code. WebGPU does not have a shader
    // language yet.
    let glslang	= await import('https://unpkg.com/@webgpu/glslang@0.0.9/dist/web-devel/glslang.js');

    this.adapter	= await navigator.gpu.requestAdapter();
    this.device = await this.adapter.requestDevice();
    this.glsl = await glslang.default();
    this.canvas =  document.querySelector('canvas');
    this.ctx = this.canvas.getContext( 'gpupresent' );
  }
}