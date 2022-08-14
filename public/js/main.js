var originalImage;
var imageName;
var edits;

const download = () => {
  const canvas = $("#canvas")[0];
  const image = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = imageName + " - Edited.png";
  link.href = image;
  link.click();
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
};

// Read File
const readFile = (file) => {
  if (file.type === "image/png" || file.type === "image/jpeg") {
    edits = {
      filters: {
        grayscale: false,
        sepia: false,
        invert: false,
        emboss: false,
        outline: false,
      },
      light: {
        exposure: 0,
        contrast: 0,
        gamma: 200,
      },
      color: {
        saturation: 0,
        temperature: 0,
        tint: 0,
      },
      detail: {
        sharpen: 0,
        noiseReduction: false,
      },
      effects: {
        blur: 0,
        grain: 0,
      },
    };

    imageName = file.name;
    imageName = imageName.substring(0, imageName.lastIndexOf("."));

    const reader = new FileReader();

    reader.onload = (e) => {
      const image = new Image();
      image.src = e.target.result;

      const canvas = $("#canvas")[0];
      const ctx = canvas.getContext("2d");

      image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;

        ctx.drawImage(image, 0, 0);

        originalImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
      };
    };
    reader.readAsDataURL(file);

    if ($("#editOptions").attr("hidden")) {
      $("#imageDropzone").css("display", "none");
      $("#downloadButton").removeAttr("disabled");
      $("#editOptions").removeAttr("hidden");
    } else {
      $("#exposure").val(0);
      $("#contrast").val(0);
      $("#gamma").val(200);
      $("#saturation").val(0);
      $("#temperature").val(0);
      $("#tint").val(0);
      $("#sharpen").val(0);
      $("#unsharp").val(0);
      $("#grain").val(0);
    }
  } else {
    alert("Invalid file type, file must be a PNG or JPEG");
  }
};

const updateEdits = (key) => {
  switch (key) {
    // Filters
    case "grayscale":
      edits.filters.grayscale = !edits.filters.grayscale;
      break;
    case "sepia":
      edits.filters.sepia = !edits.filters.sepia;
      break;
    case "invert":
      edits.filters.invert = !edits.filters.invert;
      break;

    // Light
    case "exposure":
      edits.light.exposure = parseInt($("#exposure")[0].value) / 100;
      break;
    case "contrast":
      edits.light.contrast = parseInt($("#contrast")[0].value);
      break;
    case "gamma":
      edits.light.gamma = parseInt($("#gamma")[0].value) / 100;
      break;

    // Color
    case "saturation":
      edits.color.saturation = parseInt($("#saturation")[0].value);
      break;
    case "temperature":
      edits.color.temperature = parseInt($("#temperature")[0].value);
      break;
    case "tint":
      edits.color.tint = parseInt($("#tint")[0].value);
      break;
  }
  updateCanvas();
};

const updateCanvas = () => {
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");
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
  if (edits.light.gamma !== 200) {
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
};

// * ------------------------------ Adjust ------------------------------ //
const mirrorImage = () => {
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

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
  ctx.putImageData(newImageData, 0, 0);
};

const reflectImage = () => {
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

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
  ctx.putImageData(newImageData, 0, 0);
};

const rotateClockwise = () => {
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");

  const newWidth = canvas.height;
  const newHeight = canvas.width;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const newData = new Uint8ClampedArray(data.length);
  const newImageData = new ImageData(newData, canvas.height, canvas.width);

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
  originalImage = newImageData;
  ctx.putImageData(newImageData, 0, 0);
};

const rotateCounterClockwise = () => {
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");

  const newWidth = canvas.height;
  const newHeight = canvas.width;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const newData = new Uint8ClampedArray(data.length);
  const newImageData = new ImageData(newData, canvas.height, canvas.width);

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
  originalImage = newImageData;
  ctx.putImageData(newImageData, 0, 0);
};

// * ------------------------------ Filters ------------------------------ //
// TODO: Be able to remove filters
const grayscaleFilter = () => {
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");

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
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");

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
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");
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
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");

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
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");

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
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");

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
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");

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
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");

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
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");

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
const imageNoiseReduction = () => {
  // TODO: Currently resets to the original image.
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const originalData = originalImage.data;

  for (let i = 0; i < data.length; i += 4) {
    redArr = [];
    greenArr = [];
    blueArr = [];

    // Top row
    if (i < canvas.width * 4) {
      noiseReductionRows(i, originalData);
    } else {
      var offset = i - canvas.width * 4;
      noiseReductionRows(offset, originalData);
    }

    // Middle row
    noiseReductionRows(i, originalData);

    // Bottom row
    if (i > data.length - canvas.width * 4) {
      noiseReductionRows(i, originalData);
    } else {
      var offset = i + canvas.width * 4;
      noiseReductionRows(offset, originalData);
    }

    // Get median of each kernel
    data[i] = kernelMedian(redArr);
    data[i + 1] = kernelMedian(greenArr);
    data[i + 2] = kernelMedian(blueArr);
  }

  ctx.putImageData(imageData, 0, 0);
};

// * ------------------------------ Effects ------------------------------ //
const imageGrain = () => {
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const originalData = originalImage.data;

  const grain = parseInt($("#grain")[0].value);

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

const imageUnsharp = () => {
  // TODO: Currently resets to the original image.
  imageKernel("blur");

  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const originalData = originalImage.data;

  const unsharp = parseInt($("#unsharp")[0].value) / 100;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = originalData[i] + (data[i] - originalData[i]) * unsharp;
    data[i + 1] =
      originalData[i + 1] + (data[i + 1] - originalData[i + 1]) * unsharp;
    data[i + 2] =
      originalData[i + 2] + (data[i + 2] - originalData[i + 2]) * unsharp;
  }

  ctx.putImageData(imageData, 0, 0);
};

// * ------------------------------ Util functions ------------------------------ //
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

// Kernel functions
const kernelRows = (offset, originalData, factors) => {
  var redSum = 0;
  var greenSum = 0;
  var blueSum = 0;

  // Left pixel
  if (offset % (canvas.width * 4) === 0) {
    // Left most pixels
    redSum += originalData[offset] * factors[0];
    greenSum += originalData[offset + 1] * factors[0];
    blueSum += originalData[offset + 2] * factors[0];
  } else {
    redSum += originalData[offset - 4] * factors[0];
    greenSum += originalData[offset - 4 + 1] * factors[0];
    blueSum += originalData[offset - 4 + 2] * factors[0];
  }

  // Middle pixel
  redSum += originalData[offset] * factors[1];
  greenSum += originalData[offset + 1] * factors[1];
  blueSum += originalData[offset + 2] * factors[1];

  // Right pixel
  if (offset % (canvas.width * 4) === (canvas.width - 1) * 4) {
    // Right most pixels
    redSum += originalData[offset] * factors[2];
    greenSum += originalData[offset + 1] * factors[2];
    blueSum += originalData[offset + 2] * factors[2];
  } else {
    redSum += originalData[offset + 4] * factors[2];
    greenSum += originalData[offset + 4 + 1] * factors[2];
    blueSum += originalData[offset + 4 + 2] * factors[2];
  }

  return [redSum, greenSum, blueSum];
};

const imageKernel = (algorithm) => {
  // TODO: Currently resets to the original image.
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const originalData = originalImage.data;

  var kernel;

  if (algorithm === "sharpen") {
    const sharpen = parseInt($("#sharpen")[0].value) + 1;

    const kernelEdge = -(sharpen - 1) / 4;
    kernel = [
      [0, kernelEdge, 0],
      [kernelEdge, sharpen, kernelEdge],
      [0, kernelEdge, 0],
    ];
  }
  if (algorithm === "blur") {
    kernel = [
      [0.111, 0.111, 0.111],
      [0.111, 0.111, 0.111],
      [0.111, 0.111, 0.111],
    ];
  }
  if (algorithm === "emboss") {
    kernel = [
      [-2, -1, 0],
      [-1, 1, 1],
      [0, 1, 2],
    ];
  }
  if (algorithm === "outline") {
    kernel = [
      [-1, -1, -1],
      [-1, 8, -1],
      [-1, -1, -1],
    ];
  }

  for (let i = 0; i < data.length; i += 4) {
    var redSum = 0;
    var greenSum = 0;
    var blueSum = 0;

    // Top row
    if (i < canvas.width * 4) {
      // First row of pixels
      var row = kernelRows(i, originalData, kernel[0]);

      redSum += row[0];
      greenSum += row[1];
      blueSum += row[2];
    } else {
      var offset = i - canvas.width * 4;
      var row = kernelRows(offset, originalData, kernel[0]);

      redSum += row[0];
      greenSum += row[1];
      blueSum += row[2];
    }

    row = kernelRows(i, originalData, kernel[1]);

    redSum += row[0];
    greenSum += row[1];
    blueSum += row[2];

    // Bottom row
    if (i >= data.length - canvas.width * 4) {
      // Last row of pixels
      var row = kernelRows(i, originalData, kernel[0]);

      redSum += row[0];
      greenSum += row[1];
      blueSum += row[2];
    } else {
      offset = i + canvas.width * 4;
      row = kernelRows(offset, originalData, kernel[2]);

      redSum += row[0];
      greenSum += row[1];
      blueSum += row[2];
    }

    data[i] = truncateRGB(redSum);
    data[i + 1] = truncateRGB(greenSum);
    data[i + 2] = truncateRGB(blueSum);
  }
  ctx.putImageData(imageData, 0, 0);
};

// Noise reduction functions
const noiseReductionRows = (offset, originalData) => {
  // Left pixel
  if (offset % (canvas.width * 4) === 0) {
    // Left most pixels
    redArr.push(originalData[offset]);
    greenArr.push(originalData[offset + 1]);
    blueArr.push(originalData[offset + 2]);
  } else {
    redArr.push(originalData[offset - 4]);
    greenArr.push(originalData[offset - 4 + 1]);
    blueArr.push(originalData[offset - 4 + 2]);
  }

  // Middle pixel
  redArr.push(originalData[offset]);
  greenArr.push(originalData[offset + 1]);
  blueArr.push(originalData[offset + 2]);

  // Right pixel
  if (offset % (canvas.width * 4) === (canvas.width - 1) * 4) {
    // Right most pixels
    redArr.push(originalData[offset]);
    greenArr.push(originalData[offset + 1]);
    blueArr.push(originalData[offset + 2]);
  } else {
    redArr.push(originalData[offset + 4]);
    greenArr.push(originalData[offset + 4 + 1]);
    blueArr.push(originalData[offset + 4 + 2]);
  }
};

const kernelMedian = (arr) => {
  arr.sort((a, b) => a - b);
  return arr[4];
};
