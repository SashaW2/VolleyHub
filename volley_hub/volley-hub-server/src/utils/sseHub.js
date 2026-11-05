class SseHub {
    constructor() {
        this.clients = new Map();
    }

    add(userId, res) {
        const key = String(userId);
        if (!this.clients.has(key)) {
            this.clients.set(key, new Set());
        }
        this.clients.get(key).add(res);
    }

    remove(userId, res) {
        const key = String(userId);
        const set = this.clients.get(key);
        if (!set) return;
        set.delete(res);
        if (set.size === 0) {
            this.clients.delete(key);
        }
    }

    send(userId, event, data) {
        const key = String(userId);
        const set = this.clients.get(key);
        if (!set || set.size === 0) return;

        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        for (const res of set) {
            try {
                res.write(payload);
            } catch (e) {
                this.remove(userId, res);
            }
        }
    }
}

module.exports = new SseHub();