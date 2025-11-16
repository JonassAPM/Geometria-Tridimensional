class WebGLApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.surface = null;
        this.surfaceGenerator = null;
        this.uiControls = null;
        
        this.currentSurface = 'paraboloid';
        this.resolution = 60;
        this.scale = 1;
        this.domainX = 3.5;
        this.domainY = 3.5;
        this.wireframe = false;
        this.autoRotate = false;
        this.showAxes = true;
        
        this.clock = new THREE.Clock();
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        
        this.axesHelper = null;
        this.gridHelper = null;
        
        this.isMobile = false;
        this.isPortrait = false;
        
        this.init();
    }

    setupMobileOptimizations() {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.isPortrait = window.innerHeight > window.innerWidth;
        
        window.addEventListener('resize', () => {
            const wasPortrait = this.isPortrait;
            this.isPortrait = window.innerHeight > window.innerWidth;
            
            if (wasPortrait !== this.isPortrait) {
                setTimeout(() => {
                    this.onWindowResize();
                    this.autoFrameSurface();
                }, 300);
            }
        });
    }

    onWindowResize() {
        setTimeout(() => {
            this.forceFullResize();
        }, 0);
    }

    setupCanvasForMobile() {
        const canvas = this.renderer.domElement;
        const container = document.getElementById('canvasContainer');
        
        if (this.isMobile) {
            this.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio));
            
            canvas.style.touchAction = 'none';
            canvas.style.webkitTapHighlightColor = 'transparent';
            
            const preventZoom = (e) => {
                if (e.touches.length > 1) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            };
            
            canvas.addEventListener('touchstart', preventZoom, { passive: false });
            canvas.addEventListener('touchmove', preventZoom, { passive: false });
            canvas.addEventListener('touchend', preventZoom, { passive: false });
            
            window.addEventListener('orientationchange', () => {
                console.log('Cambio de orientación detectado');
                setTimeout(() => {
                    this.forceResize();
                }, 100);
            });
        }
    }

    forceResize() {
        const container = document.getElementById('canvasContainer');
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        console.log('Forzando redimensionamiento:', width, 'x', height);
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
        
        if (document.fullscreenElement) {
            this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    debouncedResize() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(() => {
            this.onWindowResize();
        }, 250);
    }

    init() {
        this.initThreeJS();
        this.setupMobileOptimizations();
        this.setupCanvasForMobile();
        this.surfaceGenerator = new SurfaceGenerator();
        this.uiControls = new UIControls(this);
        
        setTimeout(() => {
            this.forceResize();
            this.createSurface(); 
        }, 100);
        
        this.animate();
        
        document.getElementById('loading').style.display = 'none';
    }

    initThreeJS() {
        this.scene = new THREE.Scene();
        this.updateSceneBackground();
        
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        
        const canvas = document.getElementById('webglCanvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas, 
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        this.setupHelpers();
        
        window.addEventListener('resize', () => this.onWindowResize());
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }

    setupFullscreenHandling() {
        document.addEventListener('fullscreenchange', () => {
            this.handleFullscreenChange();
        });
        
        document.addEventListener('webkitfullscreenchange', () => {
            this.handleFullscreenChange();
        });
        
        document.addEventListener('mozfullscreenchange', () => {
            this.handleFullscreenChange();
        });
        
        document.addEventListener('MSFullscreenChange', () => {
            this.handleFullscreenChange();
        });
    }

    handleFullscreenChange() {
        console.log('Estado de pantalla completa cambiado:', !!document.fullscreenElement);
        
        requestAnimationFrame(() => {
            this.forceFullResize();
            
            if (this.controls) {
                this.controls.handleResize();
            }
        });
    }

    forceFullResize() {
        const container = document.getElementById('canvasContainer');
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        console.log('Nuevas dimensiones del contenedor:', width, 'x', height);
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height, false);
        
        const pixelRatio = document.fullscreenElement ? 
            Math.min(2, window.devicePixelRatio) : 
            window.devicePixelRatio;
        this.renderer.setPixelRatio(pixelRatio);
        
        this.renderer.render(this.scene, this.camera);
        
        console.log('Canvas redimensionado a:', width, 'x', height);
    }

    takeScreenshot() {
        this.renderer.render(this.scene, this.camera);
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const webGLCanvas = this.renderer.domElement;
        
        canvas.width = webGLCanvas.width;
        canvas.height = webGLCanvas.height + 250; 
        
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.drawImage(webGLCanvas, 0, 0, webGLCanvas.width, webGLCanvas.height);
        
        const panelStartY = webGLCanvas.height;
        const panelHeight = 250;
        
        const boundingBox = new THREE.Box3().setFromObject(this.surface);
        const size = boundingBox.getSize(new THREE.Vector3());
        const vertexCount = this.surface.geometry.attributes.position.count;
        const triangleCount = this.surface.geometry.index ? 
            this.surface.geometry.index.count / 3 : 
            this.surface.geometry.attributes.position.count / 3;
        
        const equation = document.getElementById('equation').textContent;
        const description = document.getElementById('equationDesc').textContent;
        
        const panelWidth = canvas.width / 2;
        const leftPanelX = 0;
        const rightPanelX = panelWidth;
        const contentPadding = 40;
        
        context.fillStyle = '#f8f9fa';
        context.fillRect(leftPanelX, panelStartY, panelWidth, panelHeight);
        context.fillStyle = '#e9ecef';
        context.fillRect(rightPanelX, panelStartY, panelWidth, panelHeight);
        
        context.strokeStyle = '#dee2e6';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(panelWidth, panelStartY);
        context.lineTo(panelWidth, panelStartY + panelHeight);
        context.stroke();
        
        context.fillStyle = '#000000';
        context.textAlign = 'left';
        
        let currentY = panelStartY + contentPadding;
        
        context.font = 'bold 18px Arial';
        context.fillText('INFORMACIÓN DE LA SUPERFICIE', contentPadding, currentY);
        currentY += 30;
        
        context.font = '14px Arial';
        context.fillText(`Tipo: ${this.getSurfaceName(this.currentSurface)}`, contentPadding, currentY);
        currentY += 25;
        
        context.fillText(`Ecuación:`, contentPadding, currentY);
        currentY += 20;
        
        context.fillStyle = '#007bff';
        context.font = 'bold 16px Arial';
        context.fillText(equation, contentPadding + 10, currentY);
        currentY += 30;
        
        context.fillStyle = '#000000';
        context.font = '14px Arial';
        context.fillText(`Descripción:`, contentPadding, currentY);
        currentY += 20;
        
        const descLines = this.wrapText(context, description, panelWidth - (contentPadding * 2), '14px Arial');
        descLines.forEach((line, index) => {
            context.fillText(line, contentPadding + 10, currentY + (index * 18));
        });
        
        currentY = panelStartY + contentPadding;
        
        context.font = 'bold 18px Arial';
        context.fillText('DATOS TÉCNICOS', rightPanelX + contentPadding, currentY);
        currentY += 30;
        
        context.font = 'bold 14px Arial';
        context.fillText('DIMENSIONES', rightPanelX + contentPadding, currentY);
        currentY += 25;
        
        context.font = '14px Arial';
        context.fillText(`Ancho (X): ${size.x.toFixed(2)} unidades`, rightPanelX + contentPadding, currentY);
        currentY += 20;
        context.fillText(`Alto (Y): ${size.y.toFixed(2)} unidades`, rightPanelX + contentPadding, currentY);
        currentY += 20;
        context.fillText(`Profundidad (Z): ${size.z.toFixed(2)} unidades`, rightPanelX + contentPadding, currentY);
        currentY += 30;
        
        context.font = 'bold 14px Arial';
        context.fillText('GEOMETRÍA', rightPanelX + contentPadding, currentY);
        currentY += 25;
        
        context.font = '14px Arial';
        context.fillText(`Vértices: ${vertexCount.toLocaleString()}`, rightPanelX + contentPadding, currentY);
        currentY += 20;
        context.fillText(`Triángulos: ${triangleCount.toLocaleString()}`, rightPanelX + contentPadding, currentY);
        currentY += 20;
        context.fillText(`Resolución: ${this.resolution}`, rightPanelX + contentPadding, currentY);
        currentY += 40;
        
        context.font = '12px Arial';
        context.fillStyle = '#6c757d';
        context.textAlign = 'right';
        context.fillText(`Generado: ${new Date().toLocaleString()}`, canvas.width - contentPadding, panelStartY + panelHeight - 15);
        
        const dataURL = canvas.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.download = `superficie-3d-${this.currentSurface}-${new Date().getTime()}.png`;
        link.href = dataURL;
        link.click();
    }

    wrapText(context, text, maxWidth, font) {
        const previousFont = context.font;
        context.font = font;
        
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = context.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        
        context.font = previousFont;
        return lines;
    }

    getSurfaceName(surfaceType) {
        const names = {
            'paraboloid': 'Paraboloide Elíptico',
            'hyperbolic': 'Paraboloide Hiperbólico',
            'sphere': 'Esfera',
            'cylinder': 'Cilindro',
            'cone': 'Cono',
            'torus': 'Toro',
            'helicoid': 'Helicoide',
            'hyperboloid1': 'Hiperboloide 1 Hoja',
            'monkey': 'Superficie de Silla de Mono',
            'sinc': 'Función Sinc',
            'ripple': 'Superficie de Ondas',
            'gaussian': 'Campana Gaussiana',
            'polynomial': 'Polinomio Cúbico',
            'rational': 'Función Racional',
            'absolute': 'Función Valor Absoluto',
            'sine': 'Función Seno',
            'tangent': 'Función Tangente',
            'trigonometric': 'Función Trigonométrica',
            'custom': 'Ecuación Personalizada'
        };
        return names[surfaceType] || surfaceType;
    }

    setupHelpers() {
        if (this.axesHelper) this.scene.remove(this.axesHelper);
        
        const axesGroup = new THREE.Group();
        
        const axisLength = 3;
        const axisRadius = 0.03;
        
        const xMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const yMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const zMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        
        const xGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength, 8);
        const xAxis = new THREE.Mesh(xGeometry, xMaterial);
        xAxis.rotation.z = Math.PI / 2;
        xAxis.position.x = axisLength / 2;
        axesGroup.add(xAxis);
        
        const yGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength, 8);
        const yAxis = new THREE.Mesh(yGeometry, yMaterial);
        yAxis.position.y = axisLength / 2;
        axesGroup.add(yAxis);
        
        const zGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength, 8);
        const zAxis = new THREE.Mesh(zGeometry, zMaterial);
        zAxis.rotation.x = Math.PI / 2;
        zAxis.position.z = axisLength / 2;
        axesGroup.add(zAxis);
        
        const coneRadius = axisRadius * 2;
        const coneHeight = coneRadius * 3;
        
        const xConeGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 8);
        const xCone = new THREE.Mesh(xConeGeometry, xMaterial);
        xCone.rotation.z = -Math.PI / 2;
        xCone.position.x = axisLength;
        axesGroup.add(xCone);
        
        const yConeGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 8);
        const yCone = new THREE.Mesh(yConeGeometry, yMaterial);
        yCone.position.y = axisLength;
        axesGroup.add(yCone);
        
        const zConeGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 8);
        const zCone = new THREE.Mesh(zConeGeometry, zMaterial);
        zCone.rotation.x = Math.PI / 2;
        zCone.position.z = axisLength;
        axesGroup.add(zCone);
        
        this.createAxisLabels(axesGroup, axisLength);
        
        this.axesHelper = axesGroup;
        this.scene.add(this.axesHelper);
        
        this.createNumberedGrid();
    }

    createNumberedGrid() {
        if (this.gridHelper) this.scene.remove(this.gridHelper);
        if (this.gridNumbers) this.scene.remove(this.gridNumbers);
        if (this.heightScale) this.scene.remove(this.heightScale);
        
        const gridSize = 20;
        const divisions = 20;
        const gridColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--grid-color').trim();
        const gridColorHex = parseInt(gridColor.replace('#', ''), 16);
        
        this.gridHelper = new THREE.GridHelper(gridSize, divisions, gridColorHex, gridColorHex);
        this.gridHelper.position.y = 0;
        this.scene.add(this.gridHelper);
        
        this.gridNumbers = new THREE.Group();
        
        const numberSize = 0.6;
        const numberDistance = gridSize / 2 + 0.5;
        
        for (let i = -divisions/2; i <= divisions/2; i++) {
            if (i === 0) continue;
            
            const value = i * (gridSize / divisions);
            
            this.createGridNumber(value.toString(), 
                new THREE.Vector3(value, 0, numberDistance), 
                numberSize, 
                0xffffff);
            
            this.createGridNumber(value.toString(), 
                new THREE.Vector3(numberDistance, 0, value), 
                numberSize, 
                0xffffff);
        }
        
        this.createGridNumber("0", new THREE.Vector3(0, 0, numberDistance), numberSize, 0xffffff);
        this.createGridNumber("0", new THREE.Vector3(numberDistance, 0, 0), numberSize, 0xffffff);
        
        this.createGridNumber("X", new THREE.Vector3(numberDistance + 1, 0, 0), numberSize * 1.2, 0xff0000);
        this.createGridNumber("Z", new THREE.Vector3(0, 0, numberDistance + 1), numberSize * 1.2, 0x0000ff);
        
        this.scene.add(this.gridNumbers);
        
        this.createAxisMarks();
        
        this.createHeightScale();
    }

    createHeightScale() {
        this.heightScale = new THREE.Group();
        
        const gridSize = 20;
        const maxHeight = 25; 
        const scalePosition = -gridSize / 2 - 1; 
        
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ff00, 
            linewidth: 2
        });
        
        const lineGeometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            0, 0, scalePosition,          
            0, maxHeight, scalePosition   
        ]);
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        
        const verticalLine = new THREE.Line(lineGeometry, lineMaterial);
        this.heightScale.add(verticalLine);
        
        const markMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        
        for (let y = 0; y <= maxHeight; y++) {
            const markGeometry = new THREE.BoxGeometry(0.3, 0.02, 0.02);
            const mark = new THREE.Mesh(markGeometry, markMaterial);
            mark.position.set(0, y, scalePosition);
            this.heightScale.add(mark);
            
            if (y > 0) {
                this.createHeightNumber(y.toString(), 
                    new THREE.Vector3(-0.5, y, scalePosition), 
                    0.25, 
                    0x00ff00);
            }
        }
        
        this.createHeightNumber("Y", 
            new THREE.Vector3(-0.8, maxHeight + 0.5, scalePosition), 
            0.3, 
            0x00ff00);
        
        this.scene.add(this.heightScale);
    }

    createHeightNumber(text, position, size, color) {
        const gridTextColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--grid-text-color').trim();
        const textColorHex = parseInt(gridTextColor.replace('#', ''), 16);
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;
        
        context.fillStyle = 'transparent';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = 'Bold 28px Arial';
        context.fillStyle = `#${textColorHex.toString(16).padStart(6, '0')}`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.scale.set(size, size, 1);
        
        this.heightScale.add(sprite);
    }

    updateHeightVisualization() {
        if (!this.surface || !this.heightScale) return;
        
        const boundingBox = new THREE.Box3().setFromObject(this.surface);
        const objectHeight = boundingBox.max.y - boundingBox.min.y;
        
        this.updateCurrentHeightIndicator(objectHeight);
    }

    updateCurrentHeightIndicator(height) {
        if (this.currentHeightIndicator) {
            this.heightScale.remove(this.currentHeightIndicator);
        }
        
        const gridSize = 20;
        const scalePosition = -gridSize / 2 - 1;
        
        const indicatorMaterial = new THREE.LineBasicMaterial({ 
            color: 0xff4444, 
            linewidth: 3
        });
        
        const indicatorGeometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            -0.8, height, scalePosition,  
            0.8, height, scalePosition    
        ]);
        indicatorGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        
        this.currentHeightIndicator = new THREE.Line(indicatorGeometry, indicatorMaterial);
        this.heightScale.add(this.currentHeightIndicator);
        
        this.updateCurrentHeightNumber(height);
    }

    updateCurrentHeightNumber(height) {
        if (this.currentHeightNumber) {
            this.heightScale.remove(this.currentHeightNumber);
        }
        
        const gridSize = 20;
        const scalePosition = -gridSize / 2 - 1;
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 96;
        canvas.height = 48;
        
        context.fillStyle = 'transparent';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = 'Bold 24px Arial';
        context.fillStyle = '#ff4444';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(`Alt: ${height.toFixed(1)}`, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        
        this.currentHeightNumber = new THREE.Sprite(material);
        this.currentHeightNumber.position.set(-1.5, height, scalePosition);
        this.currentHeightNumber.scale.set(0.4, 0.2, 1);
        
        this.heightScale.add(this.currentHeightNumber);
    }

    createGridNumber(text, position, size, color) {
        const gridTextColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--grid-text-color').trim();
        const textColorHex = parseInt(gridTextColor.replace('#', ''), 16);
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;
        
        context.fillStyle = 'transparent';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = 'Bold 32px Arial';
        context.fillStyle = `#${textColorHex.toString(16).padStart(6, '0')}`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.scale.set(size, size, 1);
        
        sprite.rotation.x = -Math.PI / 2;
        
        this.gridNumbers.add(sprite);
    }

    createAxisMarks() {
        const markLength = 0.2;
        const markColor = 0x888888;
        const gridSize = 20;
        const divisions = 20;
        
        const markMaterial = new THREE.MeshBasicMaterial({ color: markColor });
        
        for (let i = -divisions/2; i <= divisions/2; i++) {
            if (i === 0) continue;
            
            const x = i * (gridSize / divisions);
            
            const zMarkGeometry = new THREE.BoxGeometry(0.02, 0.02, markLength);
            const zMark = new THREE.Mesh(zMarkGeometry, markMaterial);
            zMark.position.set(x, 0.01, 0);
            this.gridNumbers.add(zMark);
            
            const xMarkGeometry = new THREE.BoxGeometry(markLength, 0.02, 0.02);
            const xMark = new THREE.Mesh(xMarkGeometry, markMaterial);
            xMark.position.set(0, 0.01, x);
            this.gridNumbers.add(xMark);
        }
    }

    createAxisLabels(axesGroup, axisLength) {
        const gridTextColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--grid-text-color').trim();
        const textColorHex = parseInt(gridTextColor.replace('#', ''), 16);
        
        const labelDistance = axisLength + 0.5;
        const labelSize = 0.6;
        
        const createLabelTexture = (text, axisColor) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 128;
            canvas.height = 128;
            
            context.fillStyle = 'transparent';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            context.font = 'Bold 96px Arial';
            context.fillStyle = `#${textColorHex.toString(16).padStart(6, '0')}`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(text, canvas.width / 2, canvas.height / 2);
            
            return new THREE.CanvasTexture(canvas);
        };
        
        const labelMaterial = new THREE.SpriteMaterial({
            map: null,
            transparent: true
        });
        
        const xLabel = new THREE.Sprite(labelMaterial.clone());
        xLabel.material.map = createLabelTexture('X', 0xff0000);
        xLabel.position.set(labelDistance, 0, 0);
        xLabel.scale.set(labelSize, labelSize, 1);
        axesGroup.add(xLabel);
        
        const yLabel = new THREE.Sprite(labelMaterial.clone());
        yLabel.material.map = createLabelTexture('Y', 0x00ff00);
        yLabel.position.set(0, labelDistance, 0);
        yLabel.scale.set(labelSize, labelSize, 1);
        axesGroup.add(yLabel);
        
        const zLabel = new THREE.Sprite(labelMaterial.clone());
        zLabel.material.map = createLabelTexture('Z', 0x0000ff);
        zLabel.position.set(0, 0, labelDistance);
        zLabel.scale.set(labelSize, labelSize, 1);
        axesGroup.add(zLabel);
    }

    updateSceneBackground() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        this.scene.background = new THREE.Color(isDarkMode ? 0x0f172a : 0xf8fafc);
        
        if (this.gridHelper) {
            const gridColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--grid-color').trim();
            const gridColorHex = parseInt(gridColor.replace('#', ''), 16);
            
            this.gridHelper.material.color.setHex(gridColorHex);
        }
        
        this.createNumberedGrid();
    }

    createSurface() {
        if (this.surface) {
            this.scene.remove(this.surface);
        }
        
        let geometryData;
        let equation = '';
        let description = '';

        switch (this.currentSurface) {
            case 'paraboloid':
                geometryData = this.surfaceGenerator.generateParaboloid(this.resolution, this.domainX, this.domainY, this.scale);
                equation = 'z = x² + y²';
                description = 'Paraboloide elíptico - Superficie cuadrática';
                break;
            case 'hyperbolic':
                geometryData = this.surfaceGenerator.generateHyperbolicParaboloid(this.resolution, this.domainX, this.domainY, this.scale);
                equation = 'z = x² - y²';
                description = 'Paraboloide hiperbólico - Silla de montar';
                break;
            case 'sphere':
                geometryData = this.surfaceGenerator.generateSphere(this.resolution, this.scale);
                equation = 'x² + y² + z² = r²';
                description = 'Esfera - Superficie de revolución';
                break;
            case 'cylinder':
                geometryData = this.surfaceGenerator.generateCylinder(this.resolution, this.scale);
                equation = 'x² + y² = r²';
                description = 'Cilindro circular - Superficie reglada';
                break;
            case 'cone':
                geometryData = this.surfaceGenerator.generateCone(this.resolution, this.scale);
                equation = 'z² = x² + y²';
                description = 'Cono circular - Superficie cónica';
                break;
            case 'torus':
                geometryData = this.surfaceGenerator.generateTorus(this.resolution, this.scale);
                equation = '(R - √(x²+y²))² + z² = r²';
                description = 'Toro - Superficie de revolución';
                break;
            case 'helicoid':
                geometryData = this.surfaceGenerator.generateHelicoid(this.resolution, this.scale);
                equation = 'x = r·cos(θ), y = r·sin(θ), z = k·θ';
                description = 'Helicoide - Superficie reglada mínima';
                break;
            case 'hyperboloid1':
                geometryData = this.surfaceGenerator.generateHyperboloid1(this.resolution, this.scale);
                equation = 'x² + y² - z² = 1';
                description = 'Hiperboloide de una hoja - Superficie reglada';
                break;
            case 'hyperboloid2':
                geometryData = this.surfaceGenerator.generateHyperboloid2(this.resolution, this.scale);
                equation = 'x² - y² - z² = 1';
                description = 'Hiperboloide de dos hojas - Superficie cuadrática';
                break;
            case 'ellipsoid':
                geometryData = this.surfaceGenerator.generateEllipsoid(this.resolution, this.scale);
                equation = 'x²/4 + y²/9 + z²/16 = 1';
                description = 'Elipsoide - Superficie cuadrática';
                break;
            case 'monkey':
                geometryData = this.surfaceGenerator.generateMonkeySaddle(this.resolution, this.domainX, this.domainY, this.scale);
                equation = 'z = x³ - 3xy²';
                description = 'Superficie de silla de mono - Punto de silla';
                break;
            case 'sinc':
                geometryData = this.surfaceGenerator.generateSinc(this.resolution, this.domainX, this.domainY, this.scale);
                equation = 'z = sin(√(x²+y²))/√(x²+y²)';
                description = 'Función Sinc - Importante en procesamiento de señales';
                break;
            case 'ripple':
                geometryData = this.surfaceGenerator.generateRipple(this.resolution, this.domainX, this.domainY, this.scale);
                equation = 'z = sin(x)cos(y)';
                description = 'Superficie de ondas - Patrón de interferencia';
                break;
            case 'gaussian':
                geometryData = this.surfaceGenerator.generateGaussian(this.resolution, this.domainX, this.domainY, this.scale);
                equation = 'z = exp(-(x²+y²))';
                description = 'Campana Gaussiana - Distribución normal';
                break;
            case 'polynomial':
                geometryData = this.surfaceGenerator.generatePolynomial(this.resolution, this.domainX, this.domainY, this.scale);
                equation = 'z = x³ + y³ - 3xy';
                description = 'Polinomio cúbico - Superficie algebraica';
                break;
            case 'rational':
                geometryData = this.surfaceGenerator.generateRational(this.resolution, this.domainX, this.domainY, this.scale);
                equation = 'z = xy/(1+x²+y²)';
                description = 'Función racional - Comportamiento asintótico';
                break;
            case 'absolute':
                geometryData = this.surfaceGenerator.generateAbsolute(this.resolution, this.domainX, this.domainY, this.scale);
                equation = 'z = |x| + |y|';
                description = 'Función valor absoluto - Superficie con aristas';
                break;
            case 'sine':
                geometryData = this.surfaceGenerator.generateSine(this.resolution, this.domainX, this.domainY, this.scale);
                equation = 'z = sin(x) + sin(y)';
                description = 'Suma de funciones seno - Patrón periódico';
                break;
            case 'tangent':
                geometryData = this.surfaceGenerator.generateTangent(this.resolution, this.domainX, this.domainY, this.scale);
                equation = 'z = tan(x*y)';
                description = 'Función tangente - Discontinuidades';
                break;
            case 'trigonometric':
                geometryData = this.surfaceGenerator.generateTrigonometric(this.resolution, this.domainX, this.domainY, this.scale);
                equation = 'z = sin(x)cos(y)';
                description = 'Producto trigonométrico - Ondas estacionarias';
                break;
            case 'custom':
                const customEquation = document.getElementById('customEquation').value;
                geometryData = this.surfaceGenerator.generateCustomFunction(this.resolution, this.domainX, this.domainY, this.scale, customEquation);
                equation = `z = ${customEquation}`;
                description = 'Ecuación personalizada - Función definida por el usuario';
                break;
        }

        const vertices = geometryData.vertices;
        let minY = Infinity;
        let maxY = -Infinity;
        let minX = Infinity;
        let maxX = -Infinity;
        let minZ = Infinity;
        let maxZ = -Infinity;
        
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];
            const z = vertices[i + 2];
            
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            if (z < minZ) minZ = z;
            if (z > maxZ) maxZ = z;
        }
        
        const height = maxY - minY;
        const width = maxX - minX;
        const depth = maxZ - minZ;

        let autoScaleFactor = 1.0;
        const MAX_HEIGHT = 25;

        if (height > MAX_HEIGHT) {
            autoScaleFactor = MAX_HEIGHT / height;
            console.log(`Altura detectada: ${height.toFixed(2)} - Aplicando factor de escala: ${autoScaleFactor.toFixed(3)}`);
            
            for (let i = 0; i < vertices.length; i += 3) {
                vertices[i] *= autoScaleFactor;     // X
                vertices[i + 1] *= autoScaleFactor; // Y
                vertices[i + 2] *= autoScaleFactor; // Z
            }
            
            minY *= autoScaleFactor;
            maxY *= autoScaleFactor;
            minX *= autoScaleFactor;
            maxX *= autoScaleFactor;
            minZ *= autoScaleFactor;
            maxZ *= autoScaleFactor;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(geometryData.vertices, 3));
        geometry.setIndex(geometryData.indices);
        
        const colors = [];
        const positions = geometryData.vertices;

        let recalcMinY = Infinity;
        let recalcMaxY = -Infinity;
        for (let i = 1; i < positions.length; i += 3) {
            const y = positions[i];
            if (y < recalcMinY) recalcMinY = y;
            if (y > recalcMaxY) recalcMaxY = y;
        }

        const rangeBoost = 2.0;
        const range = (recalcMaxY - recalcMinY) * rangeBoost;
        const boostedMinY = recalcMinY - (range * 0.1);
        const boostedMaxY = recalcMaxY + (range * 0.1);

        for (let i = 1; i < positions.length; i += 3) {
            const y = positions[i];
            const normalizedY = (y - boostedMinY) / (boostedMaxY - boostedMinY);
            
            const color = new THREE.Color();
            
            if (normalizedY < 0.2) {
                const t = normalizedY / 0.2;
                color.setRGB(
                    0.9,                                    
                    0.2 + t * 0.4,                          
                    0.1                                     
                );
            } else if (normalizedY < 0.4) {
                const t = (normalizedY - 0.2) / 0.2;
                color.setRGB(
                    0.9,                                    
                    0.6 + t * 0.3,                          
                    0.1                                     
                );
            } else if (normalizedY < 0.6) {
                const t = (normalizedY - 0.4) / 0.2;
                color.setRGB(
                    0.9 - t * 0.6,                          
                    0.9,                                    
                    0.1 + t * 0.3                           
                );
            } else if (normalizedY < 0.8) {
                const t = (normalizedY - 0.6) / 0.2;
                color.setRGB(
                    0.3 - t * 0.2,                          
                    0.9 - t * 0.6,                          
                    0.4 + t * 0.4                           
                );
            } else {
                const t = (normalizedY - 0.8) / 0.2;
                color.setRGB(
                    0.1,                                    
                    0.3 - t * 0.2,                          
                    0.8 + t * 0.2                           
                );
            }
            
            const smoothY = Math.sin(normalizedY * Math.PI * 0.5); 
            
            color.r = Math.min(1, color.r * 1.2);
            color.g = Math.min(1, color.g * 1.15);
            color.b = Math.min(1, color.b * 1.2);
            
            colors.push(color.r, color.g, color.b);
        }
        
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const material = new THREE.MeshBasicMaterial({ 
            vertexColors: true,
            wireframe: this.wireframe,
            side: THREE.DoubleSide
        });
        
        this.surface = new THREE.Mesh(geometry, material);
        this.scene.add(this.surface);
        
        this.uiControls.updateEquation(equation, description);
        this.uiControls.updateMeshInfo(geometryData.vertexCount, geometryData.triangleCount);

        if (autoScaleFactor < 1.0) {
            const finalHeight = recalcMaxY - recalcMinY;
            console.log(`Altura ajustada: ${finalHeight.toFixed(2)} (factor de escala: ${autoScaleFactor.toFixed(3)})`);
        }
        
        this.autoFrameSurface();
        this.updateDimensionsInfo();
        this.updateHeightVisualization();
    }

    updateDimensionsInfo() {
        if (!this.surface) return;
        
        const boundingBox = new THREE.Box3().setFromObject(this.surface);
        const size = boundingBox.getSize(new THREE.Vector3());
        
        if (this.uiControls) {
            this.uiControls.updateDimensions(size.x, size.y, size.z);
        }
    }

    autoFrameSurface() {
        if (!this.surface) return;
        
        const boundingBox = new THREE.Box3().setFromObject(this.surface);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());
        
        const minY = boundingBox.min.y;
        const yOffset = -minY;
        
        this.surface.position.y = yOffset;
        
        boundingBox.setFromObject(this.surface);
        const newSize = boundingBox.getSize(new THREE.Vector3());
        const newCenter = boundingBox.getCenter(new THREE.Vector3());
        
        const maxDim = Math.max(newSize.x, newSize.y, newSize.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraDistance = maxDim / (2 * Math.tan(fov / 2));
        
        cameraDistance *= 1;
        
        this.camera.position.set(
            newCenter.x + cameraDistance - 3,
            newCenter.y + cameraDistance * 0.5,
            newCenter.z + cameraDistance
        );
        
        this.controls.target.copy(newCenter);
        this.controls.update();
        this.updateDimensionsInfo();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        this.frameCount++;
        
        if (this.autoRotate && this.surface) {
            this.surface.rotation.y += delta * 0.5;
        }
        
        this.controls.update();
        
        this.renderer.render(this.scene, this.camera);
        
        this.lastFpsUpdate += delta;
        if (this.lastFpsUpdate >= 1.0) {
            const fps = Math.round(this.frameCount / this.lastFpsUpdate);
            this.uiControls.updateFPS(fps);
            this.frameCount = 0;
            this.lastFpsUpdate = 0;
        }
    }
    
    changeSurface(surfaceType) {
        this.currentSurface = surfaceType;
        this.createSurface();
        this.updateDimensionsInfo();
    }

    updateResolution(resolution) {
        this.resolution = resolution;
        this.createSurface();
        this.updateDimensionsInfo();
    }

    updateScale(scale) {
        this.scale = scale;
        this.createSurface(); 
        this.updateDimensionsInfo();
    }

    updateDomain(domainX, domainY) {
        this.domainX = domainX;
        this.domainY = domainY;
        this.createSurface();
        this.updateDimensionsInfo();
    }

    plotCustomEquation(equation) {
        this.currentSurface = 'custom';
        document.getElementById('customEquation').value = equation;
        this.createSurface();
    }

    toggleWireframe(enabled) {
        this.wireframe = enabled;
        if (this.surface) {
            this.surface.material.wireframe = enabled;
        }
    }

    toggleAutoRotate(enabled) {
        this.autoRotate = enabled;
    }

    toggleAxes(enabled) {
        this.showAxes = enabled;
        this.axesHelper.visible = enabled;
    }

    setView(viewType) {
        if (!this.surface) return;
        
        const boundingBox = new THREE.Box3().setFromObject(this.surface);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const cameraDistance = maxDim * 1.2;
        
        switch (viewType) {
            case 'top':
                this.camera.position.set(center.x, center.y + cameraDistance, center.z);
                break;
            case 'front':
                this.camera.position.set(center.x, center.y, center.z + cameraDistance);
                break;
            case 'right':
                this.camera.position.set(center.x + cameraDistance, center.y, center.z);
                break;
        }
        
        this.controls.target.copy(center);
        this.controls.update();
    }

    resetCamera() {
        this.autoFrameSurface();
    }
    
    updateTheme() {
        this.updateSceneBackground();
        this.setupHelpers(); 
        this.createNumberedGrid();
        this.createSurface();
    }
}

let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new WebGLApp();
});