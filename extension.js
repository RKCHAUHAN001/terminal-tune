const vscode = require('vscode');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Terminal Tune is now active!');

    // 1. Listen for Terminal Command Failures
    const terminalListener = vscode.window.onDidEndTerminalShellExecution(event => {
        // Exit code 0 is success. Any other number (usually 1) is an error.
        if (event.exitCode !== undefined && event.exitCode !== 0) {
            playErrorSound(context);
        }
    });

    // 2. Register a command so users can test the sound via Command Palette
    let testCommand = vscode.commands.registerCommand('terminal-tune.testSound', () => {
        playErrorSound(context);
        vscode.window.showInformationMessage('Playing Terminal Tune test sound...');
    });

    context.subscriptions.push(terminalListener, testCommand);
}

/**
 * Logic to determine and play the sound file
 * @param {vscode.ExtensionContext} context
 */
function playErrorSound(context) {
    const config = vscode.workspace.getConfiguration('terminalTune');
    
    // Fetch settings and ensure they are treated as strings to avoid "never" errors
    const selectedSound = String(config.get('soundFile') || 'error.wav');
    const customPath = config.get('customSoundPath') || '';

    let finalSoundPath = "";

    // Decide which sound to use: Custom or Built-in
    if (typeof customPath === 'string' && customPath.trim() !== "") {
        finalSoundPath = customPath.trim();
    } else {
        finalSoundPath = path.join(context.extensionPath, 'sounds', selectedSound);
    }

    // Check if the file actually exists on the computer
    if (!fs.existsSync(finalSoundPath)) {
        // Only alert the user if they actually tried to set a custom path
        if (customPath) {
            vscode.window.showErrorMessage(`Terminal Tune: File not found at ${finalSoundPath}`);
        }
        return;
    }

    // Platform-specific execution
    let command = '';
    if (process.platform === 'win32') {
        // Windows: PowerShell (Only supports .wav natively)
        command = `powershell -c "(New-Object Media.SoundPlayer '${finalSoundPath}').PlaySync()"`;
    } else if (process.platform === 'darwin') {
        // macOS
        command = `afplay "${finalSoundPath}"`;
    } else {
        // Linux (Requires alsa-utils)
        command = `aplay "${finalSoundPath}"`;
    }

    // Run the play command
    exec(command, (err) => {
        if (err) {
            console.error('Terminal Tune Playback Error:', err);
        }
    });
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};