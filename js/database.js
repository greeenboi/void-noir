import { PGlite } from "https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/index.js";

class GameDatabase {
	constructor() {
		this.db = null;
		this.isInitialized = false;
	}

	async initialize() {
		try {
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

			let errorMessage = error.message;

			if (errorMessage.includes("syntax error")) {
				errorMessage = "Syntax error: Check your SQL syntax";
			} else if (errorMessage.includes("no such table")) {
				const tableName = errorMessage.match(/no such table: (\w+)/)?.[1];
				errorMessage = `Table '${tableName || "unknown"}' does not exist`;
			} else if (errorMessage.includes("no such column")) {
				const columnName = errorMessage.match(/no such column: (\w+)/)?.[1];
				errorMessage = `Column '${columnName || "unknown"}' does not exist`;
			}

			return { error: errorMessage };
		}
	}

	async setupCase(caseData) {
		for (const table of caseData.tables) {
			await this.executeQuery(`DROP TABLE IF EXISTS ${table.name}`);
		}

		for (const table of caseData.tables) {
			await this.executeQuery(table.createStatement);
		}

		for (const table of caseData.tables) {
			for (const insertStatement of table.insertStatements) {
				await this.executeQuery(insertStatement);
			}
		}

		console.log(`Case ${caseData.id}: Database setup complete`);
	}
}

const gameDB = new GameDatabase();

export default gameDB;
