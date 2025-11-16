class SurfaceGenerator {
    constructor() {
        this.geometries = new Map();
        this.parser = math.parser();
    }

    evaluateExpression(expr, x, y) {
        try {
            this.parser.set('x', x);
            this.parser.set('y', y);
            return this.parser.evaluate(expr);
        } catch (error) {
            console.error('Error evaluando expresión:', error);
            return 0;
        }
    }

    generateCustomFunction(resolution = 50, domainX = 4, domainY = 4, scale = 1, equation = "x^2 + y^2") {
        const vertices = [];
        const indices = [];
        
        let compiledExpr;
        try {
            compiledExpr = math.compile(equation);
        } catch (error) {
            console.error('Error compilando expresión:', error);
            // Fallback a una expresión simple
            compiledExpr = math.compile("0");
        }
        
        for (let i = 0; i <= resolution; i++) {
            const u = (i / resolution) * 2 - 1;
            for (let j = 0; j <= resolution; j++) {
                const v = (j / resolution) * 2 - 1;
                
                const x = u * domainX;
                const z = v * domainY;
                
                let y;
                try {
                    const result = compiledExpr.evaluate({x: x, y: z});
                    
                    if (typeof result === 'number' && isFinite(result)) {
                        y = result * scale;
                    } else {
                        y = 0;
                    }
                } catch (error) {
                    console.warn(`Error evaluando en (${x.toFixed(2)}, ${z.toFixed(2)}):`, error.message);
                    y = 0;
                }
                
                vertices.push(x, y, z);
                
                if (i < resolution && j < resolution) {
                    const a = i * (resolution + 1) + j;
                    const b = a + 1;
                    const c = a + (resolution + 1);
                    const d = c + 1;
                    
                    indices.push(a, b, c);
                    indices.push(b, d, c);
                }
            }
        }
        
        return { 
            vertices, 
            indices, 
            vertexCount: vertices.length / 3, 
            triangleCount: indices.length / 3 
        };
    }

    generateParaboloid(resolution = 50, domainX = 4, domainY = 4, scale = 1) {
        return this.generateCustomFunction(resolution, domainX, domainY, scale, "x^2 + y^2");
    }

    generateHyperbolicParaboloid(resolution = 50, domainX = 4, domainY = 4, scale = 1) {
        return this.generateCustomFunction(resolution, domainX, domainY, scale, "x^2 - y^2");
    }

    generateSphere(resolution = 50, scale = 2) {
        const vertices = [];
        const indices = [];
        
        for (let i = 0; i <= resolution; i++) {
            const theta = (i / resolution) * Math.PI;
            for (let j = 0; j <= resolution; j++) {
                const phi = (j / resolution) * 2 * Math.PI;
                
                const x = scale * Math.sin(theta) * Math.cos(phi);
                const y = scale * Math.cos(theta);
                const z = scale * Math.sin(theta) * Math.sin(phi);
                
                vertices.push(x, y, z);
                
                if (i < resolution && j < resolution) {
                    const a = i * (resolution + 1) + j;
                    const b = a + 1;
                    const c = a + (resolution + 1);
                    const d = c + 1;
                    
                    indices.push(a, c, b);
                    indices.push(b, c, d);
                }
            }
        }
        
        return { vertices, indices, vertexCount: vertices.length / 3, triangleCount: indices.length / 3 };
    }

    generateCylinder(resolution = 50, scale = 2) {
        const vertices = [];
        const indices = [];
        
        for (let i = 0; i <= resolution; i++) {
            const y = (i / resolution) * 2 - 1;
            for (let j = 0; j <= resolution; j++) {
                const theta = (j / resolution) * 2 * Math.PI;
                
                const x = Math.cos(theta) * scale;
                const z = Math.sin(theta) * scale;
                
                vertices.push(x, y * scale, z);
                
                if (i < resolution && j < resolution) {
                    const a = i * (resolution + 1) + j;
                    const b = a + 1;
                    const c = a + (resolution + 1);
                    const d = c + 1;
                    
                    indices.push(a, b, c);
                    indices.push(b, d, c);
                }
            }
        }
        
        return { vertices, indices, vertexCount: vertices.length / 3, triangleCount: indices.length / 3 };
    }

    generateCone(resolution = 50, scale = 2) {
        const vertices = [];
        const indices = [];
        
        for (let i = 0; i <= resolution; i++) {
            const r = (1 - i / resolution) * scale;
            const y = (i / resolution) * 2 * scale - scale;
            for (let j = 0; j <= resolution; j++) {
                const theta = (j / resolution) * 2 * Math.PI;
                
                const x = Math.cos(theta) * r;
                const z = Math.sin(theta) * r;
                
                vertices.push(x, y, z);
                
                if (i < resolution && j < resolution) {
                    const a = i * (resolution + 1) + j;
                    const b = a + 1;
                    const c = a + (resolution + 1);
                    const d = c + 1;
                    
                    indices.push(a, b, c);
                    indices.push(b, d, c);
                }
            }
        }
        
        return { vertices, indices, vertexCount: vertices.length / 3, triangleCount: indices.length / 3 };
    }

    generateTorus(resolution = 50, scale = 2) {
        const vertices = [];
        const indices = [];
        const R = scale * 0.8;
        const r = scale * 0.3;
        
        for (let i = 0; i <= resolution; i++) {
            const u = (i / resolution) * 2 * Math.PI;
            for (let j = 0; j <= resolution; j++) {
                const v = (j / resolution) * 2 * Math.PI;
                
                const x = (R + r * Math.cos(v)) * Math.cos(u);
                const y = r * Math.sin(v);
                const z = (R + r * Math.cos(v)) * Math.sin(u);
                
                vertices.push(x, y, z);
                
                if (i < resolution && j < resolution) {
                    const a = i * (resolution + 1) + j;
                    const b = a + 1;
                    const c = a + (resolution + 1);
                    const d = c + 1;
                    
                    indices.push(a, c, b);
                    indices.push(b, c, d);
                }
            }
        }
        
        return { vertices, indices, vertexCount: vertices.length / 3, triangleCount: indices.length / 3 };
    }

    generateHelicoid(resolution = 50, scale = 3) {
        const vertices = [];
        const indices = [];
        
        for (let i = 0; i <= resolution; i++) {
            const r = (i / resolution) * scale;
            for (let j = 0; j <= resolution; j++) {
                const theta = (j / resolution) * 4 * Math.PI;
                
                const x = r * Math.cos(theta);
                const y = theta * 0.3; 
                const z = r * Math.sin(theta);
                
                vertices.push(x, y, z);
                
                if (i < resolution && j < resolution) {
                    const a = i * (resolution + 1) + j;
                    const b = a + 1;
                    const c = a + (resolution + 1);
                    const d = c + 1;
                    
                    indices.push(a, b, c);
                    indices.push(b, d, c);
                }
            }
        }
        
        return { vertices, indices, vertexCount: vertices.length / 3, triangleCount: indices.length / 3 };
    }

    generateHyperboloid1(resolution = 50, scale = 2) {
        const vertices = [];
        const indices = [];
        
        for (let i = 0; i <= resolution; i++) {
            const u = (i / resolution) * 2 * Math.PI;
            for (let j = 0; j <= resolution; j++) {
                const v = (j / resolution) * 2 - 1;
                
                const x = scale * Math.cosh(v) * Math.cos(u);
                const y = scale * Math.sinh(v);
                const z = scale * Math.cosh(v) * Math.sin(u);
                
                vertices.push(x, y, z);
                
                if (i < resolution && j < resolution) {
                    const a = i * (resolution + 1) + j;
                    const b = a + 1;
                    const c = a + (resolution + 1);
                    const d = c + 1;
                    
                    indices.push(a, b, c);
                    indices.push(b, d, c);
                }
            }
        }
        
        return { vertices, indices, vertexCount: vertices.length / 3, triangleCount: indices.length / 3 };
    }

    generateHyperboloid2(resolution = 50, scale = 2) {
        const vertices = [];
        const indices = [];
        
        for (let i = 0; i <= resolution; i++) {
            const u = (i / resolution) * 2 * Math.PI;
            for (let j = 0; j <= resolution/2; j++) {
                const v = (j / (resolution/2)) * 2;
                
                const x = scale * Math.sinh(v) * Math.cos(u);
                const y = scale * Math.cosh(v);
                const z = scale * Math.sinh(v) * Math.sin(u);
                
                vertices.push(x, y, z);
            }
        }
        
        for (let i = 0; i <= resolution; i++) {
            const u = (i / resolution) * 2 * Math.PI;
            for (let j = 0; j <= resolution/2; j++) {
                const v = (j / (resolution/2)) * 2;
                
                const x = scale * Math.sinh(v) * Math.cos(u);
                const y = -scale * Math.cosh(v);
                const z = scale * Math.sinh(v) * Math.sin(u);
                
                vertices.push(x, y, z);
            }
        }
        
        const totalVertices = vertices.length / 3;
        for (let i = 0; i < totalVertices - (resolution + 2); i++) {
            indices.push(i, i + 1, i + resolution + 1);
            indices.push(i + 1, i + resolution + 2, i + resolution + 1);
        }
        
        return { vertices, indices, vertexCount: vertices.length / 3, triangleCount: indices.length / 3 };
    }

    generateEllipsoid(resolution = 50, scale = 2) {
        const vertices = [];
        const indices = [];
        const a = scale * 2;
        const b = scale * 1.5;
        const c = scale;
        
        for (let i = 0; i <= resolution; i++) {
            const theta = (i / resolution) * Math.PI;
            for (let j = 0; j <= resolution; j++) {
                const phi = (j / resolution) * 2 * Math.PI;
                
                const x = a * Math.sin(theta) * Math.cos(phi);
                const y = b * Math.cos(theta);
                const z = c * Math.sin(theta) * Math.sin(phi);
                
                vertices.push(x, y, z);
                
                if (i < resolution && j < resolution) {
                    const idx = i * (resolution + 1) + j;
                    const nextIdx = idx + resolution + 1;
                    
                    indices.push(idx, idx + 1, nextIdx);
                    indices.push(idx + 1, nextIdx + 1, nextIdx);
                }
            }
        }
        
        return { vertices, indices, vertexCount: vertices.length / 3, triangleCount: indices.length / 3 };
    }

    generateMonkeySaddle(resolution = 50, domainX = 4, domainY = 4, scale = 1) {
        return this.generateCustomFunction(resolution, domainX, domainY, scale, "x^3 - 3*x*y^2");
    }

    generateSinc(resolution = 50, domainX = 4, domainY = 4, scale = 1) {
        return this.generateCustomFunction(resolution, domainX, domainY, scale, "sin(sqrt(x^2 + y^2)) / sqrt(x^2 + y^2)");
    }

    generateRipple(resolution = 50, domainX = 4, domainY = 4, scale = 1) {
        return this.generateCustomFunction(resolution, domainX, domainY, scale, "sin(x) * cos(y)");
    }

    generateGaussian(resolution = 50, domainX = 4, domainY = 4, scale = 1) {
        return this.generateCustomFunction(resolution, domainX, domainY, scale, "exp(-(x^2 + y^2))");
    }

    generatePolynomial(resolution = 50, domainX = 4, domainY = 4, scale = 1) {
        return this.generateCustomFunction(resolution, domainX, domainY, scale, "x^3 + y^3 - 3*x*y");
    }

    generateRational(resolution = 50, domainX = 4, domainY = 4, scale = 1) {
        return this.generateCustomFunction(resolution, domainX, domainY, scale, "x*y/(1 + x^2 + y^2)");
    }

    generateAbsolute(resolution = 50, domainX = 4, domainY = 4, scale = 1) {
        return this.generateCustomFunction(resolution, domainX, domainY, scale, "abs(x) + abs(y)");
    }

    generateSine(resolution = 50, domainX = 4, domainY = 4, scale = 1) {
        return this.generateCustomFunction(resolution, domainX, domainY, scale, "sin(x) + sin(y)");
    }

    generateTangent(resolution = 50, domainX = 4, domainY = 4, scale = 1) {
        return this.generateCustomFunction(resolution, domainX, domainY, scale, "tan(x*y)");
    }

    generateTrigonometric(resolution = 50, domainX = 4, domainY = 4, scale = 1) {
        return this.generateCustomFunction(resolution, domainX, domainY, scale, "sin(x) * cos(y)");
    }
}