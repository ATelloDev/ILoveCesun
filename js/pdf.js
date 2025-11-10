// Configuración de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const pdfPreviewSection = document.getElementById('pdfPreviewSection');
    const pdfInfo = document.getElementById('pdfInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const pageCount = document.getElementById('pageCount');
    const pdfPages = document.getElementById('pdfPages');
    const namingSection = document.getElementById('namingSection');
    const autoNaming = document.getElementById('autoNaming');
    const manualNaming = document.getElementById('manualNaming');
    const manualNamingSection = document.getElementById('manualNamingSection');
    const pageNamesContainer = document.getElementById('pageNamesContainer');
    const progressSection = document.getElementById('progressSection');
    const progressText = document.getElementById('progressText');
    const progressBar = document.getElementById('progressBar');
    const processBtn = document.getElementById('processBtn');
    const resetBtn = document.getElementById('resetBtn');
    const resultsSection = document.getElementById('resultsSection');
    const pagesGrid = document.getElementById('pagesGrid');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const downloadZipBtn = document.getElementById('downloadZipBtn');
    const pageModal = document.getElementById('pageModal');
    const modalImage = document.getElementById('modalImage');
    const modalInfo = document.getElementById('modalInfo');
    const modalClose = document.getElementById('modalClose');

    // Variables de estado
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    let currentPDF = null;
    let pdfDoc = null;
    let totalPages = 0;
    let pageImages = [];
    let pageNames = [];

    // Inicializar event listeners
    initEventListeners();

    function initEventListeners() {
        // Eventos de archivo
        browseBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect);
        
        // Drag & drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                handleFile(e.dataTransfer.files[0]);
            }
        });

        // Opciones de nombrado
        autoNaming.addEventListener('change', updateNamingMode);
        manualNaming.addEventListener('change', updateNamingMode);

        // Botones de acción
        processBtn.addEventListener('click', processPDF);
        resetBtn.addEventListener('click', resetConverter);
        downloadAllBtn.addEventListener('click', downloadAllPages);
        downloadZipBtn.addEventListener('click', downloadAsZip);

        // Modal
        modalClose.addEventListener('click', () => {
            pageModal.classList.remove('show');
        });

        pageModal.addEventListener('click', (e) => {
            if (e.target === pageModal) {
                pageModal.classList.remove('show');
            }
        });
    }

    function handleFileSelect(e) {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    }

    function handleFile(file) {
        // Validaciones
        if (file.type !== 'application/pdf') {
            alert('Por favor, selecciona un archivo PDF válido.');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            alert('El archivo es demasiado grande. Límite: 50MB.');
            return;
        }

        currentPDF = file;
        loadPDF(file);
    }

    async function loadPDF(file) {
        try {
            // Mostrar información del archivo
            fileName.textContent = `Nombre: ${file.name}`;
            fileSize.textContent = `Tamaño: ${formatFileSize(file.size)}`;

            // Cargar PDF
            const arrayBuffer = await file.arrayBuffer();
            pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            totalPages = pdfDoc.numPages;
            
            pageCount.textContent = `Páginas: ${totalPages}`;
            
            // Mostrar secciones
            pdfPreviewSection.style.display = 'block';
            namingSection.style.display = 'block';
            processBtn.disabled = false;

            // Generar vistas previas
            await generatePreviews();

            // Inicializar nombres de páginas
            initializePageNames();

        } catch (error) {
            console.error('Error al cargar el PDF:', error);
            alert('Error al cargar el PDF. Por favor, verifica que el archivo no esté corrupto.');
        }
    }

    async function generatePreviews() {
        pdfPages.innerHTML = '';
        pageImages = [];

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 0.3 });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            const pageData = {
                pageNumber: i,
                imageData: canvas.toDataURL('image/png'),
                canvas: canvas
            };

            pageImages.push(pageData);

            // Crear elemento de vista previa
            const pageElement = document.createElement('div');
            pageElement.className = 'pdf-page';
            pageElement.innerHTML = `
                <div class="page-preview">📄</div>
                <div class="page-number">Página ${i}</div>
            `;

            pageElement.addEventListener('click', () => showPagePreview(i, pageData.imageData));
            pdfPages.appendChild(pageElement);
        }
    }

    function initializePageNames() {
        pageNames = [];
        for (let i = 1; i <= totalPages; i++) {
            pageNames.push(`Página ${i}`);
        }
        updateManualNamingInputs();
    }

    function updateNamingMode() {
        const isManual = manualNaming.checked;
        manualNamingSection.style.display = isManual ? 'block' : 'none';
        
        if (isManual) {
            updateManualNamingInputs();
        }
    }

    function updateManualNamingInputs() {
        pageNamesContainer.innerHTML = '';
        
        for (let i = 0; i < totalPages; i++) {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'page-name-input';
            inputGroup.innerHTML = `
                <span class="page-label">Página ${i + 1}:</span>
                <input type="text" 
                       value="${pageNames[i]}" 
                       placeholder="Nombre para la página ${i + 1}"
                       data-page="${i + 1}">
            `;
            
            const input = inputGroup.querySelector('input');
            input.addEventListener('input', (e) => {
                pageNames[i] = e.target.value || `Página ${i + 1}`;
            });
            
            pageNamesContainer.appendChild(inputGroup);
        }
    }

    function showPagePreview(pageNumber, imageData) {
        modalImage.src = imageData;
        modalInfo.innerHTML = `
            <h4>Página ${pageNumber}</h4>
            <p>Nombre: ${pageNames[pageNumber - 1]}</p>
        `;
        pageModal.classList.add('show');
    }

    async function processPDF() {
        if (!pdfDoc) return;

        // Preparar UI
        processBtn.disabled = true;
        progressSection.style.display = 'block';
        resultsSection.style.display = 'none';
        
        let processed = 0;

        // Procesar páginas
        for (let i = 1; i <= totalPages; i++) {
            await processPage(i);
            processed++;
            
            // Actualizar progreso
            const progress = (processed / totalPages) * 100;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${processed}/${totalPages}`;
        }

        // Mostrar resultados
        showResults();
        processBtn.disabled = false;
    }

    async function processPage(pageNumber) {
        try {
            const page = await pdfDoc.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 2.0 }); // Mayor calidad para descarga
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            // Actualizar la imagen de la página procesada
            const pageIndex = pageNumber - 1;
            if (pageImages[pageIndex]) {
                pageImages[pageIndex].processedImage = canvas.toDataURL('image/png');
                pageImages[pageIndex].processedCanvas = canvas;
            }

        } catch (error) {
            console.error(`Error procesando página ${pageNumber}:`, error);
        }
    }

    function showResults() {
        pagesGrid.innerHTML = '';
        
        pageImages.forEach((pageData, index) => {
            const pageElement = document.createElement('div');
            pageElement.className = 'page-result';
            pageElement.innerHTML = `
                <img src="${pageData.processedImage || pageData.imageData}" 
                     alt="${pageNames[index]}" 
                     class="page-preview-result"
                     onclick="showPagePreview(${index + 1}, '${pageData.processedImage || pageData.imageData}')">
                <div class="page-info">
                    <div class="page-name">${pageNames[index]}</div>
                    <button class="page-download-btn" onclick="downloadSinglePage(${index})">
                        📥 Descargar
                    </button>
                </div>
            `;
            pagesGrid.appendChild(pageElement);
        });

        resultsSection.style.display = 'block';
    }

    function downloadSinglePage(pageIndex) {
        const pageData = pageImages[pageIndex];
        const pageName = pageNames[pageIndex];
        
        if (pageData.processedCanvas) {
            pageData.processedCanvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${pageName}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        }
    }

    function downloadAllPages() {
        pageImages.forEach((pageData, index) => {
            setTimeout(() => {
                downloadSinglePage(index);
            }, index * 100); // Pequeño delay para evitar bloqueos
        });
    }

    async function downloadAsZip() {
        const zip = new JSZip();
        
        // Agregar cada página al ZIP
        for (let i = 0; i < pageImages.length; i++) {
            const pageData = pageImages[i];
            const pageName = pageNames[i];
            
            if (pageData.processedCanvas) {
                const blob = await new Promise(resolve => {
                    pageData.processedCanvas.toBlob(resolve);
                });
                
                zip.file(`${pageName}.png`, blob);
            }
        }
        
        // Generar y descargar ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, `${currentPDF.name.replace('.pdf', '')}_paginas.zip`);
    }

    function resetConverter() {
        if (confirm('¿Estás seguro de que quieres reiniciar? Se perderá el progreso actual.')) {
            // Limpiar estado
            currentPDF = null;
            pdfDoc = null;
            totalPages = 0;
            pageImages = [];
            pageNames = [];
            
            // Limpiar UI
            fileInput.value = '';
            pdfPreviewSection.style.display = 'none';
            namingSection.style.display = 'none';
            progressSection.style.display = 'none';
            resultsSection.style.display = 'none';
            processBtn.disabled = true;
            
            // Restablecer opciones
            autoNaming.checked = true;
            manualNamingSection.style.display = 'none';
        }
    }

    // Utilidades
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Funciones globales
    window.showPagePreview = showPagePreview;
    window.downloadSinglePage = downloadSinglePage;

    console.log('Separador de PDF cargado correctamente');
});