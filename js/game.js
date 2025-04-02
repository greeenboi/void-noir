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
        
        // Game state
        this.gameState = {
            scene: 'office', // office, crime_scene, database
            playerProgress: 0,
            caseSolved: false
        };
        
        // Game assets
        this.assets = {
            detective: null,
            office: null,
            crimeScene: null,
            computer: null,
            characters: {}
        };
        
        // Bind events
        this.runQuery.addEventListener('click', () => this.executeQuery());
        
        // Add return button event
        if (this.returnButton) {
            this.returnButton.addEventListener('click', () => this.returnToOffice());
        }
        
        // Setup Prism for syntax highlighting
        this.setupPrism();
        
        // Initialize the game
        this.init();
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
    
    drawScene() {
        const { width, height } = this.gameCanvas;
        
        switch (this.gameState.scene) {
            case 'office':
                // Draw office background
                this.ctx.fillStyle = '#3a5a78';
                this.ctx.fillRect(0, 0, width, height);
                
                // Draw detective desk
                this.ctx.fillStyle = '#8b5a2b';
                this.ctx.fillRect(width/2 - 200, height/2 - 50, 400, 150);
                
                // Draw computer
                this.ctx.fillStyle = '#333';
                this.ctx.fillRect(width/2 - 100, height/2 - 90, 200, 120);
                this.ctx.fillStyle = '#87ceeb';
                this.ctx.fillRect(width/2 - 90, height/2 - 80, 180, 100);
                
                // Draw text prompt
                this.ctx.fillStyle = 'white';
                this.ctx.font = '24px Arial';
                this.ctx.fillText('Click on the computer to investigate case', width/2 - 200, height/2 + 150);
                
                // Toggle SQL interface on computer click
                this.gameCanvas.onclick = (e) => {
                    const x = e.clientX;
                    const y = e.clientY;
                    
                    // Check if clicked on computer
                    if (x > width/2 - 100 && x < width/2 + 100 && 
                        y > height/2 - 90 && y < height/2 + 30) {
                        this.gameState.scene = 'database';
                        this.sqlInterface.classList.remove('hidden');
                    }
                };
                break;
                
            case 'database':
                // When in database mode, just show a simple background
                this.ctx.fillStyle = '#1a1a1a';
                this.ctx.fillRect(0, 0, width, height);
                
                // Remove the old return button drawing code since we have a proper UI button now
                
                this.gameCanvas.onclick = (e) => {
                    const x = e.clientX;
                    const y = e.clientY;
                    
                    // Add any other canvas click handlers here if needed
                };
                break;
                
            case 'crime_scene':
                // Not implemented in this basic version
                break;
        }
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
