// Vertex Shader
const vsSource = `
  precision highp float;

  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  
  varying vec2 v_texCoord;
  
  void main() {
    v_texCoord = a_texCoord;

    gl_Position = vec4(a_position, 0, 1);
  }
`;

// Fragment Shaders
const fsSource = `
  precision highp float;

  uniform sampler2D u_image;
  varying vec2 v_texCoord;

  void main() {
    gl_FragColor = texture2D(u_image, v_texCoord);
  }
`;

// Light
const fsExposure = `
  precision highp float;

  uniform sampler2D u_image;
  uniform float u_exposure;

  varying vec2 v_texCoord;

  vec3 adjustExposure(vec3 color, float exposure) {
    return color * pow(2.0, exposure);
  }

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    color.rgb = adjustExposure(color.rgb, u_exposure);
    gl_FragColor = color;
  }
`;

const fsContrast = `
  precision highp float;

  uniform sampler2D u_image;
  uniform float u_contrast;

  varying vec2 v_texCoord;

  vec3 adjustContrast(vec3 color, float contrast) {
    contrast += 1.0;
    return (color - 0.5) * contrast + 0.5;
  }

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    color.rgb = adjustContrast(color.rgb, u_contrast);
    gl_FragColor = color;
  }
`;

const fsGamma = `
  precision highp float;

  uniform sampler2D u_image;
  uniform float u_gamma;

  varying vec2 v_texCoord;

  vec3 adjustGamma(vec3 color, float gamma) {
    gamma += 1.0;
    return pow(color, vec3(1.0 / gamma));
  }

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    color.rgb = adjustGamma(color.rgb, u_gamma);
    gl_FragColor = color;
  }
`;

// Color
const fsSaturation = `
  precision highp float;

  uniform sampler2D u_image;
  uniform float u_saturation;

  varying vec2 v_texCoord;

  vec3 adjustSaturation(vec3 color, float saturation) {
    vec3 grayXfer = vec3(0.3, 0.59, 0.11);
    vec3 gray = vec3(dot(grayXfer, color));
    return mix(gray, color, saturation);
  }

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    color.rgb = adjustSaturation(color.rgb, u_saturation + 1.0);
    gl_FragColor = color;
  }
`;
