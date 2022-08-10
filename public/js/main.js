var originalImage;

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

// Blur
const sumRows = (offset, pixels, data) => {
  var redSum = 0;
  var greenSum = 0;
  var blueSum = 0;

  // Left pixel
  if (offset % (canvas.width * 4) !== 0) {
    redSum += data[offset - 4];
    greenSum += data[offset - 4 + 1];
    blueSum += data[offset - 4 + 2];
    pixels++;
  }

  // Middle pixel
  redSum += data[offset];
  greenSum += data[offset + 1];
  blueSum += data[offset + 2];
  pixels++;

  // Right pixel
  if (offset % (canvas.width * 4) !== (canvas.width - 1) * 4) {
    redSum += data[offset + 4];
    greenSum += data[offset + 4 + 1];
    blueSum += data[offset + 4 + 2];
    pixels++;
  }

  return [redSum, greenSum, blueSum, pixels];
};

const blurFilter = () => {
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    var pixels = 0;
    var redSum = 0;
    var greenSum = 0;
    var blueSum = 0;

    // Top row
    if (i > canvas.width * 4) {
      offset = i - canvas.width * 4;
      row = sumRows(offset, pixels, data);
      redSum += row[0];
      greenSum += row[1];
      blueSum += row[2];
      pixels = row[3];
    }

    row = sumRows(i, pixels, data);
    redSum += row[0];
    greenSum += row[1];
    blueSum += row[2];
    pixels = row[3];

    // Bottom row
    if (i < data.length - canvas.width * 4) {
      offset = i + canvas.width * 4;

      row = sumRows(offset, pixels, data);
      redSum += row[0];
      greenSum += row[1];
      blueSum += row[2];
      pixels = row[3];
    }

    data[i] = redSum / pixels;
    data[i + 1] = greenSum / pixels;
    data[i + 2] = blueSum / pixels;
  }
  ctx.putImageData(imageData, 0, 0);
};

const truncateRGB = (value) => {
  if (value > 255) {
    return 255;
  } else if (value < 0) {
    return 0;
  } else {
    return value;
  }
}

const imageBrightness = () => {
  // TODO: Currently resets to the original image.
  const canvas = $("#canvas")[0];
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const originalData = originalImage.data;
  const brightness = parseInt($("#brightness")[0].value);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = truncateRGB(originalData[i] + brightness);
    data[i + 1] = truncateRGB(originalData[i + 1] + brightness);
    data[i + 2] = truncateRGB(originalData[i + 2] + brightness);
  }
  ctx.putImageData(imageData, 0, 0);
}


