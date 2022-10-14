// Vertex Shader
const vsSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  
  uniform vec2 u_resolution;
  
  varying vec2 v_texCoord;
  
  void main() {
    // convert the rectangle from pixels to 0.0 to 1.0
    vec2 zeroToOne = a_position / u_resolution;

    // convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // convert from 0->2 to -1->+1 (clipspace)
    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

    // pass the texCoord to the fragment shader
    // The GPU will interpolate this value between points.
    v_texCoord = a_texCoord;
  }`;

// Fragment Shader
const fsSource = `
  precision mediump float;
  
  // our texture
  uniform sampler2D u_image;
  uniform vec2 u_textureSize;
  uniform float u_exposure;
  uniform float u_contrast;
  uniform float u_gamma;
  
  // the texCoords passed in from the vertex shader.
  varying vec2 v_texCoord;
  
  vec3 adjustExposure(vec3 color, float exposure) {
    return color * pow(2.0, exposure);
  }

  vec3 adjustContrast(vec3 color, float contrast) {
    return (color - 0.5) * contrast + 0.5;
  }

  vec3 adjustGamma(vec3 color, float gamma) {
    return pow(color, vec3(1.0 / gamma));
  }
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    color.rgb = adjustExposure(color.rgb, u_exposure);
    color.rgb = adjustContrast(color.rgb, u_contrast + 1.0);
    color.rgb = adjustGamma(color.rgb, u_gamma + 1.0);
    gl_FragColor = color;
  }`;
