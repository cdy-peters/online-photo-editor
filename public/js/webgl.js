"use strict";

var render = null;

const renderImage = (image, filename) => {
  if (render) {
    resetValues();
    render = null;
  }
  render = new Init(filename);

  render.apply(image);
  render.compileProgram(null, fsSource);
  render.draw();
};

const resetValues = () => {
  $("#download").attr("disabled", "disabled");

  $(".filter").removeClass("filter-active");

  $(".input-range > input").val(0);
  $(".input-range > p").text(0);
};

$("#download").click(() => {
  render.download(image);
});

$("#reset").click(() => {
  resetValues();

  render.reset();

  render.apply(image);
});

$(".filter").on("click", (e) => {
  const filter = e.target.id;

  var val = render.getShader("filter");

  val == filter
    ? render.removeShader("filter")
    : render.addShader("filter", filter);
  if (val !== filter) $(`#${val}`).removeClass("filter-active");
  $(`#${filter}`).toggleClass("filter-active");

  render.apply(image);
});

$(".input-range").on("input", (e) => {
  var id = e.target.id;
  var val = e.target.value;

  $(`#${id}-value`).text(val);

  val == 0 ? render.removeShader(id) : render.addShader(id, val);

  render.apply(image);
});

class Program {
  constructor(gl, vs, fs) {
    this.uniform = {};
    this.attribute = {};
    this.texture = new Map();

    this.program = gl.createProgram();
    gl.attachShader(this.program, this.compileShader(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(
      this.program,
      this.compileShader(gl, gl.FRAGMENT_SHADER, fs)
    );
    gl.linkProgram(this.program);
    gl.useProgram(this.program);

    const vsAttributes = this.getQualifiers(vs, "attribute");
    for (const [attr, type] of vsAttributes) {
      this.attribute[attr] = gl.getAttribLocation(this.program, attr);
    }

    const uniforms = [];
    const vsUniforms = this.getQualifiers(vs, "uniform");
    for (const [unif, type] of vsUniforms) {
      this.uniform[unif] = gl.getUniformLocation(this.program, unif);
    }

    const fsUniforms = this.getQualifiers(fs, "uniform");
    for (const [unif, type] of fsUniforms) {
      (this.uniform[unif] = gl.getUniformLocation(this.program, unif)),
        "sampler2D" === type && uniforms.push(unif);
    }

    for (var idx in uniforms) {
      const unif = uniforms[idx],
        unifLoc = gl.getUniformLocation(this.program, unif);

      unif === "u_image"
        ? (gl.uniform1i(unifLoc, 0), this.texture.set(0, new Texture(unif)))
        : (gl.uniform1i(unifLoc, 1), this.texture.set(1, new Texture(unif)));
    }
  }

  compileShader(gl, type, s) {
    const shader = gl.createShader(type);
    return (
      gl.shaderSource(shader, s),
      gl.compileShader(shader),
      gl.getShaderParameter(shader, gl.COMPILE_STATUS)
        ? shader
        : console.log(gl.getShaderInfoLog(shader))
    );
  }

  getQualifiers(shader, qualifier) {
    const qualifiers = [],
      regEx = new RegExp("\\b" + qualifier + " (\\w+) (\\w+)", "ig");

    return (
      shader.replace(regEx, (shader, qualifier, regEx) => {
        return qualifiers.push([regEx, qualifier]), shader;
      }),
      qualifiers
    );
  }

  delete(gl) {
    gl.deleteProgram(this.program),
      this.texture.forEach((i) => {
        i.delete(gl);
      }),
      this.texture.clear();
  }
}

class Init {
  constructor(filename) {
    this.drawShader = 0;
    this.width = 0;
    this.height = 0;
    this.lastInChain = !1;
    this.currentFramebufferIndex = 0;
    this.lastTextureIndex = -1;
    this.sourceTexture = null;
    this.tempFramebuffers = {};
    this.vertexBuffer = null;
    this.edits = [];
    this.compiledPrograms = new Map();
    this.capture = false;
    this.filename = filename;
    this.initContext();
  }

  initContext() {
    this.canvas = document.getElementById("canvas");
    this.gl = canvas.getContext("webgl", {
      alpha: !0,
      premultipliedAlpha: !1,
      depth: !1,
      stencil: !1,
      antialias: !1,
    });
    if (!this.gl) console.log("Failed to get canvas context");
  }

  addShader(shader, val) {
    if (this.edits.length == 0) {
      $("#download").removeAttr("disabled");
    }
    for (var i = 0; i < this.edits.length; i++) {
      if (this.edits[i].shader == shader) {
        this.edits[i].value = val;
        return;
      }
    }
    this.edits.push(new Shader(shader, val));
  }

  getShader(shader) {
    for (var i = 0; i < this.edits.length; i++) {
      if (this.edits[i].shader == shader) {
        return this.edits[i].value;
      }
    }
    return null;
  }

  removeShader(shader) {
    for (var i = 0; i < this.edits.length; i++) {
      if (this.edits[i].shader == shader) {
        this.edits.splice(i, 1);
        if (this.edits.length == 0) {
          $("#download").attr("disabled", "disabled");
        }
        return;
      }
    }
  }

  runShader(shader, val) {
    switch (shader) {
      case "filter":
        return this.filter(val);
      case "exposure":
        return this.exposure(val);
      case "contrast":
        return this.contrast(val);
      case "brightness":
        return this.brightness(val);
      case "saturation":
        return this.saturation(val);
      case "temperature":
        return this.temperature(val);
      case "tint":
        return this.tint(val);
      case "sharpness":
        return this.sharpness(val);
      case "blur":
        return this.blur(val);
      case "vignette":
        return this.vignette(val);
    }
  }

  download(image) {
    this.capture = true;
    this.apply(image);
  }

  reset() {
    (this.edits = []),
      this.compiledPrograms.forEach((i) => {
        i.delete(this.gl);
      }, this),
      this.compiledPrograms.clear(),
      this.sourceTexture &&
        ((this.activeSourceTexture = void 0),
        this.sourceTexture.delete(this.gl),
        (this.sourceTexture = null));
    for (var i in this.tempFramebuffers) {
      this.tempFramebuffers[i].delete(this.gl);
    }
    this.tempFramebuffers = {};
  }

  apply(image, t = !1) {
    this.resize(image.width, image.height);
    this.drawShader = 0;

    (this.sourceTexture &&
      this.width == image.width &&
      this.height == image.height) ||
      (this.sourceTexture &&
        (this.sourceTexture.delete(this.gl), (this.sourceTexture = null)),
      (this.sourceTexture = new Texture("texture")),
      this.sourceTexture.createTexture(this.gl));

    (image !== this.activeSourceTexture || t) &&
      (this.sourceTexture.bindTexture(this.gl, image),
      (this.activeSourceTexture = image));

    for (var i = 0; i < this.edits.length; i++) {
      this.lastInChain = i == this.edits.length - 1;
      this.runShader(this.edits[i].shader, this.edits[i].value);
    }

    if (this.edits.length == 0 && this.lastInChain) {
      this.compileProgram(null, fsSource);
      this.draw();
    }

    if (this.capture == true) {
      this.capture = false;

      const dataURL = this.gl.canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${this.filename} - Edited.png`;
      link.href = dataURL;
      link.click();
    }

    return (this.currentFramebufferIndex = 0), this.canvas;
  }

  resize(imageWidth, imageHeight) {
    if (imageWidth !== this.width || imageHeight !== this.height) {
      if (
        ((this.canvas.width = this.width = imageWidth),
        (this.canvas.height = this.height = imageHeight),
        !this.vertexBuffer)
      ) {
        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        var vertices = [
          -1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, -1, 1, 0, 1, 1, -1, 1, 0, 1,
          1, 1, 1,
        ];
        this.gl.bufferData(
          this.gl.ARRAY_BUFFER,
          new Float32Array(vertices),
          this.gl.STATIC_DRAW
        );
      }
      this.gl.viewport(0, 0, this.width, this.height);
      for (var i in this.tempFramebuffers) {
        this.tempFramebuffers[i].delete(this.gl);
      }
      this.tempFramebuffers = {};
    }
  }

  getTempFramebuffer(idx) {
    return (
      (this.tempFramebuffers[idx] =
        this.tempFramebuffers[idx] || this.createFramebufferTexture()),
      this.tempFramebuffers[idx]
    );
  }

  createFramebufferTexture() {
    var framebuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);

    var renderbuffer = this.gl.createRenderbuffer();
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, renderbuffer);
    this.gl.renderbufferStorage(
      this.gl.RENDERBUFFER,
      this.gl.DEPTH_COMPONENT16,
      this.width,
      this.height
    );

    var texture = this.gl.createTexture();
    return (
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture),
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        this.width,
        this.height,
        0,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        null
      ),
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_MAG_FILTER,
        this.gl.NEAREST
      ),
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_MIN_FILTER,
        this.gl.NEAREST
      ),
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_WRAP_S,
        this.gl.CLAMP_TO_EDGE
      ),
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_WRAP_T,
        this.gl.CLAMP_TO_EDGE
      ),
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0,
        this.gl.TEXTURE_2D,
        texture,
        0
      ),
      this.gl.framebufferRenderbuffer(
        this.gl.FRAMEBUFFER,
        this.gl.DEPTH_ATTACHMENT,
        this.gl.RENDERBUFFER,
        renderbuffer
      ),
      this.gl.bindTexture(this.gl.TEXTURE_2D, null),
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null),
      new FramebufferTexture(framebuffer, renderbuffer, texture)
    );
  }

  draw(compProg, t = !1) {
    if (!compProg) {
      var compProg = new Map();
      compProg.set(0, this.sourceTexture);
    } else {
      compProg = compProg.texture;
    }

    if ((this.edits.length <= 1 || this.lastInChain) && !t) {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    } else {
      var tempFramebuffer = this.getTempFramebuffer(
        this.currentFramebufferIndex
      );

      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, tempFramebuffer.framebuffer);
    }

    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.clearColor(0, 0, 0, 0);

    this.setTexture(compProg);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    this.drawShader++;
    this.currentFramebufferIndex = +!this.currentFramebufferIndex;
  }

  setTexture(textures) {
    let unit = -1;

    textures.forEach((texture, i) => {
      if (
        (this.gl.activeTexture(this.gl.TEXTURE0 + i),
        i === 0 && this.drawShader === 0)
      ) {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.sourceTexture.texture);
      } else if (i === 0) {
        var idx = +!this.currentFramebufferIndex,
          texture = this.getTempFramebuffer(idx);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture);
      } else {
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture);
      }
      unit = Math.max(unit, i);
    }, this);

    for (var i = unit + 1; i <= this.lastTextureIndex; i++) {
      this.gl.activeTexture(this.gl.TEXTURE0 + i);
      this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }
    this.lastTextureIndex = unit;
  }

  compileProgram(vs, fs) {
    var program = new Program(this.gl, (vs = vsSource), fs);
    var i = Float32Array.BYTES_PER_ELEMENT;

    return (
      this.gl.enableVertexAttribArray(program.attribute.a_position),
      this.gl.vertexAttribPointer(
        program.attribute.a_position,
        2,
        this.gl.FLOAT,
        !1,
        4 * i,
        0
      ),
      this.gl.enableVertexAttribArray(program.attribute.a_texCoord),
      this.gl.vertexAttribPointer(
        program.attribute.a_texCoord,
        2,
        this.gl.FLOAT,
        !1,
        4 * i,
        2 * i
      ),
      program
    );
  }

  // ------------------ Shaders ------------------
  filter(filter) {
    const fsFilter = {
      grayscale: fsGrayscale,
      sepia: fsSepia,
      invert: fsInvert,
    };

    var compProg = this.compiledPrograms.get(filter);
    if (!compProg) {
      compProg = this.compileProgram(null, fsFilter[filter]);
      this.compiledPrograms.set(filter, compProg);
    }

    this.gl.useProgram(compProg.program);

    this.draw(compProg);
  }

  getCompiledProgram(edit) {
    const fsEdit = {
      exposure: fsExposure,
      contrast: fsContrast,
      brightness: fsBrightness,
      saturation: fsSaturation,
      temperature: fsTemperature,
      tint: fsTint,
      sharpness: fsSharpness,
      blur: fsBlur,
      vignette: fsVignette,
    };

    var compProg = this.compiledPrograms.get(edit);
    if (!compProg) {
      compProg = this.compileProgram(null, fsEdit[edit]);
      this.compiledPrograms.set(edit, compProg);
    }

    this.gl.useProgram(compProg.program);
    return compProg;
  }

  exposure(val) {
    const compProg = this.getCompiledProgram("exposure");

    this.gl.uniform1f(compProg.uniform.u_exposure, val);

    this.draw(compProg);
  }

  contrast(val) {
    const compProg = this.getCompiledProgram("contrast");

    this.gl.uniform1f(compProg.uniform.u_contrast, val);

    this.draw(compProg);
  }

  brightness(val) {
    const compProg = this.getCompiledProgram("brightness");

    this.gl.uniform1f(compProg.uniform.u_brightness, val);

    this.draw(compProg);
  }

  saturation(val) {
    const compProg = this.getCompiledProgram("saturation");

    this.gl.uniform1f(compProg.uniform.u_saturation, val);

    this.draw(compProg);
  }

  temperature(val) {
    const compProg = this.getCompiledProgram("temperature");

    this.gl.uniform1f(compProg.uniform.u_temperature, val);

    this.draw(compProg);
  }

  tint(val) {
    const compProg = this.getCompiledProgram("tint");

    this.gl.uniform1f(compProg.uniform.u_tint, val);

    this.draw(compProg);
  }

  sharpness(val) {
    const compProg = this.getCompiledProgram("sharpness");

    const kernel = new Float32Array([0, -1, 0, -1, 5, -1, 0, -1, 0]);
    this.gl.uniform1fv(compProg.uniform.kernel, kernel);
    this.gl.uniform1f(compProg.uniform.u_sharpness, val);
    this.gl.uniform2f(compProg.uniform.offset, 1 / this.width, 1 / this.height);
    this.draw(compProg);
  }

  blur(val) {
    const compProg = this.getCompiledProgram("blur");

    var x = val / this.canvas.width,
      y = val / this.canvas.height;

    this.gl.uniform2f(compProg.uniform.u_size, 0, x);
    this.draw(compProg, !0);

    this.gl.uniform2f(compProg.uniform.u_size, y, 0);
    this.draw(compProg, !1);
  }

  vignette(val) {
    const compProg = this.getCompiledProgram("vignette");

    this.gl.uniform1f(compProg.uniform.u_vignette, val);

    this.draw(compProg);
  }
}
class Shader {
  constructor(shader, val) {
    (this.shader = shader), (this.value = val);
  }
}

class FramebufferTexture {
  constructor(framebuffer, renderbuffer, texture) {
    (this.framebuffer = framebuffer),
      (this.renderbuffer = renderbuffer),
      (this.texture = texture);
  }
  delete(gl) {
    gl.deleteFramebuffer(this.framebuffer);
    gl.deleteRenderbuffer(this.renderbuffer);
    gl.deleteTexture(this.texture);
  }
}

class Texture {
  constructor(name) {
    (this.name = name), (this.texture = null);
  }
  createTexture(gl) {
    this.texture = gl.createTexture();
  }
  bindTexture(gl, image) {
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 4);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  }
  delete(gl) {
    gl.deleteTexture(this.texture);
  }
}
