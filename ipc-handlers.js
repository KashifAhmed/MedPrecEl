const { ipcMain, app } = require('electron');
const path = require('path');
const fs = require('fs');
const { getDatabase, initializeDatabase, resetDatabase } = require('./database');
const { startSync } = require('./sync-service');

// Utility function to resolve document conflicts
async function resolveDocumentConflict(db, existingDoc, newDoc) {
    // Merge documents while preserving original creation timestamp
    const mergedDocument = {
        ...existingDoc,
        ...newDoc,
        createdAt: existingDoc.createdAt,
        _conflicts: [
            ...(existingDoc._conflicts || []),
            newDoc._rev
        ],
        lastConflictResolved: new Date().toISOString()
    };

    try {
        const result = await db.put(mergedDocument);
        return {
            success: true,
            id: result.id,
            conflictResolved: true
        };
    } catch (error) {
        console.error('Conflict resolution failed:', error);
        return {
            success: false,
            error: 'Document conflict could not be resolved',
            details: error.message
        };
    }
}

async function setupIpcHandlers() {
    await initializeDatabase();
    const db = getDatabase();

    // Handler for creating new prescriptions with conflict management
    ipcMain.handle('db-prescription-create', async (event, prescription) => {
        const documentToCreate = {
            ...prescription,
            _id: generateUniqueId(),
            synced: false,
            createdAt: new Date().toISOString()
        };

        try {
            const result = await db.put(documentToCreate);
            startSync();
            return { success: true, id: result.id };
        } catch (error) {
            return await handleDocumentCreationConflict(db, error, documentToCreate);
        }
    });

    // Handler for adding prescriptions with conflict resolution
    ipcMain.handle('db-prescription-add', async (event, prescription) => {
        const db = getDatabase();
        const newDoc = {
            ...prescription,
            synced: true,
            lastModified: new Date().toISOString()
        };
    
        try {
            const result = await db.put(newDoc);
            
            // Ensure document is saved by fetching it back
            const savedDoc = await db.get(result.id);
            
            return { 
                success: true, 
                id: result.id,
                doc: savedDoc 
            };
        } catch (error) {
            if (error.status === 409) {
                try {
                    // Fetch conflicting document
                    const existingDoc = await db.get(newDoc._id, { conflicts: true });
    
                    // Merge documents
                    const mergedDoc = {
                        ...existingDoc,
                        ...newDoc,
                        createdAt: existingDoc.createdAt,
                        _conflicts: [
                            ...(existingDoc._conflicts || []),
                            newDoc._rev
                        ],
                        lastConflictResolved: new Date().toISOString()
                    };
    
                    // Force put with merged document
                    const resolveResult = await db.put(mergedDoc, { force: true });
                    
                    // Fetch the saved merged document
                    const savedMergedDoc = await db.get(resolveResult.id);
    
                    return { 
                        success: true, 
                        id: resolveResult.id,
                        doc: savedMergedDoc,
                        conflictResolved: true 
                    };
                } catch (conflictError) {
                    console.error('Conflict resolution failed:', conflictError);
                    return { 
                        success: false, 
                        error: 'Conflict resolution failed',
                        details: conflictError.message 
                    };
                }
            }
            return { success: false, error: error.message };
        }
    });

    // Search handler for prescriptions with flexible filtering
    ipcMain.handle('db-prescription-search', async (event, query) => {
        try {
            const selector = buildSearchSelector(query);
            const result = await db.find({ selector });

            console.log(`db-prescription-search count ${result.docs.length} query: ${JSON.stringify(query)}`)
            return {
                success: true,
                data: result.docs,
            };
        } catch (error) {
            console.error('Prescription search failed:', error);
            return { success: false, error: error.message };
        }
    });

    // Token management handlers
    setupTokenHandlers();

    // Database management handler
    ipcMain.handle('db-prescription-clear', async () => {
        try {
            const db = getDatabase();
            await db.destroy();
            resetDatabase();
            await initializeDatabase();
            return { success: true };
        } catch (error) {
            console.error('Database reset failed:', error);
            return { success: false, error: error.message };
        }
    });
}

// Helper functions
function generateUniqueId() {
    return new Date().toISOString() + Math.random().toString(36).substring(7);
}

async function handleDocumentCreationConflict(db, error, document) {
    if (error.status === 409) {
        try {
            const existingDocument = await db.get(error.id, { conflicts: true });
            const resolveResult = await resolveDocumentConflict(db, existingDocument, document);
            startSync();
            return resolveResult;
        } catch (conflictError) {
            console.error('Conflict resolution failed:', conflictError);
            return {
                success: false,
                error: 'Conflict resolution failed',
                details: conflictError.message
            };
        }
    }
    return { success: false, error: error.message };
}


function buildSearchSelector(query) {
    const selector = {};

    if (query.patient_id) {
        selector.patient_id = parseInt(query.patient_id);
    }

    if (query.doctor_id) {
        selector.doctor_id = parseInt(query.doctor_id);
    }

    return selector;
}

function setupTokenHandlers() {
    ipcMain.handle('save-token', (event, token) => saveTokenToFile(token));
    ipcMain.handle('get-token', retrieveTokenFromFile);
    ipcMain.handle('clear-token', deleteTokenFile);
}

function saveTokenToFile(token) {
    try {
        const tokenPath = path.join(app.getPath('userData'), 'token.json');
        ensureDirectoryExists(tokenPath);
        fs.writeFileSync(tokenPath, JSON.stringify({ token }));
        return { success: true };
    } catch (error) {
        console.error('Token save failed:', error);
        return { success: false, error: error.message };
    }
}

function retrieveTokenFromFile() {
    try {
        const tokenPath = path.join(app.getPath('userData'), 'token.json');
        return fs.existsSync(tokenPath)
            ? JSON.parse(fs.readFileSync(tokenPath, 'utf8'))
            : { token: null };
    } catch (error) {
        console.error('Token retrieval failed:', error);
        return { token: null };
    }
}

function deleteTokenFile() {
    try {
        const tokenPath = path.join(app.getPath('userData'), 'token.json');
        if (fs.existsSync(tokenPath)) {
            fs.unlinkSync(tokenPath);
        }
        return { success: true };
    } catch (error) {
        console.error('Token deletion failed:', error);
        return { success: false, error: error.message };
    }
}

function ensureDirectoryExists(filePath) {
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}

module.exports = {
    initializeIpcHandlers: setupIpcHandlers
};