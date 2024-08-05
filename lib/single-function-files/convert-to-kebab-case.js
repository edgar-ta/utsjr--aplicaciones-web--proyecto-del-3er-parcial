/**
 * 
 * @param {string} string 
 * @returns {string}
 */
function convertToKebabCase(string) {
    return string
        .trim()
        .split(/[\-\s]/)
        .filter(substring => substring.length > 0)
        .map(substring => substring.toLowerCase())
        .join("-")
    ;
}


module.exports = convertToKebabCase;