const canvas = $("#canvas")[0];
const ctx = canvas.getContext("2d");
const image = new Image();

var originalImage;
var imageName;
var edits;

const gpuCanvas = $("#gpuCanvas")[0];
const gpuCtx = gpuCanvas.getContext("2d");
const gpuImage = new Image();
const gpu = new GPU({
  gpuCanvas,
});
const settings = {
  graphical: true,
  constants: {},
  output: [],
  maxTexSize: [],
};

const download = () => {
  const image = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = imageName + " - Edited.png";
  link.href = image;
  link.click();
};

const reset = () => {
  resetValues();
  updateCanvas();
};

// Select file
const selectFile = (input) => {
  if (input.files.length === 1) {
    const file = input.files[0];
    readFile(file);
  } else {
    alert("Multiple files selected. Only one image can be added.");
  }
};

// Drag and drop
const dropHandler = (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (e.dataTransfer.items.length === 1) {
    const file = e.dataTransfer.items[0].getAsFile();
    readFile(file);
  } else {
    alert("Multiple files inserted. Only one image can be added.");
  }
};

const dragOverHandler = (e) => {
  e.preventDefault();
  e.stopPropagation();
  $("#imageDropzone").css("background-color", "#b3b3b3");
};

const dragLeaveHandler = (e) => {
  e.preventDefault();
  e.stopPropagation();
  $("#imageDropzone").css("background-color", "#7b7b7b");
};

// Read File
const readFile = (file) => {
  if (file.type === "image/png" || file.type === "image/jpeg") {
    fileName = file.name;
    fileName = fileName.substring(0, fileName.lastIndexOf("."));

    const reader = new FileReader();

    reader.onload = (e) => {
      image.src = e.target.result;

      image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;

        ctx.drawImage(image, 0, 0);

        if (!imageName || imageName !== fileName) {
          resetValues();
          imageName = fileName;
          originalImage = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Gpu image
          gpuImage.src = e.target.result;

          gpuCanvas.width = image.width;
          gpuCanvas.height = image.height;

          settings.constants = {
            width: image.width,
            height: image.height,
          };
          settings.output = [image.width, image.height];
          settings.maxTexSize = [image.width, image.height];
        }
      };
    };
    reader.readAsDataURL(file);

    if ($("#editOptions").attr("hidden")) {
      $("#imageDropzone").css("display", "none");
      $("#downloadButton").removeAttr("disabled");
      $("#resetButton").removeAttr("disabled");
      $("#editOptions").removeAttr("hidden");
      $("#canvasContainer").removeAttr("hidden");
    }
  } else {
    alert("Invalid file type, file must be a PNG or JPEG");
  }
};

const updateFilters = (key) => {
  for (const filter in edits.filters) {
    if (key === filter) {
      edits.filters[filter] = !edits.filters[filter];

      if (edits.filters[filter]) {
        $(`#${filter}`).css("background-color", "#b3b3b3");
      } else {
        $(`#${filter}`).css("background-color", "#7b7b7b");
      }
    } else {
      edits.filters[filter] = false;
      $(`#${filter}`).css("background-color", "#7b7b7b");
    }
  }
};

const updateEdits = (key) => {
  if (key === "grayscale" || key === "sepia" || key === "invert") {
    updateFilters(key);
  } else {
    switch (key) {
      // Light
      case "exposure":
        edits.light.exposure = (parseInt($("#exposure")[0].value) * 3) / 100;
        $("#exposure-value").text(edits.light.exposure);
        break;
      case "contrast":
        edits.light.contrast = parseInt($("#contrast")[0].value);
        $("#contrast-value").text(edits.light.contrast);
        break;
      case "gamma":
        edits.light.gamma = (parseInt($("#gamma")[0].value) + 150) / 100;
        $("#gamma-value").text((edits.light.gamma - 1.5).toFixed(2));
        break;

      // Color
      case "saturation":
        edits.color.saturation = parseInt($("#saturation")[0].value);
        $("#saturation-value").text(edits.color.saturation);
        break;
      case "temperature":
        edits.color.temperature = parseInt($("#temperature")[0].value);
        $("#temperature-value").text(edits.color.temperature);
        break;
      case "tint":
        edits.color.tint = parseInt($("#tint")[0].value);
        $("#tint-value").text(edits.color.tint);
        break;

      // Detail
      case "sharpness":
        edits.detail.sharpness = parseInt($("#sharpness")[0].value) + 1;
        $("#sharpness-value").text(edits.detail.sharpness - 1);
        edits.detail.blur = 0;
        $("#blur-value").text(0);
        $("#blur").val(0);
        break;

      case "blur":
        edits.detail.blur = parseInt($("#blur")[0].value) / 100;
        $("#blur-value").text(edits.detail.blur);
        edits.detail.sharpness = 1;
        $("#sharpness-value").text(0);
        $("#sharpness").val(0);
        break;

      // Effects
      case "grain":
        edits.effects.grain = parseInt($("#grain")[0].value);
        $("#grain-value").text(edits.effects.grain);
        break;
    }
  }
  updateCanvas();
};

const updateCanvas = () => {
  ctx.putImageData(originalImage, 0, 0);

  // Filters
  if (edits.filters.grayscale) {
    grayscaleFilter();
  }
  if (edits.filters.sepia) {
    sepiaFilter();
  }
  if (edits.filters.invert) {
    invertFilter();
  }

  // Light
  if (edits.light.exposure !== 0) {
    imageExposure();
  }
  if (edits.light.contrast !== 0) {
    imageContrast();
  }
  if (edits.light.gamma !== 1.5) {
    imageGamma();
  }

  // Color
  if (edits.color.saturation !== 0) {
    imageSaturation();
  }
  if (edits.color.temperature !== 0) {
    imageTemperature();
  }
  if (edits.color.tint !== 0) {
    imageTint();
  }

  // Detail
  if (edits.detail.sharpness !== 1) {
    gpuImage.src = canvas.toDataURL();
  }

  // Effects
  if (edits.detail.blur !== 0) {
    gpuImage.src = canvas.toDataURL();
  }

  if (edits.effects.grain !== 0) {
    imageGrain();
  }
};

gpuImage.onload = () => {
  if (edits.detail.sharpness !== 1) {
    imageSharpness();
  } else if (edits.detail.blur !== 0) {
    imageBlur();
  }
};

// * ------------------------------ Adjust ------------------------------ //
const mirrorImage = () => {
  const data = originalImage.data;

  const newData = new Uint8ClampedArray(data.length);
  const newImageData = new ImageData(newData, canvas.width, canvas.height);

  for (let i = 0; i < canvas.width; i++) {
    var offset = i * canvas.width * 4;

    for (let j = 0; j < canvas.width * 4; j += 4) {
      newData[offset + j] = data[offset + canvas.width * 4 - j];
      newData[offset + j + 1] = data[offset + canvas.width * 4 - j + 1];
      newData[offset + j + 2] = data[offset + canvas.width * 4 - j + 2];
      newData[offset + j + 3] = data[offset + canvas.width * 4 - j + 3];
    }
  }

  originalImage = newImageData;
  updateCanvas();
};

const reflectImage = () => {
  const data = originalImage.data;

  const newData = new Uint8ClampedArray(data.length);
  const newImageData = new ImageData(newData, canvas.width, canvas.height);

  for (let i = 0; i < canvas.width * 4; i += 4) {
    for (let j = 0; j < canvas.height; j++) {
      var offset = i + j * canvas.width * 4;
      var reverseOffset = i + (canvas.height - j - 1) * canvas.width * 4;

      newData[offset] = data[reverseOffset];
      newData[offset + 1] = data[reverseOffset + 1];
      newData[offset + 2] = data[reverseOffset + 2];
      newData[offset + 3] = data[reverseOffset + 3];
    }
  }

  originalImage = newImageData;
  updateCanvas();
};

const rotateClockwise = () => {
  const newWidth = canvas.height;
  const newHeight = canvas.width;

  const data = originalImage.data;

  const newData = new Uint8ClampedArray(data.length);
  const newImageData = new ImageData(newData, newWidth, newHeight);

  for (let i = 0; i < canvas.width; i++) {
    for (let j = 0; j < canvas.height; j++) {
      newData[(i + 1) * newWidth * 4 - j * 4 - 4] =
        data[j * canvas.width * 4 + i * 4 + 0];
      newData[(i + 1) * newWidth * 4 - j * 4 - 3] =
        data[j * canvas.width * 4 + i * 4 + 1];
      newData[(i + 1) * newWidth * 4 - j * 4 - 2] =
        data[j * canvas.width * 4 + i * 4 + 2];
      newData[(i + 1) * newWidth * 4 - j * 4 - 1] =
        data[j * canvas.width * 4 + i * 4 + 3];
    }
  }

  canvas.width = newWidth;
  canvas.height = newHeight;

  gpuCanvas.width = newWidth;
  gpuCanvas.height = newHeight;

  settings.constants.width = newWidth;
  settings.constants.height = newHeight;

  settings.output = [newWidth, newHeight];
  settings.maxTexSize = [newWidth, newHeight];

  originalImage = newImageData;
  updateCanvas();
};

const rotateCounterClockwise = () => {
  const newWidth = canvas.height;
  const newHeight = canvas.width;

  const data = originalImage.data;

  const newData = new Uint8ClampedArray(data.length);
  const newImageData = new ImageData(newData, newWidth, newHeight);

  for (let i = 0; i < canvas.width; i++) {
    for (let j = 0; j < canvas.height; j++) {
      newData[i * newWidth * 4 + j * 4 + 0] =
        data[(j + 1) * canvas.width * 4 - i * 4 - 4];
      newData[i * newWidth * 4 + j * 4 + 1] =
        data[(j + 1) * canvas.width * 4 - i * 4 - 3];
      newData[i * newWidth * 4 + j * 4 + 2] =
        data[(j + 1) * canvas.width * 4 - i * 4 - 2];
      newData[i * newWidth * 4 + j * 4 + 3] =
        data[(j + 1) * canvas.width * 4 - i * 4 - 1];
    }
  }

  canvas.width = newWidth;
  canvas.height = newHeight;

  gpuCanvas.width = newWidth;
  gpuCanvas.height = newHeight;

  settings.constants.width = newWidth;
  settings.constants.height = newHeight;

  settings.output = [newWidth, newHeight];
  settings.maxTexSize = [newWidth, newHeight];

  originalImage = newImageData;
  updateCanvas();
};

// * ------------------------------ Filters ------------------------------ //
const grayscaleFilter = () => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg;
    data[i + 1] = avg;
    data[i + 2] = avg;
  }

  ctx.putImageData(imageData, 0, 0);
};

const sepiaFilter = () => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    data[i] = red * 0.393 + green * 0.769 + blue * 0.189;
    data[i + 1] = red * 0.349 + green * 0.686 + blue * 0.168;
    data[i + 2] = red * 0.272 + green * 0.534 + blue * 0.131;
  }
  ctx.putImageData(imageData, 0, 0);
};

const invertFilter = () => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
  ctx.putImageData(imageData, 0, 0);
};

// * ------------------------------ Light ------------------------------ //
const imageExposure = () => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const newData = new Uint8ClampedArray(data.length);
  const newImageData = new ImageData(newData, canvas.width, canvas.height);

  const exposure = edits.light.exposure;

  for (let i = 0; i < data.length; i += 4) {
    newData[i] = truncateRGB(data[i] * Math.pow(2, exposure));
    newData[i + 1] = truncateRGB(data[i + 1] * Math.pow(2, exposure));
    newData[i + 2] = truncateRGB(data[i + 2] * Math.pow(2, exposure));
    newData[i + 3] = data[i + 3];
  }

  ctx.putImageData(newImageData, 0, 0);
};

const imageContrast = () => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const newData = new Uint8ClampedArray(data.length);
  const newImageData = new ImageData(newData, canvas.width, canvas.height);

  const contrast = edits.light.contrast;

  var alpha = (255 + contrast) / (255 - contrast);
  var avgBrightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    avgBrightness += data[i] + data[i + 1] + data[i + 2];
  }
  avgBrightness /= data.length / 3;

  for (let i = 0; i < data.length; i += 4) {
    newData[i] = truncateRGB(alpha * (data[i] - avgBrightness) + avgBrightness);
    newData[i + 1] = truncateRGB(
      alpha * (data[i + 1] - avgBrightness) + avgBrightness
    );
    newData[i + 2] = truncateRGB(
      alpha * (data[i + 2] - avgBrightness) + avgBrightness
    );
    newData[i + 3] = data[i + 3];
  }

  ctx.putImageData(newImageData, 0, 0);
};

const imageGamma = () => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const newData = new Uint8ClampedArray(data.length);
  const newImageData = new ImageData(newData, canvas.width, canvas.height);

  const gamma = edits.light.gamma;

  for (let i = 0; i < data.length; i += 4) {
    newData[i] = Math.pow(data[i] / 255, gamma) * 255;
    newData[i + 1] = Math.pow(data[i + 1] / 255, gamma) * 255;
    newData[i + 2] = Math.pow(data[i + 2] / 255, gamma) * 255;
    newData[i + 3] = data[i + 3];
  }

  ctx.putImageData(newImageData, 0, 0);
};

// * ------------------------------ Color ------------------------------ //
const imageSaturation = () => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const newData = new Uint8ClampedArray(data.length);
  const newImageData = new ImageData(newData, canvas.width, canvas.height);

  const saturation = edits.color.saturation;

  var alpha = (255 + saturation) / (255 - saturation);

  for (let i = 0; i < data.length; i += 4) {
    var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;

    newData[i] = truncateRGB(alpha * (data[i] - avg) + avg);
    newData[i + 1] = truncateRGB(alpha * (data[i + 1] - avg) + avg);
    newData[i + 2] = truncateRGB(alpha * (data[i + 2] - avg) + avg);
    newData[i + 3] = data[i + 3];
  }

  ctx.putImageData(newImageData, 0, 0);
};

const imageTemperature = () => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const newData = new Uint8ClampedArray(data.length);
  const newImageData = new ImageData(newData, canvas.width, canvas.height);

  const temperature = edits.color.temperature;

  for (let i = 0; i < data.length; i += 4) {
    newData[i] = truncateRGB(data[i] + temperature);
    newData[i + 1] = data[i + 1];
    newData[i + 2] = truncateRGB(data[i + 2] - temperature);
    newData[i + 3] = data[i + 3];
  }

  ctx.putImageData(newImageData, 0, 0);
};

const imageTint = () => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const newData = new Uint8ClampedArray(data.length);
  const newImageData = new ImageData(newData, canvas.width, canvas.height);

  const tint = edits.color.tint;

  for (let i = 0; i < data.length; i += 4) {
    newData[i] = data[i];
    newData[i + 1] = truncateRGB(data[i + 1] + tint);
    newData[i + 2] = data[i + 2];
    newData[i + 3] = data[i + 3];
  }

  ctx.putImageData(newImageData, 0, 0);
};

// * ------------------------------ Detail ------------------------------ //
const imageSharpness = () => {
  const sharpness = edits.detail.sharpness;

  const matrixEdge = -(sharpness - 1) / 4;
  matrix = [
    [0, matrixEdge, 0],
    [matrixEdge, sharpness, matrixEdge],
    [0, matrixEdge, 0],
  ];

  imageKernel(matrix);
};

// * ------------------------------ Effects ------------------------------ //
const imageGrain = () => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const originalData = originalImage.data;

  const grain = edits.effects.grain;

  var number;
  for (let i = 0; i < data.length; i += 4) {
    number = Math.floor(Math.random() * 100);
    if (number < 50) {
      data[i + 3] = originalData[i + 3] - grain;
    } else {
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

const imageBlur = () => {
  const blur = edits.detail.blur;

  const kernel = gpu.createKernel(function (image, blur) {
    const width = this.constants.width;
    const height = this.constants.height;

    var redSum = 0;
    var greenSum = 0;
    var blueSum = 0;

    const matrix = [
      [0.111, 0.111, 0.111],
      [0.111, 0.111, 0.111],
      [0.111, 0.111, 0.111],
    ];

    for (var i = -1; i < 2; i++) {
      for (var j = -1; j < 2; j++) {
        var x = this.thread.x + i;
        var y = this.thread.y + j;

        if (x < 0 || x >= width) {
          x = this.thread.x;
        }
        if (y < 0 || y >= height) {
          y = this.thread.y;
        }

        const pixel = image[y][x];

        redSum += pixel[0] * matrix[i + 1][j + 1];
        greenSum += pixel[1] * matrix[i + 1][j + 1];
        blueSum += pixel[2] * matrix[i + 1][j + 1];
      }
    }

    const pixel = image[this.thread.y][this.thread.x];
    var red = pixel[0] + (redSum - pixel[0]) * blur;
    var green = pixel[1] + (greenSum - pixel[1]) * blur;
    var blue = pixel[2] + (blueSum - pixel[2]) * blur;

    this.color(red, green, blue);
  }, settings);

  kernel(gpuImage, blur);
  image.src = kernel.canvas.toDataURL();
};

// * ------------------------------ Util functions ------------------------------ //
const resetValues = () => {
  edits = {
    filters: {
      grayscale: false,
      sepia: false,
      invert: false,
    },
    light: {
      exposure: 0,
      contrast: 0,
      gamma: 1.5,
    },
    color: {
      saturation: 0,
      temperature: 0,
      tint: 0,
    },
    detail: {
      sharpness: 1,
      blur: 0,
    },
    effects: {
      grain: 0,
    },
  };

  $("#exposure").val(0);
  $("#exposure-value").text(0);

  $("#contrast").val(0);
  $("#contrast-value").text(0);

  $("#gamma").val(0);
  $("#gamma-value").text(0);

  $("#saturation").val(0);
  $("#saturation-value").text(0);

  $("#temperature").val(0);
  $("#temperature-value").text(0);

  $("#tint").val(0);
  $("#tint-value").text(0);

  $("#sharpness").val(0);
  $("#sharpness-value").text(0);

  $("#blur").val(0);
  $("#blur-value").text(0);

  $("#grain").val(0);
  $("#grain-value").text(0);
};

var prevTab = "adjust";
const openTab = (e, tab) => {
  $(`#${prevTab}`).hide();
  $(`#${prevTab}-tab`).removeClass("btn-active");
  $(`#${tab}`).show();
  $(`#${tab}-tab`).addClass("btn-active");
  prevTab = tab;
};

const truncateRGB = (value) => {
  if (value > 255) {
    return 255;
  } else if (value < 0) {
    return 0;
  } else {
    return value;
  }
};

const imageKernel = (matrix) => {
  const kernel = gpu.createKernel(function (image, matrix) {
    const width = this.constants.width;
    const height = this.constants.height;

    var redSum = 0;
    var greenSum = 0;
    var blueSum = 0;

    for (var i = -1; i < 2; i++) {
      for (var j = -1; j < 2; j++) {
        var x = this.thread.x + i;
        var y = this.thread.y + j;

        if (x < 0 || x >= width) {
          x = this.thread.x;
        }
        if (y < 0 || y >= height) {
          y = this.thread.y;
        }

        const pixel = image[y][x];

        redSum += pixel[0] * matrix[i + 1][j + 1];
        greenSum += pixel[1] * matrix[i + 1][j + 1];
        blueSum += pixel[2] * matrix[i + 1][j + 1];
      }
    }

    this.color(redSum, greenSum, blueSum);
  }, settings);

  kernel(gpuImage, matrix);
  image.src = kernel.canvas.toDataURL();
};
