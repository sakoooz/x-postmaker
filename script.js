const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const fields = {
  serviceName: document.getElementById("serviceName"),
  title: document.getElementById("title"),
  genre: document.getElementById("genre"),
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

/* =========================================================
   デザイン設定
   ---------------------------------------------------------
   完成画像の見た目を微調整するときは、基本的にここだけ
   変更すればOKです。

   X座標：右へ行くほど大きく
   Y座標：下へ行くほど大きく
   ========================================================= */
const DESIGN = {
  // 全体
  canvasWidth: 1200,
  canvasHeight: 675,
  leftWidth: 675,

  // 左側の文字の基準位置
  textX: 75,

  // サービス名
  serviceX: 50,
  serviceY: 55,
  serviceFontSize: 30,

  // 作品タイトル
  titleY: 112,
  titleFontSize: 50,
  titleMinFontSize: 34,
  titleMaxWidth: 540,
  titleFontWeight: 700,

  // 作品ジャンル
  genreY: 170,
  genreFontSize: 16,
  genreFontWeight: 600,

  // 作品紹介文
  descriptionY: 230,
  descriptionWidth: 500,
  descriptionFontSize: 20,
  descriptionLineHeight: 28,
  descriptionMaxLines: 3,

  // CHARACTER
  characterLabelY: 350,
  characterLabelFontSize: 22,

  // キャラクター名
  characterNameX: 15,
  characterNameY: 385,
  characterNameFontSize: 21,

  // キャラ紹介文
  characterDescriptionX: 15,
  characterDescriptionY: 420,
  characterDescriptionWidth: 485,
  characterDescriptionFontSize: 20,
  characterDescriptionLineHeight: 28,
  characterDescriptionMaxLines: 4,

  // タグ
  tagY: 520,
  tagHeight: 40,
  tagRadius: 25,
  tagFontSize: 18,
  tagPaddingX: 20,
  tagGap: 10,

  // キャッチコピー
  catchcopyY: 585,
  catchcopyFontSize: 28,
  catchcopyMinFontSize: 20,
  catchcopyMaxWidth: 540,

  // フォント
  fontFamily: "'Shippori Mincho B1', serif",
  characterLabelFontFamily: "'Shippori Mincho B1', serif"
};

const themes = {  
  seashore: {
    bg: "#e1dedb",
    right: "#a8a8a8",
    text: "#763f03",
    muted: "#815221",
    tag: "#b2b7ba",
    accent: "#038a8b"
  },
  nightcities: {
    bg: "#10120e",
    right: "#a8a8a8",
    text: "#ccd6da",
    muted: "#adb9be",
    tag: "#a0121c",
    accent: "#df992a"
  },
  flowers: {
    bg: "#fdfdef",
    right: "#a8a8a8",
    text: "#0e1512",
    muted: "#30423a",
    tag: "#e9a052",
    accent: "#ffa5a3"
  },
  teacups: {
    bg: "#dfdde0",
    right: "#a8a8a8",
    text: "#72420d",
    muted: "#765737",
    tag: "#978d8c",
    accent: "#ce8d03"
  },
  cleancities: {
    bg: "#d6dee2",
    right: "#a8a8a8",
    text: "#141a1a",
    muted: "#354040",
    tag: "#c1a08d",
    accent: "#0486b8"
  },
  basketgoal: {
    bg: "#e9e3df",
    right: "#a8a8a8",
    text: "#1b1c18",
    muted: "#41413a",
    tag: "#f5f5f5",
    accent: "#f48863"
  },
  lavender: {
    bg: "#ffd6f5",
    right: "#a8a8a8",
    text: "#29335C",
    muted: "#464d69",
    tag: "#D387AB",
    accent: "#72d3ba"
  },
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

  const leftW = DESIGN.leftWidth;
  const imageX0 = leftW;
  const imageY0 = 0;
  const imageW = DESIGN.canvasWidth - leftW;
  const imageH = DESIGN.canvasHeight;

  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, leftW, DESIGN.canvasHeight);

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

  const x = DESIGN.textX;

  ctx.fillStyle = t.accent;
  ctx.font = `${DESIGN.titleFontWeight} ${DESIGN.serviceFontSize}px ${DESIGN.fontFamily}`;
  ctx.textBaseline = "top";
  ctx.fillText(fields.serviceName.value || "サービス名", DESIGN.serviceX, DESIGN.serviceY);

  // タイトルは文字数だけでなく「実際の横幅」を測って自動縮小。
  // DESIGN.titleFontSize から始め、titleMaxWidthに収まるまで小さくする。
  const title = fields.title.value || "作品タイトル";
  let titleSize = DESIGN.titleFontSize;
  while (
    titleSize > DESIGN.titleMinFontSize &&
    (() => {
      ctx.font = `${DESIGN.titleFontWeight} ${titleSize}px ${DESIGN.fontFamily}`;
      return ctx.measureText(title).width > DESIGN.titleMaxWidth;
    })()
  ) {
    titleSize -= 1;
  }

  ctx.fillStyle = t.text;
  ctx.font = `${DESIGN.titleFontWeight} ${titleSize}px ${DESIGN.fontFamily}`;
  ctx.fillText(title, x, DESIGN.titleY);

  ctx.fillStyle = t.accent;
  ctx.font = `${DESIGN.genreFontWeight} ${DESIGN.genreFontSize}px ${DESIGN.fontFamily}`;
  ctx.fillText(fields.genre.value || "", x, DESIGN.genreY);

  drawTextBlock(
    fields.description.value,
    x,
    DESIGN.descriptionY,
    DESIGN.descriptionWidth,
    `${DESIGN.descriptionFontSize}px ${DESIGN.fontFamily}`,
    DESIGN.descriptionLineHeight,
    t.muted,
    DESIGN.descriptionMaxLines
  );

  ctx.fillStyle = t.accent;
  ctx.font = `700 ${DESIGN.characterLabelFontSize}px ${DESIGN.characterLabelFontFamily}`;
  ctx.fillText("CHARACTER", x, DESIGN.characterLabelY);

  ctx.fillStyle = t.text;
  ctx.font = `${DESIGN.characterNameFontSize}px ${DESIGN.fontFamily}`;
  ctx.fillText(
    fields.characterName.value || "キャラクター名",
    x + DESIGN.characterNameX,
    DESIGN.characterNameY
  );

  drawTextBlock(
    fields.characterDescription.value,
    x + DESIGN.characterDescriptionX,
    DESIGN.characterDescriptionY,
    DESIGN.characterDescriptionWidth,
    `${DESIGN.characterDescriptionFontSize}px ${DESIGN.fontFamily}`,
    DESIGN.characterDescriptionLineHeight,
    t.muted,
    DESIGN.characterDescriptionMaxLines
  );

  const tags = fields.tags.value
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  let tx = x;
  const tagY = DESIGN.tagY;

  ctx.font = `${DESIGN.tagFontSize}px ${DESIGN.fontFamily}`;
  tags.forEach(tag => {
    const tw = ctx.measureText(tag).width + DESIGN.tagPaddingX * 2;
    ctx.fillStyle = t.tag;
    ctx.beginPath();
    ctx.roundRect(tx, tagY, tw, DESIGN.tagHeight, DESIGN.tagRadius);
    ctx.fill();

    ctx.fillStyle = t.text;
    ctx.fillText(
      tag,
      tx + DESIGN.tagPaddingX,
      tagY + (DESIGN.tagHeight - DESIGN.tagFontSize) / 2
    );
    tx += tw + DESIGN.tagGap;
  });

const catchcopy = "”" + (fields.catchcopy.value || "キャッチコピー") + "”";
let catchcopySize = DESIGN.catchcopyFontSize;

while (
  catchcopySize > DESIGN.catchcopyMinFontSize &&
  (() => {
    ctx.font = `700 ${catchcopySize}px ${DESIGN.fontFamily}`;
    return ctx.measureText(catchcopy).width > DESIGN.catchcopyMaxWidth;
  })()
) {
  catchcopySize -= 1;
}

ctx.fillStyle = t.accent;
ctx.font = `700 ${catchcopySize}px ${DESIGN.fontFamily}`;
ctx.fillText(
  catchcopy,
  x,
  DESIGN.catchcopyY
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

  const imageAreaW = DESIGN.canvasWidth - DESIGN.leftWidth;
  const imageAreaH = DESIGN.canvasHeight;
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
