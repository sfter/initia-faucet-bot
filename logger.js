const fs = require('fs');
const path = require('path');
const { colors } = require('./banner');

// 确保日志目录存在
const LOG_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR);
}

// 创建当前日期的日志文件
const getLogFile = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    return path.join(LOG_DIR, `bot_${dateStr}.log`);
};

// 添加时间戳到日志
const timestamp = () => {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
};

// 日志级别
const LOG_LEVELS = {
    INFO: { name: 'INFO', color: colors.fg.green },
    SUCCESS: { name: 'SUCCESS', color: colors.fg.green + colors.bright },
    WARN: { name: 'WARN', color: colors.fg.yellow },
    ERROR: { name: 'ERROR', color: colors.fg.red },
    DEBUG: { name: 'DEBUG', color: colors.fg.cyan }
};

// 写入日志到文件
const writeToFile = (message) => {
    // 移除颜色代码用于文件日志
    const cleanMessage = message.replace(/\x1b\[[0-9;]*m/g, '');
    fs.appendFileSync(getLogFile(), `${cleanMessage}\n`);
};

// 日志函数
const log = (message, level = LOG_LEVELS.INFO, toFile = true) => {
    const logMessage = `[${timestamp()}] [${level.name}] ${message}`;
    
    // 控制台带颜色输出
    console.log(`${level.color}${logMessage}${colors.reset}`);
    
    // 写入到文件（如果需要）
    if (toFile) {
        writeToFile(logMessage);
    }
};

// 日志方法
const logger = {
    info: (message, toFile = true) => log(message, LOG_LEVELS.INFO, toFile),
    success: (message, toFile = true) => log(message, LOG_LEVELS.SUCCESS, toFile),
    warn: (message, toFile = true) => log(message, LOG_LEVELS.WARN, toFile),
    error: (message, toFile = true) => log(message, LOG_LEVELS.ERROR, toFile),
    debug: (message, toFile = true) => log(message, LOG_LEVELS.DEBUG, toFile)
};

module.exports = logger; 