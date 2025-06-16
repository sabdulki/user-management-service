export default class Logger {
    static log(type: 'info' | 'warn' | 'error', message: string): void {
        const date = new Date().toLocaleTimeString();
        const colorMap: Record<string, string> = {
            info: '\x1b[32m', // Green
            warn: '\x1b[33m', // Yellow
            error: '\x1b[31m', // Red
        };
        const resetColor = '\x1b[0m';
        const color = colorMap[type] || resetColor;

        console.log(`[${date}] [${color}${type.toUpperCase()}${resetColor}]: ${message}`);
    }

    static info(message: string): void {
        this.log('info', message);
    }
    static warn(message: string): void {
        this.log('warn', message);
    }
    static error(message: string): void {
        this.log('error', message);
    }
}