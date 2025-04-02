// Import PGLite in module format
import { PGlite } from 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/index.js'

class GameDatabase {
    constructor() {
        this.db = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            // Create the database using proper import
            this.db = await new PGlite();
            this.isInitialized = true;
            console.log("Database initialized successfully");
        } catch (error) {
            console.error("Failed to initialize database:", error);
        }
    }

    async executeQuery(query) {
        if (!this.isInitialized) {
            throw new Error("Database not initialized");
        }
        
        try {
            const result = await this.db.query(query);
            return result;
        } catch (error) {
            console.error("Query error:", error);
            return { error: error.message };
        }
    }

    async setupCase(caseData) {
        // Drop existing tables if they exist
        for (const table of caseData.tables) {
            await this.executeQuery(`DROP TABLE IF EXISTS ${table.name}`);
        }
        
        // Create tables
        for (const table of caseData.tables) {
            await this.executeQuery(table.createStatement);
        }
        
        // Insert data
        for (const table of caseData.tables) {
            for (const insertStatement of table.insertStatements) {
                await this.executeQuery(insertStatement);
            }
        }
        
        console.log(`Case ${caseData.id}: Database setup complete`);
    }
}

// Create a singleton instance
const gameDB = new GameDatabase();

// Export for use in other modules
export default gameDB;
