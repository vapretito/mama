const photoButtons = Array.from(document.querySelectorAll(".photo-chip"));
const mirrorPhoto = document.getElementById("mirrorPhoto");
const storyPhoto = document.getElementById("storyPhoto");
const mirrorStage = document.getElementById("mirrorStage");
const mirrorTrigger = document.getElementById("mirrorTrigger");
const resetMirror = document.getElementById("resetMirror");
const answerText = document.getElementById("answerText");
const tapHint = document.getElementById("tapHint");
const shareStory = document.getElementById("shareStory");
const downloadStory = document.getElementById("downloadStory");
const shareHint = document.getElementById("shareHint");
const storyCanvas = document.getElementById("storyCanvas");
const questionInput = document.getElementById("questionInput");
const mirrorQuestionText = document.getElementById("mirrorQuestionText");
const chatQuestionText = document.getElementById("chatQuestionText");
const chatAnswerText = document.getElementById("chatAnswerText");
const chatFinalText = document.getElementById("chatFinalText");
const sharePanel = document.querySelector(".share-panel");

const mirrorReplies = [
  {
    short: "Obvio que eres tu.",
    final: "La mama mas bonita de todas eres tu.",
    mirror: "La mas bonita eres tu."
  },
  {
    short: "No tengo dudas, eres tu.",
    final: "La reina mas bonita de todas eres tu.",
    mirror: "La reina del espejo eres tu."
  },
  {
    short: "Facilisimo: eres tu.",
    final: "La mama mas linda, mas fuerte y mas brillante eres tu.",
    mirror: "La mas linda de todas eres tu."
  }
];

let selectedPhoto = "./mama-sonrisa.jpeg";
let replyIndex = 0;

photoButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextPhoto = `./${button.dataset.photo}`;
    selectedPhoto = nextPhoto;
    mirrorPhoto.src = nextPhoto;
    storyPhoto.src = nextPhoto;

    photoButtons.forEach((chip) => chip.classList.remove("active"));
    button.classList.add("active");
  });
});

questionInput.addEventListener("input", syncQuestionText);
mirrorTrigger.addEventListener("click", revealMirror);
resetMirror.addEventListener("click", resetMirrorMoment);

function syncQuestionText() {
  const question = getQuestion();
  mirrorQuestionText.textContent = question;
  chatQuestionText.textContent = question;
}

function getQuestion() {
  const trimmed = questionInput.value.trim();
  return trimmed || "Espejito, espejito... quien es la mama mas bonita de todas?";
}

function revealMirror() {
  syncQuestionText();
  const reply = mirrorReplies[replyIndex];
  answerText.textContent = reply.mirror;
  chatAnswerText.textContent = reply.short;
  chatFinalText.textContent = reply.final;
  mirrorStage.classList.add("revealed");
  tapHint.textContent = "El espejo respondio con toda la verdad.";
  restartChatAnimation();
  replyIndex = (replyIndex + 1) % mirrorReplies.length;
}

function resetMirrorMoment() {
  mirrorStage.classList.remove("revealed");
  tapHint.textContent = "Escribe la pregunta y toca “Preguntar”";
  restartChatAnimation();
}

shareStory.addEventListener("click", async () => {
  try {
    const file = await buildStoryFile();

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: "Conversacion con Espejito",
        text: "Mira lo que respondio el espejito.",
        files: [file]
      });
      shareHint.textContent = "Se abrio la hoja de compartir del celular.";
      return;
    }

    await downloadStoryImage();
    shareHint.textContent = "Tu navegador no compartio directo, asi que deje descargada la conversacion.";
  } catch (error) {
    await downloadStoryImage();
    shareHint.textContent = "No pude abrir compartir, pero la conversacion ya quedo descargada.";
  }
});

downloadStory.addEventListener("click", async () => {
  await downloadStoryImage();
  shareHint.textContent = "Conversacion descargada y lista para subir.";
});

async function downloadStoryImage() {
  const blob = await buildStoryBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "chat-espejito-mama.png";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

async function buildStoryFile() {
  const blob = await buildStoryBlob();
  return new File([blob], "chat-espejito-mama.png", { type: "image/png" });
}

async function buildStoryBlob() {
  syncQuestionText();

  const context = storyCanvas.getContext("2d");
  const image = await loadImage(selectedPhoto);
  const question = getQuestion();
  const activeReply = mirrorReplies[(replyIndex + mirrorReplies.length - 1) % mirrorReplies.length];

  context.clearRect(0, 0, storyCanvas.width, storyCanvas.height);

  const background = context.createLinearGradient(0, 0, 0, storyCanvas.height);
  background.addColorStop(0, "#241328");
  background.addColorStop(1, "#120913");
  context.fillStyle = background;
  context.fillRect(0, 0, storyCanvas.width, storyCanvas.height);

  context.fillStyle = "rgba(255,255,255,0.03)";
  for (let y = 0; y < storyCanvas.height; y += 48) {
    context.fillRect(0, y, storyCanvas.width, 1);
  }

  roundRect(context, 56, 80, 968, 1760, 42);
  context.fillStyle = "rgba(255, 247, 244, 0.06)";
  context.fill();
  context.strokeStyle = "rgba(255, 228, 221, 0.16)";
  context.lineWidth = 3;
  context.stroke();

  drawTopBar(context);

  let currentY = 212;
  currentY = drawMessage(context, {
    x: 528,
    y: currentY,
    width: 430,
    bg: "#d8fdd1",
    color: "#11331f",
    text: question,
    time: "10:44",
    align: "right"
  });

  currentY += 22;
  currentY = drawMessage(context, {
    x: 98,
    y: currentY,
    width: 360,
    bg: "#fff7f2",
    color: "#241720",
    text: "Permiteme mirar bien...",
    time: "10:44",
    align: "left"
  });

  currentY += 22;
  currentY = drawPhotoMessage(context, image, {
    x: 98,
    y: currentY,
    width: 560,
    height: 700,
    text: activeReply.short,
    time: "10:45"
  });

  currentY += 22;
  drawMessage(context, {
    x: 98,
    y: currentY,
    width: 520,
    bg: "rgba(255, 236, 241, 0.96)",
    color: "#241720",
    text: activeReply.final,
    time: "10:45",
    align: "left"
  });

  return await new Promise((resolve) => {
    storyCanvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

function drawTopBar(context) {
  roundRect(context, 78, 102, 924, 88, 28);
  context.fillStyle = "rgba(255,247,244,0.05)";
  context.fill();

  const avatarGradient = context.createLinearGradient(96, 118, 148, 170);
  avatarGradient.addColorStop(0, "#f7ddae");
  avatarGradient.addColorStop(1, "#f29eb8");
  context.fillStyle = avatarGradient;
  context.beginPath();
  context.arc(138, 146, 24, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#321112";
  context.font = "bold 28px 'Segoe UI'";
  context.fillText("E", 129, 155);

  context.fillStyle = "#fff7f3";
  context.font = "bold 28px 'Segoe UI'";
  context.fillText("Espejito", 178, 142);

  context.fillStyle = "rgba(236, 207, 215, 0.88)";
  context.font = "22px 'Segoe UI'";
  context.fillText("en linea", 178, 170);
}

function drawMessage(context, options) {
  const paddingX = 22;
  const paddingTop = 18;
  const lineHeight = 38;
  const maxTextWidth = options.width - paddingX * 2;
  const lines = measureWrappedLines(context, options.text, "34px 'Segoe UI'", maxTextWidth);
  const bubbleHeight = paddingTop + lines.length * lineHeight + 34;

  roundRect(context, options.x, options.y, options.width, bubbleHeight, 26);
  context.fillStyle = options.bg;
  context.fill();

  context.fillStyle = options.color;
  context.font = "34px 'Segoe UI'";

  let textY = options.y + paddingTop + 26;
  lines.forEach((line) => {
    context.fillText(line, options.x + paddingX, textY);
    textY += lineHeight;
  });

  context.fillStyle = "rgba(16,16,16,0.42)";
  context.font = "20px 'Segoe UI'";
  context.fillText(options.time, options.x + options.width - 78, options.y + bubbleHeight - 12);

  return options.y + bubbleHeight;
}

function drawPhotoMessage(context, image, options) {
  const bubbleHeight = options.height + 124;

  roundRect(context, options.x, options.y, options.width, bubbleHeight, 28);
  context.fillStyle = "#fff7f2";
  context.fill();

  context.save();
  roundRect(context, options.x + 16, options.y + 16, options.width - 32, options.height, 20);
  context.clip();

  const scale = Math.max((options.width - 32) / image.width, options.height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const offsetX = options.x + 16 + ((options.width - 32) - drawWidth) / 2;
  const offsetY = options.y + 16 + (options.height - drawHeight) / 2;
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  context.restore();

  context.fillStyle = "#241720";
  context.font = "34px 'Segoe UI'";
  context.fillText(options.text, options.x + 20, options.y + options.height + 62);

  context.fillStyle = "rgba(16,16,16,0.42)";
  context.font = "20px 'Segoe UI'";
  context.fillText(options.time, options.x + options.width - 78, options.y + bubbleHeight - 14);

  return options.y + bubbleHeight;
}

function measureWrappedLines(context, text, font, maxWidth) {
  context.font = font;
  const words = text.split(" ");
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });

  if (line) {
    lines.push(line);
  }

  return lines;
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function restartChatAnimation() {
  sharePanel.classList.remove("animate-chat");
  void sharePanel.offsetWidth;
  sharePanel.classList.add("animate-chat");
}

restartChatAnimation();
