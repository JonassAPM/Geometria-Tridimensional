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
        this.resolution = 50;
        this.scale = 4;
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
        const canvas = this.renderer.domElement;
        const container = document.getElementById('canvasContainer');
        
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        
        if (canvas.width !== width || canvas.height !== height) {
            console.log('Redimensionando canvas:', width, 'x', height);
            
            
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            
            
            this.renderer.setSize(width, height, false);
            
            
            
        }
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
        const canvas = this.renderer.domElement;
        const container = document.getElementById('canvasContainer');
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        console.log('Forzando redimensionamiento:', width, 'x', height);
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
        
        
        
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

    setupHelpers() {
        
        if (this.axesHelper) this.scene.remove(this.axesHelper);
        this.axesHelper = new THREE.AxesHelper(3);
        this.scene.add(this.axesHelper);
        
        
        if (this.gridHelper) this.scene.remove(this.gridHelper);
        const gridColor = document.body.classList.contains('dark-mode') ? 0x334155 : 0xcbd5e1;
        this.gridHelper = new THREE.GridHelper(20, 20, gridColor, gridColor);
        this.gridHelper.position.y = 0;
        this.scene.add(this.gridHelper);
    }

    updateSceneBackground() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        this.scene.background = new THREE.Color(isDarkMode ? 0x0f172a : 0xf8fafc);
        
        
        if (this.gridHelper) {
            const gridColor = isDarkMode ? 0x334155 : 0xcbd5e1;
            this.gridHelper.material.color.setHex(gridColor);
        }
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
                geometryData = this.surfaceGenerator.generateParaboloid(this.resolution, this.scale);
                equation = 'z = x² + y²';
                description = 'Paraboloide elíptico - Superficie cuadrática';
                break;
            case 'hyperbolic':
                geometryData = this.surfaceGenerator.generateHyperbolicParaboloid(this.resolution, this.scale);
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
            case 'monkey':
                geometryData = this.surfaceGenerator.generateMonkeySaddle(this.resolution, this.scale);
                equation = 'z = x³ - 3xy²';
                description = 'Superficie de silla de mono - Punto de silla';
                break;
        }
        
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(geometryData.vertices, 3));
        geometry.setIndex(geometryData.indices);
        
        
        const colors = [];
        const positions = geometryData.vertices;

        
        let minY = Infinity;
        let maxY = -Infinity;
        for (let i = 1; i < positions.length; i += 3) {
            const y = positions[i];
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }

        
        const rangeBoost = 2.0;
        const range = (maxY - minY) * rangeBoost;
        const boostedMinY = minY - (range * 0.1);
        const boostedMaxY = maxY + (range * 0.1);

        
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
        
        
        this.autoFrameSurface();
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
        
        
        cameraDistance *= 1.4;
        
        
        this.camera.position.set(
            newCenter.x + cameraDistance,
            newCenter.y + cameraDistance * 0.5,
            newCenter.z + cameraDistance
        );
        
        this.controls.target.copy(newCenter);
        this.controls.update();
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

    onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.uiControls.updateCoordinates(x, y, 0);
    }

    
    changeSurface(surfaceType) {
        this.currentSurface = surfaceType;
        this.createSurface();
    }

    updateResolution(resolution) {
        this.resolution = resolution;
        this.createSurface();
    }

    updateScale(scale) {
        this.scale = scale;
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

    takeScreenshot() {
        this.renderer.render(this.scene, this.camera);
        const dataURL = this.renderer.domElement.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.download = `superficie-3d-${this.currentSurface}.png`;
        link.href = dataURL;
        link.click();
    }

    
    updateTheme() {
        this.updateSceneBackground();
        this.setupHelpers();
        
        this.createSurface();
    }
}


let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new WebGLApp();
});