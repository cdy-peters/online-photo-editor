"use strict";

// Init uniforms
var resolutionLocation, textureSizeLocation;
var mirrorLocation,
  reflectLocation,
  exposureLocation,
  contrastLocation,
  gammaLocation,
  saturationLocation,
  temperatureLocation,
  tintLocation;
var kernelLocation, kernelWeightLocation;

var capture = false;

const render = (image) => {
  // Get A WebGL context
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  // Set canvas size
  canvas.width = image.width;
  canvas.height = image.height;

  // setup GLSL program
  const program = createProgramFromScripts(gl, vsSource, fsSource);

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var texcoordLocation = gl.getAttribLocation(program, "a_texCoord");

  // Create a buffer to put three 2d clip space points in
  var positionBuffer = gl.createBuffer();
  // Bind it to ARRAY_BUFFER
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Set a rectangle the same size as the image.
  setRectangle(gl, 0, 0, image.width, image.height);

  // provide texture coordinates for the rectangle.
  var texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
    ]),
    gl.STATIC_DRAW
  );

  // Upload the image into the texture.
  var originalImageTexture = createAndSetTexture(gl);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  // Create 2 textures with framebuffer
  var textures = [],
    framebuffers = [];
  for (var i = 0; i < 2; ++i) {
    var texture = createAndSetTexture(gl);
    textures.push(texture);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      image.width,
      image.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );

    var fbo = gl.createFramebuffer();
    framebuffers.push(fbo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );
  }

  // lookup uniforms
  lookupUniforms();

  drawEffects();

  // Edit image
  editImage(drawEffects);

  // Reset image
  $("#resetButton").on("click", () => {
    edits = new InitEdits();
    initValues();

    drawEffects();
  });

  // // Download image
  // $("#downloadButton").on("click", () => {
  //   capture = true;
  //   drawEffects();
  // });

  function computeKernelWeight(kernel) {
    var weight = kernel.reduce(function (prev, curr) {
      return prev + curr;
    });
    return weight <= 0 ? 1 : weight;
  }

  function drawEffects() {
    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2; // 2 components per iteration
    var type = gl.FLOAT; // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0; // start at the beginning of the buffer
    gl.vertexAttribPointer(
      positionLocation,
      size,
      type,
      normalize,
      stride,
      offset
    );

    // Turn on the texcoord attribute
    gl.enableVertexAttribArray(texcoordLocation);

    // bind the texcoord buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

    // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
    var size = 2;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.vertexAttribPointer(
      texcoordLocation,
      size,
      type,
      normalize,
      stride,
      offset
    );

    // set the size of the image
    gl.uniform2f(textureSizeLocation, image.width, image.height);

    // start with the original image
    gl.bindTexture(gl.TEXTURE_2D, originalImageTexture);

    // don't y flip images while drawing to the textures
    edits.reflect = -edits.reflect;

    // loop through each effect we want to apply.
    var count = 0;
    if (edits.sharpness > 0) {
      setFramebuffer(framebuffers[0], image.width, image.height);
      drawCanvas("sharpness");
      gl.bindTexture(gl.TEXTURE_2D, textures[count % 2]);
      count++;
    }
    if (edits.blur > 0) {
      for (var i = 0; i < edits.blur; i++) {
        setFramebuffer(framebuffers[count % 2], image.width, image.height);
        drawCanvas("blur");
        gl.bindTexture(gl.TEXTURE_2D, textures[count % 2]);
        count++;
      }
    }

    // finally draw the result to the canvas.
    edits.reflect = -edits.reflect; // need to y flip for canvas
    setFramebuffer(null, gl.canvas.width, gl.canvas.height);
    drawCanvas("normal");

    // // Download image
    // if (capture) {
    //   capture = false;

    //   const dataURL = canvas.toDataURL("image/png");
    //   const link = document.createElement("a");
    //   link.download = "image.png";
    //   link.href = dataURL;
    //   link.click();
    // }
  }

  function setFramebuffer(fbo, width, height) {
    // make this the framebuffer we are rendering to.
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // Tell the shader the resolution of the framebuffer.
    gl.uniform2f(resolutionLocation, width, height);

    // Tell webgl the viewport setting needed for framebuffer.
    gl.viewport(0, 0, width, height);
  }

  function drawCanvas(name) {
    // set the kernel and it's weight
    var kernel;
    if (name === "normal") {
      kernel = [0, 0, 0, 0, 1, 0, 0, 0, 0];
    } else if (name === "sharpness") {
      var edge = -(edits.sharpness - 1) / 4;
      kernel = [
        0,
        edge,
        0,
        edge,
        parseFloat(edits.sharpness),
        edge,
        0,
        edge,
        0,
      ];
    } else if (name === "blur") {
      kernel = [0.111, 0.111, 0.111, 0.111, 0.111, 0.111, 0.111, 0.111, 0.111]
    }
    gl.uniform1fv(kernelLocation, kernel);
    gl.uniform1f(kernelWeightLocation, computeKernelWeight(kernel));

    setUniforms();

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }

  // Set uniforms
  function setUniforms() {
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(textureSizeLocation, image.width, image.height);

    // Edits
    gl.uniform1f(mirrorLocation, edits.mirror);
    gl.uniform1f(reflectLocation, edits.reflect);
    gl.uniform1f(exposureLocation, edits.exposure);
    gl.uniform1f(contrastLocation, edits.contrast);
    gl.uniform1f(gammaLocation, edits.gamma);
    gl.uniform1f(saturationLocation, edits.saturation);
    gl.uniform1f(temperatureLocation, edits.temperature);
    gl.uniform1f(tintLocation, edits.tint);
  }

  // Lookup uniforms
  function lookupUniforms() {
    resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");

    // Edits
    mirrorLocation = gl.getUniformLocation(program, "u_mirror");
    reflectLocation = gl.getUniformLocation(program, "u_reflect");
    exposureLocation = gl.getUniformLocation(program, "u_exposure");
    contrastLocation = gl.getUniformLocation(program, "u_contrast");
    gammaLocation = gl.getUniformLocation(program, "u_gamma");
    saturationLocation = gl.getUniformLocation(program, "u_saturation");
    temperatureLocation = gl.getUniformLocation(program, "u_temperature");
    tintLocation = gl.getUniformLocation(program, "u_tint");

    kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
    kernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");
  }
};

const setRectangle = (gl, x, y, width, height) => {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
    gl.STATIC_DRAW
  );
};

// Edit image
const editImage = (drawEffects) => {
  // Adjust
  $("#mirror").on("click", () => {
    edits.mirror = -edits.mirror;
    drawEffects();
  });

  $("#reflect").on("click", () => {
    edits.reflect = -edits.reflect;
    drawEffects();
  });

  // Light
  $("#exposure").on("input", (e) => {
    edits.exposure = e.target.value;
    $("#exposure-value").text(e.target.value);
    drawEffects();
  });

  $("#contrast").on("input", (e) => {
    edits.contrast = e.target.value;
    $("#contrast-value").text(e.target.value);
    drawEffects();
  });

  $("#gamma").on("input", (e) => {
    edits.gamma = e.target.value;
    $("#gamma-value").text(e.target.value);
    drawEffects();
  });

  // Color
  $("#saturation").on("input", (e) => {
    edits.saturation = e.target.value;
    $("#saturation-value").text(e.target.value);
    drawEffects();
  });

  $("#temperature").on("input", (e) => {
    edits.temperature = e.target.value;
    $("#temperature-value").text(e.target.value);
    drawEffects();
  });

  $("#tint").on("input", (e) => {
    edits.tint = e.target.value;
    $("#tint-value").text(e.target.value);
    drawEffects();
  });

  // Detail
  $("#sharpness").on("input", (e) => {
    edits.sharpness = e.target.value;
    $("#sharpness-value").text(e.target.value);
    drawEffects();
  });

  $("#blur").on("input", (e) => {
    edits.blur = e.target.value;
    $("#blur-value").text(e.target.value);
    drawEffects();
  });
};
