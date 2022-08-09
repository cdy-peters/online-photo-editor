const readFile = (input) => {
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function(e) {
            var image = new Image();
            image.src = e.target.result;

            const canvas = $('#canvas')[0];
            const ctx = canvas.getContext('2d');

            image.onload = () => {
                ctx.drawImage(image, 0, 0);
            }
        }

        reader.readAsDataURL(input.files[0]);
        
    }
}

// Grayscale
const grayscale = () => {
    const canvas = $('#canvas')[0];
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
    }
    ctx.putImageData(imageData, 0, 0);
}