import gameDB from "./database.js";
import gameCases from "./cases.js";

class SQLDetectiveGame {
  constructor() {
    this.currentCase = null;
    this.currentChallengeIndex = 0;
    this.sqlInterface = document.getElementById("sqlInterface");
    this.caseDescription = document.getElementById("caseDescription");
    this.sqlInput = document.getElementById("sqlInput");
    this.runQuery = document.getElementById("runQuery");
    this.queryResult = document.getElementById("queryResult");
    this.returnButton = document.getElementById("returnButton");

    this.gameCanvas = document.getElementById("gameCanvas");
    this.ctx = this.gameCanvas.getContext("2d");

    this.gameState = {
      scene: "welcome",
      playerProgress: 0,
      caseSolved: false,
      cutsceneIndex: 0,
      cutsceneData: null,
      flashlightAngle: 0,
      detectivePos: { x: 300, y: 0 },
      detectiveDirection: 1,
      detectiveSpeed: 3,
      keyState: {
        left: false,
        right: false,
      },
      portalActive: false,
      transitionProgress: 0,
      transitionDirection: "in",
      nextCaseId: null,
    };

    this.assets = {
      detective: null,
      couple: null,
      background: null,
      hallway: null,
      manSmall: null,
      titleFont: 'bold 70px "Film Noir"',
    };

    this.loadAssets();

    this.runQuery.addEventListener("click", () => this.executeQuery());

    if (this.returnButton) {
      this.returnButton.addEventListener("click", () => this.returnToOffice());
    }

    this.gameCanvas.addEventListener("click", (e) => this.handleCanvasClick(e));

    window.addEventListener("keydown", this.handleKeyDown.bind(this));
    window.addEventListener("keyup", this.handleKeyUp.bind(this));

    this.setupPrism();

    this.init();
  }

  loadAssets() {
    const detectiveImg = new Image();
    detectiveImg.src = "public/detective.png";
    detectiveImg.onload = () => {
      this.assets.detective = detectiveImg;
      console.log("Detective image loaded");
    };

    const coupleImg = new Image();
    coupleImg.src = "public/couple.png";
    coupleImg.onload = () => {
      this.assets.couple = coupleImg;
      console.log("Couple image loaded");
    };

    const backgroundImg = new Image();
    backgroundImg.src = "public/background.png";
    backgroundImg.onload = () => {
      this.assets.background = backgroundImg;
      console.log("Background image loaded");
    };

    const hallwayImg = new Image();
    hallwayImg.src = "public/hallway.png";
    hallwayImg.onload = () => {
      this.assets.hallway = hallwayImg;
      console.log("Hallway image loaded");
    };

    const manSmallImg = new Image();
    manSmallImg.src = "public/man-small.jpg";
    manSmallImg.onload = () => {
      this.assets.manSmall = manSmallImg;
      console.log("Man small image loaded");
    };

    const font = new FontFace("Film Noir", "url(public/FilmNoir.ttf)");
    font
      .load()
      .then((loadedFont) => {
        document.fonts.add(loadedFont);
        console.log("Font loaded successfully");
      })
      .catch((error) => {
        console.error("Font loading error:", error);
      });
  }

  setupPrism() {
    if (typeof Prism === "undefined") {
      console.error("Prism is not loaded!");
      return;
    }

    this.sqlInput = document.getElementById("sqlInput");
    this.sqlHighlight = document.getElementById("sqlHighlight");

    if (!this.sqlInput || !this.sqlHighlight) {
      console.error("SQL editor elements not found!");
      return;
    }

    const updateHighlight = () => {
      this.sqlHighlight.textContent = this.sqlInput.value;
      Prism.highlightElement(this.sqlHighlight);
    };

    updateHighlight();

    this.sqlInput.addEventListener("input", updateHighlight);
    this.sqlInput.addEventListener("change", updateHighlight);
    this.sqlInput.addEventListener("keyup", updateHighlight);

    this.sqlInput.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = this.sqlInput.selectionStart;
        const end = this.sqlInput.selectionEnd;
        this.sqlInput.value = `${this.sqlInput.value.substring(0, start)}    ${this.sqlInput.value.substring(end)}`;
        this.sqlInput.selectionStart = this.sqlInput.selectionEnd = start + 4;
        updateHighlight();
      }

      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.executeQuery();
        this.runQuery.classList.add("active");
        setTimeout(() => this.runQuery.classList.remove("active"), 200);
      }
    });
  }

  async init() {
    await gameDB.initialize();

    await this.loadCase(1);

    this.setupLittleJS();

    this.gameLoop();
  }

  async loadCase(caseId) {
    this.currentCase = gameCases.find((c) => c.id === caseId);
    if (!this.currentCase) {
      console.error(`Case with ID ${caseId} not found`);
      return;
    }

    await gameDB.setupCase(this.currentCase);

    this.currentChallengeIndex = 0;

    this.gameState.portalActive = false;

    this.updateCaseInfo();
  }

  updateCaseInfo() {
    if (!this.currentCase) return;

    const challenge = this.currentCase.challenges[this.currentChallengeIndex];

    this.caseDescription.innerHTML = `
            <h3>${this.currentCase.title}</h3>
            <p>${this.currentCase.description}</p>
            <div class="briefing">
                <strong>Detective's Briefing:</strong>
                <p>${this.currentCase.briefing}</p>
            </div>
            <div class="task">
                <strong>Current Task:</strong>
                <p>${challenge.question}</p>
            </div>
            <div class="hint">
                <strong>Hint:</strong>
                <p>${challenge.hint}</p>
            </div>
        `;

    const schemaList = document.getElementById("schemaList");
    schemaList.innerHTML = this.currentCase.tables
      .map(
        (table) => `
            <div class="schema-item">
                <h5>${table.name}</h5>
                <pre>${this.formatCreateStatement(table.createStatement)}</pre>
            </div>
        `
      )
      .join("");
  }

  formatCreateStatement(sql) {
    return sql.replace(/\(/g, "\n  (").replace(/,/g, ",\n   ").replace(/\)/g, "\n  )").trim();
  }

  async executeQuery() {
    const query = this.sqlInput?.value?.trim() || "";

    if (!query) {
      this.showAlert("Please enter a SQL query", "warning");
      return;
    }

    try {
      this.queryResult.innerHTML = "<div class='loading'>Executing query...</div>";

      const result = await gameDB.executeQuery(query);

      if (result.error) {
        this.displayQueryError(result.error);
        return;
      }

      this.displayQueryResults(result);

      this.checkChallengeSolution(query);
    } catch (error) {
      this.displayQueryError(error.message || "An unexpected error occurred");
    }
  }

  displayQueryResults(result) {
    if (!result.rows || result.rows.length === 0) {
      this.queryResult.innerHTML = "<p>Query executed successfully. No results returned.</p>";
      return;
    }

    let tableHtml = "<table><tr>";

    for (const column of result.fields) {
      tableHtml += `<th>${column.name}</th>`;
    }
    tableHtml += "</tr>";

    for (const row of result.rows) {
      tableHtml += "<tr>";
      for (const column of result.fields) {
        tableHtml += `<td>${row[column.name] !== null ? row[column.name] : "NULL"}</td>`;
      }
      tableHtml += "</tr>";
    }

    tableHtml += "</table>";
    this.queryResult.innerHTML = tableHtml;
  }

  displayQueryError(error) {
    this.queryResult.innerHTML = `<div class="error-container">
            <div class="error-icon">⚠️</div>
            <div class="error-message">
                <h4>SQL Error</h4>
                <p>${error}</p>
            </div>
        </div>`;

    this.showAlert(`SQL Error: ${error}`, "error");
  }

  async checkChallengeSolution(query) {
    if (!this.currentCase) return;

    const currentChallenge = this.currentCase.challenges[this.currentChallengeIndex];

    const userResult = await gameDB.executeQuery(query);
    if (userResult.error) return false;

    const expectedResult = await gameDB.executeQuery(currentChallenge.solution);
    if (expectedResult.error) {
      console.error("Solution query error:", expectedResult.error);
      return false;
    }

    if (currentChallenge.validateFn(userResult, expectedResult)) {
      this.showMessage("Correct! You've solved this part of the case!");

      this.currentChallengeIndex++;

      if (this.currentChallengeIndex >= this.currentCase.challenges.length) {
        this.completeCase();
      } else {
        this.updateCaseInfo();
        this.showPortalMessage();
      }

      this.gameState.portalActive = true;

      return true;
    }

    this.showMessage("That's not quite right. Try again!");
    return false;
  }

  completeCase() {
    this.gameState.caseSolved = true;

    this.caseDescription.innerHTML = `
            <h3>Case Solved: ${this.currentCase.title}</h3>
            <p>${this.currentCase.conclusion}</p>
            <div class="success-message message">
                <div>Return to the hallway to continue to the next case</div>
            </div>
        `;

    const nextCaseId = this.currentCase.id + 1;
    const nextCase = gameCases.find((c) => c.id === nextCaseId);

    if (nextCase) {
      this.gameState.nextCaseId = nextCaseId;
      this.gameState.portalActive = true;
      this.showPortalMessage();
    } else {
      this.showGameComplete();
    }
  }

  showPortalMessage() {
    this.showAlert("A portal has appeared in the hallway! Return to proceed.", "info");
  }

  showGameComplete() {
    this.caseDescription.innerHTML = `
            <h3>Congratulations, Detective!</h3>
            <p>You've solved all the cases and proven your SQL mastery.</p>
            <p>Thanks for playing SQL Detective!</p>
        `;
  }

  showAlert(message, type = "info") {
    const alertElement = document.createElement("div");
    alertElement.className = `alert alert-${type}`;

    const alertContent = document.createElement("div");
    alertContent.className = "alert-content";

    const icon = document.createElement("span");
    icon.className = "alert-icon";
    switch (type) {
      case "error":
        icon.textContent = "❌";
        break;
      case "success":
        icon.textContent = "✅";
        break;
      case "warning":
        icon.textContent = "⚠️";
        break;
      default:
        icon.textContent = "ℹ️";
    }

    const text = document.createElement("span");
    text.textContent = message;

    const closeBtn = document.createElement("button");
    closeBtn.className = "alert-close";
    closeBtn.textContent = "×";
    closeBtn.onclick = () => alertElement.remove();

    alertContent.appendChild(icon);
    alertContent.appendChild(text);
    alertElement.appendChild(alertContent);
    alertElement.appendChild(closeBtn);

    document.body.appendChild(alertElement);

    setTimeout(() => alertElement.classList.add("show"), 10);

    if (type !== "error") {
      setTimeout(() => {
        alertElement.classList.remove("show");
        setTimeout(() => alertElement.remove(), 300);
      }, 5000);
    }

    return alertElement;
  }

  showMessage(message, duration = 3000) {
    return this.showAlert(message, "success");
  }

  setupLittleJS() {
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
      gameCanvas.width = window.innerWidth;
      gameCanvas.height = window.innerHeight;
    });

    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" && (this.gameState.scene === "hallway" || this.gameState.scene === "database")) {
        this.keyPressEvent = "Space";
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.code === "Space") {
        this.keyPressEvent = null;
      }
    });
  }

  startTransition(direction) {
    this.gameState.scene = "transition";
    this.gameState.transitionProgress = 0;
    this.gameState.transitionDirection = direction;
  }

  updateTransition() {
    const speed = 0.02;
    this.gameState.transitionProgress += speed;

    if (this.gameState.transitionProgress >= 1) {
      if (this.gameState.transitionDirection === "out") {
        if (this.gameState.nextCaseId) {
          this.loadCase(this.gameState.nextCaseId);
          this.gameState.nextCaseId = null;
        }

        this.gameState.portalActive = false;

        this.gameState.transitionDirection = "in";
        this.gameState.transitionProgress = 0;
      } else {
        this.gameState.scene = "hallway";
        this.gameState.detectivePos = { x: 100, y: 0 };
      }
    }
  }

  drawTransition(width, height) {
    const alpha = this.gameState.transitionDirection === "out" ? this.gameState.transitionProgress : 1 - this.gameState.transitionProgress;

    this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    this.ctx.fillRect(0, 0, width, height);
  }

  gameLoop() {
    this.ctx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);

    if (this.gameState.scene === "transition") {
      this.updateTransition();
    }

    this.drawScene();

    requestAnimationFrame(() => this.gameLoop());
  }

  handleCanvasClick(e) {
    const { width, height } = this.gameCanvas;
    const x = e.clientX;
    const y = e.clientY;

    switch (this.gameState.scene) {
      case "welcome":
        this.startCutscene();
        break;

      case "cutscene":
        this.advanceCutscene();
        break;

      case "office":
        if (x > width / 2 - 100 && x < width / 2 + 100 && y > height / 2 - 90 && y < height / 2 + 30) {
          this.gameState.scene = "database";
          this.sqlInterface.classList.remove("hidden");
        }
        break;
    }
  }

  handleKeyDown(e) {
    if (this.gameState.scene !== "hallway") return;

    if (e.key === "ArrowLeft" || e.key === "a") {
      this.gameState.keyState.left = true;
    } else if (e.key === "ArrowRight" || e.key === "d") {
      this.gameState.keyState.right = true;
    }
  }

  handleKeyUp(e) {
    if (this.gameState.scene !== "hallway") return;

    if (e.key === "ArrowLeft" || e.key === "a") {
      this.gameState.keyState.left = false;
    } else if (e.key === "ArrowRight" || e.key === "d") {
      this.gameState.keyState.right = false;
    }
  }

  startCutscene() {
    this.gameState.scene = "cutscene";
    this.gameState.cutsceneIndex = 0;
    this.gameState.cutsceneData = this.getCutsceneData();
  }

  getCutsceneData() {
    return [
      {
        speaker: "Detective",
        text: "So, called out to a jungle mansion on your wedding day. What happened exactly?",
        position: "left",
      },
      {
        speaker: "Husband",
        text: "We were in the middle of our ceremony when we heard a gunshot somewhere on the property.",
        position: "right",
      },
      {
        speaker: "Wife",
        text: "A TERRIBLE GUNSHOT! During our SACRED VOWS! My perfect day, RUINED FOREVER!",
        position: "right",
      },
      {
        speaker: "Detective",
        text: "Gunshots at weddings? Usually the firing doesn't start until after the honeymoon.",
        position: "left",
      },
      {
        speaker: "Wife",
        text: "This is NOT a JOKING MATTER, detective! Someone could be DEAD! At MY WEDDING!",
        position: "right",
      },
      {
        speaker: "Husband",
        text: "That's why we called you. The mansion has a security database that might help find answers.",
        position: "right",
      },
      {
        speaker: "Detective",
        text: "Ah, a SQL mystery in paradise. Better than the usual cheating spouses and insurance fraud.",
        position: "left",
      },
      {
        speaker: "Wife",
        text: "Can you PLEASE solve this QUICKLY? I CANNOT return to my guests until this is RESOLVED!",
        position: "right",
      },
      {
        speaker: "Detective",
        text: "Don't worry. I'll query this faster than your wedding DJ can play the Macarena.",
        position: "left",
      },
      {
        speaker: "Husband",
        text: "Here are the access credentials to our security database. It tracks everyone on the grounds.",
        position: "right",
      },
    ];
  }

  advanceCutscene() {
    if (this.gameState.cutsceneIndex < this.gameState.cutsceneData.length - 1) {
      this.gameState.cutsceneIndex++;
    } else {
      this.gameState.scene = "hallway";
      this.gameState.detectivePos = { x: 100, y: 0 };
    }
  }

  drawScene() {
    const { width, height } = this.gameCanvas;

    switch (this.gameState.scene) {
      case "welcome":
        this.drawWelcomeScreen(width, height);
        break;

      case "cutscene":
        this.drawCutscene(width, height);
        break;

      case "hallway":
        this.drawHallwayScene(width, height);
        break;

      case "office":
        this.drawOfficeScene(width, height);
        break;

      case "database":
        this.ctx.fillStyle = "#1a1a1a";
        this.ctx.fillRect(0, 0, width, height);
        break;

      case "transition":
        this.drawTransition(width, height);
        break;
    }
  }

  drawWelcomeScreen(width, height) {
    if (this.assets.background) {
      this.ctx.drawImage(this.assets.background, 0, 0, width, height);

      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      this.ctx.fillRect(0, 0, width, height);
    } else {
      this.ctx.fillStyle = "#0a0a0a";
      this.ctx.fillRect(0, 0, width, height);
    }

    this.drawFog(width, height);

    this.gameState.flashlightAngle += 0.01;
    if (this.gameState.flashlightAngle > Math.PI * 2) {
      this.gameState.flashlightAngle = 0;
    }

    this.drawFlashlight(width, height);

    if (this.assets.manSmall) {
      const imgWidth = Math.min(400, width * 0.3);
      const aspectRatio = this.assets.manSmall.height / this.assets.manSmall.width;
      const imgHeight = imgWidth * aspectRatio;
      const imgX = width / 2 - imgWidth / 2;
      const imgY = height / 2 - imgHeight / 2;

      this.ctx.drawImage(this.assets.manSmall, imgX, imgY, imgWidth, imgHeight);

      this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      this.ctx.fillRect(imgX, imgY, imgWidth, imgHeight);

      const gradient = this.ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, Math.max(width, height) / 2);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.7)");
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, width, height);
    } else if (this.assets.detective) {
      const detectiveWidth = Math.min(400, width * 0.3);
      const aspectRatio = this.assets.detective.height / this.assets.detective.width;
      const detectiveHeight = detectiveWidth * aspectRatio;
      const detectiveX = width / 2 - detectiveWidth / 2;
      const detectiveY = height / 2 - detectiveHeight / 2;

      this.ctx.globalCompositeOperation = "screen";
      this.ctx.drawImage(this.assets.detective, detectiveX, detectiveY, detectiveWidth, detectiveHeight);
      this.ctx.globalCompositeOperation = "source-over";
    } else {
      this.ctx.fillStyle = "rgba(150, 150, 150, 0.5)";
      this.ctx.fillRect(width / 2 - 100, height / 2 - 150, 200, 300);
    }

    if (document.fonts.check(this.assets.titleFont)) {
      this.ctx.font = this.assets.titleFont;
      this.ctx.textAlign = "center";

      this.ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
      this.ctx.shadowBlur = 15;
      this.ctx.shadowOffsetX = 5;
      this.ctx.shadowOffsetY = 5;

      this.ctx.fillStyle = "rgba(220, 220, 220, 0.9)";
      this.ctx.fillText("NOIR SQL", width / 2, height / 2 + 200);

      this.ctx.shadowBlur = 0;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;
    } else {
      this.ctx.font = "bold 70px sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.fillStyle = "white";
      this.ctx.fillText("NOIR SQL", width / 2, height / 2 + 200);
    }

    const pulseIntensity = 0.5 + 0.5 * Math.sin(Date.now() / 500);
    this.ctx.font = "28px Arial";
    this.ctx.fillStyle = `rgba(255, 255, 255, ${pulseIntensity})`;
    this.ctx.textAlign = "center";
    this.ctx.fillText("Click to Play", width / 2, height - 100);
  }

  drawFog(width, height) {
    const time = Date.now() / 10000;
    const fogCount = 5;

    for (let i = 0; i < fogCount; i++) {
      const x = ((width * (i / fogCount + time)) % (width * 2)) - width / 2;
      const y = height / 2 + 50 * Math.sin(time * 2 + i);
      const radius = width * 0.5;

      const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, "rgba(50, 50, 65, 0.3)");
      gradient.addColorStop(1, "rgba(50, 50, 65, 0)");

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, width, height);
    }
  }

  drawFlashlight(width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const angle = this.gameState.flashlightAngle;

    const beamLength = Math.max(width, height);
    const beamWidth = Math.PI / 8;

    const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, beamLength);
    gradient.addColorStop(0, "rgba(255, 255, 200, 0.3)");
    gradient.addColorStop(1, "rgba(255, 255, 200, 0)");

    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);
    this.ctx.arc(centerX, centerY, beamLength, angle - beamWidth, angle + beamWidth);
    this.ctx.closePath();

    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }

  drawCutscene(width, height) {
    const currentDialog = this.gameState.cutsceneData[this.gameState.cutsceneIndex];

    if (this.assets.background) {
      this.ctx.drawImage(this.assets.background, 0, 0, width, height);

      this.ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      this.ctx.fillRect(0, 0, width, height);
    } else {
      this.ctx.fillStyle = "#2d2d2d";
      this.ctx.fillRect(0, 0, width, height);
    }

    if (this.assets.detective && currentDialog.position === "left") {
      const detectiveWidth = Math.min(300, width * 0.25);
      const aspectRatio = this.assets.detective.height / this.assets.detective.width;
      const detectiveHeight = detectiveWidth * aspectRatio;
      const detectiveX = 100;
      const detectiveY = height - detectiveHeight - 220;

      this.ctx.drawImage(this.assets.detective, detectiveX, detectiveY, detectiveWidth, detectiveHeight);

      if (currentDialog.speaker === "Detective") {
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(detectiveX - 5, detectiveY - 5, detectiveWidth + 10, detectiveHeight + 10);
      }
    }

    if (this.assets.couple) {
      const coupleWidth = Math.min(380, width * 0.3);
      const aspectRatio = this.assets.couple.height / this.assets.couple.width;
      const coupleHeight = coupleWidth * aspectRatio;
      const coupleX = width - coupleWidth - 100;
      const coupleY = height - coupleHeight - 220;

      this.ctx.drawImage(this.assets.couple, coupleX, coupleY, coupleWidth, coupleHeight);

      if (currentDialog.position === "right") {
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(coupleX - 5, coupleY - 5, coupleWidth + 10, coupleHeight + 10);
      }
    }

    const dialogBoxHeight = 200;
    const gradient = this.ctx.createLinearGradient(0, height - dialogBoxHeight, 0, height);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.85)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.95)");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, height - dialogBoxHeight, width, dialogBoxHeight);

    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(10, height - dialogBoxHeight + 10, width - 20, dialogBoxHeight - 20);

    this.ctx.fillStyle = "white";
    this.ctx.font = "bold 26px Arial";
    this.ctx.textAlign = "left";

    this.ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    this.ctx.shadowBlur = 5;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    this.ctx.fillText(`${currentDialog.speaker}:`, 50, height - dialogBoxHeight + 50);

    this.ctx.shadowBlur = 3;
    this.ctx.font = "22px Arial";
    this.ctx.fillText(currentDialog.text, 50, height - dialogBoxHeight + 90);
    this.ctx.shadowBlur = 0;

    const pulseIntensity = 0.5 + 0.5 * Math.sin(Date.now() / 500);
    this.ctx.font = "18px Arial";
    this.ctx.fillStyle = `rgba(200, 200, 200, ${pulseIntensity})`;
    this.ctx.textAlign = "right";
    this.ctx.fillText("Click to continue", width - 50, height - 50);
  }

  drawHallwayScene(width, height) {
    if (this.assets.hallway) {
      const imgAspectRatio = this.assets.hallway.width / this.assets.hallway.height;
      const canvasAspectRatio = width / height;

      let drawWidth = width;
      let drawHeight = width / imgAspectRatio;
      let offsetX = 0;
      let offsetY = 0;

      if (drawHeight < height) {
        drawHeight = height;
        drawWidth = height * imgAspectRatio;
        offsetX = (width - drawWidth) / 2;
      } else {
        offsetY = (height - drawHeight) / 2;
      }

      this.ctx.drawImage(this.assets.hallway, offsetX, offsetY, drawWidth, drawHeight);
    } else {
      this.ctx.fillStyle = "#333";
      this.ctx.fillRect(0, 0, width, height);
    }

    const hallwayLeft = 50;
    const hallwayRight = width - 150;

    if (this.gameState.portalActive) {
      this.drawPortal(hallwayRight - 100, height - 550, 150, 280);
    }

    const interactionZoneX = width / 2 - 100;
    const interactionZoneY = height - 550;
    const interactionZoneWidth = 200;
    const interactionZoneHeight = 150;

    const debugMode = false;
    if (debugMode) {
      this.ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
      this.ctx.fillRect(interactionZoneX, interactionZoneY, interactionZoneWidth, interactionZoneHeight);
      this.ctx.strokeStyle = "rgba(0, 255, 0, 0.7)";
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(interactionZoneX, interactionZoneY, interactionZoneWidth, interactionZoneHeight);
    }

    this.updateDetectivePosition(hallwayLeft, hallwayRight);

    const groundY = height - 260;

    if (this.assets.detective) {
      const detectiveWidth = 250;
      const aspectRatio = this.assets.detective.height / this.assets.detective.width;
      const detectiveHeight = detectiveWidth * aspectRatio;

      const detectiveX = this.gameState.detectivePos.x;
      const detectiveY = groundY - detectiveHeight;
      const detectiveCollisionWidth = 100;

      if (this.gameState.detectiveDirection < 0) {
        this.ctx.save();
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(this.assets.detective, -detectiveX - detectiveWidth, detectiveY, detectiveWidth, detectiveHeight);
        this.ctx.restore();
      } else {
        this.ctx.drawImage(this.assets.detective, detectiveX, detectiveY, detectiveWidth, detectiveHeight);
      }

      const detectiveRight = detectiveX + detectiveCollisionWidth;
      const detectiveLeft = detectiveX;

      const isOverlapping =
        detectiveRight > interactionZoneX &&
        detectiveLeft < interactionZoneX + interactionZoneWidth &&
        detectiveY + detectiveHeight > interactionZoneY &&
        detectiveY < interactionZoneY + interactionZoneHeight;

      if (isOverlapping) {
        this.ctx.fillStyle = "white";
        this.ctx.font = "16px Arial";
        this.ctx.textAlign = "center";

        const promptY = detectiveY - 20;
        const pulseIntensity = 0.7 + 0.3 * Math.sin(Date.now() / 300);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${pulseIntensity})`;
        this.ctx.fillText("Press SPACE to access terminal", detectiveX + detectiveCollisionWidth / 2, promptY);

        const glow = this.ctx.createRadialGradient(
          detectiveX + detectiveCollisionWidth / 2,
          detectiveY + detectiveHeight / 2,
          0,
          detectiveX + detectiveCollisionWidth / 2,
          detectiveY + detectiveHeight / 2,
          120
        );
        glow.addColorStop(0, "rgba(100, 180, 255, 0.2)");
        glow.addColorStop(1, "rgba(100, 180, 255, 0)");

        this.ctx.fillStyle = glow;
        this.ctx.fillRect(detectiveX - 30, detectiveY - 30, detectiveWidth + 60, detectiveHeight + 60);

        if (this.keyPressEvent === "Space") {
          this.gameState.scene = "database";
          this.sqlInterface.classList.remove("hidden");
          this.keyPressEvent = null;
        }
      }
    } else {
      this.ctx.fillStyle = "rgba(200, 200, 200, 0.8)";
      this.ctx.fillRect(this.gameState.detectivePos.x, groundY - 150, 100, 150);
    }

    this.ctx.fillStyle = "white";
    this.ctx.font = "18px Arial";
    this.ctx.textAlign = "center";
    this.ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    this.ctx.shadowBlur = 5;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;

    if (this.gameState.portalActive) {
      this.ctx.fillText("Use arrow keys or A/D to move", width / 2, 50);
      this.ctx.fillText("Look for the portal or terminal access points", width / 2, 80);
    } else {
      this.ctx.fillText("Use arrow keys or A/D to move", width / 2, 50);
      this.ctx.fillText("Explore the hallway for database access points", width / 2, 80);
    }

    this.ctx.shadowBlur = 0;

    if (this.gameState.portalActive) {
      const portalX = hallwayRight - 100;
      const portalY = height - 550;
      const portalWidth = 150;
      const portalHeight = 280;

      const detectiveRight = this.gameState.detectivePos.x + 100;
      const detectiveLeft = this.gameState.detectivePos.x;
      const detectiveTop = groundY - 250;
      const detectiveBottom = groundY;

      if (detectiveRight > portalX && detectiveLeft < portalX + portalWidth && detectiveBottom > portalY && detectiveTop < portalY + portalHeight) {
        this.ctx.fillStyle = "white";
        this.ctx.font = "16px Arial";
        this.ctx.textAlign = "center";

        const promptY = portalY - 20;
        const pulseIntensity = 0.7 + 0.3 * Math.sin(Date.now() / 300);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${pulseIntensity})`;
        this.ctx.fillText("Press SPACE to enter portal", portalX + portalWidth / 2, promptY);

        if (this.keyPressEvent === "Space") {
          this.startTransition("out");
          this.keyPressEvent = null;
        }
      }
    }
  }

  drawOfficeScene(width, height) {
    if (this.assets.background) {
      this.ctx.drawImage(this.assets.background, 0, 0, width, height);

      this.ctx.fillStyle = "rgba(30, 40, 60, 0.4)";
      this.ctx.fillRect(0, 0, width, height);
    } else {
      this.ctx.fillStyle = "#3a5a78";
      this.ctx.fillRect(0, 0, width, height);
    }

    if (this.assets.detective) {
      const detectiveWidth = Math.min(250, width * 0.2);
      const aspectRatio = this.assets.detective.height / this.assets.detective.width;
      const detectiveHeight = detectiveWidth * aspectRatio;

      this.ctx.drawImage(this.assets.detective, width / 2 - 300, height / 2 - 100, detectiveWidth, detectiveHeight);
    }

    this.ctx.fillStyle = "rgba(139, 90, 43, 0.8)";
    this.ctx.fillRect(width / 2 - 200, height / 2, 400, 20);

    this.ctx.fillStyle = "#333";
    this.ctx.fillRect(width / 2 - 100, height / 2 - 90, 200, 120);
    this.ctx.fillStyle = "#87ceeb";
    this.ctx.fillRect(width / 2 - 90, height / 2 - 80, 180, 100);

    const glowSize = 10 + 5 * Math.sin(Date.now() / 300);
    const glowGradient = this.ctx.createRadialGradient(width / 2, height / 2 - 30, 0, width / 2, height / 2 - 30, 150 + glowSize);
    glowGradient.addColorStop(0, "rgba(135, 206, 235, 0.3)");
    glowGradient.addColorStop(1, "rgba(135, 206, 235, 0)");
    this.ctx.fillStyle = glowGradient;
    this.ctx.fillRect(width / 2 - 200, height / 2 - 180, 400, 300);

    this.ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    this.ctx.shadowBlur = 5;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    this.ctx.fillStyle = "white";
    this.ctx.font = "24px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText("Click on the computer to investigate case", width / 2, height / 2 + 150);
    this.ctx.shadowBlur = 0;
  }

  drawPortal(x, y, width, height) {
    const time = Date.now() / 1000;
    const glowIntensity = 0.6 + 0.4 * Math.sin(time * 2);

    const gradient = this.ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.8 * glowIntensity})`);
    gradient.addColorStop(0.5, `rgba(220, 240, 255, ${0.9 * glowIntensity})`);
    gradient.addColorStop(1, `rgba(255, 255, 255, ${0.8 * glowIntensity})`);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x, y, width, height);

    this.ctx.strokeStyle = `rgba(255, 255, 255, ${glowIntensity})`;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);

    this.ctx.fillStyle = `rgba(200, 220, 255, ${0.7 * glowIntensity})`;
    this.ctx.fillRect(x + width * 0.1, y + height * 0.1, width * 0.8, height * 0.8);

    this.ctx.font = "16px Arial";
    this.ctx.fillStyle = "white";
    this.ctx.textAlign = "center";
    this.ctx.fillText("Next Challenge", x + width / 2, y - 10);

    const outerGlow = this.ctx.createRadialGradient(x + width / 2, y + height / 2, width / 3, x + width / 2, y + height / 2, width);
    outerGlow.addColorStop(0, `rgba(255, 255, 255, ${0.3 * glowIntensity})`);
    outerGlow.addColorStop(1, "rgba(255, 255, 255, 0)");

    this.ctx.fillStyle = outerGlow;
    this.ctx.fillRect(x - width / 2, y - height / 2, width * 2, height * 2);
  }

  updateDetectivePosition(leftBound, rightBound) {
    if (this.gameState.scene !== "hallway") return;

    let moveX = 0;

    if (this.gameState.keyState.left) {
      moveX -= this.gameState.detectiveSpeed;
      this.gameState.detectiveDirection = -1;
    }

    if (this.gameState.keyState.right) {
      moveX += this.gameState.detectiveSpeed;
      this.gameState.detectiveDirection = 1;
    }

    const newX = this.gameState.detectivePos.x + moveX;

    if (newX >= leftBound && newX <= rightBound - 100) {
      this.gameState.detectivePos.x = newX;
    }
  }

  returnToOffice() {
    this.gameState.scene = "hallway";
    this.sqlInterface.classList.add("hidden");

    if (this.gameState.portalActive) {
      this.showAlert("Return to the portal to proceed to the next challenge", "info");
    } else {
      this.showAlert("Returning to hallway...", "info");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const game = new SQLDetectiveGame();
});
