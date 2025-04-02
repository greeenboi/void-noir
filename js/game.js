// Import our modules
import gameDB from './database.js';
import gameCases from './cases.js';

class SQLDetectiveGame {
    constructor() {
        this.currentCase = null;
        this.currentChallengeIndex = 0;
        this.sqlInterface = document.getElementById('sqlInterface');
        this.caseDescription = document.getElementById('caseDescription');
        this.sqlInput = document.getElementById('sqlInput'); // Fixed reference
        this.runQuery = document.getElementById('runQuery');
        this.queryResult = document.getElementById('queryResult');
        this.returnButton = document.getElementById('returnButton'); // Add button reference
        
        this.gameCanvas = document.getElementById('gameCanvas');
        this.ctx = this.gameCanvas.getContext('2d');
        
        // Game state - updated with more states
        this.gameState = {
            scene: 'welcome', // welcome, cutscene, office, crime_scene, database
            playerProgress: 0,
            caseSolved: false,
            cutsceneIndex: 0,
            cutsceneData: null,
            flashlightAngle: 0,
            detectivePos: { x: 0, y: 0 }
        };
        
        // Game assets
        this.assets = {
            detective: null,
            couple: null,
            background: null,
            titleFont: 'bold 70px "Film Noir"'
        };
        
        // Load assets
        this.loadAssets();
        
        // Bind events
        this.runQuery.addEventListener('click', () => this.executeQuery());
        
        // Add return button event
        if (this.returnButton) {
            this.returnButton.addEventListener('click', () => this.returnToOffice());
        }
        
        // Add canvas click event
        this.gameCanvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        // Setup Prism for syntax highlighting
        this.setupPrism();
        
        // Initialize the game
        this.init();
    }
    
    loadAssets() {
        // Load detective character
        const detectiveImg = new Image();
        detectiveImg.src = 'public/detective.png';
        detectiveImg.onload = () => {
            this.assets.detective = detectiveImg;
            console.log("Detective image loaded");
        };
        
        // Load couple
        const coupleImg = new Image();
        coupleImg.src = 'public/couple.png';
        coupleImg.onload = () => {
            this.assets.couple = coupleImg;
            console.log("Couple image loaded");
        };
        
        // Load background
        const backgroundImg = new Image();
        backgroundImg.src = 'public/background.png';
        backgroundImg.onload = () => {
            this.assets.background = backgroundImg;
            console.log("Background image loaded");
        };
        
        // Load custom font for title
        const font = new FontFace('Film Noir', 'url(public/FilmNoir.ttf)');
        font.load().then(loadedFont => {
            document.fonts.add(loadedFont);
            console.log('Font loaded successfully');
        }).catch(error => {
            console.error('Font loading error:', error);
        });
    }
    
    setupPrism() {
        if (typeof Prism === 'undefined') {
            console.error('Prism is not loaded!');
            return;
        }
        
        this.sqlInput = document.getElementById('sqlInput'); // Make sure we have the reference
        this.sqlHighlight = document.getElementById('sqlHighlight'); // Use the renamed element
        
        if (!this.sqlInput || !this.sqlHighlight) {
            console.error('SQL editor elements not found!');
            return;
        }

        const updateHighlight = () => {
            // Copy content to the code element for highlighting
            this.sqlHighlight.textContent = this.sqlInput.value;
            // Re-highlight
            Prism.highlightElement(this.sqlHighlight);
        };

        // Initial highlight
        updateHighlight();

        // Update on any input
        this.sqlInput.addEventListener('input', updateHighlight);
        this.sqlInput.addEventListener('change', updateHighlight);
        this.sqlInput.addEventListener('keyup', updateHighlight);

        // Handle tab key and Ctrl+Enter
        this.sqlInput.addEventListener('keydown', (e) => {
            // Handle tab key
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.sqlInput.selectionStart;
                const end = this.sqlInput.selectionEnd;
                this.sqlInput.value = `${this.sqlInput.value.substring(0, start)}    ${this.sqlInput.value.substring(end)}`;
                this.sqlInput.selectionStart = this.sqlInput.selectionEnd = start + 4;
                updateHighlight();
            }
            
            // Handle Ctrl+Enter to run query
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.executeQuery();
                // Show visual feedback that the shortcut worked
                this.runQuery.classList.add('active');
                setTimeout(() => this.runQuery.classList.remove('active'), 200);
            }
        });
    }
    
    async init() {
        // Initialize database
        await gameDB.initialize();
        
        // Load first case
        await this.loadCase(1);
        
        // Set up LittleJS game
        this.setupLittleJS();
        
        // Start the game loop
        this.gameLoop();
    }
    
    async loadCase(caseId) {
        this.currentCase = gameCases.find(c => c.id === caseId);
        if (!this.currentCase) {
            console.error(`Case with ID ${caseId} not found`);
            return;
        }
        
        // Setup database tables for this case
        await gameDB.setupCase(this.currentCase);
        
        // Reset challenge index
        this.currentChallengeIndex = 0;
        
        // Update UI with case info
        this.updateCaseInfo();
    }
    
    updateCaseInfo() {
        if (!this.currentCase) return;
        
        const challenge = this.currentCase.challenges[this.currentChallengeIndex];
        
        // Update case description
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

        // Update schema information
        const schemaList = document.getElementById('schemaList');
        schemaList.innerHTML = this.currentCase.tables.map(table => `
            <div class="schema-item">
                <h5>${table.name}</h5>
                <pre>${this.formatCreateStatement(table.createStatement)}</pre>
            </div>
        `).join('');
    }

    formatCreateStatement(sql) {
        // Basic SQL formatting for better readability
        return sql
            .replace(/\(/g, '\n  (')
            .replace(/,/g, ',\n   ')
            .replace(/\)/g, '\n  )')
            .trim();
    }
    
    async executeQuery() {
        // Get query safely using optional chaining to avoid errors
        const query = this.sqlInput?.value?.trim() || '';
        
        if (!query) {
            this.showAlert("Please enter a SQL query", "warning");
            return;
        }
        
        try {
            // Show loading state
            this.queryResult.innerHTML = "<div class='loading'>Executing query...</div>";
            
            // Execute the query
            const result = await gameDB.executeQuery(query);
            
            // Display results
            if (result.error) {
                this.displayQueryError(result.error);
                return;
            }
            
            // Display the results
            this.displayQueryResults(result);
            
            // Check if query solves the current challenge
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
        
        // Create table for results
        let tableHtml = "<table><tr>";
        
        // Add headers
        for (const column of result.fields) {
            tableHtml += `<th>${column.name}</th>`;
        }
        tableHtml += "</tr>";
        
        // Add rows
        for (const row of result.rows) {
            tableHtml += "<tr>";
            for (const column of result.fields) {
                tableHtml += `<td>${row[column.name] !== null ? row[column.name] : 'NULL'}</td>`;
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
        
        // Also show an alert for immediate feedback
        this.showAlert(`SQL Error: ${error}`, "error");
    }
    
    async checkChallengeSolution(query) {
        if (!this.currentCase) return;
        
        const currentChallenge = this.currentCase.challenges[this.currentChallengeIndex];
        
        // Execute user's query
        const userResult = await gameDB.executeQuery(query);
        if (userResult.error) return false;
        
        // Execute solution query
        const expectedResult = await gameDB.executeQuery(currentChallenge.solution);
        if (expectedResult.error) {
            console.error("Solution query error:", expectedResult.error);
            return false;
        }
        
        // Validate using challenge's validation function
        if (currentChallenge.validateFn(userResult, expectedResult)) {
            this.showMessage("Correct! You've solved this part of the case!");
            
            this.currentChallengeIndex++;
            
            if (this.currentChallengeIndex >= this.currentCase.challenges.length) {
                this.completeCase();
            } else {
                this.updateCaseInfo();
            }
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
            <button id="nextCase">Next Case</button>
        `;
        
        document.getElementById('nextCase').addEventListener('click', () => {
            const nextCaseId = this.currentCase.id + 1;
            const nextCase = gameCases.find(c => c.id === nextCaseId);
            
            if (nextCase) {
                this.loadCase(nextCaseId);
                this.gameState.caseSolved = false;
            } else {
                this.showGameComplete();
            }
        });
    }
    
    showGameComplete() {
        this.caseDescription.innerHTML = `
            <h3>Congratulations, Detective!</h3>
            <p>You've solved all the cases and proven your SQL mastery.</p>
            <p>Thanks for playing SQL Detective!</p>
        `;
    }
    
    showAlert(message, type = "info") {
        // Create alert element
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type}`;
        
        // Create content
        const alertContent = document.createElement('div');
        alertContent.className = 'alert-content';
        
        // Create icon based on type
        const icon = document.createElement('span');
        icon.className = 'alert-icon';
        switch (type) {
            case 'error': 
                icon.textContent = '❌'; 
                break;
            case 'success': 
                icon.textContent = '✅'; 
                break;
            case 'warning': 
                icon.textContent = '⚠️'; 
                break;
            default: 
                icon.textContent = 'ℹ️';
        }
        
        // Create message
        const text = document.createElement('span');
        text.textContent = message;
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'alert-close';
        closeBtn.textContent = '×';
        closeBtn.onclick = () => alertElement.remove();
        
        // Assemble alert
        alertContent.appendChild(icon);
        alertContent.appendChild(text);
        alertElement.appendChild(alertContent);
        alertElement.appendChild(closeBtn);
        
        // Add to page
        document.body.appendChild(alertElement);
        
        // Animate in
        setTimeout(() => alertElement.classList.add('show'), 10);
        
        // Auto-remove after delay unless it's an error
        if (type !== 'error') {
            setTimeout(() => {
                alertElement.classList.remove('show');
                setTimeout(() => alertElement.remove(), 300);
            }, 5000);
        }
        
        return alertElement;
    }
    
    showMessage(message, duration = 3000) {
        return this.showAlert(message, "success");
    }
    
    setupLittleJS() {
        // Set up game canvas
        gameCanvas.width = window.innerWidth;
        gameCanvas.height = window.innerHeight;
        
        // Handle window resize
        window.addEventListener('resize', () => {
            gameCanvas.width = window.innerWidth;
            gameCanvas.height = window.innerHeight;
        });
        
        // LittleJS game initialization would go here
        // For now, we'll just use basic canvas drawing
    }
    
    gameLoop() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        
        // Draw based on current game state
        this.drawScene();
        
        // Request next frame
        requestAnimationFrame(() => this.gameLoop());
    }
    
    handleCanvasClick(e) {
        const { width, height } = this.gameCanvas;
        const x = e.clientX;
        const y = e.clientY;
        
        switch (this.gameState.scene) {
            case 'welcome':
                // Click anywhere to start the game
                this.startCutscene();
                break;
                
            case 'cutscene':
                // Advance cutscene dialog
                this.advanceCutscene();
                break;
                
            case 'office':
                // Check if clicked on computer
                if (x > width/2 - 100 && x < width/2 + 100 && 
                    y > height/2 - 90 && y < height/2 + 30) {
                    this.gameState.scene = 'database';
                    this.sqlInterface.classList.remove('hidden');
                }
                break;
                
            // ...other scenes...
        }
    }
    
    startCutscene() {
        this.gameState.scene = 'cutscene';
        this.gameState.cutsceneIndex = 0;
        this.gameState.cutsceneData = this.getCutsceneData();
    }
    
    getCutsceneData() {
        return [
            {
                speaker: 'Detective',
                text: "So, what brings you to my office today?",
                position: 'left'
            },
            {
                speaker: 'Husband',
                text: "It's our family database. Something's wrong with it.",
                position: 'right'
            },
            {
                speaker: 'Wife',
                text: "We think there's been some data tampering. We need an expert to investigate.",
                position: 'right'
            },
            {
                speaker: 'Detective',
                text: "Data tampering, eh? Classic case. I've seen this before.",
                position: 'left'
            },
            {
                speaker: 'Detective',
                text: "I'll need access to your SQL database to look for any suspicious patterns.",
                position: 'left'
            },
            {
                speaker: 'Husband',
                text: "Of course. Here are the access credentials.",
                position: 'right'
            },
            {
                speaker: 'Detective',
                text: "I'll get to work immediately. This might be a complex case.",
                position: 'left'
            },
            {
                speaker: 'Wife',
                text: "Please help us, detective. We're counting on your SQL expertise.",
                position: 'right'
            }
        ];
    }
    
    advanceCutscene() {
        if (this.gameState.cutsceneIndex < this.gameState.cutsceneData.length - 1) {
            this.gameState.cutsceneIndex++;
        } else {
            // Cutscene finished, move to office scene
            this.gameState.scene = 'office';
        }
    }
    
    drawScene() {
        const { width, height } = this.gameCanvas;
        
        switch (this.gameState.scene) {
            case 'welcome':
                this.drawWelcomeScreen(width, height);
                break;
                
            case 'cutscene':
                this.drawCutscene(width, height);
                break;
                
            case 'office':
                this.drawOfficeScene(width, height);
                break;
                
            case 'database':
                // Draw simple dark background for database mode
                this.ctx.fillStyle = '#1a1a1a';
                this.ctx.fillRect(0, 0, width, height);
                break;
        }
    }
    
    drawWelcomeScreen(width, height) {
        // Draw background if loaded
        if (this.assets.background) {
            // Draw a darkened version of the background for noir effect
            this.ctx.drawImage(this.assets.background, 0, 0, width, height);
            
            // Apply noir overlay
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, width, height);
        } else {
            // Fallback dark background
            this.ctx.fillStyle = '#0a0a0a';
            this.ctx.fillRect(0, 0, width, height);
        }
        
        // Draw moving fog effect
        this.drawFog(width, height);
        
        // Update flashlight angle
        this.gameState.flashlightAngle += 0.01;
        if (this.gameState.flashlightAngle > Math.PI * 2) {
            this.gameState.flashlightAngle = 0;
        }
        
        // Draw flashlight effect
        this.drawFlashlight(width, height);
        
        // Draw detective silhouette if asset is loaded
        if (this.assets.detective) {
            const detectiveWidth = Math.min(400, width * 0.3);
            const aspectRatio = this.assets.detective.height / this.assets.detective.width;
            const detectiveHeight = detectiveWidth * aspectRatio;
            const detectiveX = width / 2 - detectiveWidth / 2;
            const detectiveY = height / 2 - detectiveHeight / 2;
            
            // Draw with silhouette effect
            this.ctx.globalCompositeOperation = 'screen';
            this.ctx.drawImage(this.assets.detective, detectiveX, detectiveY, detectiveWidth, detectiveHeight);
            this.ctx.globalCompositeOperation = 'source-over';
        } else {
            // Placeholder if image not loaded
            this.ctx.fillStyle = 'rgba(150, 150, 150, 0.5)';
            this.ctx.fillRect(width / 2 - 100, height / 2 - 150, 200, 300);
        }
        
        // Draw title with noir style shadow
        if (document.fonts.check(this.assets.titleFont)) {
            this.ctx.font = this.assets.titleFont;
            this.ctx.textAlign = 'center';
            
            // Multiple shadows for depth
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            this.ctx.shadowBlur = 15;
            this.ctx.shadowOffsetX = 5;
            this.ctx.shadowOffsetY = 5;
            
            // Main text
            this.ctx.fillStyle = 'rgba(220, 220, 220, 0.9)';
            this.ctx.fillText('NOIR SQL', width / 2, height / 2 + 200);
            
            // Reset shadow
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
        } else {
            // Fallback font
            this.ctx.font = 'bold 70px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = 'white';
            this.ctx.fillText('NOIR SQL', width / 2, height / 2 + 200);
        }
        
        // Draw "Click to Play" text with pulsing effect
        const pulseIntensity = 0.5 + 0.5 * Math.sin(Date.now() / 500);
        this.ctx.font = '28px Arial';
        this.ctx.fillStyle = `rgba(255, 255, 255, ${pulseIntensity})`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Click to Play', width / 2, height - 100);
    }
    
    drawFog(width, height) {
        const time = Date.now() / 10000;
        const fogCount = 5;
        
        for (let i = 0; i < fogCount; i++) {
            const x = (width * (i / fogCount + time)) % (width * 2) - width / 2;
            const y = height / 2 + 50 * Math.sin(time * 2 + i);
            const radius = width * 0.5;
            
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(50, 50, 65, 0.3)');
            gradient.addColorStop(1, 'rgba(50, 50, 65, 0)');
            
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
        
        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, beamLength
        );
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.arc(centerX, centerY, beamLength, angle - beamWidth, angle + beamWidth);
        this.ctx.closePath();
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }
    
    drawCutscene(width, height) {
        const currentDialog = this.gameState.cutsceneData[this.gameState.cutsceneIndex];
        
        // Draw background if loaded
        if (this.assets.background) {
            this.ctx.drawImage(this.assets.background, 0, 0, width, height);
            
            // Add slight darkening for better text contrast
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            this.ctx.fillRect(0, 0, width, height);
        } else {
            // Fallback background
            this.ctx.fillStyle = '#2d2d2d';
            this.ctx.fillRect(0, 0, width, height);
        }
        
        // Draw detective on the left
        if (this.assets.detective && currentDialog.position === 'left') {
            const detectiveWidth = Math.min(300, width * 0.25);
            const aspectRatio = this.assets.detective.height / this.assets.detective.width;
            const detectiveHeight = detectiveWidth * aspectRatio;
            const detectiveX = 100;
            const detectiveY = height - detectiveHeight - 220;
            
            this.ctx.drawImage(this.assets.detective, detectiveX, detectiveY, detectiveWidth, detectiveHeight);
            
            // Add highlight around speaking character
            if (currentDialog.speaker === 'Detective') {
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                this.ctx.lineWidth = 4;
                this.ctx.strokeRect(detectiveX - 5, detectiveY - 5, detectiveWidth + 10, detectiveHeight + 10);
            }
        }
        
        // Draw couple on the right
        if (this.assets.couple) {
            const coupleWidth = Math.min(380, width * 0.3);
            const aspectRatio = this.assets.couple.height / this.assets.couple.width;
            const coupleHeight = coupleWidth * aspectRatio;
            const coupleX = width - coupleWidth - 100;
            const coupleY = height - coupleHeight - 220;
            
            this.ctx.drawImage(this.assets.couple, coupleX, coupleY, coupleWidth, coupleHeight);
            
            // Add highlight around speaking character
            if (currentDialog.position === 'right') {
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                this.ctx.lineWidth = 4;
                this.ctx.strokeRect(coupleX - 5, coupleY - 5, coupleWidth + 10, coupleHeight + 10);
            }
        }
        
        // Draw dialog box with noir style
        const dialogBoxHeight = 200;
        const gradient = this.ctx.createLinearGradient(0, height - dialogBoxHeight, 0, height);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, height - dialogBoxHeight, width, dialogBoxHeight);
        
        // Add dialog box border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(10, height - dialogBoxHeight + 10, width - 20, dialogBoxHeight - 20);
        
        // Draw dialog text with shadow for noir effect
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 26px Arial';
        this.ctx.textAlign = 'left';
        
        // Draw speaker name with shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        this.ctx.fillText(`${currentDialog.speaker}:`, 50, height - dialogBoxHeight + 50);
        
        // Reset shadow for main text
        this.ctx.shadowBlur = 3;
        this.ctx.font = '22px Arial';
        this.ctx.fillText(currentDialog.text, 50, height - dialogBoxHeight + 90);
        this.ctx.shadowBlur = 0;
        
        // Draw "Click to continue" text with pulsing effect
        const pulseIntensity = 0.5 + 0.5 * Math.sin(Date.now() / 500);
        this.ctx.font = '18px Arial';
        this.ctx.fillStyle = `rgba(200, 200, 200, ${pulseIntensity})`;
        this.ctx.textAlign = 'right';
        this.ctx.fillText('Click to continue', width - 50, height - 50);
    }
    
    drawOfficeScene(width, height) {
        // Draw office background using the background image
        if (this.assets.background) {
            this.ctx.drawImage(this.assets.background, 0, 0, width, height);
            
            // Add an overlay to make it look like office lighting
            this.ctx.fillStyle = 'rgba(30, 40, 60, 0.4)';
            this.ctx.fillRect(0, 0, width, height);
        } else {
            // Fallback
            this.ctx.fillStyle = '#3a5a78';
            this.ctx.fillRect(0, 0, width, height);
        }
        
        // Draw detective at desk if image loaded
        if (this.assets.detective) {
            const detectiveWidth = Math.min(250, width * 0.2);
            const aspectRatio = this.assets.detective.height / this.assets.detective.width;
            const detectiveHeight = detectiveWidth * aspectRatio;
            
            this.ctx.drawImage(
                this.assets.detective, 
                width/2 - 300, 
                height/2 - 100, 
                detectiveWidth, 
                detectiveHeight
            );
        }
        
        // Draw detective desk
        this.ctx.fillStyle = 'rgba(139, 90, 43, 0.8)';
        this.ctx.fillRect(width/2 - 200, height/2, 400, 20);
        
        // Draw computer
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(width/2 - 100, height/2 - 90, 200, 120);
        this.ctx.fillStyle = '#87ceeb';
        this.ctx.fillRect(width/2 - 90, height/2 - 80, 180, 100);
        
        // Add computer glow effect
        const glowSize = 10 + 5 * Math.sin(Date.now() / 300); // Pulsing glow
        const glowGradient = this.ctx.createRadialGradient(
            width/2, height/2 - 30, 0,
            width/2, height/2 - 30, 150 + glowSize
        );
        glowGradient.addColorStop(0, 'rgba(135, 206, 235, 0.3)');
        glowGradient.addColorStop(1, 'rgba(135, 206, 235, 0)');
        this.ctx.fillStyle = glowGradient;
        this.ctx.fillRect(width/2 - 200, height/2 - 180, 400, 300);
        
        // Draw text prompt with shadow for better visibility
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Click on the computer to investigate case', width/2, height/2 + 150);
        this.ctx.shadowBlur = 0;
    }
    
    returnToOffice() {
        this.gameState.scene = 'office';
        this.sqlInterface.classList.add('hidden');
        
        // Optional: Show a transition effect
        this.showAlert("Returning to office...", "info");
    }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new SQLDetectiveGame();
});
