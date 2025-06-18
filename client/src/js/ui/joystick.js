// Ultra Simple Direct Input Joystick - No Delay
class VirtualJoystick {
    constructor(container, onMove) {
        this.container = container;
        this.onMove = onMove;
        this.isDragging = false;        this.center = { x: 0, y: 0 };
        this.maxRadius = 40;
        this.deadZone = 5; // Smaller dead zone for better responsiveness
        
        this.base = null;
        this.stick = null;
        
        this.createJoystick();
        this.bindEvents();
    }    createJoystick() {
        // Create base circle
        this.base = document.createElement('div');
        this.base.className = 'virtual-joystick-base';
        this.base.style.cssText = `
            position: fixed;
            bottom: 12vh;
            left: 50%;
            transform: translateX(-50%);
            width: min(28vw, 120px);
            height: min(28vw, 120px);
            min-width: 100px;
            min-height: 100px;
            max-width: 140px;
            max-height: 140px;
            background: rgba(0, 0, 0, 0.3);
            border: 2px solid rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            z-index: 2000;
            touch-action: none;
            user-select: none;
        `;

        // Create stick
        this.stick = document.createElement('div');
        this.stick.className = 'virtual-joystick-stick';
        this.stick.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 40%;
            height: 40%;
            background: #667eea;
            border: 2px solid white;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        `;

        this.base.appendChild(this.stick);
        this.container.appendChild(this.base);
        
        // Calculate max radius based on actual size
        const baseSize = this.base.getBoundingClientRect();
        this.maxRadius = (Math.min(baseSize.width, baseSize.height) / 2) * 0.7;
    }

    bindEvents() {
        // Touch events - primary for mobile
        this.base.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrag(e.touches[0]);
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (this.isDragging) {
                e.preventDefault();
                this.drag(e.touches[0]);
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            if (this.isDragging) {
                e.preventDefault();
                this.endDrag();
            }
        }, { passive: false });

        // Mouse events for testing
        this.base.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.startDrag(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.drag(e);
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.endDrag();
            }
        });
    }    startDrag(pointer) {
        this.isDragging = true;
        const rect = this.base.getBoundingClientRect();
        this.center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        // Recalculate max radius based on current size
        this.maxRadius = Math.min(rect.width, rect.height) / 2 * 0.7;
        this.base.style.background = 'rgba(0, 0, 0, 0.5)';
        this.drag(pointer);
    }

    drag(pointer) {
        if (!this.isDragging) return;

        const dx = pointer.clientX - this.center.x;
        const dy = pointer.clientY - this.center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Constrain to circle
        let finalX = dx;
        let finalY = dy;
        if (distance > this.maxRadius) {
            finalX = (dx / distance) * this.maxRadius;
            finalY = (dy / distance) * this.maxRadius;
        }

        // Update stick position
        this.stick.style.transform = `translate(calc(-50% + ${finalX}px), calc(-50% + ${finalY}px))`;

        // Send input immediately - no delay
        if (distance > this.deadZone) {
            const normalizedX = finalX / this.maxRadius;
            const normalizedY = finalY / this.maxRadius;
            
            // Direct callback - instant response
            if (this.onMove) {
                this.onMove({
                    dx: normalizedX,
                    dy: normalizedY
                });
            }
        } else {
            // Send zero input when in dead zone
            if (this.onMove) {
                this.onMove({ dx: 0, dy: 0 });
            }
        }
    }

    endDrag() {
        this.isDragging = false;
        this.base.style.background = 'rgba(0, 0, 0, 0.3)';
        
        // Reset stick position
        this.stick.style.transform = 'translate(-50%, -50%)';
        
        // Stop movement immediately
        if (this.onMove) {
            this.onMove({ dx: 0, dy: 0 });
        }
    }

    show() {
        this.base.style.display = 'block';
    }

    hide() {
        this.base.style.display = 'none';
    }

    destroy() {
        if (this.base && this.base.parentNode) {
            this.base.parentNode.removeChild(this.base);
        }
    }
}

export default VirtualJoystick;
