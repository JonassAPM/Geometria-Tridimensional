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
        const domainXSlider = document.getElementById('domainX');
        const domainYSlider = document.getElementById('domainY');
        
        const updateRangeFill = (slider) => {
            const value = slider.value;
            const min = slider.min || 0;
            const max = slider.max || 100;
            const percent = ((value - min) / (max - min)) * 100;
            slider.style.setProperty('--fill-percent', `${percent}%`);
        };

        resolutionSlider.value = 60;
        scaleSlider.value = 1;
        domainXSlider.value = 3.5;
        domainYSlider.value = 3.5;

        document.getElementById('resolutionValue').textContent = '60';
        document.getElementById('scaleValue').textContent = '1';
        document.getElementById('domainXValue').textContent = '3.5';
        document.getElementById('domainYValue').textContent = '3.5';
        
        updateRangeFill(resolutionSlider);
        updateRangeFill(scaleSlider);
        updateRangeFill(domainXSlider);
        updateRangeFill(domainYSlider);
        
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

        domainXSlider.addEventListener('input', () => {
            updateRangeFill(domainXSlider);
            const value = parseFloat(domainXSlider.value);
            document.getElementById('domainXValue').textContent = value.toFixed(1);
            this.updateDomain();
        });

        domainYSlider.addEventListener('input', () => {
            updateRangeFill(domainYSlider);
            const value = parseFloat(domainYSlider.value);
            document.getElementById('domainYValue').textContent = value.toFixed(1);
            this.updateDomain();
        });
    }

    updateDomain() {
        const domainX = parseFloat(document.getElementById('domainX').value);
        const domainY = parseFloat(document.getElementById('domainY').value);
        this.app.updateDomain(domainX, domainY);
    }

    updateDimensions(width, height, depth) {
        document.getElementById('coordinates').innerHTML = 
            `<span style="color: #ffffff">X: ${width.toFixed(2)}</span> | 
             <span style="color: #ffffff">Y: ${height.toFixed(2)}</span> | 
             <span style="color: #ffffff">Z: ${depth.toFixed(2)}</span>`;
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
        // Plot custom equation
        document.getElementById('plotButton').addEventListener('click', () => {
            const equation = document.getElementById('customEquation').value;
            this.app.plotCustomEquation(equation);
        });

        // Load examples
        document.getElementById('loadExample').addEventListener('click', () => {
            const example = document.getElementById('examplesSelector').value;
            this.app.changeSurface(example);
        });

        // Enter key for equation input
        document.getElementById('customEquation').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const equation = document.getElementById('customEquation').value;
                this.app.plotCustomEquation(equation);
            }
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

        const domainXSlider = document.getElementById('domainX');
        const domainXValue = document.getElementById('domainXValue');
        
        domainXSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            domainXValue.textContent = value.toFixed(1);
            this.updateDomain();
        });

        const domainYSlider = document.getElementById('domainY');
        const domainYValue = document.getElementById('domainYValue');
        
        domainYSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            domainYValue.textContent = value.toFixed(1);
            this.updateDomain();
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

    updateEquationType(type) {
        const equationInput = document.getElementById('customEquation');
        const equationLabel = document.querySelector('label[for="customEquation"]');
        
        switch(type) {
            case 'explicit':
                equationLabel.innerHTML = '<i class="fas fa-edit"></i> f(x, y) =';
                equationInput.placeholder = 'x^2 + y^2';
                break;
            case 'implicit':
                equationLabel.innerHTML = '<i class="fas fa-edit"></i> f(x, y, z) =';
                equationInput.placeholder = 'x^2 + y^2 + z^2 - 4';
                break;
            case 'parametric':
                equationLabel.innerHTML = '<i class="fas fa-edit"></i> x(u,v), y(u,v), z(u,v)';
                equationInput.placeholder = 'u*cos(v), u*sin(v), u';
                break;
        }
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