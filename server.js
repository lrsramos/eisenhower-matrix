const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const DATABASE_FILE = path.join(DATA_DIR, 'tasks.txt');

// Ensure data directory and file exist
async function initializeDatabase() {
try {
    // Create data directory if it doesn't exist
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
        console.log('Data directory created');
    }

    // Create tasks file if it doesn't exist
    try {
        await fs.access(DATABASE_FILE);
    } catch {
        await fs.writeFile(DATABASE_FILE, '[]');
        console.log('Tasks file created');
    }

    // Verify file is readable and writable
    const testRead = await fs.readFile(DATABASE_FILE, 'utf8');
    JSON.parse(testRead); // Verify it's valid JSON
    console.log('Database initialized successfully');
} catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
}
}

// Database operations with error handling
async function readTasks() {
try {
    const data = await fs.readFile(DATABASE_FILE, 'utf8');
    return JSON.parse(data);
} catch (error) {
    console.error('Error reading tasks:', error);
    throw error;
}
}

async function writeTasks(tasks) {
try {
    await fs.writeFile(DATABASE_FILE, JSON.stringify(tasks, null, 2));
} catch (error) {
    console.error('Error writing tasks:', error);
    throw error;
}
}

// API Routes with better error handling
app.get('/api/tasks', async (req, res) => {
try {
    const tasks = await readTasks();
    res.json(tasks);
} catch (error) {
    console.error('GET /api/tasks error:', error);
    res.status(500).json({ 
        error: 'Failed to read tasks',
        details: error.message 
    });
}
});

app.post('/api/tasks', async (req, res) => {
try {
    if (!req.body || !req.body.title || !req.body.quadrant) {
        return res.status(400).json({ error: 'Invalid task data' });
    }

    const tasks = await readTasks();
    tasks.push(req.body);
    await writeTasks(tasks);
    res.json(req.body);
} catch (error) {
    console.error('POST /api/tasks error:', error);
    res.status(500).json({ 
        error: 'Failed to create task',
        details: error.message 
    });
}
});

app.put('/api/tasks/:id', async (req, res) => {
try {
    const tasks = await readTasks();
    const index = tasks.findIndex(t => t.id === req.params.id);
    if (index !== -1) {
        tasks[index] = { ...tasks[index], ...req.body };
        await writeTasks(tasks);
        res.json(tasks[index]);
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
} catch (error) {
    console.error('PUT /api/tasks/:id error:', error);
    res.status(500).json({ 
        error: 'Failed to update task',
        details: error.message 
    });
}
});

app.delete('/api/tasks/:id', async (req, res) => {
try {
    const tasks = await readTasks();
    const filteredTasks = tasks.filter(t => t.id !== req.params.id);
    await writeTasks(filteredTasks);
    res.json({ message: 'Task deleted' });
} catch (error) {
    console.error('DELETE /api/tasks/:id error:', error);
    res.status(500).json({ 
        error: 'Failed to delete task',
        details: error.message 
    });
}
});

// Initialize database and start server with error handling
async function startServer() {
try {
    await initializeDatabase();
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
} catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
}
}

startServer();