import React, { useState, useEffect } from 'react';
import { Upload, FileText, Cpu, Download, CheckCircle, AlertCircle, Loader, Settings, Home, Database, Sparkles } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001';

const DataMapperApp = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [files, setFiles] = useState({ template: null, data: null });
  const [uploadedFiles, setUploadedFiles] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState('checking');
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkOllamaStatus();
  }, []);

  const checkOllamaStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ollama/status`);
      const data = await response.json();
      
      if (data.status === 'connected') {
        setOllamaStatus('connected');
        setAvailableModels(data.models || []);
        if (data.models && data.models.length > 0) {
          setSelectedModel(data.models[0].name);
        }
      } else {
        setOllamaStatus('disconnected');
      }
    } catch (error) {
      setOllamaStatus('disconnected');
    }
  };

  const handleFileChange = (type, file) => {
    setFiles(prev => ({ ...prev, [type]: file }));
    setError('');
  };

  const handleUpload = async () => {
    if (!files.template || !files.data) {
      setError('Please select both template and data files');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('template', files.template);
      formData.append('data', files.data);

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setUploadedFiles(data.files);
        setSuccess('Files uploaded successfully!');
        setActiveTab('process');
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (error) {
      setError('Upload failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!uploadedFiles) {
      setError('Please upload files first');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templatePath: uploadedFiles.template.path,
          dataPath: uploadedFiles.data.path,
          model: selectedModel
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.result);
        setSuccess('Data mapping completed successfully!');
        setActiveTab('result');
      } else {
        setError(data.error || 'Processing failed');
      }
    } catch (error) {
      setError('Processing failed. Please check your connection and ensure Ollama is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;

    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mapped-data-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const StatusIndicator = ({ status }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'connected': return 'text-green-500';
        case 'disconnected': return 'text-red-500';
        default: return 'text-yellow-500';
      }
    };

    const getStatusIcon = () => {
      switch (status) {
        case 'connected': return <CheckCircle className="w-4 h-4" />;
        case 'disconnected': return <AlertCircle className="w-4 h-4" />;
        default: return <Loader className="w-4 h-4 animate-spin" />;
      }
    };

    return (
      <div className={`flex items-center gap-2 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium capitalize">{status}</span>
      </div>
    );
  };

  const FileUploader = ({ type, accept, onChange }) => (
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors duration-200">
      <div className="flex flex-col items-center">
        <FileText className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-600 mb-4">
          Drop your {type} file here or click to browse
        </p>
        <input
          type="file"
          accept={accept}
          onChange={(e) => onChange(type, e.target.files[0])}
          className="hidden"
          id={`${type}-upload`}
        />
        <label
          htmlFor={`${type}-upload`}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors duration-200"
        >
          Choose {type} file
        </label>
        {files[type] && (
          <p className="text-sm text-green-600 mt-2">
            Selected: {files[type].name}
          </p>
        )}
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="space-y-8">
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          AI Data Mapper
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Transform your data seamlessly with AI-powered mapping. Upload your template and data files, 
          and let our intelligent system handle the rest.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <Upload className="w-8 h-8 text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upload Files
          </h3>
          <p className="text-gray-600">
            Upload your template and data files to get started with the mapping process.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <Cpu className="w-8 h-8 text-purple-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            AI Processing
          </h3>
          <p className="text-gray-600">
            Our AI analyzes your data structure and intelligently maps it to your template.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <Download className="w-8 h-8 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Download Results
          </h3>
          <p className="text-gray-600">
            Get your perfectly mapped data file ready for immediate use.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          System Status
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700">Ollama Connection:</span>
          </div>
          <StatusIndicator status={ollamaStatus} />
        </div>
        {ollamaStatus === 'disconnected' && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-700">
              Please ensure Ollama is running on localhost:11434 to use AI features.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderUpload = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Your Files
        </h2>
        <p className="text-gray-600">
          Upload both your template and data files to begin the mapping process
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Template File</h3>
          <FileUploader
            type="template"
            accept=".txt,.json,.xml,.csv"
            onChange={handleFileChange}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Data File</h3>
          <FileUploader
            type="data"
            accept=".txt,.json,.xml,.csv"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={handleUpload}
          disabled={loading || !files.template || !files.data}
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 mx-auto"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Upload Files
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderProcess = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Process Data Mapping
        </h2>
        <p className="text-gray-600">
          Configure AI settings and start the mapping process
        </p>
      </div>

      {uploadedFiles && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Uploaded Files
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900">Template</p>
                <p className="text-sm text-gray-600">
                  {uploadedFiles.template.originalName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Database className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900">Data</p>
                <p className="text-sm text-gray-600">
                  {uploadedFiles.data.originalName}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          AI Model Selection
        </h3>
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Choose AI Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {availableModels.map((model) => (
              <option key={model.name} value={model.name}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={handleProcess}
          disabled={loading || ollamaStatus !== 'connected' || !uploadedFiles}
          className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-xl hover:from-purple-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 mx-auto"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Cpu className="w-5 h-5" />
              Start Processing
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderResult = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Mapping Results
        </h2>
        <p className="text-gray-600">
          Your data has been successfully mapped to the template
        </p>
      </div>

      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Mapped Data Output
            </h3>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <div className="p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
              {result}
            </pre>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                AI Data Mapper
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                  activeTab === 'home' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Home className="w-4 h-4" />
                Home
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                  activeTab === 'upload' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
              <button
                onClick={() => setActiveTab('process')}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                  activeTab === 'process' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings className="w-4 h-4" />
                Process
              </button>
              <button
                onClick={() => setActiveTab('result')}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                  activeTab === 'result' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                Results
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {activeTab === 'home' && renderHome()}
          {activeTab === 'upload' && renderUpload()}
          {activeTab === 'process' && renderProcess()}
          {activeTab === 'result' && renderResult()}
        </div>
      </main>
    </div>
  );
};

export default DataMapperApp;