// embed's cool logger version 2!
// i only use this because it looks nice

const colors = require('colors');

module.exports = {
    log(str) {
        console.log('➤  '.gray + colors.gray(str));
    },

    success(str) {
        console.log('✔  '.green + colors.green(str));
    },

    error(str) {
        console.log('✖  '.red + colors.red(str));
    },

    throwError(str) {
        const error = new Error();
        console.log('✖  '.red + colors.red(str + '\r\n' + error.stack));
    }
}