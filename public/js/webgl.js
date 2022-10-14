"use strict";

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
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vsSource);
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fsSource);
  gl.compileShader(fragmentShader);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var texcoordLocation = gl.getAttribLocation(program, "a_texCoord");

  // Create a buffer to put three 2d clip space points in
  var positionBuffer = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
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

  // Create a texture.
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the parameters so we can render any size image.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // Upload the image into the texture.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  // lookup uniforms
  var resolutionLocation,
    textureSizeLocation,
    exposureLocation,
    contrastLocation,
    gammaLocation,
    saturationLocation,
    temperatureLocation,
    tintLocation;
  lookupUniforms();

  drawCanvas();

  // Edit image
  editImage(drawCanvas);

  // Reset image
  $("#resetButton").on("click", () => {
    edits = new InitEdits();
    initValues();

    drawCanvas();
  });

  // Download image
  $("#downloadButton").on("click", () => {
    capture = true;
    drawCanvas();
  });

  function drawCanvas() {
    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

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
    var size = 2; // 2 components per iteration
    var type = gl.FLOAT; // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0; // start at the beginning of the buffer
    gl.vertexAttribPointer(
      texcoordLocation,
      size,
      type,
      normalize,
      stride,
      offset
    );

    // Set uniforms
    setUniforms();

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);

    // Set uniforms
    function setUniforms() {
      gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
      gl.uniform2f(textureSizeLocation, image.width, image.height);

      // Edits
      gl.uniform1f(exposureLocation, edits.exposure);
      gl.uniform1f(contrastLocation, edits.contrast);
      gl.uniform1f(gammaLocation, edits.gamma);
      gl.uniform1f(saturationLocation, edits.saturation);
      gl.uniform1f(temperatureLocation, edits.temperature);
      gl.uniform1f(tintLocation, edits.tint);
    }

    // Download image
    if (capture) {
      capture = false;

      const dataURL = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "image.png";
      link.href = dataURL;
      link.click();
    }
  }

  // Lookup uniforms
  function lookupUniforms() {
    resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");

    // Edits
    exposureLocation = gl.getUniformLocation(program, "u_exposure");
    contrastLocation = gl.getUniformLocation(program, "u_contrast");
    gammaLocation = gl.getUniformLocation(program, "u_gamma");
    saturationLocation = gl.getUniformLocation(program, "u_saturation");
    temperatureLocation = gl.getUniformLocation(program, "u_temperature");
    tintLocation = gl.getUniformLocation(program, "u_tint");
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
function editImage(drawCanvas) {
  $("#exposure").on("input", (e) => {
    edits.exposure = e.target.value;
    $("#exposure-value").text(e.target.value);
    drawCanvas();
  });

  $("#contrast").on("input", (e) => {
    edits.contrast = e.target.value;
    $("#contrast-value").text(e.target.value);
    drawCanvas();
  });

  $("#gamma").on("input", (e) => {
    edits.gamma = e.target.value;
    $("#gamma-value").text(e.target.value);
    drawCanvas();
  });

  $("#saturation").on("input", (e) => {
    edits.saturation = e.target.value;
    $("#saturation-value").text(e.target.value);
    drawCanvas();
  });

  $("#temperature").on("input", (e) => {
    edits.temperature = e.target.value;
    $("#temperature-value").text(e.target.value);
    drawCanvas();
  });

  $("#tint").on("input", (e) => {
    edits.tint = e.target.value;
    $("#tint-value").text(e.target.value);
    drawCanvas();
  });
}
