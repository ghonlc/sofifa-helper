const imageInput = document.getElementById("image-input");
const analyzeBtn = document.getElementById("analyze-btn");
const demoBtn = document.getElementById("demo-btn");
const ocrStatus = document.getElementById("ocr-status");
const ocrTextEl = document.getElementById("ocr-text");
const statsGrid = document.getElementById("stats-grid");
const positionResult = document.getElementById("position-result");

// Stats que vamos a buscar
const STAT_KEYS = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"];

const STAT_LABELS = {
  PAC: "RIT (Ritmo)",
  SHO: "TIR (Tiro)",
  PAS: "PAS (Pase)",
  DRI: "REG (Regate)",
  DEF: "DEF (Defensa)",
  PHY: "FIS (Físico)"
};
// Función auxiliar para mostrar stats en pantalla
function renderStats(stats) {
  statsGrid.innerHTML = "";
  STAT_KEYS.forEach((key) => {
    const div = document.createElement("div");
    div.className = "stat-box";
    const value = stats[key] ?? "-";
    const label = STAT_LABELS[key] || key;
    div.innerHTML = `<span>${label}</span><span class="value">${value}</span>`;
    statsGrid.appendChild(div);
  });
}
// Lógica de cálculo de "mejor posición"
function calculateBestPosition(stats) {
  const pac = stats.PAC ?? 50;
  const sho = stats.SHO ?? 50;
  const pas = stats.PAS ?? 50;
  const dri = stats.DRI ?? 50;
  const def = stats.DEF ?? 50;
  const phy = stats.PHY ?? 50;

  const positions = {
    ST: 0.35 * sho + 0.25 * pac + 0.2 * phy + 0.1 * dri + 0.05 * pas + 0.05 * def,
    CAM: 0.35 * pas + 0.25 * dri + 0.15 * sho + 0.1 * pac + 0.1 * phy + 0.05 * def,
    CM: 0.3 * pas + 0.2 * def + 0.2 * phy + 0.15 * dri + 0.1 * pac + 0.05 * sho,
    CDM: 0.35 * def + 0.3 * phy + 0.15 * pas + 0.1 * dri + 0.05 * pac + 0.05 * sho,
    CB: 0.45 * def + 0.3 * phy + 0.1 * pas + 0.1 * pac + 0.05 * dri,
    LB_RB: 0.3 * pac + 0.3 * def + 0.2 * phy + 0.1 * pas + 0.1 * dri,
    LW_RW: 0.3 * pac + 0.3 * dri + 0.2 * sho + 0.1 * pas + 0.1 * phy
  };

  let bestPosition = null;
  let bestScore = -Infinity;

  Object.entries(positions).forEach(([pos, score]) => {
    if (score > bestScore) {
      bestScore = score;
      bestPosition = pos;
    }
  });

  return {
    bestPosition,
    bestScore: Math.round(bestScore),
    all: positions
  };
}

// Mostrar resultado de posición en la tarjeta final
function renderPositionResult(result, stats) {
  const { bestPosition, bestScore, all } = result;
  let detalle = Object.entries(all)
    .map(([pos, score]) => `${pos}: ${Math.round(score)}`)
    .join(" · ");

  positionResult.innerHTML = `
    <div class="result-main">Posición sugerida: <strong>${bestPosition}</strong> (score aprox. ${bestScore})</div>
    <div class="result-detail">
      Stats base → PAC: ${stats.PAC ?? "-"}, SHO: ${stats.SHO ?? "-"}, PAS: ${stats.PAS ?? "-"}, 
      DRI: ${stats.DRI ?? "-"}, DEF: ${stats.DEF ?? "-"}, PHY: ${stats.PHY ?? "-"}.
    </div>
    <div class="result-detail" style="margin-top:6px;">
      Detalle por posición: ${detalle}
    </div>
  `;
}

// Extrae números del texto OCR en base a "PAC 90", "SHO 82", etc.
function extractStatsFromText(text) {
  const lines = text.split("\n").map((l) => l.trim());
  const stats = {};

  STAT_KEYS.forEach((key) => {
    let regex = new RegExp(`${key}\\s*(\\d{2,3})`, "i");
    for (const line of lines) {
      const match = line.match(regex);
      if (match) {
        stats[key] = parseInt(match[1], 10);
        break;
      }
    }
  });

  return stats;
}

// Procesa una imagen con Tesseract
async function processImage(file) {
  if (!file) {
    alert("Primero selecciona una imagen.");
    return;
  }

  ocrStatus.textContent = "Leyendo imagen con IA (puede tardar unos segundos)...";

  try {
    const { data } = await Tesseract.recognize(file, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          ocrStatus.textContent = `Reconociendo texto... ${Math.round(
            m.progress * 100
          )}%`;
        }
      }
    });

    const text = data.text || "";
    ocrTextEl.textContent = text || "No se detectó texto.";
    ocrStatus.textContent = "OCR completado.";

    const stats = extractStatsFromText(text);
    renderStats(stats);

    const result = calculateBestPosition(stats);
    renderPositionResult(result, stats);

  } catch (err) {
    console.error(err);
    ocrStatus.textContent = "Error procesando la imagen.";
    alert("Ocurrió un error al leer la imagen. Intenta con otra captura o más cerca.");
  }
}

// Botón principal: analizar imagen seleccionada
analyzeBtn.addEventListener("click", async () => {
  const file = imageInput.files[0];
  await processImage(file);
});

// Botón demo: probar con texto fijo sin imagen
demoBtn.addEventListener("click", () => {
  const fakeText = `
    PAC 88
    SHO 82
    PAS 79
    DRI 84
    DEF 45
    PHY 78
  `;
  ocrTextEl.textContent = fakeText.trim();
  const stats = extractStatsFromText(fakeText);
  renderStats(stats);
  const result = calculateBestPosition(stats);
  renderPositionResult(result, stats);
});
