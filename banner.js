const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",
    
    fg: {
        black: "\x1b[30m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
        crimson: "\x1b[38m"
    },
    bg: {
        black: "\x1b[40m",
        red: "\x1b[41m",
        green: "\x1b[42m",
        yellow: "\x1b[43m",
        blue: "\x1b[44m",
        magenta: "\x1b[45m",
        cyan: "\x1b[46m",
        white: "\x1b[47m",
        crimson: "\x1b[48m"
    }
};

const banner = `
${colors.fg.cyan}${colors.bright}
    ██╗███╗   ██╗██╗████████╗██╗ █████╗     ██████╗  ██████╗ ████████╗
    ██║████╗  ██║██║╚══██╔══╝██║██╔══██╗    ██╔══██╗██╔═══██╗╚══██╔══╝
    ██║██╔██╗ ██║██║   ██║   ██║███████║    ██████╔╝██║   ██║   ██║   
    ██║██║╚██╗██║██║   ██║   ██║██╔══██║    ██╔══██╗██║   ██║   ██║   
    ██║██║ ╚████║██║   ██║   ██║██║  ██║    ██████╔╝╚██████╔╝   ██║   
    ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝   ╚═╝╚═╝  ╚═╝    ╚═════╝  ╚═════╝    ╚═╝   
                                                                      
${colors.reset}${colors.fg.green}                       𝙅𝙄𝙐𝙎𝙃𝙄21 水龙头自动领取机器人
${colors.reset}${colors.fg.yellow}            每个钱包对应唯一IP • 自动验证码解决 • 8小时自动领取${colors.reset}

`;

const showBanner = () => {
    console.log(banner);
    console.log(`${colors.fg.cyan}===================================================================================${colors.reset}`);
    console.log(`${colors.fg.white}${colors.bright}                           启动时间: ${new Date().toLocaleString()}${colors.reset}`);
    console.log(`${colors.fg.cyan}===================================================================================${colors.reset}`);
    console.log('');
};

module.exports = { showBanner, colors }; 