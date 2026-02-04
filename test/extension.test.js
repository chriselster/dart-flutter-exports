const assert = require('assert');
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');
const extension = require('../extension');

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('generateFileContent should generate correct content', () => {
        const folderName = 'testFolder';
        const subfolders = ['subfolder1', 'subfolder2'];
        const files = ['file1.dart', 'file2.dart'];

        const result = extension.generateFileContent(folderName, subfolders, files);

        const expected = ``
            + `export '../subfolder1/subfolder1.dart';\n`
            + `export '../subfolder2/subfolder2.dart';\n`
            + `export 'file1.dart';\n`
            + `export 'file2.dart';`;

        assert.strictEqual(result, expected);
    });

    test('shouldSkip should correctly identify files and folders to skip', () => {
        const hiddenFile = '.hiddenFile';
        const skippedFile = 'skippedFile.g.dart';
        const skippedFolder = 'l10n';

        const resultHiddenFile = extension.shouldSkip(hiddenFile);
        const resultSkippedFile = extension.shouldSkip(skippedFile);
        const resultSkippedFolder = extension.shouldSkip(skippedFolder);

        assert.strictEqual(resultHiddenFile, true);
        assert.strictEqual(resultSkippedFile, true);
        assert.strictEqual(resultSkippedFolder, true);
    });

    suite('getExportFileName', () => {
        let tempDir;

        setup(() => {
            // Create a temporary directory for tests
            tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dart-export-test-'));
        });

        teardown(() => {
            // Clean up temporary directory
            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        test('should return default filename when no file exists', () => {
            const testFolder = path.join(tempDir, 'mywidget');
            fs.mkdirSync(testFolder);

            const result = extension.getExportFileName(testFolder);

            assert.strictEqual(result, 'mywidget.dart');
        });

        test('should return default filename when file is an export file', () => {
            const testFolder = path.join(tempDir, 'mywidget');
            fs.mkdirSync(testFolder);

            // Create an export file
            const exportContent = "export 'button.dart';\nexport 'card.dart';";
            fs.writeFileSync(path.join(testFolder, 'mywidget.dart'), exportContent);

            const result = extension.getExportFileName(testFolder);

            assert.strictEqual(result, 'mywidget.dart');
        });

        test('should return index.dart when default file exists but is not an export file', () => {
            const testFolder = path.join(tempDir, 'mywidget');
            fs.mkdirSync(testFolder);

            // Create a non-export file (a regular Dart class)
            const classContent = "class MyWidget extends StatelessWidget {\n  @override\n  Widget build(BuildContext context) {\n    return Container();\n  }\n}";
            fs.writeFileSync(path.join(testFolder, 'mywidget.dart'), classContent);

            const result = extension.getExportFileName(testFolder);

            assert.strictEqual(result, 'index.dart');
        });

        test('should return index.dart when default file is not export and index.dart exists', () => {
            const testFolder = path.join(tempDir, 'mywidget');
            fs.mkdirSync(testFolder);

            // Create a non-export file
            const classContent = "class MyWidget {}";
            fs.writeFileSync(path.join(testFolder, 'mywidget.dart'), classContent);

            // Create an existing index.dart
            const indexContent = "export 'other.dart';";
            fs.writeFileSync(path.join(testFolder, 'index.dart'), indexContent);

            const result = extension.getExportFileName(testFolder);

            assert.strictEqual(result, 'index.dart');
        });

        test('should detect export with single quotes', () => {
            const testFolder = path.join(tempDir, 'widgets');
            fs.mkdirSync(testFolder);

            const exportContent = "export 'button.dart';";
            fs.writeFileSync(path.join(testFolder, 'widgets.dart'), exportContent);

            const result = extension.getExportFileName(testFolder);

            assert.strictEqual(result, 'widgets.dart');
        });

        test('should detect export with double quotes', () => {
            const testFolder = path.join(tempDir, 'widgets');
            fs.mkdirSync(testFolder);

            const exportContent = 'export "button.dart";';
            fs.writeFileSync(path.join(testFolder, 'widgets.dart'), exportContent);

            const result = extension.getExportFileName(testFolder);

            assert.strictEqual(result, 'widgets.dart');
        });

        test('should not consider import statements as export files', () => {
            const testFolder = path.join(tempDir, 'myservice');
            fs.mkdirSync(testFolder);

            // Create a file with imports but no exports
            const importContent = "import 'package:flutter/material.dart';\n\nclass MyService {}";
            fs.writeFileSync(path.join(testFolder, 'myservice.dart'), importContent);

            const result = extension.getExportFileName(testFolder);

            assert.strictEqual(result, 'index.dart');
        });
    });
});
