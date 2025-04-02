// Import our modules
import gameDB from './database.js';
import gameCases from './cases.js';

class SQLDetectiveGame {
    constructor() {
        this.currentCase = null;
        this.currentChallengeIndex = 0;
        this.sqlInterface = document.getElementById('sqlInterface');
        this.caseDescription = document.getElementById('caseDescription');
        this.sqlQuery = document.getElementById('sqlQuery');
        this.runQuery = document.getElementById('runQuery');
        this.queryResult = document.getElementById('queryResult');
        
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
        
        // Remove old CodeMirror initialization
        this.setupPrism();
        
        // Initialize the game
        this.init();
    }
    
    setupPrism() {
        if (typeof Prism === 'undefined') {
            console.error('Prism is not loaded!');
            return;
        }
        
        this.sqlInput = document.getElementById('sqlInput');
        this.sqlEditor = document.getElementById('sqlQuery');

        const updateHighlight = () => {
            // Copy content to the code element
            this.sqlEditor.textContent = this.sqlInput.value;
            // Re-highlight
            Prism.highlightElement(this.sqlEditor);
        };

        // Initial highlight
        updateHighlight();

        // Update on any input
        this.sqlInput.addEventListener('input', updateHighlight);
        this.sqlInput.addEventListener('change', updateHighlight);
        this.sqlInput.addEventListener('keyup', updateHighlight);

        // Handle tab key
        this.sqlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.sqlInput.selectionStart;
                const end = this.sqlInput.selectionEnd;
                this.sqlInput.value = `${this.sqlInput.value.substring(0, start)}    ${this.sqlInput.value.substring(end)}`;
                this.sqlInput.selectionStart = this.sqlInput.selectionEnd = start + 4;
                updateHighlight();
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
        const query = this.sqlInput.value.trim();
        if (!query) {
            this.showMessage("Please enter a SQL query");
            return;
        }
        
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
        this.queryResult.innerHTML = `<p class="error">Error: ${error}</p>`;
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
    
    showMessage(message, duration = 3000) {
        const messageElement = document.createElement('div');
        messageElement.className = 'game-message';
        messageElement.textContent = message;
        document.body.appendChild(messageElement);
        
        setTimeout(() => {
            messageElement.remove();
        }, duration);
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
                
                // Add a "return to office" button
                this.ctx.fillStyle = '#4285f4';
                this.ctx.fillRect(20, 20, 150, 40);
                this.ctx.fillStyle = 'white';
                this.ctx.font = '16px Arial';
                this.ctx.fillText('Return to Office', 35, 45);
                
                this.gameCanvas.onclick = (e) => {
                    const x = e.clientX;
                    const y = e.clientY;
                    
                    // Return to office button
                    if (x > 20 && x < 170 && y > 20 && y < 60) {
                        this.gameState.scene = 'office';
                        this.sqlInterface.classList.add('hidden');
                    }
                };
                break;
                
            case 'crime_scene':
                // Not implemented in this basic version
                break;
        }
    }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new SQLDetectiveGame();
});
