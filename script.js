// Configuración de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Variables globales
let currentPdf = null;
let currentPage = 1;
let totalPages = 0;
let scale = 1.5;

// Elementos del DOM
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const uploadSection = document.getElementById('uploadSection');
const previewSection = document.getElementById('previewSection');
const printSection = document.getElementById('printSection');
const pdfCanvas = document.getElementById('pdfCanvas');
const printContainer = document.getElementById('printContainer');
const pageInfo = document.getElementById('pageInfo');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const loadAnotherBtn = document.getElementById('loadAnotherBtn');
const printBtn = document.getElementById('printBtn');
const backToPreviewBtn = document.getElementById('backToPreview');
const actualPrintBtn = document.getElementById('actualPrint');

// Event listeners
fileInput.addEventListener('change', handleFileSelect);
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);
prevPageBtn.addEventListener('click', () => changePage(-1));
nextPageBtn.addEventListener('click', () => changePage(1));
loadAnotherBtn.addEventListener('click', loadAnotherFile);
printBtn.addEventListener('click', showPrintView);
backToPreviewBtn.addEventListener('click', showPreviewView);
actualPrintBtn.addEventListener('click', printDocument);

// Funciones de drag and drop
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
        loadPDF(files[0]);
    } else {
        alert('Por favor, selecciona un archivo PDF válido.');
    }
}

// Manejo de selección de archivos
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        loadPDF(file);
    } else {
        alert('Por favor, selecciona un archivo PDF válido.');
    }
}

// Cargar PDF
async function loadPDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        currentPdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        totalPages = currentPdf.numPages;
        currentPage = 1;
        
        // Ocultar sección de carga y mostrar solo previsualización
        uploadSection.style.display = 'none';
        previewSection.style.display = 'block';
        printSection.style.display = 'none';
        
        // Renderizar primera página
        await renderPage(currentPage);
        updatePageInfo();
        updateButtonStates();
        
        // Scroll suave a la sección de previsualización
        previewSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error al cargar el PDF:', error);
        alert('Error al cargar el archivo PDF. Por favor, verifica que el archivo no esté corrupto.');
    }
}

// Renderizar página específica
async function renderPage(pageNum) {
    if (!currentPdf) return;
    
    try {
        const page = await currentPdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: scale });
        
        // Configurar canvas
        const canvas = pdfCanvas;
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Renderizar página
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
    } catch (error) {
        console.error('Error al renderizar la página:', error);
        alert('Error al renderizar la página del PDF.');
    }
}

// Cambiar página
async function changePage(direction) {
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        await renderPage(currentPage);
        updatePageInfo();
        updateButtonStates();
    }
}

// Actualizar información de página
function updatePageInfo() {
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
}

// Actualizar estado de botones
function updateButtonStates() {
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

// Mostrar vista de impresión
async function showPrintView() {
    if (!currentPdf) return;
    
    try {
        // Ocultar vista previa y mostrar vista de impresión
        previewSection.style.display = 'none';
        printSection.style.display = 'block';
        
        // Limpiar contenedor de impresión
        printContainer.innerHTML = '';
        
        // Renderizar todas las páginas para la vista de impresión
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const page = await currentPdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.0 }); // Escala 1:1 para impresión
            
            // Crear contenedor para la página
            const pageDiv = document.createElement('div');
            pageDiv.className = 'print-page';
            
            // Crear canvas para la página
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // Renderizar página
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            pageDiv.appendChild(canvas);
            printContainer.appendChild(pageDiv);
        }
        
        // Scroll suave a la sección de impresión
        printSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error al preparar vista de impresión:', error);
        alert('Error al preparar la vista de impresión.');
    }
}

// Volver a vista previa
function showPreviewView() {
    printSection.style.display = 'none';
    previewSection.style.display = 'block';
    previewSection.scrollIntoView({ behavior: 'smooth' });
}

// Cargar otro archivo
function loadAnotherFile() {
    // Limpiar el input de archivo
    fileInput.value = '';
    
    // Mostrar sección de carga y ocultar las demás
    uploadSection.style.display = 'block';
    previewSection.style.display = 'none';
    printSection.style.display = 'none';
    
    // Limpiar variables
    currentPdf = null;
    currentPage = 1;
    totalPages = 0;
    
    // Scroll suave a la sección de carga
    uploadSection.scrollIntoView({ behavior: 'smooth' });
}

// Imprimir documento
function printDocument() {
    // Crear una ventana de impresión
    const printWindow = window.open('', '_blank');
    
    // Obtener el HTML de las páginas
    const printContent = printContainer.innerHTML;
    
    // Crear el HTML completo para impresión
    const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Impresión de PDF</title>
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                }
                .print-page {
                    width: 100%;
                    max-width: 210mm;
                    margin: 0 auto 20px auto;
                    background: white;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    page-break-after: always;
                }
                .print-page:last-child {
                    page-break-after: auto;
                }
                .print-page canvas {
                    width: 100%;
                    height: auto;
                    display: block;
                }
                @media print {
                    body {
                        padding: 0;
                    }
                    .print-page {
                        box-shadow: none;
                        margin: 0;
                        max-width: none;
                    }
                }
            </style>
        </head>
        <body>
            ${printContent}
        </body>
        </html>
    `;
    
    // Escribir el contenido y abrir diálogo de impresión
    printWindow.document.write(printHTML);
    printWindow.document.close();
    
    // Esperar a que se cargue el contenido y abrir diálogo de impresión
    printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('PDF Preview aplicación cargada correctamente');
    
    // Configurar el área de carga
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
            loadPDF(files[0]);
        } else {
            alert('Por favor, selecciona un archivo PDF válido.');
        }
    });
});
