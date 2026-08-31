const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const fields = {
  serviceName: document.getElementById("serviceName"),
  title: document.getElementById("title"),
  description: document.getElementById("description"),
  characterName: document.getElementById("characterName"),
  characterDescription: document.getElementById("characterDescription"),
  tags: document.getElementById("tags"),
  catchcopy: document.getElementById("catchcopy"),
  theme: document.getElementById("theme")
};

const imageInput = document.getElementById("imageInput");
const imageZoom = document.getElementById("imageZoom");
const imageX = document.getElementById("imageX");
const imageY = document.getElementById("imageY");
const zoomValue = document.getElementById("zoomValue");
const xValue = document.getElementById("xValue");
const yValue = document.getElementById("yValue");
const resetImage = document.getElementById("resetImage");
const downloadButton = document.getElementById("download");
const status = document.getElementById("status");

let uploadedImage = null;
let dragging = false;
let lastPointer = null;

const imagePosition = {
  zoom: 100,
  x: 0,
  y: 0
};

const themes = {
  dark: {
    bg: "#3d3d3d",
    right: "#a8a8a8",
    text: "#ffffff",
    muted: "#eeeeee",
    tag: "#666666",
    accent: "#0099ff"
  },
  warm: {
    bg: "#4b403b",
    right: "#b6aaa1",
    text: "#fffaf5",
    muted: "#f2e7df",
    tag: "#77645a",
    accent: "#e6a06a"
  },
  blue: {
    bg: "#35404b",
    right: "#aeb8c1",
    text: "#f7fbff",
    muted: "#dce8f1",
    tag: "#5f7180",
    accent: "#66b8ff"
  },
  green: {
    bg: "#3d4840",
    right: "#abb5ad",
    text: "#f7faf7",
    muted: "#e0e9e1",
    tag: "#66746a",
    accent: "#83c99a"
  },
  purple: {
    bg: "#453e4b",
    right: "#b2aab7",
    text: "#fbf8ff",
    muted: "#e8e1ed",
    tag: "#6e6275",
    accent: "#c39bea"
  },
  light: {
    bg: "#eeeeec",
    right: "#cfcfcd",
    text: "#262626",
    muted: "#4b4b4b",
    tag: "#d2d2d0",
    accent: "#287dcc"
  }
};

function wrapText(text, maxWidth, font) {
  ctx.font = font;
  const lines = [];
  const paragraphs = String(text || "").split("\n");

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push("");
      continue;
    }

    let line = "";
    for (const char of paragraph) {
      const test = line + char;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }

  return lines;
}

function drawTextBlock(text, x, y, maxWidth, font, lineHeight, color, maxLines = 99) {
  const lines = wrapText(text, maxWidth, font).slice(0, maxLines);
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = "top";

  lines.forEach((line, i) => {
    ctx.fillText(line, x, y + i * lineHeight);
  });

  return y + lines.length * lineHeight;
}

function getImageGeometry(img, x, y, w, h) {
  const zoom = imagePosition.zoom / 100;
  const coverScale = Math.max(w / img.width, h / img.height);
  const scale = coverScale * zoom;
  const sw = img.width * scale;
  const sh = img.height * scale;

  const movableX = Math.max(0, sw - w) / 2;
  const movableY = Math.max(0, sh - h) / 2;

  const sx = x + (w - sw) / 2 + movableX * (imagePosition.x / 100);
  const sy = y + (h - sh) / 2 + movableY * (imagePosition.y / 100);

  return { sx, sy, sw, sh };
}

function drawCoverImage(img, x, y, w, h) {
  const { sx, sy, sw, sh } = getImageGeometry(img, x, y, w, h);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh);
  ctx.restore();
}

function render() {
  const t = themes[fields.theme.value] || themes.dark;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const leftW = 675;
  const imageX0 = leftW;
  const imageY0 = 0;
  const imageW = 525;
  const imageH = 675;

  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, leftW, 675);

  ctx.fillStyle = t.right;
  ctx.fillRect(imageX0, imageY0, imageW, imageH);

  if (uploadedImage) {
    drawCoverImage(uploadedImage, imageX0, imageY0, imageW, imageH);
  } else {
    ctx.fillStyle = "#6e6e6e";
    ctx.font = "700 50px Arial, 'Noto Sans JP', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("イラスト欄", imageX0 + imageW / 2, imageH / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
  }

  const x = 75;

  ctx.fillStyle = t.accent;
  ctx.font = "700 30px Arial, 'Noto Sans JP', sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(fields.serviceName.value || "サービス名", 50, 55);

  ctx.fillStyle = t.text;
  ctx.font = "700 50px Arial, 'Noto Sans JP', sans-serif";
  ctx.fillText(fields.title.value || "作品タイトル", x, 115);

  drawTextBlock(
    fields.description.value,
    x,
    205,
    500,
    "21px Arial, 'Noto Sans JP', sans-serif",
    28,
    t.muted,
    3
  );

  ctx.fillStyle = t.accent;
  ctx.font = "700 26px Arial, sans-serif";
  ctx.fillText("CHARACTER", x, 300);

  ctx.fillStyle = t.text;
  ctx.font = "23px Arial, 'Noto Sans JP', sans-serif";
  ctx.fillText(fields.characterName.value || "キャラクター名", x + 15, 345);

  drawTextBlock(
    fields.characterDescription.value,
    x + 15,
    388,
    485,
    "21px Arial, 'Noto Sans JP', sans-serif",
    28,
    t.muted,
    3
  );

  const tags = fields.tags.value
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  let tx = x;
  const tagY = 507;

  ctx.font = "21px Arial, 'Noto Sans JP', sans-serif";
  tags.forEach(tag => {
    const tw = ctx.measureText(tag).width + 30;
    ctx.fillStyle = t.tag;
    ctx.beginPath();
    ctx.roundRect(tx, tagY, tw, 55, 11);
    ctx.fill();

    ctx.fillStyle = t.text;
    ctx.fillText(tag, tx + 15, tagY + 15);
    tx += tw + 8;
  });

  ctx.fillStyle = t.accent;
  ctx.font = "700 28px Arial, 'Noto Sans JP', sans-serif";
  ctx.fillText(
    "”" + (fields.catchcopy.value || "キャッチコピー") + "”",
    x,
    585
  );
}

Object.values(fields).forEach(el => {
  el.addEventListener("input", render);
  el.addEventListener("change", render);
});

imageInput.addEventListener("change", () => {
  const file = imageInput.files && imageInput.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    status.textContent = "画像ファイルを選択してください。";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    const img = new Image();

    img.onload = () => {
      uploadedImage = img;
      imagePosition.zoom = 100;
      imagePosition.x = 0;
      imagePosition.y = 0;

      imageZoom.value = "100";
      imageX.value = "0";
      imageY.value = "0";
      updateImageLabels();

      status.textContent = "画像を読み込みました。ドラッグで位置を調整できます。";
      render();
    };

    img.onerror = () => {
      status.textContent = "画像を読み込めませんでした。";
    };

    img.src = reader.result;
  };

  reader.readAsDataURL(file);
});

function updateImageLabels() {
  zoomValue.textContent = `${imagePosition.zoom}%`;
  xValue.textContent = `${imagePosition.x > 0 ? "+" : ""}${imagePosition.x}`;
  yValue.textContent = `${imagePosition.y > 0 ? "+" : ""}${imagePosition.y}`;
}

function updateImageControls() {
  imagePosition.zoom = Number(imageZoom.value);
  imagePosition.x = Number(imageX.value);
  imagePosition.y = Number(imageY.value);
  updateImageLabels();
  render();
}

[imageZoom, imageX, imageY].forEach(control => {
  control.addEventListener("input", updateImageControls);
});

resetImage.addEventListener("click", () => {
  imageZoom.value = "100";
  imageX.value = "0";
  imageY.value = "0";
  updateImageControls();
});

canvas.addEventListener("pointerdown", event => {
  if (!uploadedImage) return;

  dragging = true;
  lastPointer = { x: event.clientX, y: event.clientY };
  canvas.classList.add("dragging");
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", event => {
  if (!dragging || !uploadedImage || !lastPointer) return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const dx = (event.clientX - lastPointer.x) * scaleX;
  const dy = (event.clientY - lastPointer.y) * scaleY;

  const imageAreaW = 525;
  const imageAreaH = 675;
  const zoom = imagePosition.zoom / 100;
  const coverScale = Math.max(
    imageAreaW / uploadedImage.width,
    imageAreaH / uploadedImage.height
  );
  const sw = uploadedImage.width * coverScale * zoom;
  const sh = uploadedImage.height * coverScale * zoom;

  const movableX = Math.max(1, sw - imageAreaW) / 2;
  const movableY = Math.max(1, sh - imageAreaH) / 2;

  imagePosition.x = Math.max(-100, Math.min(100, imagePosition.x + (dx / movableX) * 100));
  imagePosition.y = Math.max(-100, Math.min(100, imagePosition.y + (dy / movableY) * 100));

  imageX.value = String(Math.round(imagePosition.x));
  imageY.value = String(Math.round(imagePosition.y));

  updateImageLabels();
  render();

  lastPointer = { x: event.clientX, y: event.clientY };
});

function stopDragging(event) {
  if (!dragging) return;
  dragging = false;
  lastPointer = null;
  canvas.classList.remove("dragging");

  if (event && canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
}

canvas.addEventListener("pointerup", stopDragging);
canvas.addEventListener("pointercancel", stopDragging);
canvas.addEventListener("pointerleave", event => {
  if (dragging && event.pointerType === "mouse") {
    // Keep pointer capture active; dragging can continue outside the canvas.
  }
});

downloadButton.addEventListener("click", () => {
  render();

  canvas.toBlob(blob => {
    if (!blob) {
      status.textContent = "画像の書き出しに失敗しました。";
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "talelynx-x-post.png";
    a.click();
    URL.revokeObjectURL(url);

    status.textContent = "PNGを書き出しました。";
  }, "image/png");
});

updateImageLabels();
render();
