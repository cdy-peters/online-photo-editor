const image = new Image();
var edits, prevFilter;

class InitEdits {
  constructor() {
    // Filters
    this.grayscale = false;
    this.sepia = false;
    this.invert = false;

    // Light
    this.exposure = 0;
    this.contrast = 0;
    this.gamma = 0;

    // Color
    this.saturation = 0;
    this.temperature = 0;
    this.tint = 0;

    // Detail
    this.sharpness = 0;
    this.blur = 0;

    // Effects
    this.vignette = 0;
  }
}

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

var currImage;

const readFile = (file) => {
  if (file.type.includes("image")) {
    const reader = new FileReader();

    edits = new InitEdits();
    initValues();

    reader.onload = function (e) {
      image.src = e.target.result;
      currImage = e.target.result;
      if (prevFilter) {
        $(`#${prevFilter}`).removeClass("active-filter");
        prevFilter = null;
      }

      image.onload = function () {
        render(image);
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

const initValues = () => {
  // Light
  $("#exposure").val(edits.exposure);
  $("#exposure-value").text(edits.exposure);

  $("#contrast").val(edits.contrast);
  $("#contrast-value").text(edits.contrast);

  $("#gamma").val(edits.gamma);
  $("#gamma-value").text(edits.gamma);

  // Color
  $("#saturation").val(edits.saturation);
  $("#saturation-value").text(edits.saturation);

  $("#temperature").val(edits.temperature);
  $("#temperature-value").text(edits.temperature);

  $("#tint").val(edits.tint);
  $("#tint-value").text(edits.tint);

  // Detail
  $("#sharpness").val(edits.sharpness);
  $("#sharpness-value").text(edits.sharpness);

  $("#blur").val(edits.blur);
  $("#blur-value").text(edits.blur);

  // Effects
  $("#vignette").val(edits.vignette);
  $("#vignette-value").text(edits.vignette);
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
