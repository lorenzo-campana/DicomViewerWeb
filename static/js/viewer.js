class DicomViewer {
    constructor() {
        this.currentCacheId = null;
        this.projections = {
            axial: { sliceIdx: 0, maxSlices: 0, canvas: null, ctx: null, zoom: 1, panX: 0, panY: 0, windowCenter: 40, windowWidth: 400 },
            sagittal: { sliceIdx: 0, maxSlices: 0, canvas: null, ctx: null, zoom: 1, panX: 0, panY: 0, windowCenter: 40, windowWidth: 400 },
            coronal: { sliceIdx: 0, maxSlices: 0, canvas: null, ctx: null, zoom: 1, panX: 0, panY: 0, windowCenter: 40, windowWidth: 400 }
        };
        this.adjustingContrast = {};
        this.contrastAdjusting = {};
        this.dragStart = {};
        this.imageCache = {};
        this.selectingROI = {};
        this.roiStart = {};
        this.currentAnalysisProj = null;
        this.analysisCanvas = null;

        this.init();
    }

    init() {
        this.setupFolderPicker();
        this.setupResizer();
    }

    setupResizer() {
        const resizer = document.getElementById('dragMe');
        const leftSide = resizer.previousElementSibling;
        const rightSide = resizer.nextElementSibling;

        // The current position of mouse
        let x = 0;
        let w = 0;

        const mouseDownHandler = function (e) {
            // Get the current mouse position
            x = e.clientX;
            w = leftSide.getBoundingClientRect().width;

            // Attach the listeners to `document`
            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
            resizer.classList.add('resizing');
        };

        const mouseMoveHandler = function (e) {
            // How far the mouse has been moved
            const dx = e.clientX - x;
            const newWidth = w + dx;

            // Min and max width constraints (also in CSS)
            if (newWidth > 100 && newWidth < 500) {
                leftSide.style.width = `${newWidth}px`;
            }
        };

        const mouseUpHandler = function () {
            resizer.classList.remove('resizing');
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        };

        resizer.addEventListener('mousedown', mouseDownHandler);
    }

    setupFolderPicker() {
        const folderPickerBtn = document.getElementById('folderPickerBtn');
        const folderInput = document.getElementById('folderInput');
        const pathInput = document.getElementById('pathInput');

        folderPickerBtn.addEventListener('click', () => {
            folderInput.click();
        });

        folderInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            // Filter for DICOM files
            const dicomFiles = files.filter(f =>
                f.name.toLowerCase().endsWith('.dcm') ||
                f.name.toLowerCase().endsWith('.dicom')
            );

            if (dicomFiles.length === 0) {
                this.showError('Nessun file DICOM trovato nella cartella selezionata');
                return;
            }

            // Get the common parent directory path
            const firstPath = files[0].webkitRelativePath || files[0].name;
            const pathParts = firstPath.split('/');
            const folderName = pathParts[0];

            pathInput.value = folderName;

            // Build and render file tree
            const tree = this.buildFileTree(dicomFiles);
            this.renderFileTree(tree);
        });
    }

    buildFileTree(files) {
        const root = {};

        files.forEach(file => {
            const pathParts = file.webkitRelativePath.split('/');
            let currentLevel = root;

            // Skip the first part as it's the root folder name already displayed
            for (let i = 1; i < pathParts.length; i++) {
                const part = pathParts[i];
                const isFile = i === pathParts.length - 1;

                if (isFile) {
                    if (!currentLevel.files) currentLevel.files = [];
                    currentLevel.files.push({ name: part, file: file });
                } else {
                    if (!currentLevel.folders) currentLevel.folders = {};
                    if (!currentLevel.folders[part]) currentLevel.folders[part] = {};
                    currentLevel = currentLevel.folders[part];
                }
            }
        });

        return root;
    }

    renderFileTree(items, container = null) {
        if (!container) {
            container = document.getElementById('fileTree');
            container.innerHTML = '';
        }

        // Render folders
        if (items.folders) {
            Object.keys(items.folders).sort().forEach(folderName => {
                const folderData = items.folders[folderName];

                const itemEl = document.createElement('div');
                itemEl.className = 'tree-item';

                const contentEl = document.createElement('div');
                contentEl.className = 'tree-item-content';

                const toggleEl = document.createElement('div');
                toggleEl.className = 'tree-toggle';
                toggleEl.textContent = '▶';
                toggleEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const childrenEl = itemEl.querySelector('.tree-children');
                    childrenEl.classList.toggle('visible');
                    toggleEl.textContent = childrenEl.classList.contains('visible') ? '▼' : '▶';
                });
                contentEl.appendChild(toggleEl);

                const iconEl = document.createElement('div');
                iconEl.className = 'tree-icon';
                iconEl.textContent = '📁';
                contentEl.appendChild(iconEl);

                const labelEl = document.createElement('div');
                labelEl.className = 'tree-label';
                labelEl.textContent = folderName;
                contentEl.appendChild(labelEl);

                // Context menu for folder
                contentEl.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.showFileContextMenu(e, folderData, 'folder');
                });

                itemEl.appendChild(contentEl);

                const childrenEl = document.createElement('div');
                childrenEl.className = 'tree-children';
                this.renderFileTree(folderData, childrenEl);
                itemEl.appendChild(childrenEl);

                container.appendChild(itemEl);
            });
        }

        // Render files
        if (items.files) {
            items.files.sort((a, b) => a.name.localeCompare(b.name)).forEach(fileObj => {
                const itemEl = document.createElement('div');
                itemEl.className = 'tree-item';

                const contentEl = document.createElement('div');
                contentEl.className = 'tree-item-content';
                // Indent files to align with folders (toggle width + icon width)
                contentEl.style.paddingLeft = '2.25rem';

                const iconEl = document.createElement('div');
                iconEl.className = 'tree-icon';
                iconEl.textContent = '🖼️';
                contentEl.appendChild(iconEl);

                const labelEl = document.createElement('div');
                labelEl.className = 'tree-label';
                labelEl.textContent = fileObj.name;
                contentEl.appendChild(labelEl);

                // Left click to load single file
                contentEl.addEventListener('click', () => {
                    this.loadDicomFiles([fileObj.file]);
                });

                // Context menu for file
                contentEl.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.showFileContextMenu(e, fileObj, 'file');
                });

                itemEl.appendChild(contentEl);
                container.appendChild(itemEl);
            });
        }
    }

    showFileContextMenu(e, item, type) {
        // Remove existing menu
        const existing = document.querySelector('.context-menu');
        if (existing) existing.remove();

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';

        const loadItem = document.createElement('div');
        loadItem.className = 'context-menu-item';
        loadItem.textContent = 'Load';
        loadItem.addEventListener('click', () => {
            try {
                if (type === 'file') {
                    this.loadDicomFiles([item.file]);
                } else {
                    const allFiles = this.collectFiles(item);
                    if (allFiles.length > 0) {
                        this.loadDicomFiles(allFiles);
                    } else {
                        this.showError('Cartella vuota');
                    }
                }
            } catch (err) {
                console.error('Error in context menu:', err);
            }
            menu.remove();
        });

        menu.appendChild(loadItem);
        document.body.appendChild(menu);

        // Close menu on click outside
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 0);
    }

    collectFiles(folderData) {
        let files = [];
        if (folderData.files) {
            files = files.concat(folderData.files.map(f => f.file));
        }
        if (folderData.folders) {
            Object.values(folderData.folders).forEach(subFolder => {
                files = files.concat(this.collectFiles(subFolder));
            });
        }
        return files;
    }

    async loadDicomFiles(files) {
        try {
            this.showLoading(true);

            // Read and sort DICOM files
            const fileDataArray = [];
            for (const file of files) {
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    fileDataArray.push({
                        name: file.name,
                        data: arrayBuffer
                    });
                } catch (e) {
                    console.error('Error reading file ' + file.name + ': ' + e.message);
                }
            }

            // Send to backend for processing
            const response = await fetch('/api/load-dicom-files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    files: fileDataArray.map(f => ({
                        name: f.name,
                        data: Array.from(new Uint8Array(f.data))
                    }))
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to load DICOM');
            }

            const data = await response.json();

            this.currentCacheId = data.cache_id;
            this.imageCache = {};

            // Initialize projections
            this.projections.axial.maxSlices = data.shape[0];
            this.projections.sagittal.maxSlices = data.shape[1];
            this.projections.coronal.maxSlices = data.shape[2];

            this.renderViewer();
            this.loadProjections();
        } catch (error) {
            console.error('Load error:', error);
            this.showError(`Errore: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    renderViewer() {
        const viewerContent = document.getElementById('viewerContent');
        viewerContent.innerHTML = '';

        const projectionNames = ['axial', 'sagittal', 'coronal'];
        const titles = ['Trasversale (Axial)', 'Sagittale (Sagittal)', 'Coronale (Coronal)'];

        // Render first 2 projections (axial and sagittal)
        projectionNames.slice(0, 2).forEach((projName, idx) => {
            const container = document.createElement('div');
            container.className = 'projection-container';

            const header = document.createElement('div');
            header.className = 'projection-header';

            const title = document.createElement('div');
            title.className = 'projection-title';
            title.textContent = titles[idx];

            const controls = document.createElement('div');
            controls.className = 'projection-controls';

            // Slider
            const sliderContainer = document.createElement('div');
            sliderContainer.className = 'slider-container';

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'slider';
            slider.min = '0';
            slider.max = this.projections[projName].maxSlices - 1;
            slider.value = '0';

            const sliceLabel = document.createElement('div');
            sliceLabel.className = 'slice-label';
            sliceLabel.textContent = `0 / ${this.projections[projName].maxSlices - 1}`;

            slider.addEventListener('input', (e) => {
                const idx = parseInt(e.target.value);
                this.projections[projName].sliceIdx = idx;
                sliceLabel.textContent = `${idx} / ${this.projections[projName].maxSlices - 1}`;
                this.loadProjection(projName);
            });

            sliderContainer.appendChild(slider);
            sliderContainer.appendChild(sliceLabel);

            // Contrast button
            const contrastBtn = document.createElement('button');
            contrastBtn.className = 'btn';
            contrastBtn.textContent = 'Contrasto';
            contrastBtn.addEventListener('click', () => {
                this.adjustingContrast[projName] = !this.adjustingContrast[projName];
                contrastBtn.classList.toggle('active');
                const canvas = this.projections[projName].canvas;
                if (canvas) {
                    if (this.adjustingContrast[projName]) {
                        canvas.style.cursor = 'crosshair';
                    } else {
                        canvas.style.cursor = 'grab';
                    }
                }
            });

            controls.appendChild(sliderContainer);
            controls.appendChild(contrastBtn);

            header.appendChild(title);
            header.appendChild(controls);

            // Canvas
            const canvas = document.createElement('canvas');
            canvas.className = 'projection-image';
            this.projections[projName].canvas = canvas;
            this.projections[projName].ctx = canvas.getContext('2d');

            // Mouse events for panning and zooming
            canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                this.projections[projName].zoom *= delta;
                this.projections[projName].zoom = Math.max(0.5, Math.min(5, this.projections[projName].zoom));
                this.loadProjection(projName);
            });

            canvas.addEventListener('mousedown', (e) => {
                if (this.selectingROI[projName]) return; // Disable pan during ROI selection

                if (this.adjustingContrast[projName]) {
                    this.contrastAdjusting[projName] = true;
                    this.contrastStart = { x: e.clientX, y: e.clientY };
                } else {
                    this.dragStart[projName] = { x: e.clientX, y: e.clientY };
                }
            });

            canvas.addEventListener('mousemove', (e) => {
                if (this.selectingROI[projName]) return; // Disable pan during ROI selection

                if (this.contrastAdjusting[projName]) {
                    this.adjustContrast(projName, e);
                } else if (this.dragStart[projName]) {
                    const dx = e.clientX - this.dragStart[projName].x;
                    const dy = e.clientY - this.dragStart[projName].y;
                    this.projections[projName].panX += dx;
                    this.projections[projName].panY += dy;
                    this.dragStart[projName] = { x: e.clientX, y: e.clientY };
                    this.loadProjection(projName);
                }
            });

            canvas.addEventListener('mouseup', () => {
                this.dragStart[projName] = null;
                this.contrastAdjusting[projName] = false;
            });

            canvas.addEventListener('mouseleave', () => {
                this.dragStart[projName] = null;
                this.contrastAdjusting[projName] = false;
            });

            // Right-click context menu
            canvas.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(e, projName);
            });

            container.appendChild(header);
            container.appendChild(canvas);
            viewerContent.appendChild(container);
        });

        // Add coronal projection (bottom left)
        const coronalName = 'coronal';
        const coronalContainer = document.createElement('div');
        coronalContainer.className = 'projection-container';

        const coronalHeader = document.createElement('div');
        coronalHeader.className = 'projection-header';

        const coronalTitle = document.createElement('div');
        coronalTitle.className = 'projection-title';
        coronalTitle.textContent = titles[2];

        const coronalControls = document.createElement('div');
        coronalControls.className = 'projection-controls';

        const coronalSliderContainer = document.createElement('div');
        coronalSliderContainer.className = 'slider-container';

        const coronalSlider = document.createElement('input');
        coronalSlider.type = 'range';
        coronalSlider.className = 'slider';
        coronalSlider.min = '0';
        coronalSlider.max = this.projections[coronalName].maxSlices - 1;
        coronalSlider.value = '0';

        const coronalSliceLabel = document.createElement('div');
        coronalSliceLabel.className = 'slice-label';
        coronalSliceLabel.textContent = `0 / ${this.projections[coronalName].maxSlices - 1}`;

        coronalSlider.addEventListener('input', (e) => {
            const idx = parseInt(e.target.value);
            this.projections[coronalName].sliceIdx = idx;
            coronalSliceLabel.textContent = `${idx} / ${this.projections[coronalName].maxSlices - 1}`;
            this.loadProjection(coronalName);
        });

        coronalSliderContainer.appendChild(coronalSlider);
        coronalSliderContainer.appendChild(coronalSliceLabel);

        const coronalContrastBtn = document.createElement('button');
        coronalContrastBtn.className = 'btn';
        coronalContrastBtn.textContent = 'Contrasto';
        coronalContrastBtn.addEventListener('click', () => {
            this.adjustingContrast[coronalName] = !this.adjustingContrast[coronalName];
            coronalContrastBtn.classList.toggle('active');
            const canvas = this.projections[coronalName].canvas;
            if (canvas) {
                if (this.adjustingContrast[coronalName]) {
                    canvas.style.cursor = 'crosshair';
                } else {
                    canvas.style.cursor = 'grab';
                }
            }
        });

        coronalControls.appendChild(coronalSliderContainer);
        coronalControls.appendChild(coronalContrastBtn);

        coronalHeader.appendChild(coronalTitle);
        coronalHeader.appendChild(coronalControls);

        const coronalCanvas = document.createElement('canvas');
        coronalCanvas.className = 'projection-image';
        this.projections[coronalName].canvas = coronalCanvas;
        this.projections[coronalName].ctx = coronalCanvas.getContext('2d');

        // Mouse events for coronal
        coronalCanvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.projections[coronalName].zoom *= delta;
            this.projections[coronalName].zoom = Math.max(0.5, Math.min(5, this.projections[coronalName].zoom));
            this.loadProjection(coronalName);
        });

        coronalCanvas.addEventListener('mousedown', (e) => {
            if (this.selectingROI[coronalName]) return;
            if (this.adjustingContrast[coronalName]) {
                this.contrastAdjusting[coronalName] = true;
                this.contrastStart = { x: e.clientX, y: e.clientY };
            } else {
                this.dragStart[coronalName] = { x: e.clientX, y: e.clientY };
            }
        });

        coronalCanvas.addEventListener('mousemove', (e) => {
            if (this.selectingROI[coronalName]) return;
            if (this.contrastAdjusting[coronalName]) {
                this.adjustContrast(coronalName, e);
            } else if (this.dragStart[coronalName]) {
                const dx = e.clientX - this.dragStart[coronalName].x;
                const dy = e.clientY - this.dragStart[coronalName].y;
                this.projections[coronalName].panX += dx;
                this.projections[coronalName].panY += dy;
                this.dragStart[coronalName] = { x: e.clientX, y: e.clientY };
                this.loadProjection(coronalName);
            }
        });

        coronalCanvas.addEventListener('mouseup', () => {
            this.dragStart[coronalName] = null;
            this.contrastAdjusting[coronalName] = false;
        });

        coronalCanvas.addEventListener('mouseleave', () => {
            this.dragStart[coronalName] = null;
            this.contrastAdjusting[coronalName] = false;
        });

        coronalCanvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, coronalName);
        });

        coronalContainer.appendChild(coronalHeader);
        coronalContainer.appendChild(coronalCanvas);
        viewerContent.appendChild(coronalContainer);

        // Add analysis panel (bottom right)
        const analysisContainer = document.createElement('div');
        analysisContainer.className = 'projection-container';

        const analysisHeader = document.createElement('div');
        analysisHeader.className = 'projection-header';

        const analysisTitle = document.createElement('div');
        analysisTitle.className = 'projection-title';
        analysisTitle.textContent = 'Profilo Gaussiano';

        analysisHeader.appendChild(analysisTitle);

        const analysisPlot = document.createElement('div');
        analysisPlot.className = 'analysis-plot';

        this.analysisCanvas = document.createElement('canvas');
        analysisPlot.appendChild(this.analysisCanvas);

        analysisContainer.appendChild(analysisHeader);
        analysisContainer.appendChild(analysisPlot);
        viewerContent.appendChild(analysisContainer);

        // Add ResizeObserver to handle resizing
        const resizeObserver = new ResizeObserver(() => {
            if (this.lastAnalysisData) {
                if (this.lastAnalysisType === 'gaussian') {
                    this.plotGaussianProfile(this.lastAnalysisData);
                } else if (this.lastAnalysisType === 'mtf') {
                    this.plotMTF(this.lastAnalysisData);
                }
            }
        });
        resizeObserver.observe(analysisPlot);
    }

    showContextMenu(e, projName) {
        // Remove existing menu
        const existing = document.querySelector('.context-menu');
        if (existing) existing.remove();

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';

        const gaussianItem = document.createElement('div');
        gaussianItem.className = 'context-menu-item';
        gaussianItem.textContent = 'Gaussian Profile';
        gaussianItem.addEventListener('click', () => {
            this.startROISelection(projName, 'gaussian');
            menu.remove();
        });

        const mtfItem = document.createElement('div');
        mtfItem.className = 'context-menu-item';
        mtfItem.textContent = 'MTF Analysis';
        mtfItem.addEventListener('click', () => {
            this.startROISelection(projName, 'mtf');
            menu.remove();
        });

        menu.appendChild(gaussianItem);
        menu.appendChild(mtfItem);
        document.body.appendChild(menu);

        // Close menu on click outside
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 0);
    }

    startROISelection(projName, analysisType = 'gaussian') {
        this.selectingROI[projName] = true;
        this.currentAnalysisProj = projName;
        this.currentAnalysisType = analysisType;
        const canvas = this.projections[projName].canvas;
        canvas.style.cursor = 'crosshair';

        let isDrawing = false;

        const handleMouseDown = (e) => {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            this.roiStart[projName] = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        const handleMouseMove = (e) => {
            if (!isDrawing || !this.roiStart[projName]) return;

            const rect = canvas.getBoundingClientRect();
            const currentPos = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };

            if (analysisType === 'gaussian') {
                // Redraw the projection with ROI rectangle
                this.redrawProjectionWithROI(projName, this.roiStart[projName], currentPos);
            } else if (analysisType === 'mtf') {
                // Redraw the projection with line
                this.redrawProjectionWithLine(projName, this.roiStart[projName], currentPos);
            }
        };

        const handleMouseUp = (e) => {
            if (!isDrawing || !this.roiStart[projName]) return;

            isDrawing = false;
            const rect = canvas.getBoundingClientRect();
            const roiEnd = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };

            if (analysisType === 'gaussian') {
                this.performGaussianAnalysis(projName, this.roiStart[projName], roiEnd);
            } else if (analysisType === 'mtf') {
                this.performMTFAnalysis(projName, this.roiStart[projName], roiEnd);
            }

            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);

            // Reload projection to remove ROI
            this.loadProjection(projName);

            canvas.style.cursor = 'grab';
            this.selectingROI[projName] = false;
            this.roiStart[projName] = null;
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
    }

    redrawProjectionWithLine(projName, lineStart, lineEnd) {
        const proj = this.projections[projName];
        const canvas = proj.canvas;
        const ctx = proj.ctx;

        // Redraw the current projection
        const cacheKey = `${projName}-${proj.sliceIdx}-${proj.windowCenter}-${proj.windowWidth}`;
        const imageData = this.imageCache[cacheKey];

        if (imageData) {
            const img = new Image();
            img.onload = () => {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;

                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const scaledWidth = imageData.shape[1] * proj.zoom;
                const scaledHeight = imageData.shape[0] * proj.zoom;

                const x = (canvas.width - scaledWidth) / 2 + proj.panX;
                const y = (canvas.height - scaledHeight) / 2 + proj.panY;

                ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

                // Draw line
                ctx.strokeStyle = '#ff00ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(lineStart.x, lineStart.y);
                ctx.lineTo(lineEnd.x, lineEnd.y);
                ctx.stroke();

                // Draw endpoints
                ctx.fillStyle = '#ff00ff';
                ctx.beginPath();
                ctx.arc(lineStart.x, lineStart.y, 4, 0, 2 * Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(lineEnd.x, lineEnd.y, 4, 0, 2 * Math.PI);
                ctx.fill();
            };
            img.src = imageData.image;
        }
    }

    redrawProjectionWithROI(projName, roiStart, roiEnd) {
        const proj = this.projections[projName];
        const canvas = proj.canvas;
        const ctx = proj.ctx;

        // Redraw the current projection
        const cacheKey = `${projName}-${proj.sliceIdx}-${proj.windowCenter}-${proj.windowWidth}`;
        const imageData = this.imageCache[cacheKey];

        if (imageData) {
            const img = new Image();
            img.onload = () => {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;

                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const scaledWidth = img.width * proj.zoom;
                const scaledHeight = img.height * proj.zoom;

                const x = (canvas.width - scaledWidth) / 2 + proj.panX;
                const y = (canvas.height - scaledHeight) / 2 + proj.panY;

                ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

                // Draw ROI rectangle
                const x1 = Math.min(roiStart.x, roiEnd.x);
                const y1 = Math.min(roiStart.y, roiEnd.y);
                const width = Math.abs(roiEnd.x - roiStart.x);
                const height = Math.abs(roiEnd.y - roiStart.y);

                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.strokeRect(x1, y1, width, height);

                // Fill with semi-transparent green
                ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
                ctx.fillRect(x1, y1, width, height);
            };
            img.src = imageData.image;
        }
    }

    async performMTFAnalysis(projName, lineStart, lineEnd) {
        try {
            const proj = this.projections[projName];
            const canvas = proj.canvas;

            // Get the current image to determine its displayed size
            const cacheKey = `${projName}-${proj.sliceIdx}-${proj.windowCenter}-${proj.windowWidth}`;
            const imageData = this.imageCache[cacheKey];

            if (!imageData) {
                throw new Error('Image data not found');
            }

            // Calculate the transformation from canvas to image coordinates
            const scaledWidth = imageData.shape[1] * proj.zoom;
            const scaledHeight = imageData.shape[0] * proj.zoom;
            const displayX = (canvas.width - scaledWidth) / 2 + proj.panX;
            const displayY = (canvas.height - scaledHeight) / 2 + proj.panY;

            // Convert canvas coordinates to image coordinates
            const toImageX = (canvasX) => (canvasX - displayX) / proj.zoom;
            const toImageY = (canvasY) => (canvasY - displayY) / proj.zoom;

            const response = await fetch('/api/mtf-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cache_id: this.currentCacheId,
                    projection: projName,
                    slice_idx: this.projections[projName].sliceIdx,
                    roi: {
                        x1: Math.round(toImageX(lineStart.x)),
                        y1: Math.round(toImageY(lineStart.y)),
                        x2: Math.round(toImageX(lineEnd.x)),
                        y2: Math.round(toImageY(lineEnd.y))
                    }
                })
            });

            if (!response.ok) throw new Error('MTF analysis failed');
            const data = await response.json();

            this.lastAnalysisData = data;
            this.lastAnalysisType = 'mtf';
            this.plotMTF(data);
        } catch (error) {
            console.error('MTF analysis error:', error);
        }
    }

    async performGaussianAnalysis(projName, roiStart, roiEnd) {
        try {
            const proj = this.projections[projName];
            const canvas = proj.canvas;

            // Get the current image to determine its displayed size
            const cacheKey = `${projName}-${proj.sliceIdx}-${proj.windowCenter}-${proj.windowWidth}`;
            const imageData = this.imageCache[cacheKey];

            if (!imageData) {
                throw new Error('Image data not found');
            }

            // Calculate the transformation from canvas to image coordinates
            const scaledWidth = imageData.shape[1] * proj.zoom;
            const scaledHeight = imageData.shape[0] * proj.zoom;
            const displayX = (canvas.width - scaledWidth) / 2 + proj.panX;
            const displayY = (canvas.height - scaledHeight) / 2 + proj.panY;

            // Convert canvas coordinates to image coordinates
            const toImageX = (canvasX) => (canvasX - displayX) / proj.zoom;
            const toImageY = (canvasY) => (canvasY - displayY) / proj.zoom;

            const response = await fetch('/api/gaussian-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cache_id: this.currentCacheId,
                    projection: projName,
                    slice_idx: this.projections[projName].sliceIdx,
                    roi: {
                        x1: Math.round(toImageX(Math.min(roiStart.x, roiEnd.x))),
                        y1: Math.round(toImageY(Math.min(roiStart.y, roiEnd.y))),
                        x2: Math.round(toImageX(Math.max(roiStart.x, roiEnd.x))),
                        y2: Math.round(toImageY(Math.max(roiStart.y, roiEnd.y)))
                    }
                })
            });

            if (!response.ok) throw new Error('Analysis failed');
            const data = await response.json();

            this.lastAnalysisData = data;
            this.lastAnalysisType = 'gaussian';
            this.plotGaussianProfile(data);
        } catch (error) {
            console.error('Analysis error:', error);
        }
    }

    plotGaussianProfile(data) {
        const canvas = this.analysisCanvas;
        const ctx = canvas.getContext('2d');
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        canvas.width = width;
        canvas.height = height;

        // Clear canvas
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, width, height);

        if (width === 0 || height === 0) return;

        // Draw axes
        const padding = 40;
        const plotWidth = width - 2 * padding;
        const plotHeight = height - 2 * padding;

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Plot data points
        const xData = data.x_data;
        const yData = data.y_data;
        const yFit = data.y_fit;

        if (!xData || xData.length === 0) return;

        const minX = Math.min(...xData);
        const maxX = Math.max(...xData);
        const minY = Math.min(...yData);
        const maxY = Math.max(...yData);

        const xRange = maxX - minX || 1;
        const yRange = maxY - minY || 1;

        const xScale = plotWidth / xRange;
        const yScale = plotHeight / yRange;

        // Draw raw data points
        ctx.fillStyle = '#3b82f6';
        xData.forEach((x, i) => {
            const px = padding + (x - minX) * xScale;
            const py = height - padding - (yData[i] - minY) * yScale;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, 2 * Math.PI);
            ctx.fill();
        });

        // Draw fit line
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        xData.forEach((x, i) => {
            const px = padding + (x - minX) * xScale;
            const py = height - padding - (yFit[i] - minY) * yScale;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });
        ctx.stroke();

        // Add axes labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';

        // X-axis labels (Pixel Position)
        const numXTicks = 5;
        for (let i = 0; i <= numXTicks; i++) {
            const x = padding + (i / numXTicks) * plotWidth;
            const val = minX + (i / numXTicks) * (maxX - minX);
            ctx.fillText(Math.round(val).toString(), x, height - padding + 15);

            // Grid line
            ctx.strokeStyle = '#334155';
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
        }
        ctx.fillText('Position (pixels)', width / 2, height - 5);

        // Y-axis labels (Intensity)
        ctx.textAlign = 'right';
        const numYTicks = 5;
        for (let i = 0; i <= numYTicks; i++) {
            const y = height - padding - (i / numYTicks) * plotHeight;
            const val = minY + (i / numYTicks) * (maxY - minY);
            ctx.fillText(Math.round(val).toString(), padding - 5, y + 3);

            // Grid line
            ctx.strokeStyle = '#334155';
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('Intensity', 0, 0);
        ctx.restore();

        // Add text info - Positioned at top right to avoid overflow
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        const infoX = width - padding - 10;
        const infoY = padding + 20;
        const lineHeight = 15;

        ctx.fillText(`FWHM: ${data.fwhm.toFixed(2)} mm`, infoX, infoY);
        ctx.fillText(`Center: ${data.center.toFixed(2)}`, infoX, infoY + lineHeight);
        ctx.fillText(`R²: ${data.r_squared.toFixed(4)}`, infoX, infoY + lineHeight * 2);
    }

    plotMTF(data) {
        const canvas = this.analysisCanvas;
        const ctx = canvas.getContext('2d');
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        canvas.width = width;
        canvas.height = height;

        // Clear canvas
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, width, height);

        // Draw axes
        const padding = 40;
        const plotWidth = width - 2 * padding;
        const plotHeight = height - 2 * padding;

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Plot MTF curve
        const frequencies = data.frequencies;
        const mtf = data.mtf;

        if (!mtf || mtf.length < 2) return;

        // Draw MTF curve (cyan)
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < mtf.length; i++) {
            const x = padding + (i / (mtf.length - 1)) * plotWidth;
            const y = height - padding - mtf[i] * plotHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Add axes labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';

        // X-axis labels (Frequency)
        const numXTicks = 5;
        for (let i = 0; i <= numXTicks; i++) {
            const x = padding + (i / numXTicks) * plotWidth;
            const freqIndex = Math.round((i / numXTicks) * (frequencies.length - 1));
            const freqVal = frequencies[freqIndex];
            ctx.fillText(freqVal.toFixed(2), x, height - padding + 15);

            // Grid line
            ctx.strokeStyle = '#334155';
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
        }
        ctx.fillText('Frequency (cycles/pixel)', width / 2, height - 5);

        // Y-axis labels (MTF)
        ctx.textAlign = 'right';
        const numYTicks = 5;
        for (let i = 0; i <= numYTicks; i++) {
            const y = height - padding - (i / numYTicks) * plotHeight;
            const val = i / numYTicks;
            ctx.fillText(val.toFixed(1), padding - 5, y + 3);

            // Grid line
            ctx.strokeStyle = '#334155';
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('MTF', 0, 0);
        ctx.restore();

        // Helper to find approximate index where MTF crosses a target value
        const findIndexAtMTF = (targetMTF) => {
            for (let i = 1; i < mtf.length; i++) {
                const prev = mtf[i - 1];
                const curr = mtf[i];
                if ((prev >= targetMTF && curr <= targetMTF) || (prev <= targetMTF && curr >= targetMTF)) {
                    const t = (targetMTF - prev) / (curr - prev || 1e-6);
                    return (i - 1) + Math.max(0, Math.min(1, t));
                }
            }
            return null;
        };

        // Highlight MTF = 0.5 and 0.1
        const targets = [0.5, 0.1];
        const colors = ['#fbbf24', '#f87171'];

        targets.forEach((target, idx) => {
            const fracIndex = findIndexAtMTF(target);
            if (fracIndex === null) return;

            const x = padding + (fracIndex / (mtf.length - 1)) * plotWidth;
            const freqPos = Math.round(fracIndex);
            const freqVal = frequencies[Math.max(0, Math.min(frequencies.length - 1, freqPos))];

            // Vertical dashed line
            ctx.strokeStyle = colors[idx];
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
            ctx.setLineDash([]);

            // Label above / below
            ctx.fillStyle = colors[idx];
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            const label = `MTF=${target.toFixed(1)}: ${freqVal.toFixed(3)}`;
            const textY = idx === 0 ? padding - 5 : padding + 15;
            ctx.fillText(label, x, textY);
        });

        // Draw legend
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('● MTF (Modulation Transfer Function)', padding + 10, padding - 30);
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('─ ─ MTF = 0.5', padding + 10, padding - 15);
        ctx.fillStyle = '#f87171';
        ctx.fillText('─ ─ MTF = 0.1', padding + 140, padding - 15);
    }

    adjustContrast(projName, e) {
        if (!this.contrastStart || !this.contrastAdjusting[projName]) return;

        const dx = e.clientX - this.contrastStart.x;
        const dy = e.clientY - this.contrastStart.y;

        // Adjust window center (horizontal) and width (vertical)
        this.projections[projName].windowCenter += dx * 2;
        this.projections[projName].windowWidth += dy * 2;
        this.projections[projName].windowWidth = Math.max(1, this.projections[projName].windowWidth);

        this.contrastStart = { x: e.clientX, y: e.clientY };
        this.loadProjection(projName);
    }

    async loadProjections() {
        await Promise.all([
            this.loadProjection('axial'),
            this.loadProjection('sagittal'),
            this.loadProjection('coronal')
        ]);
    }

    async loadProjection(projName) {
        if (!this.currentCacheId) return;

        const proj = this.projections[projName];
        const cacheKey = `${projName}-${proj.sliceIdx}-${proj.windowCenter}-${proj.windowWidth}`;

        try {
            let imageData;
            if (this.imageCache[cacheKey]) {
                imageData = this.imageCache[cacheKey];
            } else {
                const response = await fetch('/api/get-projection', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cache_id: this.currentCacheId,
                        projection: projName,
                        slice_idx: proj.sliceIdx,
                        window_center: proj.windowCenter,
                        window_width: proj.windowWidth
                    })
                });

                if (!response.ok) throw new Error('Failed to load projection');
                imageData = await response.json();
                this.imageCache[cacheKey] = imageData;
            }

            this.renderProjection(projName, imageData.image);
        } catch (error) {
            console.error(`Error loading ${projName}:`, error);
        }
    }

    renderProjection(projName, imageDataUrl) {
        const proj = this.projections[projName];
        const canvas = proj.canvas;
        const ctx = proj.ctx;

        const img = new Image();
        img.onload = () => {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;

            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const scaledWidth = img.width * proj.zoom;
            const scaledHeight = img.height * proj.zoom;

            const x = (canvas.width - scaledWidth) / 2 + proj.panX;
            const y = (canvas.height - scaledHeight) / 2 + proj.panY;

            ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        };
        img.src = imageDataUrl;
    }

    showLoading(show) {
        const indicator = document.getElementById('loadingIndicator');
        indicator.style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        const viewerContent = document.getElementById('viewerContent');
        viewerContent.innerHTML = `<div class="error" style="grid-column: 1 / -1;">${message}</div>`;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new DicomViewer();
});
