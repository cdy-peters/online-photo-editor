var originalImage;
var avgBrightness = 0;

const truncateRGB = (value) => {
  if (value > 255) {
    return 255;
  } else if (value < 0) {
    return 0;
  } else {
    return value;
  }
};

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

const readFile = (input) => {
  if (input.files && input.files[0]) {
    var reader = new FileReader();

    reader.onload = function (e) {
      image = new Image();
      image.src = e.target.result;

      const canvas = $("#canvas")[0];
      const ctx = canvas.getContext("2d");

      image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        originalImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
        data = originalImage.data;

        for (let i = 0; i < data.length; i += 4) {
          avgBrightness += data[i] + data[i + 1] + data[i + 2];
        }
        avgBrightness /= canvas.height * canvas.width * 3;
      };
    };

    reader.readAsDataURL(input.files[0]);
  }
};

// TODO: Be able to remove filters
// Grayscale
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

// Sepia
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

// Invert
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

const imageExposure = () => {
  // TODO: Currently resets to the original image.
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const originalData = originalImage.data;
  const exposure = parseInt($("#exposure")[0].value) / 100;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = truncateRGB(originalData[i] * Math.pow(2, exposure));
    data[i + 1] = truncateRGB(originalData[i + 1] * Math.pow(2, exposure));
    data[i + 2] = truncateRGB(originalData[i + 2] * Math.pow(2, exposure));
  }
  ctx.putImageData(imageData, 0, 0);
};

const imageSaturation = () => {
  // TODO: Currently resets to the original image.
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const originalData = originalImage.data;
  const saturation = parseInt($("#saturation")[0].value);

  var alpha = (255 + saturation) / (255 - saturation);

  for (let i = 0; i < data.length; i += 4) {
    var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;

    data[i] = truncateRGB(alpha * (originalData[i] - avg) + avg);
    data[i + 1] = truncateRGB(alpha * (originalData[i + 1] - avg) + avg);
    data[i + 2] = truncateRGB(alpha * (originalData[i + 2] - avg) + avg);
  }
  ctx.putImageData(imageData, 0, 0);
};

const imageTemperature = () => {
  // TODO: Currently resets to the original image.
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const originalData = originalImage.data;
  const temperature = parseInt($("#temperature")[0].value);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = truncateRGB(originalData[i] + temperature);
    data[i + 2] = truncateRGB(originalData[i + 2] - temperature);
  }
  ctx.putImageData(imageData, 0, 0);
};

const imageTint = () => {
  // TODO: Currently resets to the original image.
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const originalData = originalImage.data;
  const tint = parseInt($("#tint")[0].value);

  for (let i = 0; i < data.length; i += 4) {
    data[i + 1] = truncateRGB(originalData[i + 1] + tint);
  }
  ctx.putImageData(imageData, 0, 0);
};

const imageContrast = () => {
  // TODO: Currently resets to the original image.
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const originalData = originalImage.data;
  const contrast = parseInt($("#contrast")[0].value);

  var alpha = (255 + contrast) / (255 - contrast);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = truncateRGB(
      alpha * (originalData[i] - avgBrightness) + avgBrightness
    );
    data[i + 1] = truncateRGB(
      alpha * (originalData[i + 1] - avgBrightness) + avgBrightness
    );
    data[i + 2] = truncateRGB(
      alpha * (originalData[i + 2] - avgBrightness) + avgBrightness
    );
  }
  ctx.putImageData(imageData, 0, 0);
};

const imageGamma = () => {
  // TODO: Currently resets to the original image.
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const originalData = originalImage.data;
  const gamma = parseInt($("#gamma")[0].value) / 100;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.pow(originalData[i] / 255, gamma) * 255;
    data[i + 1] = Math.pow(originalData[i + 1] / 255, gamma) * 255;
    data[i + 2] = Math.pow(originalData[i + 2] / 255, gamma) * 255;
  }
  ctx.putImageData(imageData, 0, 0);
};

// Noise reduction using median filter
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
      // First row of pixels
      noiseReductionRows(i, originalData);
    } else {
      var offset = i - canvas.width * 4;
      noiseReductionRows(offset, originalData);
    }

    // Middle row
    noiseReductionRows(i, originalData);

    // Bottom row
    if (i > data.length - canvas.width * 4) {
      // Last row of pixels
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
