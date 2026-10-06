class SimpleLineChart {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.label = options.label || '';
        this.unit = options.unit || '';
        this.color = options.color || '#565bb3';
        this.maxPoints = options.maxPoints || 50;
        this.points = [];
        this.hoverIndex = null;
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'chart-tooltip';
        this.tooltip.hidden = true;
        canvas.parentElement?.appendChild(this.tooltip);

        this.resizeHandler = () => this.draw();
        this.mouseMoveHandler = event => this.handleMouseMove(event);
        this.mouseLeaveHandler = () => {
            this.hoverIndex = null;
            this.tooltip.hidden = true;
            this.draw();
        };
        window.addEventListener('resize', this.resizeHandler);
        canvas.addEventListener('mousemove', this.mouseMoveHandler);
        canvas.addEventListener('mouseleave', this.mouseLeaveHandler);
    }

    setPoints(points) {
        this.points = (points || []).slice(-this.maxPoints).map(point => ({
            value: Number(point.value),
            time: new Date(point.recorded_at || point.time || Date.now())
        })).filter(point => Number.isFinite(point.value) && !Number.isNaN(point.time.getTime()));

        this.draw();
    }

    push(value, time = new Date()) {
        const numericValue = Number(value);
        const date = new Date(time);
        if (!Number.isFinite(numericValue) || Number.isNaN(date.getTime())) return;

        this.points.push({ value: numericValue, time: date });

        if (this.points.length > this.maxPoints) {
            this.points.splice(0, this.points.length - this.maxPoints);
        }

        this.draw();
    }

    destroy() {
        window.removeEventListener('resize', this.resizeHandler);
        this.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
        this.canvas.removeEventListener('mouseleave', this.mouseLeaveHandler);
        this.tooltip.remove();
    }

    handleMouseMove(event) {
        if (!this.points.length) return;

        const rect = this.canvas.getBoundingClientRect();
        const left = 44;
        const right = 12;
        const width = rect.width - left - right;
        const mouseX = event.clientX - rect.left;
        const index = this.points.length === 1
            ? 0
            : Math.max(0, Math.min(this.points.length - 1, Math.round(((mouseX - left) / width) * (this.points.length - 1))));

        this.hoverIndex = index;
        this.draw();
    }

    draw() {
        const canvas = this.canvas;
        const parentWidth = Math.max(canvas.parentElement?.clientWidth || 320, 240);
        const cssHeight = 220;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = Math.floor(parentWidth * dpr);
        canvas.height = Math.floor(cssHeight * dpr);
        canvas.style.width = `${parentWidth}px`;
        canvas.style.height = `${cssHeight}px`;

        const ctx = this.ctx;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, parentWidth, cssHeight);

        const left = 44;
        const right = 12;
        const top = 14;
        const bottom = 32;
        const width = parentWidth - left - right;
        const height = cssHeight - top - bottom;

        ctx.font = '11px system-ui, sans-serif';
        ctx.fillStyle = '#778099';
        ctx.strokeStyle = '#e8eaf1';
        ctx.lineWidth = 1;

        if (!this.points.length) {
            this.tooltip.hidden = true;
            ctx.textAlign = 'center';
            ctx.fillText('Chưa có dữ liệu', parentWidth / 2, cssHeight / 2);
            return;
        }

        const values = this.points.map(point => point.value);
        let min = Math.min(...values);
        let max = Math.max(...values);

        if (min === max) {
            const pad = Math.max(Math.abs(min) * 0.1, 1);
            min -= pad;
            max += pad;
        } else {
            const pad = (max - min) * 0.12;
            min -= pad;
            max += pad;
        }

        const gridLines = 4;
        for (let i = 0; i <= gridLines; i++) {
            const y = top + (height / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(left, y);
            ctx.lineTo(left + width, y);
            ctx.stroke();

            const value = max - ((max - min) / gridLines) * i;
            ctx.fillStyle = '#778099';
            ctx.textAlign = 'right';
            ctx.fillText(`${value.toFixed(1)}${this.unit ? ' ' + this.unit : ''}`, left - 6, y + 4);
        }

        const xAt = index => {
            if (this.points.length === 1) return left + width / 2;
            return left + (width * index) / (this.points.length - 1);
        };

        const yAt = value => top + height - ((value - min) / (max - min)) * height;

        ctx.beginPath();
        this.points.forEach((point, index) => {
            const x = xAt(index);
            const y = yAt(point.value);
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2.2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();

        if (this.points.length <= 15) {
            ctx.fillStyle = this.color;
            this.points.forEach((point, index) => {
                ctx.beginPath();
                ctx.arc(xAt(index), yAt(point.value), 2.8, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        if (this.hoverIndex !== null && this.points[this.hoverIndex]) {
            const point = this.points[this.hoverIndex];
            const x = xAt(this.hoverIndex);
            const y = yAt(point.value);

            ctx.beginPath();
            ctx.moveTo(x, top);
            ctx.lineTo(x, top + height);
            ctx.strokeStyle = `${this.color}55`;
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(x, y, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.stroke();

            this.tooltip.textContent = `${point.value.toFixed(2)}${this.unit ? ` ${this.unit}` : ''} • ${Utils.formatDateTime(point.time)}`;
            this.tooltip.hidden = false;
            this.tooltip.style.left = `${Math.min(Math.max(x, 72), parentWidth - 72)}px`;
            this.tooltip.style.top = `${Math.max(y - 42, 2)}px`;
        } else {
            this.tooltip.hidden = true;
        }

        const labelIndexes = [0, Math.floor((this.points.length - 1) / 2), this.points.length - 1]
            .filter((value, index, array) => array.indexOf(value) === index);

        ctx.fillStyle = '#778099';
        ctx.textAlign = 'center';
        labelIndexes.forEach(index => {
            const label = this.points[index].time.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            ctx.fillText(label, xAt(index), cssHeight - 9);
        });
    }
}
