// JavaScript para el convertidor de imágenes
document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const fileZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const filesList = document.getElementById('filesList');
    const filesContainer = document.getElementById('filesContainer');
    const filesCount = document.getElementById('filesCount');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const convertBtn = document.getElementById('convertBtn');
    const resetBtn = document.getElementById('resetBtn');
    const globalProgress = document.getElementById('globalProgress');
    const globalProgressBar = document.getElementById('globalProgressBar');
    const globalProgressText = document.getElementById('globalProgressText');
    const resultsSection = document.getElementById('resultsSection');
    const resultsContainer = document.getElementById('resultsContainer');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const conversionOptions = document.querySelectorAll('.conversion-option');
    const sizeOptions = document.querySelectorAll('.size-option');
    const previewModal = document.getElementById('previewModal');
    const previewImage = document.getElementById('previewImage');
    const previewInfo = document.getElementById('previewInfo');
    const previewClose = document.getElementById('previewClose');

    // Variables de estado
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    let selectedFiles = [];
    let selectedFormat = null;
    let selectedScale = 1;
    let conversionResults = [];
    let filePreviews = new Map();

    // Inicializar event listeners
    initEventListeners();

    function initEventListeners() {
        // Eventos de archivo
        browseBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect);
        
        // Drag & drop
        fileZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileZone.classList.add('dragover');
        });
        
        fileZone.addEventListener('dragleave', () => {
            fileZone.classList.remove('dragover');
        });
        
        fileZone.addEventListener('drop', (e) => {
            e.preventDefault();
            fileZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                handleFiles(Array.from(e.dataTransfer.files));
            }
        });

        // Opciones de conversión
        conversionOptions.forEach(option => {
            option.addEventListener('click', () => {
                conversionOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                selectedFormat = option.getAttribute('data-format');
                updateConvertButton();
            });
        });

        // Opciones de tamaño
        sizeOptions.forEach(option => {
            option.addEventListener('click', () => {
                sizeOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                selectedScale = parseFloat(option.getAttribute('data-scale'));
            });
        });

        // Configuraciones
        qualitySlider.addEventListener('input', () => {
            qualityValue.textContent = `${qualitySlider.value}%`;
        });

        // Botones de acción
        convertBtn.addEventListener('click', startBatchConversion);
        resetBtn.addEventListener('click', resetConverter);
        clearAllBtn.addEventListener('click', clearAllFiles);
        downloadAllBtn.addEventListener('click', downloadAllFiles);

        // Preview modal
        previewClose.addEventListener('click', () => {
            previewModal.classList.remove('show');
        });

        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) {
                previewModal.classList.remove('show');
            }
        });
    }

    function handleFileSelect(e) {
        if (e.target.files.length) {
            handleFiles(Array.from(e.target.files));
        }
    }

    function handleFiles(files) {
        const validFiles = [];
        const errors = [];

        files.forEach(file => {
            if (!file.type.startsWith('image/')) {
                errors.push(`${file.name}: No es una imagen válida`);
                return;
            }

            if (file.size > MAX_FILE_SIZE) {
                errors.push(`${file.name}: Supera el límite de 50MB`);
                return;
            }

            if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
                errors.push(`${file.name}: Archivo duplicado`);
                return;
            }

            validFiles.push(file);
        });

        if (errors.length > 0) {
            alert('Errores encontrados:\n' + errors.join('\n'));
        }

        if (validFiles.length > 0) {
            selectedFiles = [...selectedFiles, ...validFiles];
            updateFilesList();
            updateConvertButton();
        }
    }

    function updateFilesList() {
        filesContainer.innerHTML = '';
        
        selectedFiles.forEach((file, index) => {
            const previewUrl = URL.createObjectURL(file);
            filePreviews.set(file.name, previewUrl);
            
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <img src="${previewUrl}" alt="Preview" class="file-preview" onclick="showPreview('${file.name}', '${previewUrl}')">
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-meta">
                            <span>${formatFileSize(file.size)}</span>
                            <span>${getFileExtension(file.name).toUpperCase()}</span>
                            <span>${file.type}</span>
                        </div>
                    </div>
                </div>
                <div class="file-status">
                    <span class="status-pending">Pendiente</span>
                    <div class="file-actions">
                        <button class="remove-btn" onclick="removeFile(${index})" title="Eliminar">❌</button>
                    </div>
                </div>
            `;
            filesContainer.appendChild(fileItem);
        });

        filesCount.textContent = selectedFiles.length;
        
        if (selectedFiles.length > 0) {
            filesList.classList.add('show');
        } else {
            filesList.classList.remove('show');
        }
    }

    function showPreview(fileName, previewUrl) {
        const file = selectedFiles.find(f => f.name === fileName);
        if (file) {
            previewImage.src = previewUrl;
            previewInfo.innerHTML = `
                <h4>${fileName}</h4>
                <p>Tamaño: ${formatFileSize(file.size)} | Formato: ${getFileExtension(file.name).toUpperCase()}</p>
            `;
            previewModal.classList.add('show');
        }
    }

    function removeFile(index) {
        const file = selectedFiles[index];
        if (filePreviews.has(file.name)) {
            URL.revokeObjectURL(filePreviews.get(file.name));
            filePreviews.delete(file.name);
        }
        
        selectedFiles.splice(index, 1);
        updateFilesList();
        updateConvertButton();
    }

    function clearAllFiles() {
        if (selectedFiles.length > 0 && confirm('¿Estás seguro de que quieres eliminar todos los archivos?')) {
            filePreviews.forEach(url => URL.revokeObjectURL(url));
            filePreviews.clear();
            
            selectedFiles = [];
            updateFilesList();
            updateConvertButton();
            resultsSection.classList.remove('show');
        }
    }

    function updateConvertButton() {
        convertBtn.disabled = !(selectedFiles.length > 0 && selectedFormat);
    }

    async function startBatchConversion() {
        if (selectedFiles.length === 0 || !selectedFormat) return;

        convertBtn.disabled = true;
        convertBtn.textContent = 'Procesando...';
        globalProgress.classList.add('show');
        resultsSection.classList.remove('show');
        conversionResults = [];

        const fileItems = document.querySelectorAll('.file-item');
        fileItems.forEach(item => {
            const status = item.querySelector('.status-pending');
            if (status) {
                status.textContent = 'En cola';
                status.className = 'status-processing';
            }
        });

        const batchSize = 3;
        const totalFiles = selectedFiles.length;
        let processedFiles = 0;

        for (let i = 0; i < totalFiles; i += batchSize) {
            const batch = selectedFiles.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (file, batchIndex) => {
                const fileIndex = i + batchIndex;
                await processFile(file, fileIndex);
                processedFiles++;
                updateGlobalProgress(processedFiles, totalFiles);
            });

            await Promise.all(batchPromises);
        }

        showResults();
        convertBtn.disabled = false;
        convertBtn.textContent = 'Convertir Todas las Imágenes';
    }

    async function processFile(file, index) {
        const fileItem = document.querySelectorAll('.file-item')[index];
        const status = fileItem.querySelector('.status-processing');
        
        try {
            status.textContent = 'Procesando...';
            
            const result = await convertImage(
                file, 
                selectedFormat, 
                parseInt(qualitySlider.value) / 100,
                selectedScale
            );
            
            status.textContent = 'Completado';
            status.className = 'status-completed';
            
            conversionResults.push({
                originalFile: file,
                convertedFile: result.file,
                blob: result.blob,
                previewUrl: result.previewUrl,
                originalSize: result.originalSize,
                convertedSize: result.convertedSize,
                compressionRatio: result.compressionRatio,
                success: true
            });
            
        } catch (error) {
            status.textContent = 'Error';
            status.className = 'status-error';
            fileItem.classList.add('error');
            
            conversionResults.push({
                originalFile: file,
                error: error.message,
                success: false
            });
        }
    }

    function updateGlobalProgress(processed, total) {
        const percentage = (processed / total) * 100;
        globalProgressBar.style.width = `${percentage}%`;
        globalProgressText.textContent = `${processed}/${total}`;
    }

    function convertImage(file, targetFormat, quality, scale) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = this.width * scale;
                canvas.height = this.height * scale;
                
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                ctx.drawImage(this, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Error al convertir la imagen'));
                        return;
                    }

                    const convertedFile = new File([blob], 
                        `${file.name.split('.')[0]}.${targetFormat}`, 
                        { type: `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}` }
                    );
                    
                    resolve({
                        file: convertedFile,
                        blob: blob,
                        previewUrl: URL.createObjectURL(blob),
                        originalSize: file.size,
                        convertedSize: blob.size,
                        compressionRatio: ((file.size - blob.size) / file.size * 100).toFixed(1)
                    });
                    
                }, `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}`, quality);
            };
            
            img.onerror = () => reject(new Error('Error al cargar la imagen'));
            img.src = URL.createObjectURL(file);
        });
    }

    function showResults() {
        resultsContainer.innerHTML = '';
        
        const successfulResults = conversionResults.filter(r => r.success);
        const failedResults = conversionResults.filter(r => !r.success);
        
        successfulResults.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <img src="${result.previewUrl}" alt="Resultado" class="result-preview" onclick="showPreview('${result.convertedFile.name}', '${result.previewUrl}')">
                <div class="result-content">
                    <h4>✅ ${result.originalFile.name}</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; font-size: 0.9rem;">
                        <div><strong>Original:</strong> ${formatFileSize(result.originalSize)}</div>
                        <div><strong>Convertido:</strong> ${formatFileSize(result.convertedSize)}</div>
                        <div><strong>Formato:</strong> ${selectedFormat.toUpperCase()}</div>
                        <div><strong>Compresión:</strong> ${result.compressionRatio}%</div>
                    </div>
                    <button class="download-btn" onclick="downloadSingleFile('${result.convertedFile.name}', '${result.previewUrl}')">
                        Descargar ${result.convertedFile.name}
                    </button>
                </div>
            `;
            resultsContainer.appendChild(resultItem);
        });

        failedResults.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item error';
            resultItem.innerHTML = `
                <div class="result-content">
                    <h4>❌ ${result.originalFile.name}</h4>
                    <p><strong>Error:</strong> ${result.error}</p>
                </div>
            `;
            resultsContainer.appendChild(resultItem);
        });

        resultsSection.classList.add('show');
    }

    function downloadAllFiles() {
        conversionResults.forEach(result => {
            if (result.success) {
                downloadSingleFile(result.convertedFile.name, result.previewUrl);
            }
        });
    }

    function resetConverter() {
        if (confirm('¿Estás seguro de que quieres reiniciar todo? Se perderán todos los archivos y resultados.')) {
            filePreviews.forEach(url => URL.revokeObjectURL(url));
            filePreviews.clear();
            conversionResults.forEach(result => {
                if (result.success) {
                    URL.revokeObjectURL(result.previewUrl);
                }
            });
            
            selectedFiles = [];
            selectedFormat = null;
            selectedScale = 1;
            fileInput.value = '';
            conversionResults = [];
            
            updateFilesList();
            updateConvertButton();
            globalProgress.classList.remove('show');
            resultsSection.classList.remove('show');
            
            conversionOptions.forEach(opt => opt.classList.remove('selected'));
            sizeOptions[0].click();
            qualitySlider.value = 85;
            qualityValue.textContent = '85%';
        }
    }

    // Utilidades
    function getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Funciones globales
    window.removeFile = removeFile;
    window.downloadSingleFile = function(filename, url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    window.downloadAllFiles = downloadAllFiles;
    window.showPreview = showPreview;

    console.log('Convertidor de imágenes cargado correctamente');
});