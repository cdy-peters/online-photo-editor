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
  uniform float u_saturation;
  uniform float u_temperature;
  uniform float u_tint;
  
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

  vec3 adjustSaturation(vec3 color, float saturation) {
    vec3 grayXfer = vec3(0.3, 0.59, 0.11);
    vec3 gray = vec3(dot(grayXfer, color));
    return mix(gray, color, saturation);
  }

  vec3 adjustTemperature(vec3 color, float temperature) {
    vec3 retColor = color;
    retColor.r = color.r + temperature;
    retColor.g = color.g;
    retColor.b = color.b - temperature;
    return clamp(retColor, 0.0, 1.0);
  }

  vec3 adjustTint(vec3 color, float tint) {
    vec3 retColor = color;
    retColor.r = color.r + tint;
    retColor.g = color.g - tint;
    retColor.b = color.b;
    return clamp(retColor, 0.0, 1.0);
  }
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    color.rgb = adjustExposure(color.rgb, u_exposure);
    color.rgb = adjustContrast(color.rgb, u_contrast + 1.0);
    color.rgb = adjustGamma(color.rgb, u_gamma + 1.0);
    color.rgb = adjustSaturation(color.rgb, u_saturation + 1.0);
    color.rgb = adjustTemperature(color.rgb, u_temperature / 2.0);
    color.rgb = adjustTint(color.rgb, u_tint / 2.0);
    gl_FragColor = color;
  }`;
