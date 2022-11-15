var imageFile;

class InitEdits {
  constructor() {
    this.exposure = 0;
    this.saturation = 0;
  }
}

var edits = new InitEdits();

// Upload file
$("#selectFile").on("input", (e) => {
  const file = e.target.files[0];
  readFile(file);
});

$("#imageDropzone").on("drop", (e) => {
  e = e.originalEvent;
  e.preventDefault();
  e.stopPropagation();

  if (e.dataTransfer.items.length === 1) {
    const file = e.dataTransfer.items[0].getAsFile();
    readFile(file);
  } else {
    alert("Multiple files inserted. Only one image can be added.");
  }
});

$("#imageDropzone").on("dragover", (e) => {
  e.preventDefault();
  e.stopPropagation();

  $("#imageDropzone").css("background-color", "#515151");
});

$("#imageDropzone").on("dragleave", (e) => {
  e.preventDefault();
  e.stopPropagation();

  $("#imageDropzone").css("background-color", "#373737");
});

const readFile = (file) => {
  if (file.type.includes("image")) {
    imageFile = new Image();
    const reader = new FileReader();

    var filename = file.name;
    filename = filename.substring(0, filename.lastIndexOf("."));

    reader.onload = function (e) {
      imageFile.src = e.target.result;

      imageFile.onload = function () {
        if (imageFile.width > 1920 || imageFile.height > 1920) {
          var canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d"),
            resizeImage = new Image();

          var factor =
            1920 /
            (imageFile.width > imageFile.height
              ? imageFile.width
              : imageFile.height);
          canvas.width = imageFile.width * factor;
          canvas.height = imageFile.height * factor;

          $(".dialog-inner > p").html(
            `<h4>Image is too large.</h4> Do you want to resize it to ${Math.round(
              canvas.width
            )}x${Math.round(canvas.height)}?`
          );
          $(".dialog").css("display", "block");

          $(".dialog-cancel").click(() => {
            $(".dialog").css("display", "none");

            $("#selectFile").wrap("<form>").closest("form").get(0).reset();
            $("#selectFile").unwrap();
          });

          $(".dialog-confirm").click(() => {
            $(".dialog").css("display", "none");
            resizeImage.src = imageFile.src;
          });

          resizeImage.onload = function () {
            ctx.drawImage(resizeImage, 0, 0, canvas.width, canvas.height);

            imageFile.src = canvas.toDataURL();
          };
        } else {
          renderImage(imageFile, filename);
        }
      };
    };

    reader.readAsDataURL(file);
  } else {
    alert("Invalid file type, file must be a PNG or JPEG");
  }
};

// Tabs
var prevTab = "adjust";
$(".tablinks").on("click", (e) => {
  var tab = e.target.id.split("-")[0];

  $(`#${prevTab}`).hide();
  $(`#${prevTab}-tab`).removeClass("btn-active");
  $(`#${tab}`).show();
  $(`#${tab}-tab`).addClass("btn-active");

  prevTab = tab;
});
