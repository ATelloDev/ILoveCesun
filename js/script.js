// Configuración de PDFTron
const PDFTronLicenseKey = 'TU_LICENCIA_DE_PDFTRON_AQUI'; // Reemplaza con tu clave de licencia
let viewer;

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar el visor de PDF
    await initializePDFTron();
    
    // Elementos del DOM
    const toolsSection = document.getElementById('tools');
    const uploadSection = document.getElementById('file-upload');
    const resultSection = document.getElementById('result');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const selectFilesBtn = document.getElementById('selectFiles');
    const fileList = document.getElementById('fileList');
    const processBtn = document.getElementById('processFiles');
    const backToToolsBtn = document.getElementById('backToTools');
    const newConversionBtn = document.getElementById('newConversion');
    const downloadResultBtn = document.getElementById('downloadResult');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    let selectedTool = '';
    let files = [];
    let processedDocument = null;
    
    // Manejadores de eventos para las tarjetas de herramientas
    document.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('click', () => {
            selectedTool = card.getAttribute('data-tool');
            toolsSection.classList.add('hidden');
            uploadSection.classList.remove('hidden');
            updateUploadSectionTitle(selectedTool);
        });
    });
    
    // Actualizar el título de la sección de carga según la herramienta seleccionada
    function updateUploadSectionTitle(tool) {
        const titles = {
            'merge': 'Combinar PDF',
            'split': 'Dividir PDF',
            'word-to-pdf': 'Word a PDF',
            'pdf-to-word': 'PDF a Word',
            'compress': 'Comprimir PDF',
            'unlock': 'Desbloquear PDF'
        };
        
        uploadSection.querySelector('h2').textContent = titles[tool] || 'Subir archivos';
    }
    
    // Manejador para el botón de seleccionar archivos
    selectFilesBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Manejador para la selección de archivos
    fileInput.addEventListener('change', handleFileSelect);
    
    // Manejadores para arrastrar y soltar archivos
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropZone.classList.add('dragover');
    }
    
    function unhighlight() {
        dropZone.classList.remove('dragover');
    }
    
    // Manejador para soltar archivos
    dropZone.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const droppedFiles = dt.files;
        handleFiles(droppedFiles);
    }
    
    function handleFileSelect(e) {
        const selectedFiles = e.target.files;
        handleFiles(selectedFiles);
    }
    
    // Procesar archivos seleccionados
    function handleFiles(selectedFiles) {
        files = Array.from(selectedFiles);
        
        // Limpiar lista de archivos
        fileList.innerHTML = '';
        
        if (files.length === 0) {
            processBtn.disabled = true;
            return;
        }
        
        // Mostrar archivos seleccionados
        files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <i class="fas fa-file-pdf"></i>
                    <span>${file.name} (${formatFileSize(file.size)})</span>
                </div>
                <span class="file-remove" data-index="${index}">&times;</span>
            `;
            fileList.appendChild(fileItem);
        });
        
        // Habilitar botón de procesar si hay archivos
        processBtn.disabled = files.length === 0;
        
        // Agregar manejadores de eventos para eliminar archivos
        document.querySelectorAll('.file-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                files.splice(index, 1);
                handleFiles(files); // Vuelve a renderizar la lista
            });
        });
    }
    
    // Formatear tamaño de archivo
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Manejador para el botón de volver a las herramientas
    backToToolsBtn.addEventListener('click', () => {
        uploadSection.classList.add('hidden');
        toolsSection.classList.remove('hidden');
        files = [];
        fileList.innerHTML = '';
        fileInput.value = '';
        processBtn.disabled = true;
    });
    
    // Manejador para el botón de nueva conversión
    newConversionBtn.addEventListener('click', () => {
        resultSection.classList.add('hidden');
        toolsSection.classList.remove('hidden');
        files = [];
        fileInput.value = '';
        processBtn.disabled = true;
    });
    
    // Manejador para el botón de procesar
    processBtn.addEventListener('click', processFiles);
    
    // Función para procesar los archivos
    async function processFiles() {
        if (files.length === 0) return;
        
        // Mostrar overlay de carga
        loadingOverlay.classList.remove('hidden');
        
        try {
            // Cargar el primer archivo en el visor de PDFTron
            const file = files[0];
            const arrayBuffer = await file.arrayBuffer();
            
            // Procesar según la herramienta seleccionada
            switch(selectedTool) {
                case 'merge':
                    processedDocument = await mergePDFs(files);
                    break;
                case 'split':
                    processedDocument = await splitPDF(file);
                    break;
                case 'word-to-pdf':
                    processedDocument = await convertToPDF(file);
                    break;
                case 'pdf-to-word':
                    processedDocument = await convertToWord(file);
                    break;
                case 'compress':
                    processedDocument = await compressPDF(file);
                    break;
                case 'unlock':
                    processedDocument = await unlockPDF(file);
                    break;
                default:
                    throw new Error('Herramienta no soportada');
            }
            
            // Mostrar el resultado en el visor
            if (processedDocument) {
                await viewer.loadDocument(processedDocument);
                uploadSection.classList.add('hidden');
                resultSection.classList.remove('hidden');
                
                // Configurar el botón de descarga
                const blob = new Blob([processedDocument], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                downloadResultBtn.href = url;
                downloadResultBtn.download = `resultado_${selectedTool}.${selectedTool.includes('word') ? 'docx' : 'pdf'}`;
            }
            
        } catch (error) {
            console.error('Error al procesar los archivos:', error);
            alert(`Error: ${error.message}. Por favor, inténtalo de nuevo.`);
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    }
    
    // Inicializar el visor de PDFTron
    async function initializePDFTron() {
        return new Promise((resolve) => {
            WebViewer({
                path: 'https://www.pdftron.com/downloads/webviewer/lib',
                licenseKey: PDFTronLicenseKey,
                initialDoc: '',
                fullAPI: true,
                enableFilePicker: false
            }, document.getElementById('viewer')).then(instance => {
                viewer = instance;
                resolve();
            });
        });
    }
    
    // Funciones de procesamiento de PDF
    async function mergePDFs(files) {
        const { PDFNet } = window.Core;
        const mergedDoc = new PDFNet.PDFDoc();
        
        await PDFNet.initialize();
        
        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            const doc = await PDFNet.PDFDoc.createFromBuffer(arrayBuffer);
            mergedDoc.insertPages(mergedDoc.getPageCount(), doc, 1, doc.getPageCount(), PDFNet.PDFDoc.InsertFlag.e_none);
        }
        
        return await mergedDoc.saveMemoryBuffer(PDFNet.SDFDoc.SaveOptions.e_linearized);
    }
    
    async function splitPDF(file) {
        // Implementación básica: devuelve la primera página
        const { PDFNet } = window.Core;
        const arrayBuffer = await file.arrayBuffer();
        const doc = await PDFNet.PDFDoc.createFromBuffer(arrayBuffer);
        
        // Crear un nuevo documento con solo la primera página
        const newDoc = new PDFNet.PDFDoc();
        newDoc.insertPages(0, doc, 1, 1, PDFNet.PDFDoc.InsertFlag.e_none);
        
        return await newDoc.saveMemoryBuffer(PDFNet.SDFDoc.SaveOptions.e_linearized);
    }
    
    async function convertToPDF(file) {
        // Para una implementación real, necesitarías un servicio de conversión de Word a PDF
        // Esta es una implementación simulada
        const arrayBuffer = await file.arrayBuffer();
        return arrayBuffer;
    }
    
    async function convertToWord(file) {
        // Para una implementación real, necesitarías un servicio de conversión de PDF a Word
        // Esta es una implementación simulada
        const arrayBuffer = await file.arrayBuffer();
        return arrayBuffer;
    }
    
    async function compressPDF(file) {
        const { PDFNet } = window.Core;
        const arrayBuffer = await file.arrayBuffer();
        const doc = await PDFNet.PDFDoc.createFromBuffer(arrayBuffer);
        
        // Configurar opciones de optimización
        const opts = new PDFNet.OptimizerSettings();
        opts.setCompressImages(true);
        opts.setQuality(60); // Calidad de imagen reducida para compresión
        
        await PDFNet.Optimizer.optimize(doc, opts);
        
        return await doc.saveMemoryBuffer(PDFNet.SDFDoc.SaveOptions.e_linearized);
    }
    
    async function unlockPDF(file) {
        // Nota: Desbloquear PDFs protegidos con contraseña requiere permisos específicos
        // Esta es una implementación básica que asume que el PDF no tiene contraseña
        const arrayBuffer = await file.arrayBuffer();
        return arrayBuffer;
    }
    
    // Manejador para el botón de descarga
    downloadResultBtn.addEventListener('click', (e) => {
        // En un caso real, aquí se manejaría la descarga del archivo procesado
        // Por ahora, solo mostramos un mensaje
        alert('En una implementación real, el archivo se descargaría automáticamente.');
    });
    
    // Función para enviar archivos a la API (ejemplo)
    async function uploadFileToAPI(file, tool) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tool', tool);
        
        try {
            const response = await fetch(`${API_BASE_URL}/${tool}`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Error en la solicitud a la API');
            }
            
            return await response.blob();
        } catch (error) {
            console.error('Error al subir el archivo:', error);
            throw error;
        }
    }
});
