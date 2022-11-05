// Vertex Shader
const vsSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  
  uniform vec2 u_resolution;
  uniform float u_mirror;
  uniform float u_reflect;
  uniform vec2 u_rotation;
  uniform vec2 u_translation;
  uniform float u_scale;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec2 scaledPosition = a_position * u_scale;

    vec2 rotatedPosition = vec2(
      scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
      scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x
    );
    vec2 position = rotatedPosition + u_translation * u_scale;

    // convert the rectangle from pixels to 0.0 to 1.0
    vec2 zeroToOne = position / u_resolution;

    // convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // convert from 0->2 to -1->+1 (clipspace)
    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace * vec2(u_mirror, u_reflect), 0, 1);

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

  uniform float u_kernel[9];
  uniform float u_kernelWeight;

  uniform float u_exposure;
  uniform float u_contrast;
  uniform bool u_grayscale;
  uniform bool u_sepia;
  uniform bool u_invert;
  uniform float u_gamma;
  uniform float u_saturation;
  uniform float u_temperature;
  uniform float u_tint;
  uniform float u_vignette;
  
  // the texCoords passed in from the vertex shader.
  varying vec2 v_texCoord;

  vec4 convolution(sampler2D image, vec2 uv, vec2 resolution, float kernel[9]) {
    vec2 onePixel = vec2(1.0, 1.0) / resolution;
    vec4 colorSum =
      texture2D(u_image, v_texCoord + onePixel * vec2(-1, -1)) * u_kernel[0] +
      texture2D(u_image, v_texCoord + onePixel * vec2( 0, -1)) * u_kernel[1] +
      texture2D(u_image, v_texCoord + onePixel * vec2( 1, -1)) * u_kernel[2] +
      texture2D(u_image, v_texCoord + onePixel * vec2(-1,  0)) * u_kernel[3] +
      texture2D(u_image, v_texCoord + onePixel * vec2( 0,  0)) * u_kernel[4] +
      texture2D(u_image, v_texCoord + onePixel * vec2( 1,  0)) * u_kernel[5] +
      texture2D(u_image, v_texCoord + onePixel * vec2(-1,  1)) * u_kernel[6] +
      texture2D(u_image, v_texCoord + onePixel * vec2( 0,  1)) * u_kernel[7] +
      texture2D(u_image, v_texCoord + onePixel * vec2( 1,  1)) * u_kernel[8] ;
  
    return colorSum / u_kernelWeight;
  }

  vec3 grayscaleFilter(vec3 color) {
    float average = (color.r + color.g + color.b) / 3.0;
    return vec3(average, average, average);
  }

  vec3 sepiaFilter(vec3 color) {
    vec3 sepia = vec3(
      dot(color, vec3(0.393, 0.769, 0.189)),
      dot(color, vec3(0.349, 0.686, 0.168)),
      dot(color, vec3(0.272, 0.534, 0.131))
    );
    return sepia;
  }

  vec3 invertFilter(vec3 color) {
    return vec3(1.0) - color;
  }
  
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

  vec3 applyVignette(vec3 color, float vignette) {
    vec2 uv = v_texCoord;
    vec2 texel = vec2(1.0, 1.0) / u_textureSize;
    vec2 center = vec2(0.5, 0.5);
    vec2 dist = uv - center;
    float percent = 1.0 - (length(dist) * vignette);
    return color * percent;
  }
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    color.rgb = convolution(u_image, v_texCoord, u_textureSize, u_kernel).rgb;

    if (u_grayscale) {
      color.rgb = grayscaleFilter(color.rgb);
    }

    if (u_sepia) {
      color.rgb = sepiaFilter(color.rgb);
    }

    if (u_invert) {
      color.rgb = invertFilter(color.rgb);
    }

    // Light
    color.rgb = adjustExposure(color.rgb, u_exposure);
    color.rgb = adjustContrast(color.rgb, u_contrast + 1.0);
    color.rgb = adjustGamma(color.rgb, u_gamma + 1.0);

    // Color
    color.rgb = adjustSaturation(color.rgb, u_saturation + 1.0);
    color.rgb = adjustTemperature(color.rgb, u_temperature / 2.0);
    color.rgb = adjustTint(color.rgb, u_tint / 2.0);

    // Effects
    color.rgb = applyVignette(color.rgb, u_vignette);

    gl_FragColor = color;
  }`;
