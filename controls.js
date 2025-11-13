class UIControls {
    constructor(app) {
        this.app = app;
        this.initializeControls();
        this.setupRangeStyles();
        this.setupFullscreenListeners();
        
        this.updateFullscreenIcon();
    }

    setupFullscreenListeners() {
        
        const fullscreenEvents = [
            'fullscreenchange',
            'webkitfullscreenchange', 
            'mozfullscreenchange',
            'MSFullscreenChange'
        ];

        fullscreenEvents.forEach(event => {
            document.addEventListener(event, () => {
                console.log('Evento de pantalla completa detectado:', event);
                this.updateFullscreenIcon();
            });
        });
    }

    setupRangeStyles() {
        
        const resolutionSlider = document.getElementById('resolution');
        const scaleSlider = document.getElementById('scale');
        
        const updateRangeFill = (slider) => {
            const value = slider.value;
            const min = slider.min || 0;
            const max = slider.max || 100;
            const percent = ((value - min) / (max - min)) * 100;
            slider.style.setProperty('--fill-percent', `${percent}%`);
        };
        
        
        updateRangeFill(resolutionSlider);
        updateRangeFill(scaleSlider);
        
        
        resolutionSlider.addEventListener('input', () => {
            updateRangeFill(resolutionSlider);
            const value = resolutionSlider.value;
            document.getElementById('resolutionValue').textContent = value;
            this.app.updateResolution(parseInt(value));
        });
        
        scaleSlider.addEventListener('input', () => {
            updateRangeFill(scaleSlider);
            const value = parseFloat(scaleSlider.value);
            document.getElementById('scaleValue').textContent = value.toFixed(1);
            this.app.updateScale(value);
        });
    }

        updateDimensions(width, height, depth) {
            document.getElementById('coordinates').innerHTML = 
                `<span style="color: #ffffffff">X: ${width.toFixed(2)}</span> | 
                <span style="color: #ffffffff">Y: ${height.toFixed(2)}</span> | 
                <span style="color: #ffffffff">Z: ${depth.toFixed(2)}</span>`;
        }

        
        updateEquation(equation, description) {
            document.getElementById('equation').textContent = equation;
            document.getElementById('equationDesc').textContent = description;
        }

        updateFPS(fps) {
            document.getElementById('fps').textContent = `FPS: ${fps}`;
        }

        updateMeshInfo(vertexCount, triangleCount) {
            document.getElementById('vertexCount').textContent = `Vértices: ${vertexCount}`;
            document.getElementById('triangleCount').textContent = `Triángulos: ${triangleCount}`;
        }

    initializeControls() {
        
        document.getElementById('surfaceSelector').addEventListener('change', (e) => {
            this.app.changeSurface(e.target.value);
        });

        
        const resolutionSlider = document.getElementById('resolution');
        const resolutionValue = document.getElementById('resolutionValue');
        
        resolutionSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            resolutionValue.textContent = value;
            this.app.updateResolution(parseInt(value));
        });

        const scaleSlider = document.getElementById('scale');
        const scaleValue = document.getElementById('scaleValue');
        
        scaleSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            scaleValue.textContent = value.toFixed(1);
            this.app.updateScale(value);
        });

        
        document.getElementById('wireframe').addEventListener('change', (e) => {
            this.app.toggleWireframe(e.target.checked);
        });

        document.getElementById('autoRotate').addEventListener('change', (e) => {
            this.app.toggleAutoRotate(e.target.checked);
        });

        document.getElementById('showAxes').addEventListener('change', (e) => {
            this.app.toggleAxes(e.target.checked);
        });

        
        document.getElementById('viewTop').addEventListener('click', () => {
            this.app.setView('top');
        });

        document.getElementById('viewFront').addEventListener('click', () => {
            this.app.setView('front');
        });

        document.getElementById('viewRight').addEventListener('click', () => {
            this.app.setView('right');
        });

        
        document.getElementById('resetView').addEventListener('click', () => {
            this.app.resetCamera();
        });

        document.getElementById('screenshot').addEventListener('click', () => {
            this.app.takeScreenshot();
        });

        
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        document.getElementById('fullscreenToggle').addEventListener('click', () => {
            this.toggleFullscreen();
        });
    }

    toggleTheme() {
        const body = document.body;
        const themeIcon = document.querySelector('#themeToggle i');
        
        if (body.classList.contains('dark-mode')) {
            body.classList.replace('dark-mode', 'light-mode');
            themeIcon.className = 'fas fa-sun';
        } else {
            body.classList.replace('light-mode', 'dark-mode');
            themeIcon.className = 'fas fa-moon';
        }
        
        
        this.app.updateTheme();
    }

    toggleFullscreen() {
        console.log('Toggle fullscreen llamado');
        
        if (!document.fullscreenElement && 
            !document.webkitFullscreenElement && 
            !document.mozFullScreenElement &&
            !document.msFullscreenElement) {
            
            const element = document.documentElement;
            
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        } else {
            
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
        
        
        setTimeout(() => {
            this.updateFullscreenIcon();
        }, 100);
    }

    updateFullscreenIcon() {
        const fullscreenIcon = document.querySelector('#fullscreenToggle i');
        const fullscreenToggle = document.getElementById('fullscreenToggle');
        
        if (!fullscreenIcon) {
            console.error('No se encontró el icono de pantalla completa');
            return;
        }

        const isFullscreen = !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement || 
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );

        console.log('Actualizando icono. Pantalla completa:', isFullscreen);

        if (isFullscreen) {
            fullscreenIcon.className = 'fas fa-compress';
            fullscreenToggle.title = 'Salir de pantalla completa';
            fullscreenToggle.setAttribute('aria-label', 'Salir de pantalla completa');
        } else {
            fullscreenIcon.className = 'fas fa-expand';
            fullscreenToggle.title = 'Pantalla completa';
            fullscreenToggle.setAttribute('aria-label', 'Pantalla completa');
        }
    }

    updateEquation(equation, description) {
        document.getElementById('equation').textContent = equation;
        document.getElementById('equationDesc').textContent = description;
    }

    updateCoordinates(x, y, z) {
        document.getElementById('coordinates').textContent = 
            `X: ${x.toFixed(2)}, Y: ${y.toFixed(2)}, Z: ${z.toFixed(2)}`;
    }

    updateFPS(fps) {
        document.getElementById('fps').textContent = `FPS: ${fps}`;
    }

    updateMeshInfo(vertexCount, triangleCount) {
        document.getElementById('vertexCount').textContent = `Vértices: ${vertexCount}`;
        document.getElementById('triangleCount').textContent = `Triángulos: ${triangleCount}`;
    }
}