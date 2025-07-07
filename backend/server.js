const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });


(async () => {
  try {
    await fs.mkdir('uploads', { recursive: true });
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }
})();


const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';


async function callOllama(prompt, model = 'llama3.2') {
  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.3,
        top_p: 0.9,
        max_tokens: 2000
      }
    });

    return response.data.response;
  } catch (error) {
    console.error('Ollama API error:', error);
    throw new Error('Failed to connect to Ollama. Make sure Ollama is running locally.');
  }
}


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});


app.get('/api/ollama/status', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`);
    res.json({ status: 'connected', models: response.data.models });
  } catch (error) {
    res.status(500).json({
      status: 'disconnected',
      error: 'Cannot connect to Ollama. Make sure it\'s running on localhost:11434'
    });
  }
});


app.post('/api/upload', upload.fields([
  { name: 'template', maxCount: 1 },
  { name: 'data', maxCount: 1 }
]), async (req, res) => {
  try {
    const templateFile = req.files['template']?.[0];
    const dataFile = req.files['data']?.[0];

    if (!templateFile || !dataFile) {
      return res.status(400).json({
        error: 'Both template and data files are required'
      });
    }

    res.json({
      message: 'Files uploaded successfully',
      files: {
        template: {
          filename: templateFile.filename,
          originalName: templateFile.originalname,
          path: templateFile.path
        },
        data: {
          filename: dataFile.filename,
          originalName: dataFile.originalname,
          path: dataFile.path
        }
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});


app.post('/api/process', async (req, res) => {
  try {
    const { templatePath, dataPath, model = 'llama3.2' } = req.body;

    if (!templatePath || !dataPath) {
      return res.status(400).json({
        error: 'Template and data file paths are required'
      });
    }


    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const dataContent = await fs.readFile(dataPath, 'utf-8');

    const prompt = `
        You are an expert data mapper. I need you to map data from the input file to match the template structure.

        TEMPLATE STRUCTURE:
        ${templateContent}

        INPUT DATA:
        ${dataContent}

        Instructions:
        1. Analyze the template structure and identify all placeholders/variables
        2. Map the input data to fill these placeholders appropriately
        3. Maintain the exact template format and structure
        4. If data is missing, use "N/A" or appropriate default values
        5. Return ONLY the filled template, no explanations

        OUTPUT:`;

    const aiResponse = await callOllama(prompt, model);

    const cleanedResponse = aiResponse.trim();

    res.json({
      success: true,
      result: cleanedResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({
      error: error.message || 'Failed to process data mapping'
    });
  }
});


app.get('/api/models', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`);
    res.json(response.data.models || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

app.get('/api/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'results', filename);

    await fs.access(filePath);

    res.download(filePath);
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
});


app.post('/api/save-result', async (req, res) => {
  try {
    const { content, filename } = req.body;

    if (!content || !filename) {
      return res.status(400).json({ error: 'Content and filename are required' });
    }

    await fs.mkdir('results', { recursive: true });

    const filePath = path.join(__dirname, 'results', filename);
    await fs.writeFile(filePath, content, 'utf-8');

    res.json({
      success: true,
      message: 'File saved successfully',
      filename: filename
    });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: 'Failed to save file' });
  }
});


app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Make sure Ollama is running on ${OLLAMA_BASE_URL}`);
});

module.exports = app;