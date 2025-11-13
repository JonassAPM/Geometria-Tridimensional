class UIControls {
    constructor(app) {
        this.app = app;
        this.initializeControls();
        this.setupRangeStyles();
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
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }

        setTimeout(() => {
            if (this.app && this.app.onWindowResize) {
                this.app.onWindowResize();
            }
        }, 200);
        
        this.updateFullscreenIcon();
    }

    updateFullscreenIcon() {
        const fullscreenIcon = document.querySelector('#fullscreenToggle i');
        if (document.fullscreenElement) {
            fullscreenIcon.className = 'fas fa-compress';
        } else {
            fullscreenIcon.className = 'fas fa-expand';
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