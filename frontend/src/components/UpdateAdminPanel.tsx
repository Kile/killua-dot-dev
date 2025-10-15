import React, { useState } from 'react';
import { testUpdateEndpoint, updateBot } from '../services/adminService';
import { Play, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface UpdateResult {
  exit_code: number;
  output: string;
}

const UpdateAdminPanel: React.FC = () => {
  const [testLoading, setTestLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [updateResult, setUpdateResult] = useState<UpdateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTestEndpoint = async () => {
    setTestLoading(true);
    setError(null);
    setTestResult(null);

    try {
      const jwtToken = localStorage.getItem('discord_token');
      if (!jwtToken) {
        throw new Error('No authentication token found');
      }

      const result = await testUpdateEndpoint(jwtToken);
      setTestResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test endpoint');
    } finally {
      setTestLoading(false);
    }
  };

  const handleUpdateBot = async () => {
    setUpdateLoading(true);
    setError(null);
    setUpdateResult(null);

    try {
      const jwtToken = localStorage.getItem('discord_token');
      if (!jwtToken) {
        throw new Error('No authentication token found');
      }

      const result = await updateBot(jwtToken);
      setUpdateResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bot');
    } finally {
      setUpdateLoading(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-5 h-5 text-green-400" />
    ) : (
      <XCircle className="w-5 h-5 text-red-400" />
    );
  };

  const getUpdateStatusIcon = (exitCode: number) => {
    if (exitCode === 0) {
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-400" />;
    }
  };

  const getUpdateStatusColor = (exitCode: number) => {
    return exitCode === 0 ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <div className="bg-discord-darker rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <RefreshCw className="w-5 h-5 mr-2 text-discord-blurple" />
          Bot Update Management
        </h3>
        
        <div className="space-y-4">
          {/* Test Endpoint Button */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-md font-medium text-white">Test Endpoint</h4>
              <p className="text-sm text-gray-400">Test the external API update endpoint</p>
            </div>
            <button
              onClick={handleTestEndpoint}
              disabled={testLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-discord-blurple text-white rounded-md hover:bg-discord-blurple-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{testLoading ? 'Testing...' : 'Test Endpoint'}</span>
            </button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className="bg-discord-dark border border-gray-600 rounded p-4">
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(testResult.success)}
                <span className={`font-medium ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                  {testResult.success ? 'Test Passed' : 'Test Failed'}
                </span>
              </div>
              <p className="text-gray-300 text-sm">{testResult.message}</p>
            </div>
          )}

          {/* Update Bot Button */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-md font-medium text-white">Update Bot</h4>
              <p className="text-sm text-gray-400">Trigger bot update (may take some time)</p>
            </div>
            <button
              onClick={handleUpdateBot}
              disabled={updateLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{updateLoading ? 'Updating...' : 'Update Bot'}</span>
            </button>
          </div>

          {/* Update Result */}
          {updateResult && (
            <div className="bg-discord-dark border border-gray-600 rounded p-4">
              <div className="flex items-center space-x-2 mb-2">
                {getUpdateStatusIcon(updateResult.exit_code)}
                <span className={`font-medium ${getUpdateStatusColor(updateResult.exit_code)}`}>
                  Update {updateResult.exit_code === 0 ? 'Successful' : 'Failed'}
                </span>
                <span className="text-gray-400 text-sm">(Exit Code: {updateResult.exit_code})</span>
              </div>
              <div className="bg-discord-darker border border-gray-700 rounded p-3 mt-2">
                <h5 className="text-sm font-medium text-gray-300 mb-2">Output:</h5>
                <pre className="text-green-400 text-xs whitespace-pre-wrap overflow-x-auto">
                  {updateResult.output}
                </pre>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-discord-dark border border-red-600 rounded p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="font-medium text-red-400">Error</span>
              </div>
              <p className="text-gray-300 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateAdminPanel;
