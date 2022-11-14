const image = new Image();

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
    const reader = new FileReader();

    var filename = file.name;
    filename = filename.substring(0, filename.lastIndexOf("."));

    reader.onload = function (e) {
      image.src = e.target.result;

      image.onload = function () {
        renderImage(image, filename);
      };
    };

    reader.readAsDataURL(file);

    if ($("#editOptions").attr("hidden")) {
      $("#imageDropzone").css("display", "none");
      $("#reset").removeAttr("disabled");
      $("#editOptions").removeAttr("hidden");
      $("#canvasContainer").removeAttr("hidden");
    }
  } else {
    alert("Invalid file type, file must be a PNG or JPEG");
  }
};

// Tabs
var prevTab = "filters";
$(".tablinks").on("click", (e) => {
  var tab = e.target.id.split("-")[0];

  $(`#${prevTab}`).hide();
  $(`#${prevTab}-tab`).removeClass("btn-active");
  $(`#${tab}`).show();
  $(`#${tab}-tab`).addClass("btn-active");

  prevTab = tab;
});
