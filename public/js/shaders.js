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

const vsFlip = `
  precision highp float;

  attribute vec2 a_position;
  attribute vec2 a_texCoord;

  uniform float u_flipX;
  uniform float u_flipY;

  varying vec2 v_texCoord;

  void main() {
    v_texCoord = a_texCoord;

    gl_Position = vec4(a_position * vec2(u_flipX, u_flipY), 0, 1);
  }
`;

const vsRotate = `
precision highp float;

attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform vec2 u_rotate;

varying vec2 v_texCoord;

void main() {
  v_texCoord = a_texCoord;

  vec2 scaledPosition = a_position;
  vec2 rotatedPosition = vec2(
    scaledPosition.x * u_rotate.y + scaledPosition.y * u_rotate.x,
    scaledPosition.y * u_rotate.y - scaledPosition.x * u_rotate.x
  );

  gl_Position = vec4(rotatedPosition, 0, 1);
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

// Filters
const fsGrayscale = `
  precision highp float;

  uniform sampler2D u_image;

  varying vec2 v_texCoord;

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    gl_FragColor = vec4(vec3(gray), color.a);
  }
`;

const fsSepia = `
  precision highp float;

  uniform sampler2D u_image;

  varying vec2 v_texCoord;

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    gl_FragColor = vec4(gray * vec3(1.2, 1.0, 0.8), color.a);
  }
`;

const fsInvert = `
  precision highp float;

  uniform sampler2D u_image;

  varying vec2 v_texCoord;

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    gl_FragColor = vec4(1.0 - color.rgb, color.a);
  }
`;

// Light
const fsBrightness = `
  precision highp float;

  uniform sampler2D u_image;
  uniform float u_brightness;

  varying vec2 v_texCoord;

  vec3 upBrightness(vec3 color, float brightness) {
    brightness /= 2.0;
    return color + brightness * sin(color * 3.1415926535897932384626433832795);
  }

  vec3 downBrightness(vec3 color, float brightness) {
    brightness /= 1.5;
    return (1.0 + brightness) * color;
  }

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);

    if (u_brightness > 0.0) {
      color.rgb = upBrightness(color.rgb, u_brightness);
    } else {
      color.rgb = downBrightness(color.rgb, u_brightness);
    };

    gl_FragColor = color;
  }
`;

const fsExposure = `
  precision highp float;

  uniform sampler2D u_image;
  uniform float u_exposure;

  varying vec2 v_texCoord;

  vec3 adjustExposure(vec3 color, float exposure) {
    exposure *= 1.5;
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

const fsTemperature = `
  precision highp float;

  uniform sampler2D u_image;
  uniform float u_temperature;

  varying vec2 v_texCoord;

  vec3 adjustTemperature(vec3 color, float temperature) {
    temperature /= 6.0;
    color.r = color.r + temperature;
    color.b = color.b - temperature;
    return clamp(color, 0.0, 1.0);
  }

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    color.rgb = adjustTemperature(color.rgb, u_temperature);
    gl_FragColor = color;
  }
`;

const fsTint = `
  precision highp float;

  uniform sampler2D u_image;
  uniform float u_tint;

  varying vec2 v_texCoord;

  vec3 adjustTint(vec3 color, float tint) {
    tint /= 6.0;
    color.g = color.g + tint;
    return clamp(color, 0.0, 1.0);
  }

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    color.rgb = adjustTint(color.rgb, u_tint);
    gl_FragColor = color;
  }
`;

// Details
const fsSharpness = `
  precision highp float;

  uniform sampler2D u_image;
  uniform float u_sharpness;
  uniform vec2 offset;
  uniform float kernel[9];

  varying vec2 v_texCoord;

  void main() {
    float sharpness = u_sharpness;

    vec4 a11 = texture2D(u_image, v_texCoord - offset);
    vec4 a12 = texture2D(u_image, vec2(v_texCoord.x, v_texCoord.y - offset.y));
    vec4 a13 = texture2D(u_image, vec2(v_texCoord.x + offset.x, v_texCoord.y - offset.y));
    vec4 a21 = texture2D(u_image, vec2(v_texCoord.x - offset.x, v_texCoord.y));
    vec4 a22 = texture2D(u_image, v_texCoord);
    vec4 a23 = texture2D(u_image, vec2(v_texCoord.x + offset.x, v_texCoord.y));
    vec4 a31 = texture2D(u_image, vec2(v_texCoord.x - offset.x, v_texCoord.y + offset.y));
    vec4 a32 = texture2D(u_image, vec2(v_texCoord.x, v_texCoord.y + offset.y));
    vec4 a33 = texture2D(u_image, v_texCoord + offset);

    vec4 color = a11 * kernel[0] + a12 * kernel[1] + a13 * kernel[2] +
                  a21 * kernel[3] + a22 * kernel[4] + a23 * kernel[5] +
                  a31 * kernel[6] + a32 * kernel[7] + a33 * kernel[8];

    gl_FragColor = color * sharpness + a22 * (1.0 - sharpness);
  }
`;

const fsBlur = `
  precision highp float;

  uniform sampler2D u_image;
  uniform vec2 u_size;
  
  varying vec2 v_texCoord;

  float random(vec3 scale, float seed) {
    return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
  }

  void main() {
    vec2 size = u_size * 10.0;

    vec4 color = vec4(0.0);
    float total = 0.0;
    float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);

    for (float t = -30.0; t <= 30.0; t++) {
      float percent = (t + offset - 0.5) / 30.0;
      float weight = 1.0 - abs(percent);
      vec4 sample = texture2D(u_image, v_texCoord + size * percent);
      sample.rgb *= sample.a;
      color += sample * weight;
      total += weight;
    }

    gl_FragColor = color / total;
    gl_FragColor.rgb /= gl_FragColor.a + 0.00001;
  }
`;

// Effects
const fsVignette = `
  precision highp float;

  uniform sampler2D u_image;
  uniform float u_vignette;

  varying vec2 v_texCoord;

  vec3 blackVignette(vec3 color, float vignette) {

    float dist = distance(v_texCoord, vec2(0.5));
    float intensity = smoothstep(0.8, 0.0, dist * vignette * 1.5);
    return color * intensity;
  }

  vec3 whiteVignette(vec3 color, float vignette) {
    float dist = distance(v_texCoord, vec2(0.5));
    float intensity = smoothstep(0.8, 0.0, dist * vignette);
    return color + 1.0 * (1.0 - intensity);
  }

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);

    if (u_vignette > 0.0) {
      color.rgb = blackVignette(color.rgb, u_vignette);
    } else {
      color.rgb = whiteVignette(color.rgb, -u_vignette);
    }

    gl_FragColor = color;
  }
`;

const fsGrain = `
  precision highp float;

  uniform sampler2D u_image;
  uniform float u_width;
  uniform float u_height;
  uniform float u_grain;

  varying vec2 v_texCoord;

  float random(vec3 scale, float seed) {
    return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
  }

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    float grain = random(vec3(12.9898, 78.233, 151.7182), 0.0);
    color.rgb += grain * u_grain;
    gl_FragColor = color;
  }
`;